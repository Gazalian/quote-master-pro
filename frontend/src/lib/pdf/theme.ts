/**
 * Design tokens for the premium PDF.  Pulled out of the JSX so the document
 * file stays focused on layout, and so we have one place to retune the look.
 *
 * Color system:
 *   - `accent` is derived from the user's brand primary (HSL string from
 *     BrandSettings.docPrimary, e.g. "212 100% 41%"). Falls back to a calm
 *     corporate navy if the user hasn't set one.
 *   - All neutrals come from a single grayscale ladder so the document never
 *     looks "soup-ish" — a common failure on auto-generated PDFs.
 *
 * Typography uses react-pdf's built-in Helvetica.  Helvetica is bundled in
 * every PDF reader so there's no network fetch, no CORS concern, and no font
 * 404s.  Trade-off: Helvetica doesn't carry the ₦ glyph (U+20A6), so we use
 * the ISO currency code "NGN" in formatters (see formatters.ts).
 *
 * To upgrade later to a custom font (e.g. Inter with the ₦ glyph):
 *   1. Drop the .ttf files into `public/fonts/`.
 *   2. Set FONT_FAMILY = 'Inter' here.
 *   3. Re-add a Font.register call in QuotationPDF.tsx using `/fonts/...` URLs.
 *   4. Switch formatters back to the ₦ symbol.
 */

export const FONT_FAMILY = 'Helvetica';

/** Resolve a hex color from BrandSettings.docPrimary ("H S% L%" or undefined). */
export function brandHexOrDefault(hslString: string | undefined | null, fallback = '#0F2540'): string {
  if (!hslString) return fallback;
  const parts = hslString.trim().split(/\s+/);
  if (parts.length < 3) return fallback;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) return fallback;
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export const NEUTRAL = {
  ink: '#0B1220',        // strongest text — headlines, totals
  body: '#1F2937',       // body copy
  muted: '#6B7280',      // labels, secondary metadata
  hairline: '#E5E7EB',   // table borders, dividers
  surface: '#F9FAFB',    // zebra rows, panel backgrounds
  faint: '#F3F4F6',      // very subtle wash
  white: '#FFFFFF',
  emerald: '#059669',    // status pills (paid, accepted)
  amber: '#D97706',      // pending / awaiting client
} as const;

export const TYPE = {
  // Sizes are in pt (react-pdf default unit). A4 portrait usable area = ~525pt × 765pt.
  micro: 7,
  caption: 8,
  small: 9,
  body: 10,
  lead: 11,
  h4: 13,
  h3: 16,
  h2: 22,
  h1: 30,
} as const;

export const SPACE = {
  pageMargin: 36,        // ~12.7mm — generous but not wasteful
  sectionGap: 18,
  groupGap: 10,
  rowPadX: 8,
  rowPadY: 6,
} as const;
