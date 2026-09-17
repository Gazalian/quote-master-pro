import { Brain, MapPin, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Eyebrow, Reveal, SectionLead, SectionTitle } from "./primitives";
import { SourceBadge, type Source } from "./QuoteVisuals";

interface SourceColumn {
  source: Source;
  icon: LucideIcon;
  rank: string;
  title: string;
  body: string;
  accent: string;
}

/**
 * Mirrors the PRICING HIERARCHY in `backend/src/services/prompt.service.ts`.
 * The order on the page is the order the model is required to apply.
 */
const COLUMNS: SourceColumn[] = [
  {
    source: "my_price",
    icon: Wallet,
    rank: "First",
    title: "Your own price",
    body: "Anything in your price log is used exactly as you saved it. Save a rate once from the editor and the AI is never allowed to talk you out of it again — not on this quote, and not when you revise it later.",
    accent: "text-brand-green-ink",
  },
  {
    source: "regional_price",
    icon: MapPin,
    rank: "Second",
    title: "What your state is paying",
    body: "The median price other tradespeople in your state have logged for that material. It's anonymous, and it's only published once at least five of them agree within 7.5% — so a single odd figure can't move it.",
    accent: "text-brand-blue",
  },
  {
    source: "ai_estimate",
    icon: Brain,
    rank: "Last",
    title: "A Nigerian market estimate",
    body: "Used only where neither of the above has an answer, based on current Nigerian trade baselines. Correct it once and it becomes your price for every job after this one.",
    accent: "text-brand-orange-ink",
  },
];

const LEARNED = [
  {
    title: "Wastage you always add",
    body: "Add 15% to every tile order and OtoQuote starts doing it for you.",
  },
  {
    title: "Lines you always delete",
    body: "Strike the same mobilisation fee three times and it stops appearing.",
  },
  {
    title: "Brands you always specify",
    body: "Dangote cement, Nigerchin wire, Dulux paint — named by default.",
  },
  {
    title: "The order you like",
    body: "Your group ordering is kept across every quotation you generate.",
  },
];

export function PriceTrust() {
  return (
    <section className="border-y border-ink-100 bg-white py-16 sm:py-20 lg:py-28">
      <div className="lp-container">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow index="04">The numbers</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <SectionTitle className="mt-4">
              Every line tells you where its price came from.
            </SectionTitle>
          </Reveal>
          <Reveal delay={120}>
            <SectionLead className="mt-5">
              An estimate you can't check is an estimate you can't defend to a client. OtoQuote
              labels each item with the source of its price, and the order of priority never
              changes.
            </SectionLead>
          </Reveal>
        </div>

        <ol className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-3">
          {COLUMNS.map((col, i) => {
            const Icon = col.icon;
            return (
              <Reveal
                as="li"
                key={col.source}
                delay={i * 80}
                className="relative flex flex-col rounded-2xl border border-ink-100 bg-paper p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-ink-100 ${col.accent}`}>
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <SourceBadge source={col.source} />
                </div>

                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-300">
                  {col.rank} priority
                </p>
                <h3 className="mt-1.5 font-display text-lg font-bold leading-snug tracking-[-0.015em] text-ink-900">
                  {col.title}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{col.body}</p>
              </Reveal>
            );
          })}
        </ol>

        {/* Learned preferences — the quieter half of the same promise. */}
        <Reveal delay={120}>
          <div className="mt-6 overflow-hidden rounded-2xl bg-ink-900 sm:mt-8">
            <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
              <div>
                <Eyebrow tone="orange" onDark>
                  And it learns your corrections
                </Eyebrow>
                <h3 className="mt-4 font-display text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-[1.75rem]">
                  Every edit you make is a rule for next time.
                </h3>
                <p className="mt-4 text-[14.5px] leading-relaxed text-ink-400">
                  OtoQuote compares what it drafted against what you actually sent, and carries the
                  difference forward. Nothing to configure.
                </p>
              </div>

              <ul className="grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2">
                {LEARNED.map((item) => (
                  <li key={item.title} className="bg-ink-900 p-4">
                    <p className="font-display text-[13.5px] font-bold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
