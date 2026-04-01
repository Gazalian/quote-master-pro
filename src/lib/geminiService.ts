import { GoogleGenerativeAI } from '@google/generative-ai';
import { Quote, QuoteGroup } from '@/types/quote';
import { getPricingForTrade } from './nigerianPricing';
import type { RegionalPriceEntry } from './regionalPriceAPI';
import { buildPreferencesPrompt, type UserPreferences } from './behaviorEngine';

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
  priceLogEntries?: any[];         // User's saved prices (highest priority)
  regionalPrices?: RegionalPriceEntry[]; // Regional consensus prices (second priority)
  userPreferences?: UserPreferences | null; // Learned behavior rules (prepended to system prompt)
  pendingQuestions?: string[];             // Unanswered questions from previous AI turn (queue logic)
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
function buildSystemPrompt(
  trade: string = 'general',
  location: string = 'Nigeria',
  regionalPrices: RegionalPriceEntry[] = [],
  userPreferences: UserPreferences | null = null
): string {
  getPricingForTrade(trade); // loads trade-specific pricing context

  // ── Regional consensus block ─────────────────────────────────────────
  const consensusPrices = regionalPrices.filter(p => p.isConsensus);
  const otherRegional   = regionalPrices.filter(p => !p.isConsensus);

  const regionalBlock = regionalPrices.length > 0 ? `
REGIONAL MARKET CONSENSUS — ${location.toUpperCase()} (SECOND-HIGHEST PRIORITY):
The following prices have been verified by real tradespeople operating in ${location}.
Use these when the user has no personal price saved for an item.
When you use one of these prices, set its "source" field to "regional_price".

VERIFIED CONSENSUS PRICES (≥5 tradespeople agree, high confidence):
${consensusPrices.length > 0
  ? consensusPrices.map(p =>
      `  - ${p.materialName}: ₦${p.medianPriceNgn.toLocaleString('en-NG')} (${p.contributorCount} contributors)`
    ).join('\n')
  : '  (none yet for this state)'}

INDICATIVE REGIONAL PRICES (fewer contributors, use with care):
${otherRegional.length > 0
  ? otherRegional.map(p =>
      `  - ${p.materialName}: ₦${p.medianPriceNgn.toLocaleString('en-NG')} (${p.contributorCount} contributor${p.contributorCount !== 1 ? 's' : ''})`
    ).join('\n')
  : '  (none yet for this state)'}
` : '';

  const preferencesBlock = buildPreferencesPrompt(userPreferences);

  return `${preferencesBlock}You are OtoQuote AI — Nigeria's expert quotation assistant for tradespeople.

PERSONA:
Sound like a knowledgeable senior tradesperson or Oga foreman. Be direct, confident, and brief.
Good: "Priced this as a standard 3-bed rewire. Check the conduit count matches your layout."
Bad: "Thank you for your request! I would be happy to assist you with a comprehensive quotation..."

════════════════════════════════════════
ACTION-FIRST RULE (NON-NEGOTIABLE)
════════════════════════════════════════
1. ALWAYS generate a complete quotation — NEVER withhold a quote to ask questions first.
2. Fill every gap using your Nigerian construction knowledge base below.
3. Tag all assumed values with source = "ai_estimate" so the user knows what to verify.
4. AFTER generating, you MAY include at most 2 follow-up questions in clarifyingQuestions
   that would meaningfully improve accuracy. These are suggestions, not blockers.
5. Never ask questions already answered in the conversation history.
6. A "medium" confidence quote with expert assumptions is ALWAYS better than asking.
7. NEVER return an empty categories array. Always include at least Materials + Labour.

════════════════════════════════════════
NIGERIAN CONSTRUCTION KNOWLEDGE BASE
════════════════════════════════════════
Use these standard specs to fill gaps when the user does not specify:

3-BEDROOM FLAT — default specs:
  Electrical wiring (new construction):
    - 32–38 wiring points (lighting + sockets combined)
    - Cable: 3 coils 2.5mm single-core (phase), 2 coils 1.5mm (neutral/earth), 1 coil 6mm (incoming)
    - Conduit: 8 bundles 25mm PVC conduit (30 lengths/bundle)
    - Fittings: 6 conduit boxes, 4 junction boxes, 30 conduit saddles
    - DB: 1× 8-way distribution board (MCB type)
    - Labour: 3 electricians × 6 days

  Plumbing (full wet works):
    - Cold water: 15 lengths 3/4-inch UPVC pipe, 10 lengths 1/2-inch UPVC
    - Drainage: 8 lengths 4-inch PVC pipe, 4 lengths 3-inch PVC
    - Fittings: 3 WC suites, 3 wash hand basins, 1 kitchen sink
    - Labour: 2 plumbers × 6 days

  Block-work / Masonry:
    - Blocks: 3,200 × 6-inch sandcrete blocks
    - Cement: 300 bags (Dangote/BUA), Sharp sand: 8 trips, Plaster sand: 5 trips
    - Labour: 3 masons + 2 labourers × 15 days

STANDARD DAILY LABOUR RATES (${location} baseline, ±20% by state):
  Skilled trade (electrician, plumber, welder): ₦10,000–₦18,000/day
  Semi-skilled (tiler, carpenter, painter): ₦7,000–₦12,000/day
  Labourer / helper: ₦4,000–₦7,000/day
  Foreman / site supervisor: ₦15,000–₦25,000/day

MATERIAL NAMING — use these exact Nigerian market terms:
  "Bundles of conduit"  = 30 × PVC conduit lengths per bundle (specify 20mm or 25mm)
  "Coils of wire/cable" = 100 m per coil (specify 1.5mm, 2.5mm, 4mm, 6mm, 10mm, 16mm)
  "Sharp sand"          = coarse river sand, sold per tipper trip
  "Plaster sand"        = fine sand for rendering, sold per tipper trip
  "Sandcrete blocks"    = hollow concrete blocks (4-inch, 6-inch, or 9-inch)
  "Dangote/BUA cement"  = 50 kg bag
  "PVC pipe"            = specify diameter (2", 3", 4") and use (drainage vs supply)
  "UPVC pipe"           = pressure-rated supply pipe

INFORMAL LANGUAGE MAPPING:
  "Wire house" / "I wan wire"  → electrical wiring installation
  "Fix POP"                    → POP (Plaster of Paris) ceiling installation
  "Changeover" / "change over" → changeover/transfer switch
  "Throw current"              → connect to mains / energise circuit
  "Fill block" / "lay block"   → sandcrete block-laying
  "Render" / "plaster"         → wall rendering/plastering
  "Skim" / "screeding"         → floor screed

════════════════════════════════════════
PRICING HIERARCHY (strict order)
════════════════════════════════════════
1. USER'S PERSONAL PRICE LOG — injected in user prompt (HIGHEST PRIORITY, use exact).
2. REGIONAL MARKET CONSENSUS — injected below, use when no personal price exists,
   set source = "regional_price".
3. NIGERIAN NATIONAL BASELINE — your knowledge, fallback only, set source = "ai_estimate".
${regionalBlock}
NATIONAL BASELINE ESTIMATES (${location} region):
${trade === 'electrician' || trade === 'electrical' ? `
  16mm single-core cable (100m coil): ₦18,000–₦26,000
  10mm single-core cable (100m coil): ₦12,000–₦18,000
  6mm  single-core cable (100m coil): ₦8,500–₦13,000
  4mm  single-core cable (100m coil): ₦6,000–₦9,500
  2.5mm single-core cable (100m coil): ₦4,500–₦7,000
  1.5mm single-core cable (100m coil): ₦3,000–₦5,000
  25mm PVC conduit (bundle/30 lengths): ₦12,000–₦18,000
  20mm PVC conduit (bundle/30 lengths): ₦9,000–₦14,000
  13A socket outlet: ₦800–₦1,800 each
  1-gang switch: ₦400–₦1,000 each
  MCB breaker (10A–32A): ₦2,000–₦4,500 each
  8-way distribution board: ₦25,000–₦45,000
` : ''}
${trade === 'plumber' || trade === 'plumbing' ? `
  4-inch PVC drainage pipe (length): ₦4,500–₦7,500
  3-inch PVC pipe (length): ₦3,000–₦5,500
  3/4-inch UPVC pressure pipe (length): ₦1,200–₦2,200
  WC suite (standard): ₦45,000–₦90,000
  Wash hand basin: ₦18,000–₦45,000
  Kitchen sink (stainless): ₦18,000–₦55,000
  Shower mixer tap: ₦12,000–₦35,000
` : ''}
${trade === 'builder' || trade === 'building' || trade === 'construction' ? `
  Dangote/BUA cement (50kg bag): ₦6,000–₦8,500
  Sharp sand (tipper trip ~5 tons): ₦28,000–₦50,000
  Granite/gravel (tipper trip): ₦35,000–₦60,000
  6-inch sandcrete block (each): ₦550–₦800
  9-inch sandcrete block (each): ₦700–₦1,000
  Bricklaying labour (per sqm): ₦1,800–₦3,200
  Plastering labour (per sqm): ₦2,200–₦3,800
` : ''}
${trade === 'painter' || trade === 'painting' ? `
  Emulsion paint 20L (standard): ₦16,000–₦28,000
  Emulsion paint 20L (premium Dulux/Berger): ₦35,000–₦60,000
  Gloss/oil paint 4L: ₦8,000–₦16,000
  Wall putty 20kg: ₦5,000–₦9,000
  Painting labour per room (walls + ceiling): ₦25,000–₦55,000
` : ''}

════════════════════════════════════════
NIGERIAN CONTEXT
════════════════════════════════════════
Currency: ALWAYS ₦ (Naira). Market: ${location}.
Categories: Materials, Labour, Transportation (heavy/bulk items), Miscellaneous (5–8% contingency).
Labour is ALWAYS a separate category — never bundle with materials.
VAT is NOT included in artisan quotes.

════════════════════════════════════════
JSON OUTPUT — return ONLY this, no markdown
════════════════════════════════════════
{
  "reasoning": "1–2 direct sentences: what you understood and what assumptions you made.",
  "projectTitle": "Clear professional title",
  "confidence": "high" | "medium" | "low",
  "clarifyingQuestions": ["at most 2 follow-up questions to improve the quote"] | null,
  "categories": [
    {
      "id": "unique-id",
      "name": "Materials" | "Labour" | "Transportation" | "Miscellaneous",
      "items": [
        {
          "id": "unique-item-id",
          "name": "Specific item (e.g. '2.5mm Single-Core Cable, 100m Coil')",
          "quantity": number,
          "unit": "coils" | "bundles" | "bags" | "pieces" | "lengths" | "sqm" | "trips" | "days" | etc,
          "unitPrice": number,
          "total": number,
          "source": "my_price" | "regional_price" | "ai_estimate",
          "regionName": "State — only when source = regional_price"
        }
      ]
    }
  ],
  "grandTotal": number,
  "estimatedDuration": "X days" | null,
  "notes": ["Assumption or caveat the tradesperson should know"] | null
}

RULES:
  - categories must NEVER be empty — always include at least Materials + Labour
  - Every item must have all fields populated (no nulls, no zeros unless genuinely zero)
  - total = quantity × unitPrice exactly
  - grandTotal = sum of all item totals exactly
  - source = "my_price" only if matched user price log injected in prompt
  - source = "regional_price" only if matched regional consensus above; also set regionName = "${location}"
  - source = "ai_estimate" for everything else
  - confidence "low" is ONLY for completely unintelligible input — still generate a quote`;
}

