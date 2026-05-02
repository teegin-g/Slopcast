import { useEffect, useState } from 'react';

export function useReducedMotionPreference(forceReducedMotion?: boolean): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => forceReducedMotion ?? false);

  useEffect(() => {
    if (forceReducedMotion !== undefined) {
      setReducedMotion(forceReducedMotion);
      return;
    }
    if (typeof window === 'undefined' || !window.matchMedia) {
      setReducedMotion(false);
      return;
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mql.matches);
    sync();
    mql.addEventListener?.('change', sync);
    return () => mql.removeEventListener?.('change', sync);
  }, [forceReducedMotion]);

  return reducedMotion;
}
