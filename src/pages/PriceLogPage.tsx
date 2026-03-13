import { useState } from "react";
import { Search, Plus } from "lucide-react";

type PriceTab = "MATERIALS" | "LABOUR" | "AI SUGGESTIONS";

interface PriceEntry {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  supplier?: string;
  lastUpdated: string;
}

const mockMaterials: PriceEntry[] = [
  { id: "1", name: '2.5mm Twin Cable (Nigerchin)', category: "Electrical", unit: "per roll", unitPrice: 4800, supplier: "Jendol Stores, Apapa", lastUpdated: "10 Mar 2026" },
  { id: "2", name: 'Conduit Pipe (20mm)', category: "Electrical", unit: "per length", unitPrice: 450, supplier: "Alaba Market", lastUpdated: "8 Mar 2026" },
  { id: "3", name: '6-way DB Board', category: "Electrical", unit: "per unit", unitPrice: 22000, lastUpdated: "5 Mar 2026" },
  { id: "4", name: 'Sandcrete Blocks (9 inch)', category: "Structural", unit: "per block", unitPrice: 350, supplier: "Block Factory, Ikorodu", lastUpdated: "1 Mar 2026" },
  { id: "5", name: 'Sharp Sand', category: "Structural", unit: "per tipper", unitPrice: 45000, lastUpdated: "28 Feb 2026" },
  { id: "6", name: 'Dangote Cement (50kg)', category: "Structural", unit: "per bag", unitPrice: 5800, supplier: "Dangote Depot", lastUpdated: "1 Mar 2026" },
];

const mockLabour: PriceEntry[] = [
  { id: "l1", name: "Socket installation per point", category: "Electrical", unit: "per point", unitPrice: 2500, lastUpdated: "10 Mar 2026" },
  { id: "l2", name: "Plastering per m²", category: "Finishes", unit: "per m²", unitPrice: 1200, lastUpdated: "5 Mar 2026" },
  { id: "l3", name: "Plumbing pipe run per metre", category: "Plumbing", unit: "per metre", unitPrice: 800, lastUpdated: "3 Mar 2026" },
];

const tabs: PriceTab[] = ["MATERIALS", "LABOUR", "AI SUGGESTIONS"];
const formatNGN = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

const PriceLogPage = () => {
  const [tab, setTab] = useState<PriceTab>("MATERIALS");
  const [search, setSearch] = useState("");

  const items = tab === "MATERIALS" ? mockMaterials : tab === "LABOUR" ? mockLabour : [];
  const filtered = items.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 bg-card shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">Price Log</h1>
          <button className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center">
            <Plus size={20} />
          </button>
        </div>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prices..."
            className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {t === "AI SUGGESTIONS" ? "AI Sugg." : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {tab === "AI SUGGESTIONS" ? (
          <p className="text-center text-muted-foreground text-sm mt-8">
            AI suggestions will appear here after generating quotes
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm mt-8">No items found</p>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-card rounded-xl p-3.5 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.category} · {item.unit}
                  </p>
                  {item.supplier && (
                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-bold text-sm text-primary">{formatNGN(item.unitPrice)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.lastUpdated}</p>
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
