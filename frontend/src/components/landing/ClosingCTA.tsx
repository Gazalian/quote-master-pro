import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Reveal } from "./primitives";

export function ClosingCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-ink-900 py-16 sm:py-20 lg:py-28">
      {/* Blueprint ruling, inverted for the dark panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 80% at 50% 50%, #000 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 80% at 50% 50%, #000 20%, transparent 75%)",
        }}
      />

      <div className="lp-container relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-[1.9rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.6rem] lg:text-5xl">
            Your next quote can be done before you get off the site.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-400">
            Create an account, tell OtoQuote your trade and your state, and describe the job you're
            standing in front of. The first quotation takes about a minute.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="group inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-ink-900 transition-all hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 active:translate-y-px sm:w-auto"
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
              className="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl border border-white/20 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 sm:w-auto"
            >
              Read it again
            </a>
          </div>

          <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">
            No card · Every feature included · Works on any phone
          </p>
        </Reveal>
      </div>
    </section>
  );
}
