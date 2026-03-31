/**
 * User Behavior Adaptation Engine
 * ─────────────────────────────────────────────────────────────────────────
 * Compares AI-generated draft quotes against the user's final saved version,
 * extracts behavioral patterns, and injects learned rules back into the AI
 * system prompt so each new quote needs fewer edits.
 *
 * Rule types learned:
 *   wastageRules      – user consistently adds X% to a material category
 *   documentFlow      – preferred group ordering (Materials → Labour → …)
 *   negativePrefs     – items the AI suggests that the user always deletes
 *   brandLoyalty      – generic material → Nigerian brand substitution
 */

import { supabase } from './supabase';
import type { Quote, QuoteGroup, QuoteItem } from '@/types/quote';

// ── Types ─────────────────────────────────────────────────────────────────

export interface QuoteDelta {
  /** Item names present in draft but removed from final */
  deletedItems: string[];
  /** Per-item quantity ratio (final / draft) for items that survived */
  quantityRatios: Array<{ name: string; category: string; ratio: number }>;
  /** Ordered group names from the final saved quote */
  groupOrderFinal: string[];
  /** Generic item name → specific brand name swaps detected */
  brandSwaps: Array<{ generic: string; brand: string; category: string }>;
  timestamp: string;
}

export interface UserPreferences {
  /** material category → wastage multiplier, e.g. { tiles: 1.15 } */
  wastageRules: Record<string, number>;
  /** e.g. ["Materials", "Labour", "Transportation", "Miscellaneous"] */
  documentFlow: string[];
  /** item names to never include for this user */
  negativePreferences: string[];
  /** material category → brand name, e.g. { cement: "Dangote" } */
  brandLoyalty: Record<string, string>;
  /** last 30 raw deltas kept for re-analysis */
  rawDeltas: QuoteDelta[];
}

// ── Nigerian material categories ──────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cement:         ['cement', 'concrete', 'mortar'],
  wire:           ['wire', 'cable', 'conductor', 'flex'],
  paint:          ['paint', 'emulsion', 'gloss', 'primer', 'putty', 'topcoat'],
  tiles:          ['tile', 'tiling', 'ceramic', 'porcelain', 'vitrified'],
  roofing:        ['roofing', 'roof sheet', 'zinc', 'iron roof', 'aluzinc'],
  pipe:           ['pipe', 'pvc pipe', 'fitting', 'elbow', 'reducer'],
  reinforcement:  ['rod', 'rebar', 'iron', 'reinforcement', 'steel bar', 'y12', 'y16'],
  blocks:         ['block', 'brick', '6 inch', '9 inch'],
  aggregate:      ['sand', 'gravel', 'aggregate', 'granite chips', 'sharp sand', 'soft sand'],
  timber:         ['timber', 'wood', 'plank', 'board', 'formwork', '2x3', '2x4'],
  glass:          ['glass', 'louvre', 'window pane'],
  electrical:     ['socket', 'switch', 'mcb', 'breaker', 'conduit', 'trunking'],
  plumbing:       ['toilet', 'wc', 'sink', 'basin', 'cistern', 'tap', 'valve', 'shower'],
  labour:         ['labour', 'labor', 'workmanship', 'installation', 'fixing'],
};

const NIGERIAN_BRANDS: Record<string, string[]> = {
  cement:   ['dangote', 'bua', 'unicem', 'wapco', 'lafarge', 'ibeto'],
  wire:     ['nigerchin', 'coleman', 'ccecc', 'cutix'],
  paint:    ['dulux', 'berger', 'crown', 'sandtex', 'jotun', 'sigma'],
  tiles:    ['johnson', 'arif', 'grandeur', 'sonata', 'tiles plaza'],
  roofing:  ['alutile', 'coversure', 'metcoppo', 'aluzinc', 'gerard'],
  pipe:     ['bello', 'temco', 'wavin', 'tigre'],
  plumbing: ['roca', 'diana', 'cera', 'vitra', 'american standard'],
};

// ── Helpers ───────────────────────────────────────────────────────────────

function detectCategory(itemName: string): string {
  const lower = itemName.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return 'general';
}

function detectBrand(itemName: string): { category: string; brand: string } | null {
  const lower = itemName.toLowerCase();
  for (const [cat, brands] of Object.entries(NIGERIAN_BRANDS)) {
    for (const brand of brands) {
      if (lower.includes(brand)) {
        return { category: cat, brand: brand.charAt(0).toUpperCase() + brand.slice(1) };
      }
    }
  }
  return null;
}

function allItems(quote: Quote): QuoteItem[] {
  return quote.groups.flatMap(g => g.items);
}

