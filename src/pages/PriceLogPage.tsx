import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { PriceLogEditor } from "@/components/PriceLogEditor";
import { useAuth } from "@/lib/AuthContext";
import { priceLogAPI } from "@/lib/api";
import { toast } from "sonner";

import { PriceLogEntry } from "@/types/quote";

type PriceTab = "MATERIALS" | "LABOUR" | "AI SUGGESTIONS";


const tabs: PriceTab[] = ["MATERIALS", "LABOUR", "AI SUGGESTIONS"];
const formatNGN = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

const PriceLogPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<PriceTab>("MATERIALS");
  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<PriceLogEntry[]>([]);
  const [labour, setLabour] = useState<PriceLogEntry[]>([]);
  const [editing, setEditing] = useState<PriceLogEntry | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const entries = await priceLogAPI.getEntries();
        setMaterials(entries.filter((e: any) => e.type === "MATERIALS"));
        setLabour(entries.filter((e: any) => e.type === "LABOUR"));
      } catch (error) {
        console.error("Failed to fetch price logs (using fallback):", error);
        // Fallback for demo if DB isn't provisioned
        setMaterials([]);
        setLabour([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntries();
  }, []);

  const items = tab === "MATERIALS" ? materials : tab === "LABOUR" ? labour : [];
  const filtered = items.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (entry: PriceLogEntry) => {
    if (!user) return;
    try {
       const payload = { ...entry, type: tab === "LABOUR" ? "LABOUR" : "MATERIALS" };
       if (editing) {
         await priceLogAPI.updateEntry(entry.id, payload);
         toast.success("Price updated");
       } else {
         await priceLogAPI.createEntry(payload, user.id);
         toast.success("Price added");
       }
       
       // Reload
       const entries = await priceLogAPI.getEntries();
       setMaterials(entries.filter((e: any) => e.type === "MATERIALS"));
       setLabour(entries.filter((e: any) => e.type === "LABOUR"));
       
       setEditing(null);
       setIsAdding(false);
    } catch (e: any) {
       toast.error(e.message || "Failed to save price");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await priceLogAPI.deleteEntry(id);
      const setter = tab === "MATERIALS" ? setMaterials : setLabour;
      setter((prev) => prev.filter((p) => p.id !== id));
      toast.success("Item deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  if (editing || isAdding) {
    return (
      <PriceLogEditor
        entry={editing}
        type={tab === "LABOUR" ? "LABOUR" : "MATERIALS"}
        onClose={() => { setEditing(null); setIsAdding(false); }}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 bg-card shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">Price Log</h1>
          {tab !== "AI SUGGESTIONS" && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center"
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
        {isLoading ? (
          <div className="flex justify-center items-center h-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : tab === "AI SUGGESTIONS" ? (
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
                    {item.category ? `${item.category} · ` : ""}{item.unit}
                  </p>

                  {item.supplier && (
                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">{formatNGN(item.unitPrice)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.lastUpdated}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setEditing(item)} className="p-1.5 text-muted-foreground hover:text-primary">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
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
