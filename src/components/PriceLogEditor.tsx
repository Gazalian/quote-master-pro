import { useState } from "react";
import { X, Save } from "lucide-react";

interface PriceEntry {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  supplier?: string;
}

interface Props {
  entry?: PriceEntry | null;
  type: "MATERIALS" | "LABOUR";
  onClose: () => void;
  onSave: (entry: PriceEntry) => void;
}

const materialCategories = ["Electrical", "Structural", "Plumbing", "Finishes", "Roofing", "Other"];
const labourCategories = ["Electrical", "Plumbing", "Structural", "Finishes", "Painting", "Other"];

export const PriceLogEditor = ({ entry, type, onClose, onSave }: Props) => {
  const categories = type === "MATERIALS" ? materialCategories : labourCategories;
  const [form, setForm] = useState<PriceEntry>(
    entry || {
      id: Date.now().toString(),
      name: "",
      category: categories[0],
      unit: type === "MATERIALS" ? "per unit" : "per job",
      unitPrice: 0,
      supplier: "",
    }
  );

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 h-14 bg-primary shrink-0">
        <button onClick={onClose} className="text-primary-foreground"><X size={22} /></button>
        <span className="text-primary-foreground font-semibold">{entry ? "Edit" : "Add"} {type === "MATERIALS" ? "Material" : "Labour"}</span>
        <button onClick={handleSave} className="text-primary-foreground"><Save size={22} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <Field label="Item Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. 2.5mm Twin Cable" />
        
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none border border-border"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <Field label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="e.g. per roll, per metre" />
        
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Unit Price (₦)</label>
          <input
            type="number"
            value={form.unitPrice || ""}
            onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
            placeholder="0"
            className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary"
          />
        </div>

        {type === "MATERIALS" && (
          <Field label="Supplier (optional)" value={form.supplier || ""} onChange={(v) => setForm({ ...form, supplier: v })} placeholder="e.g. Jendol Stores, Apapa" />
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div>
    <label className="text-xs font-medium text-foreground mb-1 block">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary"
    />
  </div>
);
