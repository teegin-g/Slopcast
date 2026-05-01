import type { Well } from './wells';

export interface MapViewState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface ViewportBounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

export interface SpatialLayerFilter {
  statuses?: Well['status'][];
  operators?: string[];
  formations?: string[];
  layers?: string[];
}

export interface SpatialWellsResponse {
  wells: Well[];
  total_count: number;
  truncated: boolean;
  source: 'databricks' | 'mock';
}

export interface SpatialLayer {
  id: string;
  label: string;
  description: string;
  enabled_by_default: boolean;
}

export type SpatialDataSourceId = 'mock' | 'live';
