import { useEffect, useRef, useState, useCallback } from 'react';
import type { MapViewState } from '../types';

const MAPBOX_TOKEN = (typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_MAPBOX_TOKEN
  : '')?.trim() ?? '';

const PERMIAN_CENTER: [number, number] = [-102.3, 31.9];

interface UseMapboxMapOptions {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

interface UseMapboxMapResult {
  map: any | null;
  isLoaded: boolean;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  viewState: MapViewState;
  setStyle: (styleUrl: string) => void;
}

export function useMapboxMap(options: UseMapboxMapOptions = {}): UseMapboxMapResult {
  const {
    center = PERMIAN_CENTER,
    zoom = 8,
    pitch = 45,
    bearing = 0,
  } = options;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewState, setViewState] = useState<MapViewState>({ center, zoom, pitch, bearing });

  const setStyle = useCallback((styleUrl: string) => {
    if (mapRef.current) {
      mapRef.current.setStyle(styleUrl);
    }
  }, []);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;

    let cancelled = false;
    // Track the map instance locally so cleanup can always remove it,
    // even if it was created after the async import resolved.
    let mapInstance: any = null;

    (async () => {
      try {
        const mapboxgl = await import('mapbox-gl');
        await import('mapbox-gl/dist/mapbox-gl.css');
        if (cancelled) return;

        (mapboxgl as any).default.accessToken = MAPBOX_TOKEN;
        const map = new (mapboxgl as any).default.Map({
          container: mapContainerRef.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center,
          zoom,
          pitch,
          bearing,
          attributionControl: false,
        });

        mapInstance = map;

        const markReady = () => {
          if (cancelled || mapRef.current) return;

          // Add 3D terrain (best-effort — may fail in headless/WebGL-limited envs)
          try {
            if (!map.getSource('mapbox-dem')) {
              map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14,
              });
              map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });
            }
          } catch {
            // Terrain is optional
          }

          mapRef.current = map;
          setIsLoaded(true);
        };

        // Try the load event first
        map.on('load', markReady);

        // Fallback: poll for style loaded state in case the event was missed
        const poll = setInterval(() => {
          if (cancelled) { clearInterval(poll); return; }
          if (map.isStyleLoaded()) { clearInterval(poll); markReady(); }
        }, 200);
        setTimeout(() => clearInterval(poll), 30000);

        // Track view state changes
        map.on('moveend', () => {
          if (cancelled) return;
          const c = map.getCenter();
          setViewState({
            center: [c.lng, c.lat],
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
          });
        });
      } catch (err) {
        console.error('[useMapboxMap] Failed to initialize:', err);
      }
    })();

    return () => {
      cancelled = true;
      // Remove the locally-tracked instance (handles StrictMode where
      // mapRef.current may not yet be set when cleanup runs).
      // Wrap in try/catch: React may remove the container DOM before
      // passive cleanup effects run, causing Mapbox's .remove() to
      // throw when it tries to access the detached node.
      try { mapInstance?.remove(); } catch { /* container already detached */ }
      mapInstance = null;
      try { mapRef.current?.remove(); } catch { /* container already detached */ }
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle container resize
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;
    const observer = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return {
    map: mapRef.current,
    isLoaded,
    mapContainerRef,
    viewState,
    setStyle,
  };
}
