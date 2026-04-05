import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMapboxMap } from '../../hooks/useMapboxMap';
import { useTheme } from '../../theme/ThemeProvider';
import { overlayPanelClass, type MapboxOverrides } from '../../theme/themes';
import type { Well, WellGroup, SpatialLayerFilter, SpatialDataSourceId } from '../../types';
import { useViewportData } from '../../hooks/useViewportData';
import { OverlayGroupsPanel } from './map/OverlayGroupsPanel';
import { OverlayFiltersBar } from './map/OverlayFiltersBar';
import { OverlayToolbar } from './map/OverlayToolbar';
import { OverlaySelectionBar } from './map/OverlaySelectionBar';
import { OverlayLegend } from './map/OverlayLegend';
import { MapWellTooltip } from './map/MapWellTooltip';
import { WellPopupCard } from './map/WellPopupCard';
import { useMapSelection } from '../../hooks/useMapSelection';
import type { PulseWellData } from './MapWellPulseLayer';

export type WellsMobilePanel = 'GROUPS' | 'MAP';

type SelectionTool = 'lasso' | 'rectangle';

interface MapCommandCenterProps {
  isClassic: boolean;
  theme: any;
  themeId: string;
  viewportLayout: 'mobile' | 'mid' | 'desktop' | 'wide';
  mobilePanel: WellsMobilePanel;
  onSetMobilePanel: (panel: WellsMobilePanel) => void;
  groups: WellGroup[];
  activeGroupId: string;
  selectedWellCount: number;
  onActivateGroup: (id: string) => void;
  onAddGroup: () => void;
  onCloneGroup: (groupId: string) => void;
  onAssignWells: () => void;
  onCreateGroupFromSelection: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  operatorFilter: string;
  formationFilter: string;
  statusFilter: Well['status'] | 'ALL';
  operatorOptions: string[];
  formationOptions: string[];
  statusOptions: Well['status'][];
  onSetOperatorFilter: (value: string) => void;
  onSetFormationFilter: (value: string) => void;
  onSetStatusFilter: (value: Well['status'] | 'ALL') => void;
  onResetFilters: () => void;
  filteredWellsCount: number;
  totalWellCount: number;
  wells: Well[];
  selectedWellIds: Set<string>;
  visibleWellIds: Set<string>;
  dimmedWellIds: Set<string>;
  onToggleWell: (id: string) => void;
  onSelectWells: (ids: string[]) => void;
  dataSourceId?: SpatialDataSourceId;
  onSourceChange?: (id: SpatialDataSourceId) => void;
  onWellsLoaded?: (wells: Well[]) => void;
}

function applyMapThemeOverrides(map: any, overrides: MapboxOverrides | undefined) {
  if (!map || !overrides) return;
  try {
    if (map.getLayer('background')) {
      map.setPaintProperty('background', 'background-color', overrides.bgColor);
    }
    ['water', 'water-shadow'].forEach(id => {
      if (map.getLayer(id)) map.setPaintProperty(id, 'fill-color', overrides.waterColor);
    });
    const style = map.getStyle();
    if (style?.layers) {
      for (const layer of style.layers) {
        if ((layer.id === 'land' || layer.id.startsWith('landuse') || layer.id.startsWith('landcover')) && layer.type === 'fill') {
          map.setPaintProperty(layer.id, 'fill-color', overrides.landColor);
        }
        if (layer.type === 'symbol' && layer.id.includes('label')) {
          map.setPaintProperty(layer.id, 'text-color', overrides.labelColor);
        }
        if ((layer.id.includes('road') || layer.id.includes('bridge') || layer.id.includes('tunnel')) && layer.type === 'line') {
          map.setPaintProperty(layer.id, 'line-opacity', overrides.roadOpacity);
        }
      }
    }
  } catch (e) {
    console.warn('[MapCommandCenter] Failed to apply theme overrides:', e);
  }
}

