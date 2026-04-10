import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Well } from '../types';

// ─── localStorage persistence ──────────────────────────────────────

const STORAGE_PREFIX = 'slopcast_filter_';

function loadFilter(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch { /* ignore corrupt data */ }
  return new Set(); // empty = "all" (no filtering)
}

function saveFilter(key: string, values: Set<string>): void {
  if (values.size === 0) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } else {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify([...values]));
  }
}

// ─── Hook ──────────────────────────────────────────────────────────

export function useWellFiltering(wells: Well[]) {
  const [operatorFilter, setOperatorFilter] = useState<Set<string>>(() => loadFilter('operators'));
  const [formationFilter, setFormationFilter] = useState<Set<string>>(() => loadFilter('formations'));
  const [statusFilter, setStatusFilter] = useState<Set<string>>(() => loadFilter('statuses'));

  // Persist on change
  useEffect(() => { saveFilter('operators', operatorFilter); }, [operatorFilter]);
  useEffect(() => { saveFilter('formations', formationFilter); }, [formationFilter]);
  useEffect(() => { saveFilter('statuses', statusFilter); }, [statusFilter]);

  // Toggle functions (add/remove from set)
  const toggleOperator = useCallback((op: string) => {
    setOperatorFilter(prev => {
      const next = new Set(prev);
      if (next.has(op)) next.delete(op); else next.add(op);
      return next;
    });
  }, []);

  const toggleFormation = useCallback((f: string) => {
    setFormationFilter(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  }, []);

  const toggleStatus = useCallback((s: string) => {
    setStatusFilter(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }, []);

  const operatorOptions = useMemo(() => {
    return Array.from(new Set(wells.map((well) => well.operator))).sort();
  }, [wells]);

  const formationOptions = useMemo(() => {
    return Array.from(new Set(wells.map((well) => well.formation))).sort();
  }, [wells]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(wells.map((well) => well.status)));
  }, [wells]);

  // Filter logic: empty set = show all (no filtering)
  const filteredWells = useMemo(() => {
    return wells.filter((well) => {
      if (operatorFilter.size > 0 && !operatorFilter.has(well.operator)) return false;
      if (formationFilter.size > 0 && !formationFilter.has(well.formation)) return false;
      if (statusFilter.size > 0 && !statusFilter.has(well.status)) return false;
      return true;
    });
  }, [formationFilter, operatorFilter, statusFilter, wells]);

  const visibleWellIds = useMemo(() => {
    return new Set(filteredWells.map((well) => well.id));
  }, [filteredWells]);

  const dimmedWellIds = useMemo(() => {
    const ids = new Set<string>();
    wells.forEach((well) => {
      if (!visibleWellIds.has(well.id)) ids.add(well.id);
    });
    return ids;
  }, [visibleWellIds, wells]);

  const handleResetFilters = useCallback(() => {
    setOperatorFilter(new Set());
    setFormationFilter(new Set());
    setStatusFilter(new Set());
  }, []);

  return {
    operatorFilter,
    toggleOperator,
    replaceOperatorFilter: setOperatorFilter,
    formationFilter,
    toggleFormation,
    replaceFormationFilter: setFormationFilter,
    statusFilter,
    toggleStatus,
    replaceStatusFilter: setStatusFilter,
    operatorOptions,
    formationOptions,
    statusOptions,
    filteredWells,
    visibleWellIds,
    dimmedWellIds,
    handleResetFilters,
  };
}
