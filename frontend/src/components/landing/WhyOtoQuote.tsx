import { Eyebrow, Reveal, SectionLead, SectionTitle } from "./primitives";

/**
 * Product coverage — deliberately NOT usage statistics.
 *
 * There is no analytics or traction data anywhere in this codebase, so
 * inventing "5,000+ tradespeople" numbers here would be fabrication. Every
 * figure below is a countable property of what ships:
 *   - trades        → TRADE_TYPES in pages/AuthPage.tsx
 *   - states        → NIGERIAN_STATES in pages/AuthPage.tsx
 *   - templates     → components/templates/*
 *   - AI providers  → backend/src/services/ai/factory.ts (primary + failover)
 *
 * When real usage numbers exist, replace this array — the layout takes them
 * as-is.
 */
const COVERAGE = [
  { figure: "10", label: "Trades, plus a general option" },
  { figure: "36+1", label: "States and the FCT" },
  { figure: "3", label: "Quotation document templates" },
  { figure: "2", label: "AI models, with automatic failover" },
];

const REASONS = [
  {
    title: "It speaks the way the site speaks",
    body: "“Wire house”, “fix POP”, “changeover”, “throw current” — OtoQuote maps informal Nigerian trade language onto the right scope of work instead of asking you to rephrase it.",
  },
  {
    title: "It quotes in units you'd actually order in",
    body: "Coils of cable, bundles of conduit, trips of sand, bags of cement, lengths of pipe. Labour is always its own section, and VAT is never added unless you add it.",
  },
  {
    title: "Your prices outrank the AI",
    body: "The model is instructed to use your saved rates exactly, and to preserve them when it revises a quote. The AI fills gaps — it doesn't overrule you.",
  },
  {
    title: "Your work stays yours",
    body: "Every quotation, price and chat is scoped to your account by database row-level security. AI keys live on the server and never reach the browser.",
  },
];

export function WhyOtoQuote() {
  return (
    <section className="py-16 sm:py-20 lg:py-28">
      <div className="lp-container">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow index="07">Why OtoQuote</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <SectionTitle className="mt-4">
              General-purpose AI guesses. This one was taught the trade.
            </SectionTitle>
          </Reveal>
          <Reveal delay={120}>
            <SectionLead className="mt-5">
              You could paste your job into any chatbot and get a list back. What you wouldn't get is
              Nigerian pricing, Nigerian units, your own rates, or a document your client will take
              seriously.
            </SectionLead>
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-ink-100 bg-ink-100 sm:mt-14 sm:grid-cols-2">
          {REASONS.map((reason, i) => (
            <Reveal as="li" key={reason.title} delay={(i % 2) * 70} className="bg-white p-6 sm:p-7">
              <h3 className="font-display text-[17px] font-bold leading-snug tracking-[-0.015em] text-ink-900">
                {reason.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{reason.body}</p>
            </Reveal>
          ))}
        </ul>

        {/* ── Coverage band ── */}
        <Reveal delay={100}>
          <div className="mt-6 rounded-2xl border border-ink-100 bg-paper p-6 sm:mt-8 sm:p-8">
            <Eyebrow tone="muted">What ships today</Eyebrow>
            <dl className="mt-6 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
              {COVERAGE.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-extrabold tabular-nums tracking-[-0.03em] text-brand-blue sm:text-4xl">
                      {stat.figure}
                    </span>
                    <span className="mt-1.5 block text-[13px] leading-snug text-ink-500">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            {/* Honest positioning in place of invented social proof. Replace
                this block with real testimonials once there are real users to
                quote — do not pre-fill it. */}
            <p className="mt-7 border-t border-ink-100 pt-5 text-[13.5px] leading-relaxed text-ink-500">
              OtoQuote is early. There are no borrowed logos or invented review counts on this page —
              when tradespeople have something to say about it, their words will go here, with their
              names on them.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
