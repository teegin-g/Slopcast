import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useWellSelection } from './useWellSelection';

describe('useWellSelection', () => {
  it('toggles visible wells and keeps hidden wells out of the selection', () => {
    const { result } = renderHook(() =>
      useWellSelection({
        visibleWellIds: new Set(['a', 'b']),
        filteredWellsCount: 2,
      }),
    );

    act(() => {
      result.current.handleToggleWell('a');
      result.current.handleToggleWell('hidden');
    });

    expect(Array.from(result.current.selectedWellIds)).toEqual(['a']);
    expect(result.current.selectedVisibleCount).toBe(1);
  });

  it('selects all visible wells, toggles them off, and warns when nothing is visible', () => {
    const onEmptyVisibleSelection = vi.fn();
    const { result, rerender } = renderHook(
      ({
        visibleWellIds,
        filteredWellsCount,
      }: {
        visibleWellIds: Set<string>;
        filteredWellsCount: number;
      }) =>
        useWellSelection({
          visibleWellIds,
          filteredWellsCount,
          onEmptyVisibleSelection,
        }),
      {
        initialProps: {
          visibleWellIds: new Set(['a', 'b']),
          filteredWellsCount: 2,
        },
      },
    );

    act(() => {
      result.current.handleSelectAll();
    });

    expect(Array.from(result.current.selectedWellIds)).toEqual(['a', 'b']);

    act(() => {
      result.current.handleSelectAll();
    });

    expect(Array.from(result.current.selectedWellIds)).toEqual([]);

    rerender({
      visibleWellIds: new Set<string>(),
      filteredWellsCount: 0,
    });

    act(() => {
      result.current.handleSelectAll();
    });

    expect(onEmptyVisibleSelection).toHaveBeenCalledTimes(1);
  });

  it('drops selections that become hidden when filters change', () => {
    const { result, rerender } = renderHook(
      ({ visibleWellIds }: { visibleWellIds: Set<string> }) =>
        useWellSelection({
          visibleWellIds,
          filteredWellsCount: visibleWellIds.size,
        }),
      {
        initialProps: {
          visibleWellIds: new Set(['a', 'b']),
        },
      },
    );

    act(() => {
      result.current.handleSelectWells(['a', 'b']);
    });

    expect(Array.from(result.current.selectedWellIds)).toEqual(['a', 'b']);

    rerender({
      visibleWellIds: new Set(['b']),
    });

    expect(Array.from(result.current.selectedWellIds)).toEqual(['b']);
    expect(result.current.selectedVisibleCount).toBe(1);
  });
});
