/**
 * Pure formatting helpers for the PDF.  No React, no react-pdf imports.
 * Keeps the document component free of inline number/date juggling.
 */

/**
 * Currency formatter for PDF output.  Uses the "NGN" ISO code instead of the
 * ₦ symbol because the bundled Helvetica font in react-pdf does not carry
 * the ₦ glyph (U+20A6) — printing it produces a tofu box on the PDF. NGN is
 * the formal ISO 4217 code and is standard on Nigerian commercial invoices.
 *
 * If you later register a font that carries ₦ (e.g. self-hosted Inter), swap
 * the prefix back to the symbol here in one place.
 */
export function formatNaira(amount: number, opts: { withSymbol?: boolean; decimals?: boolean } = {}): string {
  const { withSymbol = true, decimals = true } = opts;
  const n = Number.isFinite(amount) ? amount : 0;
  const formatted = n.toLocaleString('en-NG', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  return withSymbol ? `NGN ${formatted}` : formatted;
}

export function formatDateLong(input?: string | Date): string {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function addDays(input: string | Date | undefined, days: number): Date {
  const base = input ? new Date(input) : new Date();
  const out = Number.isNaN(base.getTime()) ? new Date() : base;
  out.setDate(out.getDate() + days);
  return out;
}

/** "Quotation_Acme-Ltd_2026-05-18.pdf" — safe across OSes. */
export function safeFileName(parts: { docType: string; client: string; date?: Date }): string {
  const d = parts.date ?? new Date();
  const iso = d.toISOString().split('T')[0];
  const client = (parts.client || 'Client').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  return `${parts.docType}_${client}_${iso}.pdf`;
}