// Build user prompt from conversation
function buildUserPrompt(request: GeminiQuoteRequest): string {
  let prompt = `Generate a professional quotation now.\n\n`;

  // Conversation history (provides context for follow-up turns)
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    prompt += `CONVERSATION HISTORY:\n`;
    request.conversationHistory.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}\n`;
    });
    prompt += `\n`;
  }

  prompt += `CURRENT REQUEST:\n${request.userMessage}\n\n`;

  if (request.images && request.images.length > 0) {
    prompt += `IMAGES: ${request.images.length} image(s) attached — analyse them for scope, space, and condition.\n\n`;
  }

  // Personal price log — highest priority
  if (request.priceLogEntries && request.priceLogEntries.length > 0) {
    prompt += `USER'S PRICE LOG (HIGHEST PRIORITY — use these exact prices):\n`;
    request.priceLogEntries.forEach(entry => {
      prompt += `  - ${entry.name}: ₦${entry.unitPrice.toLocaleString()} per ${entry.unit}`;
      if (entry.category) prompt += ` [${entry.category}]`;
      if (entry.supplier) prompt += ` (${entry.supplier})`;
      prompt += `\n`;
    });
    prompt += `\n`;
  }

  // Queue logic: re-surface unanswered questions from the previous turn
  if (request.pendingQuestions && request.pendingQuestions.length > 0) {
    prompt += `PENDING QUESTIONS FROM PREVIOUS TURN:\n`;
    prompt += `Check the conversation above to see if the customer has now answered these.\n`;
    request.pendingQuestions.forEach((q, i) => {
      prompt += `  ${i + 1}. ${q}\n`;
    });
    prompt += `In your clarifyingQuestions field, re-ask ONLY the still-unanswered ones (max 2).\n`;
    prompt += `In your reasoning field, acknowledge any answers you found.\n\n`;
  }

  prompt += `ACTION: Generate the complete quotation now. Use Nigerian construction knowledge to fill any gaps.\n`;

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
        source: item.source || 'ai_estimate',
        ...(item.regionName ? { regionName: item.regionName } : {}),
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
  const systemPrompt = buildSystemPrompt(
    request.userTrade    || 'general',
    request.userLocation || 'Nigeria',
    request.regionalPrices || [],
    request.userPreferences ?? null
  );
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
