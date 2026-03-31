-- =======================================================================
-- REGIONAL CONSENSUS ENGINE MIGRATION
-- Run this ENTIRE file in Supabase SQL Editor
-- =======================================================================

-- ── 1. CANONICAL MATERIALS LOOKUP ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.materials_canonical (
  id                        TEXT PRIMARY KEY,           -- e.g. 'mat_cement_50kg'
  canonical_name            TEXT NOT NULL,              -- display name
  trade_category            TEXT NOT NULL,              -- Building / Electrical / Plumbing / Painting / Carpentry
  default_unit              TEXT DEFAULT 'unit',
  national_baseline_ngn     NUMERIC,                    -- used for outlier detection
  aliases                   TEXT[] DEFAULT '{}',        -- alternative names a user might type
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with common Nigerian trade materials
INSERT INTO public.materials_canonical (id, canonical_name, trade_category, default_unit, national_baseline_ngn, aliases) VALUES
  -- Building
  ('mat_cement_50kg',     '50kg Portland Cement',        'Building',    'bag',    7000,  ARRAY['Dangote Cement','BUA Cement','Elephant Cement','42.5R Cement','cement']),
  ('mat_sand_sharp',      'Sharp Sand',                  'Building',    'trip',   35000, ARRAY['sharp sand','plaster sand']),
  ('mat_sand_soft',       'Soft Sand',                   'Building',    'trip',   28000, ARRAY['soft sand','filling sand']),
  ('mat_granite',         'Granite (20mm)',               'Building',    'trip',   50000, ARRAY['granite','chippings','coarse aggregate']),
  ('mat_block_9inch',     '9-Inch Sandcrete Block',      'Building',    'piece',  550,   ARRAY['9 inch block','9-inch block','block','sandcrete block']),
  ('mat_block_6inch',     '6-Inch Sandcrete Block',      'Building',    'piece',  420,   ARRAY['6 inch block','6-inch block']),
  ('mat_iron_rod_12mm',   '12mm Iron Rod (High Yield)',  'Building',    'length', 3800,  ARRAY['12mm iron rod','Y12 rod','12mm rod','reinforcement bar']),
  ('mat_iron_rod_16mm',   '16mm Iron Rod (High Yield)',  'Building',    'length', 6500,  ARRAY['16mm iron rod','Y16 rod','16mm rod']),
  ('mat_roofing_sheet',   'Long Span Roofing Sheet',     'Building',    'piece',  8500,  ARRAY['long span roof','aluminum roofing','roofing sheet']),
  ('mat_plywood_18mm',    '18mm Marine Plywood',         'Building',    'sheet',  22000, ARRAY['marine board','18mm plywood','plywood']),
  -- Electrical
  ('mat_cable_2.5mm',     '2.5mm Twin & Earth Cable',    'Electrical',  'roll',   32000, ARRAY['2.5mm cable','twin and earth 2.5','T&E 2.5mm']),
  ('mat_cable_4mm',       '4mm Twin & Earth Cable',      'Electrical',  'roll',   48000, ARRAY['4mm cable','twin and earth 4mm','T&E 4mm']),
  ('mat_cable_16mm',      '16mm Single Core Cable',      'Electrical',  'roll',   22000, ARRAY['16mm cable','single core 16mm']),
  ('mat_socket_13a',      '13A Single Socket Outlet',    'Electrical',  'piece',  900,   ARRAY['socket','13A socket','single socket','wall socket']),
  ('mat_socket_13a_dbl',  '13A Double Socket Outlet',    'Electrical',  'piece',  1500,  ARRAY['double socket','twin socket','13A double']),
  ('mat_mcb_single',      'Single Pole MCB (20A)',        'Electrical',  'piece',  2500,  ARRAY['MCB','circuit breaker','20A breaker','mini circuit breaker']),
  ('mat_db_12way',        '12-Way Distribution Board',   'Electrical',  'piece',  28000, ARRAY['consumer unit','distribution board','DB board','12-way panel']),
  ('mat_conduit_20mm',    '20mm PVC Conduit Pipe',       'Electrical',  'length', 850,   ARRAY['conduit','20mm conduit','PVC conduit']),
  -- Plumbing
  ('mat_pipe_pvc_4inch',  '4-Inch PVC Pipe (6m)',        'Plumbing',    'length', 5500,  ARRAY['4 inch pipe','4" PVC pipe','drainage pipe']),
  ('mat_pipe_pvc_1inch',  '1-Inch PPR Pipe (6m)',        'Plumbing',    'length', 2800,  ARRAY['1 inch pipe','PPR pipe','water supply pipe']),
  ('mat_toilet_wc',       'WC Toilet (Standard)',        'Plumbing',    'set',    55000, ARRAY['toilet','water closet','WC','toilet set']),
  ('mat_sink_kitchen',    'Kitchen Sink (Stainless)',    'Plumbing',    'piece',  28000, ARRAY['kitchen sink','sink','stainless sink']),
  ('mat_water_pump',      'Water Pump (0.5HP)',           'Plumbing',    'piece',  38000, ARRAY['water pump','submersible pump','0.5hp pump']),
  -- Painting
  ('mat_paint_emulsion',  'Emulsion Paint (20 Litres)',  'Painting',    'bucket', 22000, ARRAY['emulsion paint','wall paint','interior paint','Dulux emulsion','Crown emulsion']),
  ('mat_paint_gloss',     'Gloss Paint (4 Litres)',      'Painting',    'tin',    14000, ARRAY['gloss paint','oil paint','exterior paint','gloss']),
  ('mat_paint_putty',     'Wall Putty (20kg)',           'Painting',    'bag',    7500,  ARRAY['putty','wall putty','skim coat']),
  ('mat_paint_primer',    'Primer (5 Litres)',           'Painting',    'tin',    9000,  ARRAY['primer','undercoat','sealer']),
  -- Carpentry / Finishing
  ('mat_door_handle',     'Door Handle Set (Mortice)',   'Carpentry',   'set',    4500,  ARRAY['door handle','mortice lock','door lock']),
  ('mat_ceiling_pvc',     'PVC Ceiling Board (2-panel)', 'Carpentry',   'piece',  2200,  ARRAY['PVC ceiling','ceiling board','ceiling panel']),
  ('mat_tiles_floor',     'Floor Tiles (60x60cm)',       'Carpentry',   'sqm',    6500,  ARRAY['floor tiles','porcelain tiles','ceramic floor tiles','tiles'])
ON CONFLICT (id) DO NOTHING;

-- ── 2. PRICE OBSERVATIONS TABLE ─────────────────────────────────────────
-- Every time a user saves a price we record an anonymised observation
CREATE TABLE IF NOT EXISTS public.price_observations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id         TEXT REFERENCES public.materials_canonical(id),
  material_name_raw   TEXT NOT NULL,
  unit_price_ngn      NUMERIC NOT NULL CHECK (unit_price_ngn > 0),
  unit                TEXT NOT NULL,
  origin_state        TEXT NOT NULL,
  source_type         TEXT DEFAULT 'price_log'  CHECK (source_type IN ('price_log','quote_override')),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  observed_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obs_material_state ON public.price_observations(material_id, origin_state);
CREATE INDEX IF NOT EXISTS idx_obs_observed_at    ON public.price_observations(observed_at);
CREATE INDEX IF NOT EXISTS idx_obs_user_id        ON public.price_observations(user_id);

-- RLS: users cannot read each other's raw observations (privacy)
ALTER TABLE public.price_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own observations" ON public.price_observations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own observations" ON public.price_observations
  FOR SELECT USING (auth.uid() = user_id);

-- ── 3. REGIONAL PRICE BOOK ───────────────────────────────────────────────
-- Read-only computed result — populated by Edge Function every 24h
CREATE TABLE IF NOT EXISTS public.regional_price_book (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id           TEXT REFERENCES public.materials_canonical(id),
  material_name         TEXT NOT NULL,
  origin_state          TEXT NOT NULL,
  median_price_ngn      NUMERIC NOT NULL CHECK (median_price_ngn > 0),
  contributor_count     INTEGER NOT NULL DEFAULT 0,
  variance_pct          NUMERIC DEFAULT 0,
  is_consensus          BOOLEAN DEFAULT FALSE,   -- TRUE when 5+ users within 7.5% variance
  confidence            TEXT DEFAULT 'low' CHECK (confidence IN ('high','medium','low')),
  last_calculated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_id, origin_state)
);

