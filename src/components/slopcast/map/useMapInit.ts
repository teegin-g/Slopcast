import { useEffect, useState } from 'react';
import type React from 'react';

/**
 * Handles two map-initialization side-effects extracted from MapCommandCenter:
 *
 *  1. Canvas detection — observes the map container for the Mapbox canvas element
 *     to handle StrictMode double-invocation races where `isLoaded` may not flip
 *     in time.  Returns `{ canvasDetected, mapReady }`.
 *
 *  2. Nav & scale controls — adds Mapbox NavigationControl + ScaleControl once
 *     the map is ready, removes them on teardown.
 *
 * Extracted from MapCommandCenter — behavior-preserving only.
 */

interface UseMapInitParams {
  map: any;
  isLoaded: boolean;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
}

interface UseMapInitResult {
  canvasDetected: boolean;
  mapReady: boolean;
}

export function useMapInit({
  map,
  isLoaded,
  mapContainerRef,
}: UseMapInitParams): UseMapInitResult {
  // ── 1. Canvas detection (StrictMode race fallback) ─────────────────────────
  const [canvasDetected, setCanvasDetected] = useState(false);

  useEffect(() => {
    if (isLoaded || canvasDetected) return;
    const container = mapContainerRef.current;
    if (!container) return;
    const observer = new MutationObserver(() => {
      if (container.querySelector('canvas.mapboxgl-canvas')) {
        setCanvasDetected(true);
        observer.disconnect();
      }
    });
    // Check immediately before setting up the observer
    if (container.querySelector('canvas.mapboxgl-canvas')) {
      setCanvasDetected(true);
      return;
    }
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isLoaded, canvasDetected, mapContainerRef]);

  const mapReady = isLoaded || canvasDetected;

  // ── 2. Mapbox navigation + scale controls ──────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded) return;
    let navControl: any = null;
    let scaleControl: any = null;
    (async () => {
      try {
        const mapboxgl = await import('mapbox-gl');
        const mbgl = (mapboxgl as any).default ?? mapboxgl;
        navControl = new mbgl.NavigationControl({ showCompass: false });
        scaleControl = new mbgl.ScaleControl({ maxWidth: 120, unit: 'imperial' });
        map.addControl(navControl, 'bottom-right');
        map.addControl(scaleControl, 'bottom-left');
      } catch {
        // mapbox-gl may not be available in test environments
      }
    })();
    return () => {
      try {
        if (navControl) map.removeControl(navControl);
        if (scaleControl) map.removeControl(scaleControl);
      } catch { /* cleanup best-effort */ }
    };
  }, [map, isLoaded]);

  return { canvasDetected, mapReady };
}
