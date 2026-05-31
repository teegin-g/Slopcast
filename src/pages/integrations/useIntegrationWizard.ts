import { useState, useCallback } from 'react';
import type {
  IntegrationConfig,
  ConnectionType,
} from '../../types';

export type WizardStep = 1 | 2 | 3;

export interface ConnectionSavePayload {
  name: string;
  connectionType: ConnectionType;
  connectionParams: Record<string, unknown>;
}

export interface UseIntegrationWizard {
  wizardOpen: boolean;
  wizardStep: WizardStep;
  editingConfig: IntegrationConfig | undefined;
  draftName: string;
  draftConnectionType: ConnectionType;
  draftConnectionParams: Record<string, unknown>;
  draftMappings: Record<string, string>;
  setWizardStep: (step: WizardStep) => void;
  setDraftMappings: (mappings: Record<string, string>) => void;
  openNewWizard: () => void;
  openEditWizard: (config: IntegrationConfig) => void;
  closeWizard: () => void;
  handleConnectionSave: (payload: ConnectionSavePayload) => void;
}

export function useIntegrationWizard(): UseIntegrationWizard {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [editingConfig, setEditingConfig] = useState<IntegrationConfig | undefined>(undefined);

  // Wizard draft. Connection params are kept in state (not a ref) so that the
  // review step (step 3) always renders the most recently saved values rather
  // than a stale snapshot left over from a prior render.
  const [draftName, setDraftName] = useState('');
  const [draftConnectionType, setDraftConnectionType] = useState<ConnectionType>('supabase');
  const [draftConnectionParams, setDraftConnectionParams] = useState<Record<string, unknown>>({});
  const [draftMappings, setDraftMappings] = useState<Record<string, string>>({});

  const openNewWizard = useCallback(() => {
    setEditingConfig(undefined);
    setDraftName('');
    setDraftConnectionType('supabase');
    setDraftConnectionParams({});
    setDraftMappings({});
    setWizardStep(1);
    setWizardOpen(true);
  }, []);

  const openEditWizard = useCallback((config: IntegrationConfig) => {
    setEditingConfig(config);
    setDraftName(config.name);
    setDraftConnectionType(config.connectionType);
    setDraftConnectionParams(config.connectionParams);
    setDraftMappings(config.fieldMappings);
    setWizardStep(1);
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
    setEditingConfig(undefined);
  }, []);

  const handleConnectionSave = useCallback((payload: ConnectionSavePayload) => {
    setDraftName(payload.name);
    setDraftConnectionType(payload.connectionType);
    setDraftConnectionParams(payload.connectionParams);
    setWizardStep(2);
  }, []);

  return {
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
  };
}
