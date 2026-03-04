import { useState, useEffect, useCallback } from 'react';
import { DebugOverlay } from './DebugOverlay';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { detectOverlapsAsync } from '@/utils/overlapDetector';
import { useViewportLayout } from '@/components/slopcast/hooks/useViewportLayout';
import type { OverlapViolation } from '@/utils/overlapDetector';

const OVERLAP_SCAN_INTERVAL = 3000; // ms

export function DebugProvider() {
  const [enabled, setEnabled] = useState(false);
  const [overlaps, setOverlaps] = useState<OverlapViolation[]>([]);
  const perfData = usePerformanceMonitor(enabled);
  const layout = useViewportLayout();

  // Listen for Ctrl+Shift+D to know when overlay becomes visible
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setEnabled(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Periodic overlap scanning when enabled
  const scanOverlaps = useCallback(async () => {
    if (!enabled) return;
    const results = await detectOverlapsAsync();
    setOverlaps(results);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setOverlaps([]);
      return;
    }
    scanOverlaps();
    const id = setInterval(scanOverlaps, OVERLAP_SCAN_INTERVAL);
    return () => clearInterval(id);
  }, [enabled, scanOverlaps]);

  const viewport = {
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    breakpoint: layout,
    isMobile: layout === 'mobile',
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  };

  return (
    <DebugOverlay
      overlaps={overlaps}
      performance={perfData}
      viewport={viewport}
    />
  );
}
