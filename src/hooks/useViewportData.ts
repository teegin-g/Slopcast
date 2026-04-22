import { useState, useEffect, useRef, useCallback } from 'react';
import type { Well, ViewportBounds, SpatialLayerFilter, SpatialDataSourceId } from '../types';
import { MOCK_WELLS } from '../constants';
import { getSpatialSource, getStoredSpatialSourceId, type DetailLevel } from '../services/spatialService';

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
  isLoadingTrajectories: boolean;
  error: string | null;
  /**
   * Set when the phase-2 trajectory fetch fails. Phase-1 points are still
   * valid — consumers can surface this as a non-fatal banner ("3D laterals
   * unavailable — showing 2D pins").
   */
  trajectoryError: string | null;
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

/** Merge trajectory data from a full-detail response into existing wells. */
function mergeTrajectories(existing: Well[], withTrajectories: Well[]): Well[] {
  const trajectoryMap = new Map<string, Well['trajectory']>();
  for (const w of withTrajectories) {
    if (w.trajectory) {
      trajectoryMap.set(w.id, w.trajectory);
    }
  }
  return existing.map(w => {
    const traj = trajectoryMap.get(w.id);
    return traj ? { ...w, trajectory: traj } : w;
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const MAX_CACHE_SIZE = 8;
const MIN_LATERAL_ZOOM = 10;

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
  const [isLoadingTrajectories, setIsLoadingTrajectories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trajectoryError, setTrajectoryError] = useState<string | null>(null);
  const [source, setSource] = useState<'databricks' | 'mock' | null>(null);
  const [totalCount, setTotalCount] = useState(MOCK_WELLS.length);
  const [truncated, setTruncated] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);

  const cacheRef = useRef(new Map<string, { wells: Well[]; totalCount: number; truncated: boolean; source: 'databricks' | 'mock' }>());
  const abortRef = useRef<AbortController | null>(null);
  const trajectoryAbortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWells = useCallback(async () => {
    if (!map || !isLoaded || !enabled) return;

    const mapBounds = map.getBounds();
    if (!mapBounds) return;

    const bounds = mapboxBoundsToViewport(mapBounds);
    const zoom = map.getZoom();

    // Always cancel any in-flight phase 2 when starting a new fetch cycle
    trajectoryAbortRef.current?.abort();
    setIsLoadingTrajectories(false);

    // Phase 1: summary (or points at low zoom), never full
    const phase1Detail: DetailLevel = zoom < 10 ? 'points' : 'summary';
    const sourceId = dataSourceId ?? getStoredSpatialSourceId();
    const spatialSource = getSpatialSource(sourceId);

    // Cache key MUST include sourceId so toggling live <-> mock never serves
    // stale wells from the other source for the same viewport bounds.
    const phase1Key = `${sourceId}:${boundsToKey(bounds)}:${phase1Detail}`;

    // Check phase 1 cache
    const cached1 = cacheRef.current.get(phase1Key);
    if (cached1) {
      setWells(cached1.wells);
      setTotalCount(cached1.totalCount);
      setTruncated(cached1.truncated);
      setSource(cached1.source);
      setError(null);
    } else {
      // Abort previous in-flight phase 1
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const result = await spatialSource.fetchViewportWells(bounds, filters, {
          detailLevel: phase1Detail,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        // Cache eviction
        if (cacheRef.current.size >= MAX_CACHE_SIZE) {
          const oldest = cacheRef.current.keys().next().value;
          if (oldest !== undefined) cacheRef.current.delete(oldest);
        }
        cacheRef.current.set(phase1Key, {
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
        if ((err as Error).name === 'AbortError') return;

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
            setIsLoading(false);
            return;
          } catch {
            // Fallback also failed — fall through to error
          }
        }
        setError(err instanceof Error ? err.message : 'Failed to fetch viewport wells');
      } finally {
        setIsLoading(false);
      }
    }

    // -----------------------------------------------------------------------
    // Phase 2: fetch trajectories if laterals on AND zoom >= 10
    // -----------------------------------------------------------------------
    const needsTrajectories = includeLaterals && zoom >= MIN_LATERAL_ZOOM;
    if (!needsTrajectories) return;

    const phase2Key = `${sourceId}:${boundsToKey(bounds)}:full`;
    const cached2 = cacheRef.current.get(phase2Key);

    if (cached2) {
      // Merge cached trajectories — synchronous, batched with phase 1 setState
      setWells(prev => mergeTrajectories(prev, cached2.wells));
      setTrajectoryError(null);
    } else {
      const trajController = new AbortController();
      trajectoryAbortRef.current = trajController;
      setIsLoadingTrajectories(true);
      setTrajectoryError(null);

      try {
        const fullResult = await spatialSource.fetchViewportWells(bounds, filters, {
          detailLevel: 'full',
          includeLaterals: true,
          signal: trajController.signal,
          zoom: Math.round(zoom),
        });

        if (trajController.signal.aborted) return;

        // Cache the full result
        if (cacheRef.current.size >= MAX_CACHE_SIZE) {
          const oldest = cacheRef.current.keys().next().value;
          if (oldest !== undefined) cacheRef.current.delete(oldest);
        }
        cacheRef.current.set(phase2Key, {
          wells: fullResult.wells,
          totalCount: fullResult.total_count,
          truncated: fullResult.truncated,
          source: fullResult.source,
        });

        // Merge trajectories into existing wells (don't replace — full has lower limit)
        setWells(prev => mergeTrajectories(prev, fullResult.wells));
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Phase-1 points are already rendered. Surface the error so the UI can
        // show a non-fatal banner instead of silently hiding 3D laterals.
        const msg = err instanceof Error ? err.message : 'Failed to load 3D laterals';
        setTrajectoryError(msg);
      } finally {
        setIsLoadingTrajectories(false);
      }
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
      trajectoryAbortRef.current?.abort();
    };
  }, [map, isLoaded, enabled, fetchWells, debounceMs]);

  // Clear cache and refetch on filter change
  useEffect(() => {
    cacheRef.current.clear();
    if (map && isLoaded && enabled) {
      fetchWells();
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear cache and refetch when the data source toggles (live <-> mock).
  // Without this, the same viewport bounds could serve stale wells from the
  // previous source because the cache key was bounds-only.
  useEffect(() => {
    cacheRef.current.clear();
    setFallbackActive(false);
    setTrajectoryError(null);
    if (map && isLoaded && enabled) {
      fetchWells();
    }
  }, [dataSourceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(() => {
    cacheRef.current.clear();
    fetchWells();
  }, [fetchWells]);

  return {
    wells,
    isLoading,
    isLoadingTrajectories,
    error,
    trajectoryError,
    source,
    totalCount,
    truncated,
    fallbackActive,
    refetch,
  };
}