export const MapCommandCenter: React.FC<MapCommandCenterProps> = ({
  isClassic,
  viewportLayout,
  groups,
  activeGroupId,
  selectedWellCount,
  onActivateGroup,
  onAddGroup,
  onCloneGroup,
  onAssignWells,
  onCreateGroupFromSelection,
  onSelectAll,
  onClearSelection,
  operatorFilter,
  formationFilter,
  statusFilter,
  operatorOptions,
  formationOptions,
  statusOptions,
  onSetOperatorFilter,
  onSetFormationFilter,
  onSetStatusFilter,
  onResetFilters,
  filteredWellsCount,
  totalWellCount,
  wells,
  selectedWellIds,
  visibleWellIds,
  dimmedWellIds,
  onToggleWell,
  onSelectWells,
  dataSourceId,
  onSourceChange,
  onWellsLoaded,
}) => {
  const { theme } = useTheme();
  const mp = theme.mapPalette;
  const { map, isLoaded, mapContainerRef, pulseLayer, selectionTrail } = useMapboxMap();

  // Detect map canvas presence as a fallback for isLoaded (handles StrictMode race)
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
    // Check immediately
    if (container.querySelector('canvas.mapboxgl-canvas')) {
      setCanvasDetected(true);
      return;
    }
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isLoaded, canvasDetected, mapContainerRef]);

  const mapReady = isLoaded || canvasDetected;

  const [activeTool, setActiveTool] = useState<SelectionTool | null>(null);
  const [layers, setLayers] = useState<Record<string, boolean>>({ grid: false, heatmap: false, satellite: false });
  const [groupsPanelOpen, setGroupsPanelOpen] = useState(true);
  const [errorDismissed, setErrorDismissed] = useState(false);

  // Hover tooltip state
  const [hoveredWellId, setHoveredWellId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Click popup state
  const [popupWellId, setPopupWellId] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

  const [dataLayers, setDataLayers] = useState<Record<string, boolean>>({
    producing: true,
    duc: true,
    permit: true,
    laterals: false,
  });

  const spatialFilters = useMemo<SpatialLayerFilter>(() => {
    const statuses: Well['status'][] = [];
    if (dataLayers.producing) statuses.push('PRODUCING');
    if (dataLayers.duc) statuses.push('DUC');
    if (dataLayers.permit) statuses.push('PERMIT');
    return { statuses: statuses.length > 0 ? statuses : undefined };
  }, [dataLayers]);

  const {
    wells: viewportWells,
    isLoading: spatialLoading,
    error: spatialError,
    source: spatialSource,
    totalCount: spatialTotalCount,
    truncated: spatialTruncated,
    fallbackActive: spatialFallback,
    refetch: spatialRefetch,
  } = useViewportData({
    map,
    isLoaded,
    filters: spatialFilters,
    dataSourceId,
  });

  // Reset error dismissal when a new error arrives
  useEffect(() => {
    if (spatialError) setErrorDismissed(false);
  }, [spatialError]);

  const effectiveWells = useMemo(() => {
    if (viewportWells.length > 0 && spatialSource !== null) {
      return viewportWells;
    }
    return wells;
  }, [viewportWells, spatialSource, wells]);

  // Notify parent when effective wells change
  useEffect(() => {
    onWellsLoaded?.(effectiveWells);
  }, [effectiveWells, onWellsLoaded]);

  // Derive full Well objects for tooltip/popup from effectiveWells
  const hoveredWell = useMemo(
    () => (hoveredWellId ? effectiveWells.find(w => w.id === hoveredWellId) ?? null : null),
    [hoveredWellId, effectiveWells],
  );
  const popupWell = useMemo(
    () => (popupWellId ? effectiveWells.find(w => w.id === popupWellId) ?? null : null),
    [popupWellId, effectiveWells],
  );

  // Keep popup anchored to map coordinates when map moves/zooms
  useEffect(() => {
    if (!map || !popupWell) return;
    const updatePopupPosition = () => {
      const pt = map.project([popupWell.lng, popupWell.lat]);
      setPopupPos({ x: pt.x, y: pt.y });
    };
    map.on('move', updatePopupPosition);
    return () => { try { map.off('move', updatePopupPosition); } catch { /* map already torn down */ } };
  }, [map, popupWell]);

  const getWellColor = useCallback((wellId: string): string => {
    for (const group of groups) {
      if (group.wellIds.has(wellId)) return group.color;
    }
    return mp.unassignedFill;
  }, [groups, mp.unassignedFill]);

  // Feed well positions/colors to the WebGL pulse layer
  useEffect(() => {
    if (!pulseLayer) return;
    const pulseData: PulseWellData[] = effectiveWells.map((w, i) => ({
      lng: w.lng,
      lat: w.lat,
      color: getWellColor(w.id),
      phase: (i * 1.618) % (Math.PI * 2), // golden-ratio stagger
      scale: w.status === 'PRODUCING' ? 1.2 : w.status === 'DUC' ? 0.9 : 0.6,
    }));
    pulseLayer.setWells(pulseData);
  }, [pulseLayer, effectiveWells, getWellColor]);

  // Set selection trail color from theme lasso stroke
  useEffect(() => {
    selectionTrail?.setColor(mp.lassoStroke);
  }, [selectionTrail, mp.lassoStroke]);

  // Status-differentiated well layer IDs
  const wellLayerIds = useMemo(() => ['wells-producing', 'wells-duc', 'wells-permit'] as const, []);

  // Map selection tools (lasso / rectangle)
  const { selectionOverlay } = useMapSelection({
    map,
    mapContainerRef,
    activeTool,
    wellLayerIds: wellLayerIds as unknown as string[],
    theme: { lassoFill: mp.lassoFill, lassoStroke: mp.lassoStroke, lassoDash: mp.lassoDash },
    onSelectWells,
  });

  // Build GeoJSON for wells
  const wellsGeoJson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: effectiveWells.map(w => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [w.lng, w.lat] },
      properties: {
        id: w.id,
        name: w.name,
        status: w.status,
        groupColor: getWellColor(w.id),
        selected: selectedWellIds.has(w.id),
        dimmed: dimmedWellIds.has(w.id),
        visible: visibleWellIds.has(w.id),
      },
    })),
  }), [effectiveWells, getWellColor, selectedWellIds, dimmedWellIds, visibleWellIds]);

  // Build color match expression for Mapbox
  const colorMatchExpr = useMemo(() => {
    const pairs: (string)[] = [];
    const colorMap = new Map<string, string>();
    wells.forEach(w => {
      const color = getWellColor(w.id);
      if (!colorMap.has(w.id)) colorMap.set(w.id, color);
    });
    colorMap.forEach((color, id) => {
      pairs.push(id, color);
    });
    return ['match', ['get', 'id'], ...pairs, mp.unassignedFill] as any;
  }, [wells, getWellColor, mp.unassignedFill]);

  // Helper: add the 3 status layers + event handlers to the map
  const addWellLayers = useCallback((m: any, src: string) => {
    const defaultRadius = ['interpolate', ['linear'], ['zoom'], 6, 3, 10, 6, 14, 10];
    const permitRadius = ['interpolate', ['linear'], ['zoom'], 6, 2, 10, 4, 14, 7];
    const baseOpacity = ['case', ['get', 'dimmed'], 0.3, ['get', 'visible'], 1, 0.3];

    // PRODUCING — solid filled circle
    m.addLayer({
      id: 'wells-producing', type: 'circle', source: src,
      filter: ['==', ['get', 'status'], 'PRODUCING'],
      paint: {
        'circle-radius': defaultRadius,
        'circle-color': colorMatchExpr,
        'circle-stroke-width': ['case', ['get', 'selected'], 2, 0],
        'circle-stroke-color': mp.selectedStroke,
        'circle-opacity': baseOpacity,
      },
    });

    // DUC — ring/outline (high stroke, low fill)
    m.addLayer({
      id: 'wells-duc', type: 'circle', source: src,
      filter: ['==', ['get', 'status'], 'DUC'],
      paint: {
        'circle-radius': defaultRadius,
        'circle-color': colorMatchExpr,
        'circle-opacity': ['case', ['get', 'dimmed'], 0.1, ['get', 'visible'], 0.15, 0.1],
        'circle-stroke-width': ['case', ['get', 'selected'], 2.5, 2],
        'circle-stroke-color': colorMatchExpr,
        'circle-stroke-opacity': baseOpacity,
      },
    });

    // PERMIT — smaller, muted dot
    m.addLayer({
      id: 'wells-permit', type: 'circle', source: src,
      filter: ['==', ['get', 'status'], 'PERMIT'],
      paint: {
        'circle-radius': permitRadius,
        'circle-color': colorMatchExpr,
        'circle-stroke-width': ['case', ['get', 'selected'], 2, 0],
        'circle-stroke-color': mp.selectedStroke,
        'circle-opacity': ['case', ['get', 'dimmed'], 0.15, ['get', 'visible'], 0.5, 0.15],
      },
    });

    const allLayers = ['wells-producing', 'wells-duc', 'wells-permit'];
    for (const layerId of allLayers) {
      m.on('click', layerId, (e: any) => {
        const feature = e.features?.[0];
        if (feature?.properties?.id) {
          onToggleWell(feature.properties.id);
          const pt = m.project(e.features[0].geometry.coordinates);
          setPopupWellId(feature.properties.id);
          setPopupPos({ x: pt.x, y: pt.y });
          setHoveredWellId(null);
          setTooltipPos(null);
        }
      });
      m.on('mouseenter', layerId, () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mousemove', layerId, (e: any) => {
        const feature = e.features?.[0];
        if (feature?.properties?.id) {
          setHoveredWellId(feature.properties.id);
          setTooltipPos({ x: e.point.x, y: e.point.y });
        }
      });
      m.on('mouseleave', layerId, () => {
        m.getCanvas().style.cursor = '';
        setHoveredWellId(null);
        setTooltipPos(null);
      });
    }
    m.on('click', (e: any) => {
      const features = m.queryRenderedFeatures(e.point, { layers: allLayers });
      if (!features || features.length === 0) {
        setPopupWellId(null);
        setPopupPos(null);
      }
    });
  }, [colorMatchExpr, mp.selectedStroke, onToggleWell]);

  // Derive theme colors for cluster/label layers
  const clusterColor = mp.glowColor;
  const wellLabelColor = mp.mapboxOverrides?.labelColor ?? 'rgba(255,255,255,0.7)';
  const clusterTextColor = '#ffffff';
  const wellLabelHalo = mp.mapboxOverrides?.bgColor ?? 'rgba(0,0,0,0.6)';

  // Themed map container frame
  const mapFrameClass = isClassic
    ? 'sc-screen theme-transition'
    : `rounded-panel ring-1 ring-inset ring-[rgb(var(--border)/0.4)] ${
        theme.features.glowEffects ? 'glow-cyan' : 'shadow-card'
      } theme-transition`;

  // Add/update wells layers on the map (with clustering + labels)
  useEffect(() => {
    if (!map || !isLoaded) return;

    const sourceId = 'wells-source';
    const clustersId = 'wells-clusters';
    const clusterCountId = 'wells-cluster-count';
    const labelsId = 'wells-labels';

    const source = map.getSource(sourceId);
    if (source) {
      source.setData(wellsGeoJson);
      // Update paint on status-differentiated layers
      for (const layerId of wellLayerIds) {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'circle-color', colorMatchExpr);
          if (layerId === 'wells-duc') {
            map.setPaintProperty(layerId, 'circle-stroke-color', colorMatchExpr);
          }
        }
      }
      // Update cluster color if theme changed
      if (map.getLayer(clustersId)) {
        map.setPaintProperty(clustersId, 'circle-color', clusterColor);
        map.setPaintProperty(clustersId, 'circle-stroke-color', clusterColor);
      }
      // Update well label color if theme changed
      if (map.getLayer(labelsId)) {
        map.setPaintProperty(labelsId, 'text-color', wellLabelColor);
      }
      return;
    }

    // First time — add clustered source
    map.addSource(sourceId, {
      type: 'geojson',
      data: wellsGeoJson,
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 11,
    });

    // Cluster circles
    map.addLayer({
      id: clustersId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'point_count'],
          10, 15, 50, 25, 100, 35,
        ],
        'circle-color': clusterColor,
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': clusterColor,
        'circle-stroke-opacity': 0.4,
      },
    });

    // Cluster count labels
    map.addLayer({
      id: clusterCountId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': clusterTextColor },
    });

    // Status-differentiated well layers + event handlers
    addWellLayers(map, sourceId);

    // Well name labels (high zoom only, unclustered points)
    map.addLayer({
      id: labelsId,
      type: 'symbol',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      minzoom: 12,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 10,
        'text-offset': [0, 1.4],
        'text-anchor': 'top',
        'text-allow-overlap': false,
        'text-optional': true,
        'text-max-width': 12,
      },
      paint: {
        'text-color': wellLabelColor,
        'text-halo-color': wellLabelHalo,
        'text-halo-width': 1,
      },
    });

    // Click clusters — zoom to expand
    map.on('click', clustersId, (e: any) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const cid = feature.properties.cluster_id;
      const src = map.getSource(sourceId) as any;
      src.getClusterExpansionZoom(cid, (err: any, zoom: number) => {
        if (err) return;
        map.easeTo({ center: feature.geometry.coordinates, zoom });
      });
    });

    // Cursor change on hover for clusters
    map.on('mouseenter', clustersId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', clustersId, () => { map.getCanvas().style.cursor = ''; });
  }, [map, isLoaded, wellsGeoJson, colorMatchExpr, wellLayerIds, addWellLayers, clusterColor, wellLabelColor]);

  // Apply theme map overrides when theme changes or map loads
  useEffect(() => {
    if (!map || !isLoaded || layers.satellite) return;
    applyMapThemeOverrides(map, mp.mapboxOverrides);
  }, [map, isLoaded, mp.mapboxOverrides, layers.satellite]);

  // Add Mapbox navigation + scale controls
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

  // Toggle satellite style
  useEffect(() => {
    if (!map || !isLoaded) return;
    const style = layers.satellite
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v11';
    map.setStyle(style);
    // Re-add wells source/layers after style change (with clustering)
    map.once('style.load', () => {
      const sourceId = 'wells-source';
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: wellsGeoJson,
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 11,
        });
        // Cluster circles
        map.addLayer({
          id: 'wells-clusters', type: 'circle', source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 10, 15, 50, 25, 100, 35],
            'circle-color': clusterColor, 'circle-opacity': 0.7,
            'circle-stroke-width': 2, 'circle-stroke-color': clusterColor, 'circle-stroke-opacity': 0.4,
          },
        });
        // Cluster count labels
        map.addLayer({
          id: 'wells-cluster-count', type: 'symbol', source: sourceId,
          filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12, 'text-allow-overlap': true },
          paint: { 'text-color': clusterTextColor },
        });
        // Status-differentiated well layers
        addWellLayers(map, sourceId);
        // Well name labels
        map.addLayer({
          id: 'wells-labels', type: 'symbol', source: sourceId,
          filter: ['!', ['has', 'point_count']], minzoom: 12,
          layout: {
            'text-field': ['get', 'name'], 'text-size': 10, 'text-offset': [0, 1.4],
            'text-anchor': 'top', 'text-allow-overlap': false, 'text-optional': true, 'text-max-width': 12,
          },
          paint: { 'text-color': wellLabelColor, 'text-halo-color': wellLabelHalo, 'text-halo-width': 1 },
        });
      }
      if (!layers.satellite) {
        applyMapThemeOverrides(map, mp.mapboxOverrides);
      }
    });
  }, [layers.satellite]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleLayer = useCallback((layer: string) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  return (
    <div className={`relative w-full h-[calc(100vh-64px)] overflow-hidden ${mapFrameClass}`} data-testid="map-command-center">
      <div className="sr-only">
        <span data-testid="wells-selected-visible-count">{selectedWellCount}</span>
        <span data-testid="wells-filtered-count">{filteredWellsCount}</span>
      </div>

      {/* Mapbox canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Vignette — themed edge treatment */}
      <div className="map-vignette absolute inset-0 z-[1] pointer-events-none" />

      {/* Atmospheric bleed — top edge gradient from header */}
      <div
        className="absolute inset-x-0 top-0 h-16 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgb(var(--bg-deep)), transparent)' }}
      />

      {/* Lasso / Rectangle selection overlay */}
      {selectionOverlay}

      {/* Fallback when no Mapbox token */}
      {!mapReady && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          isClassic ? 'bg-[#101010]' : 'bg-[var(--bg-deep)]'
        }`}>
          <div className="text-center space-y-2">
            <div className={`text-[11px] font-black uppercase tracking-[0.2em] ${
              isClassic ? 'text-white/40' : 'text-[var(--text-muted)]'
            }`}>
              Map Command Center
            </div>
            <div className={`text-[10px] ${
              isClassic ? 'text-white/25' : 'text-[var(--text-muted)]/60'
            }`}>
              Set VITE_MAPBOX_TOKEN to enable the interactive map
            </div>
          </div>
        </div>
      )}

      {/* Overlay container */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <OverlayGroupsPanel
          isClassic={isClassic}
          groups={groups}
          activeGroupId={activeGroupId}
          onActivateGroup={onActivateGroup}
          onAddGroup={onAddGroup}
          onCloneGroup={onCloneGroup}
          wells={wells}
          selectedWellIds={selectedWellIds}
          visibleWellIds={visibleWellIds}
        />

        <OverlayFiltersBar
          isClassic={isClassic}
          visibleCount={visibleWellIds.size}
          selectedCount={selectedWellIds.size}
          totalCount={totalWellCount}
          groupsPanelOpen={groupsPanelOpen}
          operatorFilter={operatorFilter}
          formationFilter={formationFilter}
          statusFilter={statusFilter}
          operatorOptions={operatorOptions}
          formationOptions={formationOptions}
          statusOptions={statusOptions}
          onSetOperatorFilter={onSetOperatorFilter}
          onSetFormationFilter={onSetFormationFilter}
          onSetStatusFilter={onSetStatusFilter}
          onResetFilters={onResetFilters}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
        />

        {spatialLoading && (
          <div className="absolute top-14 right-14 z-20 pointer-events-none">
            <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
              isClassic
                ? 'bg-black/60 text-white/60'
                : 'bg-[var(--surface-1)]/80 text-[var(--text-muted)] backdrop-blur-sm'
            }`}>
              Loading wells…
            </div>
          </div>
        )}

        <OverlayToolbar
          isClassic={isClassic}
          activeTool={activeTool}
          onSetTool={setActiveTool}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          dataLayers={dataLayers}
          onToggleDataLayer={(layer) => setDataLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
          isLoading={spatialLoading}
          source={spatialSource}
          totalCount={spatialTotalCount}
          truncated={spatialTruncated}
          dataSourceId={dataSourceId}
          onSourceChange={onSourceChange}
          fallbackActive={spatialFallback}
        />

        <OverlaySelectionBar
          isClassic={isClassic}
          selectedCount={selectedWellCount}
          onAssignWells={onAssignWells}
          onCreateGroupFromSelection={onCreateGroupFromSelection}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
        />

        <OverlayLegend
          isClassic={isClassic}
          groups={groups}
          wells={effectiveWells}
          viewportLayout={viewportLayout}
        />

        {/* Well hover tooltip — hidden when popup is open */}
        {!popupWellId && (
          <MapWellTooltip
            well={hoveredWell}
            groups={groups}
            position={tooltipPos}
            isClassic={isClassic}
          />
        )}

        {/* Well click popup card */}
        <WellPopupCard
          well={popupWell}
          groups={groups}
          position={popupPos}
          isClassic={isClassic}
          onClose={() => { setPopupWellId(null); setPopupPos(null); }}
        />

        {/* Error overlay — spatial data loading failure */}
        {spatialError && !errorDismissed && (
          <div className="absolute bottom-16 right-4 z-30 pointer-events-auto max-w-xs">
            <div className={`${
              isClassic
                ? 'sc-panel theme-transition'
                : `rounded-panel ${overlayPanelClass(theme.features.panelStyle)} theme-transition`
            } px-4 py-3 border-l-2 ${
              isClassic ? 'border-l-red-500' : 'border-l-red-400'
            }`}>
              <div className="flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`mt-0.5 shrink-0 ${isClassic ? 'text-red-400' : 'text-red-400'}`}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 4.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-black uppercase tracking-widest ${isClassic ? 'text-red-400' : 'text-red-400'}`}>
                    Failed to load wells
                  </div>
                  <div className={`text-[9px] mt-1 leading-snug ${isClassic ? 'text-white/50' : 'text-[var(--text-muted)]'}`}>
                    {spatialError}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => { setErrorDismissed(true); spatialRefetch(); }}
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        isClassic
                          ? 'bg-white/10 text-white/70 hover:bg-white/20'
                          : 'bg-[var(--cyan)]/15 text-[var(--cyan)] hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/30'
                      } transition-colors`}
                    >
                      Retry
                    </button>
                    {onSourceChange && (
                      <button
                        type="button"
                        onClick={() => { setErrorDismissed(true); onSourceChange('mock'); }}
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                          isClassic
                            ? 'bg-white/10 text-white/70 hover:bg-white/20'
                            : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/80 border border-[var(--border)]'
                        } transition-colors`}
                      >
                        Use mock data
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setErrorDismissed(true)}
                      className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-1 rounded ${
                        isClassic ? 'text-white/40 hover:text-white/60' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      } transition-colors`}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard shortcut hint */}
        {!activeTool && (
          <div className="absolute bottom-3 right-14 z-10 pointer-events-none">
            <span className={`text-[9px] tracking-wide ${
              isClassic ? 'text-white/20' : 'text-[var(--text-muted)]/40'
            }`}>
              Shift+drag to select
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
