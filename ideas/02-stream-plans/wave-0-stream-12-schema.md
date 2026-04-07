# Stream 12: Persistence Layer — Schema Design (Wave 0 partial)

**Wave:** 0 (Foundation) — schema design only; full implementation in Wave 3
**Agent:** `schema-agent`
**Estimated effort:** ~1.5 hours
**Dependencies:** None (references Stream 1 types for field alignment)

---

## Objective

Design and write the Supabase migration SQL file for all new tables and columns needed by PDP/Undev split, Wine Rack assumption builder, and scenario enhancements. Do NOT apply the migration — just write and validate the SQL.

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/20260406000000_pdp_undev_wine_rack.sql` | Create new migration |

## Pre-Work

1. Read the latest migration: `supabase/migrations/20260313120000_database_architecture_v2.sql`
2. Document existing table structure: `projects`, `project_groups`, `project_scenarios`, `group_well_memberships`, `wells`, `acreage_assets`
3. Cross-reference with Stream 1 types to ensure schema matches TypeScript interfaces

## Migration SQL

```sql
-- Migration: PDP/Undev Workflow Split + Wine Rack Assumption Builder
-- Depends on: 20260313120000_database_architecture_v2

-- ============================================================
-- 1. Extend projects table with acreage filter
-- ============================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS acreage_filter_jsonb jsonb NOT NULL DEFAULT '{}';

COMMENT ON COLUMN projects.acreage_filter_jsonb IS
  'Upstream universe filter: operators, formations, basins, vintage range, spatial bounds';

-- ============================================================
-- 2. Add track discriminator to project_groups
-- ============================================================
ALTER TABLE project_groups
  ADD COLUMN IF NOT EXISTS track text CHECK (track IN ('PDP', 'UNDEV'));

-- PDP-specific extensions
ALTER TABLE project_groups
  ADD COLUMN IF NOT EXISTS forecast_assignments_jsonb jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS economic_limit_jsonb jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS workover_assumptions_jsonb jsonb DEFAULT NULL;

-- Undev-specific extensions
ALTER TABLE project_groups
  ADD COLUMN IF NOT EXISTS spacing_template_jsonb jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS degradation_params_jsonb jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lateral_length_scaling text
    CHECK (lateral_length_scaling IN ('linear', 'sub_linear', 'capped'));

COMMENT ON COLUMN project_groups.track IS 'PDP or UNDEV track classification';

-- ============================================================
-- 3. DSU definitions table
-- ============================================================
CREATE TABLE IF NOT EXISTS dsu_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_group_id uuid NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  -- PostGIS polygon if available, else JSONB coordinates
  geometry_jsonb jsonb NOT NULL DEFAULT '{}',
  benches_jsonb jsonb NOT NULL DEFAULT '[]',
  -- [{ bench, wellCount, spacingFt, lateralLengthFt }]
  computed_lateral_length_ft numeric,
  parent_child_flags jsonb DEFAULT NULL,
  -- ['parent', 'child', 'co_dev']
  schedule_priority integer DEFAULT 0,
  metadata_jsonb jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dsu_definitions_group
  ON dsu_definitions(project_group_id);

COMMENT ON TABLE dsu_definitions IS 'Drill Spacing Unit definitions for Undev programs';

-- ============================================================
-- 4. Type curve assignments (DSU+bench -> TC library entry)
-- ============================================================
CREATE TABLE IF NOT EXISTS type_curve_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_group_id uuid NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  dsu_id uuid REFERENCES dsu_definitions(id) ON DELETE CASCADE,
  bench text NOT NULL DEFAULT '',
  assumption_id uuid REFERENCES assumption_library(id) ON DELETE SET NULL,
  -- Inline params if not from library
  inline_params_jsonb jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Assumption library (AnalogBackedAssumption)
-- ============================================================
CREATE TABLE IF NOT EXISTS assumption_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('type_curve', 'loe', 'spacing_degradation')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_refit_at timestamptz NOT NULL DEFAULT now(),

  -- The actual parameters
  parameters_jsonb jsonb NOT NULL DEFAULT '{}',

  -- Provenance
  analog_well_ids jsonb NOT NULL DEFAULT '[]',
  analog_filter_snapshot_jsonb jsonb NOT NULL DEFAULT '{}',

  -- Quality
  fit_metadata_jsonb jsonb NOT NULL DEFAULT '{}',
  coherence_score_jsonb jsonb DEFAULT NULL,

  -- Staleness
  data_through_date date,
  notes text NOT NULL DEFAULT '',

  -- Library organization
  tags jsonb NOT NULL DEFAULT '[]',
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  -- NULL project_id = global library entry
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,

  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assumption_library_type
  ON assumption_library(type);
