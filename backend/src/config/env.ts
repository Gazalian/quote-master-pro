import 'dotenv/config';
import { z } from 'zod';

const providerName = z.enum(['openai', 'gemini']);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    CORS_ORIGIN: z.string().default('http://localhost:8080'),

    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(20),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

    // ── AI providers ────────────────────────────────────────────────────────
    // PRIMARY runs first; FALLBACK runs if PRIMARY has any provider/API
    // failure. Defaults keep OpenAI primary and Gemini secondary.
    AI_PROVIDER_PRIMARY: providerName.default('openai'),
    AI_PROVIDER_FALLBACK: providerName.default('gemini'),

    // OpenAI
    OPENAI_API_KEY: z.string().min(10).optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(4096),
    OPENAI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),

    // Gemini
    GEMINI_API_KEY: z.string().min(10).optional(),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(8192),
    GEMINI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),

    RATE_LIMIT_QUOTE_GEN_PER_MIN: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_DEFAULT_PER_MIN: z.coerce.number().int().positive().default(120),

    // ── Monetization toggles ────────────────────────────────────────────────
    // All default OFF — the platform runs as a fully free tier. Flip any one
    // back to `true` and set the matching `*_POINTS_COST` to re-enable the
    // corresponding gate. The DB function `save_quote_with_points` already
    // no-ops when the cost is 0, so toggling these is safe with no migration.
    BILLING_ENABLED: z.coerce.boolean().default(false),
    POINTS_ENABLED: z.coerce.boolean().default(false),
    PREMIUM_ENABLED: z.coerce.boolean().default(false),
    USAGE_LIMITS_ENABLED: z.coerce.boolean().default(false),

    // Per-action point cost. Honoured only when POINTS_ENABLED=true; otherwise
    // forced to 0 inside the service layer. Kept here for fast re-enable.
    QUOTE_GENERATION_POINTS_COST: z.coerce.number().int().nonnegative().default(0),
    PDF_EXPORT_POINTS_COST: z.coerce.number().int().nonnegative().default(0),
  })
  .superRefine((v, ctx) => {
    if (v.AI_PROVIDER_PRIMARY === v.AI_PROVIDER_FALLBACK) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_PROVIDER_FALLBACK'],
        message: 'AI_PROVIDER_FALLBACK must differ from AI_PROVIDER_PRIMARY',
      });
    }
    // Every provider in the chain must have its API key. Fail-fast at boot so
    // failover can't be silently disabled by a missing secret.
    const need = new Set<'openai' | 'gemini'>([v.AI_PROVIDER_PRIMARY, v.AI_PROVIDER_FALLBACK]);
    if (need.has('openai') && !v.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when OpenAI is in the provider chain',
      });
    }
    if (need.has('gemini') && !v.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GEMINI_API_KEY'],
        message: 'GEMINI_API_KEY is required when Gemini is in the provider chain',
      });
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast at boot. Don't start a server with missing secrets.
  console.error('[env] Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
