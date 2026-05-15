import { useEffect, useState } from "react";
import { Upload, Building2, CreditCard, Paintbrush, LayoutTemplate, Loader2, Pipette } from "lucide-react";
import { HslColorPicker } from "react-colorful";
import { TemplateStyle } from "@/types/quote";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useUpdateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const presetColors = [
  { name: "Signal Orange", hsl: "24 93% 54%" }, // OtoQuote Primary
  { name: "Tech Blue", hsl: "212 100% 41%" }, // OtoQuote Secondary
  { name: "Emerald", hsl: "142 76% 36%" }, // OtoQuote Success
  { name: "Orange", hsl: "25 95% 53%" },
  { name: "Blue", hsl: "220 70% 50%" },
  { name: "Red", hsl: "0 72% 51%" },
  { name: "Purple", hsl: "270 70% 50%" },
  { name: "Navy", hsl: "220 60% 25%" },
  { name: "Gold", hsl: "45 93% 47%" },
  { name: "Charcoal", hsl: "220 40% 15%" },
];

// Helper functions for color conversion
const hslStringToObject = (hslString: string) => {
  const [h, s, l] = hslString.split(' ').map(v => parseFloat(v));
  return { h, s, l };
};

const hslObjectToString = (hsl: { h: number; s: number; l: number }) => {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
};

