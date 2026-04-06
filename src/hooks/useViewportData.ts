import { useState, useEffect, useRef, useCallback } from 'react';
import type { Well, ViewportBounds, SpatialLayerFilter, SpatialDataSourceId } from '../types';
import { MOCK_WELLS } from '../constants';
import { getSpatialSource, getStoredSpatialSourceId } from '../services/spatialService';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

interface UseViewportDataOptions {
  map: any | null;
  isLoaded: boolean;
  filters?: SpatialLayerFilter;
  dataSourceId?: SpatialDataSourceId;
  debounceMs?: number;
  enabled?: boolean;
  includeLaterals?: boolean;
}

interface UseViewportDataResult {
  wells: Well[];
  isLoading: boolean;
  error: string | null;
  source: 'databricks' | 'mock' | null;
  totalCount: number;
  truncated: boolean;
  fallbackActive: boolean;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapboxBoundsToViewport(mapBounds: any): ViewportBounds {
  const sw = mapBounds.getSouthWest();
  const ne = mapBounds.getNorthEast();
  return {
    sw_lat: sw.lat,
    sw_lng: sw.lng,
    ne_lat: ne.lat,
    ne_lng: ne.lng,
  };
}

function boundsToKey(bounds: ViewportBounds): string {
  return [
    bounds.sw_lat.toFixed(3),
    bounds.sw_lng.toFixed(3),
    bounds.ne_lat.toFixed(3),
    bounds.ne_lng.toFixed(3),
  ].join(',');
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const MAX_CACHE_SIZE = 8;

export function useViewportData(options: UseViewportDataOptions): UseViewportDataResult {
  const {
    map,
    isLoaded,
    filters,
    dataSourceId,
    debounceMs = 400,
    enabled = true,
    includeLaterals = false,
  } = options;

  const [wells, setWells] = useState<Well[]>(MOCK_WELLS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'databricks' | 'mock' | null>(null);
  const [totalCount, setTotalCount] = useState(MOCK_WELLS.length);
  const [truncated, setTruncated] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);

  const cacheRef = useRef(new Map<string, { wells: Well[]; totalCount: number; truncated: boolean; source: 'databricks' | 'mock' }>());
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWells = useCallback(async () => {
    if (!map || !isLoaded || !enabled) return;

    const mapBounds = map.getBounds();
    if (!mapBounds) return;

    const bounds = mapboxBoundsToViewport(mapBounds);
    const key = boundsToKey(bounds);

    // Check cache
    const cached = cacheRef.current.get(key);
    if (cached) {
      setWells(cached.wells);
      setTotalCount(cached.totalCount);
      setTruncated(cached.truncated);
      setSource(cached.source);
      setError(null);
      return;
    }

    // Abort previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    const sourceId = dataSourceId ?? getStoredSpatialSourceId();
    const spatialSource = getSpatialSource(sourceId);

    try {
      const result = await spatialSource.fetchViewportWells(bounds, filters, { includeLaterals });

      // Store in cache, evict oldest if full
      if (cacheRef.current.size >= MAX_CACHE_SIZE) {
        const oldest = cacheRef.current.keys().next().value;
        if (oldest !== undefined) {
          cacheRef.current.delete(oldest);
        }
      }
      cacheRef.current.set(key, {
        wells: result.wells,
        totalCount: result.total_count,
        truncated: result.truncated,
        source: result.source,
      });

      setWells(result.wells);
      setTotalCount(result.total_count);
      setTruncated(result.truncated);
      setSource(result.source);
      setFallbackActive(false);
    } catch (err) {
      // If live source failed, try mock fallback
      if (sourceId === 'live') {
        try {
          const mockResult = await getSpatialSource('mock').fetchViewportWells(bounds, filters);
          setWells(mockResult.wells);
          setTotalCount(mockResult.total_count);
          setTruncated(mockResult.truncated);
          setSource(mockResult.source);
          setFallbackActive(true);
          setError(null);
          return;
        } catch {
          // Fallback also failed — fall through to error
        }
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch viewport wells');
    } finally {
      setIsLoading(false);
    }
  }, [map, isLoaded, enabled, dataSourceId, filters, includeLaterals]);

  // Listen to map moveend with debounce
  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;

    const handleMoveEnd = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fetchWells();
      }, debounceMs);
    };

    map.on('moveend', handleMoveEnd);

    // Initial fetch
    fetchWells();

    return () => {
      map.off('moveend', handleMoveEnd);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map, isLoaded, enabled, fetchWells, debounceMs]);

  // Clear cache and refetch on filter change
  useEffect(() => {
    cacheRef.current.clear();
    if (map && isLoaded && enabled) {
      fetchWells();
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    cacheRef.current.clear();
    fetchWells();
  }, [fetchWells]);

  return {
    wells,
    isLoading,
    error,
    source,
    totalCount,
    truncated,
    fallbackActive,
    refetch,
  };
}
