/**
 * Premium quotation/invoice PDF — built with @react-pdf/renderer.
 *
 * Why this exists:
 *   - Replaces the prior html2canvas + jsPDF pipeline which rasterized the
 *     entire DOM into a single tall PNG. That approach produced unselectable
 *     text, fuzzy zoom, 4-10 MB files, and mid-row page breaks.
 *   - This pipeline outputs a real vector PDF: selectable text, crisp at any
 *     DPI, ~200-500 KB typical, with proper page-break semantics.
 *
 * Design system in theme.ts. Pure layout logic lives here.
 *
 * Page-break invariants:
 *   - Item rows render with wrap={false} so a row never splits.
 *   - The items table header is `fixed` so it repeats on every page.
 *   - The footer (page number + thank-you) is `fixed`.
 */

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Quote, BrandSettings } from '@/types/quote';
import { FONT_FAMILY, NEUTRAL, TYPE, SPACE, brandHexOrDefault } from './theme';
import { formatNaira, formatDateLong, addDays } from './formatters';

// react-pdf will helpfully hyphenate long words in body text. We don't want
// that for invoice descriptions — "16mm-cable" reads wrong.
Font.registerHyphenationCallback((word) => [word]);

// ── Stylesheet ──────────────────────────────────────────────────────────────
// Tokens come from theme.ts; per-document accent is injected at runtime.

