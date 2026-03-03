import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import ConnectionForm from '../components/integrations/ConnectionForm';
import SchemaMapper from '../components/integrations/SchemaMapper';
import type {
  IntegrationConfig,
  ConnectionType,
  IntegrationStatus,
} from '../services/integrationService';
import {
  listIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
} from '../services/integrationService';

// Placeholder source fields for the schema mapper demo
const PLACEHOLDER_SOURCE_FIELDS = [
  'WellID',
  'WellName',
  'APINumber',
  'OperatorName',
  'BasinName',
  'FormationName',
  'Lat',
  'Long',
  'SpudDate',
  'CompletionDate',
  'FirstProdDate',
  'LateralLen',
  'TrueVerticalDepth',
  'OilProd',
  'GasProd',
  'WaterProd',
  'ProdMonth',
  'ProdDate',
];

type WizardStep = 1 | 2 | 3;

function formatDate(value: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function statusColor(status: IntegrationStatus, isClassic: boolean): string {
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

function connectionTypeLabel(ct: ConnectionType): string {
  switch (ct) {
    case 'supabase': return 'Supabase';
    case 'postgres': return 'PostgreSQL';
    case 'sqlserver': return 'SQL Server';
    case 'csv': return 'CSV';
    default: return ct;
  }
}

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { themeId } = useTheme();
  const isClassic = themeId === 'mario';

  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [editingConfig, setEditingConfig] = useState<IntegrationConfig | undefined>(undefined);

  // Wizard draft
  const [draftName, setDraftName] = useState('');
  const [draftConnectionType, setDraftConnectionType] = useState<ConnectionType>('supabase');
  const [draftConnectionParams, setDraftConnectionParams] = useState<Record<string, unknown>>({});
  const [draftMappings, setDraftMappings] = useState<Record<string, string>>({});

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listIntegrations();
      setIntegrations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const openNewWizard = () => {
    setEditingConfig(undefined);
    setDraftName('');
    setDraftConnectionType('supabase');
    setDraftConnectionParams({});
    setDraftMappings({});
    setWizardStep(1);
    setWizardOpen(true);
  };

  const openEditWizard = (config: IntegrationConfig) => {
    setEditingConfig(config);
    setDraftName(config.name);
    setDraftConnectionType(config.connectionType);
    setDraftConnectionParams(config.connectionParams);
    setDraftMappings(config.fieldMappings);
    setWizardStep(1);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setEditingConfig(undefined);
  };

  const handleConnectionSave = (payload: {
    name: string;
    connectionType: ConnectionType;
    connectionParams: Record<string, unknown>;
  }) => {
    setDraftName(payload.name);
    setDraftConnectionType(payload.connectionType);
    setDraftConnectionParams(payload.connectionParams);
    setWizardStep(2);
  };

  const handleFinalSave = async () => {
    try {
      if (editingConfig) {
        await updateIntegration(editingConfig.id, {
          name: draftName,
          connectionType: draftConnectionType,
          connectionParams: draftConnectionParams,
          fieldMappings: draftMappings,
          status: 'active',
        });
      } else {
        await createIntegration({
          name: draftName,
          connectionType: draftConnectionType,
          connectionParams: draftConnectionParams,
          fieldMappings: draftMappings,
          status: 'active',
        });
      }
      closeWizard();
      fetchIntegrations();
    } catch (err: any) {
      setError(err.message || 'Failed to save integration');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIntegration(id);
      fetchIntegrations();
    } catch (err: any) {
      setError(err.message || 'Failed to delete integration');
    }
  };

  // Step indicator
  const steps = ['Connection', 'Field Mapping', 'Review & Save'];

  const panelCls = isClassic
    ? 'rounded-panel border sc-panel'
    : 'rounded-panel border bg-theme-surface1/80 border-theme-border shadow-card';

  const headerTextCls = isClassic
    ? 'text-white font-black uppercase'
    : 'text-theme-text font-black tracking-tight';

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent theme-transition">
      {!isClassic && (
        <>
          <div className="sc-pageAmbient" />
          <div className="sc-pageAmbientOrbLeft" />
          <div className="sc-pageAmbientOrbRight" />
        </>
      )}

      <header
        className={`relative z-20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b theme-transition ${
          isClassic ? 'sc-header' : 'bg-theme-surface1/80 backdrop-blur-md border-theme-border'
        }`}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate('/hub')}
            className={
              isClassic
                ? 'px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-[0.14em] bg-black/20 border border-black/25 text-white/80 hover:text-white'
                : 'px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-[0.14em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
            }
          >
            Back to Hub
          </button>
          <div>
            <h1 className={`text-base md:text-xl leading-tight tracking-tight ${headerTextCls}`}>
              Data Integrations
            </h1>
            <p className={`text-[9px] md:text-[10px] uppercase tracking-[0.22em] ${isClassic ? 'text-theme-warning font-black' : 'text-theme-magenta font-bold'}`}>
              External data connections
            </p>
          </div>
        </div>

        {!wizardOpen && (
          <button
            onClick={openNewWizard}
            className={
              isClassic
                ? 'px-3 md:px-4 py-2 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 border-black/20 bg-theme-cyan text-white shadow-card'
                : 'px-3 md:px-4 py-2 rounded-panel text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-theme-cyan text-theme-bg shadow-glow-cyan hover:brightness-105 transition-all'
            }
          >
            New Integration
          </button>
        )}
      </header>

      <main className="relative z-10 p-4 md:p-6 max-w-[1200px] mx-auto w-full space-y-6">
        {error && (
          <div className={`rounded-inner border px-4 py-3 text-[11px] ${
            isClassic
              ? 'bg-red-900/30 border-red-700/40 text-red-200'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {error}
          </div>
        )}

        {wizardOpen ? (
          <div className={`${panelCls} p-5 md:p-6 space-y-5`}>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-4">
              {steps.map((label, i) => {
                const stepNum = (i + 1) as WizardStep;
                const isActive = wizardStep === stepNum;
                const isComplete = wizardStep > stepNum;
                return (
                  <React.Fragment key={label}>
                    {i > 0 && (
                      <div className={`flex-1 h-px ${
                        isComplete
                          ? isClassic ? 'bg-theme-cyan' : 'bg-theme-cyan'
                          : isClassic ? 'bg-black/25' : 'bg-theme-border'
                      }`} />
                    )}
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isActive
                          ? isClassic
                            ? 'bg-theme-cyan text-white'
                            : 'bg-theme-cyan text-theme-bg'
                          : isComplete
                            ? isClassic
                              ? 'bg-theme-warning text-black'
                              : 'bg-theme-cyan/30 text-theme-cyan'
                            : isClassic
                              ? 'bg-black/25 text-white/50'
                              : 'bg-theme-surface2 text-theme-muted'
                      }`}>
                        {stepNum}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-[0.14em] hidden md:inline ${
                        isActive
                          ? isClassic ? 'text-white' : 'text-theme-text'
                          : isClassic ? 'text-white/50' : 'text-theme-muted'
                      }`}>
                        {label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step content */}
            {wizardStep === 1 && (
              <ConnectionForm
                isClassic={isClassic}
                config={editingConfig}
                onSave={handleConnectionSave}
                onCancel={closeWizard}
              />
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <SchemaMapper
                  isClassic={isClassic}
                  slopcastFields={[]}
                  sourceFields={PLACEHOLDER_SOURCE_FIELDS}
                  mappings={draftMappings}
                  onUpdateMappings={setDraftMappings}
                />
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className={
                      isClassic
                        ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 border border-black/25 text-white/90'
                        : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
                    }
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className={
                      isClassic
                        ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-white border border-theme-magenta/60 shadow-card'
                        : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-theme-bg shadow-glow-cyan hover:brightness-105'
                    }
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <h4 className={isClassic
                  ? 'text-[11px] font-black uppercase tracking-[0.14em] text-theme-warning'
                  : 'text-[11px] font-black uppercase tracking-[0.14em] text-theme-cyan'
                }>
                  Review Integration
                </h4>

                <div className={`space-y-3 ${
                  isClassic
                    ? 'bg-black/20 border border-black/25 rounded-inner p-4'
                    : 'bg-theme-bg border border-theme-border rounded-inner p-4'
                }`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={isClassic ? 'text-[9px] font-black uppercase tracking-[0.14em] text-white/50' : 'text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted'}>
                        Name
                      </p>
                      <p className={isClassic ? 'text-[11px] text-white mt-1' : 'text-[11px] text-theme-text mt-1'}>
                        {draftName}
                      </p>
                    </div>
                    <div>
                      <p className={isClassic ? 'text-[9px] font-black uppercase tracking-[0.14em] text-white/50' : 'text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted'}>
                        Connection Type
                      </p>
                      <p className={isClassic ? 'text-[11px] text-white mt-1' : 'text-[11px] text-theme-text mt-1'}>
                        {connectionTypeLabel(draftConnectionType)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className={isClassic ? 'text-[9px] font-black uppercase tracking-[0.14em] text-white/50' : 'text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted'}>
                      Field Mappings
                    </p>
                    <p className={isClassic ? 'text-[11px] text-white mt-1' : 'text-[11px] text-theme-text mt-1'}>
                      {Object.keys(draftMappings).length} fields mapped
                    </p>
                  </div>

                  {Object.keys(draftMappings).length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {Object.entries(draftMappings).map(([sc, src]) => (
                        <div key={sc} className={`text-[10px] px-2 py-1 rounded ${
                          isClassic ? 'text-cyan-300' : 'text-theme-cyan'
                        }`}>
                          {sc} &larr; {src}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className={
                      isClassic
                        ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 border border-black/25 text-white/90'
                        : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
                    }
                  >
                    Back
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeWizard}
                      className={
                        isClassic
                          ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-black/20 border border-black/25 text-white/90'
                          : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
                      }
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFinalSave}
                      className={
                        isClassic
                          ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-white border border-theme-magenta/60 shadow-card'
                          : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-theme-bg shadow-glow-cyan hover:brightness-105'
                      }
                    >
                      {editingConfig ? 'Update Integration' : 'Create Integration'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`${panelCls} p-5 md:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-[11px] uppercase tracking-[0.3em] ${isClassic ? 'text-theme-warning font-black' : 'text-theme-cyan font-black'}`}>
                Saved Integrations
              </h3>
              <span className={`text-[10px] uppercase tracking-[0.2em] ${isClassic ? 'text-white/70 font-black' : 'text-theme-muted font-bold'}`}>
                {integrations.length} {integrations.length === 1 ? 'Connection' : 'Connections'}
              </span>
            </div>

            {loading ? (
              <div className={`text-center py-8 ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>
                <p className="text-[11px] uppercase tracking-[0.14em] font-black">Loading...</p>
              </div>
            ) : integrations.length === 0 ? (
              <div className={`text-center py-8 ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>
                <p className="text-[11px] uppercase tracking-[0.14em] font-black">No integrations configured</p>
                <p className="text-[10px] mt-1">Click "New Integration" to connect an external data source.</p>
              </div>
            ) : (
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
                        <td className={`px-3 py-3 text-[11px] ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                          {config.name}
                        </td>
                        <td className={`px-3 py-3 text-[11px] ${isClassic ? 'text-white/80' : 'text-theme-muted'}`}>
                          {connectionTypeLabel(config.connectionType)}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.14em] ${statusColor(config.status, isClassic)}`}>
                            {config.status}
                          </span>
                        </td>
                        <td className={`px-3 py-3 text-[10px] ${isClassic ? 'text-white/60' : 'text-theme-muted'}`}>
                          {formatDate(config.lastSyncAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditWizard(config)}
                              className={`text-[9px] font-black uppercase tracking-[0.14em] px-2 py-1 rounded ${
                                isClassic
                                  ? 'text-theme-cyan hover:text-white'
                                  : 'text-theme-cyan hover:text-theme-text'
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(config.id)}
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
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default IntegrationsPage;
