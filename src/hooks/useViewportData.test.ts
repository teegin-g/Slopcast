import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    off: () => {},
    _handlers: handlers,
  };
}

describe('useViewportData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchViewportWells.mockResolvedValue({
      wells: [{ id: 'w-1', name: 'Test Well', lat: 31.5, lng: -102, lateralLength: 7500, status: 'PRODUCING', operator: 'TestOp', formation: 'Wolfcamp' }],
      total_count: 1,
      truncated: false,
      source: 'mock',
    });
  });

  it('uses explicit dataSourceId when provided', async () => {
    const liveSource = makeMockSource('live');
    vi.mocked(getSpatialSource).mockReturnValue(liveSource);
    mockFetchViewportWells.mockResolvedValue({
      wells: [],
      total_count: 0,
      truncated: false,
      source: 'databricks',
    });

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
    mockFetchViewportWells.mockResolvedValue({
      wells: [],
      total_count: 0,
      truncated: false,
      source: 'databricks',
    });

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

  it('falls back to mock on live source error', async () => {
    vi.mocked(getStoredSpatialSourceId).mockReturnValue('live');

    const liveSource = makeMockSource('live');
    const mockSource = makeMockSource('mock');

    vi.mocked(getSpatialSource).mockImplementation((id?: string) => {
      if (id === 'mock') return mockSource;
      return liveSource;
    });

    mockFetchViewportWells
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValueOnce({
        wells: [{ id: 'w-mock', name: 'Mock Well', lat: 31.5, lng: -102, lateralLength: 7500, status: 'PRODUCING', operator: 'MockOp', formation: 'Wolfcamp' }],
        total_count: 1,
        truncated: false,
        source: 'mock',
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
});
