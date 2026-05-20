/**
 * Single source of truth for monetization toggles on the server.
 *
 * Why a wrapper module rather than direct env reads:
 *   - Lets call sites express intent (`features.points.enabled`) instead of
 *     re-checking raw env values.
 *   - Centralises the rule that *every* gating-related env collapses to one
 *     of four booleans, so future flags can't drift in shape.
 *   - Provides the "effective cost" helpers — when POINTS_ENABLED is off the
 *     cost MUST be 0 even if QUOTE_GENERATION_POINTS_COST is set in env.
 *
 * Default posture: everything is FREE. To turn a gate back on, set the matching
 * env var to `true` and (where applicable) set its cost.
 */

import { env } from './env.js';

export const features = {
  billing: { enabled: env.BILLING_ENABLED },
  points: { enabled: env.POINTS_ENABLED },
  premium: { enabled: env.PREMIUM_ENABLED },
  usageLimits: { enabled: env.USAGE_LIMITS_ENABLED },
} as const;

/** Cost to charge on quote save. Returns 0 unless POINTS_ENABLED. */
export function effectiveQuoteGenerationCost(): number {
  return features.points.enabled ? env.QUOTE_GENERATION_POINTS_COST : 0;
}

/** Cost to charge on PDF export. Returns 0 unless POINTS_ENABLED. */
export function effectivePdfExportCost(): number {
  return features.points.enabled ? env.PDF_EXPORT_POINTS_COST : 0;
}

/**
 * Per-minute rate limit for the quote generation endpoint.
 *
 * When usage limits are off, we don't *remove* rate limiting — that would
 * leave the AI provider exposed to a single misbehaving auth'd client. We
 * just raise the ceiling well above any human pattern. DoS protection stays;
 * monetization gating goes.
 */
export function effectiveQuoteGenRateLimit(): number {
  return features.usageLimits.enabled ? env.RATE_LIMIT_QUOTE_GEN_PER_MIN : 600;
}
