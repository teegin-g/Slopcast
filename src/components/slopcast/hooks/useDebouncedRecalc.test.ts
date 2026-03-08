import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedRecalc } from './useDebouncedRecalc';
import type { WellGroup } from '../../../types';

const makeGroup = (name: string): WellGroup => ({
  id: `g-${name}`,
  name,
  color: '#000',
  wellIds: new Set(),
  typeCurve: { qi: 850, b: 1.2, di: 65, terminalDecline: 6, gorMcfPerBbl: 2.5 },
  capex: { rigCount: 1, drillDurationDays: 18, stimDurationDays: 12, rigStartDate: '2025-01-01', items: [] },
  opex: { segments: [] },
  ownership: { baseNri: 0.75, baseCostInterest: 1.0, agreements: [] },
});

describe('useDebouncedRecalc', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onUpdateGroup after delay with latest group', () => {
    const onUpdateGroup = vi.fn();
    const { result } = renderHook(() => useDebouncedRecalc(onUpdateGroup, 400));

    act(() => {
      result.current.debouncedUpdate(makeGroup('A'));
    });

    expect(onUpdateGroup).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onUpdateGroup).toHaveBeenCalledTimes(1);
    expect(onUpdateGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'A' }));
  });

  it('multiple calls within window: only last group sent', () => {
    const onUpdateGroup = vi.fn();
    const { result } = renderHook(() => useDebouncedRecalc(onUpdateGroup, 400));

    act(() => {
      result.current.debouncedUpdate(makeGroup('first'));
      result.current.debouncedUpdate(makeGroup('second'));
      result.current.debouncedUpdate(makeGroup('last'));
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onUpdateGroup).toHaveBeenCalledTimes(1);
    expect(onUpdateGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'last' }));
  });

  it('isRecalculating is true during debounce window', () => {
    const onUpdateGroup = vi.fn();
    const { result } = renderHook(() => useDebouncedRecalc(onUpdateGroup, 400));

    expect(result.current.isRecalculating).toBe(false);

    act(() => {
      result.current.debouncedUpdate(makeGroup('A'));
    });

    expect(result.current.isRecalculating).toBe(true);
  });

  it('isRecalculating becomes false after recalc + 150ms settle', () => {
    const onUpdateGroup = vi.fn();
    const { result } = renderHook(() => useDebouncedRecalc(onUpdateGroup, 400));

    act(() => {
      result.current.debouncedUpdate(makeGroup('A'));
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Still recalculating during settle period
    expect(result.current.isRecalculating).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.isRecalculating).toBe(false);
  });

  it('cleanup on unmount clears pending timers', () => {
    const onUpdateGroup = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedRecalc(onUpdateGroup, 400));

    act(() => {
      result.current.debouncedUpdate(makeGroup('A'));
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onUpdateGroup).not.toHaveBeenCalled();
  });
});