function normalizeGroupName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('material')) return 'Materials';
  if (lower.includes('labour') || lower.includes('labor')) return 'Labour';
  if (lower.includes('transport')) return 'Transportation';
  if (lower.includes('misc') || lower.includes('sundry') || lower.includes('contingency')) return 'Miscellaneous';
  return name; // keep as-is for custom names
}

// Weighted median helper (used for wastage consensus)
function median(values: number[]): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── Core: extract delta between draft and final ───────────────────────────

export function extractDelta(draft: Quote, final: Quote): QuoteDelta {
  const draftItems = allItems(draft);
  const finalItems = allItems(final);

  const finalNameSet = new Set(finalItems.map(i => i.name.toLowerCase().trim()));
  const draftNameSet = new Set(draftItems.map(i => i.name.toLowerCase().trim()));

  // 1. Deleted items — in draft but gone from final
  const deletedItems = draftItems
    .filter(i => !finalNameSet.has(i.name.toLowerCase().trim()))
    .map(i => i.name);

  // 2. Quantity ratios — items that survived, compute final/draft qty ratio
  const quantityRatios: QuoteDelta['quantityRatios'] = [];
  for (const finalItem of finalItems) {
    const draftItem = draftItems.find(
      d => d.name.toLowerCase().trim() === finalItem.name.toLowerCase().trim()
    );
    if (draftItem && draftItem.qty > 0) {
      const ratio = finalItem.qty / draftItem.qty;
      if (Math.abs(ratio - 1) > 0.02) { // only log if non-trivial change
        quantityRatios.push({
          name:     finalItem.name,
          category: detectCategory(finalItem.name),
          ratio,
        });
      }
    }
  }

  // 3. Group order from final
  const groupOrderFinal = final.groups
    .map(g => normalizeGroupName(g.name))
    .filter(Boolean);

  // 4. Brand swaps — item in final has a brand keyword but the draft's same-
  //    category item was generic (no brand keyword)
  const brandSwaps: QuoteDelta['brandSwaps'] = [];
  for (const finalItem of finalItems) {
    const brandInfo = detectBrand(finalItem.name);
    if (!brandInfo) continue;

    // Find a matching draft item in the same category but without the brand
    const correspondingDraft = draftItems.find(d => {
      if (detectBrand(d.name)) return false; // draft also had a brand — skip
      return detectCategory(d.name) === brandInfo.category;
    });

    if (correspondingDraft) {
      brandSwaps.push({
        generic:  correspondingDraft.name,
        brand:    brandInfo.brand,
        category: brandInfo.category,
      });
    }
  }

  return {
    deletedItems,
    quantityRatios,
    groupOrderFinal,
    brandSwaps,
    timestamp: new Date().toISOString(),
  };
}

// ── Core: re-analyse rolling deltas and promote to rules ─────────────────

const MIN_EVIDENCE = 3; // minimum occurrences before a pattern becomes a rule

function analyseDeltas(deltas: QuoteDelta[]): Omit<UserPreferences, 'rawDeltas'> {
  // ── Negative preferences ─────────────────────────────────────────────
  const deletionCount: Record<string, number> = {};
  for (const d of deltas) {
    for (const item of d.deletedItems) {
      const key = item.toLowerCase().trim();
      deletionCount[key] = (deletionCount[key] ?? 0) + 1;
    }
  }
  const negativePreferences = Object.entries(deletionCount)
    .filter(([, count]) => count >= MIN_EVIDENCE)
    .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

  // ── Wastage rules ────────────────────────────────────────────────────
  const ratiosByCategory: Record<string, number[]> = {};
  for (const d of deltas) {
    for (const { category, ratio } of d.quantityRatios) {
      if (ratio <= 0 || ratio > 3) continue; // sanity filter
      ratiosByCategory[category] = ratiosByCategory[category] ?? [];
      ratiosByCategory[category].push(ratio);
    }
  }
  const wastageRules: Record<string, number> = {};
  for (const [cat, ratios] of Object.entries(ratiosByCategory)) {
    if (ratios.length >= MIN_EVIDENCE) {
      const med = median(ratios);
      if (med > 1.02) { // only save if meaningful (>2% add-on)
        wastageRules[cat] = Math.round(med * 100) / 100;
      }
    }
  }

  // ── Document flow ────────────────────────────────────────────────────
  // Pick the group order that appeared most frequently across sessions
  // Represent each session's order as a JSON string for easy comparison
  const orderFrequency: Record<string, number> = {};
  for (const d of deltas) {
    if (d.groupOrderFinal.length > 1) {
      const key = JSON.stringify(d.groupOrderFinal);
      orderFrequency[key] = (orderFrequency[key] ?? 0) + 1;
    }
  }
  const topOrder = Object.entries(orderFrequency)
    .sort(([, a], [, b]) => b - a)[0];
  const documentFlow: string[] = topOrder ? JSON.parse(topOrder[0]) : [];

  // ── Brand loyalty ─────────────────────────────────────────────────
  const brandCount: Record<string, Record<string, number>> = {};
  for (const d of deltas) {
    for (const { category, brand } of d.brandSwaps) {
      brandCount[category] = brandCount[category] ?? {};
      brandCount[category][brand] = (brandCount[category][brand] ?? 0) + 1;
    }
  }
  const brandLoyalty: Record<string, string> = {};
  for (const [cat, brands] of Object.entries(brandCount)) {
    const topBrand = Object.entries(brands)
      .filter(([, count]) => count >= MIN_EVIDENCE)
      .sort(([, a], [, b]) => b - a)[0];
    if (topBrand) brandLoyalty[cat] = topBrand[0];
  }

  return { wastageRules, documentFlow, negativePreferences, brandLoyalty };
}

