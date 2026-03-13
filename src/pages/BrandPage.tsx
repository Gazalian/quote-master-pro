import { Upload, Building2, CreditCard } from "lucide-react";

const BrandPage = () => {
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
