/**
 * Gemini provider.  Lifted from the previous monolithic gemini.service.ts —
 * same SDK, same structured-output approach, but now behind the AIProvider
 * interface so the facade can place it anywhere in the chain.
 *
 * The Gemini SDK takes a vendor-specific `SchemaType` enum; we keep that
 * translation isolated to this file so the rest of the AI layer stays neutral.
 */

import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerationConfig,
  type GenerativeModel,
} from '@google/generative-ai';
import { env } from '../../config/env.js';
import { AIProviderError, type AIProvider, type BuiltPrompt, type ProviderName } from './types.js';

const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

// Gemini's responseSchema must use its own SchemaType enum, not raw JSON Schema.
// This is the only Gemini-flavoured shape in the AI layer — kept here on
// purpose so the shared schema.ts stays neutral.
const geminiResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reasoning: { type: SchemaType.STRING },
    clientName: { type: SchemaType.STRING },
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
                source: {
                  type: SchemaType.STRING,
                  enum: ['my_price', 'regional_price', 'ai_estimate'],
                },
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
  // @ts-expect-error responseSchema is accepted at runtime; SDK typings lag.
  responseSchema: geminiResponseSchema,
};

export class GeminiProvider implements AIProvider {
  name(): ProviderName {
    return 'gemini';
  }

  async healthCheck(): Promise<boolean> {
    if (!genAI) return false;
    try {
      // No standalone health endpoint — instantiate the model. If the key is
      // bad we'll find out on first real call (cheap enough to defer).
      genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
      return true;
    } catch {
      return false;
    }
  }

  async generate(prompt: BuiltPrompt, signal: AbortSignal): Promise<string> {
    if (!genAI) {
      throw new AIProviderError('gemini', 'auth', 'GEMINI_API_KEY not configured');
    }

    const model: GenerativeModel = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: prompt.staticSystem,
      generationConfig,
    });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: prompt.dynamicUser },
    ];
    for (const img of prompt.images) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }

    try {
      return await new Promise<string>((resolve, reject) => {
        if (signal.aborted) {
          return reject(new AIProviderError('gemini', 'timeout', 'Request cancelled'));
        }
        const timer = setTimeout(
          () => reject(new AIProviderError('gemini', 'timeout', 'Generation timeout')),
          env.GEMINI_REQUEST_TIMEOUT_MS,
        );
        const onAbort = () =>
          reject(new AIProviderError('gemini', 'timeout', 'Generation timeout'));
        signal.addEventListener('abort', onAbort, { once: true });

        model
          .generateContent({ contents: [{ role: 'user', parts }] })
          .then((res) => {
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
            const text = res.response.text();
            if (!text) {
              reject(
                new AIProviderError('gemini', 'malformed_response', 'Gemini returned empty content'),
              );
              return;
            }
            resolve(text);
          })
          .catch((err: unknown) => {
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
            reject(mapGeminiError(err));
          });
      });
    } catch (err: unknown) {
      if (err instanceof AIProviderError) throw err;
      throw mapGeminiError(err);
    }
  }
}

function mapGeminiError(err: unknown): AIProviderError {
  const msg = (err as Error)?.message ?? 'Gemini error';
  const lower = msg.toLowerCase();
  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate')) {
    return new AIProviderError('gemini', 'rate_limit', msg, err);
  }
  if (lower.includes('timeout') || lower.includes('deadline')) {
    return new AIProviderError('gemini', 'timeout', msg, err);
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('permission')) {
    return new AIProviderError('gemini', 'auth', msg, err);
  }
  if (lower.includes('500') || lower.includes('502') || lower.includes('503') || lower.includes('504')) {
    return new AIProviderError('gemini', 'server_error', msg, err);
  }
  if (lower.includes('econn') || lower.includes('network') || lower.includes('fetch')) {
    return new AIProviderError('gemini', 'network', msg, err);
  }
  return new AIProviderError('gemini', 'unknown', msg, err);
}
