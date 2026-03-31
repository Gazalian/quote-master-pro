import React from "react";
import { Quote, BrandSettings } from "@/types/quote";

export const formatNGN = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ModernTemplate = ({ quote, brand }: { quote: Quote; brand: BrandSettings }) => {
  const primaryColor = brand.docPrimary ? `hsl(${brand.docPrimary})` : "#1e40af";

  const validUntil = new Date(quote.created_at || Date.now());
  validUntil.setDate(validUntil.getDate() + 30);
  const validUntilStr = validUntil.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const docLabel = quote.status === "INVOICED" ? "INVOICE" : "QUOTE";

  return (
    <div
      className="bg-white font-sans text-gray-900"
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "10pt",
        lineHeight: "1.4",
        width: "100%",
        maxWidth: "794px",
        margin: "0 auto",
        padding: "24px 20px",
        boxSizing: "border-box",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          borderBottom: `4px solid ${primaryColor}`,
          paddingBottom: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Top row: company info + doc label — stacks on narrow screens */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {/* Company Info */}
          <div style={{ flex: "1 1 200px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              {brand.logoUrl && (
                <div
                  style={{
                    flexShrink: 0,
                    width: "56px",
                    height: "56px",
                    borderRadius: "6px",
                    border: `2px solid ${primaryColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <img
                    src={brand.logoUrl}
                    alt="Logo"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                </div>
              )}
              <div>
                <div
                  style={{
                    fontSize: "16pt",
                    fontWeight: 700,
                    color: primaryColor,
                    lineHeight: 1.2,
                    marginBottom: "4px",
                  }}
                >
                  {brand.companyName || "Company Name"}
                </div>
                {brand.tagline && (
                  <div style={{ fontSize: "8pt", color: "#6b7280", fontStyle: "italic", marginBottom: "6px" }}>
                    {brand.tagline}
                  </div>
                )}
                <div style={{ fontSize: "8pt", color: "#374151", lineHeight: 1.6 }}>
                  {brand.address && <div>{brand.address}</div>}
                  {brand.phone && <div>Phone: {brand.phone}</div>}
                  {brand.whatsapp && brand.whatsapp !== brand.phone && (
                    <div>WhatsApp: {brand.whatsapp}</div>
                  )}
                  {brand.email && <div>Email: {brand.email}</div>}
                  {brand.rcNumber && (
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>CAC Reg: {brand.rcNumber}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Doc label + meta */}
          <div style={{ flex: "0 1 auto", textAlign: "right", minWidth: "150px" }}>
            <div
              style={{
                display: "inline-block",
                backgroundColor: primaryColor,
                color: "#fff",
                fontWeight: 700,
                fontSize: "18pt",
                letterSpacing: "2px",
                padding: "4px 20px",
                borderRadius: "4px",
                marginBottom: "10px",
              }}
            >
              {docLabel}
            </div>
            <table style={{ fontSize: "8pt", borderCollapse: "collapse", marginLeft: "auto" }}>
              <tbody>
                {[
                  ["DATE", quote.date],
                  [docLabel === "INVOICE" ? "INVOICE #" : "QUOTE #", quote.ref],
                  ["VALID UNTIL", validUntilStr],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td
                      style={{
                        textAlign: "right",
                        paddingRight: "8px",
                        paddingTop: "3px",
                        paddingBottom: "3px",
                        fontWeight: 600,
                        color: "#374151",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}:
                    </td>
                    <td
                      style={{
                        border: "1px solid #d1d5db",
                        padding: "3px 8px",
                        backgroundColor: "#f9fafb",
                        minWidth: "90px",
                        fontFamily: "monospace",
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── CUSTOMER ── */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            backgroundColor: primaryColor,
            color: "#fff",
            fontSize: "8pt",
            fontWeight: 700,
            textTransform: "uppercase",
            padding: "5px 10px",
            marginBottom: "8px",
          }}
        >
          CUSTOMER
        </div>
        <div style={{ fontSize: "9pt", color: "#1f2937", paddingLeft: "10px" }}>
          <div style={{ fontWeight: 700, fontSize: "11pt", marginBottom: "2px" }}>{quote.client}</div>
          <div style={{ color: "#6b7280" }}>{quote.description}</div>
        </div>
      </div>

      {/* ── ITEMS TABLE ── scrollable wrapper for narrow screens */}
      <div style={{ overflowX: "auto", marginBottom: "0" }}>
        <table
          style={{
            width: "100%",
            minWidth: "480px",
            borderCollapse: "collapse",
            fontSize: "9pt",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: primaryColor }}>
              {[
                { label: "DESCRIPTION", align: "left", width: "auto" },
                { label: "UNIT PRICE", align: "right", width: "110px" },
                { label: "QTY", align: "center", width: "50px" },
                { label: "AMOUNT", align: "right", width: "110px" },
              ].map(({ label, align, width }) => (
                <th
                  key={label}
                  style={{
                    textAlign: align as any,
                    color: "#fff",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "8px 10px",
                    border: "1px solid #d1d5db",
                    width,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quote.groups.map((group, gi) => {
              let rowIdx = 0;
              return (
                <React.Fragment key={gi}>
                  {/* Category row */}
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <td
                      colSpan={4}
                      style={{
                        fontWeight: 700,
                        padding: "6px 10px",
                        border: "1px solid #d1d5db",
                        color: primaryColor,
                        fontSize: "9pt",
                      }}
                    >
                      {group.name.toUpperCase()}
                    </td>
                  </tr>

                  {/* Item rows */}
                  {group.items.map((item, ii) => {
                    const bg = rowIdx++ % 2 === 0 ? "#fff" : "#f9fafb";
                    return (
                      <tr key={ii} style={{ backgroundColor: bg }}>
                        <td style={{ padding: "7px 10px", border: "1px solid #e5e7eb" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
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
                          <div style={{ fontSize: "8pt", color: "#6b7280", marginTop: "2px" }}>
                            {item.qty} {item.unit} × {formatNGN(item.unitPrice)}
                          </div>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "7px 10px",
                            border: "1px solid #e5e7eb",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatNGN(item.unitPrice)}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            padding: "7px 10px",
                            border: "1px solid #e5e7eb",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {item.qty}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "7px 10px",
                            border: "1px solid #e5e7eb",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatNGN(item.total)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Group subtotal */}
                  {quote.groups.length > 1 && (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          textAlign: "right",
                          padding: "5px 10px",
                          border: "1px solid #e5e7eb",
                          fontWeight: 600,
                          backgroundColor: "#f3f4f6",
                        }}
                      >
                        {group.name} Subtotal:
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "5px 10px",
                          border: "1px solid #e5e7eb",
                          fontWeight: 700,
                          backgroundColor: "#f3f4f6",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatNGN(group.items.reduce((s, i) => s + i.total, 0))}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {/* Padding rows */}
            {Array.from({
              length: Math.max(0, 3 - quote.groups.reduce((s, g) => s + g.items.length, 0)),
            }).map((_, i) => (
              <tr key={`pad-${i}`} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                <td style={{ padding: "7px 10px", border: "1px solid #e5e7eb" }}>&nbsp;</td>
                <td style={{ border: "1px solid #e5e7eb" }}>&nbsp;</td>
                <td style={{ border: "1px solid #e5e7eb" }}>&nbsp;</td>
                <td style={{ border: "1px solid #e5e7eb" }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── TOTALS ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <table
          style={{
            borderCollapse: "collapse",
            fontSize: "9pt",
            minWidth: "260px",
            width: "100%",
            maxWidth: "320px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  textAlign: "right",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  fontWeight: 600,
                }}
              >
                Subtotal:
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatNGN(quote.grandTotal)}
              </td>
            </tr>
            <tr style={{ backgroundColor: primaryColor }}>
              <td
                style={{
                  textAlign: "right",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "11pt",
                  textTransform: "uppercase",
                }}
              >
                TOTAL:
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13pt",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatNGN(quote.grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PAYMENT (Invoice only) ── */}
      {quote.status === "INVOICED" && brand.bankDetails && (
        <div
          style={{
            marginBottom: "20px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "6px",
            padding: "12px",
          }}
        >
          <div
            style={{
              fontSize: "8pt",
              fontWeight: 700,
              textTransform: "uppercase",
              color: primaryColor,
              marginBottom: "8px",
            }}
          >
            Payment Information
          </div>
          <div style={{ fontSize: "8pt", lineHeight: 1.8 }}>
            <div>
              <strong>Bank Name:</strong> {brand.bankDetails.bankName}
            </div>
            <div>
              <strong>Account Name:</strong> {brand.bankDetails.accountName}
            </div>
            <div>
              <strong>Account Number:</strong> {brand.bankDetails.accountNumber}
            </div>
            {brand.bankDetails.paymentTerms && (
              <div style={{ marginTop: "6px" }}>
                <strong>Payment Terms:</strong> {brand.bankDetails.paymentTerms}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TERMS ── */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            backgroundColor: primaryColor,
            color: "#fff",
            fontSize: "8pt",
            fontWeight: 700,
            textTransform: "uppercase",
            padding: "5px 10px",
            marginBottom: "8px",
          }}
        >
          TERMS AND CONDITIONS
        </div>
        <div style={{ fontSize: "8pt", color: "#374151", paddingLeft: "10px", lineHeight: 1.8 }}>
          <div>1. This quotation is valid for 30 days from the date of issue.</div>
          <div>
            2. Payment terms:{" "}
            {brand.bankDetails?.paymentTerms ||
              "50% deposit required before commencement of work, balance upon completion."}
          </div>
          <div>3. Prices are in Nigerian Naira (₦) and exclude VAT unless otherwise stated.</div>
          <div>4. Any variations to the scope of work may result in additional charges.</div>
          <div>5. Please sign and return this quotation to indicate acceptance.</div>
        </div>
      </div>

      {/* ── SIGNATURE ── */}
      <div style={{ marginBottom: "20px", paddingLeft: "10px" }}>
        <div style={{ fontSize: "8pt", fontStyle: "italic", color: "#374151", marginBottom: "8px", fontWeight: 600 }}>
          Customer Acceptance (Sign below):
        </div>
        <div
          style={{
            borderTop: "2px solid #9ca3af",
            width: "240px",
            paddingTop: "4px",
          }}
        >
          <div style={{ fontSize: "8pt", color: "#6b7280" }}>Print Name:</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          textAlign: "center",
          borderTop: `2px solid ${primaryColor}`,
          paddingTop: "12px",
          marginTop: "12px",
        }}
      >
        <div style={{ fontSize: "8pt", color: "#6b7280" }}>
          If you have any questions about this quotation, please contact
        </div>
        <div style={{ fontSize: "8pt", fontWeight: 600, marginTop: "4px", color: primaryColor }}>
          {[brand.contactPerson || brand.companyName, brand.phone || brand.whatsapp, brand.email]
            .filter(Boolean)
            .join(" | ")}
        </div>
        <div
          style={{
            fontSize: "11pt",
            fontWeight: 700,
            fontStyle: "italic",
            marginTop: "10px",
            color: primaryColor,
          }}
        >
          Thank You For Your Business!
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
