import { useCallback, useMemo, useState } from 'react';

import type { Well } from '../types';

export function useWellFiltering(wells: Well[]) {
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [formationFilter, setFormationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<Well['status'] | 'ALL'>('ALL');

  const operatorOptions = useMemo(() => {
    return Array.from(new Set(wells.map((well) => well.operator))).sort();
  }, [wells]);

  const formationOptions = useMemo(() => {
    return Array.from(new Set(wells.map((well) => well.formation))).sort();
  }, [wells]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(wells.map((well) => well.status)));
  }, [wells]);

  const filteredWells = useMemo(() => {
    return wells.filter((well) => {
      if (operatorFilter !== 'ALL' && well.operator !== operatorFilter) return false;
      if (formationFilter !== 'ALL' && well.formation !== formationFilter) return false;
      if (statusFilter !== 'ALL' && well.status !== statusFilter) return false;
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
    setOperatorFilter('ALL');
    setFormationFilter('ALL');
    setStatusFilter('ALL');
  }, []);

  return {
    operatorFilter,
    setOperatorFilter,
    formationFilter,
    setFormationFilter,
    statusFilter,
    setStatusFilter,
    operatorOptions,
    formationOptions,
    statusOptions,
    filteredWells,
    visibleWellIds,
    dimmedWellIds,
    handleResetFilters,
  };
}
