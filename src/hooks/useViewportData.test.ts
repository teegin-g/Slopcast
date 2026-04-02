import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock spatialService before importing the hook
vi.mock('../services/spatialService', () => ({
  getSpatialSource: vi.fn(),
  getStoredSpatialSourceId: vi.fn(),
}));

// Mock constants to avoid pulling in full mock dataset
vi.mock('../constants', () => ({
  MOCK_WELLS: [],
}));

import { getSpatialSource, getStoredSpatialSourceId } from '../services/spatialService';
import { renderHook, act } from '@testing-library/react';
import { useViewportData } from './useViewportData';

const mockFetchViewportWells = vi.fn();
const mockGetAvailableLayers = vi.fn();

function makeMockSource(id: 'mock' | 'live') {
  return {
    id,
    label: id === 'mock' ? 'Mock' : 'Live',
    fetchViewportWells: mockFetchViewportWells,
    getAvailableLayers: mockGetAvailableLayers,
  };
}

function makeMapStub() {
  const handlers: Record<string, Function> = {};
  return {
    getBounds: () => ({
      getSouthWest: () => ({ lat: 31, lng: -103 }),
      getNorthEast: () => ({ lat: 32, lng: -101 }),
    }),
    on: (event: string, fn: Function) => { handlers[event] = fn; },
    off: vi.fn(),
    _handlers: handlers,
  };
}

function makeWellResponse(source: 'mock' | 'databricks', count = 1) {
  const wells = Array.from({ length: count }, (_, i) => ({
    id: `${source}-${i}`,
    name: `${source} Well ${i}`,
    lat: 31.5,
    lng: -102,
    lateralLength: 7500,
    status: 'PRODUCING' as const,
    operator: 'TestOp',
    formation: 'Wolfcamp',
  }));
  return {
    wells,
    total_count: count,
    truncated: false,
    source,
  };
}

