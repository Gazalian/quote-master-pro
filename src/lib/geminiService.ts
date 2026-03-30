import { GoogleGenerativeAI } from '@google/generative-ai';
import { Quote, QuoteGroup, QuoteItem } from '@/types/quote';
import { getPricingForTrade, formatNGN } from './nigerianPricing';

// Initialize Gemini AI
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || 'placeholder');

// Types
export interface GeminiQuoteRequest {
  userMessage: string;
  images?: File[];
  conversationHistory?: ConversationMessage[];
  userTrade?: string;
  userLocation?: string;
  priceLogEntries?: any[]; // User's saved prices from price log
}

export interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface GeminiQuoteResponse {
  success: boolean;
  quote?: Partial<Quote>;
  clarifyingQuestions?: string[];
  confidence: 'high' | 'medium' | 'low';
  error?: string;
  reasoning?: string; // AI's explanation for the quote
}

// Convert image file to base64 for Gemini
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Build comprehensive system prompt
function buildSystemPrompt(trade: string = 'general', location: string = 'Lagos'): string {
  const pricing = getPricingForTrade(trade);

  return `You are OtoQuote AI, Nigeria's leading digital assistant for tradespeople.

YOUR ROLE:
You help Nigerian ${trade}s (and other tradespeople) create professional quotations.
You convert informal job descriptions into structured, professional quotes.

YOUR EXPERTISE:
- Deep understanding of Nigerian construction and trade practices
- Current ${location} market pricing (realistic, not inflated)
- Common materials and labour costs in Nigeria
- Professional quotation formatting

NIGERIAN CONTEXT (CRITICAL):
- Currency: ALWAYS use ₦ (Nigerian Naira)
- Market Location: ${location} (adjust prices accordingly)
- Include these categories: Materials, Labour, Transportation, Miscellaneous
- Labour is ALWAYS separate from materials
- Transportation costs for bulky/heavy materials
- Miscellaneous for unforeseen costs (typically 5-10%)
- VAT is NOT typically included in artisan quotes

PRICING INTELLIGENCE:
${trade === 'electrician' || trade === 'electrical' ? `
Sample Electrical Prices (Lagos market):
- 16mm cable: ₦18,000-₦25,000 per roll
- Socket (13A): ₦500-₦1,200 each
- MCB breaker: ₦2,000-₦4,000 each
- Bedroom wiring labour: ₦40,000-₦80,000 per room
- Installation per point: ₦2,000-₦5,000
` : ''}

${trade === 'plumber' || trade === 'plumbing' ? `
Sample Plumbing Prices (Lagos market):
- 4-inch PVC pipe: ₦4,000-₦7,000 per length
- Toilet WC: ₦35,000-₦120,000 (standard to premium)
- Kitchen sink: ₦15,000-₦60,000
- Bathroom installation labour: ₦60,000-₦150,000
` : ''}

${trade === 'builder' || trade === 'building' || trade === 'construction' ? `
Sample Building Prices (Lagos market):
- Cement (Dangote): ₦5,500-₦7,500 per bag
- Sharp sand: ₦25,000-₦45,000 per trip
- Granite: ₦30,000-₦55,000 per trip
- 9-inch blocks: ₦450-₦650 each
- Bricklaying labour: ₦1,500-₦2,800 per sqm
- Plastering labour: ₦2,000-₦3,500 per sqm
` : ''}

${trade === 'painter' || trade === 'painting' ? `
Sample Painting Prices (Lagos market):
- Emulsion paint (standard): ₦15,000-₦25,000 per bucket
- Gloss paint: ₦10,000-₦20,000 per bucket
- Putty: ₦4,000-₦8,000 per bucket
- Painting labour per room: ₦25,000-₦60,000
` : ''}

LANGUAGE UNDERSTANDING:
You must understand Nigerian English and informal descriptions:
- "I wan wire house" = electrical wiring installation
- "Fix POP" = install POP ceiling
- "Change over" = changeover switch installation
- "3-bedroom flat" = apartment with 3 bedrooms

OUTPUT REQUIREMENTS:
1. Return ONLY valid JSON (no markdown, no explanations outside JSON)
2. Use this exact structure:
{
  "reasoning": "2-3 sentences explaining your understanding of the job and approach to pricing",
  "projectTitle": "Clear, professional title",
  "confidence": "high" | "medium" | "low",
  "clarifyingQuestions": ["question1", "question2"] OR null,
  "categories": [
    {
      "id": "unique-id",
      "name": "Materials" | "Labour" | "Transportation" | "Miscellaneous",
      "items": [
        {
          "id": "unique-item-id",
          "name": "Specific item name",
          "description": "Optional details",
          "quantity": number,
          "unit": "meters" | "pieces" | "bags" | "rolls" | "sqm" | "rooms" | etc,
          "unitPrice": number (in Naira),
          "total": number (quantity * unitPrice),
          "source": "ai_estimate"
        }
      ]
    }
  ],
  "grandTotal": number (sum of all category totals),
  "estimatedDuration": "X days" OR null,
  "notes": ["Important note 1", "Important note 2"] OR null
}

QUALITY STANDARDS:
- Be SPECIFIC with item names (not "cables" but "16mm Single Core Cable")
- Include realistic quantities
- Use appropriate units (rolls, meters, pieces, bags, sqm, rooms)
- Price must be realistic for ${location} market
- NEVER use unrealistic prices (too high or too low)
- Include labour for installation/workmanship
- Add transportation if materials are heavy/bulky
- Add miscellaneous for contingencies

CONFIDENCE SCORING:
- "high": Clear job description, can estimate accurately
- "medium": Some details missing but can provide reasonable estimate
- "low": Very vague, need clarifying questions

CLARIFYING QUESTIONS:
If confidence is "low" or "medium", include 2-4 specific questions to improve accuracy.
Examples:
- "How many rooms need wiring?"
- "Is this new construction or renovation?"
- "Do you have the dimensions?"
- "What quality of materials do you prefer (standard or premium)?"

IMPORTANT: If input is very vague but you can make reasonable assumptions, provide a "medium" confidence quote with notes explaining assumptions. Only mark as "low" if truly unable to estimate.`;
}

