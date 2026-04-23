import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockFetchViewportWells = vi.fn();

vi.mock('../services/spatialService', () => ({
  getSpatialSource: () => ({
    id: 'mock',
    label: 'Mock (Client)',
    fetchViewportWells: mockFetchViewportWells,
    getAvailableLayers: vi.fn(),
  }),
  getStoredSpatialSourceId: () => 'mock' as const,
}));

vi.mock('../constants', () => ({
  MOCK_WELLS: [
    {
      id: 'seed-1',
      name: 'Seed Well',
      lat: 31.9,
      lng: -102.3,
      lateralLength: 10000,
      status: 'PRODUCING',
      operator: 'Seed Op',
      formation: 'Wolfcamp A',
    },
  ],
}));

import { useViewportData } from './useViewportData';

describe('useViewportData initial state', () => {
  it('starts empty before any viewport fetch succeeds', () => {
    const { result } = renderHook(() =>
      useViewportData({ map: null, isLoaded: false }),
    );

    expect(result.current.wells).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.source).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockFetchViewportWells).not.toHaveBeenCalled();
  });
});
