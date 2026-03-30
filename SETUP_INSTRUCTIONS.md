# 🚀 Complete Setup Instructions

## Issues Fixed

1. ✅ **Database Schema Error** - "Could not find the 'cac_number' column"
2. ✅ **Price Log Not Showing** - Missing `type` column
3. ✅ **Custom Color Picker** - Added with react-colorful
4. ✅ **Live Document Preview** - Enhanced preview showcase on BrandPage

---

## Step 1: Run Database Migration

### Open Supabase Dashboard
1. Go to https://supabase.com
2. Open your project: **lczgjuaokmzgynrczziy**
3. Click **SQL Editor** in the left sidebar

### Copy and Run This SQL

```sql
-- ============================================
-- BRAND CONFIGURATION & FEATURES MIGRATION
-- Run this entire block in Supabase SQL Editor
-- ============================================

-- 1. Add brand fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS cac_number TEXT,
ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '170 75% 31%',
ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '213 27% 34%',
ADD COLUMN IF NOT EXISTS default_payment_terms TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add session tracking to quotations
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 3. Fix price_log table (add type, category, supplier)
ALTER TABLE public.price_log
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'MATERIALS',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS supplier TEXT;

-- 4. Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage own chat sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.uid() = user_id);

-- 5. Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING',
  payment_details JSONB,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id);
```

### Click "Run" or Press Ctrl+Enter

You should see: **Success. No rows returned**

---

## Step 2: Verify Migration Success

Run this verification query:

```sql
-- Check all new columns exist
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'profiles' AND column_name IN ('cac_number', 'whatsapp', 'brand_primary_color', 'brand_secondary_color'))
    OR (table_name = 'price_log' AND column_name IN ('type', 'category', 'supplier'))
    OR (table_name = 'quotations' AND column_name IN ('session_id', 'version'))
  )
ORDER BY table_name, column_name;
```

You should see all the new columns listed.

---

## Step 3: Refresh Your Application

1. **Hard Refresh** your browser:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Cache** (if needed):
   - Chrome: Settings → Privacy → Clear browsing data
   - Select "Cached images and files"
   - Click "Clear data"

---

## Step 4: Test All Features

### ✅ Test Brand Configuration

1. Navigate to **Brand & Company** page
2. Upload your logo (PNG, JPG, or SVG)
3. Fill in all company information:
   - Company Name
   - Contact Person
   - Business Email
   - Phone Number
   - WhatsApp Number
   - Company Address
   - CAC Registration Number
4. Select primary and secondary colors
   - Try preset colors
   - Click "Custom" to use color picker
   - Watch the live preview update!
5. Add bank details
6. Click **Save Settings**
   - Should see: "Brand settings saved successfully!"
   - No error about `cac_number`

### ✅ Test Price Log

1. Navigate to **Price Log** page
2. Click **+** button to add new item
3. Switch between **MATERIALS** and **LABOUR** tabs
4. Add items to each category
5. Items should now appear in their respective tabs
6. Search functionality should work

### ✅ Test PDF Export

1. Navigate to **Quotations** page
2. Open any existing quote (or create one via AI Chat)
3. Verify your brand appears:
   - Logo visible
   - Company name, CAC, email, phone
   - Brand colors applied
4. Click **Export PDF** button
5. PDF should download with all branding intact

### ✅ Test Quote Templates

1. Go to **Brand & Company** → Change template style
2. Open a quote
3. Verify template changes (Classic/Modern/Minimal)
4. All should show your brand consistently

---

## What's New

### 1. Custom Color Picker 🎨
- Click "Custom" button next to Primary or Secondary color
- Interactive HSL color picker appears
- Pick any color you want!
- See HSL values in real-time
- Live preview updates instantly

### 2. Enhanced Document Preview 📄
- Mini document preview on BrandPage
- Shows exactly how your brand will look
- Updates in real-time as you configure
- Displays logo, colors, company name
- Sample quote layout

### 3. Price Log Fixed 💰
- MATERIALS and LABOUR tabs now work correctly
- Items save with proper type categorization
- Category and Supplier fields supported
- Search and filter working

