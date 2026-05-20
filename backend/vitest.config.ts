import { defineConfig } from 'vitest/config';

// Inject the minimum env needed for `config/env.ts` to pass zod validation at
// import time. Real provider calls are stubbed in the tests, so the API keys
// are placeholders.
export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key-must-be-twenty-chars-long',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-must-be-twenty-chars-long',
      AI_PROVIDER_PRIMARY: 'openai',
      AI_PROVIDER_FALLBACK: 'gemini',
      OPENAI_API_KEY: 'sk-test-openai-key',
      GEMINI_API_KEY: 'test-gemini-key',
    },
    include: ['src/**/*.test.ts'],
  },
});
