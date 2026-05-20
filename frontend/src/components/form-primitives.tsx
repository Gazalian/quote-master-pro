/**
 * Shared form primitives for the redesigned settings pages.
 * Consistent spacing, typography, and 44px touch targets per WCAG 2.5.5.
 */

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const baseInput =
  "w-full px-4 py-3 min-h-[44px] rounded-xl border border-border bg-background " +
  "text-foreground placeholder:text-muted-foreground/70 text-[15px] " +
  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary " +
  "transition-colors";

export const Field = ({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-[11px] text-destructive">{error}</p>
    ) : hint ? (
      <p className="text-[11px] text-muted-foreground/80">{hint}</p>
    ) : null}
  </div>
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(baseInput, className)} {...rest} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(baseInput, "min-h-[88px] py-2.5 resize-none", className)}
      {...rest}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(baseInput, "appearance-none cursor-pointer pr-10", className)}
      {...rest}
    >
      {children}
    </select>
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs">
      ▼
    </span>
  </div>
));
Select.displayName = "Select";

export const SectionCard = ({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="bg-card rounded-2xl border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
    <header className="flex items-start gap-3 px-5 py-4 border-b border-border/50">
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-[15px] font-semibold text-foreground leading-tight">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      {action}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

/**
 * "Saving…" / "Saved" inline indicator for autosave UIs.
 */
export const SaveIndicator = ({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) => {
  if (status === "idle") return null;
  const map = {
    saving: { label: "Saving…", color: "text-muted-foreground" },
    saved: { label: "All changes saved", color: "text-emerald-600" },
    error: { label: "Save failed — retrying…", color: "text-destructive" },
  } as const;
  const cfg = map[status];
  return <span className={cn("text-[11px] font-medium", cfg.color)}>{cfg.label}</span>;
};
