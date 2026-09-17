/**
 * One place for Naira formatting.
 *
 * Six files had grown their own `formatNGN`, which is how the app ended up
 * with prices formatted three slightly different ways depending on which
 * screen you were on.
 *
 * On the rendering side: the ₦ glyph has effectively no right side-bearing in
 * Inter's bolder weights — its ink reaches the very edge of its advance box —
 * so `₦425,200` renders with the crossbars touching the first digit. It reads
 * as a strikethrough at a glance, which is the last thing you want on a price.
 * `<Money>` fixes that by giving the symbol a sliver of its own tracking,
 * without putting a real space in the text (so copy-paste still yields
 * "₦425,200", and the value stays one unbreakable unit).
 *
 * Use `<Money>` wherever a price is shown in the UI. Use `formatNGN` only
 * where a plain string is required — a `title` attribute, an aria-label, a
 * toast, a PDF, or a filename.
 */

const NGN = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

const NGN_WITH_KOBO = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Plain string, e.g. "₦425,200". For attributes, toasts, PDFs and filenames. */
export function formatNGN(amount: number, opts: { kobo?: boolean } = {}): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `₦${(opts.kobo ? NGN_WITH_KOBO : NGN).format(n)}`;
}

/** Digits only, e.g. "425,200" — for when the symbol is rendered separately. */
export function formatNGNAmount(amount: number, opts: { kobo?: boolean } = {}): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return (opts.kobo ? NGN_WITH_KOBO : NGN).format(n);
}

interface MoneyProps {
  amount: number;
  /** Show kobo (2dp). Off by default — trade quotes are quoted in whole Naira. */
  kobo?: boolean;
  className?: string;
  /** Dim the ₦ slightly so the number carries the emphasis. */
  mutedSymbol?: boolean;
}

/**
 * A price. The ₦ crossbars extend past the stem and the glyph has almost no
 * right side-bearing, so 0.16em is what it takes to stop the symbol reading
 * as a strikethrough through the first digit. Keeps the value unbreakable.
 */
export function Money({ amount, kobo = false, className = "", mutedSymbol = false }: MoneyProps) {
  return (
    // The symbol stays in the text (not aria-hidden) so screen readers still
    // announce the currency — the two spans are concatenated when read.
    <span className={`whitespace-nowrap tabular-nums ${className}`}>
      <span className={`mr-[0.16em] ${mutedSymbol ? "opacity-70" : ""}`}>₦</span>
      {formatNGNAmount(amount, { kobo })}
    </span>
  );
}