const BrandPage = () => {
  const { data: bootstrap, isLoading } = useBootstrap();
  const updateProfile = useUpdateProfile();
  const isSaving = updateProfile.isPending;

  // Settings State
  const [primaryColor, setPrimaryColor] = useState("24 93% 54%");
  const [secondaryColor, setSecondaryColor] = useState("212 100% 41%");
  const [template, setTemplate] = useState<TemplateStyle>("classic");
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);
  
  // Company Info State
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // Payment Info State
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("");

  // Live inject document brand colors into CSS variables for preview
  useEffect(() => {
    document.documentElement.style.setProperty("--doc-primary", primaryColor);
    document.documentElement.style.setProperty("--doc-secondary", secondaryColor);
  }, [primaryColor, secondaryColor]);

  // Hydrate local form state from the cached bootstrap exactly once per fetch.
  useEffect(() => {
    const data = bootstrap?.profile;
    if (!data) return;
    setCompanyName(data.company_name || "");
    setEmail(data.email || "");
    setPhone(data.phone || "");
    setWhatsapp(data.whatsapp || "");
    setAddress(data.address || "");
    setContactPerson(data.contact_person || "");
    setCacNumber(data.cac_number || "");
    setLogoUrl(data.logo_url || null);
    setPrimaryColor(data.brand_primary_color || "24 93% 54%");
    setSecondaryColor(data.brand_secondary_color || "212 100% 41%");
    setBankName(data.bank_name || "");
    setAccountName(data.account_name || "");
    setAccountNumber(data.account_number || "");
    setDefaultPaymentTerms(data.default_payment_terms || "");
  }, [bootstrap?.profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        company_name: companyName,
        email,
        phone,
        whatsapp,
        address,
        contact_person: contactPerson,
        cac_number: cacNumber,
        logo_url: logoUrl,
        brand_primary_color: primaryColor,
        brand_secondary_color: secondaryColor,
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        default_payment_terms: defaultPaymentTerms,
      });
      toast.success("Brand settings saved!");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 pt-4 pb-2 bg-card shrink-0 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Brand & Company</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your brand appears on every quote & invoice</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
        {/* Logo upload */}
        <div className="flex flex-col items-center">
          <label className="w-24 h-24 rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/50 cursor-pointer transition-colors relative overflow-hidden group">
            {logoUrl ? (
              <>
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Upload size={20} className="text-white" />
                </div>
              </>
            ) : (
              <>
                <Upload size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] text-muted-foreground font-medium group-hover:text-primary transition-colors">Upload Logo</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setLogoUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>

        {/* Template Style */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <LayoutTemplate size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Document Template</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Changes visually apply to new documents</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "classic", label: "Classic", desc: "Formal & bordered" },
              { id: "modern", label: "Modern", desc: "Clean & rounded" },
              { id: "minimal", label: "Minimal", desc: "Light & airy" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id as TemplateStyle)}
                className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                  template === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <p className="text-xs font-semibold text-foreground">{t.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Brand Colors */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Paintbrush size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Brand Colors</h2>
          </div>
          
          <div className="space-y-5">
            {/* Primary Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-foreground">Primary Color (Headers & Accents)</p>
                <button
                  onClick={() => setShowPrimaryPicker(!showPrimaryPicker)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  <Pipette size={14} />
                  Custom
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {presetColors.map((c) => (
                  <button
                    key={'p-'+c.name}
                    onClick={() => {setPrimaryColor(c.hsl); setShowPrimaryPicker(false);}}
                    className={`w-9 h-9 rounded-full px-0 border-2 transition-all ${
                      primaryColor === c.hsl ? "border-foreground scale-110 shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: `hsl(${c.hsl})` }}
                    title={c.name}
                  />
                ))}
              </div>
              {showPrimaryPicker && (
                <div className="mt-3 p-3 bg-secondary rounded-lg border border-border">
                  <HslColorPicker
                    color={hslStringToObject(primaryColor)}
                    onChange={(hsl) => setPrimaryColor(hslObjectToString(hsl))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">hsl({primaryColor})</p>
                </div>
              )}
            </div>

            {/* Secondary Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-foreground">Secondary Color (Borders & Text)</p>
                <button
                  onClick={() => setShowSecondaryPicker(!showSecondaryPicker)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  <Pipette size={14} />
                  Custom
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {presetColors.map((c) => (
                  <button
                    key={'s-'+c.name}
                    onClick={() => {setSecondaryColor(c.hsl); setShowSecondaryPicker(false);}}
                    className={`w-9 h-9 rounded-full border-2 transition-all px-0 ${
                      secondaryColor === c.hsl ? "border-foreground scale-110 shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: `hsl(${c.hsl})` }}
                    title={c.name}
                  />
                ))}
              </div>
              {showSecondaryPicker && (
                <div className="mt-3 p-3 bg-secondary rounded-lg border border-border">
                  <HslColorPicker
                    color={hslStringToObject(secondaryColor)}
                    onChange={(hsl) => setSecondaryColor(hslObjectToString(hsl))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">hsl({secondaryColor})</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Document Preview */}
          <div className="mt-5 p-4 rounded-xl border border-doc-secondary/30 bg-white shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Live Document Preview</p>

            {/* Mini Document */}
            <div className="border border-border rounded-lg overflow-hidden text-[10px]">
              {/* Header */}
              <div className="px-3 py-2" style={{ backgroundColor: `hsl(${primaryColor})` }}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/70 text-[8px]">REF-2024-001</p>
                    <p className="text-white font-semibold text-[10px]">{companyName || "Your Company"}</p>
                  </div>
                  {logoUrl && (
                    <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center overflow-hidden">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-3 py-2 space-y-1.5 bg-white">
                <div>
                  <p className="text-[9px] font-semibold uppercase" style={{ color: `hsl(${secondaryColor})` }}>
                    Quote Items
                  </p>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex justify-between text-[8px]">
                      <span className="text-foreground">Sample Item 1</span>
                      <span className="font-medium">₦50,000</span>
                    </div>
                    <div className="flex justify-between text-[8px]">
                      <span className="text-foreground">Sample Item 2</span>
                      <span className="font-medium">₦30,000</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-1.5 mt-1.5 border-t" style={{ borderColor: `hsl(${secondaryColor} / 0.3)` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-semibold" style={{ color: `hsl(${primaryColor})` }}>
                      TOTAL
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: `hsl(${primaryColor})` }}>
                      ₦80,000
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground mt-2 text-center italic">
              This preview updates in real-time as you configure your brand
            </p>
          </div>
        </section>

        {/* Company info */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Company Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Company / Trading Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Emeka Electrical Services" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Contact Person</label>
              <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Company Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123 Main St, Lagos" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Business Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. info@yourcompany.com"
                className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Primary Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 8XX XXX XXXX" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">WhatsApp Number</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+234 8XX XXX XXXX" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">CAC Registration Number</label>
              <input value={cacNumber} onChange={e => setCacNumber(e.target.value)} placeholder="e.g. RC123456" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
          </div>
        </section>

        {/* Bank details */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Payment Information</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Shown on invoices for payment routing</p>
          <div className="space-y-3">
             <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Bank Name</label>
              <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. GTBank or Moniepoint" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Account Name</label>
              <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="As registered with bank" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
             <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Account Number (NUBAN)</label>
              <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="10-digit numeric ID" maxLength={10} className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Default Payment Terms</label>
              <textarea
                value={defaultPaymentTerms}
                onChange={e => setDefaultPaymentTerms(e.target.value)}
                placeholder="e.g. 70% advance payment required to commence work. Balance upon completion."
                className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary min-h-[80px] resize-none"
              />
            </div>
          </div>
        </section>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
};

export default BrandPage;
