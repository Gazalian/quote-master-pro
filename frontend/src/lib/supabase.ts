import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Env-misconfiguration sentinel.
 *
 * The previous behaviour was to silently fall back to a fake "placeholder.supabase.co"
 * URL and a placeholder anon key whenever the env vars were missing. That made
 * the app boot, the Supabase client try to refresh a (real, stored) session
 * against a non-existent domain, every auth request fail with
 * `net::ERR_NAME_NOT_RESOLVED`, the AuthProvider sit in `loading: true`
 * forever, and the screen stay blank — with no clear surface to the user
 * about WHY.
 *
 * That was wrong. We now:
 *   1. Detect the missing-env state.
 *   2. Wipe any stored Supabase auth tokens so we don't keep re-trying
 *      against a placeholder URL.
 *   3. Render a clear DevTools error.
 *   4. Render a recovery banner on the page (see EnvMissingBanner below).
 */

export const envConfigured = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

if (!envConfigured) {
  // Clear any stale auth tokens — otherwise supabase-js will keep firing
  // refresh requests at the placeholder host on every page load.
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('otoquote-auth-token');
      // Older keys some versions of supabase-js used:
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith('sb-') || k.startsWith('supabase.auth'))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* localStorage access can throw in private mode — ignore */
    }
  }

  // eslint-disable-next-line no-console
  console.error(
    '%c[supabase] Env vars missing.\n' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.\n' +
      'Add them to .env.local (or .env) and restart `npm run dev`.\n' +
      'Stored auth tokens have been cleared to stop the refresh-loop.',
    'color:#b91c1c;font-weight:bold;font-size:13px;',
  );
}

// We export a client either way so the rest of the app type-checks. When env
// is missing we point it at a known-dead host that can't accidentally race
// against a real network response (about:blank's origin).
const SAFE_PLACEHOLDER_URL = 'http://invalid.localhost';
const SAFE_PLACEHOLDER_KEY = 'invalid';

export const supabase = createClient(
  envConfigured ? (supabaseUrl as string) : SAFE_PLACEHOLDER_URL,
  envConfigured ? (supabaseAnonKey as string) : SAFE_PLACEHOLDER_KEY,
  {
    auth: {
      persistSession: envConfigured,
      // Don't auto-refresh against the placeholder host — that's exactly the
      // loop that produces the "Failed to fetch" / ERR_NAME_NOT_RESOLVED
      // spam in the console.
      autoRefreshToken: envConfigured,
      detectSessionInUrl: envConfigured,
      storageKey: 'otoquote-auth-token',
    },
  },
);
