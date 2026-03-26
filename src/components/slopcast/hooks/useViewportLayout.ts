import { useEffect, useState } from 'react';

export type ViewportLayout = 'mobile' | 'mid' | 'desktop' | 'wide';

function getViewportLayout(width: number): ViewportLayout {
  if (width < 1024) return 'mobile';
  if (width < 1320) return 'mid';
  if (width < 1920) return 'desktop';
  return 'wide';
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
