/**
 * Regional Consensus Price API
 * ─────────────────────────────
 * Client-side interface for reading from regional_price_book
 * and writing price observations.
 *
 * Privacy guarantee: user_id is only ever written (never read).
 * The regional_price_book only surfaces aggregated medians.
 */

import { supabase } from './supabase';

export interface RegionalPriceEntry {
  materialId:       string;
  materialName:     string;
  state:            string;
  medianPriceNgn:   number;
  contributorCount: number;
  isConsensus:      boolean;
  confidence:       'high' | 'medium' | 'low';
}

// ── Read: all regional prices for a state ────────────────────────────────
export async function getRegionalPricesForState(
  state: string
): Promise<RegionalPriceEntry[]> {
  if (!state) return [];

  const { data, error } = await supabase.rpc('get_regional_prices_for_state', {
    p_state: state,
  });

  if (error) {
    console.warn('[RegionalPriceAPI] Could not fetch regional prices:', error.message);
    return [];
  }

  return (data ?? []).map((r: any) => ({
    materialId:       r.material_id,
    materialName:     r.material_name,
    state:            r.state,
    medianPriceNgn:   Number(r.median_price_ngn),
    contributorCount: r.contributor_count,
    isConsensus:      r.is_consensus,
    confidence:       r.confidence as 'high' | 'medium' | 'low',
  }));
}

// ── Write: capture a manual price observation ─────────────────────────────
// Called when a user overrides a [REGIONAL PRICE] in the quote editor.
export async function recordPriceObservation(params: {
  userId:       string;
  materialName: string;
  priceNgn:     number;
  unit:         string;
  state:        string;
  sourceType?:  'price_log' | 'quote_override';
}): Promise<void> {
  if (!params.state || params.priceNgn <= 0) return;

  // Resolve canonical material id via RPC (optional — if no match, still captured)
  const { data: matches } = await supabase
    .from('materials_canonical')
    .select('id')
    .contains('aliases', [params.materialName])
    .limit(1);

  const materialId = matches?.[0]?.id ?? null;

  const { error } = await supabase.from('price_observations').insert({
    material_id:       materialId,
    material_name_raw: params.materialName,
    unit_price_ngn:    params.priceNgn,
    unit:              params.unit,
    origin_state:      params.state,
    user_id:           params.userId,
    source_type:       params.sourceType ?? 'quote_override',
  });

  if (error) {
    console.warn('[RegionalPriceAPI] Failed to record observation:', error.message);
  }
}

// ── Build a lookup map for Gemini prompt injection ───────────────────────
// Returns { "50kg Portland Cement": { price: 7200, isConsensus: true, state: "Oyo" }, ... }
export function buildRegionalPriceMap(
  entries: RegionalPriceEntry[]
): Record<string, { price: number; isConsensus: boolean; state: string; confidence: string }> {
  const map: Record<string, { price: number; isConsensus: boolean; state: string; confidence: string }> = {};
  for (const e of entries) {
    map[e.materialName] = {
      price:       e.medianPriceNgn,
      isConsensus: e.isConsensus,
      state:       e.state,
      confidence:  e.confidence,
    };
  }
  return map;
}
