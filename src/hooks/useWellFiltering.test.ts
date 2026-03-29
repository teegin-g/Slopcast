import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Well } from '../types';
import { useWellFiltering } from './useWellFiltering';

const makeWell = (
  id: string,
  operator: string,
  formation: string,
  status: Well['status'],
): Well => ({
  id,
  name: `Well ${id}`,
  lat: 31.5,
  lng: -102.3,
  lateralLength: 10000,
  operator,
  formation,
  status,
});

const wells: Well[] = [
  makeWell('1', 'Acme', 'Wolfcamp', 'PRODUCING'),
  makeWell('2', 'Bravo', 'Bone Spring', 'DUC'),
  makeWell('3', 'Acme', 'Wolfcamp', 'PERMIT'),
];

describe('useWellFiltering', () => {
  it('builds sorted filter options and shows all wells by default', () => {
    const { result } = renderHook(() => useWellFiltering(wells));

    expect(result.current.operatorOptions).toEqual(['Acme', 'Bravo']);
    expect(result.current.formationOptions).toEqual(['Bone Spring', 'Wolfcamp']);
    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['1', '2', '3']);
    expect(Array.from(result.current.visibleWellIds)).toEqual(['1', '2', '3']);
    expect(Array.from(result.current.dimmedWellIds)).toEqual([]);
  });

  it('filters wells and resets back to all', () => {
    const { result } = renderHook(() => useWellFiltering(wells));

    act(() => {
      result.current.setOperatorFilter('Acme');
      result.current.setStatusFilter('PERMIT');
    });

    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['3']);
    expect(Array.from(result.current.visibleWellIds)).toEqual(['3']);
    expect(Array.from(result.current.dimmedWellIds)).toEqual(['1', '2']);

    act(() => {
      result.current.handleResetFilters();
    });

    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['1', '2', '3']);
  });
});
