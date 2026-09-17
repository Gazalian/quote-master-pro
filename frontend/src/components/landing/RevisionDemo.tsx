import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import {
  Eyebrow,
  Reveal,
  SectionLead,
  SectionTitle,
  useCountUp,
  useInView,
  usePrefersReducedMotion,
} from "./primitives";
import {
  ChatBubble,
  QuoteCardMock,
  TypingBubble,
  formatNGN,
  groupsTotal,
  type DemoGroup,
} from "./QuoteVisuals";

/* ── The two states of the quotation ────────────────────────────────────── */

const BEFORE: DemoGroup[] = [
  {
    name: "Materials",
    items: [
      { id: "tiles", name: "Floor tiles 60×60", qty: 42, unit: "sqm", unitPrice: 6500, source: "my_price" },
      { id: "adhesive", name: "Tile adhesive 25kg", qty: 8, unit: "bags", unitPrice: 7000, source: "regional_price", regionName: "Oyo" },
    ],
  },
  {
    name: "Labour",
    items: [
      { id: "tiling", name: "Tiling labour", qty: 42, unit: "sqm", unitPrice: 3200, source: "my_price" },
      { id: "helper", name: "Labourer (1 man × 4 days)", qty: 4, unit: "man-days", unitPrice: 6000, source: "ai_estimate" },
    ],
  },
];

/** Same quotation after "Add 20 bags of cement and increase the labour by 10%." */
const AFTER: DemoGroup[] = [
  {
    name: "Materials",
    items: [
      BEFORE[0].items[0],
      BEFORE[0].items[1],
      { id: "cement", name: "50kg Portland cement", qty: 20, unit: "bags", unitPrice: 7000, source: "regional_price", regionName: "Oyo" },
    ],
  },
  {
    name: "Labour",
    items: [
      { ...BEFORE[1].items[0], unitPrice: 3520 },
      { ...BEFORE[1].items[1], unitPrice: 6600 },
    ],
  },
];

const INSTRUCTION = "Add 20 bags of cement and increase the labour by 10%.";

/** Phases of the scripted run. */
type Phase = "idle" | "typing" | "thinking" | "applied";

/** Each step's dwell time, in ms. Typing is driven per-character instead. */
const THINKING_MS = 1500;
const HOLD_MS = 5200;
const CHAR_MS = 34;

export function RevisionDemo() {
  const reduced = usePrefersReducedMotion();
  const { ref: sectionRef, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });

  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState("");
  // Bumped to restart the run; also re-keys the changed rows so their CSS
  // animations replay instead of being skipped as "already run".
  const [run, setRun] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /* Under reduced motion the demo is a static before/after: the instruction is
     fully written and the quotation already shows the result. */
  useEffect(() => {
    if (!reduced) return;
    clearTimers();
    setTyped(INSTRUCTION);
    setPhase("applied");
  }, [reduced, clearTimers]);

  /* The scripted run. Starts when the section scrolls into view and loops
     while it stays there, so a visitor who scrolls past doesn't miss it. */
  useEffect(() => {
    if (reduced || !inView) return;
    clearTimers();

    setPhase("typing");
    setTyped("");

    let i = 0;
    const typeNext = () => {
      i += 1;
      setTyped(INSTRUCTION.slice(0, i));
      if (i < INSTRUCTION.length) {
        after(CHAR_MS, typeNext);
        return;
      }
      after(420, () => {
        setPhase("thinking");
        after(THINKING_MS, () => {
          setPhase("applied");
          after(HOLD_MS, () => setRun((r) => r + 1));
        });
      });
    };
    after(500, typeNext);

    return clearTimers;
  }, [reduced, inView, run, clearTimers, after]);

  const applied = phase === "applied";
  const groups = applied ? AFTER : BEFORE;

  const targetTotal = useMemo(() => groupsTotal(groups), [groups]);
  const animatedTotal = useCountUp(targetTotal, 850);

  // Only animate the rows on the transition itself, never on first paint.
  const highlights = useMemo<Record<string, "enter" | "bump">>(
    () =>
      applied && !reduced
        ? { cement: "enter", tiling: "bump", helper: "bump" }
        : {},
    [applied, reduced],
  );

  const replay = () => {
    clearTimers();
    setPhase("typing");
    setTyped("");
    setRun((r) => r + 1);
  };

  const delta = groupsTotal(AFTER) - groupsTotal(BEFORE);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
      <div className="lp-container">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow index="03" tone="orange">
              Revisions
            </Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <SectionTitle className="mt-4">Change a quote by saying what changed.</SectionTitle>
          </Reveal>
          <Reveal delay={120}>
            <SectionLead className="mt-5">
              The client wants more cement and the labour has gone up. You don't rebuild the
              quotation — you say so, and OtoQuote edits the one you already have.
            </SectionLead>
          </Reveal>
        </div>

        <Reveal delay={140}>
          <div className="mt-11 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(12,21,34,0.04),0_24px_56px_-32px_rgba(12,21,34,0.34)] sm:mt-14">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
              {/* ── Conversation ── */}
              <div className="flex flex-col gap-3 border-b border-ink-100 bg-[#F8FAFC] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-300">
                  Chat
                </p>

                <ChatBubble role="ai">
                  Quote ready — review the items and adjust anything I've estimated.
                </ChatBubble>

                <ChatBubble role="user">
                  <span>
                    {typed}
                    {phase === "typing" && (
                      <span
                        aria-hidden="true"
                        className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-white/80 motion-safe:animate-caret-blink"
                      />
                    )}
                  </span>
                </ChatBubble>

                {phase === "thinking" && <TypingBubble label="Updating your quote…" />}

                {applied && (
                  <ChatBubble role="ai">
                    Done. Added 20 bags of 50kg Portland cement to Materials and raised both labour
                    rates by 10%. Your tile and adhesive prices are unchanged.
                  </ChatBubble>
                )}

                {/* Announce the outcome once, for screen readers. */}
                <p className="sr-only" role="status">
                  {applied
                    ? `Quotation updated. New grand total ${formatNGN(groupsTotal(AFTER))}.`
                    : "Quotation awaiting the requested change."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                    Example conversation
                  </p>
                  <button
                    type="button"
                    onClick={replay}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-3 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                  >
                    <RotateCcw size={11} aria-hidden="true" />
                    Replay
                  </button>
                </div>
              </div>

              {/* ── Quotation ── */}
              <div className="p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-300">
                    Quotation
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] transition-colors duration-500 ${
                      applied
                        ? "bg-brand-green-50 text-brand-green-ink"
                        : "bg-ink-50 text-ink-300"
                    }`}
                  >
                    {applied ? "Version 2" : "Version 1"}
                  </span>
                </div>

                <QuoteCardMock
                  key={applied ? `after-${run}` : `before-${run}`}
                  reference="QT-2087"
                  title="Floor tiling — 42 sqm, sitting room"
                  client="Mr. Adeyemi"
                  groups={groups}
                  total={animatedTotal}
                  highlights={highlights}
                  footnote={false}
                />

                <p
                  className={`mt-3 text-center font-mono text-[10.5px] tabular-nums transition-opacity duration-500 ${
                    applied ? "text-brand-orange-ink opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={!applied}
                >
                  +{formatNGN(delta)} against version 1
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <p className="mx-auto mt-8 max-w-2xl text-center text-[14.5px] leading-relaxed text-ink-500">
            OtoQuote sends your saved quotation back as the baseline, so a revision patches the
            document you already have. It doesn't start over, and it doesn't quietly overwrite the
            prices you set yourself.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
