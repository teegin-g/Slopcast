import { useCallback, useEffect, useMemo, useState } from 'react';

type UseWellSelectionOptions = {
  visibleWellIds: Set<string>;
  filteredWellsCount: number;
  onEmptyVisibleSelection?: () => void;
};

export function useWellSelection({
  visibleWellIds,
  filteredWellsCount,
  onEmptyVisibleSelection,
}: UseWellSelectionOptions) {
  const [selectedWellIds, setSelectedWellIds] = useState<Set<string>>(new Set());

  const selectedVisibleCount = useMemo(() => {
    let count = 0;
    selectedWellIds.forEach((id) => {
      if (visibleWellIds.has(id)) count += 1;
    });
    return count;
  }, [selectedWellIds, visibleWellIds]);

  const handleToggleWell = useCallback(
    (id: string) => {
      if (!visibleWellIds.has(id)) return;
      setSelectedWellIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [visibleWellIds],
  );

  const handleSelectWells = useCallback(
    (ids: string[]) => {
      setSelectedWellIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (visibleWellIds.has(id)) next.add(id);
        });
        return next;
      });
    },
    [visibleWellIds],
  );

  const handleSelectAll = useCallback(() => {
    if (filteredWellsCount === 0) {
      onEmptyVisibleSelection?.();
      return;
    }

    setSelectedWellIds((prev) => {
      const next = new Set(prev);
      if (selectedVisibleCount === filteredWellsCount) {
        visibleWellIds.forEach((id) => next.delete(id));
      } else {
        visibleWellIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [
    filteredWellsCount,
    onEmptyVisibleSelection,
    selectedVisibleCount,
    visibleWellIds,
  ]);

  const handleClearSelection = useCallback(() => {
    setSelectedWellIds(new Set());
  }, []);

  useEffect(() => {
    setSelectedWellIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleWellIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [visibleWellIds]);

  return {
    selectedWellIds,
    setSelectedWellIds,
    selectedVisibleCount,
    handleToggleWell,
    handleSelectWells,
    handleSelectAll,
    handleClearSelection,
  };
}
