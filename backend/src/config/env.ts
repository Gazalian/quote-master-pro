import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:8080'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  GEMINI_API_KEY: z.string().min(10),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_FALLBACK_MODEL: z.string().default('gemini-2.0-flash'),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(8192),
  GEMINI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),

  RATE_LIMIT_QUOTE_GEN_PER_MIN: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_DEFAULT_PER_MIN: z.coerce.number().int().positive().default(120),

  QUOTE_GENERATION_POINTS_COST: z.coerce.number().int().nonnegative().default(3),
  PDF_EXPORT_POINTS_COST: z.coerce.number().int().nonnegative().default(2),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast at boot. Don't start a server with missing secrets.
  // eslint-disable-next-line no-console
  console.error('[env] Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
