-- ============================================================================
-- PHASE 1 — Performance, Security & Atomicity hardening
-- ----------------------------------------------------------------------------
-- Applied to project lczgjuaokmzgynrczziy via Supabase MCP. This file mirrors
-- the changes for version-control parity. Safe to re-run (all idempotent).
-- ============================================================================

-- ─── 1. Hot-path composite indexes ──────────────────────────────────────────
-- Every RLS-filtered list query was sequential scan + sort before this.
CREATE INDEX IF NOT EXISTS idx_quotations_user_created
  ON public.quotations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotations_session
  ON public.quotations (session_id, version DESC)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_user_status
  ON public.quotations (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated
  ON public.chat_sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_user_created
  ON public.invoices (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_quotation
  ON public.invoices (quotation_id);

CREATE INDEX IF NOT EXISTS idx_price_log_user_used
  ON public.price_log (user_id, last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_created
  ON public.point_transactions (user_id, created_at DESC);

-- ─── 2. Consolidate points column ───────────────────────────────────────────
-- profiles.points_balance was a duplicate of profiles.points. One canonical
-- column with a non-negative CHECK constraint.
UPDATE public.profiles
SET points = COALESCE(NULLIF(points, 0), points_balance, 0)
WHERE points_balance IS NOT NULL AND (points IS NULL OR points = 0);

ALTER TABLE public.profiles DROP COLUMN IF EXISTS points_balance;
ALTER TABLE public.profiles
  ALTER COLUMN points SET DEFAULT 0,
  ALTER COLUMN points SET NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_points_nonneg;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_points_nonneg CHECK (points >= 0);

-- ─── 3. Atomic point deduction ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_points(
  p_user_id   uuid,
  p_amount    integer,
  p_txn_type  text,
  p_reference text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_new_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive' USING ERRCODE = '22023';
  END IF;
  UPDATE public.profiles
  SET    points = points - p_amount,
         updated_at = now()
  WHERE  id = p_user_id
  RETURNING points INTO v_new_balance;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;
  INSERT INTO public.point_transactions (user_id, amount, transaction_type, reference)
  VALUES (p_user_id, -p_amount, p_txn_type, p_reference);
  RETURN v_new_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.deduct_points(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.deduct_points(uuid, integer, text, text) TO service_role;

-- ─── 4. Atomic quote save + point deduction ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_quote_with_points(
  p_user_id        uuid,
  p_session_id     uuid,
  p_ref            text,
  p_client_name    text,
  p_description    text,
  p_template_style text,
  p_grand_total    numeric,
  p_data           jsonb,
  p_points_cost    integer DEFAULT 3
)
RETURNS public.quotations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_quote public.quotations; v_version integer;
BEGIN
  PERFORM public.deduct_points(p_user_id, p_points_cost, 'QUOTE_GENERATION', NULL);
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_version
  FROM   public.quotations
  WHERE  session_id = p_session_id;
  INSERT INTO public.quotations (
    user_id, session_id, version, ref, client_name, description,
    status, template_style, grand_total, data
  )
  VALUES (
    p_user_id, p_session_id, v_version, p_ref, p_client_name, p_description,
    'APPROVED', p_template_style, p_grand_total, p_data
  )
  RETURNING * INTO v_quote;
  RETURN v_quote;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_quote_with_points(uuid, uuid, text, text, text, text, numeric, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.save_quote_with_points(uuid, uuid, text, text, text, text, numeric, jsonb, integer) TO service_role;

-- ─── 5. User bootstrap (single round-trip) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_bootstrap()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid(); v_state text; v_out jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  SELECT state_operation INTO v_state FROM public.profiles WHERE id = v_uid;
  SELECT jsonb_build_object(
    'profile',     (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = v_uid),
    'preferences', (SELECT to_jsonb(up) FROM public.user_preferences up WHERE up.user_id = v_uid),
    'regional_prices', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'material_id',       rpb.material_id,
        'material_name',     rpb.material_name,
        'state',             rpb.origin_state,
        'median_price_ngn',  rpb.median_price_ngn,
        'contributor_count', rpb.contributor_count,
        'is_consensus',      rpb.is_consensus,
        'confidence',        rpb.confidence
      ))
      FROM public.regional_price_book rpb WHERE rpb.origin_state = v_state
    ), '[]'::jsonb),
    'price_log', COALESCE((
      SELECT jsonb_agg(to_jsonb(pl) ORDER BY pl.last_used_at DESC)
      FROM public.price_log pl WHERE pl.user_id = v_uid
    ), '[]'::jsonb)
  ) INTO v_out;
  RETURN v_out;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_bootstrap() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_user_bootstrap() TO authenticated, service_role;

-- ─── 6. Quote list projection (no heavy JSONB) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.get_quotation_list(
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_status text    DEFAULT NULL
)
RETURNS TABLE (
  id uuid, ref text, client_name text, description text, status text,
  template_style text, grand_total numeric, version integer,
  session_id uuid, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT q.id, q.ref, q.client_name, q.description, q.status, q.template_style,
         q.grand_total, q.version, q.session_id, q.created_at, q.updated_at
  FROM public.quotations q
  WHERE q.user_id = v_uid AND (p_status IS NULL OR q.status = p_status)
  ORDER BY q.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_quotation_list(integer, integer, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_quotation_list(integer, integer, text) TO authenticated, service_role;

-- ─── 7. Formalize chat_sessions schema drift ────────────────────────────────
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS messages          jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS active_quote      jsonb,
  ADD COLUMN IF NOT EXISTS quote_history     jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pending_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS client            text;

-- ─── 8. Auto-touch updated_at ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_chat_sessions_touch_updated ON public.chat_sessions;
CREATE TRIGGER trg_chat_sessions_touch_updated
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_touch_updated ON public.profiles;
CREATE TRIGGER trg_profiles_touch_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─── 9. Add missing materials_canonical policies ────────────────────────────
DROP POLICY IF EXISTS "Authenticated reads canonical materials" ON public.materials_canonical;
CREATE POLICY "Authenticated reads canonical materials"
  ON public.materials_canonical
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS "Service role writes canonical materials" ON public.materials_canonical;
CREATE POLICY "Service role writes canonical materials"
  ON public.materials_canonical
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
