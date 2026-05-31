import { useEffect, useRef, useState } from 'react';

const PERMIAN_CENTER = { lat: 31.9, lng: -102.3 };

export interface UseMapboxGLResult {
  mapboxContainerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.MutableRefObject<any>;
  useMapbox: boolean;
  setUseMapbox: React.Dispatch<React.SetStateAction<boolean>>;
  mapboxLoaded: boolean;
  isSatellite: boolean;
  setIsSatellite: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Owns the Mapbox GL map: lazy init when a token is present, satellite/dark
 * style toggle, and the map instance ref. Behavior preserved exactly from the
 * original MapVisualizer effects.
 */
export function useMapboxGL(mapboxToken: string): UseMapboxGLResult {
  const mapboxContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [useMapbox, setUseMapbox] = useState(() => !!mapboxToken);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);

  // Initialize Mapbox GL if token available
  useEffect(() => {
    if (!useMapbox || !mapboxContainerRef.current || mapRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const mapboxgl = await import('mapbox-gl');
        // @ts-ignore - Vite handles CSS imports at runtime
        await import('mapbox-gl/dist/mapbox-gl.css');
        if (cancelled) return;

        (mapboxgl as any).default.accessToken = mapboxToken;
        const map = new (mapboxgl as any).default.Map({
          container: mapboxContainerRef.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [PERMIAN_CENTER.lng, PERMIAN_CENTER.lat],
          zoom: 8,
          attributionControl: false,
        });

        map.on('load', () => {
          if (cancelled) return;
          mapRef.current = map;
          setMapboxLoaded(true);
        });
      } catch {
        setUseMapbox(false);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapboxLoaded(false);
      }
    };
  }, [useMapbox]);

  // Toggle satellite style
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded) return;
    const style = isSatellite
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v11';
    mapRef.current.setStyle(style);
  }, [isSatellite, mapboxLoaded]);

  return {
    mapboxContainerRef,
    mapRef,
    useMapbox,
    setUseMapbox,
    mapboxLoaded,
    isSatellite,
    setIsSatellite,
  };
}
