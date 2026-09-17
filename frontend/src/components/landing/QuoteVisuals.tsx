/**
 * Reproductions of the real OtoQuote interface, rebuilt as lightweight
 * presentational components so the landing page can compose and animate the
 * product instead of pasting flat screenshots.
 *
 * These deliberately mirror the live app:
 *  - the chat quote card in `components/QuoteCard.tsx` (mode="chat")
 *  - the price-source badges in `components/QuoteEditor.tsx`
 *  - the bottom tab bar in `components/BottomNav.tsx`
 *
 * All figures shown are illustrative examples of the kind of output the AI
 * produces; they are not customer data.
 */

import type { ReactNode } from "react";
import { BookOpen, FileText, MessageSquare, Palette, User } from "lucide-react";

import { Money, formatNGN as fmt } from "@/lib/currency";

export type Source = "my_price" | "regional_price" | "ai_estimate";

export interface DemoItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  source: Source;
  regionName?: string;
}

export interface DemoGroup {
  name: string;
  items: DemoItem[];
}

export { formatNGN } from "@/lib/currency";

export const groupsTotal = (groups: DemoGroup[]) =>
  groups.reduce(
    (sum, group) => sum + group.items.reduce((s, item) => s + item.qty * item.unitPrice, 0),
    0,
  );

/* ── Price source badge ─────────────────────────────────────────────────── */

const SOURCE_STYLES: Record<Source, { label: string; className: string }> = {
  my_price: { label: "MY PRICE", className: "bg-brand-green-50 text-brand-green-ink" },
  regional_price: { label: "REGIONAL", className: "bg-brand-blue-50 text-brand-blue" },
  ai_estimate: { label: "AI EST.", className: "bg-brand-orange-50 text-brand-orange-ink" },
};

export function SourceBadge({
  source,
  label,
  className = "",
}: {
  source: Source;
  label?: string;
  className?: string;
}) {
  const style = SOURCE_STYLES[source];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-px font-mono text-[9px] font-semibold leading-[1.5] tracking-[0.06em] ${style.className} ${className}`}
    >
      {label ?? style.label}
    </span>
  );
}

/* ── Quote line item ────────────────────────────────────────────────────── */

export function QuoteLine({
  item,
  showSource = true,
  highlight,
}: {
  item: DemoItem;
  showSource?: boolean;
  /** "enter" slides a newly added row in; "bump" flashes a changed value. */
  highlight?: "enter" | "bump" | null;
}) {
  const animationClass =
    highlight === "enter" ? "lp-row-enter" : highlight === "bump" ? "lp-row-bump" : "";

  return (
    <div
      className={`-mx-1.5 flex items-baseline justify-between gap-2 rounded-md px-1.5 py-1 ${animationClass}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-medium leading-tight text-ink-900">{item.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px] text-ink-300">
          <span className="tabular-nums">
            {item.qty} {item.unit} × {fmt(item.unitPrice)}
          </span>
          {showSource && (
            <SourceBadge
              source={item.source}
              label={item.source === "regional_price" ? item.regionName?.toUpperCase() : undefined}
            />
          )}
        </p>
      </div>
      <span className="shrink-0 whitespace-nowrap font-mono text-[12.5px] font-semibold tabular-nums text-ink-900">
        {fmt(item.qty * item.unitPrice)}
      </span>
    </div>
  );
}

/* ── Quote card ─────────────────────────────────────────────────────────── */

/**
 * The card the app renders inside the chat once a quote is generated.
 * `highlights` maps an item id to a change animation, which is how the
 * revision demo shows lines being added and re-priced.
 */
