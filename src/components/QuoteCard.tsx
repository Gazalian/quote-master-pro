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

const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export const QuoteCard = ({ quote }: { quote: Quote }) => {
  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
      {/* Header */}
      <div className="bg-primary px-4 py-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-primary-foreground/70 text-xs font-medium">{quote.ref}</p>
            <p className="text-primary-foreground font-semibold text-sm mt-0.5">
              {quote.client}
            </p>
          </div>
          <p className="text-primary-foreground/70 text-xs">{quote.date}</p>
        </div>
        <p className="text-primary-foreground/80 text-xs mt-1">{quote.description}</p>
      </div>

      {/* Groups */}
      <div className="divide-y divide-border">
        {quote.groups.map((group, gi) => {
          const subtotal = group.items.reduce((s, i) => s + i.total, 0);
          return (
            <div key={gi} className="px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
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
      <div className="bg-secondary px-4 py-3 flex justify-between items-center">
        <span className="font-semibold text-sm text-foreground">Grand Total</span>
        <span className="font-bold text-lg text-primary">{formatNGN(quote.grandTotal)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 border-t border-border">
        <button className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold">
          Edit Quote
        </button>
        <button className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold">
          Save Quote
        </button>
      </div>
    </div>
  );
};
