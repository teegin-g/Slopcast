import React from 'react';
import type { IntegrationConfig } from '../../services/integrationService';
import { formatDateTime } from '../../utils/formatters';
import { statusColor, connectionTypeLabel } from '../../pages/integrations/integrationFormatting';

interface IntegrationsTableProps {
  integrations: IntegrationConfig[];
  loading: boolean;
  isClassic: boolean;
  onEdit: (config: IntegrationConfig) => void;
  onDelete: (id: string) => void;
}

const IntegrationsTable: React.FC<IntegrationsTableProps> = ({
  integrations,
  loading,
  isClassic,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className={`text-center py-8 ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>
        <p className="text-[11px] uppercase tracking-[0.14em] font-black">Loading…</p>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className={`text-center py-8 ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>
        <p className="text-[11px] uppercase tracking-[0.14em] font-black">No integrations configured</p>
        <p className="text-[10px] mt-1">Click "New Integration" to connect an external data source.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${isClassic ? 'border-black/25' : 'border-theme-border'}`}>
            {['Name', 'Type', 'Status', 'Last Sync', 'Actions'].map(header => (
              <th
                key={header}
                className={`text-left px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] ${
                  isClassic ? 'text-white/50' : 'text-theme-muted'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {integrations.map(config => (
            <tr
              key={config.id}
              className={`border-b ${isClassic ? 'border-black/15 hover:bg-black/10' : 'border-theme-border/50 hover:bg-theme-bg/50'}`}
            >
              <td className={`p-3 text-[11px] ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                {config.name}
              </td>
              <td className={`p-3 text-[11px] ${isClassic ? 'text-white/80' : 'text-theme-muted'}`}>
                {connectionTypeLabel(config.connectionType)}
              </td>
              <td className="p-3">
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.14em] ${statusColor(config.status, isClassic)}`}>
                  {config.status}
                </span>
              </td>
              <td className={`p-3 text-[10px] ${isClassic ? 'text-white/60' : 'text-theme-muted'}`}>
                {formatDateTime(config.lastSyncAt, 'Never')}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(config)}
                    className={`text-[9px] font-black uppercase tracking-[0.14em] px-2 py-1 rounded ${
                      isClassic
                        ? 'text-theme-cyan hover:text-white'
                        : 'text-theme-cyan hover:text-theme-text'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(config.id)}
                    className={`text-[9px] font-black uppercase tracking-[0.14em] px-2 py-1 rounded ${
                      isClassic
                        ? 'text-red-400 hover:text-red-200'
                        : 'text-red-400 hover:text-red-300'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IntegrationsTable;
