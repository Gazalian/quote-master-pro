import { useEffect, useState } from "react";

/**
 * Route-transition placeholder.
 *
 * Holds back the spinner for a beat: most chunk loads and session checks
 * finish inside 200ms, and a spinner that appears and vanishes inside that
 * window reads as a flicker — it makes the app feel *less* responsive than
 * showing nothing at all. If the wait runs long, the indicator fades in and
 * we explain what is happening.
 */
export const RouteLoader = ({
  label,
  delayMs = 220,
}: {
  label?: string;
  delayMs?: number;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  return (
    <div
      className="min-h-app flex flex-col items-center justify-center gap-4 bg-background"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex flex-col items-center gap-4 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" />
        {label && <p className="text-sm font-medium text-muted-foreground">{label}…</p>}
      </div>
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
};
