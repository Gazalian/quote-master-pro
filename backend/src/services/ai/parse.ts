/**
 * Shared QuoteDraft parser.  Lives in the AI layer (not on any provider) so
 * both OpenAI and Gemini paths go through identical validation and shaping.
 */

import { ApiError } from '../../middleware/error.js';
import { logger } from '../../utils/logger.js';
import type { PriceSource, QuoteContext, QuoteDraft, QuoteGroup } from '../../types/domain.js';

interface RawQuoteItem {
  name?: unknown;
  quantity?: unknown;
  unit?: unknown;
  unitPrice?: unknown;
  source?: unknown;
  regionName?: unknown;
}

interface RawQuoteCategory {
  name?: unknown;
  items?: RawQuoteItem[];
}

interface RawQuoteResponse {
  clientName?: unknown;
  projectTitle?: unknown;
  categories?: RawQuoteCategory[];
  reasoning?: string;
  confidence?: 'high' | 'medium' | 'low';
  clarifyingQuestions?: string[];
}

export function parseQuoteDraft(
  raw: string,
  opts: { currentQuote?: QuoteContext | null } = {},
): QuoteDraft {
  let parsed: RawQuoteResponse;
  try {
    parsed = JSON.parse(raw) as RawQuoteResponse;
  } catch {
    logger.warn({ rawPreview: raw.slice(0, 200) }, 'AI returned non-JSON despite structured schema');
    throw new ApiError(502, 'AI returned malformed response');
  }

  if (!Array.isArray(parsed.categories)) {
    logger.warn({ rawPreview: raw.slice(0, 200) }, 'AI response missing categories array');
    throw new ApiError(502, 'AI returned malformed response');
  }

  const groups: QuoteGroup[] = parsed.categories
    .filter((c): c is RawQuoteCategory & { items: RawQuoteItem[] } => !!c && Array.isArray(c.items) && c.items.length > 0)
    .map((c, gi: number) => ({
      id: `g-${gi}-${cryptoRandom()}`,
      name: stringOrDefault(c.name, 'Materials'),
      items: c.items
        .filter((it): it is RawQuoteItem & { name: unknown } => !!it && !!it.name)
        .map((it, ii: number) => {
          const qty = positiveNumber(it.quantity, 1);
          const unitPrice = positiveNumber(it.unitPrice, 0);
          const source = normaliseSource(it.source);
          return {
            id: `i-${gi}-${ii}-${cryptoRandom()}`,
            name: String(it.name),
            qty,
            unit: stringOrDefault(it.unit, 'unit'),
            unitPrice,
            total: roundMoney(qty * unitPrice),
            source,
            ...(source === 'regional_price' && it.regionName ? { regionName: String(it.regionName) } : {}),
          };
        }),
    }));

  const calcTotal = groups.reduce(
    (s, g) => s + g.items.reduce((ss, i) => ss + (i.total || 0), 0),
    0,
  );

  if (groups.length === 0 || calcTotal <= 0) {
    logger.warn({ rawPreview: raw.slice(0, 200) }, 'AI response produced an empty quote');
    throw new ApiError(502, 'AI returned empty quotation');
  }

  return {
    ref: opts.currentQuote?.ref ?? newQuoteRef(),
    client: stringOrDefault(parsed.clientName, opts.currentQuote?.client || 'Client Name'),
    description: stringOrDefault(parsed.projectTitle, 'AI Generated Quotation'),
    groups,
    grandTotal: roundMoney(calcTotal),
    templateStyle: opts.currentQuote?.templateStyle ?? 'modern',
    reasoning: parsed.reasoning,
    confidence: parsed.confidence,
    clarifyingQuestions: parsed.clarifyingQuestions ?? [],
  };
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function newQuoteRef(): string {
  return `OQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`;
}

function positiveNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normaliseSource(value: unknown): PriceSource {
  return value === 'my_price' || value === 'regional_price' || value === 'ai_estimate'
    ? value
    : 'ai_estimate';
}

function cryptoRandom(): string {
  return globalThis.crypto.randomUUID().slice(0, 8);
}
