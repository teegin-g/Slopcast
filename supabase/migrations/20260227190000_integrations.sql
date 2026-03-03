-- Integration system tables

CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('supabase', 'postgres', 'sqlserver', 'csv')),
  connection_params JSONB NOT NULL DEFAULT '{}',
  field_mappings JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'error')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES integration_configs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  error_log JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_configs_owner ON integration_configs(owner_user_id);
CREATE INDEX idx_integration_jobs_config ON integration_jobs(config_id);

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
  ON integration_configs FOR ALL
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can view their own integration jobs"
  ON integration_jobs FOR ALL
  USING (config_id IN (SELECT id FROM integration_configs WHERE owner_user_id = auth.uid()));