// Build user prompt from conversation
function buildUserPrompt(request: GeminiQuoteRequest): string {
  let prompt = `Generate a professional quotation for this job:\n\n`;

  // Add conversation history if available
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    prompt += `CONVERSATION HISTORY:\n`;
    request.conversationHistory.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}\n`;
    });
    prompt += `\n`;
  }

  // Add current message
  prompt += `CURRENT REQUEST:\n${request.userMessage}\n\n`;

  // Add image context if images provided
  if (request.images && request.images.length > 0) {
    prompt += `IMAGES PROVIDED: ${request.images.length} image(s) attached. `;
    prompt += `Analyze these images to understand the scope, space, current condition, and work required.\n\n`;
  }

  // Add price log entries if available (PRIORITY: Use these prices first!)
  if (request.priceLogEntries && request.priceLogEntries.length > 0) {
    prompt += `USER'S PRICE LOG (USE THESE PRICES FIRST - HIGHEST PRIORITY):\n`;
    prompt += `The user has saved the following items with their preferred prices. ALWAYS use these prices when the item is mentioned:\n\n`;
    request.priceLogEntries.forEach(entry => {
      prompt += `- ${entry.name}: ₦${entry.unitPrice.toLocaleString()} per ${entry.unit}`;
      if (entry.category) prompt += ` (Category: ${entry.category})`;
      if (entry.supplier) prompt += ` (Supplier: ${entry.supplier})`;
      prompt += `\n`;
    });
    prompt += `\nIMPORTANT: If any items in the quote match these saved items, use the EXACT prices from the price log. Only estimate prices for items NOT in the price log.\n\n`;
  }

  prompt += `INSTRUCTIONS:\n`;
  prompt += `1. First, provide a brief explanation (2-3 sentences) of your understanding of the job and your approach to pricing it.\n`;
  prompt += `2. Then generate the quotation following the JSON structure specified in the system prompt.\n`;
  prompt += `3. Include both "reasoning" and "quote" in your response.\n`;

  return prompt;
}

// Extract clean JSON string from AI response (strips markdown fences, finds JSON object)
function extractJsonString(rawResponse: string): string {
  let cleanJson = rawResponse.trim();

  // Strategy 1: Extract from ```json ... ``` code blocks
  const jsonBlockMatch = cleanJson.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) return jsonBlockMatch[1].trim();

  // Strategy 2: Extract from generic ``` ... ``` code blocks
  const codeBlockMatch = cleanJson.match(/```\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Strategy 3: If response was truncated (no closing ```), grab everything after ```json
  const truncatedJsonMatch = cleanJson.match(/```json\s*([\s\S]+)$/);
  if (truncatedJsonMatch) return truncatedJsonMatch[1].trim();

  // Strategy 4: Find the outermost JSON object { ... }
  const firstBrace = cleanJson.indexOf('{');
  const lastBrace = cleanJson.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleanJson.substring(firstBrace, lastBrace + 1);
  }

  // Strategy 5: Just find { and take everything from there (may be truncated)
  if (firstBrace !== -1) {
    return cleanJson.substring(firstBrace);
  }

  return cleanJson;
}

