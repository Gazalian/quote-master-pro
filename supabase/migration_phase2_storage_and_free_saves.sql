-- ============================================================================
-- PHASE 2 — Chat image storage + free quote saves
-- ----------------------------------------------------------------------------
-- Applied to project lczgjuaokmzgynrczziy. Safe to re-run.
-- ============================================================================

-- ─── 1. chat-images bucket (public read, owner-scoped write) ───────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5 MB per file
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Path convention: <user_id>/<session_id>/<random-uuid>.<ext>
DROP POLICY IF EXISTS "Chat images: user inserts own folder" ON storage.objects;
CREATE POLICY "Chat images: user inserts own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Chat images: user updates own files" ON storage.objects;
CREATE POLICY "Chat images: user updates own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Chat images: user deletes own files" ON storage.objects;
CREATE POLICY "Chat images: user deletes own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Chat images: public read" ON storage.objects;
CREATE POLICY "Chat images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

-- ─── 2. Free save mode: save_quote_with_points defaults cost to 0 ──────────
CREATE OR REPLACE FUNCTION public.save_quote_with_points(
  p_user_id        uuid,
  p_session_id     uuid,
  p_ref            text,
  p_client_name    text,
  p_description    text,
  p_template_style text,
  p_grand_total    numeric,
  p_data           jsonb,
  p_points_cost    integer DEFAULT 0
)
RETURNS public.quotations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_quote public.quotations; v_version integer;
BEGIN
  IF p_points_cost > 0 THEN
    PERFORM public.deduct_points(p_user_id, p_points_cost, 'QUOTE_GENERATION', NULL);
  END IF;

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
