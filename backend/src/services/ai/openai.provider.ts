/**
 * OpenAI provider. Uses the Chat Completions API with JSON-schema response
 * formatting. Shared validation in parse.ts is still authoritative; malformed
 * or empty responses fail over to Gemini.
 *
 * Model: gpt-4o-mini (default).  Why:
 *   - Native Structured Outputs with strict JSON schema validation
 *   - Vision support (image_url with base64 data URLs)
 *   - p50 latency ~1–2 s, comparable to gemini-2.5-flash
 *   - ~10× cheaper than gpt-4o at near-equal structured-output reliability
 * Operator can swap via OPENAI_MODEL without touching code.
 */

import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { QUOTE_RESPONSE_SCHEMA, QUOTE_RESPONSE_SCHEMA_NAME } from './schema.js';
import { AIProviderError, type AIProvider, type BuiltPrompt, type ProviderName } from './types.js';

// One client per process — the SDK is thread-safe and pools connections.
const client = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: env.OPENAI_REQUEST_TIMEOUT_MS })
  : null;

export class OpenAIProvider implements AIProvider {
  name(): ProviderName {
    return 'openai';
  }

  async healthCheck(): Promise<boolean> {
    if (!client) return false;
    try {
      // Cheapest possible call — list models, no token cost.
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async generate(prompt: BuiltPrompt, signal: AbortSignal): Promise<string> {
    if (!client) {
      throw new AIProviderError('openai', 'auth', 'OPENAI_API_KEY not configured');
    }

    // OpenAI takes vision as image_url parts with a data: URL.
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: 'text', text: prompt.dynamicUser },
      ...prompt.images.map(
        (img): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
          type: 'image_url',
          image_url: { url: `data:${img.mimeType};base64,${img.data}` },
        }),
      ),
    ];

    try {
      const completion = await client.chat.completions.create(
        {
          model: env.OPENAI_MODEL,
          max_tokens: env.OPENAI_MAX_OUTPUT_TOKENS,
          temperature: 0.65,
          top_p: 0.95,
          messages: [
            { role: 'system', content: prompt.staticSystem },
            { role: 'user', content: userContent },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: QUOTE_RESPONSE_SCHEMA_NAME,
              // Shared parse validation remains the hard safety net, so a
              // schema miss still falls through to Gemini instead of leaking.
              strict: false,
              schema: QUOTE_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
            },
          },
        },
        { signal },
      );

      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new AIProviderError(
          'openai',
          'malformed_response',
          'OpenAI returned empty content',
        );
      }
      return text;
    } catch (err: unknown) {
      if (err instanceof AIProviderError) throw err;
      throw mapOpenAIError(err);
    }
  }
}

/**
 * Map SDK / fetch errors to our taxonomy. The facade uses these reasons for
 * logging/status and will try Gemini when OpenAI fails.
 */
function mapOpenAIError(err: unknown): AIProviderError {
  // OpenAI SDK throws APIError subclasses with a .status property.
  const status = (err as { status?: number })?.status;
  const code = (err as { code?: string })?.code ?? '';
  const name = (err as { name?: string })?.name ?? '';
  const msg = (err as Error)?.message ?? 'OpenAI error';

  if (name === 'AbortError' || code === 'ABORT_ERR') {
    return new AIProviderError('openai', 'timeout', msg, err);
  }
  if (status === 429) return new AIProviderError('openai', 'rate_limit', msg, err);
  if (status === 408) return new AIProviderError('openai', 'timeout', msg, err);
  if (status === 401 || status === 403) {
    return new AIProviderError('openai', 'auth', msg, err);
  }
  if (status === 400) return new AIProviderError('openai', 'bad_request', msg, err);
  if (typeof status === 'number' && status >= 500) {
    return new AIProviderError('openai', 'server_error', msg, err);
  }
  if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
    return new AIProviderError('openai', 'network', msg, err);
  }
  return new AIProviderError('openai', 'unknown', msg, err);
}
