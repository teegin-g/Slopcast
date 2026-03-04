import { useEffect, useState } from 'react';

export type ViewportLayout = 'mobile' | 'mid' | 'desktop';

function getViewportLayout(width: number): ViewportLayout {
  if (width < 1024) return 'mobile';
  if (width < 1320) return 'mid';
  return 'desktop';
}

export function useViewportLayout(): ViewportLayout {
  const [layout, setLayout] = useState<ViewportLayout>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getViewportLayout(window.innerWidth);
  });

  useEffect(() => {
    const onResize = () => {
      setLayout(getViewportLayout(window.innerWidth));
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return layout;
}
