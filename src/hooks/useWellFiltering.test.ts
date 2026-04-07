import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

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

// Clear localStorage before each test to avoid cross-test contamination
beforeEach(() => {
  localStorage.clear();
});

describe('useWellFiltering', () => {
  it('builds sorted filter options and shows all wells by default', () => {
    const { result } = renderHook(() => useWellFiltering(wells));

    expect(result.current.operatorOptions).toEqual(['Acme', 'Bravo']);
    expect(result.current.formationOptions).toEqual(['Bone Spring', 'Wolfcamp']);
    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['1', '2', '3']);
    expect(Array.from(result.current.visibleWellIds)).toEqual(['1', '2', '3']);
    expect(Array.from(result.current.dimmedWellIds)).toEqual([]);
    // Empty sets = no filtering
    expect(result.current.operatorFilter.size).toBe(0);
    expect(result.current.formationFilter.size).toBe(0);
    expect(result.current.statusFilter.size).toBe(0);
  });

  it('filters wells via multi-select toggles and resets back to all', () => {
    const { result } = renderHook(() => useWellFiltering(wells));

    act(() => {
      result.current.toggleOperator('Acme');
      result.current.toggleStatus('PERMIT');
    });

    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['3']);
    expect(Array.from(result.current.visibleWellIds)).toEqual(['3']);
    expect(Array.from(result.current.dimmedWellIds)).toEqual(['1', '2']);

    act(() => {
      result.current.handleResetFilters();
    });

    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['1', '2', '3']);
    expect(result.current.operatorFilter.size).toBe(0);
    expect(result.current.statusFilter.size).toBe(0);
  });

  it('supports selecting multiple values for the same filter', () => {
    const { result } = renderHook(() => useWellFiltering(wells));

    // Select both operators
    act(() => {
      result.current.toggleOperator('Acme');
      result.current.toggleOperator('Bravo');
    });

    // Both operators selected = all wells visible
    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['1', '2', '3']);

    // Deselect Bravo
    act(() => {
      result.current.toggleOperator('Bravo');
    });

    // Only Acme wells
    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['1', '3']);
  });

  it('persists filter state to localStorage', () => {
    const { result } = renderHook(() => useWellFiltering(wells));

    act(() => {
      result.current.toggleOperator('Acme');
    });

    const stored = localStorage.getItem('slopcast_filter_operators');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toEqual(['Acme']);
  });

  it('loads persisted filter state from localStorage', () => {
    localStorage.setItem('slopcast_filter_operators', JSON.stringify(['Bravo']));

    const { result } = renderHook(() => useWellFiltering(wells));

    expect(result.current.operatorFilter.has('Bravo')).toBe(true);
    expect(result.current.filteredWells.map((well) => well.id)).toEqual(['2']);
  });

  it('clears localStorage on reset', () => {
    localStorage.setItem('slopcast_filter_operators', JSON.stringify(['Acme']));

    const { result } = renderHook(() => useWellFiltering(wells));

    act(() => {
      result.current.handleResetFilters();
    });

    expect(localStorage.getItem('slopcast_filter_operators')).toBeNull();
  });
});
