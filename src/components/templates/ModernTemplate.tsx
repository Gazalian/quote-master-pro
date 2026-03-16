import { Quote, BrandSettings } from "@/types/quote";

export const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export const ModernTemplate = ({ quote, brand }: { quote: Quote; brand: BrandSettings }) => {
  const primaryColor = brand.docPrimary ? `hsl(${brand.docPrimary})` : "var(--doc-primary)";
  const secondaryColor = brand.docSecondary ? `hsl(${brand.docSecondary})` : "var(--doc-secondary)";

  return (
    <div 
      className="bg-card rounded-2xl shadow-md overflow-hidden font-sans border border-border/50"
      style={{ '--local-primary': primaryColor, '--local-secondary': secondaryColor } as React.CSSProperties}
    >
      {/* Header */}
      <div 
        className="p-6 relative overflow-hidden" 
        style={{ background: `linear-gradient(to bottom right, var(--card), color-mix(in srgb, ${primaryColor} 10%, transparent))` }}
      >
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-bl-full border-b border-l"
          style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)`, borderColor: `color-mix(in srgb, ${primaryColor} 20%, transparent)` }} 
        />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <span 
              className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-3"
              style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)`, color: primaryColor }}
            >
              {quote.status === "INVOICED" ? "INVOICE" : "QUOTATION"}
            </span>
            <h1 className="text-2xl font-bold text-foreground mb-1">{quote.client}</h1>
            <p className="text-muted-foreground text-sm">{quote.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{quote.ref}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{quote.date}</p>
            <p className="text-foreground font-bold mt-2">{brand.companyName}</p>
            <p className="text-muted-foreground text-xs">{brand.phone}</p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="px-6 py-4 space-y-6">
        {quote.groups.map((group, gi) => {
          const subtotal = group.items.reduce((s, i) => s + i.total, 0);
          return (
            <div key={gi}>
              <h3 
                className="text-sm font-bold border-b-2 pb-2 mb-3"
                style={{ color: primaryColor, borderColor: `color-mix(in srgb, ${primaryColor} 20%, transparent)` }}
              >
                {group.name}
              </h3>
              <div className="space-y-3">
                {group.items.map((item, ii) => (
                  <div key={ii} className="flex items-center justify-between text-sm group">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.qty} {item.unit} @ {formatNGN(item.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground">{formatNGN(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 pt-2 text-sm border-t border-border/30 border-dashed">
                <span className="text-muted-foreground mr-3">Subtotal:</span>
                <span className="font-semibold text-foreground">{formatNGN(subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div 
        className="mx-6 mb-6 mt-2 p-5 rounded-xl border flex justify-between items-center"
        style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 5%, transparent)`, borderColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
      >
        <span className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Total Amount</span>
        <span className="text-2xl font-black" style={{ color: primaryColor }}>{formatNGN(quote.grandTotal)}</span>
      </div>

      {/* Invoice Details */}
      {quote.status === "INVOICED" && brand.bankDetails && (
        <div className="mx-6 mb-6 p-5 bg-secondary/30 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
            Payment Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm bg-card p-3 rounded-lg border border-border/50">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase font-semibold mb-0.5">Bank</p>
              <p className="font-medium text-foreground">{brand.bankDetails.bankName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase font-semibold mb-0.5">Account Number</p>
              <p className="font-medium text-foreground">{brand.bankDetails.accountNumber}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/50">
              <p className="text-muted-foreground text-[10px] uppercase font-semibold mb-0.5">Account Name</p>
              <p className="font-medium text-foreground">{brand.bankDetails.accountName}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase font-semibold mb-1">Terms</p>
            <p className="text-xs text-foreground italic whitespace-pre-wrap">{brand.bankDetails.paymentTerms}</p>
          </div>
        </div>
      )}
    </div>
  );
};
