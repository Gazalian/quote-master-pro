/**
 * AI facade.  The ONLY thing the rest of the backend should import from the
 * `ai` namespace.
 *
 * Responsibilities:
 *   1. Build the prompt (delegates to prompt.service.ts — unchanged).
 *   2. Resolve the provider chain (factory.ts, env-driven).
 *   3. Run primary; on provider/API failure, run fallback.
 *   4. Enforce a single overall time budget across both attempts.
 *   5. Parse the raw JSON into a QuoteDraft (shared parser).
 *   6. Emit structured logs (provider, latency, retries, failovers).
 *
 * No code outside this file knows which provider produced a quote.
 */

import { ApiError } from '../../middleware/error.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';
import { buildStaticPrompt, buildDynamicPrompt } from '../prompt.service.js';
import { getProviderChain } from './factory.js';
import { parseQuoteDraft } from './parse.js';
import {
  AIProviderError,
  type AIGenerateInput,
  type AIGenerateResult,
  type BuiltPrompt,
  type ProviderName,
} from './types.js';

export type { AIGenerateInput, AIGenerateResult } from './types.js';

function buildPrompt(input: AIGenerateInput): BuiltPrompt {
  const trade = input.userTrade ?? 'general';
  const location = input.userLocation ?? 'Nigeria';
  return {
    staticSystem: buildStaticPrompt(trade, location),
    dynamicUser: buildDynamicPrompt({
      userMessage: input.userMessage,
      conversationHistory: input.conversationHistory,
      hasImages: !!input.images?.length,
      priceLogEntries: input.priceLogEntries,
      regionalPrices: input.regionalPrices,
      userPreferences: input.userPreferences ?? null,
      pendingQuestions: input.pendingQuestions,
      location,
    }),
    images: input.images ?? [],
  };
}

/**
 * The overall budget is the max of the two providers' timeouts so we don't
 * cut off the fallback before it even gets to try.  Each provider also has
 * its own per-call timeout enforced internally.
 */
function overallBudgetMs(): number {
  return Math.max(env.OPENAI_REQUEST_TIMEOUT_MS, env.GEMINI_REQUEST_TIMEOUT_MS) * 2;
}

export async function generateQuote(input: AIGenerateInput): Promise<AIGenerateResult> {
  const chain = getProviderChain();
  const prompt = buildPrompt(input);

  const ac = new AbortController();
  const overall = setTimeout(() => ac.abort(), overallBudgetMs());
  const startedAt = Date.now();
  const failovers: AIGenerateResult['failovers'] = [];

  try {
    for (let i = 0; i < chain.length; i++) {
      const provider = chain[i];
      const isLast = i === chain.length - 1;
      const attemptStart = Date.now();
      const name: ProviderName = provider.name();

      try {
        logger.info({ provider: name, attempt: i + 1, of: chain.length }, 'AI generation start');
        const raw = await provider.generate(prompt, ac.signal);
        let draft;
        try {
          draft = parseQuoteDraft(raw);
        } catch (parseErr) {
          // Provider's structured-output contract failed. Treat it as a
          // provider fault so the next provider gets a shot.
          throw new AIProviderError(
            name,
            'malformed_response',
            (parseErr as Error)?.message ?? 'malformed JSON from provider',
            parseErr,
          );
        }
        const latencyMs = Date.now() - startedAt;
        logger.info(
          {
            provider: name,
            latencyMs,
            providerLatencyMs: Date.now() - attemptStart,
            failovers: failovers.length,
            itemGroups: draft.groups.length,
            grandTotal: draft.grandTotal,
          },
          'AI generation success',
        );
        return { draft, providerUsed: name, latencyMs, failovers };
      } catch (err: unknown) {
        const providerLatencyMs = Date.now() - attemptStart;
        const isProviderErr = err instanceof AIProviderError;
        const reason = isProviderErr ? err.reason : 'unknown';
        const retryable = isProviderErr ? err.isRetryable() : false;
        const failoverEligible = isProviderErr ? err.isFailoverEligible() : true;

        // Log every failure with full context so we can build dashboards.
        logger.warn(
          {
            provider: name,
            reason,
            retryable,
            failoverEligible,
            providerLatencyMs,
            isLast,
            err: (err as Error)?.message,
          },
          'AI provider failed',
        );

        failovers.push({ provider: name, reason, latencyMs: providerLatencyMs });

        // Last provider in chain — no one left to try. Preserve a 502 for
        // deterministic app/config errors, 503 for transient provider outages.
        if (isLast || !failoverEligible) {
          logger.error(
            { failovers, totalLatencyMs: Date.now() - startedAt },
            'All AI providers failed',
          );
          throw new ApiError(retryable ? 503 : 502, 'AI services temporarily unavailable');
        }

        // Otherwise loop to the next provider.
        logger.info({ from: name, next: chain[i + 1].name() }, 'AI failover');
      }
    }

    // Unreachable — loop returns or throws on every path.
    throw new ApiError(503, 'AI services temporarily unavailable');
  } finally {
    clearTimeout(overall);
  }
}

/** Best-effort health probe across the configured chain. */
export async function aiHealthCheck(): Promise<{ provider: ProviderName; healthy: boolean }[]> {
  const chain = getProviderChain();
  return Promise.all(
    chain.map(async (p) => ({ provider: p.name(), healthy: await p.healthCheck() })),
  );
}
