/**
 * The trades OtoQuote ships with. These are the exact options in the sign-up
 * form (`pages/AuthPage.tsx` TRADE_TYPES) — not an aspirational list.
 */
export const TRADES = [
  "Electricians",
  "Plumbers",
  "Builders & Masons",
  "Painters",
  "Carpenters",
  "Tilers",
  "Welders & Fabricators",
  "AC & Refrigeration",
  "Generator Technicians",
  "Borehole Drillers",
] as const;

export function TradeStrip() {
  // Duplicated once so the -50% translate loops seamlessly. The copy is
  // aria-hidden; the visible list is announced once.
  const items = [...TRADES, ...TRADES];

  return (
    <section aria-label="Trades OtoQuote supports" className="border-y border-ink-100 bg-white py-5">
      <p className="lp-container mb-4 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-300">
        Quoting every day for
      </p>

      <div
        className="lp-marquee relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        <ul className="lp-marquee-track items-center">
          {items.map((trade, i) => (
            <li
              key={`${trade}-${i}`}
              aria-hidden={i >= TRADES.length ? "true" : undefined}
              className="flex items-center whitespace-nowrap px-5 font-display text-lg font-bold text-ink-700 sm:px-7 sm:text-xl"
            >
              {trade}
              <span aria-hidden="true" className="ml-5 h-1.5 w-1.5 rotate-45 bg-brand-orange sm:ml-7" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
