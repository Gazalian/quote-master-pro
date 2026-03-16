import { useState, useMemo } from "react";
import { X, Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Quote, QuoteGroup, QuoteItem } from "@/types/quote";
import { SortableGroup } from "./dnd/SortableGroup";
import { SortableItem } from "./dnd/SortableItem";

const formatNGN = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

interface Props {
  quote: Quote;
  onClose: () => void;
  onSave: (quote: Quote) => void;
}

export const QuoteEditor = ({ quote, onClose, onSave }: Props) => {
  const [editedQuote, setEditedQuote] = useState<Quote>(JSON.parse(JSON.stringify(quote)));
  const [vatEnabled, setVatEnabled] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [priceLogPrompt, setPriceLogPrompt] = useState<{ itemName: string; price: number; groupIdx: number; itemIdx: number } | null>(null);

  // DnD State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"Group" | "Item" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const groupIds = useMemo(() => editedQuote.groups.map((g) => g.id), [editedQuote.groups]);

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
        id: `img-${Date.now()}`,
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

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const vatRate = 0.075;
  const subtotal = editedQuote.grandTotal;
  const vatAmount = vatEnabled ? subtotal * vatRate : 0;
  const finalTotal = subtotal + vatAmount;

  // --- DnD Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
    setActiveType(active.data.current?.type);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    if (activeType !== "Item") return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    if (activeId === overId) return;

    const isActiveItem = active.data.current?.type === "Item";
    const isOverItem = over.data.current?.type === "Item";
    const isOverGroup = over.data.current?.type === "Group";

    if (!isActiveItem) return;

    setEditedQuote((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Quote;
      
      let activeGroupIdx = next.groups.findIndex(g => g.items.some(i => i.id === activeId));
      let overGroupIdx = isOverGroup 
        ? next.groups.findIndex(g => g.id === overId)
        : next.groups.findIndex(g => g.items.some(i => i.id === overId));
      
      if (activeGroupIdx === -1 || overGroupIdx === -1) return prev;

      const activeItemIndex = next.groups[activeGroupIdx].items.findIndex(i => i.id === activeId);
      const activeItem = next.groups[activeGroupIdx].items[activeItemIndex];

      if (activeGroupIdx !== overGroupIdx) {
        next.groups[activeGroupIdx].items.splice(activeItemIndex, 1);
        
        let overItemIndex = next.groups[overGroupIdx].items.length;
        if (isOverItem) {
          overItemIndex = next.groups[overGroupIdx].items.findIndex(i => i.id === overId);
          const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
          const modifier = isBelowOverItem ? 1 : 0;
          overItemIndex = overItemIndex >= 0 ? overItemIndex + modifier : next.groups[overGroupIdx].items.length + 1;
        }
        
        next.groups[overGroupIdx].items.splice(overItemIndex, 0, activeItem);
        return recalculate(next);
      }

      return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    setEditedQuote((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as Quote;

      if (active.data.current?.type === "Group" && over.data.current?.type === "Group") {
        const activeIdx = next.groups.findIndex(g => g.id === activeId);
        const overIdx = next.groups.findIndex(g => g.id === overId);
        next.groups = arrayMove(next.groups, activeIdx, overIdx);
        return recalculate(next);
      }

      if (active.data.current?.type === "Item") {
        const groupIdx = next.groups.findIndex(g => g.items.some(i => i.id === activeId));
        if (groupIdx !== -1) {
          const group = next.groups[groupIdx];
          const activeIdx = group.items.findIndex(i => i.id === activeId);
          const overIdx = group.items.findIndex(i => i.id === overId);
          if (activeIdx !== -1 && overIdx !== -1) {
             group.items = arrayMove(group.items, activeIdx, overIdx);
             return recalculate(next);
          }
        }
      }

      return prev;
    });
  };

  const renderItemContent = (item: QuoteItem, gi: number, ii: number) => {
    return (
      <div className="border border-border rounded-lg bg-card p-2.5 space-y-1.5 shadow-sm">
        <div className="flex items-center justify-between">
          <input
            value={item.name}
            onChange={(e) => updateItem(gi, ii, "name", e.target.value)}
            className="flex-1 text-sm font-medium text-foreground bg-transparent outline-none"
          />
          <div className="flex items-center gap-1.5 pl-2">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
              item.source === "my_price" ? "bg-badge-approved/15 text-badge-myprice" : "bg-badge-invoiced/15 text-badge-ai"
            }`}>
              {item.source === "my_price" ? "MY PRICE" : "AI EST."}
            </span>
            <button onClick={() => deleteItem(gi, ii)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
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
              className="w-full bg-secondary rounded px-2 py-1 text-xs text-foreground outline-none border border-transparent focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-muted-foreground">Unit</label>
            <input
              value={item.unit}
              onChange={(e) => updateItem(gi, ii, "unit", e.target.value)}
              className="w-full bg-secondary rounded px-2 py-1 text-xs text-foreground outline-none border border-transparent focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-muted-foreground">Price (₦)</label>
            <input
              type="number"
              value={item.unitPrice}
              onChange={(e) => updateItem(gi, ii, "unitPrice", e.target.value)}
              className="w-full bg-secondary rounded px-2 py-1 text-xs text-foreground outline-none border border-transparent focus:border-primary"
            />
          </div>
          <div className="w-16 text-right shrink-0">
            <label className="text-[9px] text-muted-foreground">Total</label>
            <p className="text-xs font-semibold text-foreground py-1 truncate">{formatNGN(item.total)}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleSave = () => {
    let finalClient = editedQuote.client.trim();
    if (!finalClient) finalClient = "Client X";
    onSave({ ...editedQuote, client: finalClient, grandTotal: finalTotal });
    toast.success("Quote saved!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 bg-primary shrink-0">
        <button onClick={onClose} className="text-primary-foreground hover:bg-white/10 p-1.5 rounded-full transition-colors">
          <X size={22} />
        </button>
        <span className="text-primary-foreground font-semibold">Edit Quote</span>
        <button onClick={handleSave} className="text-primary-foreground hover:bg-white/10 p-1.5 rounded-full transition-colors">
          <Save size={22} />
        </button>
      </div>

      {/* Client info */}
      <div className="px-4 py-3 bg-card border-b border-border space-y-2 shrink-0">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Client</label>
          <input
            value={editedQuote.client}
            onChange={(e) => setEditedQuote((prev) => ({ ...prev, client: e.target.value }))}
            placeholder="Client X"
            className="w-full text-sm font-medium text-foreground bg-transparent outline-none border-b border-border py-1 focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium uppercase">Description</label>
          <input
            value={editedQuote.description}
            onChange={(e) => setEditedQuote((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full text-sm text-foreground bg-transparent outline-none border-b border-border py-1 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* DnD Groups Area */}
      <div className="flex-1 overflow-y-auto px-2 md:px-4 py-3 bg-secondary/30">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
              {editedQuote.groups.map((group, gi) => {
                const collapsed = collapsedGroups.has(group.id);
                const groupTotal = group.items.reduce((s, i) => s + i.total, 0);
                const itemIds = group.items.map(i => i.id);

                return (
                  <SortableGroup key={group.id} id={group.id}>
                    <div className="w-full flex items-center justify-between px-4 py-3 bg-secondary rounded-t-xl hover:bg-secondary/80 transition-colors">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wide flex-1 mr-2 truncate">
                        {gi + 1}. {group.name}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-primary">{formatNGN(groupTotal)}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleGroup(group.id); }}
                          className="p-1 hover:bg-black/5 rounded-full text-muted-foreground"
                        >
                          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                      </div>
                    </div>

                    {!collapsed && (
                      <div className="px-2 py-3 bg-card rounded-b-xl border-t border-border">
                        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {group.items.map((item, ii) => (
                              <SortableItem key={item.id} id={item.id}>
                                {renderItemContent(item, gi, ii)}
                              </SortableItem>
                            ))}
                          </div>
                        </SortableContext>
                        <button
                          onClick={() => addItem(gi)}
                          className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 bg-secondary/50 hover:bg-secondary rounded-lg text-xs text-primary font-bold border border-dashed border-primary/30 transition-colors"
                        >
                          <Plus size={16} /> Add Item to {group.name}
                        </button>
                      </div>
                    )}
                  </SortableGroup>
                );
              })}
            </SortableContext>
          </div>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeId && activeType === "Group" ? (
              <div className="bg-card rounded-xl border-2 border-primary shadow-xl opacity-90 p-4">
                <span className="font-bold">Moving Group...</span>
              </div>
            ) : null}
            {activeId && activeType === "Item" ? (
              <div className="bg-card rounded-lg border-2 border-primary shadow-xl opacity-90 p-3">
                <span className="text-sm font-semibold">Moving Item...</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* VAT & Total */}
      <div className="px-4 py-3 bg-card border-t border-border space-y-2 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <label className="text-sm text-foreground font-medium">Add 7.5% VAT</label>
          <button
            onClick={() => setVatEnabled((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors relative ${vatEnabled ? "bg-primary" : "bg-secondary border border-border"}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transform transition-transform ${vatEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
        {vatEnabled && (
          <div className="flex justify-between text-xs font-medium text-muted-foreground animate-in fade-in slide-in-from-top-1">
            <span>VAT (7.5%)</span>
            <span>{formatNGN(vatAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 mt-1 border-t border-border border-dashed">
          <span className="font-bold text-foreground uppercase tracking-wide text-xs">Grand Total</span>
          <span className="font-bold text-xl text-primary">{formatNGN(finalTotal)}</span>
        </div>
      </div>

      {/* Price Log Prompt */}
      {priceLogPrompt && (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-6 pt-4 bg-card border-t border-border shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-5">
          <p className="text-sm text-foreground mb-4">
            Save <span className="font-bold text-primary">{formatNGN(priceLogPrompt.price)}</span> as your price for{" "}
            <span className="font-bold">{priceLogPrompt.itemName}</span> in your Price Log?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.success(`Saved to Price Log: ${priceLogPrompt.itemName}`);
                setPriceLogPrompt(null);
              }}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Save to Price Log
            </button>
            <button
              onClick={() => setPriceLogPrompt(null)}
              className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
