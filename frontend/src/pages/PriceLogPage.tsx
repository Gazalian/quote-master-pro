import { useMemo, useState } from "react";
import { Money } from "@/lib/currency";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import { PriceLogEditor } from "@/components/PriceLogEditor";
import { PriceRowSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import type { PriceLogEntry } from "@/types/quote";
import {
  usePriceLog,
  useUpsertPriceLog,
  useUpdatePriceLog,
  useDeletePriceLog,
} from "@/hooks/usePriceLog";

type PriceTab = "MATERIALS" | "LABOUR" | "AI SUGGESTIONS";
const tabs: PriceTab[] = ["MATERIALS", "LABOUR", "AI SUGGESTIONS"];

const PriceLogPage = () => {
  const [tab, setTab] = useState<PriceTab>("MATERIALS");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PriceLogEntry | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { data: rows = [], isLoading } = usePriceLog();
  const upsert = useUpsertPriceLog();
  const update = useUpdatePriceLog();
  const remove = useDeletePriceLog();

  const entries: PriceLogEntry[] = useMemo(
    () =>
      rows
        .filter((r) => (tab === "AI SUGGESTIONS" ? false : (r.type ?? "MATERIALS") === tab))
        .map((r) => ({
          id: r.id,
          name: r.item_name,
          unit: r.unit,
          unitPrice: Number(r.price),
          category: r.category ?? undefined,
          supplier: r.supplier ?? undefined,
          type: r.type,
          lastUpdated: new Date(r.last_used_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        })),
    [rows, tab],
  );

  const filtered = useMemo(
    () => entries.filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase())),
    [entries, search],
  );

  const handleSave = async (entry: PriceLogEntry) => {
    try {
      const payload = {
        name: entry.name,
        unit: entry.unit,
        unitPrice: entry.unitPrice,
        type: (tab === "LABOUR" ? "LABOUR" : "MATERIALS") as "LABOUR" | "MATERIALS",
        category: entry.category ?? null,
        supplier: entry.supplier ?? null,
      };
      if (editing && editing.id) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success("Price updated");
      } else {
        await upsert.mutateAsync(payload);
        toast.success("Price added");
      }
      setEditing(null);
      setIsAdding(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save price");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Item deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  if (editing || isAdding) {
    return (
      <PriceLogEditor
        entry={editing}
        type={tab === "LABOUR" ? "LABOUR" : "MATERIALS"}
        onClose={() => {
          setEditing(null);
          setIsAdding(false);
        }}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2 bg-card shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">Price Log</h1>
          {tab !== "AI SUGGESTIONS" && (
            <button
              onClick={() => setIsAdding(true)}
              className="touch-target bg-primary text-primary-foreground rounded-full flex items-center justify-center"
              aria-label="Add price"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prices..."
            className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`min-h-[40px] px-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {t === "AI SUGGESTIONS" ? "AI prices" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mobile-scroll flex-1 px-4 py-3 space-y-2">
        {isLoading ? (
          <PriceRowSkeleton />
        ) : tab === "AI SUGGESTIONS" ? (
          <div className="mt-8 rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">Not available yet</p>
            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
              This will collect the prices OtoQuote estimated for you, so you can confirm the ones
              that were right and correct the ones that weren't. For now, save prices from the quote
              editor or with the + button.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm mt-8">No items found</p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card px-3.5 py-2.5 transition-colors hover:border-border/80"
            >
              {/* One row, not three stacked blocks. The old layout put price,
                  date and the two icon buttons in a right-hand column, which
                  left an L-shaped void under the item name and made every row
                  twice as tall as it needed to be. */}
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.category ? `${item.category} · ` : ""}
                    {item.unit}
                    {item.supplier ? ` · ${item.supplier}` : ""}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <Money amount={item.unitPrice} className="text-sm font-bold text-primary" />
                  <p className="text-[10px] text-muted-foreground">{item.lastUpdated}</p>
                </div>

                <div className="-mr-1.5 flex shrink-0 items-center">
                  <button
                    onClick={() => setEditing(item)}
                    className="touch-target flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="touch-target flex items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PriceLogPage;