// Attempt to repair truncated JSON by closing open brackets and braces
function repairTruncatedJson(jsonStr: string): string {
  // Remove any trailing incomplete key-value pair (e.g., ends with `"name": ` or `"name": "partial`)
  let repaired = jsonStr.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, '');
  // Remove trailing comma
  repaired = repaired.replace(/,\s*$/, '');

  // Count open vs close brackets/braces
  let openBraces = 0, openBrackets = 0;
  let inString = false, escape = false;
  for (const ch of repaired) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    if (ch === '}') openBraces--;
    if (ch === '[') openBrackets++;
    if (ch === ']') openBrackets--;
  }

  // Close any open brackets/braces
  while (openBrackets > 0) { repaired += ']'; openBrackets--; }
  while (openBraces > 0) { repaired += '}'; openBraces--; }

  return repaired;
}

// Transform parsed JSON into our Quote structure
function buildQuoteFromParsed(parsed: any, userId: string): { quote: Partial<Quote>; reasoning?: string; confidence?: string; clarifyingQuestions?: string[] } {
  // Filter out categories with valid items only
  const validCategories = (parsed.categories || []).filter(
    (cat: any) => cat && cat.items && Array.isArray(cat.items) && cat.items.length > 0
  );

  const groups: QuoteGroup[] = validCategories.map((cat: any) => ({
    id: cat.id || `group-${Date.now()}-${Math.random()}`,
    name: cat.name || 'Unnamed Category',
    items: cat.items
      .filter((item: any) => item && item.name) // skip incomplete items
      .map((item: any) => ({
        id: item.id || `item-${Date.now()}-${Math.random()}`,
        name: item.name,
        qty: item.quantity || 1,
        unit: item.unit || 'unit',
        unitPrice: item.unitPrice || 0,
        total: item.total || ((item.quantity || 1) * (item.unitPrice || 0)),
        source: item.source || 'ai_estimate'
      }))
  }));

  // Recalculate grand total from whatever categories we have
  const calculatedTotal = groups.reduce(
    (sum, g) => sum + g.items.reduce((s: number, i: any) => s + (i.total || 0), 0), 0
  );

  const quote: Partial<Quote> = {
    id: `draft-${Date.now()}`,
    user_id: userId,
    ref: `AI-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    client: parsed.clientName || 'Client Name',
    description: parsed.projectTitle || 'AI Generated Quotation',
    groups,
    grandTotal: parsed.grandTotal || calculatedTotal,
    status: 'APPROVED',
    templateStyle: 'modern',
    isDraft: true,
    version: 1
  };

  return {
    quote,
    reasoning: parsed.reasoning,
    confidence: parsed.confidence,
    clarifyingQuestions: parsed.clarifyingQuestions
  };
}

// Parse Gemini response and create Quote object
function parseGeminiResponse(jsonResponse: string, userId: string): { quote: Partial<Quote>; reasoning?: string; confidence?: string; clarifyingQuestions?: string[] } {
  const cleanJson = extractJsonString(jsonResponse);
  console.log('[GeminiService] Cleaned JSON (first 200 chars):', cleanJson.substring(0, 200));
  console.log('[GeminiService] Cleaned JSON length:', cleanJson.length);

  // Attempt 1: Direct parse
  try {
    const parsed = JSON.parse(cleanJson);
    return buildQuoteFromParsed(parsed, userId);
  } catch (directError) {
    console.warn('[GeminiService] Direct JSON parse failed, attempting repair...', (directError as Error).message);
  }

  // Attempt 2: Repair truncated JSON and retry
  try {
    const repaired = repairTruncatedJson(cleanJson);
    console.log('[GeminiService] Repaired JSON (last 100 chars):', repaired.substring(repaired.length - 100));
    const parsed = JSON.parse(repaired);
    console.log('[GeminiService] Repair successful! Categories found:', parsed.categories?.length || 0);
    return buildQuoteFromParsed(parsed, userId);
  } catch (repairError) {
    console.error('[GeminiService] JSON repair also failed:', (repairError as Error).message);
    console.error('[GeminiService] Raw response (first 500 chars):', jsonResponse.substring(0, 500));
    throw new Error('Failed to parse AI response (response may have been truncated). Retrying...');
  }
}

// Fallback model chain — each has its own separate free-tier quota
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const MAX_RETRIES = 2; // retries per model before falling back

// Helper: wait for a given number of milliseconds
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: check if an error is a rate-limit (429) error
function isRateLimitError(error: any): boolean {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('429') || msg.includes('quota') || msg.includes('rate') || msg.includes('too many requests');
}

// Helper: check if an error is a JSON parse error (truncated response)
function isParseError(error: any): boolean {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('failed to parse') || msg.includes('json') || msg.includes('truncated');
}

// Extract suggested retry delay from Gemini error message (seconds)
function extractRetryDelay(error: any): number {
  const msg = error?.message || '';
  const match = msg.match(/retry\s+in\s+([\d.]+)s/i);
  if (match) return Math.ceil(parseFloat(match[1]));
  return 15; // default 15 seconds
}

// Main function to generate quote using Gemini
export async function generateQuoteWithGemini(
  request: GeminiQuoteRequest,
  userId: string
): Promise<GeminiQuoteResponse> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'placeholder') {
    return {
      success: false,
      error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
      confidence: 'low'
    };
  }

  const hasImages = request.images && request.images.length > 0;

  // Build prompts (same for every model attempt)
  const systemPrompt = buildSystemPrompt(request.userTrade || 'general', request.userLocation || 'Lagos');
  const userPrompt = buildUserPrompt(request);

  // Prepare content parts
  const parts: any[] = [
    { text: systemPrompt },
    { text: userPrompt }
  ];

  if (request.images && request.images.length > 0) {
    for (const image of request.images) {
      const imagePart = await fileToGenerativePart(image);
      parts.push(imagePart);
    }
  }

  // Try each model in the fallback chain
  for (let modelIdx = 0; modelIdx < MODEL_CHAIN.length; modelIdx++) {
    const modelName = MODEL_CHAIN[modelIdx];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[GeminiService] Trying model: ${modelName} (attempt ${attempt + 1}/${MAX_RETRIES + 1}), hasImages: ${hasImages}`);

        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 65536,
            topP: 0.95,
            topK: 40,
          }
        });

        const response = await result.response;
        const text = response.text();

        console.log(`[GeminiService] ${modelName} raw response (first 300 chars):`, text.substring(0, 300));

        // Parse response
        const parsed = parseGeminiResponse(text, userId);

        // Determine confidence
        let confidence: 'high' | 'medium' | 'low' = (parsed.confidence as any) || 'high';
        if (parsed.quote.grandTotal && parsed.quote.grandTotal < 10000) {
          confidence = 'medium';
        }
        if (!parsed.quote.groups || parsed.quote.groups.length === 0) {
          confidence = 'low';
        }

        return {
          success: true,
          quote: parsed.quote,
          reasoning: parsed.reasoning,
          confidence,
          clarifyingQuestions: parsed.clarifyingQuestions || (confidence === 'low' ? [
            'Could you provide more details about the scope of work?',
            'What are the dimensions or size of the space?',
            'Do you prefer standard or premium quality materials?'
          ] : undefined)
        };

      } catch (error: any) {
        console.warn(`[GeminiService] ${modelName} attempt ${attempt + 1} failed:`, error.message?.substring(0, 200));

        const isRetryable = isRateLimitError(error) || isParseError(error);

        if (isRetryable) {
          if (attempt < MAX_RETRIES) {
            const delaySec = isRateLimitError(error) ? extractRetryDelay(error) : 2;
            console.log(`[GeminiService] Retryable error. Waiting ${delaySec}s before retry...`);
            await sleep(delaySec * 1000);
            continue; // retry same model
          }
          // Fall through to next model in the chain
          console.log(`[GeminiService] ${modelName} retries exhausted, falling back to next model...`);
          break; // break retry loop, continue model loop
        }

        // Non-retryable error — report it
        console.error('[GeminiService] Non-retryable error:', error);
        return {
          success: false,
          error: error.message || 'Failed to generate quotation. Please try again.',
          confidence: 'low'
        };
      }
    }
  }

  // All models exhausted
  return {
    success: false,
    error: 'All AI models are currently at capacity. Please wait a few minutes and try again, or check your API billing at https://ai.google.dev.',
    confidence: 'low'
  };
}

// Helper function to test Gemini connection
export async function testGeminiConnection(): Promise<boolean> {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'placeholder') {
      console.error('Gemini API key not configured');
      return false;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    console.log('Gemini connection test:', response.text());
    return true;
  } catch (error) {
    console.error('Gemini connection failed:', error);
    return false;
  }
}
