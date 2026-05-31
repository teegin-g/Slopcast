import { useState, useEffect, useRef, useCallback } from 'react';
import type { Well, ViewportBounds, SpatialLayerFilter, SpatialDataSourceId, SpatialRenderProfile } from '../types';
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
  diagnostics: ViewportDataDiagnostics;
  refetch: () => void;
}

export interface ViewportDataDiagnostics {
  phase1FetchCount: number;
  phase2FetchCount: number;
  phase1CacheHits: number;
  phase2CacheHits: number;
  lastPhase1Ms: number;
  lastPhase2Ms: number;
  lastPhase2ZoomBucket: number | null;
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

function tileGridDegrees(zoomBucket: number): number {
  if (zoomBucket >= 14) return 0.025;
  if (zoomBucket >= 12) return 0.05;
  if (zoomBucket >= 10) return 0.1;
  if (zoomBucket >= 8) return 0.25;
  return 0.5;
}

export function expandBoundsToTileBounds(bounds: ViewportBounds, zoom: number): ViewportBounds {
  const grid = tileGridDegrees(Math.round(zoom));
  return {
    sw_lat: Math.floor(bounds.sw_lat / grid) * grid,
    sw_lng: Math.floor(bounds.sw_lng / grid) * grid,
    ne_lat: Math.ceil(bounds.ne_lat / grid) * grid,
    ne_lng: Math.ceil(bounds.ne_lng / grid) * grid,
  };
}

export function viewportBoundsToTileCacheKey(bounds: ViewportBounds, zoom: number): string {
  const zoomBucket = Math.round(zoom);
  const expanded = expandBoundsToTileBounds(bounds, zoomBucket);
  return [
    `z${zoomBucket}`,
    expanded.sw_lat.toFixed(4),
    expanded.sw_lng.toFixed(4),
    expanded.ne_lat.toFixed(4),
    expanded.ne_lng.toFixed(4),
  ].join(',');
}

export function renderProfileForPhase(detailLevel: DetailLevel, zoom: number): SpatialRenderProfile {
  if (detailLevel === 'full') {
    return zoom >= 15 ? 'full' : 'laterals_preview';
  }
  if (detailLevel === 'points') return 'density';
  if (zoom < 12) return 'sampled';
  return 'summary';
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

const EMPTY_DIAGNOSTICS: ViewportDataDiagnostics = {
  phase1FetchCount: 0,
  phase2FetchCount: 0,
  phase1CacheHits: 0,
  phase2CacheHits: 0,
  lastPhase1Ms: 0,
  lastPhase2Ms: 0,
  lastPhase2ZoomBucket: null,
};

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

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

  const [wells, setWells] = useState<Well[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTrajectories, setIsLoadingTrajectories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trajectoryError, setTrajectoryError] = useState<string | null>(null);
  const [source, setSource] = useState<'databricks' | 'mock' | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ViewportDataDiagnostics>(EMPTY_DIAGNOSTICS);

  const cacheRef = useRef<Map<string, { wells: Well[]; totalCount: number; truncated: boolean; source: 'databricks' | 'mock' }>>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- lazy init below
    null!
  );
  if (!cacheRef.current) cacheRef.current = new Map();
  const abortRef = useRef<AbortController | null>(null);
  const trajectoryAbortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWells = useCallback(async () => {
    if (!map || !isLoaded || !enabled) return;

    const mapBounds = map.getBounds();
    if (!mapBounds) return;

    const bounds = mapboxBoundsToViewport(mapBounds);
    const zoom = map.getZoom();
    const zoomBucket = Math.round(zoom);
    const requestBounds = expandBoundsToTileBounds(bounds, zoomBucket);
    const tileCacheKey = viewportBoundsToTileCacheKey(bounds, zoomBucket);

    // Always cancel any in-flight phase 2 when starting a new fetch cycle
    trajectoryAbortRef.current?.abort();
    setIsLoadingTrajectories(false);

    // Phase 1: summary (or points at low zoom), never full
    const phase1Detail: DetailLevel = zoom < 10 ? 'points' : 'summary';
    const sourceId = dataSourceId ?? getStoredSpatialSourceId();
    const spatialSource = getSpatialSource(sourceId);

    // Cache key MUST include sourceId so toggling live <-> mock never serves
    // stale wells from the other source for the same viewport bounds.
    const phase1RenderProfile = renderProfileForPhase(phase1Detail, zoom);
    const phase1Key = `${sourceId}:${tileCacheKey}:${phase1Detail}:${phase1RenderProfile}`;

    // Check phase 1 cache
    const cached1 = cacheRef.current.get(phase1Key);
    if (cached1) {
      setDiagnostics(prev => ({ ...prev, phase1CacheHits: prev.phase1CacheHits + 1 }));
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
        const startedAt = nowMs();
        const result = await spatialSource.fetchViewportWells(requestBounds, filters, {
          detailLevel: phase1Detail,
          renderProfile: phase1RenderProfile,
          signal: controller.signal,
          zoom: zoomBucket,
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
        setDiagnostics(prev => ({
          ...prev,
          phase1FetchCount: prev.phase1FetchCount + 1,
          lastPhase1Ms: nowMs() - startedAt,
        }));
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;

        // If live source failed, try mock fallback
        if (sourceId === 'live') {
          try {
            const mockResult = await getSpatialSource('mock').fetchViewportWells(requestBounds, filters, {
              detailLevel: phase1Detail,
              renderProfile: phase1RenderProfile,
              zoom: zoomBucket,
            });
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

    const phase2RenderProfile = renderProfileForPhase('full', zoom);
    const phase2Key = `${sourceId}:${tileCacheKey}:full:${phase2RenderProfile}:z${zoomBucket}`;
    const cached2 = cacheRef.current.get(phase2Key);

    if (cached2) {
      // Merge cached trajectories — synchronous, batched with phase 1 setState
      setWells(prev => mergeTrajectories(prev, cached2.wells));
      setTrajectoryError(null);
      setDiagnostics(prev => ({
        ...prev,
        phase2CacheHits: prev.phase2CacheHits + 1,
        lastPhase2ZoomBucket: zoomBucket,
      }));
    } else {
      const trajController = new AbortController();
      trajectoryAbortRef.current = trajController;
      setIsLoadingTrajectories(true);
      setTrajectoryError(null);

      try {
        const startedAt = nowMs();
        const fullResult = await spatialSource.fetchViewportWells(requestBounds, filters, {
          detailLevel: 'full',
          renderProfile: phase2RenderProfile,
          includeLaterals: true,
          signal: trajController.signal,
          zoom: zoomBucket,
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
        setDiagnostics(prev => ({
          ...prev,
          phase2FetchCount: prev.phase2FetchCount + 1,
          lastPhase2Ms: nowMs() - startedAt,
          lastPhase2ZoomBucket: zoomBucket,
        }));
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

    const timer = timerRef;
    return () => {
      map.off('moveend', handleMoveEnd);
      if (timer.current) clearTimeout(timer.current);
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
    diagnostics,
    refetch,
  };
}
