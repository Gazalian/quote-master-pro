/**
 * Prompt assembly — split into a STATIC half (cacheable, ~95% identical across
 * users in the same trade/location) and a DYNAMIC half (per-request: user
 * message, conversation history, price log, pending questions).
 *
 * The static half is keyed by (trade, location) and memoized so the same
 * trade-and-state pair pays the JSON-schema/knowledge-base cost only once
 * per process boot.
 */

import { MemoryCache } from '../cache/memory.js';
import type {
  ConversationTurn,
  PriceLogEntry,
  QuoteContext,
  RegionalPriceEntry,
  UserPreferences,
} from '../types/domain.js';

// 30 minutes is a sweet spot — pricing knowledge is daily-stable.
const staticCache = new MemoryCache<string, string>(30 * 60 * 1000);

const TRADE_BASELINES: Record<string, string> = {
  electrician: `
  16mm single-core cable (100m coil): ₦18,000–₦26,000
  10mm single-core cable (100m coil): ₦12,000–₦18,000
  6mm  single-core cable (100m coil): ₦8,500–₦13,000
  2.5mm single-core cable (100m coil): ₦4,500–₦7,000
  1.5mm single-core cable (100m coil): ₦3,000–₦5,000
  25mm PVC conduit (bundle/30 lengths): ₦12,000–₦18,000
  13A socket outlet: ₦800–₦1,800 each
  1-gang switch: ₦400–₦1,000 each
  MCB breaker (10A–32A): ₦2,000–₦4,500 each
  8-way distribution board: ₦25,000–₦45,000`,
  plumbing: `
  4-inch PVC drainage pipe (length): ₦4,500–₦7,500
  3/4-inch UPVC pressure pipe (length): ₦1,200–₦2,200
  WC suite (standard): ₦45,000–₦90,000
  Wash hand basin: ₦18,000–₦45,000
  Kitchen sink (stainless): ₦18,000–₦55,000`,
  builder: `
  Dangote/BUA cement (50kg bag): ₦6,000–₦8,500
  Sharp sand (tipper trip ~5 tons): ₦28,000–₦50,000
  Granite/gravel (tipper trip): ₦35,000–₦60,000
  6-inch sandcrete block (each): ₦550–₦800
  9-inch sandcrete block (each): ₦700–₦1,000
  Bricklaying labour (per sqm): ₦1,800–₦3,200`,
  painter: `
  Emulsion paint 20L (standard): ₦16,000–₦28,000
  Emulsion paint 20L (premium Dulux/Berger): ₦35,000–₦60,000
  Gloss/oil paint 4L: ₦8,000–₦16,000
  Wall putty 20kg: ₦5,000–₦9,000
  Painting labour per room (walls + ceiling): ₦25,000–₦55,000`,
  tiler: `
  Floor tiles 60x60 (sqm): ₦4,500–₦8,500
  Wall tiles 30x60 (sqm): ₦3,800–₦7,500
  Tile adhesive 25kg: ₦5,000–₦9,000
  Tiling labour (per sqm): ₦2,500–₦4,500`,
  carpenter: `
  Marine plywood 18mm (sheet): ₦18,000–₦26,000
  2x3 wood (length): ₦1,200–₦2,000
  Door frame (treated): ₦12,000–₦22,000
  Carpentry labour (per day): ₦8,000–₦15,000`,
};

function normaliseTrade(t: string): string {
  const v = t.toLowerCase();
  if (v.includes('elect')) return 'electrician';
  if (v.includes('plumb')) return 'plumbing';
  if (v.includes('build') || v.includes('mason')) return 'builder';
  if (v.includes('paint')) return 'painter';
  if (v.includes('tile')) return 'tiler';
  if (v.includes('carpent')) return 'carpenter';
  return 'general';
}

function compactQuoteForPrompt(quote: QuoteContext): Record<string, unknown> {
  return {
    ref: quote.ref,
    client: quote.client,
    description: quote.description,
    templateStyle: quote.templateStyle,
    status: quote.status,
    version: quote.version,
    grandTotal: quote.grandTotal,
    groups: (quote.groups ?? []).slice(0, 20).map((group) => ({
      name: group.name,
      items: (group.items ?? []).slice(0, 60).map((item) => ({
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
        source: item.source,
        regionName: item.regionName,
      })),
    })),
  };
}

/**
 * The cacheable system prompt — same content for every user with the same
 * (trade, location). Excludes anything user-specific.
 */
