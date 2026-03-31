-- ═══════════════════════════════════════════════════════════════════════════
-- USER BEHAVIOR ADAPTATION ENGINE — Database Schema
-- Stores learned preferences extracted by comparing AI drafts vs final saves
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. USER PREFERENCES TABLE ────────────────────────────────────────────
-- One row per user. Each column holds a JSON blob of learned rules.
-- Re-analyzed and updated every time a quote is saved after editing.
CREATE TABLE IF NOT EXISTS user_preferences (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- { "tiles": 1.15, "cement": 1.10 }
  -- Multiplier > 1 means user consistently adds wastage for that category
  wastage_rules       jsonb       NOT NULL DEFAULT '{}',

  -- ["Materials", "Labour", "Transportation", "Miscellaneous"]
  -- Most recently confirmed group ordering preference
  document_flow       jsonb       NOT NULL DEFAULT '[]',

  -- ["Site Cleanup Fee", "Scaffolding", "Mobilisation Fee"]
  -- Items the AI suggests that this user consistently removes
  negative_preferences jsonb      NOT NULL DEFAULT '[]',

  -- { "cement": "Dangote", "wire": "Nigerchin", "paint": "Dulux" }
  -- Category → preferred Nigerian brand substitution
  brand_loyalty       jsonb       NOT NULL DEFAULT '{}',

  -- Rolling window of the last 30 raw deltas (draft vs final JSON diff)
  -- Re-analysed on every update to extract fresh rules
  raw_deltas          jsonb       NOT NULL DEFAULT '[]',

  -- Quick summary for debugging / transparency
  summary_text        text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── 2. ROW-LEVEL SECURITY ─────────────────────────────────────────────────
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ── 3. AUTO-UPDATE updated_at ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_timestamp();

-- ── 4. INDEX ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
