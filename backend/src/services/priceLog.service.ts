/**
 * Price-log CRUD. RLS pins everything to the caller. The DB trigger
 * `capture_price_observation` automatically feeds the regional consensus
 * engine — we don't have to call it ourselves.
 */

import { supabaseForUser } from '../config/supabase.js';
import { ApiError } from '../middleware/error.js';
import { invalidateUserBootstrap } from './user.service.js';

export interface PriceLogUpsertInput {
  name: string;
  unit: string;
  unitPrice: number;
  type?: 'MATERIALS' | 'LABOUR';
  category?: string | null;
  supplier?: string | null;
}

export async function listEntries(jwt: string) {
  const client = supabaseForUser(jwt);
  const { data, error } = await client
    .from('price_log')
    .select('id, item_name, unit, price, type, category, supplier, last_used_at')
    .order('last_used_at', { ascending: false });
  if (error) throw new ApiError(500, `list price log failed: ${error.message}`);
  return data ?? [];
}

export async function upsertEntry(jwt: string, userId: string, input: PriceLogUpsertInput) {
  const client = supabaseForUser(jwt);
  const { data, error } = await client
    .from('price_log')
    .upsert(
      {
        user_id: userId,
        item_name: input.name,
        unit: input.unit,
        price: input.unitPrice,
        type: input.type ?? 'MATERIALS',
        category: input.category ?? null,
        supplier: input.supplier ?? null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,item_name' },
    )
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new ApiError(409, `An item named "${input.name}" already exists`);
    throw new ApiError(500, `upsert price log failed: ${error.message}`);
  }

  invalidateUserBootstrap(userId);
  return data;
}

export async function updateEntry(jwt: string, userId: string, id: string, input: PriceLogUpsertInput) {
  const client = supabaseForUser(jwt);
  const { data, error } = await client
    .from('price_log')
    .update({
      item_name: input.name,
      unit: input.unit,
      price: input.unitPrice,
      type: input.type ?? 'MATERIALS',
      category: input.category ?? null,
      supplier: input.supplier ?? null,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new ApiError(409, `An item named "${input.name}" already exists`);
    throw new ApiError(500, `update price log failed: ${error.message}`);
  }

  invalidateUserBootstrap(userId);
  return data;
}

export async function deleteEntry(jwt: string, userId: string, id: string) {
  const client = supabaseForUser(jwt);
  const { error } = await client.from('price_log').delete().eq('id', id);
  if (error) throw new ApiError(500, `delete price log failed: ${error.message}`);
  invalidateUserBootstrap(userId);
}