CREATE INDEX IF NOT EXISTS idx_assumption_library_project
  ON assumption_library(project_id);
CREATE INDEX IF NOT EXISTS idx_assumption_library_staleness
  ON assumption_library(data_through_date);

COMMENT ON TABLE assumption_library IS
  'Provenance-backed assumptions with analog well IDs, fit metadata, and staleness tracking';

-- ============================================================
-- 6. Extend project_scenarios for per-track variable splitting
-- ============================================================
-- The scalar_jsonb column already exists; we just need to document
-- the new shape. No schema change needed — JSONB is flexible.
-- New shape:
-- {
--   "capexScalar":      { "global": 1.0, "splitByTrack": false },
--   "productionScalar": { "global": 1.0, "splitByTrack": true, "pdpOverride": 0.95, "undevOverride": 1.1 },
--   "discountRate":     { "global": 10, "splitByTrack": false },
--   "loeEscalation":    { "global": 2, "splitByTrack": false },
--   "inflation":        { "global": 3, "splitByTrack": false }
-- }

-- Add price deck support
ALTER TABLE project_scenarios
  ADD COLUMN IF NOT EXISTS price_deck_type text
    CHECK (price_deck_type IN ('strip', 'flat', 'custom'))
    DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS strip_prices_jsonb jsonb DEFAULT NULL;

-- ============================================================
-- 7. Forecast assignments table (PDP per-well forecast sources)
-- ============================================================
CREATE TABLE IF NOT EXISTS forecast_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_group_id uuid NOT NULL REFERENCES project_groups(id) ON DELETE CASCADE,
  well_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('enverus', 'novi', 'sp', 'in_house', 'user_upload')),
  source_date date,
  adjustment_pct numeric DEFAULT 0,
  rate_floor_boepd numeric DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_group_id, well_id)
);

CREATE INDEX IF NOT EXISTS idx_forecast_assignments_group
  ON forecast_assignments(project_group_id);

-- ============================================================
-- 8. Stage completion tracking
-- ============================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS stage_completion_jsonb jsonb NOT NULL DEFAULT '[]';

-- Shape: [{ stage: 'ACREAGE_FILTER', status: 'complete' }, ...]

-- ============================================================
-- 9. Updated timestamps trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to new tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'dsu_definitions',
    'assumption_library',
    'forecast_assignments'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 10. RLS policies for new tables
-- ============================================================
ALTER TABLE dsu_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assumption_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE type_curve_assignments ENABLE ROW LEVEL SECURITY;

-- Policies follow the same pattern as existing project_groups policies:
-- Users can access rows linked to projects they own or are members of.
-- (Specific policy definitions depend on existing RLS patterns in v2 migration)
```

## Verification

1. SQL syntax check: `psql --echo-errors -f <migration_file>` on a test database (or use a SQL linter)
2. Cross-reference every new column/table with Stream 1 types to confirm field alignment
3. Verify all foreign key references point to existing tables
4. Verify CHECK constraints match TypeScript union types
5. Ensure the migration is idempotent (`IF NOT EXISTS` everywhere)

## Acceptance Criteria

- [ ] Migration file is syntactically valid SQL
- [ ] `projects.acreage_filter_jsonb` column added
- [ ] `project_groups.track` column with CHECK constraint added
- [ ] `dsu_definitions` table created with geometry, benches, spacing
- [ ] `assumption_library` table created with full provenance schema
- [ ] `type_curve_assignments` table created
- [ ] `forecast_assignments` table created with unique constraint
- [ ] `project_scenarios` extended with price deck columns
- [ ] `projects.stage_completion_jsonb` column added
- [ ] All FK references are valid
- [ ] RLS enabled on new tables
- [ ] Updated_at triggers applied
- [ ] All field names align with Stream 1 TypeScript types (snake_case ↔ camelCase)
