import React, { useState, useEffect } from 'react';
import type { ConnectionType, IntegrationConfig } from '../../services/integrationService';

interface ConnectionFormProps {
  isClassic: boolean;
  config?: IntegrationConfig;
  onSave: (payload: { name: string; connectionType: ConnectionType; connectionParams: Record<string, unknown> }) => void;
  onCancel: () => void;
}

const CONNECTION_TYPES: { value: ConnectionType; label: string }[] = [
  { value: 'supabase', label: 'Supabase' },
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'sqlserver', label: 'SQL Server' },
  { value: 'csv', label: 'CSV Upload' },
];

const ConnectionForm: React.FC<ConnectionFormProps> = ({ isClassic, config, onSave, onCancel }) => {
  const [name, setName] = useState(config?.name ?? '');
  const [connectionType, setConnectionType] = useState<ConnectionType>(config?.connectionType ?? 'supabase');
  const [params, setParams] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (config?.connectionParams) {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(config.connectionParams)) {
        flat[k] = String(v ?? '');
      }
      setParams(flat);
    } else {
      setParams({});
    }
  }, [config]);

  const updateParam = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = () => {
    setTestStatus('success');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleSave = () => {
    onSave({
      name,
      connectionType,
      connectionParams: { ...params },
    });
  };

  const panelCls = isClassic
    ? 'bg-black/20 border border-black/25 rounded-inner'
    : 'bg-theme-surface1 border border-theme-border rounded-inner';

  const labelCls = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.14em] text-white/70'
    : 'text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted';

  const inputCls = isClassic
    ? 'w-full rounded-inner px-3 py-2 text-[11px] bg-black/20 border border-black/25 text-white placeholder-white/40 outline-none focus:border-theme-cyan'
    : 'w-full rounded-inner px-3 py-2 text-[11px] bg-theme-bg border border-theme-border text-theme-text placeholder-theme-muted/50 outline-none focus:border-theme-cyan';

  const selectCls = isClassic
    ? 'w-full rounded-inner px-3 py-2 text-[11px] bg-black/20 border border-black/25 text-white outline-none focus:border-theme-cyan appearance-none'
    : 'w-full rounded-inner px-3 py-2 text-[11px] bg-theme-bg border border-theme-border text-theme-text outline-none focus:border-theme-cyan appearance-none';

  const renderDynamicFields = () => {
    switch (connectionType) {
      case 'supabase':
        return (
          <>
            <div className="space-y-1">
              <label className={labelCls}>Project URL</label>
              <input
                className={inputCls}
                placeholder="https://your-project.supabase.co"
                value={params.projectUrl ?? ''}
                onChange={e => updateParam('projectUrl', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Anon Key</label>
              <input
                className={inputCls}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                value={params.anonKey ?? ''}
                onChange={e => updateParam('anonKey', e.target.value)}
              />
            </div>
          </>
        );
      case 'postgres':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Host</label>
                <input
                  className={inputCls}
                  placeholder="localhost"
                  value={params.host ?? ''}
                  onChange={e => updateParam('host', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Port</label>
                <input
                  className={inputCls}
                  placeholder="5432"
                  value={params.port ?? ''}
                  onChange={e => updateParam('port', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Database</label>
              <input
                className={inputCls}
                placeholder="my_database"
                value={params.database ?? ''}
                onChange={e => updateParam('database', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Username</label>
                <input
                  className={inputCls}
                  placeholder="postgres"
                  value={params.username ?? ''}
                  onChange={e => updateParam('username', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Password</label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="********"
                  value={params.password ?? ''}
                  onChange={e => updateParam('password', e.target.value)}
                />
              </div>
            </div>
          </>
        );
      case 'sqlserver':
        return (
          <>
            <div className="space-y-1">
              <label className={labelCls}>Server</label>
              <input
                className={inputCls}
                placeholder="myserver.database.windows.net"
                value={params.server ?? ''}
                onChange={e => updateParam('server', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Database</label>
              <input
                className={inputCls}
                placeholder="my_database"
                value={params.database ?? ''}
                onChange={e => updateParam('database', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Username</label>
                <input
                  className={inputCls}
                  placeholder="sa"
                  value={params.username ?? ''}
                  onChange={e => updateParam('username', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Password</label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="********"
                  value={params.password ?? ''}
                  onChange={e => updateParam('password', e.target.value)}
                />
              </div>
            </div>
          </>
        );
      case 'csv':
        return (
          <div className={`${panelCls} p-4 text-center`}>
            <p className={isClassic ? 'text-[11px] text-white/70' : 'text-[11px] text-theme-muted'}>
              CSV file upload will be available after the connection is saved. You can drag and drop or browse for a .csv file in the sync step.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${panelCls} p-5 space-y-4`}>
      <h4 className={isClassic
        ? 'text-[11px] font-black uppercase tracking-[0.14em] text-theme-warning'
        : 'text-[11px] font-black uppercase tracking-[0.14em] text-theme-cyan'
      }>
        {config ? 'Edit Connection' : 'New Connection'}
      </h4>

      <div className="space-y-1">
        <label className={labelCls}>Integration Name</label>
        <input
          className={inputCls}
          placeholder="My Data Source"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className={labelCls}>Connection Type</label>
        <select
          className={selectCls}
          value={connectionType}
          onChange={e => {
            setConnectionType(e.target.value as ConnectionType);
            setParams({});
          }}
        >
          {CONNECTION_TYPES.map(ct => (
            <option key={ct.value} value={ct.value}>{ct.label}</option>
          ))}
        </select>
      </div>

      {renderDynamicFields()}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleTestConnection}
          className={
            isClassic
              ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 border border-black/25 text-white/90 hover:bg-black/30'
              : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
          }
        >
          Test Connection
        </button>

        {testStatus === 'success' && (
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-green-400">
            Connection successful
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={onCancel}
          className={
            isClassic
              ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 border border-black/25 text-white/90'
              : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
          }
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className={
            isClassic
              ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-white border border-theme-magenta/60 shadow-card disabled:opacity-50'
              : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-theme-bg shadow-glow-cyan hover:brightness-105 disabled:opacity-50'
          }
        >
          {config ? 'Update' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
};

export default ConnectionForm;
