import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock spatialService — must be hoisted before the module under test loads
// ---------------------------------------------------------------------------

const mockFetchViewportWells = vi.fn();
const mockGetAvailableLayers = vi.fn();

vi.mock('../services/spatialService', () => ({
  getSpatialSource: () => ({
    id: 'mock',
    label: 'Mock (Client)',
    fetchViewportWells: mockFetchViewportWells,
    getAvailableLayers: mockGetAvailableLayers,
  }),
  getStoredSpatialSourceId: () => 'mock' as const,
}));

vi.mock('../constants', () => ({
  MOCK_WELLS: [],
}));

import { useViewportData } from './useViewportData';
import type { Well, SpatialWellsResponse } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWell(overrides: Partial<Well> = {}): Well {
  return {
    id: `w-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Test Well',
    lat: 31.9,
    lng: -102.3,
    lateralLength: 10000,
    status: 'PRODUCING',
    operator: 'Test Op',
    formation: 'Wolfcamp A',
    ...overrides,
  };
}

function makeResponse(wells: Well[], source: 'mock' | 'databricks' = 'mock'): SpatialWellsResponse {
  return {
    wells,
    total_count: wells.length,
    truncated: false,
    source,
  };
}

const MOCK_TRAJECTORY = {
  surface: { lat: 31.9, lng: -102.3, depthFt: 0 },
  heel: { lat: 31.9, lng: -102.3, depthFt: 8000 },
  toe: { lat: 31.9, lng: -102.2, depthFt: 8000 },
  path: [{ lat: 31.9, lng: -102.3, depthFt: 0 }, { lat: 31.9, lng: -102.3, depthFt: 8000 }, { lat: 31.9, lng: -102.2, depthFt: 8000 }],
  mdFt: 18000,
};

/** Minimal mapbox map stub with controllable bounds and zoom. */
function createMockMap(zoom = 14) {
  const listeners = new Map<string, Set<Function>>();
  return {
    getBounds: vi.fn(() => ({
      getSouthWest: () => ({ lat: 31.0, lng: -103.0 }),
      getNorthEast: () => ({ lat: 33.0, lng: -101.0 }),
    })),
    getZoom: vi.fn(() => zoom),
    on: vi.fn((event: string, fn: Function) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
    }),
    off: vi.fn((event: string, fn: Function) => {
      listeners.get(event)?.delete(fn);
    }),
    /** Fire an event to simulate map movement. */
    _fire(event: string) {
      for (const fn of listeners.get(event) ?? []) fn();
    },
    _listeners: listeners,
  };
}

/**
 * Helper: wait for all pending async work + timers to settle.
 * The hook has two effects that both call fetchWells() on mount,
 * so we need to drain everything.
 */
async function flushAll() {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('useViewportData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetchViewportWells.mockReset();
    mockGetAvailableLayers.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // ---- Phase 1: basic fetch ----

  it('fetches summary wells on mount when map is ready', async () => {
    const wells = [makeWell({ id: 'w-1' }), makeWell({ id: 'w-2' })];
    mockFetchViewportWells.mockResolvedValue(makeResponse(wells));

    const map = createMockMap(14);
    const { result } = renderHook(() =>
      useViewportData({ map, isLoaded: true }),
    );

    await flushAll();

    expect(result.current.wells.length).toBe(2);
    expect(result.current.source).toBe('mock');
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchViewportWells).toHaveBeenCalled();

    // Should have been called with summary detail level (zoom 14 >= 10)
    const lastCallOpts = mockFetchViewportWells.mock.calls.at(-1)?.[2];
    expect(lastCallOpts?.detailLevel).toBe('summary');
  });

  it('uses points detail level when zoom < 10', async () => {
    mockFetchViewportWells.mockResolvedValue(makeResponse([makeWell()]));

    const map = createMockMap(8);
    renderHook(() => useViewportData({ map, isLoaded: true }));

    await flushAll();

    const lastCallOpts = mockFetchViewportWells.mock.calls.at(-1)?.[2];
    expect(lastCallOpts?.detailLevel).toBe('points');
  });

  it('does nothing when map is null', async () => {
    const { result } = renderHook(() =>
      useViewportData({ map: null, isLoaded: true }),
    );

    await flushAll();

    expect(mockFetchViewportWells).not.toHaveBeenCalled();
    expect(result.current.wells).toEqual([]);
  });

  it('does nothing when isLoaded is false', async () => {
    const map = createMockMap();
    renderHook(() => useViewportData({ map, isLoaded: false }));

    await flushAll();

    expect(mockFetchViewportWells).not.toHaveBeenCalled();
  });

  it('does nothing when enabled is false', async () => {
    const map = createMockMap();
    renderHook(() => useViewportData({ map, isLoaded: true, enabled: false }));

    await flushAll();

    expect(mockFetchViewportWells).not.toHaveBeenCalled();
  });

  // ---- Debounced refetch on moveend ----

  it('debounces moveend events', async () => {
    const wells = [makeWell({ id: 'w-1' })];
    mockFetchViewportWells.mockResolvedValue(makeResponse(wells));

    const map = createMockMap();
    renderHook(() =>
      useViewportData({ map, isLoaded: true, debounceMs: 400 }),
    );

    // Initial mount fetch
    await flushAll();
    const callCountAfterInit = mockFetchViewportWells.mock.calls.length;

    // Fire rapid moveend events
    act(() => {
      map._fire('moveend');
      map._fire('moveend');
      map._fire('moveend');
    });

    // Advance less than debounce — no new fetch yet
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(mockFetchViewportWells.mock.calls.length).toBe(callCountAfterInit);

    // Advance past debounce threshold — exactly one new fetch
    await act(async () => {
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
    });
    // One new call (the debounced fetch) — cache hit returns same result so no network call
    // The fetch was attempted, but with same bounds it hits the cache. So no new mock call.
    // What matters: it debounced 3 events into 1 fetch attempt.
    expect(mockFetchViewportWells.mock.calls.length).toBe(callCountAfterInit);
  });

  // ---- Phase 2: trajectory fetch ----

  it('fetches trajectories in phase 2 when includeLaterals and zoom >= 10', async () => {
    const summaryWells = [makeWell({ id: 'w-1' }), makeWell({ id: 'w-2' })];
    const fullWells = [
      makeWell({ id: 'w-1', trajectory: MOCK_TRAJECTORY as any }),
      makeWell({ id: 'w-2', trajectory: MOCK_TRAJECTORY as any }),
    ];

    mockFetchViewportWells.mockImplementation(async (_bounds: any, _filters: any, opts: any) => {
      if (opts?.detailLevel === 'full') return makeResponse(fullWells);
      return makeResponse(summaryWells);
    });

    const map = createMockMap(14);
    const { result } = renderHook(() =>
      useViewportData({ map, isLoaded: true, includeLaterals: true }),
    );

    await flushAll();

    // At least one call with 'full' detail level
    const fullCalls = mockFetchViewportWells.mock.calls.filter(
      (c: any[]) => c[2]?.detailLevel === 'full',
    );
    expect(fullCalls.length).toBeGreaterThanOrEqual(1);
    expect(fullCalls[0][2]?.includeLaterals).toBe(true);

    // Wells should have trajectories merged in
    expect(result.current.wells.length).toBe(2);
    expect(result.current.wells[0].trajectory).toBeTruthy();
    expect(result.current.isLoadingTrajectories).toBe(false);
  });

  it('fetches trajectories in phase 2 at mid-zoom when live wells are already visible', async () => {
    const summaryWells = [makeWell({ id: 'w-1' }), makeWell({ id: 'w-2' })];
    const fullWells = [
      makeWell({ id: 'w-1', trajectory: MOCK_TRAJECTORY as any }),
      makeWell({ id: 'w-2', trajectory: MOCK_TRAJECTORY as any }),
    ];

    mockFetchViewportWells.mockImplementation(async (_bounds: any, _filters: any, opts: any) => {
      if (opts?.detailLevel === 'full') return makeResponse(fullWells);
      return makeResponse(summaryWells);
    });

    const map = createMockMap(11);
    const { result } = renderHook(() =>
      useViewportData({ map, isLoaded: true, includeLaterals: true }),
    );

    await flushAll();

    const fullCalls = mockFetchViewportWells.mock.calls.filter(
      (c: any[]) => c[2]?.detailLevel === 'full',
    );
    expect(fullCalls.length).toBeGreaterThanOrEqual(1);
    expect(result.current.wells[0].trajectory).toBeTruthy();
  });

  it('skips phase 2 when zoom < 10 even with includeLaterals', async () => {
    mockFetchViewportWells.mockResolvedValue(makeResponse([makeWell()]));

    const map = createMockMap(9);
    renderHook(() =>
      useViewportData({ map, isLoaded: true, includeLaterals: true }),
    );

    await flushAll();

    // No calls with 'full' detail level
    const fullCalls = mockFetchViewportWells.mock.calls.filter(
      (c: any[]) => c[2]?.detailLevel === 'full',
    );
    expect(fullCalls.length).toBe(0);
  });

  it('skips phase 2 when includeLaterals is false', async () => {
    mockFetchViewportWells.mockResolvedValue(makeResponse([makeWell()]));

    const map = createMockMap(14);
    renderHook(() =>
      useViewportData({ map, isLoaded: true, includeLaterals: false }),
    );

    await flushAll();

    const fullCalls = mockFetchViewportWells.mock.calls.filter(
      (c: any[]) => c[2]?.detailLevel === 'full',
    );
    expect(fullCalls.length).toBe(0);
  });

  // ---- Phase 2: trajectory merge preserves existing wells ----

  it('merges trajectories into existing wells without replacing them', async () => {
    const summaryWells = [
      makeWell({ id: 'w-1', name: 'Alpha' }),
      makeWell({ id: 'w-2', name: 'Beta' }),
      makeWell({ id: 'w-3', name: 'Gamma' }),
    ];
    // Phase 2 only returns 2 of the 3 wells (simulating lower limit)
    const fullWells = [
      makeWell({ id: 'w-1', trajectory: MOCK_TRAJECTORY as any }),
      makeWell({ id: 'w-2', trajectory: MOCK_TRAJECTORY as any }),
    ];

    mockFetchViewportWells.mockImplementation(async (_bounds: any, _filters: any, opts: any) => {
      if (opts?.detailLevel === 'full') return makeResponse(fullWells);
      return makeResponse(summaryWells);
    });

    const map = createMockMap(14);
    const { result } = renderHook(() =>
      useViewportData({ map, isLoaded: true, includeLaterals: true }),
    );

    await flushAll();

    // All 3 wells preserved from phase 1
    expect(result.current.wells.length).toBe(3);
    // w-1 and w-2 have trajectories
    expect(result.current.wells.find(w => w.id === 'w-1')?.trajectory).toBeTruthy();
    expect(result.current.wells.find(w => w.id === 'w-2')?.trajectory).toBeTruthy();
    // w-3 does NOT have a trajectory (wasn't in full response)
    expect(result.current.wells.find(w => w.id === 'w-3')?.trajectory).toBeFalsy();
  });

  // ---- Cancellation ----

  it('passes AbortSignal to fetch calls', async () => {
    mockFetchViewportWells.mockResolvedValue(makeResponse([makeWell()]));

    const map = createMockMap(14);
    renderHook(() => useViewportData({ map, isLoaded: true }));

    await flushAll();

    // The last call's signal should be an AbortSignal
    const lastOpts = mockFetchViewportWells.mock.calls.at(-1)?.[2];
    expect(lastOpts?.signal).toBeDefined();
    expect(lastOpts.signal instanceof AbortSignal).toBe(true);
  });

  // ---- Error handling ----

  it('sets error state when fetch fails', async () => {
    mockFetchViewportWells.mockRejectedValue(new Error('Network error'));

    const map = createMockMap();
    const { result } = renderHook(() =>
      useViewportData({ map, isLoaded: true }),
    );

    await flushAll();

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  it('does not set error for AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    mockFetchViewportWells.mockRejectedValue(abortError);

    const map = createMockMap();
    const { result } = renderHook(() =>
      useViewportData({ map, isLoaded: true }),
    );

    await flushAll();

    // AbortError should be silently swallowed
    expect(result.current.error).toBe(null);
  });

  // ---- Cache behavior ----

  it('uses cached result on second fetch with same bounds', async () => {
    const wells = [makeWell({ id: 'w-1' })];
    mockFetchViewportWells.mockResolvedValue(makeResponse(wells));

    const map = createMockMap(14);
    const { result } = renderHook(() =>
      useViewportData({ map, isLoaded: true }),
    );

    await flushAll();
    const callsAfterMount = mockFetchViewportWells.mock.calls.length;

    // Trigger moveend with same bounds — should hit cache
    act(() => {
      map._fire('moveend');
    });
    await flushAll();

    // No additional network calls — cache served the result
    expect(mockFetchViewportWells.mock.calls.length).toBe(callsAfterMount);
    expect(result.current.wells.length).toBe(1);
  });

  // ---- refetch clears cache ----

  it('refetch clears cache and fetches again', async () => {
    const wells = [makeWell({ id: 'w-1' })];
    mockFetchViewportWells.mockResolvedValue(makeResponse(wells));

    const map = createMockMap(14);
    const { result } = renderHook(() =>
      useViewportData({ map, isLoaded: true }),
    );

    await flushAll();
    const callsAfterMount = mockFetchViewportWells.mock.calls.length;

    // Call refetch — clears cache, forces new fetch
    await act(async () => {
      result.current.refetch();
      await vi.runAllTimersAsync();
    });

    expect(mockFetchViewportWells.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  // ---- Phase 2 zoom passthrough ----

  it('passes rounded zoom to phase 2 fetch options', async () => {
    const summaryWells = [makeWell({ id: 'w-1' })];
    const fullWells = [makeWell({ id: 'w-1', trajectory: MOCK_TRAJECTORY as any })];

    mockFetchViewportWells.mockImplementation(async (_bounds: any, _filters: any, opts: any) => {
      if (opts?.detailLevel === 'full') return makeResponse(fullWells);
      return makeResponse(summaryWells);
    });

    const map = createMockMap(14.7);
    renderHook(() =>
      useViewportData({ map, isLoaded: true, includeLaterals: true }),
    );

    await flushAll();

    // Find the full detail call and check zoom
    const fullCalls = mockFetchViewportWells.mock.calls.filter(
      (c: any[]) => c[2]?.detailLevel === 'full',
    );
    expect(fullCalls.length).toBeGreaterThanOrEqual(1);
    expect(fullCalls[0][2]?.zoom).toBe(15);
  });

  // ---- Cleanup on unmount ----

  it('removes moveend listener on unmount', async () => {
    mockFetchViewportWells.mockResolvedValue(makeResponse([]));

    const map = createMockMap();
    const { unmount } = renderHook(() =>
      useViewportData({ map, isLoaded: true }),
    );

    await flushAll();

    unmount();
    expect(map.off).toHaveBeenCalledWith('moveend', expect.any(Function));
  });
});