CREATE INDEX IF NOT EXISTS idx_rpb_state         ON public.regional_price_book(origin_state);
CREATE INDEX IF NOT EXISTS idx_rpb_material_state ON public.regional_price_book(material_id, origin_state);

-- All authenticated users can read the regional price book (aggregated, no user IDs)
ALTER TABLE public.regional_price_book ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users read regional price book" ON public.regional_price_book
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service role can write (edge function uses service role)
CREATE POLICY "Service role manages regional price book" ON public.regional_price_book
  FOR ALL USING (auth.role() = 'service_role');

-- ── 4. PRICE FLAG REVIEW ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_flag_review (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id       TEXT REFERENCES public.materials_canonical(id),
  origin_state      TEXT NOT NULL,
  flagged_price     NUMERIC NOT NULL,
  national_baseline NUMERIC NOT NULL,
  deviation_pct     NUMERIC NOT NULL,
  flagged_at        TIMESTAMPTZ DEFAULT NOW(),
  reviewed          BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.price_flag_review ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages flags" ON public.price_flag_review
  FOR ALL USING (auth.role() = 'service_role');

-- ── 5. ADD origin_state TO price_log ────────────────────────────────────
ALTER TABLE public.price_log
  ADD COLUMN IF NOT EXISTS origin_state TEXT;

-- Trigger: auto-populate origin_state from user profile on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.populate_price_log_state()
RETURNS TRIGGER AS $$
DECLARE v_state TEXT;
BEGIN
  SELECT state_operation INTO v_state
  FROM public.profiles WHERE id = NEW.user_id;
  NEW.origin_state := v_state;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_populate_price_log_state ON public.price_log;
CREATE TRIGGER trg_populate_price_log_state
  BEFORE INSERT OR UPDATE ON public.price_log
  FOR EACH ROW EXECUTE FUNCTION public.populate_price_log_state();

-- Trigger: capture a price observation whenever a price_log row is saved
CREATE OR REPLACE FUNCTION public.capture_price_observation()
RETURNS TRIGGER AS $$
DECLARE
  v_material_id TEXT;
  v_state       TEXT;
BEGIN
  v_state := NEW.origin_state;
  IF v_state IS NULL OR v_state = '' THEN RETURN NEW; END IF;
  IF NEW.price IS NULL OR NEW.price <= 0 THEN RETURN NEW; END IF;

  -- Match canonical material via alias array (case-insensitive)
  SELECT id INTO v_material_id
  FROM public.materials_canonical
  WHERE NEW.item_name ILIKE ANY(
    SELECT unnest(aliases) -- compare each alias
  )
  OR lower(canonical_name) = lower(NEW.item_name)
  LIMIT 1;

  IF v_material_id IS NOT NULL THEN
    INSERT INTO public.price_observations
      (material_id, material_name_raw, unit_price_ngn, unit, origin_state, user_id, source_type)
    VALUES
      (v_material_id, NEW.item_name, NEW.price, NEW.unit, v_state, NEW.user_id, 'price_log')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_capture_price_observation ON public.price_log;
CREATE TRIGGER trg_capture_price_observation
  AFTER INSERT OR UPDATE ON public.price_log
  FOR EACH ROW EXECUTE FUNCTION public.capture_price_observation();

-- ── 6. BACKFILL origin_state FOR EXISTING price_log ROWS ─────────────────
UPDATE public.price_log pl
SET origin_state = pr.state_operation
FROM public.profiles pr
WHERE pl.user_id = pr.id
  AND pl.origin_state IS NULL;

-- ── 7. HELPER: get_regional_prices_for_state ────────────────────────────
-- Called by the client to fetch all consensus prices for a state
CREATE OR REPLACE FUNCTION public.get_regional_prices_for_state(p_state TEXT)
RETURNS TABLE (
  material_id       TEXT,
  material_name     TEXT,
  state             TEXT,
  median_price_ngn  NUMERIC,
  contributor_count INTEGER,
  is_consensus      BOOLEAN,
  confidence        TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rpb.material_id,
    rpb.material_name,
    rpb.origin_state,
    rpb.median_price_ngn,
    rpb.contributor_count,
    rpb.is_consensus,
    rpb.confidence
  FROM public.regional_price_book rpb
  WHERE rpb.origin_state = p_state
  ORDER BY rpb.material_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. VERIFICATION ──────────────────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'price_observations'
ORDER BY ordinal_position;
