import { useEffect, useRef, useState } from 'react';

export interface PerformanceEntry {
  component: string;
  renderTime: number; // milliseconds
  timestamp: number;
}

export interface PerformanceData {
  fps: number;
  entries: PerformanceEntry[];
  slowRenders: PerformanceEntry[]; // renders > 16ms
}

const SLOW_RENDER_THRESHOLD = 16; // ms (60fps target)
const MAX_ENTRIES = 100;
const FPS_UPDATE_INTERVAL = 1000; // Update FPS every second

/**
 * Ring buffer implementation for performance entries
 */
class RingBuffer<T> {
  private buffer: T[] = [];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  push(item: T): void {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(item);
  }

  getAll(): T[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }
}

/**
 * Main performance monitoring hook
 *
 * Tracks:
 * - Frame rate (FPS) using requestAnimationFrame
 * - Component render times via manual markRender calls
 * - Long tasks via PerformanceObserver (if supported)
 * - Identifies slow renders (>16ms)
 *
 * @param enabled - Whether to actively monitor performance
 * @returns PerformanceData with fps, entries, and slowRenders
 */
export function usePerformanceMonitor(enabled: boolean): PerformanceData {
  const [fps, setFps] = useState(60);
  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const [slowRenders, setSlowRenders] = useState<PerformanceEntry[]>([]);

  const entriesBuffer = useRef<RingBuffer<PerformanceEntry>>(null as unknown as RingBuffer<PerformanceEntry>);
  if (entriesBuffer.current === null) entriesBuffer.current = new RingBuffer<PerformanceEntry>(MAX_ENTRIES);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(null as unknown as number);
  if (lastFrameTimeRef.current === null) lastFrameTimeRef.current = performance.now();
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Clean up when disabled
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (fpsIntervalRef.current !== null) {
        clearInterval(fpsIntervalRef.current);
        fpsIntervalRef.current = null;
      }
      entriesBuffer.current.clear();
      setEntries([]);
      setSlowRenders([]);
      setFps(60);
      return;
    }

    // FPS tracking with requestAnimationFrame
    let lastFpsUpdate = performance.now();
    let frameCount = 0;

    const measureFrame = (timestamp: number): void => {
      frameCount++;
      const elapsed = timestamp - lastFpsUpdate;

      // Update FPS every second
      if (elapsed >= FPS_UPDATE_INTERVAL) {
        const currentFps = Math.round((frameCount * 1000) / elapsed);
        setFps(currentFps);
        frameCount = 0;
        lastFpsUpdate = timestamp;
      }

      rafIdRef.current = requestAnimationFrame(measureFrame);
    };

    rafIdRef.current = requestAnimationFrame(measureFrame);

    // PerformanceObserver for measure entries (React DevTools profiling)
    let measureObserver: PerformanceObserver | null = null;
    try {
      measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            const perfEntry: PerformanceEntry = {
              component: entry.name,
              renderTime: entry.duration,
              timestamp: entry.startTime,
            };
            entriesBuffer.current.push(perfEntry);
          }
        }
        updateState();
      });
      measureObserver.observe({ entryTypes: ['measure'] });
    } catch (e) {
      // PerformanceObserver not supported or measure type not available
      console.debug('PerformanceObserver for measure entries not supported');
    }

    // PerformanceObserver for long tasks (if supported)
    let longTaskObserver: PerformanceObserver | null = null;
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            const perfEntry: PerformanceEntry = {
              component: 'longtask',
              renderTime: entry.duration,
              timestamp: entry.startTime,
            };
            entriesBuffer.current.push(perfEntry);
          }
        }
        updateState();
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task observer not supported in this environment
      console.debug('PerformanceObserver for longtask not supported');
    }

    function updateState(): void {
      const allEntries = entriesBuffer.current.getAll();
      const slow = allEntries.filter(e => e.renderTime > SLOW_RENDER_THRESHOLD);
      setEntries(allEntries);
      setSlowRenders(slow);
    }

    // Cleanup on unmount or when disabled
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (measureObserver) {
        measureObserver.disconnect();
      }
      if (longTaskObserver) {
        longTaskObserver.disconnect();
      }
      entriesBuffer.current.clear();
    };
  }, [enabled]);

  return { fps, entries, slowRenders };
}

