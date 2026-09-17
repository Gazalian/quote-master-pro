/**
 * Shared building blocks for the marketing site.
 *
 * Motion policy: no animation library. Everything here is an
 * IntersectionObserver flipping a data attribute, with the actual transition
 * declared in CSS (see the `.lp` block in index.css). That keeps the landing
 * chunk small and every animation on the compositor.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/* ── Reduced motion ─────────────────────────────────────────────────────── */

export function usePrefersReducedMotion(): boolean {
  // Default to `true` during SSR/first tick would suppress the intro on every
  // load, so we read the media query synchronously on mount instead.
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/* ── In-view detection ──────────────────────────────────────────────────── */

interface InViewOptions {
  /** Fire once and disconnect (default) vs. track enter/exit both ways. */
  once?: boolean;
  /** Fraction of the element that must be visible. */
  threshold?: number;
  /** Shrink the viewport so the reveal starts slightly before the edge. */
  rootMargin?: string;
}

export function useInView<T extends HTMLElement = HTMLDivElement>({
  once = true,
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
}: InViewOptions = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (or a very old browser): show everything.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return { ref, inView };
}

/* ── Reveal ─────────────────────────────────────────────────────────────── */

interface RevealProps {
  children: ReactNode;
  /** Stagger, in ms. Applied via a CSS custom property, not a JS timer. */
  delay?: number;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
  id?: string;
}

/**
 * Fades + lifts its children into place the first time they scroll into view.
 * Under prefers-reduced-motion the CSS neutralises both properties, so this
 * still renders a plain, complete element.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  style,
  id,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      id={id}
      data-reveal={inView ? "in" : ""}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}

/* ── Typography ─────────────────────────────────────────────────────────── */

/**
 * The small mono label that runs above a section heading, prefixed with the
 * section number — a drafting-sheet convention rather than a pill badge.
 */
export function Eyebrow({
  index,
  children,
  tone = "blue",
  onDark = false,
  className = "",
}: {
  index?: string;
  children: ReactNode;
  tone?: "blue" | "orange" | "muted";
  /** Dark panels need the bright brand tints; the darkened `-ink` variants
      that pass on white are unreadable against ink-900. */
  onDark?: boolean;
  className?: string;
}) {
  const toneClass = onDark
    ? tone === "orange"
      ? "text-brand-orange"
      : tone === "muted"
        ? "text-ink-400"
        : "text-white"
    : tone === "orange"
      ? "text-brand-orange-ink"
      : tone === "muted"
        ? "text-ink-500"
        : "text-brand-blue";

  return (
    <p
      className={`flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] ${toneClass} ${className}`}
    >
      {index && (
        <>
          <span aria-hidden="true" className="tabular-nums opacity-70">
            {index}
          </span>
          <span aria-hidden="true" className="h-px w-6 bg-current opacity-40" />
        </>
      )}
      <span>{children}</span>
    </p>
  );
}

/** Section headline. Tight, large, ink-coloured — not brand blue. */
export function SectionTitle({
  children,
  className = "",
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag
      className={`font-display text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-ink-900 sm:text-4xl lg:text-[2.75rem] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionLead({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-[15px] leading-relaxed text-ink-500 sm:text-base ${className}`}>
      {children}
    </p>
  );
}

/* ── Construction drawing marks ─────────────────────────────────────────── */

/**
 * A dimension line with end ticks and a measurement caption — the detail that
 * makes a page read as a technical drawing without a single stock photo.
 * Decorative: hidden from assistive tech.
 */
export function DimensionMark({
  label,
  orientation = "horizontal",
  className = "",
}: {
  label: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  if (orientation === "vertical") {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none flex flex-col items-center ${className}`}
      >
        <span className="h-px w-2.5 bg-brand-blue/35" />
        <span className="w-px flex-1 bg-brand-blue/25" />
        <span className="my-1 -rotate-90 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.16em] text-brand-blue/55">
          {label}
        </span>
        <span className="w-px flex-1 bg-brand-blue/25" />
        <span className="h-px w-2.5 bg-brand-blue/35" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none flex items-center gap-1.5 ${className}`}
    >
      <span className="h-2.5 w-px bg-brand-blue/35" />
      <span className="h-px flex-1 bg-brand-blue/25" />
      <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.16em] text-brand-blue/55">
        {label}
      </span>
      <span className="h-px flex-1 bg-brand-blue/25" />
      <span className="h-2.5 w-px bg-brand-blue/35" />
    </div>
  );
}

/** Registration marks at the corners of a framed element. Decorative. */
export function CornerMarks({ className = "" }: { className?: string }) {
  const corner = "absolute h-2.5 w-2.5 border-brand-blue/30";
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <span className={`${corner} -left-px -top-px border-l border-t`} />
      <span className={`${corner} -right-px -top-px border-r border-t`} />
      <span className={`${corner} -bottom-px -left-px border-b border-l`} />
      <span className={`${corner} -bottom-px -right-px border-b border-r`} />
    </span>
  );
}

/* ── Counting numbers ───────────────────────────────────────────────────── */

/**
 * Animates a number upward when it changes. Used for the grand total in the
 * revision demo so a price change reads as a change, not a re-render.
 * Honours reduced motion by snapping to the target value.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    if (from === target) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return stop;
  }, [target, durationMs, reduced, stop]);

  return value;
}
