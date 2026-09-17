import { GripVertical, Search, Smartphone, Wifi } from "lucide-react";

import { Eyebrow, Reveal, SectionLead, SectionTitle } from "./primitives";
import { SourceBadge, WindowFrame, formatNGN } from "./QuoteVisuals";

/**
 * A bento rather than a twelve-card grid: the two features that deserve a
 * picture get one, the rest are stated plainly.
 *
 * Every claim here is backed by shipped code — the editor (QuoteEditor.tsx),
 * the dashboard (QuotesPage.tsx), the three PDF templates (components/templates),
 * invoice conversion (QuoteCard.tsx), chat history (useSessions.ts) and the
 * PWA/compression work in ChatPage.tsx + vite.config.ts.
 */

const EDITOR_ROWS = [
  { name: "Floor tiles 60×60", qty: "42", unit: "sqm", price: 6500, source: "my_price" as const },
  { name: "Tile adhesive 25kg", qty: "8", unit: "bags", price: 7000, source: "regional_price" as const },
  { name: "Skirting tiles", qty: "26", unit: "m", price: 1800, source: "ai_estimate" as const },
];

const QUOTE_ROWS = [
  { ref: "QT-2087", client: "Mr. Adeyemi", total: 643240, status: "APPROVED" },
  { ref: "QT-2086", client: "Grace Interiors", total: 1284000, status: "INVOICED" },
  { ref: "QT-2081", client: "Bello & Sons", total: 398500, status: "ARCHIVED" },
];

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-brand-green-50 text-brand-green-ink",
  INVOICED: "bg-brand-blue-50 text-brand-blue",
  ARCHIVED: "bg-ink-50 text-ink-500",
};

const SMALL_FEATURES = [
  {
    title: "Three document templates",
    body: "Classic, Modern and Minimal — each carrying your logo, your brand colours, your address and your CAC number.",
  },
  {
    title: "Quote → Invoice → Paid",
    body: "Turn a won quote into an invoice with your bank details and payment terms attached, then mark it paid.",
  },
  {
    title: "Every conversation kept",
    body: "Chat sessions, earlier versions of a quotation and the site photos you attached all stay where you left them.",
  },
  {
    title: "It answers instead of interrogating",
    body: "OtoQuote never withholds a quote to ask questions first. It fills the gaps, marks its assumptions, then asks at most two.",
  },
];

export function FeatureBento() {
  return (
    <section id="features" className="scroll-mt-20 py-16 sm:py-20 lg:py-28">
      <div className="lp-container">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow index="05">What you get</Eyebrow>
          </Reveal>
          <Reveal delay={60}>
            <SectionTitle className="mt-4">
              A quoting tool, not a chatbot with a document attached.
            </SectionTitle>
          </Reveal>
          <Reveal delay={120}>
            <SectionLead className="mt-5">
              The AI writes the first draft. Everything after that is a proper editor, a proper
              document and a proper record.
            </SectionLead>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-14 lg:grid-cols-2">
          {/* ── Editor ── */}
          <Reveal className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <div className="p-6 sm:p-7">
              <h3 className="font-display text-xl font-bold leading-snug tracking-[-0.018em] text-ink-900">
                A real line-item editor
              </h3>
              <p className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-ink-500">
                Change any quantity, unit or price by hand. Drag items and whole groups into the
                order you want. Add what the AI missed, delete what it invented — and save a
                corrected price straight to your price log as you go.
              </p>
            </div>

            <div className="mt-auto border-t border-ink-50 bg-[#F8FAFC] p-4 sm:p-5">
              <WindowFrame title="Edit quotation">
                <div className="divide-y divide-ink-50">
                  {EDITOR_ROWS.map((row) => (
                    <div key={row.name} className="flex items-center gap-2 px-3 py-2.5">
                      <GripVertical size={13} className="shrink-0 text-ink-100" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-900">
                        {row.name}
                      </span>
                      <span className="hidden shrink-0 font-mono text-[11px] tabular-nums text-ink-300 sm:inline">
                        {row.qty} {row.unit}
                      </span>
                      <span className="shrink-0 rounded-md border border-ink-100 bg-white px-2 py-1 font-mono text-[11px] font-medium tabular-nums text-ink-900">
                        {formatNGN(row.price)}
                      </span>
                      <SourceBadge source={row.source} />
                    </div>
                  ))}
                </div>
              </WindowFrame>
            </div>
          </Reveal>

          {/* ── Dashboard ── */}
          <Reveal delay={80} className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <div className="p-6 sm:p-7">
              <h3 className="font-display text-xl font-bold leading-snug tracking-[-0.018em] text-ink-900">
                Every quote you've sent, in one place
              </h3>
              <p className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-ink-500">
                Search by client, reference or description, and filter by status. The quote you wrote
                for a similar job last year is ten seconds away instead of buried in your phone's
                downloads folder.
              </p>
            </div>

            <div className="mt-auto border-t border-ink-50 bg-[#F8FAFC] p-4 sm:p-5">
              <WindowFrame title="Quotations">
                <div className="border-b border-ink-50 px-3 py-2">
                  <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-2.5 py-1.5">
                    <Search size={12} className="shrink-0 text-ink-300" aria-hidden="true" />
                    <span className="text-[11.5px] text-ink-300">Search quotations…</span>
                  </div>
                </div>
                <div className="divide-y divide-ink-50">
                  {QUOTE_ROWS.map((row) => (
                    <div key={row.ref} className="flex items-center gap-2 px-3 py-2.5">
                      <span className="shrink-0 rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
                        {row.ref}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-900">
                        {row.client}
                      </span>
                      <span className="shrink-0 font-mono text-[11.5px] font-semibold tabular-nums text-ink-900">
                        {formatNGN(row.total)}
                      </span>
                      <span
                        className={`hidden shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.06em] sm:inline ${
                          STATUS_STYLE[row.status]
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </WindowFrame>
            </div>
          </Reveal>
        </div>

        {/* ── Smaller features ── */}
        <ul className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-ink-100 bg-ink-100 sm:grid-cols-2 lg:grid-cols-4">
          {SMALL_FEATURES.map((feature, i) => (
            <Reveal as="li" key={feature.title} delay={i * 60} className="bg-white p-6">
              <h3 className="font-display text-[15px] font-bold leading-snug text-ink-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{feature.body}</p>
            </Reveal>
          ))}
        </ul>

        {/* ── Built for the phone that's actually in your pocket ── */}
        <Reveal delay={100}>
          <div className="mt-5 flex flex-col gap-6 rounded-2xl border border-ink-100 bg-paper p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold leading-snug tracking-[-0.018em] text-ink-900">
                Built for a mid-range Android on a bad network
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">
                Install it from the browser and it behaves like an app — no store, no download. Site
                photos are compressed on your phone before they're sent, and the heavy PDF code only
                loads the first time you actually export something.
              </p>
            </div>
            <ul className="grid shrink-0 gap-3 sm:w-52">
              {[
                { icon: Smartphone, label: "Installs as an app" },
                { icon: Wifi, label: "Low-data by default" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                >
                  <Icon size={15} className="shrink-0 text-brand-blue" aria-hidden="true" />
                  <span className="text-[13px] font-medium text-ink-700">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
