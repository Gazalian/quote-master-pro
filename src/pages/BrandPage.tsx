import { useState, useEffect } from "react";
import { Upload, Building2, CreditCard, Paintbrush } from "lucide-react";

const presetColors = [
  { name: "Teal", hsl: "170 75% 31%" },
  { name: "Blue", hsl: "220 70% 50%" },
  { name: "Orange", hsl: "25 95% 53%" },
  { name: "Red", hsl: "0 72% 51%" },
  { name: "Purple", hsl: "270 70% 50%" },
  { name: "Green", hsl: "142 71% 35%" },
  { name: "Navy", hsl: "220 60% 25%" },
  { name: "Gold", hsl: "45 93% 47%" },
];

const BrandPage = () => {
  const [selectedColor, setSelectedColor] = useState("170 75% 31%");
  const [customHex, setCustomHex] = useState("#0f8a6e");

  // Live inject brand color into CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty("--primary", selectedColor);
    document.documentElement.style.setProperty("--ring", selectedColor);
    document.documentElement.style.setProperty("--nav-active", selectedColor);
    document.documentElement.style.setProperty("--bubble-user", selectedColor);
  }, [selectedColor]);

  const hexToHsl = (hex: string): string | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleCustomColor = (hex: string) => {
    setCustomHex(hex);
    const hsl = hexToHsl(hex);
    if (hsl) setSelectedColor(hsl);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 bg-card shrink-0">
        <h1 className="text-xl font-bold text-foreground">Brand & Company</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your brand appears on every quote & invoice</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Logo upload */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5">
            <Upload size={24} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">Upload Logo</span>
          </div>
        </div>

        {/* Brand Color Picker */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Paintbrush size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Brand Color</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">This color will be used in your quotes, invoices, and the app theme</p>
          
          <div className="flex flex-wrap gap-2.5 mb-3">
            {presetColors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c.hsl)}
                className={`w-10 h-10 rounded-xl border-2 transition-all ${
                  selectedColor === c.hsl ? "border-foreground scale-110 shadow-md" : "border-transparent"
                }`}
                style={{ backgroundColor: `hsl(${c.hsl})` }}
                title={c.name}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Custom:</label>
            <input
              type="color"
              value={customHex}
              onChange={(e) => handleCustomColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer"
            />
            <input
              value={customHex}
              onChange={(e) => handleCustomColor(e.target.value)}
              placeholder="#0f8a6e"
              className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none border border-border"
            />
          </div>

          {/* Preview */}
          <div className="mt-3 p-3 rounded-xl border border-border bg-card">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
            <div className="flex gap-2">
              <div className="flex-1 py-2 rounded-lg text-center text-xs font-semibold text-primary-foreground" style={{ backgroundColor: `hsl(${selectedColor})` }}>
                Primary Button
              </div>
              <div className="flex-1 py-2 rounded-lg text-center text-xs font-semibold border-2" style={{ borderColor: `hsl(${selectedColor})`, color: `hsl(${selectedColor})` }}>
                Outline
              </div>
            </div>
          </div>
        </section>

        {/* Company info */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Company Information</h2>
          </div>
          <div className="space-y-3">
            <FieldInput label="Company / Trading Name" placeholder="e.g. Emeka Electrical Services" />
            <FieldInput label="Tagline (optional)" placeholder="e.g. Quality Electrical Works in Lagos" />
            <FieldInput label="Business Address" placeholder="12 Bode Thomas St, Surulere, Lagos" />
            <FieldInput label="Phone Number" placeholder="+234 8XX XXX XXXX" />
            <FieldInput label="WhatsApp Number" placeholder="+234 8XX XXX XXXX" />
            <FieldInput label="Email Address (optional)" placeholder="emeka@email.com" />
            <FieldInput label="RC Number (optional)" placeholder="CAC registration number" />
          </div>
        </section>

        {/* Bank details */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Bank Account Details</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Shown on invoices for payment</p>
          <div className="space-y-3">
            <FieldInput label="Bank Name" placeholder="e.g. GTBank" />
            <FieldInput label="Account Name" placeholder="As registered with bank" />
            <FieldInput label="Account Number" placeholder="10-digit NUBAN number" />
          </div>
        </section>

        <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">
          Save Settings
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
};

const FieldInput = ({ label, placeholder }: { label: string; placeholder: string }) => (
  <div>
    <label className="text-xs font-medium text-foreground mb-1 block">{label}</label>
    <input
      placeholder={placeholder}
      className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary"
    />
  </div>
);

export default BrandPage;
