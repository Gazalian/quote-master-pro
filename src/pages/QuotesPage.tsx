import { useState, useEffect } from "react";
import { ChevronLeft, Search, MoreVertical, Loader2 } from "lucide-react";
import { QuoteCard } from "@/components/QuoteCard";
import { toast } from "sonner";
import { Quote, QuoteStatus } from "@/types/quote";
import { quoteAPI } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const statusStyles: Record<QuoteStatus, string> = {
  APPROVED: "bg-badge-approved text-badge-approved-fg",
  INVOICED: "bg-badge-invoiced text-badge-invoiced-fg",
  ARCHIVED: "bg-badge-archived text-badge-archived-fg",
};

const filters: (QuoteStatus | "ALL")[] = ["ALL", "APPROVED", "INVOICED", "ARCHIVED"];

const formatNGN = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

const QuotesPage = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<QuoteStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, [user]);

  const fetchQuotes = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await quoteAPI.getQuotes();
      setQuotes(data);
    } catch (error: any) {
      toast.error("Failed to load quotations");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = quotes.filter((q) => {
    if (filter !== "ALL" && q.status !== filter) return false;
    const searchTerms = search.toLowerCase();
    if (search && !q.description.toLowerCase().includes(searchTerms) && !q.client.toLowerCase().includes(searchTerms) && !q.ref.toLowerCase().includes(searchTerms)) return false;
    return true;
  });

  const handleGenerateInvoice = async (id: string) => {
    try {
      await quoteAPI.updateQuote(id, { status: "INVOICED" });
      toast.success("Quote converted to Invoice successfully!");
      setOpenDropdownId(null);
      fetchQuotes(); // Refresh list to see new status
    } catch (error) {
       toast.error("Failed to generate invoice.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await quoteAPI.deleteQuote(id);
      toast.success("Quote deleted successfully");
      setOpenDropdownId(null);
      fetchQuotes(); // Refresh list
    } catch (error) {
      toast.error("Failed to delete quote");
    }
  };

  const handleDuplicate = async (quote: Quote) => {
    try {
      if (!user) return;
      const newRef = `OQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const newQuoteData: Partial<Quote> = {
         ref: newRef,
         client: quote.client,
         description: quote.description,
         status: "APPROVED",
         templateStyle: quote.templateStyle,
         grandTotal: quote.grandTotal,
         groups: quote.groups
      };
      await quoteAPI.createQuote(newQuoteData, user.id);
      toast.success("Quote duplicated successfully!");
      setOpenDropdownId(null);
      fetchQuotes();
    } catch (error) {
       toast.error("Failed to duplicate quote.");
    }
  };

  if (selectedQuote) {
    return (
      <div className="flex flex-col h-full bg-background relative">
        <div className="flex items-center gap-3 px-4 py-4 bg-card shrink-0 border-b border-border shadow-sm">
          <button onClick={() => { setSelectedQuote(null); fetchQuotes(); }} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={24} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{selectedQuote.client}</h1>
            <p className="text-xs text-muted-foreground font-mono">{selectedQuote.ref}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/10">
          <div className="max-w-4xl mx-auto">
            <QuoteCard 
              quote={selectedQuote} 
              mode="dashboard" 
              onQuoteSaved={(updated) => {
                setSelectedQuote(updated);
                fetchQuotes(); 
              }}
            />
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
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-3">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
             <p className="text-sm font-medium">Loading quotations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card">
            <p className="text-sm font-medium">No documents found</p>
            {search && <p className="text-xs mt-1">Try adjusting your search filters.</p>}
          </div>
        ) : (
          filtered.map((q) => (
            <div 
              key={q.id} 
              onClick={() => setSelectedQuote(q)}
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
                  <p className="font-semibold text-base text-foreground truncate">{q.client}</p>
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
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border shadow-xl rounded-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95">
                      {q.status === 'APPROVED' && (
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
                      {q.status !== 'ARCHIVED' && (
                         <button 
                          onClick={async () => {
                             await quoteAPI.updateQuote(q.id, { status: "ARCHIVED" });
                             fetchQuotes();
                             setOpenDropdownId(null);
                          }}
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
                <span className="text-xs font-semibold text-muted-foreground">{q.date}</span>
                <span className="font-black text-lg text-primary">{formatNGN(q.grandTotal)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuotesPage;