const baseStyles = (accent: string) =>
  StyleSheet.create({
    page: {
      paddingTop: SPACE.pageMargin,
      paddingBottom: SPACE.pageMargin + 24, // extra room for footer
      paddingHorizontal: SPACE.pageMargin,
      fontFamily: FONT_FAMILY,
      fontSize: TYPE.body,
      color: NEUTRAL.body,
      backgroundColor: NEUTRAL.white,
    },

    // ── Header ──
    headerBand: { height: 4, backgroundColor: accent, marginBottom: 18 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    company: { flexDirection: 'row', alignItems: 'flex-start', maxWidth: '60%' },
    logoBox: {
      width: 56,
      height: 56,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: NEUTRAL.hairline,
      backgroundColor: NEUTRAL.white,
      padding: 4,
      marginRight: 12,
    },
    logoImg: { width: '100%', height: '100%', objectFit: 'contain' },
    companyName: { fontSize: TYPE.h3, fontWeight: 700, color: NEUTRAL.ink, marginBottom: 2 },
    tagline: { fontSize: TYPE.caption, color: NEUTRAL.muted, fontStyle: 'italic', marginBottom: 4 },
    contactLine: { fontSize: TYPE.caption, color: NEUTRAL.muted, lineHeight: 1.5 },

    docMeta: { textAlign: 'right', minWidth: 180 },
    docTitle: { fontSize: TYPE.h1, fontWeight: 700, letterSpacing: 2, color: accent },
    docSubtitle: { fontSize: TYPE.caption, color: NEUTRAL.muted, marginTop: 2, letterSpacing: 1 },
    metaTable: { marginTop: 10 },
    metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
    metaLabel: { fontSize: TYPE.caption, color: NEUTRAL.muted, marginRight: 8, fontWeight: 500 },
    metaValue: { fontSize: TYPE.small, color: NEUTRAL.ink, fontWeight: 600, minWidth: 90, textAlign: 'right' },

    // ── Bill-to / parties ──
    parties: { flexDirection: 'row', marginTop: SPACE.sectionGap, gap: 16 },
    party: { flex: 1, padding: 12, backgroundColor: NEUTRAL.surface, borderRadius: 6 },
    partyLabel: {
      fontSize: TYPE.micro,
      fontWeight: 700,
      color: accent,
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    partyName: { fontSize: TYPE.lead, fontWeight: 700, color: NEUTRAL.ink, marginBottom: 2 },
    partyDetail: { fontSize: TYPE.caption, color: NEUTRAL.muted, lineHeight: 1.5 },

    // ── Items table ──
    sectionTitle: {
      fontSize: TYPE.micro,
      fontWeight: 700,
      color: NEUTRAL.muted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 6,
      marginTop: SPACE.sectionGap,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: accent,
      paddingVertical: 7,
      paddingHorizontal: SPACE.rowPadX,
    },
    tableHeaderCell: {
      color: NEUTRAL.white,
      fontSize: TYPE.micro,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: SPACE.rowPadY,
      paddingHorizontal: SPACE.rowPadX,
      borderBottomWidth: 0.5,
      borderBottomColor: NEUTRAL.hairline,
    },
    tableRowAlt: { backgroundColor: NEUTRAL.surface },
    categoryRow: {
      flexDirection: 'row',
      paddingVertical: 5,
      paddingHorizontal: SPACE.rowPadX,
      backgroundColor: NEUTRAL.faint,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderColor: NEUTRAL.hairline,
    },
    categoryLabel: {
      fontSize: TYPE.caption,
      fontWeight: 700,
      color: accent,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    cellNum: { fontSize: TYPE.small, color: NEUTRAL.muted, width: '5%' },
    cellDesc: { fontSize: TYPE.small, color: NEUTRAL.ink, width: '50%', paddingRight: 6 },
    cellQty: { fontSize: TYPE.small, color: NEUTRAL.body, width: '8%', textAlign: 'right' },
    cellUnit: { fontSize: TYPE.small, color: NEUTRAL.muted, width: '10%', textAlign: 'left' },
    cellPrice: { fontSize: TYPE.small, color: NEUTRAL.body, width: '13%', textAlign: 'right' },
    cellTotal: { fontSize: TYPE.small, color: NEUTRAL.ink, width: '14%', textAlign: 'right', fontWeight: 600 },

    descName: { fontSize: TYPE.small, color: NEUTRAL.ink, fontWeight: 500 },
    descMeta: { fontSize: TYPE.micro, color: NEUTRAL.muted, marginTop: 1 },

    // ── Pricing summary ──
    summary: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
    summaryBox: { width: '45%' },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
      borderBottomWidth: 0.5,
      borderBottomColor: NEUTRAL.hairline,
    },
    summaryLabel: { fontSize: TYPE.small, color: NEUTRAL.muted, fontWeight: 500 },
    summaryValue: { fontSize: TYPE.small, color: NEUTRAL.ink, fontWeight: 600 },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: accent,
      paddingVertical: 9,
      paddingHorizontal: 10,
      marginTop: 6,
      borderRadius: 4,
    },
    grandTotalLabel: { color: NEUTRAL.white, fontWeight: 700, fontSize: TYPE.lead, letterSpacing: 0.5 },
    grandTotalValue: { color: NEUTRAL.white, fontWeight: 700, fontSize: TYPE.h4 },

    // ── Payment / Terms / Signature ──
    panel: {
      marginTop: SPACE.sectionGap,
      padding: 12,
      borderWidth: 0.5,
      borderColor: NEUTRAL.hairline,
      borderRadius: 4,
    },
    panelTitle: {
      fontSize: TYPE.micro,
      fontWeight: 700,
      color: accent,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    panelLine: { fontSize: TYPE.caption, color: NEUTRAL.body, lineHeight: 1.7 },
    panelLabel: { fontSize: TYPE.caption, color: NEUTRAL.muted, fontWeight: 500 },
    panelValue: { fontSize: TYPE.caption, color: NEUTRAL.ink, fontWeight: 600 },

    signatures: {
      flexDirection: 'row',
      marginTop: SPACE.sectionGap,
      gap: 12,
    },
    sigBlock: { flex: 1 },
    sigLabel: {
      fontSize: TYPE.micro,
      fontWeight: 700,
      color: NEUTRAL.muted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 28, // space for the actual signature
    },
    sigLine: { borderTopWidth: 0.5, borderTopColor: NEUTRAL.ink, paddingTop: 4 },
    sigName: { fontSize: TYPE.caption, color: NEUTRAL.body, fontWeight: 500 },
    sigSub: { fontSize: TYPE.micro, color: NEUTRAL.muted, marginTop: 1 },

    // ── Footer ──
    footer: {
      position: 'absolute',
      bottom: SPACE.pageMargin / 2,
      left: SPACE.pageMargin,
      right: SPACE.pageMargin,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      borderTopWidth: 0.5,
      borderTopColor: NEUTRAL.hairline,
      paddingTop: 8,
    },
    footerLeft: { fontSize: TYPE.micro, color: NEUTRAL.muted },
    footerCenter: { fontSize: TYPE.micro, color: NEUTRAL.muted, textAlign: 'center' },
    footerRight: { fontSize: TYPE.micro, color: NEUTRAL.muted, textAlign: 'right' },
    footerBrand: { fontSize: TYPE.micro, color: accent, fontWeight: 600, marginTop: 2 },
  });

// ── Component ──────────────────────────────────────────────────────────────

export interface QuotationPDFProps {
  quote: Quote;
  brand: BrandSettings;
}

export function QuotationPDF({ quote, brand }: QuotationPDFProps) {
  const accent = brandHexOrDefault(brand.docPrimary);
  const s = baseStyles(accent);

  const isInvoice = quote.status === 'INVOICED';
  const docTitle = isInvoice ? 'INVOICE' : 'QUOTATION';
  const docNumberLabel = isInvoice ? 'Invoice No.' : 'Quote No.';

  const createdAt = quote.created_at ?? new Date().toISOString();
  const validUntil = addDays(createdAt, 30);

  // Pre-compute subtotal (groups don't store one — derive from items).
  const subtotal = quote.groups.reduce(
    (sum, g) => sum + g.items.reduce((s2, it) => s2 + (Number(it.total) || 0), 0),
    0,
  );
  const grandTotal = Number(quote.grandTotal) || subtotal;

  // Item numbering is continuous across categories so the PDF reads as one
  // sequential bill of materials — the user's clients want this for reconciliation.
  let runningIndex = 0;

  return (
    <Document
      title={`${docTitle} ${quote.ref}`}
      author={brand.companyName || 'OtoQuote AI'}
      subject={quote.description || docTitle}
      creator="OtoQuote AI"
      producer="OtoQuote AI"
    >
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerBand} fixed />
        <View style={s.headerRow}>
          <View style={s.company}>
            {brand.logoUrl ? (
              <View style={s.logoBox}>
                <Image src={brand.logoUrl} style={s.logoImg} />
              </View>
            ) : null}
            <View>
              <Text style={s.companyName}>{brand.companyName || 'Your Company'}</Text>
              {brand.tagline ? <Text style={s.tagline}>{brand.tagline}</Text> : null}
              {brand.address ? <Text style={s.contactLine}>{brand.address}</Text> : null}
              {brand.phone ? <Text style={s.contactLine}>Phone: {brand.phone}</Text> : null}
              {brand.whatsapp && brand.whatsapp !== brand.phone ? (
                <Text style={s.contactLine}>WhatsApp: {brand.whatsapp}</Text>
              ) : null}
              {brand.email ? <Text style={s.contactLine}>{brand.email}</Text> : null}
              {brand.rcNumber ? <Text style={s.contactLine}>CAC: {brand.rcNumber}</Text> : null}
            </View>
          </View>

          <View style={s.docMeta}>
            <Text style={s.docTitle}>{docTitle}</Text>
            <Text style={s.docSubtitle}>{quote.ref}</Text>
            <View style={s.metaTable}>
              <MetaRow style={s} label={docNumberLabel} value={quote.ref} />
              <MetaRow style={s} label="Issued" value={formatDateLong(createdAt)} />
              <MetaRow style={s} label="Valid Until" value={formatDateLong(validUntil)} />
              {brand.contactPerson ? <MetaRow style={s} label="Prepared By" value={brand.contactPerson} /> : null}
            </View>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.partyLabel}>{isInvoice ? 'BILL TO' : 'PREPARED FOR'}</Text>
            <Text style={s.partyName}>{quote.client || 'Client'}</Text>
            {quote.description ? <Text style={s.partyDetail}>{quote.description}</Text> : null}
          </View>
          <View style={s.party}>
            <Text style={s.partyLabel}>PROJECT</Text>
            <Text style={s.partyName}>{quote.description || 'Quotation'}</Text>
            <Text style={s.partyDetail}>
              {quote.groups.reduce((n, g) => n + g.items.length, 0)} line items across {quote.groups.length} {quote.groups.length === 1 ? 'category' : 'categories'}
            </Text>
          </View>
        </View>

        {/* ── Items table ── */}
        <Text style={s.sectionTitle}>Schedule of Works</Text>
        <View style={s.tableHeader} fixed>
          <Text style={[s.tableHeaderCell, { width: '5%' }]}>#</Text>
          <Text style={[s.tableHeaderCell, { width: '50%' }]}>Description</Text>
          <Text style={[s.tableHeaderCell, { width: '8%', textAlign: 'right' }]}>Qty</Text>
          <Text style={[s.tableHeaderCell, { width: '10%' }]}>Unit</Text>
          <Text style={[s.tableHeaderCell, { width: '13%', textAlign: 'right' }]}>Unit Price</Text>
          <Text style={[s.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Total</Text>
        </View>

        {quote.groups.map((group, gi) => (
          <View key={group.id ?? `g-${gi}`} wrap>
            <View style={s.categoryRow} wrap={false}>
              <Text style={s.categoryLabel}>{group.name}</Text>
            </View>
            {group.items.map((item, ii) => {
              const idx = ++runningIndex;
              const altRow = ii % 2 === 1;
              return (
                <View
                  key={item.id ?? `i-${gi}-${ii}`}
                  style={[s.tableRow, altRow ? s.tableRowAlt : {}]}
                  wrap={false}
                >
                  <Text style={s.cellNum}>{idx}</Text>
                  <View style={{ width: '50%', paddingRight: 6 }}>
                    <Text style={s.descName}>{item.name}</Text>
                    {item.regionName ? (
                      <Text style={s.descMeta}>Regional reference · {item.regionName}</Text>
                    ) : null}
                  </View>
                  <Text style={s.cellQty}>{item.qty}</Text>
                  <Text style={s.cellUnit}>{item.unit}</Text>
                  <Text style={s.cellPrice}>{formatNaira(item.unitPrice)}</Text>
                  <Text style={s.cellTotal}>{formatNaira(item.total)}</Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* ── Summary ── */}
        <View style={s.summary}>
          <View style={s.summaryBox}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryValue}>{formatNaira(subtotal)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>VAT</Text>
              <Text style={s.summaryValue}>Not applicable</Text>
            </View>
            <View style={s.grandTotalRow}>
              <Text style={s.grandTotalLabel}>{isInvoice ? 'AMOUNT DUE' : 'GRAND TOTAL'}</Text>
              <Text style={s.grandTotalValue}>{formatNaira(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* ── Payment block (invoices only when bank details are present) ── */}
        {isInvoice && brand.bankDetails ? (
          <View style={s.panel}>
            <Text style={s.panelTitle}>Payment Information</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <PaymentItem style={s} label="Bank" value={brand.bankDetails.bankName} />
              <PaymentItem style={s} label="Account Name" value={brand.bankDetails.accountName} />
              <PaymentItem style={s} label="Account No." value={brand.bankDetails.accountNumber} />
            </View>
            {brand.bankDetails.paymentTerms ? (
              <Text style={[s.panelLine, { marginTop: 6 }]}>
                <Text style={{ fontWeight: 600, color: NEUTRAL.ink }}>Terms: </Text>
                {brand.bankDetails.paymentTerms}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* ── Terms ── */}
        <View style={s.panel}>
          <Text style={s.panelTitle}>Terms & Conditions</Text>
          <Text style={s.panelLine}>1. This {isInvoice ? 'invoice' : 'quotation'} is valid for 30 days from the date of issue.</Text>
          <Text style={s.panelLine}>
            2. Payment terms: {brand.bankDetails?.paymentTerms || '50% deposit required before commencement, balance on completion.'}
          </Text>
          <Text style={s.panelLine}>3. Prices are in Nigerian Naira (NGN) and exclude VAT unless otherwise stated.</Text>
          <Text style={s.panelLine}>4. Any variations to scope may result in additional charges.</Text>
          <Text style={s.panelLine}>5. Please sign and return to indicate acceptance.</Text>
        </View>

        {/* ── Signatures ── */}
        <View style={s.signatures} wrap={false}>
          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>Prepared By</Text>
            <View style={s.sigLine}>
              <Text style={s.sigName}>{brand.contactPerson || brand.companyName || ' '}</Text>
              <Text style={s.sigSub}>{formatDateLong(createdAt)}</Text>
            </View>
          </View>
          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>Approved By</Text>
            <View style={s.sigLine}>
              <Text style={s.sigName}> </Text>
              <Text style={s.sigSub}>Signature & date</Text>
            </View>
          </View>
          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>Client Acceptance</Text>
            <View style={s.sigLine}>
              <Text style={s.sigName}> </Text>
              <Text style={s.sigSub}>Sign & date to accept</Text>
            </View>
          </View>
        </View>

        {/* ── Footer (repeats on every page) ── */}
        <View style={s.footer} fixed>
          <View style={{ flex: 1 }}>
            <Text style={s.footerLeft}>
              {isInvoice ? 'Thank you for your business.' : 'Thank you for the opportunity.'}
            </Text>
            <Text style={s.footerBrand}>Generated by OtoQuote AI</Text>
          </View>
          <Text style={s.footerCenter}>
            {[brand.companyName, brand.phone || brand.whatsapp, brand.email].filter(Boolean).join('  ·  ')}
          </Text>
          <Text
            style={s.footerRight}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// ── Tiny presentational helpers (kept in-file; not reused externally) ───────

function MetaRow({
  style,
  label,
  value,
}: {
  style: ReturnType<typeof baseStyles>;
  label: string;
  value: string;
}) {
  return (
    <View style={style.metaRow}>
      <Text style={style.metaLabel}>{label}</Text>
      <Text style={style.metaValue}>{value}</Text>
    </View>
  );
}

function PaymentItem({
  style,
  label,
  value,
}: {
  style: ReturnType<typeof baseStyles>;
  label: string;
  value: string;
}) {
  return (
    <View>
      <Text style={style.panelLabel}>{label}</Text>
      <Text style={style.panelValue}>{value}</Text>
    </View>
  );
}
