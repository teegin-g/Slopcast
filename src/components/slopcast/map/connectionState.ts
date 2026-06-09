/**
 * Derives a single, user-facing connection state for the map from the two
 * services the workspace depends on: Mapbox (basemap) and the spatial data
 * source (Databricks live, or a local fallback). Pure + tested so the banner
 * component stays dumb.
 */

export type ConnectionLevel = 'ok' | 'degraded' | 'down';

export interface ConnectionState {
  level: ConnectionLevel;
  title: string;
  detail: string | null;
  /** Down states are persistent (ongoing problem); degraded ones can be dismissed. */
  dismissible: boolean;
  showRetry: boolean;
  showUseMock: boolean;
}

export interface ConnectionInputs {
  /** Mapbox GL finished loading (false when the token is missing or the basemap failed to load). */
  mapReady: boolean;
  /** Non-null when the live spatial fetch failed. */
  dataError: string | null;
  /** Active spatial source id ('live' | 'mock' | null). */
  dataSource: string | null;
  /** True when the app silently fell back to local data. */
  fallbackActive: boolean;
}

export function deriveConnectionState(input: ConnectionInputs): ConnectionState {
  const ok: ConnectionState = {
    level: 'ok',
    title: 'Live',
    detail: null,
    dismissible: true,
    showRetry: false,
    showUseMock: false,
  };

  if (!input.mapReady) {
    return {
      level: 'down',
      title: 'Map unavailable',
      detail: 'Mapbox could not load. Check your network connection or the VITE_MAPBOX_TOKEN.',
      dismissible: false,
      showRetry: false,
      showUseMock: false,
    };
  }

  if (input.dataError) {
    return {
      level: 'down',
      title: 'Live data unreachable',
      detail: input.dataError,
      dismissible: false,
      showRetry: true,
      showUseMock: input.dataSource !== 'mock',
    };
  }

  if (input.fallbackActive) {
    return {
      level: 'degraded',
      title: 'Showing fallback data',
      detail: 'Databricks isn’t reachable right now — displaying local data instead.',
      dismissible: true,
      showRetry: true,
      showUseMock: false,
    };
  }

  return ok;
}
