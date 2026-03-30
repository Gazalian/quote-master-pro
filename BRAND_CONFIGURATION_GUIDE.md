# Brand Configuration & PDF Export - Implementation Guide

## Overview

This system provides a comprehensive brand configuration module that integrates with quote/invoice preview rendering and PDF export generation. All generated documents maintain visual consistency and professional branding based on user-defined settings.

---

## 1. Brand Configuration Module

### Location
**Page:** [src/pages/BrandPage.tsx](src/pages/BrandPage.tsx)

### Supported Fields

#### Company Information
- **Company/Trading Name** - Your business name
- **Contact Person** - Primary contact for quotes
- **Business Email** - Company email address
- **Primary Phone Number** - Main contact number
- **WhatsApp Number** - WhatsApp business number
- **Company Address** - Full business address
- **CAC Registration Number** - Corporate Affairs Commission registration

#### Logo Upload
- **Formats Supported:** PNG, JPG, SVG
- **Storage:** Base64 encoding (stored in database)
- **Display:** Automatically rendered in all document templates

#### Brand Colors
- **Primary Color** - Controls headers, accents, section titles, table headers
- **Secondary Color** - Controls borders, text highlights, separators
- **Format:** HSL values (e.g., "170 75% 31%")
- **Preset Colors:** 10 professional color options available
- **Live Preview:** Colors update in real-time on the page

#### Payment Information
- **Bank Name** - e.g., GTBank, Moniepoint
- **Account Name** - As registered with bank
- **Account Number** - 10-digit NUBAN
- **Default Payment Terms** - Custom terms (e.g., "70% advance payment required")

### Data Persistence

**Database Table:** `profiles` (Supabase)

**Schema:**
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  contact_person TEXT,
  cac_number TEXT,
  logo_url TEXT,
  brand_primary_color TEXT DEFAULT '170 75% 31%',
  brand_secondary_color TEXT DEFAULT '213 27% 34%',
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  default_payment_terms TEXT,
  points_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Preview System (WYSIWYG)

### Real-Time Brand Application

The preview system dynamically reflects brand configuration with **instant updates**. Any change in brand settings updates the preview immediately.

### Template Locations
1. **Classic Template** - [src/components/templates/ClassicTemplate.tsx](src/components/templates/ClassicTemplate.tsx)
2. **Modern Template** - [src/components/templates/ModernTemplate.tsx](src/components/templates/ModernTemplate.tsx)
3. **Minimal Template** - [src/components/templates/MinimalTemplate.tsx](src/components/templates/MinimalTemplate.tsx)

### Layout Rules

#### Header Section
**Classic Template:**
- Background color uses primary color
- Logo displayed in top-right with white/transparent background
- Company name, CAC number, address, contact person, phone, email
- Document reference and date

**Modern Template:**
- Gradient background with primary color accent
- Decorative corner element using primary color
- Logo prominently displayed
- All company details with conditional rendering

**Minimal Template:**
- Clean, borderless design
- Grayscale logo filter
- Minimalist company information layout
- Maximum whitespace

#### Color Application
- **Headers:** Primary color background or text
- **Section Titles:** Primary color text with matching borders
- **Table Headers:** Primary color styling
- **Borders/Separators:** Secondary color or primary color at low opacity
- **Accents:** Primary color for highlights and emphasis
- **Total Amount:** Large, bold primary color text

#### Body Content
- **Categories/Groups:** Clearly separated sections
- **Items:** Name, quantity, unit, unit price, total
- **Pricing Structure:** Subtotals per group + grand total
- **Source Tags:** "MY PRICE" vs "AI ESTIMATE" badges

#### Footer (Invoice Mode)
When `quote.status === "INVOICED"`:
- **Payment Information Section:**
  - Bank name, account number, account name
  - Deposit calculation (70% default)
  - Balance due
  - Payment terms (custom text from brand settings)

### Conditional Rendering
All brand fields use optional chaining to prevent layout breaking:
```tsx
{brand.rcNumber && <p>CAC: {brand.rcNumber}</p>}
{brand.email && <p>{brand.email}</p>}
{brand.phone && <p>{brand.phone}</p>}
```

---

## 3. PDF Generation System

### Technology Stack
- **html2canvas** - Converts HTML elements to canvas
- **jsPDF** - Generates PDF from canvas images

### Implementation

**Utility Module:** [src/lib/pdfExport.ts](src/lib/pdfExport.ts)

**Key Function:**
```typescript
exportToPDF(elementId: string, quote: Quote): Promise<void>
```

### How It Works

1. **Element Capture**
   - Clones the target HTML element
   - Renders to high-quality canvas (scale: 2)
   - Supports CORS images (logos from external sources)

2. **PDF Generation**
   - A4 page size (210mm x 297mm)
   - Automatic pagination for long documents
   - High-resolution output (2x scaling)

3. **Filename Convention**
   ```
   Quotation_ClientName_2025-03-24.pdf
   Invoice_ClientName_2025-03-24.pdf
   ```

4. **Download**
   - Automatic browser download
   - No server-side processing required

### Export Triggers

**QuoteCard Component:** [src/components/QuoteCard.tsx](src/components/QuoteCard.tsx)

**Export Buttons:**
- **APPROVED Status:** "Export PDF" button
- **INVOICED Status:** "Download PDF" button
- **ARCHIVED Status:** "View Archived PDF" button

**User Flow:**
1. User clicks "Export PDF" or "Download PDF"
2. Loading toast appears: "Generating PDF..."
3. System captures template element with brand styling
4. PDF generated and downloaded automatically
5. Success toast: "PDF downloaded successfully!"

---

## 4. API Layer

### Brand API

**Location:** [src/lib/api.ts](src/lib/api.ts)

