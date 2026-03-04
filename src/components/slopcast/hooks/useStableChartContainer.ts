import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

type Size = {
  width: number;
  height: number;
};

type StableChartResult = {
  containerRef: (node: HTMLDivElement | null) => void;
  width: number;
  height: number;
  ready: boolean;
};

const MIN_WIDTH = 40;
const MIN_HEIGHT = 40;

export function useStableChartContainer(deps: DependencyList = []): StableChartResult {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const readSize = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const nextWidth = Math.max(0, Math.floor(rect.width));
    const nextHeight = Math.max(0, Math.floor(rect.height));

    setSize(prev => {
      if (prev.width === nextWidth && prev.height === nextHeight) return prev;
      return { width: nextWidth, height: nextHeight };
    });
  }, []);

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      nodeRef.current = node;

      if (!node || typeof ResizeObserver === 'undefined') {
        readSize();
        return;
      }

      const observer = new ResizeObserver(() => readSize());
      observer.observe(node);
      observerRef.current = observer;
      readSize();
    },
    [readSize]
  );

  useEffect(() => {
    readSize();
    const id = window.requestAnimationFrame(readSize);
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return {
    containerRef,
    width: size.width,
    height: size.height,
    ready: size.width >= MIN_WIDTH && size.height >= MIN_HEIGHT,
  };
}