### 4. Complete Brand Fields 🏢
- CAC Number field added
- WhatsApp number field added
- Business email field added
- All display on quotes and invoices

---

## Common Issues & Solutions

### Issue: Still seeing "cac_number" error

**Solution:**
```sql
-- Run this directly:
ALTER TABLE public.profiles ADD COLUMN cac_number TEXT;
ALTER TABLE public.profiles ADD COLUMN whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN brand_primary_color TEXT DEFAULT '170 75% 31%';
ALTER TABLE public.profiles ADD COLUMN brand_secondary_color TEXT DEFAULT '213 27% 34%';
```

Then hard refresh your app.

### Issue: Price Log items not showing

**Solution:**
```sql
-- Run this:
ALTER TABLE public.price_log ADD COLUMN type TEXT DEFAULT 'MATERIALS';
ALTER TABLE public.price_log ADD COLUMN category TEXT;
ALTER TABLE public.price_log ADD COLUMN supplier TEXT;

-- Update existing items:
UPDATE public.price_log SET type = 'MATERIALS' WHERE type IS NULL;
```

### Issue: Colors not updating in preview

**Solution:**
- Make sure you clicked "Save Settings"
- Hard refresh the page
- Check that CSS variables are loading (inspect element)

### Issue: PDF not including brand

**Solution:**
- Make sure quote has been saved to database (not draft)
- Refresh the quotes page
- Brand should load from your profile

---

## Feature Showcase

### Brand Configuration Page Features:

1. **Logo Upload**
   - Drag & drop or click to upload
   - Preview immediately
   - Appears on all documents

2. **Color System**
   - 10 professional preset colors
   - Custom color picker for unlimited options
   - Live HSL value display
   - Real-time preview

3. **Company Information**
   - All fields optional but recommended
   - CAC number for official documents
   - Email and WhatsApp for contact
   - Address for professional appearance

4. **Payment Information**
   - Bank details for invoices
   - Custom payment terms
   - 70/30 split calculation displayed

5. **Template Selection**
   - Classic - Formal, bordered
   - Modern - Clean, gradients
   - Minimal - Light, spacious

6. **Live Preview**
   - Mini document shows exact branding
   - Updates as you type/select
   - WYSIWYG guarantee

---

## Success Checklist

After completing setup, you should be able to:

- [ ] Save brand settings without errors
- [ ] Upload and see your logo
- [ ] Select preset colors
- [ ] Use custom color picker
- [ ] See live document preview
- [ ] Add items to MATERIALS tab in Price Log
- [ ] Add items to LABOUR tab in Price Log
- [ ] Search price log items
- [ ] View quotes with full branding
- [ ] Export PDF with all brand elements
- [ ] Generate invoices with bank details
- [ ] Switch between template styles

---

## Technical Details

### New NPM Packages Installed:
- `html2canvas` - PDF generation
- `jspdf` - PDF creation
- `react-colorful` - Color picker

### New Database Columns:
- `profiles.cac_number`
- `profiles.whatsapp`
- `profiles.brand_primary_color`
- `profiles.brand_secondary_color`
- `profiles.default_payment_terms`
- `price_log.type`
- `price_log.category`
- `price_log.supplier`
- `quotations.session_id`
- `quotations.version`

### New Database Tables:
- `chat_sessions` - For AI chat history
- `invoices` - For invoice tracking

---

## Need Help?

1. Check the error message in browser console (F12)
2. Verify database migration ran successfully
3. Try hard refresh
4. Check Supabase logs for API errors
5. Refer to [BRAND_CONFIGURATION_GUIDE.md](BRAND_CONFIGURATION_GUIDE.md) for detailed docs

---

**Status: ✅ ALL FEATURES READY**

Your Quote Master Pro application now has:
- ✅ Complete brand customization
- ✅ Custom color picker
- ✅ Live document preview
- ✅ Working price log with categories
- ✅ Professional PDF export
- ✅ Three template styles
- ✅ Full invoice generation
