import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDockMode } from './useDockMode';

describe('useDockMode', () => {
  it('returns group mode and defaultGroupTab when selectionCount is 0', () => {
    const { result } = renderHook(() => useDockMode(0, 'forecast', 'summary'));
    expect(result.current.mode).toBe('group');
    expect(result.current.activeTab).toBe('forecast');
  });

  it('returns selection mode and defaultSelectionTab when selectionCount > 0', () => {
    const { result } = renderHook(() => useDockMode(3, 'forecast', 'summary'));
    expect(result.current.mode).toBe('selection');
    expect(result.current.activeTab).toBe('summary');
  });

  it('remembers tab per mode across switches', () => {
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useDockMode(count, 'forecast', 'summary'),
      { initialProps: { count: 0 } }
    );

    // Start in group mode, set group tab to 'economics'
    expect(result.current.mode).toBe('group');
    act(() => {
      result.current.setActiveTab('economics');
    });
    expect(result.current.activeTab).toBe('economics');

    // Switch to selection mode (selectionCount=2) → default selection tab
    rerender({ count: 2 });
    expect(result.current.mode).toBe('selection');
    expect(result.current.activeTab).toBe('summary');

    // Set selection tab to 'probit'
    act(() => {
      result.current.setActiveTab('probit');
    });
    expect(result.current.activeTab).toBe('probit');

    // Switch back to group mode → remembered 'economics', NOT reset to default
    rerender({ count: 0 });
    expect(result.current.mode).toBe('group');
    expect(result.current.activeTab).toBe('economics');

    // Switch back to selection → remembered 'probit'
    rerender({ count: 2 });
    expect(result.current.mode).toBe('selection');
    expect(result.current.activeTab).toBe('probit');
  });

  it('setActiveTab writes to current mode only — group tab change does not affect selection tab', () => {
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useDockMode(count, 'forecast', 'summary'),
      { initialProps: { count: 0 } }
    );

    // In group mode, set group tab
    act(() => {
      result.current.setActiveTab('economics');
    });

    // Switch to selection mode — selection tab should still be the default
    rerender({ count: 5 });
    expect(result.current.mode).toBe('selection');
    expect(result.current.activeTab).toBe('summary');
  });

  it('setActiveTab writes to current mode only — selection tab change does not affect group tab', () => {
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useDockMode(count, 'forecast', 'summary'),
      { initialProps: { count: 3 } }
    );

    // In selection mode, set selection tab
    act(() => {
      result.current.setActiveTab('probit');
    });

    // Switch to group mode — group tab should still be the default
    rerender({ count: 0 });
    expect(result.current.mode).toBe('group');
    expect(result.current.activeTab).toBe('forecast');
  });
});
