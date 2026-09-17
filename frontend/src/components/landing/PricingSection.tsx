import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import { features } from "@/lib/featureFlags";

import { Eyebrow, Reveal, SectionLead, SectionTitle } from "./primitives";

/**
 * Everything is free while the monetization flags are off, which is the
 * default posture in `lib/featureFlags.ts`. The paid tiers are gated behind
 * `features.billing.enabled` in the app; if that is ever flipped on, this
 * section needs the plan table put back — deliberately not carried over as
 * dead markup.
 */
const INCLUDED = [
  "Unlimited AI-generated quotations",
  "Unlimited PDF exports and invoices",
  "All three document templates",
  "Your logo, colours and CAC details",
  "Personal price log and regional pricing",
  "Site photo analysis in chat",
  "Full chat and quotation history",
  "Install as an app on any phone",
];

export function PricingSection() {
  const navigate = useNavigate();
  const billingOn = features.billing.enabled;

  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-y border-ink-100 bg-white py-16 sm:py-20 lg:py-28"
    >
      <div className="lp-container">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow index="08">Pricing</Eyebrow>
            </Reveal>
            <Reveal delay={60}>
              <SectionTitle className="mt-4">
                {billingOn ? "Pay only for what you use." : "Free. The whole thing."}
              </SectionTitle>
            </Reveal>
            <Reveal delay={120}>
              <SectionLead className="mt-5">
                {billingOn
                  ? "Buy points as you need them. Points never expire and there is no monthly subscription."
                  : "No card, no trial countdown, no usage cap and no feature held back for a paid tier. If it's in the app, it's in your account."}
              </SectionLead>
            </Reveal>

            {!billingOn && (
              <Reveal delay={180}>
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(0,86,210,0.7)] transition-all hover:bg-brand-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 active:translate-y-px"
                  >
                    Create your account
                    <ArrowRight
                      size={18}
                      className="transition-transform motion-safe:group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-300">
                    Takes about a minute
                  </p>
                </div>
              </Reveal>
            )}
          </div>

          <Reveal delay={140}>
            <div className="rounded-2xl border border-ink-100 bg-paper p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display text-5xl font-extrabold tracking-[-0.04em] text-ink-900">
                  {/* The naira crossbars overshoot the glyph's advance box, so
                      at this size the display face's negative tracking drives
                      ₦ straight into the 0. Set the symbol in the monospace
                      face (fixed cell, no overshoot) at its own tracking. */}
                  <span className="mr-1.5 font-mono text-[0.72em] font-semibold tracking-normal">
                    ₦
                  </span>
                  0
                </span>
                <span className="text-[14.5px] text-ink-500">/ forever, for everything below</span>
              </div>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0 text-brand-green-ink"
                      strokeWidth={2.6}
                      aria-hidden="true"
                    />
                    <span className="text-[13.5px] leading-snug text-ink-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
