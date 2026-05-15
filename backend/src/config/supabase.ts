import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Service-role client: trusted dispatcher that can call SECURITY DEFINER RPCs.
// Use only on the server. Never expose this client to a request handler that
// trusts unauthenticated input — always derive the user from a verified JWT.
export const supabaseService: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

/**
 * Per-request client scoped to the caller's JWT. Use this when you want RLS to
 * apply on behalf of the user (any direct table read/write).
 */
export function supabaseForUser(jwt: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
