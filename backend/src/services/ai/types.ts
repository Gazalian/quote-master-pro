/**
 * Provider-agnostic AI types.  Nothing in here should reference a vendor SDK —
 * if it does, the abstraction has leaked and the consumer has to know which
 * provider it's talking to.
 */

import type {
  ConversationTurn,
  PriceLogEntry,
  RegionalPriceEntry,
  UserPreferences,
  QuoteDraft,
} from '../../types/domain.js';

export type ProviderName = 'openai' | 'gemini';

export interface AIGenerateInput {
  userMessage: string;
  images?: { mimeType: string; data: string }[]; // base64, no prefix
  conversationHistory?: ConversationTurn[];
  userTrade?: string;
  userLocation?: string;
  priceLogEntries?: PriceLogEntry[];
  regionalPrices?: RegionalPriceEntry[];
  userPreferences?: UserPreferences | null;
  pendingQuestions?: string[];
}

export interface AIGenerateResult {
  draft: QuoteDraft;
  /** Which provider actually produced this draft (for telemetry + tests). */
  providerUsed: ProviderName;
  /** Total wall time including failovers. */
  latencyMs: number;
  /** Empty unless we had to failover; ordered as failures occurred. */
  failovers: Array<{ provider: ProviderName; reason: string; latencyMs: number }>;
}

/**
 * The prompt as built by `prompt.service.ts`. Providers may need to embed the
 * static and dynamic halves differently (system vs user turn, etc.) so we hand
 * them both halves separately rather than a single concatenated string.
 */
export interface BuiltPrompt {
  staticSystem: string;
  dynamicUser: string;
  images: { mimeType: string; data: string }[];
}

/**
 * Each provider returns the raw JSON string for the QuoteDraft.  Parsing into
 * the domain shape is done once, in shared code, so providers can't drift on
 * the QuoteDraft contract.
 */
export interface AIProvider {
  name(): ProviderName;
  /** Cheap reachability check — used by /health/ready and by integration tests. */
  healthCheck(): Promise<boolean>;
  /**
   * Run a single generation.  Must:
   *  - honour the AbortSignal (caller enforces overall budget)
   *  - return *valid JSON* (use the SDK's native structured-output feature)
 *  - throw AIProviderError on provider/API failures so the facade can fail over
   */
  generate(prompt: BuiltPrompt, signal: AbortSignal): Promise<string>;
}

/**
 * Discriminated error so the facade can decide "retry with fallback" vs
 * "fail fast and surface to user."
 *
 * The facade decides whether to try the next provider based on chain position.
 * A bad OpenAI key, bad model, malformed output, or transient network problem
 * should not be visible to users while Gemini is available as fallback.
 */
export type AIFailureReason =
  | 'timeout'
  | 'rate_limit'
  | 'server_error'
  | 'malformed_response'
  | 'network'
  | 'auth'
  | 'bad_request'
  | 'unknown';

export class AIProviderError extends Error {
  constructor(
    public readonly provider: ProviderName,
    public readonly reason: AIFailureReason,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }

  /** True when retrying the same provider might succeed. */
  isRetryable(): boolean {
    return (
      this.reason === 'timeout' ||
      this.reason === 'rate_limit' ||
      this.reason === 'server_error' ||
      this.reason === 'malformed_response' ||
      this.reason === 'network'
    );
  }

  /** True when another configured provider should get a chance. */
  isFailoverEligible(): boolean {
    return true;
  }
}
