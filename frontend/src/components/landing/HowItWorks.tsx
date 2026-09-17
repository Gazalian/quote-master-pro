import type { ReactNode } from "react";
import { Check, FileDown, ImagePlus, Pencil } from "lucide-react";

import { Eyebrow, Reveal, SectionLead, SectionTitle } from "./primitives";
import { QuoteLine, SourceBadge, formatNGN, type DemoItem } from "./QuoteVisuals";

// Names kept short: this card is a quarter of the grid, and anything longer
// truncates mid-word.
const STEP_2_ITEMS: DemoItem[] = [
  { id: "s1", name: "Cement (50kg)", qty: 300, unit: "bags", unitPrice: 7000, source: "regional_price", regionName: "Oyo" },
  { id: "s2", name: "Blocks (6-inch)", qty: 3200, unit: "pcs", unitPrice: 620, source: "my_price" },
];

function StepCard({
  index,
  title,
  body,
  visual,
  delay,
}: {
  index: string;
  title: string;
  body: ReactNode;
  visual: ReactNode;
  delay: number;
}) {
  return (
    <Reveal
      as="li"
      delay={delay}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(12,21,34,0.04),0_18px_40px_-24px_rgba(12,21,34,0.3)]"
    >
      <div className="flex flex-1 flex-col p-6">
        <span className="font-mono text-[11px] font-semibold tabular-nums tracking-[0.16em] text-brand-blue">
          {index}
        </span>
        <h3 className="mt-3 font-display text-lg font-bold leading-snug tracking-[-0.015em] text-ink-900">
          {title}
        </h3>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{body}</p>
      </div>

      {/* Each step is illustrated with the interface that actually performs it.
          The fixed min-height keeps all four panels starting on the same line
          despite the body copy above them running to different lengths. */}
      <div className="mt-auto flex h-[196px] flex-col justify-center border-t border-ink-50 bg-[#F8FAFC] p-4">
        {visual}
      </div>
    </Reveal>
  );
}

export function HowItWorks() {
  const step2Total = STEP_2_ITEMS.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-ink-100 bg-white py-16 sm:py-20 lg:py-28"
    >
      <div className="lp-container">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow index="02">How it works</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <SectionTitle className="mt-4">Four steps. No spreadsheet.</SectionTitle>
          </Reveal>
          <Reveal delay={120}>
            <SectionLead className="mt-5">
              OtoQuote already knows your trade, your state and your prices — you set them once when
              you sign up. Everything below is what happens on the next job.
            </SectionLead>
          </Reveal>
        </div>

        <ol className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
          <StepCard
            index="01"
            delay={0}
            title="Describe the job"
            body={
              <>
                Type it the way you'd say it out loud — including site slang like{" "}
                <span className="font-medium text-ink-700">"wire house"</span> or{" "}
                <span className="font-medium text-ink-700">"fix POP"</span>. Attach site photos if
                you took any.
              </>
            }
            visual={
              <div className="rounded-lg border border-ink-100 bg-white p-3">
                <p className="text-[12.5px] leading-snug text-ink-700">
                  Block-work to lintel level, 3-bedroom bungalow, 6-inch blocks.
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-brand-blue motion-safe:animate-caret-blink"
                  />
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                  <ImagePlus size={12} aria-hidden="true" />
                  3 photos attached
                </div>
              </div>
            }
          />

          <StepCard
            index="02"
            delay={70}
            title="OtoQuote builds the quotation"
            body={
              <>
                Grouped into Materials, Labour, Transportation and Miscellaneous — in Nigerian units
                and Naira. Labour is always its own section, and VAT is never assumed.
              </>
            }
            visual={
              <div className="rounded-lg border border-ink-100 bg-white p-3">
                <p className="mb-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-300">
                  Materials
                </p>
                <div className="space-y-1">
                  {STEP_2_ITEMS.map((item) => (
                    <QuoteLine key={item.id} item={item} showSource={false} />
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-ink-50 pt-2">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-300">
                    Subtotal
                  </span>
                  <span className="font-mono text-[12px] font-semibold tabular-nums text-ink-900">
                    {formatNGN(step2Total)}
                  </span>
                </div>
              </div>
            }
          />

          <StepCard
            index="03"
            delay={140}
            title="Correct it in plain language"
            body={
              <>
                "Use two coils of 2.5mm instead of three, and add 10% to labour." The quote updates
                in place. Or open the editor and change any figure by hand.
              </>
            }
            visual={
              <div className="space-y-2">
                <div className="rounded-lg rounded-br-sm bg-brand-blue px-3 py-2 text-[12px] leading-snug text-white">
                  Add 20 bags of cement.
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2">
                  <Pencil size={12} className="shrink-0 text-brand-green-ink" aria-hidden="true" />
                  <span className="text-[12px] text-ink-700">Quote updated — 1 line added</span>
                </div>
              </div>
            }
          />

          <StepCard
            index="04"
            delay={210}
            title="Send a document with your name on it"
            body={
              <>
                Your logo, your colours, your CAC number. Export a PDF in one of three templates —
                then turn it into an invoice with your bank details once the job is won.
              </>
            }
            visual={
              <div className="rounded-lg border border-ink-100 bg-white p-3">
                <div className="flex items-center justify-between border-b-2 border-brand-blue pb-1.5">
                  <span className="font-display text-[10px] font-bold text-brand-blue">
                    YOUR COMPANY LTD
                  </span>
                  <span className="rounded bg-brand-blue px-1.5 py-px font-display text-[7.5px] font-bold tracking-[0.1em] text-white">
                    QUOTE
                  </span>
                </div>
                <div className="mt-2 space-y-1.5" aria-hidden="true">
                  {[90, 70, 84].map((w, i) => (
                    <span key={i} className="block h-1.5 rounded-full bg-ink-50" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-blue-50 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-brand-blue">
                    <FileDown size={10} aria-hidden="true" /> PDF
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-green-50 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-brand-green-ink">
                    <Check size={10} aria-hidden="true" /> Invoice
                  </span>
                </div>
              </div>
            }
          />
        </ol>

        <Reveal delay={100}>
          <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-300">
            <span>Price sources on every line:</span>
            <SourceBadge source="my_price" />
            <SourceBadge source="regional_price" />
            <SourceBadge source="ai_estimate" />
          </p>
        </Reveal>
      </div>
    </section>
  );
}
