import { RotateCcw } from "lucide-react";

import { Eyebrow, Reveal, SectionLead, SectionTitle } from "./primitives";

/**
 * The problem section shows the workflow rather than asserting that quoting is
 * hard. Each step is the literal thing a tradesperson does today; the last one
 * loops back, which is the actual pain.
 */
const STEPS = [
  { n: "01", text: "Client describes the job while you're still on site." },
  { n: "02", text: "That evening, you open an old quote to copy the layout from." },
  { n: "03", text: "Count everything — coils, bundles, bags, blocks, lengths." },
  { n: "04", text: "Try to remember what the market charged last month." },
  { n: "05", text: "Work out days × men × rate for the labour." },
  { n: "06", text: "Retype it into Word or Excel and fight the table borders." },
  { n: "07", text: "Send it two days later and hope nobody quoted faster." },
];

export function ProblemSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
      <div className="lp-container">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow index="01">The problem</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <SectionTitle className="mt-4">
              A quote costs you an evening. The job doesn't wait that long.
            </SectionTitle>
          </Reveal>
          <Reveal delay={120}>
            <SectionLead className="mt-5">
              Nothing about this is difficult. It's just long — and it happens again from the top
              every time the client changes their mind.
            </SectionLead>
          </Reveal>
        </div>

        {/* The chain. A single column on mobile with a connecting rule; a
            two-column ladder from `sm` up so it doesn't run to a mile long. */}
        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ink-100 bg-ink-100 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal
              as="li"
              key={step.n}
              delay={i * 55}
              className="flex gap-3 bg-white p-5"
            >
              <span className="font-mono text-[11px] font-semibold tabular-nums text-ink-300">
                {step.n}
              </span>
              <p className="text-[14.5px] leading-snug text-ink-700">{step.text}</p>
            </Reveal>
          ))}

          {/* Step 08 is the loop — styled as the break in the pattern. */}
          <Reveal
            as="li"
            delay={STEPS.length * 55}
            className="flex gap-3 bg-ink-900 p-5"
          >
            <RotateCcw size={15} className="mt-0.5 shrink-0 text-brand-orange" aria-hidden="true" />
            <p className="text-[14.5px] font-medium leading-snug text-white">
              Client asks for one change — and you start again at 02.
            </p>
          </Reveal>
        </ol>

        {/* The turn. */}
        <Reveal delay={120}>
          <div className="mt-10 flex flex-col items-start gap-5 rounded-xl border border-brand-blue/15 bg-brand-blue-50 p-6 sm:mt-12 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
            <p className="font-display text-xl font-bold leading-snug tracking-[-0.015em] text-ink-900 sm:text-2xl">
              OtoQuote turns all eight steps into one conversation.
            </p>
            <p className="text-[14.5px] leading-relaxed text-ink-500 sm:max-w-sm">
              You describe the job once. Corrections are things you say, not documents you rebuild.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