export function buildStaticPrompt(rawTrade: string, location: string): string {
  const trade = normaliseTrade(rawTrade);
  const key = `${trade}::${location}`;
  const cached = staticCache.get(key);
  if (cached) return cached;

  const baseline = TRADE_BASELINES[trade] ?? '';
  const prompt = `You are OtoQuote AI — Nigeria's expert quotation assistant for tradespeople.

PERSONA: Sound like a knowledgeable senior tradesperson or Oga foreman. Direct, confident, brief.

ACTION-FIRST RULE (NON-NEGOTIABLE):
1. ALWAYS generate a complete quotation — NEVER withhold a quote to ask questions first.
2. Fill every gap using your Nigerian construction knowledge.
3. Tag all assumed values with source = "ai_estimate".
4. AFTER generating, you MAY include at most 2 follow-up questions in clarifyingQuestions.
5. Never ask questions already answered in the conversation history.
6. NEVER return an empty categories array — always include at least Materials + Labour.

NIGERIAN CONSTRUCTION KNOWLEDGE BASE — default specs for a 3-bedroom flat:
  Electrical: 32–38 wiring points, 3 coils 2.5mm, 2 coils 1.5mm, 1 coil 6mm, 8 bundles 25mm conduit, 1 DB (8-way MCB). Labour: 3 electricians × 6 days.
  Plumbing: 15 lengths 3/4" UPVC, 10 lengths 1/2" UPVC, 8 lengths 4" PVC, 4 lengths 3" PVC, 3 WCs, 3 basins, 1 sink. Labour: 2 plumbers × 6 days.
  Block-work: 3,200 6-inch sandcrete blocks, 300 bags cement, 8 trips sharp sand, 5 trips plaster sand. Labour: 3 masons + 2 labourers × 15 days.

STANDARD DAILY LABOUR RATES (${location} baseline, ±20% by state):
  Skilled trade: ₦10,000–₦18,000/day
  Semi-skilled: ₦7,000–₦12,000/day
  Labourer: ₦4,000–₦7,000/day
  Foreman: ₦15,000–₦25,000/day

MATERIAL NAMING — use exact Nigerian market terms (Bundles of conduit = 30 lengths; Coils of cable = 100m; Dangote/BUA cement = 50kg bag; Sandcrete blocks; UPVC vs PVC).

INFORMAL LANGUAGE MAPPING:
  "Wire house" → electrical wiring installation
  "Fix POP" → POP ceiling installation
  "Changeover" → changeover/transfer switch
  "Throw current" → connect to mains

PRICING HIERARCHY (strict order):
1. USER'S PERSONAL PRICE LOG (injected per-request, HIGHEST PRIORITY, use exact)
2. REGIONAL MARKET CONSENSUS (injected per-request, source = "regional_price")
3. NIGERIAN NATIONAL BASELINE (your knowledge, fallback only, source = "ai_estimate")

NATIONAL BASELINE ESTIMATES (${location} region):${baseline}

NIGERIAN CONTEXT:
Currency: ALWAYS ₦ (Naira). Market: ${location}.
Categories: Materials, Labour, Transportation (heavy/bulk only), Miscellaneous (5–8% contingency).
Labour is ALWAYS a separate category — never bundled with materials. VAT is NOT included.

OUTPUT RULES:
- categories must NEVER be empty
- total = quantity × unitPrice exactly
- grandTotal = sum of all item totals exactly
- source = "my_price" only if matched user price log
- source = "regional_price" only if matched regional consensus; also set regionName = "${location}"
- source = "ai_estimate" for everything else
- confidence "low" is ONLY for completely unintelligible input — still generate a quote`;

  staticCache.set(key, prompt);
  return prompt;
}

/**
 * Per-request dynamic prompt — user message, conversation, pending questions,
 * personal price log, regional prices, learned preferences. Kept compact: only
 * the last N turns of conversation are included.
 */
