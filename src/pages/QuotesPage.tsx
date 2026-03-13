import { useState } from "react";
import { Search, MoreVertical } from "lucide-react";

type QuoteStatus = "PENDING" | "APPROVED" | "INVOICED" | "ARCHIVED";

interface QuoteSummary {
  id: string;
  ref: string;
  title: string;
  client: string;
  date: string;
  total: number;
  status: QuoteStatus;
}

const mockQuotes: QuoteSummary[] = [
  { id: "1", ref: "OQ-2026-0047", title: "Rewiring – 3 Bed Flat – Wuse 2", client: "Alhaji Musa Bello", date: "13 Mar 2026", total: 232700, status: "PENDING" },
  { id: "2", ref: "OQ-2026-0046", title: "Kitchen Plumbing – Lekki Phase 1", client: "Mrs. Adebayo", date: "11 Mar 2026", total: 185000, status: "APPROVED" },
  { id: "3", ref: "OQ-2026-0044", title: "Generator Wiring – 5 Bed Duplex", client: "Chief Okonkwo", date: "8 Mar 2026", total: 475000, status: "INVOICED" },
  { id: "4", ref: "OQ-2026-0041", title: "AC Installation – Office Block", client: "Zenith Properties", date: "2 Mar 2026", total: 890000, status: "ARCHIVED" },
  { id: "5", ref: "OQ-2026-0039", title: "Bathroom Renovation – Ikoyi", client: "Dr. Fashola", date: "28 Feb 2026", total: 345000, status: "PENDING" },
];

const statusStyles: Record<QuoteStatus, string> = {
  PENDING: "bg-badge-pending text-badge-pending-fg",
  APPROVED: "bg-badge-approved text-badge-approved-fg",
  INVOICED: "bg-badge-invoiced text-badge-invoiced-fg",
  ARCHIVED: "bg-badge-archived text-badge-archived-fg",
};

const filters: (QuoteStatus | "ALL")[] = ["ALL", "PENDING", "APPROVED", "INVOICED", "ARCHIVED"];

const formatNGN = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

const QuotesPage = () => {
  const [filter, setFilter] = useState<QuoteStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = mockQuotes.filter((q) => {
    if (filter !== "ALL" && q.status !== filter) return false;
    if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !q.client.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 bg-card shrink-0">
        <h1 className="text-xl font-bold text-foreground mb-3">Quotation History</h1>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotes..."
            className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm mt-8">No quotes found</p>
        ) : (
          filtered.map((q) => (
            <div key={q.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{q.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.client} · {q.ref}</p>
                </div>
                <button className="text-muted-foreground ml-2">
                  <MoreVertical size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[q.status]}`}>
                    {q.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{q.date}</span>
                </div>
                <span className="font-bold text-sm text-foreground">{formatNGN(q.total)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuotesPage;
