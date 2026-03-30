# ⚡ Quick Start Guide

## 🔴 IMPORTANT: Do This First!

### 1. Run This SQL in Supabase

Open Supabase SQL Editor and run:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS cac_number TEXT,
ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '170 75% 31%',
ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '213 27% 34%',
ADD COLUMN IF NOT EXISTS default_payment_terms TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.price_log
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'MATERIALS',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS supplier TEXT;
```

### 2. Refresh Your App
Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

---

## ✅ Now You Can:

### Configure Your Brand
1. Go to **Brand & Company** page
2. Upload logo
3. Enter company details
4. Pick colors (preset or custom)
5. Add bank details
6. **Click Save**

### Use Price Log
1. Go to **Price Log** page
2. Switch between MATERIALS/LABOUR tabs
3. Add items with **+** button
4. Items now save and display correctly!

### Export PDFs
1. Go to **Quotations** page
2. Open any quote
3. Click **Export PDF** button
4. PDF downloads with full branding!

---

## 🎨 New Features

**Custom Color Picker**
- Click "Custom" next to color selection
- Pick any color you want
- See live preview update!

**Enhanced Preview**
- See mini document on Brand page
- Shows exactly how quotes will look
- Updates in real-time!

**Complete Branding**
- Logo on all documents
- CAC number displayed
- Email & WhatsApp included
- Bank details on invoices

---

## 📝 Full Documentation

- [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) - Complete setup guide
- [BRAND_CONFIGURATION_GUIDE.md](BRAND_CONFIGURATION_GUIDE.md) - Technical details
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - What was built

---

**That's it! You're ready to go!** 🚀
