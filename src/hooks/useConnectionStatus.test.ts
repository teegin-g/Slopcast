import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock spatialService
// ---------------------------------------------------------------------------

const mockFetchConnectionStatus = vi.fn();

vi.mock('../services/spatialService', () => ({
  fetchConnectionStatus: (...args: any[]) => mockFetchConnectionStatus(...args),
}));

import {
  useConnectionStatus,
  __resetConnectionStatusStoreForTests,
} from './useConnectionStatus';
import type { SpatialConnectionStatus } from '../services/spatialService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStatus(overrides: Partial<SpatialConnectionStatus> = {}): SpatialConnectionStatus {
  return {
    connected: false,
    source: 'mock',
    error: null,
    table: null,
    last_verified_at: null,
    reconnect_attempts: 0,
    ...overrides,
  };
}

/**
 * Advance fake timers and flush microtasks so the poll().then(scheduleNext)
 * chain can proceed one step without running into an infinite loop.
 */
async function advanceAndFlush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    // Flush the microtask queue (promise callbacks)
    await Promise.resolve();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useConnectionStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchConnectionStatus.mockReset();
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    __resetConnectionStatusStoreForTests();
    vi.useRealTimers();
  });

  it('starts with isInitializing true and null status', () => {
    mockFetchConnectionStatus.mockResolvedValue(makeStatus());
    const { result } = renderHook(() => useConnectionStatus('mock'));
    expect(result.current.isInitializing).toBe(true);
    expect(result.current.status).toBe(null);
  });

  it('fetches status on mount and clears isInitializing', async () => {
    const status = makeStatus({ connected: true, source: 'databricks' });
    mockFetchConnectionStatus.mockResolvedValue(status);

    const { result } = renderHook(() => useConnectionStatus('live'));

    // Flush the initial poll() promise
    await advanceAndFlush(0);

    expect(result.current.isInitializing).toBe(false);
    expect(result.current.status).toEqual(status);
  });

  it('passes AbortSignal to fetchConnectionStatus', async () => {
    mockFetchConnectionStatus.mockResolvedValue(makeStatus());
    renderHook(() => useConnectionStatus('mock'));

    await advanceAndFlush(0);

    expect(mockFetchConnectionStatus).toHaveBeenCalled();
    const signal = mockFetchConnectionStatus.mock.calls[0][0];
    expect(signal instanceof AbortSignal).toBe(true);
  });

  it('clears isInitializing even on network error', async () => {
    mockFetchConnectionStatus.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useConnectionStatus('mock'));

    await advanceAndFlush(0);

    expect(result.current.isInitializing).toBe(false);
    expect(result.current.status).toBe(null);
  });

  it('aborts in-flight request on unmount', async () => {
    mockFetchConnectionStatus.mockResolvedValue(makeStatus());

    const { unmount } = renderHook(() => useConnectionStatus('mock'));

    unmount();

    // Should not throw
    await advanceAndFlush(0);
  });

  it('polls again after interval for live source (30s)', async () => {
    mockFetchConnectionStatus.mockResolvedValue(makeStatus({ connected: true }));

    renderHook(() => useConnectionStatus('live'));

    // Initial poll
    await advanceAndFlush(0);
    const callsAfterInit = mockFetchConnectionStatus.mock.calls.length;

    // Advance 30s to trigger next poll
    await advanceAndFlush(30_000);

    expect(mockFetchConnectionStatus.mock.calls.length).toBeGreaterThan(callsAfterInit);
  });

  it('polls at 60s interval for mock source', async () => {
    mockFetchConnectionStatus.mockResolvedValue(makeStatus());

    renderHook(() => useConnectionStatus('mock'));

    await advanceAndFlush(0);
    const callsAfterInit = mockFetchConnectionStatus.mock.calls.length;

    // 30s — should NOT have polled again
    await advanceAndFlush(30_000);
    expect(mockFetchConnectionStatus.mock.calls.length).toBe(callsAfterInit);

    // 60s total — should have polled
    await advanceAndFlush(30_000);
    expect(mockFetchConnectionStatus.mock.calls.length).toBeGreaterThan(callsAfterInit);
  });

  // -------------------------------------------------------------------------
  // Dedup (follow-up #26): two consumers on the same source share one poll loop
  // -------------------------------------------------------------------------

  it('two consumers of the same source share a SINGLE initial fetch', async () => {
    const status = makeStatus({ connected: true, source: 'databricks' });
    mockFetchConnectionStatus.mockResolvedValue(status);

    // Mirrors production: AppShell header chip + MapCommandCenter source-policy
    // hook both observe the same sourceId.
    const a = renderHook(() => useConnectionStatus('live'));
    const b = renderHook(() => useConnectionStatus('live'));

    await advanceAndFlush(0);

    // ONE network request despite two mounted consumers.
    expect(mockFetchConnectionStatus).toHaveBeenCalledTimes(1);
    // Both consumers receive the shared snapshot.
    expect(a.result.current.status).toEqual(status);
    expect(b.result.current.status).toEqual(status);
    expect(a.result.current.isInitializing).toBe(false);
    expect(b.result.current.isInitializing).toBe(false);
  });

  it('two consumers share a single recurring poll (not one each)', async () => {
    mockFetchConnectionStatus.mockResolvedValue(makeStatus({ connected: true }));

    renderHook(() => useConnectionStatus('live'));
    renderHook(() => useConnectionStatus('live'));

    await advanceAndFlush(0);
    expect(mockFetchConnectionStatus).toHaveBeenCalledTimes(1);

    // After one 30s interval there should be exactly ONE additional fetch,
    // not two (which is the double-poll bug this dedup fixes).
    await advanceAndFlush(30_000);
    expect(mockFetchConnectionStatus).toHaveBeenCalledTimes(2);
  });

  it('keeps polling while one of two consumers stays mounted', async () => {
    mockFetchConnectionStatus.mockResolvedValue(makeStatus({ connected: true }));

    const a = renderHook(() => useConnectionStatus('live'));
    renderHook(() => useConnectionStatus('live'));

    await advanceAndFlush(0);
    expect(mockFetchConnectionStatus).toHaveBeenCalledTimes(1);

    // Unmount one consumer — the shared loop must survive for the other.
    a.unmount();

    await advanceAndFlush(30_000);
    expect(mockFetchConnectionStatus).toHaveBeenCalledTimes(2);
  });

  it('different sources poll independently (not deduped together)', async () => {
    mockFetchConnectionStatus.mockResolvedValue(makeStatus());

    renderHook(() => useConnectionStatus('live'));
    renderHook(() => useConnectionStatus('mock'));

    await advanceAndFlush(0);

    // Distinct sources → distinct loops → two initial fetches.
    expect(mockFetchConnectionStatus).toHaveBeenCalledTimes(2);
  });

  it('a late second consumer reuses the already-fetched snapshot without refetching', async () => {
    const status = makeStatus({ connected: true });
    mockFetchConnectionStatus.mockResolvedValue(status);

    renderHook(() => useConnectionStatus('live'));
    await advanceAndFlush(0);
    expect(mockFetchConnectionStatus).toHaveBeenCalledTimes(1);

    // Second consumer mounts later — should immediately see the cached snapshot
    // and not trigger a fresh fetch.
    const late = renderHook(() => useConnectionStatus('live'));
    expect(late.result.current.status).toEqual(status);
    expect(late.result.current.isInitializing).toBe(false);
    expect(mockFetchConnectionStatus).toHaveBeenCalledTimes(1);
  });
});
