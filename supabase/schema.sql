-- Supabase Schema for Quote Master Pro

-- 1. Profiles (extends Supabase Auth users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  contact_person TEXT,
  cac_number TEXT, -- Corporate Affairs Commission registration number
  logo_url TEXT, -- URL to logo in Supabase Storage or base64
  brand_primary_color TEXT DEFAULT '170 75% 31%', -- HSL format
  brand_secondary_color TEXT DEFAULT '213 27% 34%', -- HSL format
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT, -- 10-digit NUBAN
  default_payment_terms TEXT,
  points_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Quotations (stores both Quotes and Invoices based on status)
CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- Links to chat session if created via AI
  version INTEGER DEFAULT 1, -- Version number for chat-based iterations
  ref TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  status TEXT DEFAULT 'APPROVED', -- 'APPROVED', 'INVOICED', 'ARCHIVED'
  template_style TEXT DEFAULT 'classic',
  grand_total NUMERIC DEFAULT 0,
  data JSONB NOT NULL, -- Stores the nested groups and items array
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own quotations" ON public.quotations FOR ALL USING (auth.uid() = user_id);

-- 3. Price Log (Remembers user's custom pricing)
CREATE TABLE public.price_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_name) -- Ensure one price per item per user
);

ALTER TABLE public.price_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own price log" ON public.price_log FOR ALL USING (auth.uid() = user_id);

-- 4. Point Transactions (Audit log for point system)
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for recharge, negative for deduction
  transaction_type TEXT NOT NULL, -- 'RECHARGE', 'QUOTE_GENERATION', 'PDF_EXPORT'
  reference TEXT, -- E.g., Paystack transaction reference
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id);
-- Insert/Update should ideally be restricted to database functions or secure server-side logic

-- 5. Chat Sessions (AI chat history)
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  last_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);

-- 6. Invoices (Separate invoice records for tracking)
CREATE TABLE public.invoices (
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

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id);
