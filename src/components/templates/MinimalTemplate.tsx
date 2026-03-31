import { Quote, BrandSettings } from "@/types/quote";

export const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const MinimalTemplate = ({ quote, brand }: { quote: Quote; brand: BrandSettings }) => {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "10pt",
        lineHeight: "1.5",
        padding: "24px 20px",
        width: "100%",
        maxWidth: "794px",
        margin: "0 auto",
        boxSizing: "border-box",
        color: "#111827",
      }}
    >
      {/* ── HEADER: wraps on narrow screens ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "16px",
          borderBottom: "2px solid #111827",
          paddingBottom: "20px",
          marginBottom: "28px",
        }}
      >
        {/* Left — client */}
        <div style={{ flex: "1 1 180px", minWidth: 0 }}>
          {brand.logoUrl && (
            <img
              src={brand.logoUrl}
              alt="Logo"
              style={{
                height: "40px",
                width: "auto",
                objectFit: "contain",
                marginBottom: "12px",
                filter: "grayscale(1) contrast(1.2)",
              }}
            />
          )}
          <div style={{ fontSize: "20pt", fontWeight: 300, letterSpacing: "-0.5px", marginBottom: "4px" }}>
            {quote.client}
          </div>
          <div style={{ color: "#6b7280", fontSize: "9pt" }}>{quote.description}</div>
        </div>

        {/* Right — company + meta */}
        <div style={{ flex: "0 1 auto", textAlign: "right" }}>
          <div
            style={{
              fontSize: "8pt",
              fontWeight: 600,
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            {quote.status === "INVOICED" ? "Invoice" : "Quotation"}
          </div>
          <div style={{ fontSize: "9pt", color: "#374151", lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700 }}>{brand.companyName}</div>
            {brand.rcNumber && <div style={{ fontSize: "8pt" }}>CAC: {brand.rcNumber}</div>}
            {brand.address && (
              <div style={{ maxWidth: "200px", marginLeft: "auto", fontSize: "8pt" }}>{brand.address}</div>
            )}
            {brand.contactPerson && <div style={{ fontSize: "8pt" }}>Attn: {brand.contactPerson}</div>}
            {brand.phone && <div style={{ fontSize: "8pt" }}>{brand.phone}</div>}
            {brand.email && <div style={{ fontSize: "8pt" }}>{brand.email}</div>}
          </div>
          <div style={{ marginTop: "10px", fontSize: "8pt", color: "#6b7280", lineHeight: 1.8 }}>
            <div>
              Ref: <strong style={{ color: "#111827" }}>{quote.ref}</strong>
            </div>
            <div>
              Date: <strong style={{ color: "#111827" }}>{quote.date}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── GROUPS ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {quote.groups.map((group, gi) => {
          const subtotal = group.items.reduce((s, i) => s + i.total, 0);
          return (
            <div key={gi}>
              <div
                style={{
                  fontSize: "7pt",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  color: "#6b7280",
                  marginBottom: "12px",
                }}
              >
                {group.name}
              </div>

              {/* Table with scroll on very narrow screens */}
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: "400px",
                    borderCollapse: "collapse",
                    fontSize: "9pt",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      <th style={{ textAlign: "left", padding: "6px 0", width: "auto" }}>
                        Description
                      </th>
                      <th style={{ textAlign: "center", padding: "6px 8px", width: "70px", whiteSpace: "nowrap" }}>
                        Qty
                      </th>
                      <th style={{ textAlign: "right", padding: "6px 0 6px 8px", width: "100px", whiteSpace: "nowrap" }}>
                        Unit Price
                      </th>
                      <th style={{ textAlign: "right", padding: "6px 0 6px 8px", width: "110px", whiteSpace: "nowrap" }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, ii) => (
                      <tr
                        key={ii}
                        style={{ borderBottom: "1px solid #f3f4f6" }}
                      >
                        <td style={{ padding: "10px 0", color: "#111827" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span>{item.name}</span>
                            {item.source && (
                              <span style={{
                                fontSize: "6.5pt", fontWeight: 700, padding: "1px 5px",
                                borderRadius: "999px", whiteSpace: "nowrap",
                                backgroundColor: item.source === "my_price" ? "rgba(16,185,129,0.15)" : item.source === "regional_price" ? "rgba(245,130,32,0.15)" : "rgba(156,163,175,0.25)",
                                color: item.source === "my_price" ? "#065f46" : item.source === "regional_price" ? "#9a4a00" : "#6b7280",
                              }}>
                                {item.source === "my_price" ? "MY PRICE" : item.source === "regional_price" ? `REGIONAL${item.regionName ? ` · ${item.regionName}` : ""}` : "AI EST."}
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            textAlign: "center",
                            color: "#6b7280",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.qty} {item.unit}
                        </td>
                        <td
                          style={{
                            padding: "10px 0 10px 8px",
                            textAlign: "right",
                            color: "#6b7280",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatNGN(item.unitPrice)}
                        </td>
                        <td
                          style={{
                            padding: "10px 0 10px 8px",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#111827",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatNGN(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  paddingTop: "8px",
                  fontSize: "8pt",
                  color: "#6b7280",
                }}
              >
                <span style={{ marginRight: "16px" }}>Subtotal</span>
                <span style={{ fontWeight: 500, color: "#111827" }}>{formatNGN(subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── GRAND TOTAL ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "32px 0" }}>
        <div
          style={{
            borderTop: "2px solid #111827",
            paddingTop: "12px",
            minWidth: "200px",
            width: "100%",
            maxWidth: "260px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13pt",
            }}
          >
            <span style={{ color: "#6b7280", fontWeight: 400 }}>Total</span>
            <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {formatNGN(quote.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ── PAYMENT (Invoice only) ── */}
      {quote.status === "INVOICED" && brand.bankDetails && (
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: "20px",
            fontSize: "9pt",
          }}
        >
          <div
            style={{
              fontSize: "7pt",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "#6b7280",
              marginBottom: "12px",
            }}
          >
            Payment Information
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            {[
              ["Bank", brand.bankDetails.bankName],
              ["Account Number", brand.bankDetails.accountNumber],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: "7pt", color: "#9ca3af", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontWeight: 500 }}>{val}</div>
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "7pt", color: "#9ca3af", marginBottom: "2px" }}>Account Name</div>
              <div style={{ fontWeight: 500 }}>{brand.bankDetails.accountName}</div>
            </div>
          </div>

          {/* Deposit summary */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              display: "inline-block",
              minWidth: "200px",
            }}
          >
            <div style={{ fontSize: "8pt", color: "#6b7280", marginBottom: "2px" }}>Deposit Required (70%)</div>
            <div style={{ fontWeight: 600, marginBottom: "6px" }}>{formatNGN(quote.grandTotal * 0.7)}</div>
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "6px", fontSize: "8pt" }}>
              <span style={{ color: "#6b7280" }}>Balance: </span>
              <strong>{formatNGN(quote.grandTotal * 0.3)}</strong>
            </div>
          </div>

          {brand.bankDetails.paymentTerms && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "7pt", color: "#9ca3af", marginBottom: "2px" }}>Terms</div>
              <div style={{ fontSize: "8pt", color: "#374151", whiteSpace: "pre-wrap" }}>
                {brand.bankDetails.paymentTerms}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
