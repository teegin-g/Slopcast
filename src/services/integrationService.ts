import { unwrapJsonbContract } from './projectContracts';
import { requireSupabase, requireUserId } from './supabaseGuards';

// Types have moved to src/types/integrations.ts — re-export for backwards compat.
export type {
  ConnectionType,
  IntegrationStatus,
  JobStatus,
  IntegrationConfig,
  IntegrationJob,
} from '../types/integrations';

import type {
  ConnectionType,
  IntegrationStatus,
  IntegrationConfig,
  IntegrationJob,
  JobStatus,
} from '../types/integrations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRow(row: any): IntegrationConfig {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    connectionType: row.connection_type as ConnectionType,
    connectionParams: unwrapJsonbContract<Record<string, unknown>>(row.config_jsonb, null),
    fieldMappings: unwrapJsonbContract<Record<string, string>>(row.field_mappings_jsonb, null),
    status: row.status as IntegrationStatus,
    lastSyncAt: row.last_sync_at ?? row.completed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJobRow(row: any): IntegrationJob {
  const rowCounts = unwrapJsonbContract<Record<string, unknown>>(row.row_counts_jsonb, null);
  return {
    id: row.id,
    configId: row.source_connection_id,
    status: row.status as JobStatus,
    recordsProcessed: Number(rowCounts.recordsProcessed ?? 0),
    recordsFailed: Number(rowCounts.recordsFailed ?? 0),
    errorLog: null,
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
    .from('source_connections')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRow);
}

async function getIntegration(id: string): Promise<IntegrationConfig | null> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('source_connections')
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
  const supabase = requireSupabase();
  const userId = await requireUserId();
  const { data: organizationId, error: orgError } = await supabase.rpc('ensure_personal_organization', {
    p_user_id: userId,
  });
  if (orgError) throw orgError;

  const { data, error } = await supabase
    .from('source_connections')
    .insert({
      organization_id: organizationId,
      owner_user_id: userId,
      name: payload.name,
      connection_type: payload.connectionType,
      config_jsonb: payload.connectionParams,
      field_mappings_jsonb: payload.fieldMappings ?? {},
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
  if (updates.connectionParams !== undefined) row.config_jsonb = updates.connectionParams;
  if (updates.fieldMappings !== undefined) row.field_mappings_jsonb = updates.fieldMappings;
  if (updates.status !== undefined) row.status = updates.status;

  const { data, error } = await supabase
    .from('source_connections')
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
    .from('source_connections')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Integration Jobs
// ---------------------------------------------------------------------------

async function listJobs(configId: string): Promise<IntegrationJob[]> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('sync_runs')
    .select('*')
    .eq('source_connection_id', configId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapJobRow);
}

async function createJob(configId: string): Promise<IntegrationJob> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('sync_runs')
    .insert({
      source_connection_id: configId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return mapJobRow(data);
}
