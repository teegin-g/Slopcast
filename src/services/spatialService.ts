import type {
  Well,
  ViewportBounds,
  SpatialLayerFilter,
  SpatialWellsResponse,
  SpatialLayer,
  SpatialDataSourceId,
} from '../types';
import { MOCK_WELLS } from '../constants';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SpatialDataSource {
  id: SpatialDataSourceId;
  label: string;
  fetchViewportWells(
    bounds: ViewportBounds,
    filters?: SpatialLayerFilter,
  ): Promise<SpatialWellsResponse>;
  getAvailableLayers(): Promise<SpatialLayer[]>;
}

// ---------------------------------------------------------------------------
// Mock source helpers
// ---------------------------------------------------------------------------

function wellInBounds(well: Well, bounds: ViewportBounds): boolean {
  return (
    well.lat >= bounds.sw_lat &&
    well.lat <= bounds.ne_lat &&
    well.lng >= bounds.sw_lng &&
    well.lng <= bounds.ne_lng
  );
}

function applyFilters(wells: Well[], filters?: SpatialLayerFilter): Well[] {
  if (!filters) return wells;
  let result = wells;
  if (filters.statuses?.length) {
    const set = new Set(filters.statuses);
    result = result.filter((w) => set.has(w.status));
  }
  if (filters.operators?.length) {
    const set = new Set(filters.operators);
    result = result.filter((w) => set.has(w.operator));
  }
  if (filters.formations?.length) {
    const set = new Set(filters.formations);
    result = result.filter((w) => set.has(w.formation));
  }
  return result;
}

const MOCK_LAYERS: SpatialLayer[] = [
  { id: 'producing', label: 'Producing', description: 'Active producing wells', enabled_by_default: true },
  { id: 'duc', label: 'DUCs', description: 'Drilled but uncompleted wells', enabled_by_default: true },
  { id: 'permit', label: 'Permits', description: 'Permitted well locations', enabled_by_default: true },
  { id: 'laterals', label: 'Laterals', description: 'Horizontal lateral paths', enabled_by_default: false },
];

// ---------------------------------------------------------------------------
// Mock (client-side) source
// ---------------------------------------------------------------------------

const mockSource: SpatialDataSource = {
  id: 'mock',
  label: 'Mock (Client)',

  async fetchViewportWells(bounds, filters) {
    const inBounds = MOCK_WELLS.filter((w) => wellInBounds(w, bounds));
    const filtered = applyFilters(inBounds, filters);
    return {
      wells: filtered,
      total_count: filtered.length,
      truncated: false,
      source: 'mock',
    };
  },

  async getAvailableLayers() {
    return MOCK_LAYERS;
  },
};

// ---------------------------------------------------------------------------
// Live (FastAPI / Databricks) source
// ---------------------------------------------------------------------------

const SPATIAL_API_BASE = '/api';

async function spatialFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SPATIAL_API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spatial service error (${res.status}): ${text}`);
  }
  return res.json();
}

const liveSource: SpatialDataSource = {
  id: 'live',
  label: 'Live (Databricks)',

  async fetchViewportWells(bounds, filters) {
    return spatialFetch<SpatialWellsResponse>('/spatial/wells', {
      method: 'POST',
      body: JSON.stringify({ bounds, filters }),
    });
  },

  async getAvailableLayers() {
    return spatialFetch<SpatialLayer[]>('/spatial/layers', { method: 'GET' });
  },
};

// ---------------------------------------------------------------------------
// Source registry & persistence
// ---------------------------------------------------------------------------

const sources: Record<SpatialDataSourceId, SpatialDataSource> = {
  mock: mockSource,
  live: liveSource,
};

const SOURCE_STORAGE_KEY = 'slopcast_spatial_source';

export function getStoredSpatialSourceId(): SpatialDataSourceId {
  const stored = localStorage.getItem(SOURCE_STORAGE_KEY);
  return stored === 'live' ? 'live' : 'mock';
}

export function setStoredSpatialSourceId(id: SpatialDataSourceId): void {
  localStorage.setItem(SOURCE_STORAGE_KEY, id);
}

export function getSpatialSource(id?: SpatialDataSourceId): SpatialDataSource {
  return sources[id ?? getStoredSpatialSourceId()];
}

export function getAllSpatialSources(): SpatialDataSource[] {
  return Object.values(sources);
}
