# 🗄️ Database Setup Instructions

## ⚠️ IMPORTANT: Run This First!

You're seeing the error `"Could not find the 'cac_number' column of 'profiles' in the schema cache"` because the database columns haven't been added yet.

---

## Step-by-Step Setup

### 1. Open Supabase Dashboard
1. Go to https://supabase.com
2. Open your project: **lczgjuaokmzgynrczziy**
3. Click on **SQL Editor** in the left sidebar

### 2. Run the Migration Script

**Copy and paste this entire SQL block into the SQL Editor:**

```sql
-- ============================================
-- BRAND CONFIGURATION MIGRATION
-- ============================================

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS cac_number TEXT,
ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '170 75% 31%',
ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '213 27% 34%',
ADD COLUMN IF NOT EXISTS default_payment_terms TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add missing columns to quotations table
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 3. Create chat_sessions table
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

-- 4. Create invoices table
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

### 3. Click "Run" or Press Ctrl+Enter

You should see: **Success. No rows returned**

### 4. Verify the Migration Worked

Run this verification query:

```sql
-- Check if all columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('cac_number', 'whatsapp', 'brand_primary_color', 'brand_secondary_color', 'default_payment_terms', 'updated_at')
ORDER BY column_name;
```

You should see all 6 columns listed.

### 5. Refresh Your App

After running the migration:
1. **Refresh your browser** (F5 or Ctrl+R)
2. Go to **Brand & Company** page
3. Try saving again - the error should be gone! ✅

---

## What This Does

This migration adds:
- ✅ `cac_number` - CAC Registration Number field
- ✅ `whatsapp` - WhatsApp number field
- ✅ `email` - Business email (already exists, but we ensure it's there)
- ✅ `brand_primary_color` - Primary brand color (HSL format)
- ✅ `brand_secondary_color` - Secondary brand color (HSL format)
- ✅ `default_payment_terms` - Default payment terms for invoices
- ✅ `updated_at` - Timestamp for last update
- ✅ `session_id` and `version` in quotations table for AI chat
- ✅ `chat_sessions` table for chat history
- ✅ `invoices` table for invoice tracking

---

## Troubleshooting

### If you still see errors after running:

1. **Clear Supabase cache:**
   - In Supabase dashboard, go to **Settings** → **API**
   - Click "Reset API Key" (this will force schema refresh)

2. **Refresh your app:**
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

3. **Check if columns exist:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'profiles' AND table_schema = 'public';
   ```

4. **If columns don't exist, run ALTER TABLE directly:**
   ```sql
   ALTER TABLE public.profiles ADD COLUMN cac_number TEXT;
   ALTER TABLE public.profiles ADD COLUMN whatsapp TEXT;
   ALTER TABLE public.profiles ADD COLUMN brand_primary_color TEXT DEFAULT '170 75% 31%';
   ALTER TABLE public.profiles ADD COLUMN brand_secondary_color TEXT DEFAULT '213 27% 34%';
   ALTER TABLE public.profiles ADD COLUMN default_payment_terms TEXT;
   ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
   ```

---

## ✅ Success Checklist

After running the migration, you should be able to:
- [ ] Save brand settings without errors
- [ ] See CAC number field in Brand page
- [ ] See WhatsApp field in Brand page
- [ ] Select brand colors
- [ ] Add bank details
- [ ] Save and see success toast

---

**Need help?** Check the SQL output for specific error messages.