describe('useViewportData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStoredSpatialSourceId).mockReturnValue('mock');
    vi.mocked(getSpatialSource).mockReturnValue(makeMockSource('mock'));
    mockFetchViewportWells.mockResolvedValue(makeWellResponse('mock'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ----- Live data path -----

  it('uses explicit dataSourceId when provided', async () => {
    const liveSource = makeMockSource('live');
    vi.mocked(getSpatialSource).mockReturnValue(liveSource);
    mockFetchViewportWells.mockResolvedValue(makeWellResponse('databricks'));

    const map = makeMapStub();

    renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        dataSourceId: 'live',
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(getSpatialSource).toHaveBeenCalledWith('live');
  });

  it('reads stored preference when dataSourceId is omitted', async () => {
    vi.mocked(getStoredSpatialSourceId).mockReturnValue('live');
    const liveSource = makeMockSource('live');
    vi.mocked(getSpatialSource).mockReturnValue(liveSource);
    mockFetchViewportWells.mockResolvedValue(makeWellResponse('databricks'));

    const map = makeMapStub();

    renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(getStoredSpatialSourceId).toHaveBeenCalled();
    expect(getSpatialSource).toHaveBeenCalledWith('live');
  });

  it('reports source as databricks when live source succeeds', async () => {
    vi.mocked(getSpatialSource).mockReturnValue(makeMockSource('live'));
    mockFetchViewportWells.mockResolvedValue(makeWellResponse('databricks', 5));

    const map = makeMapStub();
    const { result } = renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        dataSourceId: 'live',
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.source).toBe('databricks');
    expect(result.current.wells).toHaveLength(5);
    expect(result.current.totalCount).toBe(5);
    expect(result.current.fallbackActive).toBe(false);
  });

  // ----- Fallback behavior -----

  it('falls back to mock on live source error', async () => {
    vi.mocked(getStoredSpatialSourceId).mockReturnValue('live');

    const mockResponse = makeWellResponse('mock');

    // Track calls: first call (live) rejects, subsequent calls (mock fallback + filter effect) resolve
    mockFetchViewportWells
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValue(mockResponse);

    const liveSource = makeMockSource('live');
    const mockSource = makeMockSource('mock');

    vi.mocked(getSpatialSource).mockImplementation((id?: string) => {
      if (id === 'mock') return mockSource;
      return liveSource;
    });

    const map = makeMapStub();

    const { result } = renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        dataSourceId: 'live',
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(result.current.fallbackActive).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sets error when both live and fallback fail', async () => {
    // All calls reject
    mockFetchViewportWells.mockRejectedValue(new Error('All sources unavailable'));

    const liveSource = makeMockSource('live');
    const mockSource = makeMockSource('mock');

    vi.mocked(getSpatialSource).mockImplementation((id?: string) => {
      if (id === 'mock') return mockSource;
      return liveSource;
    });

    const map = makeMapStub();

    const { result } = renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        dataSourceId: 'live',
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(result.current.error).toBe('All sources unavailable');
    expect(result.current.fallbackActive).toBe(false);
  });

  it('does not attempt mock fallback when mock source itself errors', async () => {
    mockFetchViewportWells.mockRejectedValue(new Error('Mock failed'));

    const map = makeMapStub();

    const { result } = renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        dataSourceId: 'mock',
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Mock source errors propagate directly without fallback attempt
    expect(result.current.error).toBe('Mock failed');
    expect(result.current.fallbackActive).toBe(false);
  });

  // ----- Cache behavior -----

  it('returns cached results for same viewport bounds on moveend', async () => {
    vi.mocked(getSpatialSource).mockReturnValue(makeMockSource('mock'));
    mockFetchViewportWells.mockResolvedValue(makeWellResponse('mock', 3));

    const map = makeMapStub();

    const { result } = renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        dataSourceId: 'mock',
      }),
    );

    // Wait for initial fetches to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Record the call count after initialization
    const callsAfterInit = mockFetchViewportWells.mock.calls.length;
    expect(result.current.wells).toHaveLength(3);

    // Trigger moveend — same bounds, should serve from cache
    await act(async () => {
      const moveHandler = map._handlers['moveend'];
      if (moveHandler) moveHandler();
      await new Promise((r) => setTimeout(r, 500));
    });

    // No additional fetch calls because cache hit
    expect(mockFetchViewportWells.mock.calls.length).toBe(callsAfterInit);
  });

  it('clears cache and refetches on refetch()', async () => {
    vi.mocked(getSpatialSource).mockReturnValue(makeMockSource('mock'));
    mockFetchViewportWells.mockResolvedValue(makeWellResponse('mock', 2));

    const map = makeMapStub();

    const { result } = renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        dataSourceId: 'mock',
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const callsAfterInit = mockFetchViewportWells.mock.calls.length;

    // Call refetch explicitly — clears cache and forces a new fetch
    mockFetchViewportWells.mockResolvedValue(makeWellResponse('mock', 5));

    await act(async () => {
      result.current.refetch();
      await new Promise((r) => setTimeout(r, 100));
    });

    // At least one new fetch call beyond the init calls
    expect(mockFetchViewportWells.mock.calls.length).toBeGreaterThan(callsAfterInit);
    expect(result.current.wells).toHaveLength(5);
  });

  // ----- Enabled / disabled -----

  it('does not fetch when disabled', () => {
    const map = makeMapStub();

    renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        enabled: false,
      }),
    );

    expect(getSpatialSource).not.toHaveBeenCalled();
  });

  it('does not fetch when map is not loaded', () => {
    const map = makeMapStub();

    renderHook(() =>
      useViewportData({
        map,
        isLoaded: false,
      }),
    );

    expect(getSpatialSource).not.toHaveBeenCalled();
  });

  it('does not fetch when map is null', () => {
    renderHook(() =>
      useViewportData({
        map: null,
        isLoaded: true,
      }),
    );

    expect(getSpatialSource).not.toHaveBeenCalled();
  });

  // ----- Cleanup on unmount -----

  it('unregisters moveend handler on unmount', async () => {
    vi.mocked(getSpatialSource).mockReturnValue(makeMockSource('mock'));
    mockFetchViewportWells.mockResolvedValue(makeWellResponse('mock'));

    const map = makeMapStub();

    const { unmount } = renderHook(() =>
      useViewportData({
        map,
        isLoaded: true,
        dataSourceId: 'mock',
      }),
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    unmount();

    expect(map.off).toHaveBeenCalledWith('moveend', expect.any(Function));
  });
});
