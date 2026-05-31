import React from 'react';
import ConnectionForm from './ConnectionForm';
import SchemaMapper from './SchemaMapper';
import type { IntegrationConfig, ConnectionType } from '../../types';
import { connectionTypeLabel } from '../../pages/integrations/integrationFormatting';
import type {
  WizardStep,
  ConnectionSavePayload,
} from '../../pages/integrations/useIntegrationWizard';

const WIZARD_STEPS = ['Connection', 'Field Mapping', 'Review & Save'];

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

interface IntegrationWizardProps {
  isClassic: boolean;
  wizardStep: WizardStep;
  editingConfig: IntegrationConfig | undefined;
  draftName: string;
  draftConnectionType: ConnectionType;
  draftMappings: Record<string, string>;
  setWizardStep: (step: WizardStep) => void;
  setDraftMappings: (mappings: Record<string, string>) => void;
  onConnectionSave: (payload: ConnectionSavePayload) => void;
  onCancel: () => void;
  onFinalSave: () => void;
}

const IntegrationWizard: React.FC<IntegrationWizardProps> = ({
  isClassic,
  wizardStep,
  editingConfig,
  draftName,
  draftConnectionType,
  draftMappings,
  setWizardStep,
  setDraftMappings,
  onConnectionSave,
  onCancel,
  onFinalSave,
}) => {
  return (
    <>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        {WIZARD_STEPS.map((label, i) => {
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
          config={editingConfig}
          onSave={onConnectionSave}
          onCancel={onCancel}
        />
      )}

      {wizardStep === 2 && (
        <div className="space-y-4">
          <SchemaMapper
            slopcastFields={[]}
            sourceFields={PLACEHOLDER_SOURCE_FIELDS}
            mappings={draftMappings}
            onUpdateMappings={setDraftMappings}
          />
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
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
              type="button"
              onClick={() => setWizardStep(3)}
              className={
                isClassic
                  ? 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-white border border-theme-magenta/60 shadow-card'
                  : 'px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] bg-theme-cyan text-theme-bg shadow-glow-cyan hover:brightness-105'
              }
            >
              Next Step
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
              type="button"
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
                type="button"
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
                type="button"
                onClick={onFinalSave}
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
    </>
  );
};

export default IntegrationWizard;
