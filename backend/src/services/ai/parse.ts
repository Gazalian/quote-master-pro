/**
 * Shared QuoteDraft parser.  Lives in the AI layer (not on any provider) so
 * both OpenAI and Gemini paths go through identical validation and shaping.
 */

import { ApiError } from '../../middleware/error.js';
import { logger } from '../../utils/logger.js';
import type { PriceSource, QuoteDraft, QuoteGroup } from '../../types/domain.js';

export function parseQuoteDraft(raw: string): QuoteDraft {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.warn({ rawPreview: raw.slice(0, 200) }, 'AI returned non-JSON despite structured schema');
    throw new ApiError(502, 'AI returned malformed response');
  }

  if (!Array.isArray(parsed.categories)) {
    logger.warn({ rawPreview: raw.slice(0, 200) }, 'AI response missing categories array');
    throw new ApiError(502, 'AI returned malformed response');
  }

  const groups: QuoteGroup[] = parsed.categories
    .filter((c: any) => c && Array.isArray(c.items) && c.items.length > 0)
    .map((c: any, gi: number) => ({
      id: `g-${gi}-${cryptoRandom()}`,
      name: c.name || 'Materials',
      items: c.items
        .filter((it: any) => it && it.name)
        .map((it: any, ii: number) => {
          const qty = positiveNumber(it.quantity, 1);
          const unitPrice = positiveNumber(it.unitPrice, 0);
          const source = normaliseSource(it.source);
          return {
            id: `i-${gi}-${ii}-${cryptoRandom()}`,
            name: String(it.name),
            qty,
            unit: it.unit || 'unit',
            unitPrice,
            total: roundMoney(qty * unitPrice),
            source,
            ...(source === 'regional_price' && it.regionName ? { regionName: it.regionName } : {}),
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
    ref: `OQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`,
    client: parsed.clientName || 'Client Name',
    description: parsed.projectTitle || 'AI Generated Quotation',
    groups,
    grandTotal: roundMoney(calcTotal),
    templateStyle: 'modern',
    reasoning: parsed.reasoning,
    confidence: parsed.confidence,
    clarifyingQuestions: parsed.clarifyingQuestions ?? [],
  };
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
