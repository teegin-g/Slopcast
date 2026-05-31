import { useState, useEffect, useCallback } from 'react';
import type { IntegrationConfig } from '../../services/integrationService';
import {
  listIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
} from '../../services/integrationService';

export interface SaveIntegrationPayload {
  name: string;
  connectionType: IntegrationConfig['connectionType'];
  connectionParams: Record<string, unknown>;
  fieldMappings: Record<string, string>;
  status: IntegrationConfig['status'];
}

export interface UseIntegrationsList {
  integrations: IntegrationConfig[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  fetchIntegrations: () => Promise<void>;
  saveIntegration: (
    editingId: string | undefined,
    payload: SaveIntegrationPayload,
  ) => Promise<boolean>;
  removeIntegration: (id: string) => Promise<void>;
}

export function useIntegrationsList(): UseIntegrationsList {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const saveIntegration = useCallback(
    async (editingId: string | undefined, payload: SaveIntegrationPayload): Promise<boolean> => {
      try {
        if (editingId) {
          await updateIntegration(editingId, payload);
        } else {
          await createIntegration(payload);
        }
        fetchIntegrations();
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to save integration');
        return false;
      }
    },
    [fetchIntegrations],
  );

  const removeIntegration = useCallback(
    async (id: string) => {
      try {
        await deleteIntegration(id);
        fetchIntegrations();
      } catch (err: any) {
        setError(err.message || 'Failed to delete integration');
      }
    },
    [fetchIntegrations],
  );

  return {
    integrations,
    loading,
    error,
    setError,
    fetchIntegrations,
    saveIntegration,
    removeIntegration,
  };
}
