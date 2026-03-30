-- ============================================
-- BRAND CONFIGURATION MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add missing columns to profiles table
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS cac_number TEXT,
ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '170 75% 31%',
ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '213 27% 34%',
ADD COLUMN IF NOT EXISTS default_payment_terms TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add missing columns to quotations table
-- ============================================
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 2b. Add type column to price_log table
-- ============================================
ALTER TABLE public.price_log
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'MATERIALS',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS supplier TEXT;

-- 3. Create chat_sessions table
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for chat_sessions
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage own chat sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.uid() = user_id);

-- 4. Create invoices table
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'OVERDUE'
  payment_details JSONB, -- Bank details snapshot
  data JSONB NOT NULL, -- Complete quote data snapshot
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for invoices
DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
CREATE POLICY "Users can manage own invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify the migration worked
-- ============================================

-- Check profiles table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check quotations table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quotations'
ORDER BY ordinal_position;

-- Check chat_sessions table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'chat_sessions';

-- Check invoices table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'invoices';

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Update existing user profile with sample brand data
-- Replace 'your-user-id-here' with actual user ID
/*
UPDATE public.profiles
SET
  company_name = 'Acme Electrical Services',
  email = 'info@acmeelectrical.com',
  phone = '+234 803 456 7890',
  whatsapp = '+234 803 456 7890',
  address = '123 Industrial Avenue, Ikeja, Lagos',
  contact_person = 'John Doe',
  cac_number = 'RC123456',
  brand_primary_color = '170 75% 31%',
  brand_secondary_color = '213 27% 34%',
  bank_name = 'GTBank',
  account_name = 'Acme Electrical Services Ltd',
  account_number = '0123456789',
  default_payment_terms = '70% advance payment required to commence work. Balance upon completion.',
  updated_at = NOW()
WHERE id = 'your-user-id-here';
*/

-- ============================================
-- ROLLBACK (Only if you need to undo changes)
-- ============================================

/*
-- Drop new tables
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;

-- Remove new columns from quotations
ALTER TABLE public.quotations
DROP COLUMN IF EXISTS session_id,
DROP COLUMN IF EXISTS version;

-- Remove new columns from profiles
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS whatsapp,
DROP COLUMN IF EXISTS cac_number,
DROP COLUMN IF EXISTS brand_primary_color,
DROP COLUMN IF EXISTS brand_secondary_color,
DROP COLUMN IF EXISTS default_payment_terms,
DROP COLUMN IF EXISTS updated_at;
*/