export function QuoteCardMock({
  reference,
  title,
  client,
  groups,
  total,
  highlights = {},
  showSource = true,
  footnote = true,
  className = "",
}: {
  reference: string;
  title: string;
  client?: string;
  groups: DemoGroup[];
  /** Pass a counted-up value to animate the total; defaults to the real sum. */
  total?: number;
  highlights?: Record<string, "enter" | "bump">;
  showSource?: boolean;
  footnote?: boolean;
  className?: string;
}) {
  const grandTotal = total ?? groupsTotal(groups);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(12,21,34,0.04),0_12px_28px_-16px_rgba(12,21,34,0.18)] ${className}`}
    >
      <div className="border-b border-ink-50 px-4 pb-3 pt-3.5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-blue">
          {reference}
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug text-ink-900">{title}</p>
        {client && <p className="mt-0.5 text-xs text-ink-300">{client}</p>}
      </div>

      <div className="space-y-4 px-4 py-3.5">
        {groups.map((group) => (
          <div key={group.name}>
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300">
              {group.name}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <QuoteLine
                  key={item.id}
                  item={item}
                  showSource={showSource}
                  highlight={highlights[item.id] ?? null}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-3 mb-3 flex items-center justify-between rounded-xl border border-brand-blue/10 bg-brand-blue-50 px-4 py-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          Grand Total
        </span>
        <Money amount={grandTotal} className="font-display text-base font-bold text-brand-blue" />
      </div>

      {footnote && (
        <p className="px-4 pb-3 text-center text-[9.5px] text-ink-300">
          OtoQuote AI can make mistakes. Check important info.
        </p>
      )}
    </div>
  );
}

/* ── Chat bubbles ───────────────────────────────────────────────────────── */

export function ChatBubble({
  role,
  children,
  className = "",
}: {
  role: "user" | "ai";
  children: ReactNode;
  className?: string;
}) {
  if (role === "user") {
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-blue px-3.5 py-2 text-[13px] leading-snug text-white shadow-sm">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-ink-100 bg-white px-3.5 py-2 text-[13px] leading-snug text-ink-700 shadow-sm">
        {children}
      </div>
    </div>
  );
}

/** The three-dot "thinking" bubble, with the app's real progress wording. */
export function TypingBubble({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-ink-100 bg-white px-3.5 py-2 shadow-sm">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-brand-blue/50 motion-safe:animate-pulse"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </span>
        <span className="text-[12px] text-ink-500">{label}</span>
      </div>
    </div>
  );
}

/* ── Device frames ──────────────────────────────────────────────────────── */

const TABS = [
  { label: "Chat", icon: MessageSquare },
  { label: "Quotes", icon: FileText },
  { label: "Price Log", icon: BookOpen },
  { label: "Brand", icon: Palette },
  { label: "Profile", icon: User },
];

/** The app's real five-tab bottom navigation. */
export function AppTabBar({ active = "Chat" }: { active?: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center justify-around border-t border-ink-100 bg-white px-1 py-1.5"
    >
      {TABS.map(({ label, icon: Icon }) => {
        const isActive = label === active;
        return (
          <div
            key={label}
            className={`flex flex-col items-center gap-0.5 ${
              isActive ? "text-brand-blue" : "text-ink-300"
            }`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.4 : 2} />
            <span className="text-[8.5px] font-medium leading-none">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** The chat composer, matching the live input row. */
export function AppComposer({ placeholder = "Message OtoQuote AI…" }: { placeholder?: string }) {
  return (
    <div
      aria-hidden="true"
      className="shrink-0 border-t border-ink-100 bg-white px-2.5 py-2"
    >
      <div className="flex items-center gap-2 rounded-full bg-ink-50 px-3.5 py-2">
        <span className="flex-1 truncate text-[11.5px] text-ink-300">{placeholder}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue">
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white" aria-hidden="true">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </span>
      </div>
    </div>
  );
}

/**
 * Phone shell. Kept as a CSS frame rather than a device photo so it stays
 * crisp at any size and costs nothing to download.
 */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-ink-100 bg-ink-900 p-[7px] shadow-[0_24px_60px_-24px_rgba(12,21,34,0.45)] ${className}`}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.6rem] bg-[#F7F9FC]">
        {/* Status bar */}
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center justify-between bg-white px-4 pb-1 pt-2 font-mono text-[9.5px] font-medium text-ink-500"
        >
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
            <span>4G</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Browser-style frame for desktop compositions (the editor, the dashboard).
 */
export function WindowFrame({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(12,21,34,0.04),0_20px_44px_-24px_rgba(12,21,34,0.28)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-ink-50 bg-[#F7F9FC] px-3 py-2">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink-100" />
          <span className="h-2 w-2 rounded-full bg-ink-100" />
          <span className="h-2 w-2 rounded-full bg-ink-100" />
        </span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
