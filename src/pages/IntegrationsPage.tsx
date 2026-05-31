import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import IntegrationWizard from '../components/integrations/IntegrationWizard';
import IntegrationsTable from '../components/integrations/IntegrationsTable';
import { useIntegrationsList } from './integrations/useIntegrationsList';
import { useIntegrationWizard } from './integrations/useIntegrationWizard';

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;

  const {
    integrations,
    loading,
    error,
    saveIntegration,
    removeIntegration,
  } = useIntegrationsList();

  const {
    wizardOpen,
    wizardStep,
    editingConfig,
    draftName,
    draftConnectionType,
    draftConnectionParams,
    draftMappings,
    setWizardStep,
    setDraftMappings,
    openNewWizard,
    openEditWizard,
    closeWizard,
    handleConnectionSave,
  } = useIntegrationWizard();

  const handleFinalSave = async () => {
    const saved = await saveIntegration(editingConfig?.id, {
      name: draftName,
      connectionType: draftConnectionType,
      connectionParams: draftConnectionParams,
      fieldMappings: draftMappings,
      status: 'active',
    });
    if (saved) {
      closeWizard();
    }
  };

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
            type="button"
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
            type="button"
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
            <IntegrationWizard
              isClassic={isClassic}
              wizardStep={wizardStep}
              editingConfig={editingConfig}
              draftName={draftName}
              draftConnectionType={draftConnectionType}
              draftMappings={draftMappings}
              setWizardStep={setWizardStep}
              setDraftMappings={setDraftMappings}
              onConnectionSave={handleConnectionSave}
              onCancel={closeWizard}
              onFinalSave={handleFinalSave}
            />
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

            <IntegrationsTable
              integrations={integrations}
              loading={loading}
              isClassic={isClassic}
              onEdit={openEditWizard}
              onDelete={removeIntegration}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default IntegrationsPage;
