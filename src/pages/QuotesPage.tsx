import { useMemo, useState } from "react";
import { ChevronLeft, Search, MoreVertical, Loader2 } from "lucide-react";
import { QuoteCard } from "@/components/QuoteCard";
import { QuoteRowSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import type { Quote, QuoteStatus } from "@/types/quote";
import {
  useQuotesList,
  useQuote,
  useUpdateQuote,
  useDeleteQuote,
  useSaveQuote,
  type QuoteListRow,
} from "@/hooks/useQuotes";

const statusStyles: Record<QuoteStatus, string> = {
  APPROVED: "bg-badge-approved text-badge-approved-fg",
  INVOICED: "bg-badge-invoiced text-badge-invoiced-fg",
  ARCHIVED: "bg-badge-archived text-badge-archived-fg",
};

const filters: (QuoteStatus | "ALL")[] = ["ALL", "APPROVED", "INVOICED", "ARCHIVED"];
const formatNGN = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

// Maps the lightweight list row → a full-ish Quote for QuoteCard (used only
// when the user opens a list item; the detail view fetches the heavy data).
function rowToQuote(row: QuoteListRow): Quote {
  return {
    id: row.id,
    user_id: "",
    ref: row.ref,
    date: new Date(row.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    client: row.client_name,
    description: row.description,
    groups: [],
    grandTotal: Number(row.grand_total),
    status: row.status,
    templateStyle: (row.template_style as any) ?? "classic",
    version: row.version,
    session_id: row.session_id ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const QuotesPage = () => {
  const [filter, setFilter] = useState<QuoteStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuotesList(filter);
  const { data: selectedQuoteFull } = useQuote(selectedId);
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const saveQuote = useSaveQuote();

  const filtered = useMemo(
    () =>
      rows.filter((q) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          q.description.toLowerCase().includes(s) ||
          q.client_name?.toLowerCase().includes(s) ||
          q.ref.toLowerCase().includes(s)
        );
      }),
    [rows, search],
  );

  const handleGenerateInvoice = async (id: string) => {
    try {
      await updateQuote.mutateAsync({ id, patch: { status: "INVOICED" } });
      toast.success("Quote converted to Invoice!");
    } catch {
      toast.error("Failed to generate invoice.");
    } finally {
      setOpenDropdownId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuote.mutateAsync(id);
      toast.success("Quote deleted");
    } catch {
      toast.error("Failed to delete quote");
    } finally {
      setOpenDropdownId(null);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await updateQuote.mutateAsync({ id, patch: { status: "ARCHIVED" } });
    } finally {
      setOpenDropdownId(null);
    }
  };

  const handleDuplicate = async (row: QuoteListRow) => {
    try {
      // Need the full quote (with data.groups) — fetch then re-save through
      // the atomic backend RPC so points are correctly accounted for.
      const detail = (await import("@/lib/apiClient")).api;
      const full = await detail.get<any>(`/api/quotes/${row.id}`);
      const newRef = `OQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      await saveQuote.mutateAsync({
        sessionId: null,
        templateStyle: row.template_style as any,
        draft: {
          ref: newRef,
          client: row.client_name,
          description: row.description,
          groups: full?.data?.groups ?? [],
          grandTotal: Number(row.grand_total),
          templateStyle: row.template_style as any,
        },
      });
      toast.success("Quote duplicated!");
    } catch (e: any) {
      toast.error("Failed to duplicate" + (e?.status === 402 ? ": insufficient points" : ""));
    } finally {
      setOpenDropdownId(null);
    }
  };

  if (selectedId) {
    const selectedRow = rows.find((q) => q.id === selectedId);
    const displayQuote: Quote | null = selectedQuoteFull
      ? {
          id: selectedQuoteFull.id,
          user_id: selectedQuoteFull.user_id ?? "",
          ref: selectedQuoteFull.ref,
          date: new Date(selectedQuoteFull.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          client: selectedQuoteFull.client_name,
          description: selectedQuoteFull.description,
          groups: selectedQuoteFull.data?.groups ?? [],
          grandTotal: Number(selectedQuoteFull.grand_total),
          status: selectedQuoteFull.status,
          templateStyle: selectedQuoteFull.template_style ?? "classic",
          version: selectedQuoteFull.version,
          session_id: selectedQuoteFull.session_id ?? undefined,
          created_at: selectedQuoteFull.created_at,
          updated_at: selectedQuoteFull.updated_at,
        }
      : selectedRow
      ? rowToQuote(selectedRow)
      : null;

    return (
      <div className="flex flex-col h-full bg-background relative">
        <div className="flex items-center gap-3 px-4 py-4 bg-card shrink-0 border-b border-border shadow-sm">
          <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={24} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{displayQuote?.client}</h1>
            <p className="text-xs text-muted-foreground font-mono">{displayQuote?.ref}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/10">
          <div className="max-w-4xl mx-auto">
            {displayQuote ? (
              <QuoteCard quote={displayQuote} mode="dashboard" />
            ) : (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative" onClick={() => setOpenDropdownId(null)}>
      <div className="px-4 py-6 bg-card shrink-0 border-b border-border shadow-sm">
        <h1 className="text-2xl font-bold text-foreground mb-4">Quotations</h1>
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client, ref, or description..."
            className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none border border-border focus:border-primary transition-colors shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-secondary/10">
        {isLoading ? (
          <QuoteRowSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
            <p className="text-sm font-medium">No documents found</p>
            {search && <p className="text-xs mt-1">Try adjusting your search filters.</p>}
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              onClick={() => setSelectedId(q.id)}
              className="bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all relative group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wide ${statusStyles[q.status]}`}>
                      {q.status}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 rounded-md">{q.ref}</span>
                  </div>
                  <p className="font-semibold text-base text-foreground truncate">{q.client_name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{q.description}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === q.id ? null : q.id);
                    }}
                    className="text-muted-foreground hover:bg-secondary hover:text-foreground p-1.5 rounded-lg transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {openDropdownId === q.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 w-48 bg-card border border-border shadow-xl rounded-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95"
                    >
                      {q.status === "APPROVED" && (
                        <button
                          onClick={() => handleGenerateInvoice(q.id)}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          Generate Invoice
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(q)}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        Duplicate Document
                      </button>
                      {q.status !== "ARCHIVED" && (
                        <button
                          onClick={() => handleArchive(q.id)}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                        >
                          Archive Document
                        </button>
                      )}
                      <div className="h-px bg-border/50 my-1 mx-2" />
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Delete Document
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-end justify-between mt-4 pt-4 border-t border-border/50">
                <span className="text-xs font-semibold text-muted-foreground">
                  {new Date(q.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <span className="font-black text-lg text-primary">{formatNGN(Number(q.grand_total))}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuotesPage;
