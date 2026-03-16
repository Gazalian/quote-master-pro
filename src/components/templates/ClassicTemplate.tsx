import { Quote, BrandSettings } from "@/types/quote";

export const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export const ClassicTemplate = ({ quote, brand }: { quote: Quote; brand: BrandSettings }) => {
  const primaryColor = brand.docPrimary ? `hsl(${brand.docPrimary})` : "var(--doc-primary)";
  const secondaryColor = brand.docSecondary ? `hsl(${brand.docSecondary})` : "var(--doc-secondary)";

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border" style={{ '--local-primary': primaryColor, '--local-secondary': secondaryColor } as React.CSSProperties}>
      {/* Header */}
      <div className="px-4 py-3" style={{ backgroundColor: primaryColor }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-xs font-medium">{quote.ref}</p>
            <p className="text-white font-semibold text-sm mt-0.5">
              {quote.client}
            </p>
          </div>
          <div className="text-right">
             <p className="text-white/70 text-xs">{quote.date}</p>
             <p className="text-white font-bold text-sm mt-0.5">{brand.companyName}</p>
             <p className="text-white/80 text-[10px]">{brand.phone}</p>
          </div>
        </div>
        <p className="text-white/80 text-xs mt-1">{quote.description}</p>
      </div>

      {/* Groups */}
      <div className="divide-y divide-border border-b border-border">
        {quote.groups.map((group, gi) => {
          const subtotal = group.items.reduce((s, i) => s + i.total, 0);
          return (
            <div key={gi} className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: secondaryColor }}>
                {gi + 1}. {group.name}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item, ii) => (
                  <div key={ii} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-muted-foreground text-xs ml-1">
                        {item.qty} {item.unit} × {formatNGN(item.unitPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-medium text-foreground">{formatNGN(item.total)}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          item.source === "my_price"
                            ? "bg-badge-approved/15 text-badge-myprice"
                            : "bg-badge-invoiced/15 text-badge-ai"
                        }`}
                      >
                        {item.source === "my_price" ? "MY PRICE" : "AI EST."}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-2 pt-1.5 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground">
                  Subtotal: {formatNGN(subtotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="bg-secondary/50 px-4 py-3 flex justify-between items-center">
        <span className="font-semibold text-sm text-foreground">Grand Total</span>
        <span className="font-bold text-lg" style={{ color: primaryColor }}>{formatNGN(quote.grandTotal)}</span>
      </div>

      {/* Invoice Details */}
      {quote.status === "INVOICED" && brand.bankDetails && (
        <div className="px-4 py-4 border-t border-border" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 5%, transparent)` }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: primaryColor }}>Payment Details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase">Bank Name</p>
              <p className="font-medium text-foreground">{brand.bankDetails.bankName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase">Account Number</p>
              <p className="font-medium text-foreground">{brand.bankDetails.accountNumber}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-[10px] uppercase">Account Name</p>
              <p className="font-medium text-foreground">{brand.bankDetails.accountName}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-muted-foreground text-[10px] uppercase">Payment Terms</p>
            <p className="text-xs text-foreground mt-0.5 whitespace-pre-wrap">{brand.bankDetails.paymentTerms}</p>
          </div>
        </div>
      )}
    </div>
  );
};
