import { Quote, BrandSettings } from "@/types/quote";

export const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

export const MinimalTemplate = ({ quote, brand }: { quote: Quote; brand: BrandSettings }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 font-sans border border-border/20">
      {/* Header */}
      <div className="flex justify-between items-end border-b pb-6 mb-8 border-border">
        <div>
          {brand.logoUrl && <img src={brand.logoUrl} alt="Logo" className="h-10 w-auto object-contain mb-4 grayscale contrast-125" />}
          <h1 className="text-3xl font-light text-foreground mb-1 tracking-tight">{quote.client}</h1>
          <p className="text-muted-foreground text-sm">{quote.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground tracking-widest uppercase mb-1">
            {quote.status === "INVOICED" ? "Invoice" : "Quotation"}
          </p>
          <div className="text-xs text-muted-foreground space-y-0.5 mt-2 flex flex-col items-end">
            <p className="font-semibold text-foreground">{brand.companyName}</p>
            {brand.rcNumber && <p className="text-[10px]">CAC: {brand.rcNumber}</p>}
            {brand.address && <p className="max-w-[200px] text-right">{brand.address}</p>}
            {brand.contactPerson && <p>Attn: {brand.contactPerson}</p>}
            {brand.phone && <p>{brand.phone}</p>}
            {brand.email && <p>{brand.email}</p>}
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5 mt-4">
            <p>Ref: <span className="font-medium text-foreground">{quote.ref}</span></p>
            <p>Date: <span className="font-medium text-foreground">{quote.date}</span></p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-8">
        {quote.groups.map((group, gi) => {
          const subtotal = group.items.reduce((s, i) => s + i.total, 0);
          return (
            <div key={gi} className="break-inside-avoid">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                {group.name}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="py-2 font-medium text-left">Description</th>
                    <th className="py-2 font-medium text-center w-24">Qty</th>
                    <th className="py-2 font-medium text-right w-28">Price</th>
                    <th className="py-2 font-medium text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {group.items.map((item, ii) => (
                    <tr key={ii} className="group">
                      <td className="py-3 text-foreground">{item.name}</td>
                      <td className="py-3 text-center text-muted-foreground whitespace-nowrap">
                        {item.qty} {item.unit}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatNGN(item.unitPrice)}
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        {formatNGN(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end pt-3 text-sm">
                <span className="text-muted-foreground mr-4">Subtotal</span>
                <span className="font-medium text-foreground">{formatNGN(subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="flex justify-end mt-12 mb-12">
        <div className="w-64 border-t-2 border-foreground pt-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-muted-foreground">Total</span>
            <span className="font-bold text-foreground">{formatNGN(quote.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      {quote.status === "INVOICED" && brand.bankDetails && (
        <div className="border-t border-border pt-8 text-sm w-full">
          <div className="flex justify-between items-start mb-4 max-w-xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Payment Information</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 justify-between">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 max-w-xl flex-1">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Bank</p>
                <p className="font-medium text-foreground">{brand.bankDetails.bankName}</p>
              </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Account Number</p>
              <p className="font-medium text-foreground">{brand.bankDetails.accountNumber}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs mb-1">Account Name</p>
              <p className="font-medium text-foreground">{brand.bankDetails.accountName}</p>
            </div>
            <div className="col-span-2 mt-2">
              <p className="text-muted-foreground text-xs mb-1">Terms</p>
              <p className="text-foreground text-xs whitespace-pre-wrap">{brand.bankDetails.paymentTerms}</p>
            </div>
          </div>
          
          <div className="shrink-0 sm:min-w-[200px] bg-secondary/30 rounded-lg p-4 border border-border/50 h-fit">
               <p className="text-xs text-muted-foreground mb-1">Deposit Required (70%)</p>
               <p className="font-semibold text-foreground text-sm mb-3">{formatNGN(quote.grandTotal * 0.7)}</p>
               <div className="border-t border-border/50 pt-2 text-xs">
                 <p className="text-muted-foreground inline-block w-20">Balance:</p>
                 <span className="font-medium text-foreground">{formatNGN(quote.grandTotal * 0.3)}</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
