import { useNavigate } from "react-router-dom";
import { ArrowRight, ImagePlus } from "lucide-react";

import { DimensionMark, Reveal } from "./primitives";
import {
  AppComposer,
  AppTabBar,
  ChatBubble,
  PhoneFrame,
  QuoteCardMock,
  type DemoGroup,
} from "./QuoteVisuals";

/**
 * Illustrative output for a job an electrician would actually describe.
 * Quantities follow the defaults in the backend's Nigerian knowledge base
 * (coils of cable, bundles of conduit, an 8-way DB, electricians × days).
 */
const HERO_GROUPS: DemoGroup[] = [
  {
    name: "Materials",
    items: [
      { id: "h1", name: "2.5mm single-core cable", qty: 3, unit: "coils", unitPrice: 5800, source: "my_price" },
      { id: "h2", name: "1.5mm single-core cable", qty: 2, unit: "coils", unitPrice: 3900, source: "my_price" },
      { id: "h3", name: "25mm PVC conduit", qty: 8, unit: "bundles", unitPrice: 14500, source: "regional_price", regionName: "Lagos" },
      { id: "h4", name: "13A socket outlet", qty: 15, unit: "pcs", unitPrice: 1200, source: "regional_price", regionName: "Lagos" },
      { id: "h5", name: "8-way distribution board", qty: 1, unit: "pc", unitPrice: 32000, source: "ai_estimate" },
    ],
  },
  {
    name: "Labour",
    items: [
      { id: "h6", name: "Electrician (3 men × 6 days)", qty: 18, unit: "man-days", unitPrice: 13000, source: "ai_estimate" },
    ],
  },
];

export function Hero() {
  const navigate = useNavigate();

  return (
    <section id="top" className="lp-blueprint relative overflow-hidden pb-4 pt-10 sm:pt-14 lg:pb-12 lg:pt-20">
      <div className="lp-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:gap-16">
          {/* ── Copy ── */}
          <div className="max-w-xl">
            <Reveal>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-brand-blue sm:text-[11px]">
                <span className="rounded-full bg-brand-blue-50 px-2.5 py-1">Built for Nigerian trades</span>
                <span className="text-ink-300">Electrical · Plumbing · Building · Finishing</span>
              </p>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="mt-5 font-display text-[2.1rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink-900 sm:text-5xl lg:text-[3.5rem]">
                Describe the job.
                <br />
                Get the full{" "}
                <span className="relative whitespace-nowrap text-brand-blue">
                  quotation
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1 left-0 h-2 w-full text-brand-orange"
                  >
                    <path
                      d="M2 8.5C46 3.5 120 2.5 218 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-6 text-base leading-relaxed text-ink-500 sm:text-lg">
                Tell OtoQuote about the job the way you'd explain it on site. It comes back with a
                complete itemised quotation — materials, quantities, labour and the grand total in
                Naira. Correct any line, put your logo on it, and send the PDF before you leave the
                site.
              </p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(0,86,210,0.7)] transition-all hover:bg-brand-blue-700 hover:shadow-[0_12px_26px_-10px_rgba(0,86,210,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 active:translate-y-px"
                >
                  Start your first quote — free
                  <ArrowRight
                    size={18}
                    className="transition-transform motion-safe:group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-ink-100 bg-white px-6 text-base font-semibold text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                >
                  See how it works
                </a>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                {["Every feature free", "No card required", "Runs on any Android"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-brand-green" aria-hidden="true">
                      <path
                        d="M3 8.5l3.2 3.2L13 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* ── Product visual ── */}
          <Reveal delay={200} className="relative mx-auto w-full max-w-[380px] lg:max-w-none">
            {/* Dimension marks frame the device the way a drawing dimensions a
                component. Decorative, and hidden on small screens where the
                phone already fills the column. */}
            <DimensionMark
              label="One conversation"
              className="absolute -top-7 left-6 right-6 hidden lg:flex"
            />

            <div className="relative">
              <PhoneFrame className="relative z-10 mx-auto aspect-[9/17.5] w-full max-w-[300px] sm:max-w-[320px]">
                <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-2.5 py-3">
                  <ChatBubble role="user">
                    <span className="mb-1.5 flex items-center gap-1.5 rounded-md bg-white/15 px-2 py-1 text-[11px] font-medium">
                      <ImagePlus size={12} aria-hidden="true" />
                      2 site photos
                    </span>
                    Wire a 3-bedroom flat in Lekki — 15 sockets, 10 lighting points.
                  </ChatBubble>

                  <ChatBubble role="ai">
                    Here's the quotation. I've assumed surface conduit and an 8-way DB — tell me if
                    it's concealed.
                  </ChatBubble>

                  <QuoteCardMock
                    reference="QT-2041"
                    title="Electrical wiring — 3-bedroom flat, Lekki"
                    groups={HERO_GROUPS}
                    footnote={false}
                    className="shadow-none"
                  />
                </div>
                <AppComposer />
                <AppTabBar active="Chat" />
              </PhoneFrame>

              {/* Nothing is floated beside the phone on purpose: the gutter
                  between the copy column and the device is ~140px at 1440, so
                  any card placed there either collides with the paragraph or
                  covers the quote it is meant to annotate. The price-source
                  story gets a full section of its own further down. */}
            </div>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300 lg:text-left">
              Example output · figures are illustrative
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