```typescript
export const brandAPI = {
  // Get brand settings for a user
  async getBrandSettings(userId: string): Promise<BrandSettings>

  // Update brand settings
  async updateBrandSettings(userId: string, settings: any): Promise<void>
}
```

### Quote API Integration

Quotes automatically fetch and apply brand settings:
```typescript
const brand = await brandAPI.getBrandSettings(user.id);
// Brand settings applied to template
<ModernTemplate quote={quote} brand={brand} />
```

---

## 5. Template System Architecture

### Brand Settings Interface

```typescript
export interface BrandSettings {
  companyName: string;
  tagline: string;
  address: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  rcNumber: string; // CAC Number
  logoUrl: string | null;
  docPrimary: string; // HSL color
  docSecondary: string; // HSL color
  templateStyle: TemplateStyle;
  bankDetails?: BankDetails;
}
```

### Template Props

All templates receive:
```typescript
interface TemplateProps {
  quote: Quote;
  brand: BrandSettings;
}
```

### Dynamic Styling

**CSS Variables:**
```typescript
const primaryColor = brand.docPrimary
  ? `hsl(${brand.docPrimary})`
  : "var(--doc-primary)";
```

**Inline Styles:**
```tsx
<div style={{ backgroundColor: primaryColor }}>
  <h1 style={{ color: 'white' }}>{brand.companyName}</h1>
</div>
```

**Color Mixing (Modern Browser Feature):**
```tsx
style={{
  backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)`
}}
```

---

## 6. Integration Points

### Quote Flow

1. **AI Chat Generation**
   - User describes job → AI generates draft quote
   - Draft includes template style selection
   - Preview shows placeholder brand data

2. **Save to Dashboard**
   - Quote saved to `quotations` table
   - Brand settings fetched from user profile
   - Full preview rendered with actual brand

3. **View/Edit Quote**
   - Opens [QuotesPage.tsx](src/pages/QuotesPage.tsx)
   - [QuoteCard.tsx](src/components/QuoteCard.tsx) displays quote with brand
   - Edit mode available

4. **Generate Invoice**
   - Status changed from APPROVED → INVOICED
   - Payment details section appears
   - Bank account information displayed

5. **Export PDF**
   - User clicks export button
   - PDF generated with full brand styling
   - File downloaded with proper naming

---

## 7. Key Design Principles

### Single Source of Truth
The brand configuration in `profiles` table is the **only source** for all visual identity. No manual styling needed per document.

### WYSIWYG Guarantee
What you see in the preview is **exactly** what appears in the exported PDF.

### Professional Quality
- Clean typography (system fonts)
- Consistent spacing and alignment
- Professional color contrast
- Print-ready output

### Responsive Branding
- Logo scales appropriately
- Colors adjust with contrast consideration
- Layout adapts to content length
- Multi-page support for long quotes

---

## 8. Customization Guide

### Adding New Brand Fields

**Step 1: Update Database Schema**
```sql
ALTER TABLE public.profiles
ADD COLUMN new_field TEXT;
```

**Step 2: Update BrandSettings Type**
```typescript
// src/types/quote.ts
export interface BrandSettings {
  ...
  newField: string;
}
```

**Step 3: Add UI Input**
```tsx
// src/pages/BrandPage.tsx
<input
  value={newField}
  onChange={e => setNewField(e.target.value)}
/>
```

**Step 4: Update Templates**
```tsx
// src/components/templates/*.tsx
{brand.newField && <p>{brand.newField}</p>}
```

### Creating New Templates

1. Create new template file in `src/components/templates/`
2. Import `Quote` and `BrandSettings` types
3. Implement template with brand integration
4. Add to `QuoteCard.tsx` switch statement
5. Update `TemplateStyle` type in `src/types/quote.ts`

---

## 9. Testing Checklist

- [ ] Upload logo → Verify appears in all templates
- [ ] Change primary color → Verify headers update instantly
- [ ] Change secondary color → Verify borders update instantly
- [ ] Fill all company fields → Verify all appear in templates
- [ ] Add CAC number → Verify displays in header
- [ ] Add bank details → Verify shows in invoice mode
- [ ] Export PDF → Verify matches preview exactly
- [ ] Generate invoice → Verify payment section appears
- [ ] Test all three templates → Verify consistent branding
- [ ] Test long quotes → Verify multi-page PDF works

---

## 10. Troubleshooting

### PDF Not Generating
- **Issue:** Element ID not found
- **Fix:** Ensure template wrapped in `<div id={quote-template-${quote.id}}>`

### Logo Not Showing in PDF
- **Issue:** CORS policy blocking external images
- **Fix:** Use base64 encoding for logo upload

### Colors Not Applying
- **Issue:** CSS variables not resolving
- **Fix:** Use inline styles with HSL values directly

### Preview Not Updating
- **Issue:** State not syncing
- **Fix:** Check `useEffect` dependencies in BrandPage

---

## 11. Future Enhancements

### Supabase Storage Integration
Replace base64 logo encoding with Supabase Storage:
```typescript
const { data, error } = await supabase.storage
  .from('logos')
  .upload(`${userId}/logo.png`, file);
```

### Custom Color Picker
Add custom HSL color input beyond presets.

### Multiple Bank Accounts
Support multiple payment methods per user.

### Template Preview Mode
Add live preview on BrandPage showing sample quote.

### PDF Optimization
Implement server-side PDF generation for faster performance.

---

## Summary

This brand configuration system provides:
✅ Complete brand customization
✅ Real-time preview updates
✅ Professional PDF export
✅ WYSIWYG accuracy
✅ Three template styles
✅ Automatic invoice generation
✅ Clean, maintainable architecture
✅ Extensible design

**Everything — preview and exported PDF — looks identical, feels professional, and reflects the user's brand without requiring manual styling each time.**
