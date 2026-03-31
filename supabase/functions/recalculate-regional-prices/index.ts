/**
 * Regional Consensus Engine — Edge Function
 * ==========================================
 * Scheduled every 24 hours via Supabase Cron.
 * Algorithm:
 *   1. Load price_observations from the last 90 days
 *   2. Group by (material_id, origin_state)
 *   3. Apply time-decay weighting  (half-life = 14 days)
 *   4. Calculate weighted rolling median
 *   5. Apply consensus filter  (≥5 unique users within 7.5% variance)
 *   6. Write results to regional_price_book
 *   7. Flag outliers (deviation >30% from national baseline)
 *   8. Purge observations older than 90 days
 *
 * Privacy:  user_ids are used only for deduplication;
 *           they are NEVER returned to any client query.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Constants ────────────────────────────────────────────────────────────
const HALF_LIFE_DAYS      = 14;     // prices older than this have 50% weight
const MAX_AGE_DAYS        = 90;     // purge older than this
const CONSENSUS_MIN_USERS = 5;      // minimum unique users for consensus status
const CONSENSUS_VARIANCE  = 0.075;  // 7.5% variance band for consensus check
const OUTLIER_THRESHOLD   = 0.30;   // 30% deviation from national baseline

// ── Types ────────────────────────────────────────────────────────────────
interface Observation {
  material_id:     string;
  material_name:   string;  // canonical name from join
  origin_state:    string;
  unit_price_ngn:  number;
  user_id:         string;
  observed_at:     string;
  national_baseline_ngn: number | null;
}

interface GroupKey {
  material_id:  string;
  material_name: string;
  origin_state: string;
  national_baseline: number | null;
}

interface WeightedValue {
  value:   number;
  weight:  number;
  user_id: string;
}

// ── Time-decay weight ────────────────────────────────────────────────────
// weight = 2^(-days_old / HALF_LIFE_DAYS)
// 0 days old → weight 1.0 | 14 days old → weight 0.5 | 28 days old → weight 0.25
function decayWeight(observedAt: string): number {
  const daysOld = (Date.now() - new Date(observedAt).getTime()) / 86_400_000;
  return Math.pow(2, -daysOld / HALF_LIFE_DAYS);
}

// ── Weighted Median ──────────────────────────────────────────────────────
// Sort by value, accumulate weights, return value at cumulative weight ≥ totalWeight/2
function weightedMedian(values: WeightedValue[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((s, v) => s + v.weight, 0);
  let cumWeight = 0;
  for (const item of sorted) {
    cumWeight += item.weight;
    if (cumWeight >= totalWeight / 2) return item.value;
  }
  return sorted[sorted.length - 1].value;
}

// ── Consensus check ──────────────────────────────────────────────────────
// Count unique users whose price falls within ±7.5% of the median
function checkConsensus(
  raw: WeightedValue[],
  median: number
): { isConsensus: boolean; uniqueContributors: number; variancePct: number } {
  const lo = median * (1 - CONSENSUS_VARIANCE);
  const hi = median * (1 + CONSENSUS_VARIANCE);
  const inBand = raw.filter(v => v.value >= lo && v.value <= hi);
  const uniqueContributors = new Set(inBand.map(v => v.user_id)).size;
  const prices = raw.map(v => v.value);
  const variancePct =
    prices.length > 1
      ? ((Math.max(...prices) - Math.min(...prices)) / median) * 100
      : 0;
  return {
    isConsensus: uniqueContributors >= CONSENSUS_MIN_USERS,
    uniqueContributors,
    variancePct,
  };
}

// ── Confidence band ──────────────────────────────────────────────────────
function confidenceLevel(userCount: number): "high" | "medium" | "low" {
  if (userCount >= CONSENSUS_MIN_USERS) return "high";
  if (userCount >= 3) return "medium";
  return "low";
}

// ── Main handler ─────────────────────────────────────────────────────────
Deno.serve(async () => {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  let materialsProcessed = 0;
  let consensusFound = 0;
  let flagged = 0;
  let purged = 0;

  try {
    // ── STEP 1: Load all recent observations (last 90 days) ──────────────
    const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString();

    const { data: rows, error: fetchErr } = await supabase
      .from("price_observations")
      .select(`
        material_id,
        unit_price_ngn,
        user_id,
        origin_state,
        observed_at,
        materials_canonical!inner ( canonical_name, national_baseline_ngn )
      `)
      .gte("observed_at", cutoff)
      .not("origin_state", "is", null);

    if (fetchErr) throw new Error(`Fetch observations: ${fetchErr.message}`);

    const observations: Observation[] = (rows ?? []).map((r: any) => ({
      material_id:           r.material_id,
      material_name:         r.materials_canonical.canonical_name,
      origin_state:          r.origin_state,
      unit_price_ngn:        Number(r.unit_price_ngn),
      user_id:               r.user_id,
      observed_at:           r.observed_at,
      national_baseline_ngn: r.materials_canonical.national_baseline_ngn
        ? Number(r.materials_canonical.national_baseline_ngn)
        : null,
    }));

    // ── STEP 2: Group by (material_id, origin_state) ─────────────────────
    const groupMap = new Map<string, { meta: GroupKey; values: WeightedValue[] }>();

    for (const obs of observations) {
      const key = `${obs.material_id}::${obs.origin_state}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          meta: {
            material_id:       obs.material_id,
            material_name:     obs.material_name,
            origin_state:      obs.origin_state,
            national_baseline: obs.national_baseline_ngn,
          },
          values: [],
        });
      }
      groupMap.get(key)!.values.push({
        value:   obs.unit_price_ngn,
        weight:  decayWeight(obs.observed_at),
        user_id: obs.user_id,
      });
    }

    // ── STEP 3: Calculate consensus per group ─────────────────────────────
    const upsertRows = [];
    const flagRows   = [];

    for (const [, group] of groupMap) {
      materialsProcessed++;
      const { meta, values } = group;

      // Need at least 1 observation to write anything
      if (values.length === 0) continue;

      const median   = weightedMedian(values);
      const { isConsensus, uniqueContributors, variancePct } = checkConsensus(values, median);

      if (isConsensus) consensusFound++;

      upsertRows.push({
        material_id:        meta.material_id,
        material_name:      meta.material_name,
        origin_state:       meta.origin_state,
        median_price_ngn:   Math.round(median),
        contributor_count:  uniqueContributors,
        variance_pct:       Math.round(variancePct * 10) / 10,
        is_consensus:       isConsensus,
        confidence:         confidenceLevel(uniqueContributors),
        last_calculated_at: new Date().toISOString(),
      });

      // ── STEP 4: Outlier detection ─────────────────────────────────────
      if (meta.national_baseline && meta.national_baseline > 0) {
        const deviation = Math.abs(median - meta.national_baseline) / meta.national_baseline;
        if (deviation > OUTLIER_THRESHOLD) {
          flagged++;
          flagRows.push({
            material_id:       meta.material_id,
            origin_state:      meta.origin_state,
            flagged_price:     Math.round(median),
            national_baseline: meta.national_baseline,
            deviation_pct:     Math.round(deviation * 100),
          });
        }
      }
    }

    // ── STEP 5: Write to regional_price_book ─────────────────────────────
    if (upsertRows.length > 0) {
      const { error: upsertErr } = await supabase
        .from("regional_price_book")
        .upsert(upsertRows, { onConflict: "material_id,origin_state" });

      if (upsertErr) errors.push(`Upsert price book: ${upsertErr.message}`);
    }

    // ── STEP 6: Write flagged outliers ────────────────────────────────────
    if (flagRows.length > 0) {
      const { error: flagErr } = await supabase
        .from("price_flag_review")
        .insert(flagRows);
      if (flagErr) errors.push(`Insert flags: ${flagErr.message}`);
    }

    // ── STEP 7: Purge observations older than 90 days ────────────────────
    const { count, error: purgeErr } = await supabase
      .from("price_observations")
      .delete({ count: "exact" })
      .lt("observed_at", cutoff);

    if (purgeErr) errors.push(`Purge old data: ${purgeErr.message}`);
    else purged = count ?? 0;

  } catch (err: any) {
    errors.push(err.message);
  }

  const result = {
    started_at:          startedAt,
    finished_at:         new Date().toISOString(),
    materials_processed: materialsProcessed,
    consensus_found:     consensusFound,
    outliers_flagged:    flagged,
    observations_purged: purged,
    errors,
  };

  console.log("[RegionalConsensus]", JSON.stringify(result, null, 2));

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status:  errors.length > 0 ? 207 : 200,
  });
});
