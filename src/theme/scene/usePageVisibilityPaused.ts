import { useEffect, useState } from 'react';

export function usePageVisibilityPaused(forcePaused?: boolean): boolean {
  const [paused, setPaused] = useState(() => forcePaused ?? (typeof document === 'undefined' ? false : document.hidden));

  useEffect(() => {
    if (forcePaused !== undefined) {
      setPaused(forcePaused);
      return;
    }
    if (typeof document === 'undefined') return;

    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [forcePaused]);

  return paused;
}