export function buildDynamicPrompt(input: {
  userMessage: string;
  conversationHistory?: ConversationTurn[];
  currentQuote?: QuoteContext | null;
  hasImages: boolean;
  priceLogEntries?: PriceLogEntry[];
  regionalPrices?: RegionalPriceEntry[];
  userPreferences?: UserPreferences | null;
  pendingQuestions?: string[];
  location: string;
}): string {
  let prompt = '';

  // Learned preferences (highest priority — applied automatically)
  if (input.userPreferences) {
    const rules: string[] = [];
    for (const [cat, mult] of Object.entries(input.userPreferences.wastageRules ?? {})) {
      rules.push(`Add ${Math.round((mult - 1) * 100)}% wastage to all ${cat} (× ${mult}).`);
    }
    for (const item of input.userPreferences.negativePreferences ?? []) {
      rules.push(`Do NOT include "${item}" — user always removes it.`);
    }
    for (const [cat, brand] of Object.entries(input.userPreferences.brandLoyalty ?? {})) {
      rules.push(`Use "${brand}" brand for any ${cat} items.`);
    }
    if ((input.userPreferences.documentFlow ?? []).length > 1) {
      rules.push(`Order groups: ${input.userPreferences.documentFlow.join(' → ')}.`);
    }
    if (rules.length > 0) {
      prompt += `USER LEARNING PROFILE (HIGHEST PRIORITY — apply automatically):\n${rules.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}\n\n`;
    }
  }

  // Personal price log
  if (input.priceLogEntries && input.priceLogEntries.length > 0) {
    prompt += `USER'S PRICE LOG (HIGHEST PRIORITY — use exact prices, source = "my_price"):\n`;
    for (const e of input.priceLogEntries.slice(0, 60)) {
      prompt += `  - ${e.item_name}: ₦${e.price.toLocaleString('en-NG')} per ${e.unit}\n`;
    }
    prompt += '\n';
  }

  // Regional consensus prices (only consensus entries — second-highest priority)
  if (input.regionalPrices && input.regionalPrices.length > 0) {
    const consensus = input.regionalPrices.filter((p) => p.is_consensus);
    if (consensus.length > 0) {
      prompt += `REGIONAL CONSENSUS — ${input.location} (source = "regional_price", regionName = "${input.location}"):\n`;
      for (const p of consensus.slice(0, 40)) {
        prompt += `  - ${p.material_name}: ₦${Math.round(p.median_price_ngn).toLocaleString('en-NG')} (${p.contributor_count} contributors)\n`;
      }
      prompt += '\n';
    }
  }

  // Current quote context comes before chat history so follow-up edits anchor
  // to the latest quotation instead of reconstructing from prose.
  if (input.currentQuote && (input.currentQuote.groups?.length ?? 0) > 0) {
    prompt += `CURRENT QUOTATION TO MODIFY (AUTHORITATIVE BASELINE):\n`;
    prompt += `${JSON.stringify(compactQuoteForPrompt(input.currentQuote), null, 2)}\n\n`;
    prompt += `QUOTE MODIFICATION RULES:\n`;
    prompt += `  1. Treat the current quotation above as the latest saved/edited state.\n`;
    prompt += `  2. Apply the user's newest instruction incrementally; do not restart from scratch unless explicitly asked.\n`;
    prompt += `  3. Preserve existing client, scope, groups, items, quantities, units, prices, and source labels unless the conversation asks to change them.\n`;
    prompt += `  4. Preserve source = "my_price" prices unless the user explicitly changes that item price.\n`;
    prompt += `  5. Return a complete updated quotation, not a diff or explanation-only response.\n\n`;
  }

  // Conversation (last 12 turns — keeps token cost bounded)
  if (input.conversationHistory && input.conversationHistory.length > 0) {
    const recent = input.conversationHistory.slice(-12);
    prompt += `CONVERSATION HISTORY:\n`;
    for (const t of recent) prompt += `${t.role === 'user' ? 'Customer' : 'AI'}: ${t.content}\n`;
    prompt += '\n';
  }

  prompt += `CURRENT REQUEST:\n${input.userMessage}\n\n`;

  if (input.hasImages) {
    prompt += `IMAGES ATTACHED — analyse them for scope, space, and condition.\n\n`;
  }

  if (input.pendingQuestions && input.pendingQuestions.length > 0) {
    prompt += `PENDING QUESTIONS FROM PREVIOUS TURN:\n`;
    input.pendingQuestions.forEach((q, i) => (prompt += `  ${i + 1}. ${q}\n`));
    prompt += `Check above to see if customer answered. Re-ask only still-unanswered ones (max 2).\n\n`;
  }

  prompt += `ACTION: Generate the complete professional quotation now. Respect the current quotation, previous chat instructions, personal prices, regional prices, and the latest request.`;
  return prompt;
}

/** Hook for tests / metrics. */
export function clearPromptCache(): void {
  staticCache.clear();
}
