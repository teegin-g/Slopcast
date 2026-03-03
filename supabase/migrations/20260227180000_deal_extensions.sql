-- Phase 1A: Extended Deal Model

-- Differential pricing profiles per group/well
CREATE TABLE IF NOT EXISTS deal_differential_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  group_id UUID REFERENCES deal_well_groups(id) ON DELETE SET NULL,
  well_id UUID REFERENCES deal_wells(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Default Differentials',
  oil_differential NUMERIC NOT NULL DEFAULT 0,
  gas_differential NUMERIC NOT NULL DEFAULT 0,
  ngl_differential NUMERIC NOT NULL DEFAULT 0,
  oil_gathering NUMERIC NOT NULL DEFAULT 0,
  gas_gathering NUMERIC NOT NULL DEFAULT 0,
  oil_transport NUMERIC NOT NULL DEFAULT 0,
  gas_transport NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diff_profiles_deal ON deal_differential_profiles(deal_id);
CREATE INDEX idx_diff_profiles_group ON deal_differential_profiles(group_id);

-- Type curve preset storage
CREATE TABLE IF NOT EXISTS deal_type_curve_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  profile_type TEXT NOT NULL DEFAULT 'type_curve' CHECK (profile_type IN ('type_curve', 'capex', 'opex', 'ownership', 'pricing', 'composite')),
  parent_preset_id UUID REFERENCES deal_type_curve_presets(id) ON DELETE SET NULL,
  basin TEXT,
  formation TEXT,
  operator TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_presets_owner ON deal_type_curve_presets(owner_user_id);
CREATE INDEX idx_presets_type ON deal_type_curve_presets(profile_type);
CREATE INDEX idx_presets_basin ON deal_type_curve_presets(basin);

-- Extend deals table with new columns
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_query TEXT,
  ADD COLUMN IF NOT EXISTS acreage_geojson JSONB;

-- Slopcast Well ID generation function
CREATE OR REPLACE FUNCTION generate_slopcast_well_id(
  p_well_type TEXT,
  p_formation TEXT,
  p_operator TEXT
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
  v_date TEXT;
  v_formation_code TEXT;
  v_operator_code TEXT;
  v_seq TEXT;
BEGIN
  -- Well type prefix: D=developed, U=undeveloped
  v_prefix := CASE WHEN p_well_type = 'developed' THEN 'D' ELSE 'U' END;
  
  -- Date component: YYMMDD
  v_date := to_char(now(), 'YYMMDD');
  
  -- Formation code: first 3 chars uppercase
  v_formation_code := upper(left(regexp_replace(COALESCE(p_formation, 'UNK'), '[^a-zA-Z]', '', 'g'), 3));
  IF length(v_formation_code) < 3 THEN
    v_formation_code := rpad(v_formation_code, 3, 'X');
  END IF;
  
  -- Operator code: first 3 chars uppercase
  v_operator_code := upper(left(regexp_replace(COALESCE(p_operator, 'UNK'), '[^a-zA-Z]', '', 'g'), 3));
  IF length(v_operator_code) < 3 THEN
    v_operator_code := rpad(v_operator_code, 3, 'X');
  END IF;
  
  -- Random sequence suffix
  v_seq := lpad(floor(random() * 10000)::text, 4, '0');
  
  RETURN v_prefix || '-' || v_date || '-' || v_formation_code || '-' || v_operator_code || '-' || v_seq;
END;
$$;

-- RLS policies for new tables
ALTER TABLE deal_differential_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_type_curve_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their deal differential profiles"
  ON deal_differential_profiles FOR ALL
  USING (deal_id IN (SELECT id FROM deals WHERE owner_user_id = auth.uid()));

CREATE POLICY "Users can manage their own presets"
  ON deal_type_curve_presets FOR ALL
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can view template presets"
  ON deal_type_curve_presets FOR SELECT
  USING (is_template = true);
