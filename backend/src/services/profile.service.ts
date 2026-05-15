/**
 * Profile / brand updates. Always invalidates the bootstrap cache so the
 * client sees fresh values on the next request.
 */

import { supabaseForUser } from '../config/supabase.js';
import { ApiError } from '../middleware/error.js';
import { invalidateUserBootstrap } from './user.service.js';

const ALLOWED_FIELDS = new Set([
  'company_name', 'email', 'phone', 'whatsapp', 'address', 'contact_person',
  'cac_number', 'logo_url', 'brand_primary_color', 'brand_secondary_color',
  'bank_name', 'account_name', 'account_number', 'default_payment_terms',
  'full_name', 'trade_type', 'state_operation',
]);

export async function updateProfile(jwt: string, userId: string, patch: Record<string, unknown>) {
  // Allow-list filter — refuse to write to columns that aren't profile fields.
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (ALLOWED_FIELDS.has(k)) safe[k] = v;
  }
  if (Object.keys(safe).length === 0) throw new ApiError(400, 'No valid fields to update');

  const client = supabaseForUser(jwt);
  const { data, error } = await client.from('profiles').update(safe).eq('id', userId).select().single();
  if (error) throw new ApiError(500, `update profile failed: ${error.message}`);

  invalidateUserBootstrap(userId);
  return data;
}
