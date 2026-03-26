import { useState, useRef, useCallback, useEffect } from 'react';
import type { WellGroup } from '../../../types';

export function useDebouncedRecalc(
  onUpdateGroup: (group: WellGroup) => void,
  delay = 400,
) {
  const latestGroupRef = useRef<WellGroup | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const debouncedUpdate = useCallback(
    (group: WellGroup) => {
      latestGroupRef.current = group;
      setIsRecalculating(true);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        if (latestGroupRef.current) {
          onUpdateGroup(latestGroupRef.current);
        }
        settleRef.current = setTimeout(() => setIsRecalculating(false), 150);
      }, delay);
    },
    [onUpdateGroup, delay],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (settleRef.current) clearTimeout(settleRef.current);
    };
  }, []);

  return { debouncedUpdate, isRecalculating };
}
