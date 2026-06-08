/**
 * User bootstrap — one call returns profile + preferences + regional prices +
 * personal price log. Backed by the SQL RPC get_user_bootstrap() which does
 * the join server-side and runs with the caller's auth.uid().
 */

import { supabaseForUser } from '../config/supabase.js';
import { MemoryCache } from '../cache/memory.js';
import { ApiError } from '../middleware/error.js';
import { logger } from '../utils/logger.js';
import type { BootstrapPayload } from '../types/domain.js';

interface SupabaseRpcError {
  code?: string;
  details?: string;
  hint?: string;
}

interface RawBootstrapPayload {
  profile?: BootstrapPayload['profile'];
  preferences?: {
    wastage_rules?: Record<string, number>;
    document_flow?: string[];
    negative_preferences?: string[];
    brand_loyalty?: Record<string, string>;
  } | null;
  regional_prices?: BootstrapPayload['regional_prices'];
  price_log?: BootstrapPayload['price_log'];
}

// Bootstrap is mostly stable per user. 60-second TTL gives request bursts a
// shared cache without making profile edits feel too stale.
const bootstrapCache = new MemoryCache<string, BootstrapPayload>(60 * 1000);

export async function getUserBootstrap(jwt: string, userId: string): Promise<BootstrapPayload> {
  const cached = bootstrapCache.get(userId);
  if (cached) {
    logger.debug({ userId, source: 'cache' }, 'bootstrap served');
    return cached;
  }

  const userClient = supabaseForUser(jwt);
  const { data, error } = await userClient.rpc('get_user_bootstrap');
  if (error || !data) {
    const rpcError = error as SupabaseRpcError | null;
    // Surface the full Supabase error so the outage runbook (step 7) has
    // something to grep on. `code` / `details` / `hint` come from PostgREST.
    logger.error(
      {
        userId,
        err: error?.message,
        code: rpcError?.code,
        details: rpcError?.details,
        hint: rpcError?.hint,
      },
      'bootstrap RPC failed',
    );
    throw new ApiError(500, `bootstrap failed: ${error?.message ?? 'unknown'}`);
  }

  const raw = data as RawBootstrapPayload;
  const payload: BootstrapPayload = {
    profile: raw.profile ?? null,
    preferences: raw.preferences
      ? {
          wastageRules: raw.preferences.wastage_rules ?? {},
          documentFlow: raw.preferences.document_flow ?? [],
          negativePreferences: raw.preferences.negative_preferences ?? [],
          brandLoyalty: raw.preferences.brand_loyalty ?? {},
        }
      : null,
    regional_prices: raw.regional_prices ?? [],
    price_log: raw.price_log ?? [],
  };

  // Observability: log counts (not contents) so production logs can answer
  // "did the user really get zero rows, or did the response just look empty
  // in the UI?"
  logger.info(
    {
      userId,
      source: 'rpc',
      profile: !!payload.profile,
      preferences: !!payload.preferences,
      priceLogCount: payload.price_log.length,
      regionalPricesCount: payload.regional_prices.length,
    },
    'bootstrap payload built',
  );

  bootstrapCache.set(userId, payload);
  return payload;
}

export function invalidateUserBootstrap(userId: string): void {
  bootstrapCache.delete(userId);
}
