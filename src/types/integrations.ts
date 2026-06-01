/**
 * Integration types — connection configs and sync job records.
 * Runtime logic stays in src/services/integrationService.ts;
 * only type/interface declarations live here.
 */

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
