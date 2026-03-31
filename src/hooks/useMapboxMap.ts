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

        map.on('load', () => {
          if (cancelled) return;

          // Add 3D terrain
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
          map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });

          mapRef.current = map;
          setIsLoaded(true);
        });

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
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsLoaded(false);
      }
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
