import type {
  ConnectionType,
  IntegrationStatus,
} from '../../types';

export function statusColor(status: IntegrationStatus, isClassic: boolean): string {
  switch (status) {
    case 'active':
      return isClassic
        ? 'bg-green-700/60 text-green-200 border border-green-600/40'
        : 'bg-green-500/10 text-green-400 border border-green-500/30';
    case 'paused':
      return isClassic
        ? 'bg-yellow-700/60 text-yellow-200 border border-yellow-600/40'
        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
    case 'error':
      return isClassic
        ? 'bg-red-700/60 text-red-200 border border-red-600/40'
        : 'bg-red-500/10 text-red-400 border border-red-500/30';
    case 'draft':
    default:
      return isClassic
        ? 'bg-black/30 text-white/60 border border-black/25'
        : 'bg-theme-surface2 text-theme-muted border border-theme-border';
  }
}

export function connectionTypeLabel(ct: ConnectionType): string {
  switch (ct) {
    case 'supabase': return 'Supabase';
    case 'postgres': return 'PostgreSQL';
    case 'sqlserver': return 'SQL Server';
    case 'csv': return 'CSV';
    default: return ct;
  }
}
