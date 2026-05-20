/**
 * Quote persistence — wraps the save_quote_with_points RPC.
 * The RPC is the only path that touches points; we never deduct points anywhere
 * else (no client-side deduction, no out-of-band UPDATE).
 */

import { supabaseService, supabaseForUser } from '../config/supabase.js';
import { ApiError } from '../middleware/error.js';
import { invalidateUserBootstrap } from './user.service.js';
import { effectiveQuoteGenerationCost } from '../config/featureFlags.js';
import type { QuoteDraft } from '../types/domain.js';

export interface SaveQuoteInput {
  draft: QuoteDraft;
  sessionId: string | null;
  templateStyle?: 'classic' | 'modern' | 'minimal';
}

export async function saveQuoteWithPoints(jwt: string, userId: string, input: SaveQuoteInput) {
  // Service role calls the SECURITY DEFINER RPC. We pass user_id explicitly
  // because the RPC checks the points balance and writes ledger rows.
  const { data, error } = await supabaseService.rpc('save_quote_with_points', {
    p_user_id: userId,
    p_session_id: input.sessionId,
    p_ref: input.draft.ref,
    p_client_name: input.draft.client,
    p_description: input.draft.description,
    p_template_style: input.templateStyle ?? input.draft.templateStyle ?? 'modern',
    p_grand_total: input.draft.grandTotal,
    p_data: { groups: input.draft.groups },
    // Honour the POINTS_ENABLED feature flag — when off, cost is forced to 0
    // and the DB function short-circuits the deduction path entirely.
    p_points_cost: effectiveQuoteGenerationCost(),
  });

  if (error) {
    if (error.message?.toLowerCase().includes('check')) {
      throw new ApiError(402, 'Insufficient points');
    }
    throw new ApiError(500, `save quote failed: ${error.message}`);
  }

  // Invalidate the bootstrap cache so the user sees the new points balance.
  invalidateUserBootstrap(userId);
  return data;
}

export async function listQuotations(jwt: string, opts: { limit: number; offset: number; status?: string | null }) {
  const userClient = supabaseForUser(jwt);
  const { data, error } = await userClient.rpc('get_quotation_list', {
    p_limit: opts.limit,
    p_offset: opts.offset,
    p_status: opts.status ?? null,
  });
  if (error) throw new ApiError(500, `list quotations failed: ${error.message}`);
  return data ?? [];
}

export async function getQuotation(jwt: string, id: string) {
  const userClient = supabaseForUser(jwt);
  // Full row (with the heavy JSONB) only when explicitly requested.
  const { data, error } = await userClient.from('quotations').select('*').eq('id', id).maybeSingle();
  if (error) throw new ApiError(500, `fetch quote failed: ${error.message}`);
  if (!data) throw new ApiError(404, 'Quotation not found');
  return data;
}

export async function updateQuotation(jwt: string, id: string, patch: Record<string, unknown>) {
  const userClient = supabaseForUser(jwt);
  const { error } = await userClient.from('quotations').update(patch).eq('id', id);
  if (error) throw new ApiError(500, `update quote failed: ${error.message}`);
}

export async function deleteQuotation(jwt: string, id: string) {
  const userClient = supabaseForUser(jwt);
  const { error } = await userClient.from('quotations').delete().eq('id', id);
  if (error) throw new ApiError(500, `delete quote failed: ${error.message}`);
}
