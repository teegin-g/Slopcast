import { useState, useMemo, useCallback } from 'react';
import type { ColumnFiltersState } from '@tanstack/react-table';

// Module-level store survives AnimatePresence unmount/remount.
// Keyed by tableId so wells and cash flow tables have independent filters.
const filterStore = new Map<string, { globalFilter: string; columnFilters: ColumnFiltersState }>();

export interface ActiveFilter {
  id: string;
  value: string;
  label: string;
}

export function useTableFilters(tableId: string) {
  const stored = filterStore.get(tableId);

  const [globalFilter, setGlobalFilterState] = useState<string>(stored?.globalFilter ?? '');
  const [columnFilters, setColumnFiltersState] = useState<ColumnFiltersState>(stored?.columnFilters ?? []);

  const setGlobalFilter = useCallback((value: string) => {
    setGlobalFilterState(value);
    const current = filterStore.get(tableId) ?? { globalFilter: '', columnFilters: [] };
    filterStore.set(tableId, { ...current, globalFilter: value });
  }, [tableId]);

  const setColumnFilters = useCallback((updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
    setColumnFiltersState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const current = filterStore.get(tableId) ?? { globalFilter: '', columnFilters: [] };
      filterStore.set(tableId, { ...current, columnFilters: next });
      return next;
    });
  }, [tableId]);

  const activeFilters: ActiveFilter[] = useMemo(() => {
    return columnFilters
      .filter(f => f.value !== undefined && f.value !== '' && f.value !== 'ALL')
      .map(f => ({
        id: f.id,
        value: String(f.value),
        label: `${f.id}: ${String(f.value)}`,
      }));
  }, [columnFilters]);

  const removeFilter = useCallback((id: string) => {
    setColumnFilters(prev => prev.filter(f => f.id !== id));
  }, [setColumnFilters]);

  return {
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilters,
    activeFilters,
    removeFilter,
  };
}
