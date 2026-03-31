-- ============================================
-- PROFILE FIELDS MIGRATION
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- 1. Add personal profile columns
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS trade_type TEXT,
  ADD COLUMN IF NOT EXISTS state_operation TEXT,
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 2. RLS policies
-- ============================================

-- Allow users to INSERT their own profile row (needed for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Trigger: auto-create + populate profile on signup
--    Reads full_name / trade_type / state_operation from user_metadata
--    passed via supabase.auth.signUp({ options: { data: { ... } } })
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    trade_type,
    state_operation,
    points
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'trade_type',
    NEW.raw_user_meta_data->>'state_operation',
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name        = COALESCE(EXCLUDED.full_name,        public.profiles.full_name),
    trade_type       = COALESCE(EXCLUDED.trade_type,       public.profiles.trade_type),
    state_operation  = COALESCE(EXCLUDED.state_operation,  public.profiles.state_operation),
    email            = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill existing users whose profile row may be missing
-- ============================================
INSERT INTO public.profiles (id, email, points)
SELECT id, email, 0
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFY — check the new columns exist
-- ============================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
