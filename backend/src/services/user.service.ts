/**
 * User bootstrap — one call returns profile + preferences + regional prices +
 * personal price log. Backed by the SQL RPC get_user_bootstrap() which does
 * the join server-side and runs with the caller's auth.uid().
 */

import { supabaseForUser } from '../config/supabase.js';
import { MemoryCache } from '../cache/memory.js';
import { ApiError } from '../middleware/error.js';
import type { BootstrapPayload } from '../types/domain.js';

// Bootstrap is mostly stable per user. 60-second TTL gives request bursts a
// shared cache without making profile edits feel too stale.
const bootstrapCache = new MemoryCache<string, BootstrapPayload>(60 * 1000);

export async function getUserBootstrap(jwt: string, userId: string): Promise<BootstrapPayload> {
  const cached = bootstrapCache.get(userId);
  if (cached) return cached;

  const userClient = supabaseForUser(jwt);
  const { data, error } = await userClient.rpc('get_user_bootstrap');
  if (error || !data) {
    throw new ApiError(500, `bootstrap failed: ${error?.message ?? 'unknown'}`);
  }

  const payload: BootstrapPayload = {
    profile: (data as any).profile ?? null,
    preferences: (data as any).preferences
      ? {
          wastageRules: (data as any).preferences.wastage_rules ?? {},
          documentFlow: (data as any).preferences.document_flow ?? [],
          negativePreferences: (data as any).preferences.negative_preferences ?? [],
          brandLoyalty: (data as any).preferences.brand_loyalty ?? {},
        }
      : null,
    regional_prices: (data as any).regional_prices ?? [],
    price_log: (data as any).price_log ?? [],
  };

  bootstrapCache.set(userId, payload);
  return payload;
}

export function invalidateUserBootstrap(userId: string): void {
  bootstrapCache.delete(userId);
}
