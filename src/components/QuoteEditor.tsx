import { useState } from "react";
import { X, Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface QuoteItem {
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  source: "my_price" | "ai_estimate";
}

interface QuoteGroup {
  name: string;
  items: QuoteItem[];
}

interface Quote {
  ref: string;
  date: string;
  client: string;
  description: string;
  groups: QuoteGroup[];
  grandTotal: number;
}

const formatNGN = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

interface Props {
  quote: Quote;
  onClose: () => void;
  onSave: (quote: Quote) => void;
}

export const QuoteEditor = ({ quote, onClose, onSave }: Props) => {
  const [editedQuote, setEditedQuote] = useState<Quote>(JSON.parse(JSON.stringify(quote)));
  const [vatEnabled, setVatEnabled] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const [priceLogPrompt, setPriceLogPrompt] = useState<{ itemName: string; price: number; groupIdx: number; itemIdx: number } | null>(null);

  const vatRate = 0.075;

  const recalculate = (q: Quote): Quote => {
    const updated = { ...q };
    updated.groups = updated.groups.map((g) => ({
      ...g,
      items: g.items.map((item) => ({ ...item, total: item.qty * item.unitPrice })),
    }));
    updated.grandTotal = updated.groups.reduce(
      (sum, g) => sum + g.items.reduce((s, i) => s + i.total, 0),
      0
    );
    return updated;
  };

  const updateItem = (gi: number, ii: number, field: keyof QuoteItem, value: string | number) => {
    setEditedQuote((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Quote;
      const item = next.groups[gi].items[ii];
      if (field === "unitPrice") {
        const oldPrice = item.unitPrice;
        item.unitPrice = Number(value);
        if (oldPrice !== Number(value)) {
          item.source = "my_price";
          setPriceLogPrompt({ itemName: item.name, price: Number(value), groupIdx: gi, itemIdx: ii });
        }
      } else if (field === "qty") {
        item.qty = Number(value);
      } else {
        (item as any)[field] = value;
      }
      return recalculate(next);
    });
  };

  const deleteItem = (gi: number, ii: number) => {
    setEditedQuote((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Quote;
      next.groups[gi].items.splice(ii, 1);
      if (next.groups[gi].items.length === 0) next.groups.splice(gi, 1);
      return recalculate(next);
    });
  };

  const addItem = (gi: number) => {
    setEditedQuote((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Quote;
      next.groups[gi].items.push({
        name: "New Item",
        qty: 1,
        unit: "unit",
        unitPrice: 0,
        total: 0,
        source: "my_price",
      });
      return recalculate(next);
    });
  };

  const toggleGroup = (gi: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(gi) ? next.delete(gi) : next.add(gi);
      return next;
    });
  };

  const subtotal = editedQuote.grandTotal;
  const vatAmount = vatEnabled ? subtotal * vatRate : 0;
  const finalTotal = subtotal + vatAmount;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 bg-primary shrink-0">
        <button onClick={onClose} className="text-primary-foreground">
          <X size={22} />
        </button>
        <span className="text-primary-foreground font-semibold">Edit Quote</span>
        <button
          onClick={() => { onSave({ ...editedQuote, grandTotal: finalTotal }); toast.success("Quote saved!"); }}
          className="text-primary-foreground"
        >
          <Save size={22} />
        </button>
      </div>

      {/* Client info */}
      <div className="px-4 py-3 bg-card border-b border-border space-y-2">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Client</label>
          <input
            value={editedQuote.client}
            onChange={(e) => setEditedQuote((prev) => ({ ...prev, client: e.target.value }))}
            className="w-full text-sm font-medium text-foreground bg-transparent outline-none border-b border-border py-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Description</label>
          <input
            value={editedQuote.description}
            onChange={(e) => setEditedQuote((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full text-sm text-foreground bg-transparent outline-none border-b border-border py-1"
          />
        </div>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {editedQuote.groups.map((group, gi) => {
          const collapsed = collapsedGroups.has(gi);
          const groupTotal = group.items.reduce((s, i) => s + i.total, 0);
          return (
            <div key={gi} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleGroup(gi)}
                className="w-full flex items-center justify-between px-4 py-3 bg-secondary"
              >
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {gi + 1}. {group.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{formatNGN(groupTotal)}</span>
                  {collapsed ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronUp size={16} className="text-muted-foreground" />}
                </div>
              </button>

              {!collapsed && (
                <div className="px-3 py-2 space-y-2">
                  {group.items.map((item, ii) => (
                    <div key={ii} className="border border-border rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <input
                          value={item.name}
                          onChange={(e) => updateItem(gi, ii, "name", e.target.value)}
                          className="flex-1 text-sm font-medium text-foreground bg-transparent outline-none"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.source === "my_price" ? "bg-badge-approved/15 text-badge-myprice" : "bg-badge-invoiced/15 text-badge-ai"
                          }`}>
                            {item.source === "my_price" ? "MY PRICE" : "AI EST."}
                          </span>
                          <button onClick={() => deleteItem(gi, ii)} className="text-destructive p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[9px] text-muted-foreground">Qty</label>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(gi, ii, "qty", e.target.value)}
                            className="w-full bg-secondary rounded px-2 py-1 text-xs text-foreground outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] text-muted-foreground">Unit</label>
                          <input
                            value={item.unit}
                            onChange={(e) => updateItem(gi, ii, "unit", e.target.value)}
                            className="w-full bg-secondary rounded px-2 py-1 text-xs text-foreground outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] text-muted-foreground">Unit Price (₦)</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(gi, ii, "unitPrice", e.target.value)}
                            className="w-full bg-secondary rounded px-2 py-1 text-xs text-foreground outline-none"
                          />
                        </div>
                        <div className="w-16 text-right">
                          <label className="text-[9px] text-muted-foreground">Total</label>
                          <p className="text-xs font-semibold text-foreground py-1">{formatNGN(item.total)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(gi)}
                    className="w-full flex items-center justify-center gap-1 py-2 text-xs text-primary font-medium"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* VAT & Total */}
      <div className="px-4 py-3 bg-card border-t border-border space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground font-medium">Add 7.5% VAT</label>
          <button
            onClick={() => setVatEnabled((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors ${vatEnabled ? "bg-primary" : "bg-secondary"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-card shadow transform transition-transform ${vatEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {vatEnabled && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>VAT (7.5%)</span>
            <span>{formatNGN(vatAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1">
          <span className="font-semibold text-foreground">Grand Total</span>
          <span className="font-bold text-lg text-primary">{formatNGN(finalTotal)}</span>
        </div>
      </div>

      {/* Price Log Prompt */}
      {priceLogPrompt && (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-6 pt-3 bg-card border-t border-border shadow-2xl">
          <p className="text-sm text-foreground mb-3">
            Save <span className="font-bold text-primary">{formatNGN(priceLogPrompt.price)}</span> as your price for{" "}
            <span className="font-bold">{priceLogPrompt.itemName}</span> in your Price Log?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.success(`Saved to Price Log: ${priceLogPrompt.itemName}`);
                setPriceLogPrompt(null);
              }}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold"
            >
              Save to Price Log
            </button>
            <button
              onClick={() => setPriceLogPrompt(null)}
              className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-sm font-semibold"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
