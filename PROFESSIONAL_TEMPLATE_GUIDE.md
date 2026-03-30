# Professional Quotation Template - Design Guide

## Overview

The **ModernTemplate** has been completely redesigned to follow professional Nigerian business quotation standards while maintaining modern, clean aesthetics and full brand integration.

---

## ✅ Design Requirements Met

### 1. **Header Design** ✅

**LEFT SECTION:**
- Logo in a bordered box (60x60px, properly scaled)
- Company Name (bold, colored with brand primary)
- Tagline (if provided)
- Full address
- Phone & WhatsApp
- Email
- CAC Registration Number

**RIGHT SECTION:**
- Large "QUOTE" or "INVOICE" badge (brand colored)
- Metadata table with:
  - DATE
  - QUOTE #
  - VALID UNTIL (auto-calculated 30 days)

### 2. **Customer Section** ✅

- Blue header bar with "CUSTOMER" label
- Client name (bold, larger)
- Job description

### 3. **Items Table** ✅

**Professional table with:**
- Header row (brand colored background, white text)
- 4 columns:
  - DESCRIPTION (left-aligned)
  - UNIT PRICE (right-aligned, Nigerian format)
  - QTY (center-aligned)
  - AMOUNT (right-aligned, Nigerian format)

**Features:**
- Category headers (Materials, Labour, etc.) with brand color
- Alternating row colors (white/gray) for readability
- Item details show: "5 meters × ₦15,000.00"
- Category subtotals (if multiple groups)
- Minimum 3 empty rows for visual balance

### 4. **Summary Section** ✅

**Right-aligned table showing:**
- Subtotal row
- **TOTAL row** (brand colored, bold, larger font)

**Nigerian Currency Formatting:**
- All amounts show ₦ symbol
- Formatted with commas: ₦1,250,000.00
- Two decimal places
- Right-aligned for easy scanning

### 5. **Payment Details** ✅

**(For Invoices Only)**
- Light blue background box
- Bank Name
- Account Name
- Account Number (10-digit NUBAN)
- Payment Terms

### 6. **Terms & Conditions** ✅

- Brand colored header bar
- 5 standard terms:
  1. Validity period (30 days)
  2. Payment terms
  3. Currency & VAT notes
  4. Variation clause
  5. Signature requirement

### 7. **Signature Section** ✅

- "Customer Acceptance" label
- Signature line
- "Print Name:" field

### 8. **Footer** ✅

- Contact information
- **"Thank You For Your Business!"** (brand colored, italic)

---

## 🎨 Brand Integration

The template dynamically applies user's brand settings:

```typescript
// Brand Color Applied To:
- Header border (4px bottom)
- Company name
- QUOTE/INVOICE badge background
- Logo border
- Category headers
- Table header background
- TOTAL row background
- Terms header
- Footer border and text
```

**Default Colors (if not set):**
- Primary: `#1e40af` (professional blue)
- Secondary: `#475569` (slate gray)

---

## 📐 Layout Specifications

```css
Page Size: 210mm (A4 width)
Font: Segoe UI (fallback: Tahoma, Geneva, Verdana)
Base Font Size: 10pt
Line Height: 1.4
Padding: 32px (8 in Tailwind units)
```

**Section Spacing:**
- Header: 24px bottom margin
- Customer: 24px bottom margin
- Table: 24px bottom margin
- Footer: 24px top padding

**Table Styling:**
- Border: 1px solid gray-300
- Header cells: 3px padding
- Body cells: 2px padding
- Alternating rows: white / gray-50

---

## 💾 PDF Export Ready

The template is designed for clean PDF conversion:

✅ **Fixed width**: 210mm (A4 standard)
✅ **Print-friendly colors**: Professional blues and grays
✅ **Proper margins**: Adequate white space
✅ **Border collapse**: Clean table borders
✅ **High contrast**: Black text on white/light backgrounds
✅ **No gradients**: Solid colors only
✅ **Tabular numbers**: Monospaced for alignment

---

## 🆚 Comparison with Reference Template

| Element | Reference Template | OtoQuote Template | Improvement |
|---------|-------------------|-------------------|-------------|
| **Header** | Basic text | Logo + colored badge | ✅ More professional |
| **Branding** | Static | Dynamic brand colors | ✅ Personalized |
| **Table** | Simple lines | Alternating rows | ✅ Better readability |
| **Currency** | Generic $ | Nigerian ₦ format | ✅ Localized |
| **Total** | Plain row | Colored, bold, large | ✅ More prominent |
| **Terms** | Plain text | Colored header bar | ✅ Organized |
| **Footer** | Basic | Branded closing | ✅ Professional |

---

## 📊 Key Features

### ✨ Modern Improvements

1. **Smart Logo Scaling**
   - Never stretches or distorts
   - Contained in 60x60px box
   - Maintains aspect ratio

2. **Intelligent Row Coloring**
   - Alternates across ALL items (not per category)
   - Maintains pattern even with category headers

3. **Auto-calculated Validity**
   - Always shows 30 days from quote date
   - Proper date formatting (DD Mon YYYY)

4. **Responsive Metadata Table**
   - Clean bordered cells
   - Monospaced quote numbers
   - Right-aligned labels

5. **Category Grouping**
   - Clear visual separation (Materials, Labour, etc.)
   - Category subtotals when multiple groups
   - Brand-colored headers

---

## 🎯 Nigerian Business Standards

The template follows Nigerian quotation best practices:

✅ CAC Registration Number displayed
✅ Nigerian Naira (₦) currency
✅ Lagos/Nigerian address formats
✅ WhatsApp contact included
✅ 50% deposit payment terms
✅ 30-day validity standard
✅ Professional closing message

---

## 🔧 Usage

The template is automatically used when:
- Template style is set to "modern"
- Generating quotes from AI
- Exporting to PDF

**No code changes needed** - just update your brand settings in the Brand page and all quotes will use your branding!

---

## 📝 Example Output

```
┌─────────────────────────────────────────────────────────────┐
│ [LOGO]  ACME ELECTRICALS LTD              ┌──────────────┐  │
│         123 Lagos Street                   │   QUOTE      │  │
│         Phone: 0801234567                  └──────────────┘  │
│         CAC: RC123456                      DATE: 25/03/2026  │
│                                            QUOTE #: AI-2026  │
│                                            VALID: 24/04/2026 │
├─────────────────────────────────────────────────────────────┤
│ CUSTOMER                                                     │
│ John Doe Properties                                          │
│ Complete electrical wiring for 3-bedroom flat               │
├─────────────────────────────────────────────────────────────┤
│ DESCRIPTION        │ UNIT PRICE │  QTY │      AMOUNT       │
├─────────────────────────────────────────────────────────────┤
│ MATERIALS                                                    │
│ 16mm Cable         │ ₦22,000.00 │   4  │    ₦88,000.00     │
│ 13A Socket         │  ₦1,000.00 │  15  │    ₦15,000.00     │
├─────────────────────────────────────────────────────────────┤
│ LABOUR                                                       │
│ Installation       │ ₦60,000.00 │   3  │   ₦180,000.00     │
├─────────────────────────────────────────────────────────────┤
│                                    TOTAL: ₦ 283,000.00      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. **Configure your brand** in the Brand Settings page
2. **Generate a quote** using AI or manually
3. **Export to PDF** - it will look exactly like the preview!
4. **Send to client** - professional, branded, ready to go

---

**Last Updated**: March 25, 2026
**Version**: 2.0 (Professional)
**Template File**: `src/components/templates/ModernTemplate.tsx`
