import { useCallback, useEffect, useRef } from 'react';
import { useConnectionStatus } from '../../../hooks/useConnectionStatus';
import { setStoredSpatialSourceId } from '../../../services/spatialService';
import type { SpatialDataSourceId } from '../../../types';
import { useToast } from '../Toast';

interface UseSpatialSourcePolicyArgs {
  dataSourceId?: SpatialDataSourceId;
  onSourceChange?: (id: SpatialDataSourceId) => void;
}

export function useSpatialSourcePolicy({
  dataSourceId,
  onSourceChange,
}: UseSpatialSourcePolicyArgs) {
  const { status: connStatus, isInitializing: connInitializing } = useConnectionStatus(dataSourceId ?? 'mock');
  const { addToast } = useToast();
  const prevConnected = useRef<boolean | null>(null);
  const userManuallyToggled = useRef(false);

  useEffect(() => {
    if (connInitializing || !connStatus || userManuallyToggled.current) return;
    if (prevConnected.current !== null) return;

    if (connStatus.connected && dataSourceId === 'mock') {
      setStoredSpatialSourceId('live');
      onSourceChange?.('live');
      addToast({ message: 'Connected to Databricks', type: 'success', duration: 5000 });
    } else if (!connStatus.connected && dataSourceId === 'mock') {
      addToast({ message: 'Database unavailable - showing demo data', type: 'info', duration: 5000 });
    }

    prevConnected.current = connStatus.connected;
  }, [connStatus, connInitializing, dataSourceId, onSourceChange, addToast]);

  useEffect(() => {
    if (connInitializing || !connStatus || prevConnected.current === null) return;

    const wasConnected = prevConnected.current;
    const isConnected = connStatus.connected;

    if (wasConnected && !isConnected) {
      addToast({ message: 'Connection lost - showing demo data', type: 'warning', duration: 5000 });
    } else if (!wasConnected && isConnected) {
      addToast({ message: 'Connected to Databricks', type: 'success', duration: 5000 });
    }

    prevConnected.current = isConnected;
  }, [connStatus, connInitializing, addToast]);

  const handleSourceChange = useCallback((id: SpatialDataSourceId) => {
    userManuallyToggled.current = true;
    onSourceChange?.(id);
  }, [onSourceChange]);

  return {
    connStatus,
    connInitializing,
    handleSourceChange,
  };
}
