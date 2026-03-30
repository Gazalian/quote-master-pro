import React from "react";
import { Quote, BrandSettings } from "@/types/quote";

export const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ModernTemplate = ({ quote, brand }: { quote: Quote; brand: BrandSettings }) => {
  const primaryColor = brand.docPrimary ? `hsl(${brand.docPrimary})` : "#1e40af";
  const secondaryColor = brand.docSecondary ? `hsl(${brand.docSecondary})` : "#475569";

  // Calculate validity date (30 days from quote date)
  const validUntil = new Date(quote.created_at || Date.now());
  validUntil.setDate(validUntil.getDate() + 30);
  const validUntilStr = validUntil.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div
      className="bg-white font-sans text-gray-900 mx-auto p-8"
      style={{
        fontSize: '10pt',
        lineHeight: '1.4',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        maxWidth: '210mm'
      }}
    >
      {/* ============ HEADER SECTION ============ */}
      <div className="border-b-4 pb-4 mb-6" style={{ borderColor: primaryColor }}>
        <div className="flex justify-between items-start gap-6">

          {/* LEFT: Company Info */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              {/* Logo */}
              {brand.logoUrl && (
                <div
                  className="flex-shrink-0 bg-gray-100 rounded p-2 border"
                  style={{
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: primaryColor
                  }}
                >
                  <img
                    src={brand.logoUrl}
                    alt="Logo"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}

              {/* Company Details */}
              <div>
                <h1
                  className="text-xl font-bold mb-1"
                  style={{ color: primaryColor, lineHeight: '1.2' }}
                >
                  {brand.companyName || "Company Name"}
                </h1>
                {brand.tagline && (
                  <p className="text-xs text-gray-600 italic mb-2">{brand.tagline}</p>
                )}
                <div className="text-xs text-gray-700 space-y-0.5">
                  {brand.address && <p>{brand.address}</p>}
                  <div className="flex gap-3 flex-wrap">
                    {brand.phone && <p>Phone: {brand.phone}</p>}
                    {brand.whatsapp && <p>WhatsApp: {brand.whatsapp}</p>}
                  </div>
                  {brand.email && <p>Email: {brand.email}</p>}
                  {brand.rcNumber && <p className="font-semibold mt-1">CAC Reg. No: {brand.rcNumber}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Quote Metadata */}
          <div className="text-right min-w-[180px]">
            <div
              className="inline-block px-6 py-2 mb-3 rounded"
              style={{ backgroundColor: primaryColor }}
            >
              <h2 className="text-white text-2xl font-bold tracking-wide">
                {quote.status === "INVOICED" ? "INVOICE" : "QUOTE"}
              </h2>
            </div>

            <table className="text-xs ml-auto border-collapse">
              <tbody>
                <tr>
                  <td className="text-right pr-2 py-1 font-semibold text-gray-700 whitespace-nowrap">DATE:</td>
                  <td className="border border-gray-300 px-2 py-1 bg-gray-50 min-w-[100px]">{quote.date}</td>
                </tr>
                <tr>
                  <td className="text-right pr-2 py-1 font-semibold text-gray-700 whitespace-nowrap">QUOTE #:</td>
                  <td className="border border-gray-300 px-2 py-1 bg-gray-50 font-mono">{quote.ref}</td>
                </tr>
                <tr>
                  <td className="text-right pr-2 py-1 font-semibold text-gray-700 whitespace-nowrap">VALID UNTIL:</td>
                  <td className="border border-gray-300 px-2 py-1 bg-gray-50">{validUntilStr}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============ CUSTOMER SECTION ============ */}
      <div className="mb-6">
        <div
          className="text-white text-xs font-bold uppercase px-3 py-1.5 mb-2"
          style={{ backgroundColor: primaryColor }}
        >
          CUSTOMER
        </div>
        <div className="text-xs text-gray-800 px-3">
          <p className="font-bold text-sm mb-1">{quote.client}</p>
          <p className="text-gray-600">{quote.description}</p>
        </div>
      </div>

      {/* ============ ITEMS TABLE ============ */}
      <div className="mb-6">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ backgroundColor: primaryColor }}>
              <th className="text-left text-white font-bold uppercase px-3 py-2 border border-gray-300">
                DESCRIPTION
              </th>
              <th className="text-right text-white font-bold uppercase px-3 py-2 border border-gray-300 w-[100px]">
                UNIT PRICE
              </th>
              <th className="text-center text-white font-bold uppercase px-3 py-2 border border-gray-300 w-[60px]">
                QTY
              </th>
              <th className="text-right text-white font-bold uppercase px-3 py-2 border border-gray-300 w-[100px]">
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            {quote.groups.map((group, groupIndex) => {
              let itemCounter = 0;
              return (
                <React.Fragment key={groupIndex}>
                  {/* Category Header Row */}
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <td
                      colSpan={4}
                      className="font-bold px-3 py-1.5 border border-gray-300"
                      style={{ color: primaryColor }}
                    >
                      {group.name.toUpperCase()}
                    </td>
                  </tr>

                  {/* Items */}
                  {group.items.map((item, itemIndex) => {
                    const rowClass = itemCounter % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                    itemCounter++;
                    return (
                      <tr key={itemIndex} className={rowClass}>
                        <td className="px-3 py-2 border border-gray-300">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-[9pt] text-gray-600 mt-0.5">
                            {item.qty} {item.unit} × {formatNGN(item.unitPrice)}
                          </div>
                        </td>
                        <td className="text-right px-3 py-2 border border-gray-300 tabular-nums">
                          {formatNGN(item.unitPrice)}
                        </td>
                        <td className="text-center px-3 py-2 border border-gray-300 tabular-nums">
                          {item.qty}
                        </td>
                        <td className="text-right px-3 py-2 border border-gray-300 font-semibold tabular-nums">
                          {formatNGN(item.total)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Group Subtotal */}
                  {quote.groups.length > 1 && (
                    <tr>
                      <td colSpan={3} className="text-right px-3 py-1.5 border border-gray-300 font-semibold bg-gray-100">
                        {group.name} Subtotal:
                      </td>
                      <td className="text-right px-3 py-1.5 border border-gray-300 font-bold bg-gray-100 tabular-nums">
                        {formatNGN(group.items.reduce((sum, item) => sum + item.total, 0))}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* Empty rows for visual balance (minimum 3 rows) */}
            {Array.from({ length: Math.max(0, 3 - quote.groups.reduce((sum, g) => sum + g.items.length, 0)) }).map((_, i) => (
              <tr key={`empty-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 border border-gray-300 text-transparent">-</td>
                <td className="px-3 py-2 border border-gray-300">&nbsp;</td>
                <td className="px-3 py-2 border border-gray-300">&nbsp;</td>
                <td className="px-3 py-2 border border-gray-300">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ============ SUMMARY SECTION ============ */}
        <div className="flex justify-end mt-0">
          <div className="w-[300px]">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="text-right px-3 py-2 border border-gray-300 bg-gray-50 font-semibold">
                    Subtotal:
                  </td>
                  <td className="text-right px-3 py-2 border border-gray-300 bg-gray-50 font-bold tabular-nums">
                    ₦
                  </td>
                  <td className="text-right px-3 py-2 border border-gray-300 bg-gray-50 font-bold tabular-nums w-[120px]">
                    {formatNGN(quote.grandTotal).replace('₦', '')}
                  </td>
                </tr>

                <tr style={{ backgroundColor: primaryColor }}>
                  <td className="text-right px-3 py-3 border border-gray-300 text-white font-bold uppercase text-sm">
                    TOTAL:
                  </td>
                  <td className="text-right px-3 py-3 border border-gray-300 text-white font-bold text-lg tabular-nums">
                    ₦
                  </td>
                  <td className="text-right px-3 py-3 border border-gray-300 text-white font-bold text-lg tabular-nums">
                    {formatNGN(quote.grandTotal).replace('₦', '')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============ PAYMENT DETAILS (Invoice Only) ============ */}
      {quote.status === "INVOICED" && brand.bankDetails && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded p-3">
          <h3 className="text-xs font-bold mb-2 uppercase" style={{ color: primaryColor }}>
            Payment Information
          </h3>
          <div className="text-xs space-y-1">
            <p><span className="font-semibold">Bank Name:</span> {brand.bankDetails.bankName}</p>
            <p><span className="font-semibold">Account Name:</span> {brand.bankDetails.accountName}</p>
            <p><span className="font-semibold">Account Number:</span> {brand.bankDetails.accountNumber}</p>
            {brand.bankDetails.paymentTerms && (
              <p className="mt-2"><span className="font-semibold">Payment Terms:</span> {brand.bankDetails.paymentTerms}</p>
            )}
          </div>
        </div>
      )}

      {/* ============ TERMS AND CONDITIONS ============ */}
      <div className="mb-6">
        <div
          className="text-white text-xs font-bold uppercase px-3 py-1.5 mb-2"
          style={{ backgroundColor: primaryColor }}
        >
          TERMS AND CONDITIONS
        </div>
        <div className="text-[9pt] text-gray-700 px-3 space-y-1">
          <p>1. This quotation is valid for 30 days from the date of issue.</p>
          <p>2. Payment terms: {brand.bankDetails?.paymentTerms || "50% deposit required before commencement of work, balance upon completion."}</p>
          <p>3. Prices are in Nigerian Naira (₦) and exclude VAT unless otherwise stated.</p>
          <p>4. Any variations to the scope of work may result in additional charges.</p>
          <p>5. Please sign and return this quotation to indicate acceptance.</p>
        </div>
      </div>

      {/* ============ SIGNATURE SECTION ============ */}
      <div className="mb-6">
        <div className="text-xs italic text-gray-700 mb-3 px-3">
          <p className="font-semibold mb-2">Customer Acceptance (Sign below):</p>
        </div>
        <div className="border-t-2 border-gray-400 w-[250px] ml-3 pt-1">
          <p className="text-[9pt] text-gray-600">Print Name:</p>
        </div>
      </div>

      {/* ============ FOOTER ============ */}
      <div className="text-center border-t pt-4 mt-6" style={{ borderColor: primaryColor }}>
        <p className="text-xs text-gray-600">
          If you have any questions about this quotation, please contact
        </p>
        <p className="text-xs font-semibold mt-1" style={{ color: primaryColor }}>
          {brand.contactPerson || brand.companyName} | Phone: {brand.phone || brand.whatsapp} | Email: {brand.email}
        </p>
        <p className="text-sm font-semibold mt-3 italic" style={{ color: primaryColor }}>
          Thank You For Your Business!
        </p>
      </div>
    </div>
  );
};

export default ModernTemplate;