// ── DB: fetch user preferences ────────────────────────────────────────────

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[BehaviorEngine] Failed to load preferences:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    wastageRules:       data.wastage_rules       ?? {},
    documentFlow:       data.document_flow       ?? [],
    negativePreferences: data.negative_preferences ?? [],
    brandLoyalty:       data.brand_loyalty       ?? {},
    rawDeltas:          data.raw_deltas          ?? [],
  };
}

// ── DB: accumulate delta and update rules ─────────────────────────────────

export async function accumulateEditDelta(
  userId: string,
  draft: Quote,
  final: Quote
): Promise<void> {
  try {
    const delta = extractDelta(draft, final);

    // Skip if nothing changed at all
    const nothingChanged =
      delta.deletedItems.length === 0 &&
      delta.quantityRatios.length === 0 &&
      delta.brandSwaps.length === 0;
    if (nothingChanged) return;

    // Load existing raw_deltas
    const existing = await getUserPreferences(userId);
    const rawDeltas: QuoteDelta[] = [
      ...(existing?.rawDeltas ?? []),
      delta,
    ].slice(-30); // keep rolling window of 30

    // Re-analyse all deltas to produce fresh rules
    const rules = analyseDeltas(rawDeltas);

    // Build human-readable summary for debugging
    const summaryParts: string[] = [];
    for (const [cat, mult] of Object.entries(rules.wastageRules)) {
      summaryParts.push(`+${Math.round((mult - 1) * 100)}% wastage on ${cat}`);
    }
    for (const item of rules.negativePreferences) {
      summaryParts.push(`exclude "${item}"`);
    }
    for (const [cat, brand] of Object.entries(rules.brandLoyalty)) {
      summaryParts.push(`prefers ${brand} for ${cat}`);
    }
    if (rules.documentFlow.length > 0) {
      summaryParts.push(`flow: ${rules.documentFlow.join(' → ')}`);
    }

    const payload = {
      user_id:              userId,
      wastage_rules:        rules.wastageRules,
      document_flow:        rules.documentFlow,
      negative_preferences: rules.negativePreferences,
      brand_loyalty:        rules.brandLoyalty,
      raw_deltas:           rawDeltas,
      summary_text:         summaryParts.length > 0
        ? summaryParts.join('; ')
        : 'No strong patterns yet',
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('[BehaviorEngine] Failed to save preferences:', error.message);
    } else {
      console.log('[BehaviorEngine] Rules updated:', payload.summary_text);
    }
  } catch (e) {
    console.warn('[BehaviorEngine] Accumulation error:', e);
  }
}

// ── Build natural-language block for AI system prompt ─────────────────────

export function buildPreferencesPrompt(prefs: UserPreferences | null): string {
  if (!prefs) return '';

  const rules: string[] = [];

  // Wastage multipliers
  for (const [cat, mult] of Object.entries(prefs.wastageRules)) {
    const pct = Math.round((mult - 1) * 100);
    rules.push(`Always add ${pct}% wastage to all ${cat} quantities (multiply qty × ${mult}).`);
  }

  // Negative preferences
  for (const item of prefs.negativePreferences) {
    rules.push(`Do NOT include "${item}" — this user always removes it.`);
  }

  // Brand loyalty
  for (const [cat, brand] of Object.entries(prefs.brandLoyalty)) {
    rules.push(`Use "${brand}" as the specific brand for any ${cat} items (e.g., "${brand} Cement" not just "Cement").`);
  }

  // Document flow
  if (prefs.documentFlow.length > 1) {
    rules.push(`Structure the quote groups in this exact order: ${prefs.documentFlow.join(' → ')}.`);
  }

  if (rules.length === 0) return '';

  return `
USER LEARNING PROFILE — PERSONALISATION RULES (HIGHEST PRIORITY — apply before generating):
${rules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}

These rules were learned from this user's editing history. Apply ALL of them automatically.
The goal is a "zero-edit" draft that already matches this user's working style.
`;
}
