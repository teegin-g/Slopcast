import { getSupabaseClient } from './supabaseClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionType = 'supabase' | 'postgres' | 'sqlserver' | 'csv';
export type IntegrationStatus = 'draft' | 'active' | 'paused' | 'error';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface IntegrationConfig {
  id: string;
  ownerUserId: string;
  name: string;
  connectionType: ConnectionType;
  connectionParams: Record<string, unknown>;
  fieldMappings: Record<string, string>;
  status: IntegrationStatus;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationJob {
  id: string;
  configId: string;
  status: JobStatus;
  recordsProcessed: number;
  recordsFailed: number;
  errorLog: unknown[] | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.');
  }
  return supabase;
}

async function requireUserId() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) {
    throw new Error('No authenticated Supabase user.');
  }
  return data.user.id;
}

function mapRow(row: any): IntegrationConfig {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    connectionType: row.connection_type as ConnectionType,
    connectionParams: (row.connection_params || {}) as Record<string, unknown>,
    fieldMappings: (row.field_mappings || {}) as Record<string, string>,
    status: row.status as IntegrationStatus,
    lastSyncAt: row.last_sync_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJobRow(row: any): IntegrationJob {
  return {
    id: row.id,
    configId: row.config_id,
    status: row.status as JobStatus,
    recordsProcessed: Number(row.records_processed),
    recordsFailed: Number(row.records_failed),
    errorLog: (row.error_log as unknown[] | null) ?? null,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Integration Config CRUD
// ---------------------------------------------------------------------------

export async function listIntegrations(): Promise<IntegrationConfig[]> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('integration_configs')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRow);
}

export async function getIntegration(id: string): Promise<IntegrationConfig | null> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapRow(data);
}

export async function createIntegration(payload: {
  name: string;
  connectionType: ConnectionType;
  connectionParams: Record<string, unknown>;
  fieldMappings?: Record<string, string>;
  status?: IntegrationStatus;
}): Promise<IntegrationConfig> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('integration_configs')
    .insert({
      name: payload.name,
      connection_type: payload.connectionType,
      connection_params: payload.connectionParams,
      field_mappings: payload.fieldMappings ?? {},
      status: payload.status ?? 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function updateIntegration(
  id: string,
  updates: Partial<{
    name: string;
    connectionType: ConnectionType;
    connectionParams: Record<string, unknown>;
    fieldMappings: Record<string, string>;
    status: IntegrationStatus;
  }>
): Promise<IntegrationConfig> {
  await requireUserId();
  const supabase = requireSupabase();

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.connectionType !== undefined) row.connection_type = updates.connectionType;
  if (updates.connectionParams !== undefined) row.connection_params = updates.connectionParams;
  if (updates.fieldMappings !== undefined) row.field_mappings = updates.fieldMappings;
  if (updates.status !== undefined) row.status = updates.status;

  const { data, error } = await supabase
    .from('integration_configs')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function deleteIntegration(id: string): Promise<void> {
  await requireUserId();
  const supabase = requireSupabase();

  const { error } = await supabase
    .from('integration_configs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Integration Jobs
// ---------------------------------------------------------------------------

export async function listJobs(configId: string): Promise<IntegrationJob[]> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('integration_jobs')
    .select('*')
    .eq('config_id', configId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapJobRow);
}

export async function createJob(configId: string): Promise<IntegrationJob> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('integration_jobs')
    .insert({
      config_id: configId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return mapJobRow(data);
}
