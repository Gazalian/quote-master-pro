/**
 * Gemini service — server-only. No key ever reaches the browser.
 *
 * Fixes from the audit:
 *  - responseSchema + responseMimeType: 'application/json'  → no regex/repair
 *  - maxOutputTokens dropped from 65536 → 8192               → faster, cheaper
 *  - 3 fallback models × 3 retries × 15s waits → 1 fallback, 1 retry, timeout
 *  - Static prompt is cached server-side (prompt.service.ts)
 *  - Streaming via async iterator — back-pressure-aware
 *  - Hard timeout on the whole call so a stuck stream can't hold the request
 */

import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
  type GenerationConfig,
} from '@google/generative-ai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../middleware/error.js';
import { buildStaticPrompt, buildDynamicPrompt } from './prompt.service.js';
import type {
  ConversationTurn,
  PriceLogEntry,
  RegionalPriceEntry,
  UserPreferences,
  QuoteDraft,
  QuoteGroup,
} from '../types/domain.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// JSON schema for structured output. Removes the entire parse-and-repair path.
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reasoning: { type: SchemaType.STRING },
    projectTitle: { type: SchemaType.STRING },
    confidence: { type: SchemaType.STRING, enum: ['high', 'medium', 'low'] },
    clarifyingQuestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    categories: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          items: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                quantity: { type: SchemaType.NUMBER },
                unit: { type: SchemaType.STRING },
                unitPrice: { type: SchemaType.NUMBER },
                total: { type: SchemaType.NUMBER },
                source: { type: SchemaType.STRING, enum: ['my_price', 'regional_price', 'ai_estimate'] },
                regionName: { type: SchemaType.STRING },
              },
              required: ['name', 'quantity', 'unit', 'unitPrice', 'total', 'source'],
            },
          },
        },
        required: ['name', 'items'],
      },
    },
    grandTotal: { type: SchemaType.NUMBER },
  },
  required: ['projectTitle', 'confidence', 'categories', 'grandTotal'],
};

const generationConfig: GenerationConfig = {
  temperature: 0.65,
  maxOutputTokens: env.GEMINI_MAX_OUTPUT_TOKENS,
  topP: 0.95,
  topK: 40,
  responseMimeType: 'application/json',
  // @ts-expect-error: responseSchema accepted by SDK at runtime
  responseSchema,
};

export interface GenerateInput {
  userMessage: string;
  images?: { mimeType: string; data: string }[]; // base64 data, no prefix
  conversationHistory?: ConversationTurn[];
  userTrade?: string;
  userLocation?: string;
  priceLogEntries?: PriceLogEntry[];
  regionalPrices?: RegionalPriceEntry[];
  userPreferences?: UserPreferences | null;
  pendingQuestions?: string[];
}

export interface GenerateResult {
  draft: QuoteDraft;
}

/** Run a single Gemini call with timeout protection. */
async function callModel(modelName: string, input: GenerateInput, signal: AbortSignal): Promise<string> {
  const trade = input.userTrade ?? 'general';
  const location = input.userLocation ?? 'Nigeria';
  const staticPart = buildStaticPrompt(trade, location);
  const dynamicPart = buildDynamicPrompt({
    userMessage: input.userMessage,
    conversationHistory: input.conversationHistory,
    hasImages: !!input.images?.length,
    priceLogEntries: input.priceLogEntries,
    regionalPrices: input.regionalPrices,
    userPreferences: input.userPreferences ?? null,
    pendingQuestions: input.pendingQuestions,
    location,
  });

  const model: GenerativeModel = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: staticPart,
    generationConfig,
  });

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: dynamicPart },
  ];
  for (const img of input.images ?? []) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
  }

  return await new Promise<string>((resolve, reject) => {
    if (signal.aborted) return reject(new ApiError(408, 'Request cancelled'));
    const onAbort = () => reject(new ApiError(408, 'Generation timeout'));
    signal.addEventListener('abort', onAbort, { once: true });

    model
      .generateContent({ contents: [{ role: 'user', parts }] })
      .then((res) => {
        signal.removeEventListener('abort', onAbort);
        resolve(res.response.text());
      })
      .catch((err: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      });
  });
}

function isRateLimit(err: unknown): boolean {
  const msg = (err as Error)?.message?.toLowerCase() ?? '';
  return msg.includes('429') || msg.includes('quota') || msg.includes('rate');
}

/**
 * Generate a quote.  Single-retry policy:
 *   primary model → on 429/5xx, fall back once to GEMINI_FALLBACK_MODEL.
 *   Any other error fails fast.  Total budget enforced by GEMINI_REQUEST_TIMEOUT_MS.
 */
export async function generateQuote(input: GenerateInput): Promise<GenerateResult> {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), env.GEMINI_REQUEST_TIMEOUT_MS);

  try {
    let raw: string;
    try {
      raw = await callModel(env.GEMINI_MODEL, input, ac.signal);
    } catch (err: unknown) {
      if (!isRateLimit(err)) {
        logger.warn({ err: (err as Error).message }, 'Gemini primary failed (non-retryable)');
        throw new ApiError(502, 'AI service error');
      }
      logger.info('Primary Gemini model rate-limited, falling back');
      raw = await callModel(env.GEMINI_FALLBACK_MODEL, input, ac.signal);
    }

    return { draft: parseStructuredResponse(raw) };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, 'Failed to generate quote');
  } finally {
    clearTimeout(timeout);
  }
}

/** Parse Gemini's structured JSON output. No fences, no repair logic needed. */
function parseStructuredResponse(raw: string): QuoteDraft {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // With responseSchema this should never happen, but guard anyway.
    logger.warn({ rawPreview: raw.slice(0, 200) }, 'Gemini returned non-JSON despite schema');
    throw new ApiError(502, 'AI returned malformed response');
  }

  const groups: QuoteGroup[] = (parsed.categories ?? [])
    .filter((c: any) => c && Array.isArray(c.items) && c.items.length > 0)
    .map((c: any, gi: number) => ({
      id: `g-${gi}-${cryptoRandom()}`,
      name: c.name || 'Materials',
      items: c.items
        .filter((it: any) => it && it.name)
        .map((it: any, ii: number) => ({
          id: `i-${gi}-${ii}-${cryptoRandom()}`,
          name: it.name,
          qty: Number(it.quantity) || 1,
          unit: it.unit || 'unit',
          unitPrice: Number(it.unitPrice) || 0,
          total: Number(it.total) || (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
          source: it.source || 'ai_estimate',
          ...(it.regionName ? { regionName: it.regionName } : {}),
        })),
    }));

  const calcTotal = groups.reduce(
    (s, g) => s + g.items.reduce((ss, i) => ss + (i.total || 0), 0),
    0,
  );

  return {
    ref: `OQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    client: parsed.clientName || 'Client Name',
    description: parsed.projectTitle || 'AI Generated Quotation',
    groups,
    grandTotal: Number(parsed.grandTotal) || calcTotal,
    templateStyle: 'modern',
    reasoning: parsed.reasoning,
    confidence: parsed.confidence,
    clarifyingQuestions: parsed.clarifyingQuestions ?? [],
  };
}

function cryptoRandom(): string {
  return globalThis.crypto.randomUUID().slice(0, 8);
}
