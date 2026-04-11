import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchConnectionStatus,
  type SpatialConnectionStatus,
} from '../services/spatialService';
import type { SpatialDataSourceId } from '../types';

// ---------------------------------------------------------------------------
// Polling intervals
// ---------------------------------------------------------------------------

const POLL_INTERVAL_LIVE = 30_000; // 30s when source is "live"
const POLL_INTERVAL_MOCK = 60_000; // 60s when source is "mock"

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface ConnectionStatusState {
  /** Latest status from the backend, or null if never fetched. */
  status: SpatialConnectionStatus | null;
  /** True while the very first fetch is in-flight. */
  isInitializing: boolean;
}

/**
 * Polls `GET /api/spatial/status` and exposes the backend connection state.
 *
 * - Polls every 30s while sourceId is "live", 60s while "mock".
 * - Pauses when the tab is hidden (`document.visibilityState`).
 * - The first fetch sets `isInitializing` so callers can defer auto-detect.
 */
export function useConnectionStatus(sourceId: SpatialDataSourceId): ConnectionStatusState {
  const [status, setStatus] = useState<SpatialConnectionStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await fetchConnectionStatus(controller.signal);
      if (!controller.signal.aborted) {
        setStatus(result);
        setIsInitializing(false);
      }
    } catch {
      // Network error or aborted — keep previous status
      setIsInitializing(false);
    }
  }, []);

  // Schedule recurring polls, pausing when tab is hidden
  useEffect(() => {
    const interval = sourceId === 'live' ? POLL_INTERVAL_LIVE : POLL_INTERVAL_MOCK;

    function scheduleNext() {
      timerRef.current = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          poll().then(scheduleNext);
        } else {
          // Tab hidden — wait for visibility change
          const onVisible = () => {
            document.removeEventListener('visibilitychange', onVisible);
            poll().then(scheduleNext);
          };
          document.addEventListener('visibilitychange', onVisible);
        }
      }, interval);
    }

    // Initial fetch on mount
    poll().then(scheduleNext);

    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sourceId, poll]);

  return { status, isInitializing };
}
