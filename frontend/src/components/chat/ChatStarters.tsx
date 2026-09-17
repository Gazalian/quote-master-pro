import { ImagePlus, PencilLine } from "lucide-react";

/**
 * First-run state for an empty chat.
 *
 * The blank thread was the weakest moment in the product: a new user landed on
 * an empty grey panel with a "tell me about the job" greeting and no idea how
 * much detail to give. Since sign-up already captures trade and state, we can
 * show three openers written the way that trade would actually describe a job
 * — which doubles as a worked example of the level of detail that produces a
 * good quotation.
 *
 * Tapping one fills the composer rather than sending it, so the user can add
 * their own numbers first. That keeps the example honest: it is a template,
 * not a shortcut to someone else's quote.
 */

const STARTERS: Record<string, string[]> = {
  electrician: [
    "Wire a 3-bedroom flat — 15 socket outlets, 10 lighting points, surface conduit.",
    "Supply and install an 8-way distribution board with changeover switch.",
    "Rewire a 2-bedroom bungalow, concealed conduit, including earthing.",
  ],
  plumber: [
    "Plumb 3 toilets and a kitchen — 3/4\" UPVC supply, 4\" PVC waste.",
    "Install a 1,000-litre overhead tank with 0.5HP pump and pipework.",
    "Soakaway and septic tank for a 3-bedroom bungalow.",
  ],
  builder: [
    "Block-work to lintel level, 3-bedroom bungalow, 6-inch blocks.",
    "Foundation and German floor for a 4-bedroom duplex.",
    "Plaster and render 180 sqm of internal walls.",
  ],
  painter: [
    "Putty and two coats of emulsion — 4 rooms plus the corridor.",
    "Exterior painting, 3-bedroom bungalow, weather-guard finish.",
    "Screed, sand and paint a 60 sqm open-plan office.",
  ],
  tiler: [
    "Tile 42 sqm of floor in 60×60 porcelain, plus skirting all round.",
    "Wall and floor tiles for two bathrooms, 30×60 wall tiles.",
    "Tile a kitchen floor and splash-back, 18 sqm total.",
  ],
  carpenter: [
    "Six flush doors with frames and mortice locks, fitted.",
    "Build and install kitchen cabinets, 4.5 metres run.",
    "PVC ceiling for a 3-bedroom flat including noggins.",
  ],
  general: [
    "Wire a 3-bedroom flat — 15 socket outlets and 10 lighting points.",
    "Block-work to lintel level, 3-bedroom bungalow, 6-inch blocks.",
    "Tile 42 sqm of floor in 60×60, plus skirting all round.",
  ],
};

/** Mirrors `normaliseTrade` in the backend prompt service. */
function normaliseTrade(trade?: string | null): keyof typeof STARTERS {
  const v = (trade ?? "").toLowerCase();
  if (v.includes("elect")) return "electrician";
  if (v.includes("plumb")) return "plumber";
  if (v.includes("build") || v.includes("mason")) return "builder";
  if (v.includes("paint")) return "painter";
  if (v.includes("tile")) return "tiler";
  if (v.includes("carpent")) return "carpenter";
  return "general";
}

export function ChatStarters({
  trade,
  state,
  onPick,
  onAttach,
}: {
  trade?: string | null;
  state?: string | null;
  onPick: (prompt: string) => void;
  onAttach: () => void;
}) {
  const starters = STARTERS[normaliseTrade(trade)];
  const knowsTrade = Boolean(trade);

  return (
    <div className="mx-auto w-full max-w-lg px-1 py-2">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-foreground">
          {knowsTrade ? `Quote your next ${trade?.toLowerCase()} job` : "Quote your next job"}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Describe the work the way you'd say it on site. Give sizes and counts where you know them —
          OtoQuote fills in the rest and marks whatever it assumed.
          {state ? ` Prices use ${state} rates and your saved prices.` : ""}
        </p>
      </div>

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Start from an example
      </p>

      <ul className="space-y-2">
        {starters.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onPick(prompt)}
              className="group flex w-full items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <PencilLine
                size={14}
                className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
              <span className="text-[13.5px] leading-snug text-foreground">{prompt}</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAttach}
        className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-dashed border-border bg-transparent px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ImagePlus size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-[13.5px] leading-snug text-muted-foreground">
          Or attach photos of the site and let OtoQuote read the scope
        </span>
      </button>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Tapping an example fills the box — edit it before you send.
      </p>
    </div>
  );
}
