import { useState, useEffect } from "react";
import { Upload, Building2, CreditCard, Paintbrush, LayoutTemplate, Loader2 } from "lucide-react";
import { TemplateStyle } from "@/types/quote";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const presetColors = [
  { name: "Teal", hsl: "170 75% 31%" },
  { name: "Blue", hsl: "220 70% 50%" },
  { name: "Orange", hsl: "25 95% 53%" },
  { name: "Red", hsl: "0 72% 51%" },
  { name: "Purple", hsl: "270 70% 50%" },
  { name: "Green", hsl: "142 71% 35%" },
  { name: "Navy", hsl: "220 60% 25%" },
  { name: "Gold", hsl: "45 93% 47%" },
  { name: "Slate", hsl: "215 16% 47%" },
  { name: "Charcoal", hsl: "220 40% 15%" },
];

const BrandPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [primaryColor, setPrimaryColor] = useState("170 75% 31%");
  const [secondaryColor, setSecondaryColor] = useState("213 27% 34%");
  const [template, setTemplate] = useState<TemplateStyle>("classic");
  
  // Company Info State
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setCompanyName(data.company_name || "");
          setPhone(data.phone || "");
          setPrimaryColor(data.brand_primary_color || "170 75% 31%");
          setSecondaryColor(data.brand_secondary_color || "213 27% 34%");
          setBankName(data.bank_name || "");
          setAccountName(data.account_name || "");
          setAccountNumber(data.account_number || "");
          setDefaultPaymentTerms(data.default_payment_terms || "");
        }
      } catch (error: any) {
        console.error("Error fetching profile", error);
        toast.error("Failed to load your brand settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const updates = {
        company_name: companyName,
        phone: phone,
        brand_primary_color: primaryColor,
        brand_secondary_color: secondaryColor,
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        default_payment_terms: defaultPaymentTerms,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Brand settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
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
        {/* Logo upload (Mocked for now) */}
        <div className="flex flex-col items-center">
          <div 
             onClick={() => toast.info("Logo upload component is not wired yet. Need Supabase Storage setup.")}
             className="w-24 h-24 rounded-2xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/50 cursor-pointer transition-colors"
          >
            <Upload size={24} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">Upload Logo</span>
          </div>
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
              <p className="text-xs font-medium text-foreground mb-2">Primary Color (Headers & Accents)</p>
              <div className="flex flex-wrap gap-2.5">
                {presetColors.map((c) => (
                  <button
                    key={'p-'+c.name}
                    onClick={() => setPrimaryColor(c.hsl)}
                    className={`w-9 h-9 rounded-full px-0 border-2 transition-all ${
                      primaryColor === c.hsl ? "border-foreground scale-110 shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: `hsl(${c.hsl})` }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Secondary Color (Borders & Text)</p>
              <div className="flex flex-wrap gap-2.5">
                {presetColors.map((c) => (
                  <button
                    key={'s-'+c.name}
                    onClick={() => setSecondaryColor(c.hsl)}
                    className={`w-9 h-9 rounded-full border-2 transition-all px-0 ${
                      secondaryColor === c.hsl ? "border-foreground scale-110 shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: `hsl(${c.hsl})` }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-5 p-4 rounded-xl border border-doc-secondary/30 bg-card">
            <p className="text-[10px] font-bold text-doc-secondary uppercase tracking-wide mb-3">Document Color Preview</p>
            <div className="space-y-3">
              <div className="w-full h-8 rounded bg-doc-primary flex items-center justify-center">
                <span className="text-doc-primary-foreground text-xs font-medium">Header Example</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 flex-1 rounded border border-doc-secondary flex items-center px-2">
                  <div className="w-12 h-1.5 bg-doc-secondary rounded" />
                </div>
                <div className="h-1.5 w-8 bg-doc-primary rounded" />
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
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Company / Trading Name</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Emeka Electrical Services" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Primary Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 8XX XXX XXXX" className="w-full bg-secondary rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary" />
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
