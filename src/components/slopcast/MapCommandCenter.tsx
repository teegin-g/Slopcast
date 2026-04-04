import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMapboxMap } from '../../hooks/useMapboxMap';
import { useTheme } from '../../theme/ThemeProvider';
import type { Well, WellGroup, SpatialLayerFilter, SpatialDataSourceId } from '../../types';
import { useViewportData } from '../../hooks/useViewportData';
import { OverlayGroupsPanel } from './map/OverlayGroupsPanel';
import { OverlayFiltersBar } from './map/OverlayFiltersBar';
import { OverlayToolbar } from './map/OverlayToolbar';
import { OverlaySelectionBar } from './map/OverlaySelectionBar';

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

export const MapCommandCenter: React.FC<MapCommandCenterProps> = ({
  isClassic,
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
  dataSourceId,
  onSourceChange,
  onWellsLoaded,
}) => {
  const { theme } = useTheme();
  const mp = theme.mapPalette;
  const { map, isLoaded, mapContainerRef } = useMapboxMap();

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
    source: spatialSource,
    totalCount: spatialTotalCount,
    truncated: spatialTruncated,
    fallbackActive: spatialFallback,
  } = useViewportData({
    map,
    isLoaded,
    filters: spatialFilters,
    dataSourceId,
  });

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

  // Track lasso/rectangle selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const lassoPointsRef = useRef<[number, number][]>([]);
  const rectStartRef = useRef<[number, number] | null>(null);

  const getWellColor = useCallback((wellId: string): string => {
    for (const group of groups) {
      if (group.wellIds.has(wellId)) return group.color;
    }
    return mp.unassignedFill;
  }, [groups, mp.unassignedFill]);

  // Build GeoJSON for wells
  const wellsGeoJson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: effectiveWells.map(w => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [w.lng, w.lat] },
      properties: {
        id: w.id,
        name: w.name,
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

  // Add/update wells layer on the map
  useEffect(() => {
    if (!map || !isLoaded) return;

    const sourceId = 'wells-source';
    const layerId = 'wells-circles';

    const source = map.getSource(sourceId);
    if (source) {
      source.setData(wellsGeoJson);
      // Update paint properties
      map.setPaintProperty(layerId, 'circle-color', colorMatchExpr);
      return;
    }

    // First time — add source and layer
    map.addSource(sourceId, { type: 'geojson', data: wellsGeoJson });

    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          6, 3,
          10, 6,
          14, 10,
        ],
        'circle-color': colorMatchExpr,
        'circle-stroke-width': ['case', ['get', 'selected'], 2, 0],
        'circle-stroke-color': mp.selectedStroke,
        'circle-opacity': ['case', ['get', 'dimmed'], 0.3, ['get', 'visible'], 1, 0.3],
      },
    });

    // Click handler
    map.on('click', layerId, (e: any) => {
      const feature = e.features?.[0];
      if (feature?.properties?.id) {
        onToggleWell(feature.properties.id);
      }
    });

    // Cursor change on hover
    map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
  }, [map, isLoaded, wellsGeoJson, colorMatchExpr, mp.selectedStroke, onToggleWell]);

  // Toggle satellite style
  useEffect(() => {
    if (!map || !isLoaded) return;
    const style = layers.satellite
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v11';
    map.setStyle(style);
    // Re-add wells source/layer after style change
    map.once('style.load', () => {
      const sourceId = 'wells-source';
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: 'geojson', data: wellsGeoJson });
        map.addLayer({
          id: 'wells-circles',
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 3, 10, 6, 14, 10],
            'circle-color': colorMatchExpr,
            'circle-stroke-width': ['case', ['get', 'selected'], 2, 0],
            'circle-stroke-color': mp.selectedStroke,
            'circle-opacity': ['case', ['get', 'dimmed'], 0.3, ['get', 'visible'], 1, 0.3],
          },
        });
      }
    });
  }, [layers.satellite]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleLayer = useCallback((layer: string) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-64px)]" data-testid="map-command-center">
      <div className="sr-only">
        <span data-testid="wells-selected-visible-count">{selectedWellCount}</span>
        <span data-testid="wells-filtered-count">{filteredWellsCount}</span>
      </div>

      {/* Mapbox canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

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
      </div>
    </div>
  );
};
