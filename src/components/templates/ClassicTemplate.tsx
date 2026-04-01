import { Quote, BrandSettings } from "@/types/quote";

export const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ClassicTemplate = ({ quote, brand }: { quote: Quote; brand: BrandSettings }) => {
  const primaryColor = brand.docPrimary ? `hsl(${brand.docPrimary})` : "#0f8a6e";
  const secondaryColor = brand.docSecondary ? `hsl(${brand.docSecondary})` : "#475569";

  return (
    <div
      className="bg-white text-gray-900"
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "10pt",
        lineHeight: "1.4",
        width: "100%",
        maxWidth: "794px",
        margin: "0 auto",
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxSizing: "border-box",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ backgroundColor: primaryColor, padding: "16px 16px 12px" }}>
        {/* Top: ref + company — wraps on narrow screens */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          {/* Left */}
          <div style={{ flex: "1 1 160px" }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "8pt" }}>{quote.ref}</div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "12pt", marginTop: "2px" }}>
              {quote.client}
            </div>
            <div
              style={{
                display: "inline-block",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "9pt",
                letterSpacing: "1px",
                padding: "2px 10px",
                borderRadius: "4px",
                marginTop: "6px",
              }}
            >
              {quote.status === "INVOICED" ? "INVOICE" : "QUOTATION"}
            </div>
          </div>

          {/* Right */}
          <div style={{ flex: "0 1 auto", textAlign: "right" }}>
            {brand.logoUrl && (
              <img
                src={brand.logoUrl}
                alt="Logo"
                style={{
                  height: "40px",
                  width: "auto",
                  objectFit: "contain",
                  marginBottom: "6px",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: "4px",
                  padding: "3px",
                }}
              />
            )}
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "11pt" }}>{brand.companyName}</div>
            {brand.rcNumber && (
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "8pt" }}>CAC: {brand.rcNumber}</div>
            )}
            {brand.address && (
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "8pt", maxWidth: "180px", marginLeft: "auto" }}>
                {brand.address}
              </div>
            )}
            {brand.phone && (
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "8pt" }}>{brand.phone}</div>
            )}
            {brand.email && (
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "8pt" }}>{brand.email}</div>
            )}
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "8pt", marginTop: "4px" }}>
              {quote.date}
            </div>
          </div>
        </div>

        {/* Description */}
        {quote.description && (
          <div
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "8pt",
              marginTop: "8px",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              paddingTop: "6px",
            }}
          >
            {quote.description}
          </div>
        )}
      </div>

      {/* ── GROUPS ── */}
      <div style={{ borderBottom: "1px solid #e5e7eb" }}>
        {quote.groups.map((group, gi) => {
          const subtotal = group.items.reduce((s, i) => s + i.total, 0);
          return (
            <div
              key={gi}
              style={{
                padding: "12px 16px",
                borderBottom: gi < quote.groups.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              {/* Group heading */}
              <div
                style={{
                  fontSize: "8pt",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: secondaryColor,
                  marginBottom: "8px",
                }}
              >
                {gi + 1}. {group.name}
              </div>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {group.items.map((item, ii) => (
                  <div
                    key={ii}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "8px",
                      fontSize: "9pt",
                    }}
                  >
                    {/* Item name + spec */}
                    <div style={{ flex: "1 1 0", minWidth: 0 }}>
                      <div style={{ fontWeight: 500, color: "#111827", wordBreak: "break-word" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: "8pt", color: "#6b7280", marginTop: "1px" }}>
                        {item.qty} {item.unit} × {formatNGN(item.unitPrice)}
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ fontWeight: 600, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                        {formatNGN(item.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "8px",
                  paddingTop: "6px",
                  borderTop: "1px solid #f3f4f6",
                  fontSize: "8pt",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Subtotal: {formatNGN(subtotal)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── GRAND TOTAL ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "11pt", color: "#111827" }}>Grand Total</div>
        <div style={{ fontWeight: 800, fontSize: "16pt", color: primaryColor, fontVariantNumeric: "tabular-nums" }}>
          {formatNGN(quote.grandTotal)}
        </div>
      </div>

      {/* ── PAYMENT DETAILS (Invoice only) ── */}
      {quote.status === "INVOICED" && brand.bankDetails && (
        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: `rgba(15,138,110,0.04)`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <div style={{ fontSize: "8pt", fontWeight: 700, textTransform: "uppercase", color: primaryColor }}>
              Payment Details
            </div>
            <div style={{ textAlign: "right", fontSize: "8pt" }}>
              <div style={{ fontWeight: 600 }}>
                Deposit Required:{" "}
                <strong>{formatNGN(quote.grandTotal * 0.7)}</strong>
              </div>
              <div style={{ color: "#6b7280", marginTop: "2px" }}>
                Balance Due: {formatNGN(quote.grandTotal * 0.3)}
              </div>
            </div>
          </div>

          {/* Bank details grid — 2-col on wide, 1-col on narrow */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "8px",
              fontSize: "9pt",
            }}
          >
            {[
              ["Bank Name", brand.bankDetails.bankName],
              ["Account Number", brand.bankDetails.accountNumber],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: "7pt", textTransform: "uppercase", color: "#9ca3af" }}>{label}</div>
                <div style={{ fontWeight: 500 }}>{val}</div>
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "7pt", textTransform: "uppercase", color: "#9ca3af" }}>Account Name</div>
              <div style={{ fontWeight: 500 }}>{brand.bankDetails.accountName}</div>
            </div>
          </div>

          {brand.bankDetails.paymentTerms && (
            <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: "7pt", textTransform: "uppercase", color: "#9ca3af" }}>Payment Terms</div>
              <div style={{ fontSize: "8pt", color: "#374151", marginTop: "2px", whiteSpace: "pre-wrap" }}>
                {brand.bankDetails.paymentTerms}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FOOTER ── */}
      <div
        style={{
          textAlign: "center",
          padding: "10px 16px",
          borderTop: `3px solid ${primaryColor}`,
          backgroundColor: "#f9fafb",
        }}
      >
        <div style={{ fontSize: "8pt", color: "#6b7280" }}>Generated by OtoQuote AI</div>
        <div style={{ fontSize: "9pt", fontWeight: 700, fontStyle: "italic", color: primaryColor, marginTop: "4px" }}>
          Thank You For Your Business!
        </div>
      </div>
    </div>
  );
};
