/**
 * Frontend feature flags — mirror of the backend's `featureFlags.ts`.
 *
 * All default OFF so the platform behaves as a fully free tier even when the
 * env vars aren't set (local dev, previews, etc).
 *
 * To flip any back on:
 *   VITE_BILLING_ENABLED=true
 *   VITE_POINTS_ENABLED=true
 *   VITE_PREMIUM_ENABLED=true
 *   VITE_USAGE_LIMITS_ENABLED=true
 *
 * Vite injects these at build time. The backend has its own authoritative
 * copy; these flags exist only for UI gating (hiding paywalls, badges, etc.)
 * — never for security boundaries.
 */

const parseBool = (v: unknown): boolean =>
  typeof v === 'string' ? v.toLowerCase() === 'true' : Boolean(v);

export const features = {
  billing: { enabled: parseBool(import.meta.env.VITE_BILLING_ENABLED) },
  points: { enabled: parseBool(import.meta.env.VITE_POINTS_ENABLED) },
  premium: { enabled: parseBool(import.meta.env.VITE_PREMIUM_ENABLED) },
  usageLimits: { enabled: parseBool(import.meta.env.VITE_USAGE_LIMITS_ENABLED) },
} as const;

/** True if ANY monetization gate is on — useful for blanket UI decisions. */
export const anyMonetizationOn =
  features.billing.enabled || features.points.enabled || features.premium.enabled;
