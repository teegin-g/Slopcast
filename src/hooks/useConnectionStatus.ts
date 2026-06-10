import { useCallback, useSyncExternalStore } from 'react';
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
// Public state shape
// ---------------------------------------------------------------------------

export interface ConnectionStatusState {
  /** Latest status from the backend, or null if never fetched. */
  status: SpatialConnectionStatus | null;
  /** True while the very first fetch is in-flight. */
  isInitializing: boolean;
}

// Stable initial snapshot shared by every source before its first fetch.
// `useSyncExternalStore` requires getSnapshot to return a referentially stable
// value when nothing has changed, so this constant is reused (never recreated).
const INITIAL_SNAPSHOT: ConnectionStatusState = Object.freeze({
  status: null,
  isInitializing: true,
});

// ---------------------------------------------------------------------------
// Shared per-source poller (SWR-style)
// ---------------------------------------------------------------------------
//
// Both the header connection chip (AppShell) and the map's source-policy hook
// (MapCommandCenter → useSpatialSourcePolicy) observe `GET /api/spatial/status`.
// Two independent hook instances would each open their own 30s/60s poll loop —
// architecturally a double-poll. This module-level store keeps ONE poll loop
// per sourceId and fans the result out to every subscriber via refcounting:
// the first subscriber for a source starts the loop, the last to leave stops it.
// The hook's public signature is unchanged, so callers need no edits.

interface SourceEntry {
  /** Current snapshot — referentially stable between changes (see getSnapshot). */
  snapshot: ConnectionStatusState;
  listeners: Set<() => void>;
  abort: AbortController | null;
  timer: ReturnType<typeof setTimeout> | null;
  /** A pending visibilitychange handler while the tab is hidden, so we can detach it. */
  visibilityHandler: (() => void) | null;
}

const store = new Map<SpatialDataSourceId, SourceEntry>();

function getEntry(sourceId: SpatialDataSourceId): SourceEntry {
  let entry = store.get(sourceId);
  if (!entry) {
    entry = {
      snapshot: INITIAL_SNAPSHOT,
      listeners: new Set(),
      abort: null,
      timer: null,
      visibilityHandler: null,
    };
    store.set(sourceId, entry);
  }
  return entry;
}

/** True while the entry is the live one for its source and still has subscribers. */
function isActive(sourceId: SpatialDataSourceId, entry: SourceEntry): boolean {
  return store.get(sourceId) === entry && entry.listeners.size > 0;
}

function setSnapshot(
  entry: SourceEntry,
  status: SpatialConnectionStatus | null,
  hasFetched: boolean,
): void {
  const next: ConnectionStatusState = { status, isInitializing: !hasFetched };
  entry.snapshot = next;
  entry.listeners.forEach(listener => listener());
}

async function poll(sourceId: SpatialDataSourceId, entry: SourceEntry): Promise<void> {
  entry.abort?.abort();
  const controller = new AbortController();
  entry.abort = controller;

  try {
    const result = await fetchConnectionStatus(controller.signal);
    if (!controller.signal.aborted) {
      setSnapshot(entry, result, true);
    }
  } catch {
    // Network error or aborted — keep the previous status, but mark fetched so
    // callers stop waiting on the first attempt.
    if (!controller.signal.aborted) {
      setSnapshot(entry, entry.snapshot.status, true);
    }
  }
}

function scheduleNext(sourceId: SpatialDataSourceId, entry: SourceEntry): void {
  if (!isActive(sourceId, entry)) return;
  const interval = sourceId === 'live' ? POLL_INTERVAL_LIVE : POLL_INTERVAL_MOCK;

  entry.timer = setTimeout(() => {
    if (!isActive(sourceId, entry)) return;
    if (document.visibilityState === 'visible') {
      poll(sourceId, entry).then(() => scheduleNext(sourceId, entry));
    } else {
      // Tab hidden — defer until it becomes visible again.
      const onVisible = () => {
        document.removeEventListener('visibilitychange', onVisible);
        entry.visibilityHandler = null;
        if (!isActive(sourceId, entry)) return;
        poll(sourceId, entry).then(() => scheduleNext(sourceId, entry));
      };
      entry.visibilityHandler = onVisible;
      document.addEventListener('visibilitychange', onVisible);
    }
  }, interval);
}

function teardown(entry: SourceEntry): void {
  entry.abort?.abort();
  entry.abort = null;
  if (entry.timer) {
    clearTimeout(entry.timer);
    entry.timer = null;
  }
  if (entry.visibilityHandler) {
    document.removeEventListener('visibilitychange', entry.visibilityHandler);
    entry.visibilityHandler = null;
  }
}

function subscribeToSource(sourceId: SpatialDataSourceId, listener: () => void): () => void {
  const entry = getEntry(sourceId);
  const firstSubscriber = entry.listeners.size === 0;
  entry.listeners.add(listener);

  if (firstSubscriber) {
    // Kick off the shared loop: initial fetch, then recurring schedule.
    poll(sourceId, entry).then(() => scheduleNext(sourceId, entry));
  }

  return () => {
    entry.listeners.delete(listener);
    if (entry.listeners.size === 0) {
      teardown(entry);
      // Drop the cache so a future subscriber starts fresh (isInitializing=true).
      // While ≥1 subscriber stays mounted (the real dedup case), the entry and
      // its snapshot persist, so a second consumer mounting reuses the value.
      store.delete(sourceId);
    }
  };
}

function getSourceSnapshot(sourceId: SpatialDataSourceId): ConnectionStatusState {
  return store.get(sourceId)?.snapshot ?? INITIAL_SNAPSHOT;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Polls `GET /api/spatial/status` and exposes the backend connection state.
 *
 * - Polls every 30s while sourceId is "live", 60s while "mock".
 * - Pauses when the tab is hidden (`document.visibilityState`).
 * - The first fetch sets `isInitializing` so callers can defer auto-detect.
 * - Multiple callers with the same sourceId share ONE poll loop (deduped via a
 *   module-level refcounted store), so the header chip and the map source-policy
 *   hook no longer double-poll the backend.
 */
export function useConnectionStatus(sourceId: SpatialDataSourceId): ConnectionStatusState {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToSource(sourceId, listener),
    [sourceId],
  );
  const getSnapshot = useCallback(() => getSourceSnapshot(sourceId), [sourceId]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ---------------------------------------------------------------------------
// Test-only escape hatch
// ---------------------------------------------------------------------------

/**
 * Reset the shared store between tests. Not for production use — exported so
 * unit tests can guarantee isolation regardless of mount/unmount ordering.
 */
export function __resetConnectionStatusStoreForTests(): void {
  store.forEach(entry => teardown(entry));
  store.clear();
}
