import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Building2,
  CreditCard,
  Paintbrush,
  Pipette,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { HslColorPicker } from "react-colorful";

import { useBootstrap } from "@/hooks/useBootstrap";
import { useUpdateProfile } from "@/hooks/useProfile";
import { FormSectionSkeleton } from "@/components/skeletons";
import { Field, Input, Textarea, SectionCard, SaveIndicator } from "@/components/form-primitives";
import { toast } from "sonner";

const presetColors = [
  { name: "Tech Blue", hsl: "212 100% 41%" },
  { name: "Signal Orange", hsl: "24 93% 54%" },
  { name: "Emerald", hsl: "142 76% 36%" },
  { name: "Red", hsl: "0 72% 51%" },
  { name: "Purple", hsl: "270 70% 50%" },
  { name: "Navy", hsl: "220 60% 25%" },
  { name: "Gold", hsl: "45 93% 47%" },
  { name: "Charcoal", hsl: "220 40% 15%" },
];

const hslStringToObject = (hslString: string) => {
  const [h, s, l] = hslString.split(" ").map((v) => parseFloat(v));
  return { h, s, l };
};
const hslObjectToString = (hsl: { h: number; s: number; l: number }) =>
  `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;

const AUTOSAVE_DELAY_MS = 1200;

const BrandPage = () => {
  const { data: bootstrap, isLoading } = useBootstrap();
  const updateProfile = useUpdateProfile();

  // ── Form state (mirrors the bootstrap profile, hydrated once) ──────────
  const [primaryColor, setPrimaryColor] = useState("212 100% 41%");
  const [secondaryColor, setSecondaryColor] = useState("213 27% 34%");
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("");

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hydrated = useRef(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject doc colours so the live preview tile updates instantly.
  useEffect(() => {
    document.documentElement.style.setProperty("--doc-primary", primaryColor);
    document.documentElement.style.setProperty("--doc-secondary", secondaryColor);
  }, [primaryColor, secondaryColor]);

  // Hydrate from bootstrap exactly once. Subsequent bootstrap refreshes
  // (e.g. after optimistic update) shouldn't clobber live edits.
  useEffect(() => {
    const data = bootstrap?.profile;
    if (!data || hydrated.current) return;
    setCompanyName(data.company_name || "");
    setEmail(data.email || "");
    setPhone(data.phone || "");
    setWhatsapp(data.whatsapp || "");
    setAddress(data.address || "");
    setContactPerson(data.contact_person || "");
    setCacNumber(data.cac_number || "");
    setLogoUrl(data.logo_url || null);
    setPrimaryColor(data.brand_primary_color || "212 100% 41%");
    setSecondaryColor(data.brand_secondary_color || "213 27% 34%");
    setBankName(data.bank_name || "");
    setAccountName(data.account_name || "");
    setAccountNumber(data.account_number || "");
    setDefaultPaymentTerms(data.default_payment_terms || "");
    hydrated.current = true;
  }, [bootstrap?.profile]);

  const formValues = useMemo(
    () => ({
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
    }),
    [
      companyName, email, phone, whatsapp, address, contactPerson, cacNumber, logoUrl,
      primaryColor, secondaryColor, bankName, accountName, accountNumber, defaultPaymentTerms,
    ],
  );

  // ── Autosave (debounced) ────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveStatus("saving");
    autosaveTimer.current = setTimeout(async () => {
      try {
        await updateProfile.mutateAsync(formValues);
        setSaveStatus("saved");
        // Fade the "Saved" pill after 2s
        setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
      } catch (e: unknown) {
        setSaveStatus("error");
        toast.error(e instanceof Error ? e.message : "Failed to save brand settings");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues]);

  const onLogoSelected = (file: File) => {
    if (file.size > 1_500_000) {
      toast.error("Logo too large — keep under 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (isLoading && !bootstrap) {
    return (
      <PageShell title="Brand & Company" subtitle="Your brand appears on every quote & invoice">
        <FormSectionSkeleton rows={6} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Brand & Company"
      subtitle="Your brand appears on every quote & invoice"
      rightSlot={<SaveIndicator status={saveStatus} />}
    >
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
        {/* ── Left column: form ──────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Identity */}
          <SectionCard
            title="Identity"
            description="Logo and company name that appear on every document"
            icon={<ImageIcon size={16} />}
          >
            <div className="flex items-center gap-5">
              <label className="w-24 h-24 rounded-2xl bg-secondary border-2 border-dashed border-border/70 flex flex-col items-center justify-center gap-1 hover:border-primary/50 cursor-pointer transition-colors relative overflow-hidden group shrink-0">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] text-muted-foreground font-medium">Logo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onLogoSelected(f);
                  }}
                />
              </label>
              <div className="flex-1 min-w-0">
                <Field label="Company / Trading Name">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Emeka Electrical Services"
                  />
                </Field>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="mt-2 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove logo
                  </button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Brand Colours */}
          <SectionCard
            title="Brand colours"
            description="Headers, accents, and divider tones"
            icon={<Paintbrush size={16} />}
          >
            <ColorRow
              label="Primary"
              value={primaryColor}
              setValue={setPrimaryColor}
              showPicker={showPrimaryPicker}
              setShowPicker={setShowPrimaryPicker}
            />
            <div className="h-4" />
            <ColorRow
              label="Secondary"
              value={secondaryColor}
              setValue={setSecondaryColor}
              showPicker={showSecondaryPicker}
              setShowPicker={setShowSecondaryPicker}
            />
          </SectionCard>

          {/* Company info */}
          <SectionCard
            title="Company information"
            description="Contact details printed in the document header"
            icon={<Building2 size={16} />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact person">
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g. John Doe" />
              </Field>
              <Field label="CAC number">
                <Input value={cacNumber} onChange={(e) => setCacNumber(e.target.value)} placeholder="e.g. RC123456" />
              </Field>
              <Field label="Business email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@yourcompany.com" />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 8XX XXX XXXX" />
              </Field>
              <Field label="WhatsApp">
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+234 8XX XXX XXXX" />
              </Field>
              <Field label="Address" hint="Single-line preferred">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Main St, Lagos" />
              </Field>
            </div>
          </SectionCard>

          {/* Payment */}
          <SectionCard
            title="Payment information"
            description="Bank details shown on invoices"
            icon={<CreditCard size={16} />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank">
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank" />
              </Field>
              <Field label="Account name">
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="As registered with bank" />
              </Field>
              <Field label="Account number (NUBAN)">
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="10-digit numeric"
                />
              </Field>
              <Field label="Default payment terms" hint="Optional — applied to all invoices">
                <Textarea
                  value={defaultPaymentTerms}
                  onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                  placeholder="e.g. 70% advance payment required to commence work. Balance upon completion."
                />
              </Field>
            </div>
          </SectionCard>

          {/* Spacer so the sticky preview on mobile doesn't clip last card */}
          <div className="h-6 lg:hidden" />
        </div>

        {/* ── Right column: live preview ─────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live preview
            </p>
            <PreviewCard
              primary={primaryColor}
              secondary={secondaryColor}
              companyName={companyName}
              logoUrl={logoUrl}
            />
            <p className="text-[11px] text-muted-foreground text-center px-2">
              Document colours and logo update live as you edit
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile-only floating preview accordion */}
      <details className="lg:hidden mt-2 bg-card rounded-2xl border border-border/60 overflow-hidden">
        <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4 select-none">
          <span className="text-sm font-semibold text-foreground">Live preview</span>
          <span className="text-xs text-muted-foreground">Tap to expand ▾</span>
        </summary>
        <div className="px-5 pb-5">
          <PreviewCard
            primary={primaryColor}
            secondary={secondaryColor}
            companyName={companyName}
            logoUrl={logoUrl}
          />
        </div>
      </details>
    </PageShell>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────

const PageShell = ({
  title,
  subtitle,
  rightSlot,
  children,
}: {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background">
    <div className="px-5 lg:px-8 pt-5 pb-3 bg-card/60 backdrop-blur-md shrink-0 border-b border-border/50 sticky top-0 z-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] lg:text-[22px] font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="pt-1">{rightSlot}</div>
      </div>
    </div>
    <div className="mobile-scroll flex-1 px-4 lg:px-8 py-5">
      <div className="max-w-5xl mx-auto">{children}</div>
    </div>
  </div>
);

const ColorRow = ({
  label,
  value,
  setValue,
  showPicker,
  setShowPicker,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
}) => (
  <div>
    <div className="flex items-center justify-between mb-2.5">
      <p className="text-[13px] font-medium text-foreground">{label}</p>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex min-h-[40px] items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Pipette size={12} />
        {showPicker ? "Done" : "Custom"}
      </button>
    </div>
    <div className="flex flex-wrap gap-2.5">
      {presetColors.map((c) => (
        <button
          key={`${label}-${c.name}`}
          type="button"
          onClick={() => {
            setValue(c.hsl);
            setShowPicker(false);
          }}
          className={`w-10 h-10 rounded-full transition-all relative flex items-center justify-center ${
            value === c.hsl
              ? "ring-2 ring-offset-2 ring-foreground scale-105 shadow-md"
              : "ring-1 ring-border/40 hover:scale-105"
          }`}
          style={{ backgroundColor: `hsl(${c.hsl})` }}
          aria-label={c.name}
        >
          {value === c.hsl && <Check size={14} className="text-white drop-shadow" strokeWidth={3} />}
        </button>
      ))}
    </div>
    {showPicker && (
      <div className="mt-3 p-3 bg-secondary rounded-xl border border-border/60">
        <HslColorPicker
          color={hslStringToObject(value)}
          onChange={(hsl) => setValue(hslObjectToString(hsl))}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-2 text-center font-mono">hsl({value})</p>
      </div>
    )}
  </div>
);

const PreviewCard = ({
  primary,
  secondary,
  companyName,
  logoUrl,
}: {
  primary: string;
  secondary: string;
  companyName: string;
  logoUrl: string | null;
}) => (
  <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden">
    {/* Doc header */}
    <div className="px-4 py-3" style={{ backgroundColor: `hsl(${primary})` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white/70 text-[9px] font-medium tracking-wider">QUOTE • OQ-2026-001</p>
          <p className="text-white font-semibold text-[13px] truncate">
            {companyName || "Your Company"}
          </p>
        </div>
        {logoUrl ? (
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-8 h-8 bg-white/15 rounded-lg shrink-0" />
        )}
      </div>
    </div>
    {/* Doc body */}
    <div className="px-4 py-3 space-y-2 bg-white">
      <p
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: `hsl(${secondary})` }}
      >
        Quote items
      </p>
      <div className="space-y-1">
        <RowLine label="2.5mm cable (coil)" value="₦24,000" />
        <RowLine label="13A socket outlet" value="₦8,000" />
        <RowLine label="Labour (3 days)" value="₦48,000" />
      </div>
      <div
        className="pt-2 mt-2 border-t border-dashed flex justify-between items-center"
        style={{ borderColor: `hsl(${secondary} / 0.3)` }}
      >
        <span className="text-[10px] font-semibold" style={{ color: `hsl(${primary})` }}>
          TOTAL
        </span>
        <span className="text-[14px] font-bold" style={{ color: `hsl(${primary})` }}>
          ₦80,000
        </span>
      </div>
    </div>
  </div>
);

const RowLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-[10px]">
    <span className="text-foreground/80">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export default BrandPage;
