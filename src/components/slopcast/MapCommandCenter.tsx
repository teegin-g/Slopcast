import React, { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useMapboxMap } from '../../hooks/useMapboxMap';
import { useTheme } from '../../theme/ThemeProvider';
import { overlayPanelClass } from '../../theme/themes';
import type { Well, WellGroup, SpatialLayerFilter, SpatialDataSourceId } from '../../types';
import { useMapTheme, applyMapThemeOverrides } from './map/useMapTheme';
import { useMapInit } from './map/useMapInit';
import { simplifyWellborePath, type WellboreData, type WellboreRenderDiagnostics } from './MapWellboreLayer';
import { useViewportData } from '../../hooks/useViewportData';
import { GroupInspector } from './map/GroupInspector';
import { summarizeGroupWells, type WellStatus } from './map/groupInspectorStats';
import { OverlayFiltersBar } from './map/OverlayFiltersBar';
import { OverlayToolbar } from './map/OverlayToolbar';
import { OverlaySelectionBar } from './map/OverlaySelectionBar';
import { OverlayLegend } from './map/OverlayLegend';
import InsightsDock from './map/insightsDock/InsightsDock';
import { ConnectionWarningBanner } from './map/ConnectionWarningBanner';
import { deriveConnectionState } from './map/connectionState';
import { MapWellTooltip } from './map/MapWellTooltip';
import { WellPopupCard } from './map/WellPopupCard';
import { useSpatialSourcePolicy } from './map/useSpatialSourcePolicy';
import { useMapSelection } from '../../hooks/useMapSelection';
import {
  WELL_CLUSTER_LAYER_ID,
  WELL_SOURCE_ID,
  WELL_STATUS_LAYER_IDS,
  addWellSourceAndLayers,
  bindWellLayerEvents,
  buildWellColorExpression,
  updateWellFeatureState,
  updateWellLayerPaint,
  addHeatLayer,
  removeHeatLayer,
  addFormationLayer,
  removeFormationLayer,
} from './map/wellLayerController';
import { getNpvPerAcre } from '../../services/heatService';
import { getFormationPolygons } from '../../services/geologyService';
import type { MapLayerVisibility } from './map/MapLayersControl';
import { stableSelectWellsForBudget, wellboreZoomBucket } from './map/spatialSampling';
import { getPanelCollapsed, setPanelCollapsed } from '../../services/storage/workspacePreferences';

export type WellsMobilePanel = 'GROUPS' | 'MAP';

type SelectionTool = 'lasso' | 'rectangle';

const EMPTY_WELLBORE_DIAGNOSTICS: WellboreRenderDiagnostics = {
  mounted: false,
  wellboreCount: 0,
  vertexCount: 0,
  totalAllocatedVerts: 0,
  uploadCount: 0,
  drawCalls: 0,
  lastUploadVertexCount: 0,
  lastDrawVertexCount: 0,
  frameCount: 0,
  lastFrameMs: 0,
  dirty: true,
  hasProgram: false,
};

const SELECTED_WELLBORE_MIN_ZOOM = 10;
const BACKGROUND_WELLBORE_MIN_ZOOM = 12;
const MAX_BACKGROUND_WELLBORES = 250;
const MAX_TOTAL_WELLBORES = 320;

function setKey(values: Set<string>): string {
  return Array.from(values).sort().join(',');
}

function wellboreSimplificationTolerance(zoom: number, selected: boolean): number {
  const base =
    zoom >= 15 ? 0 :
    zoom >= 14 ? 0.000035 :
    zoom >= 12 ? 0.00012 :
    0.00025;
  return selected ? base * 0.5 : base;
}

interface MapCommandCenterProps {
  isClassic: boolean;
  viewportLayout: 'mobile' | 'mid' | 'desktop' | 'wide';
  groups: WellGroup[];
  activeGroupId: string;
  selectedWellCount: number;
  onActivateGroup: (id: string) => void;
  onAssignWells: () => void;
  onCreateGroupFromSelection: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  operatorFilter: Set<string>;
  formationFilter: Set<string>;
  statusFilter: Set<string>;
  operatorOptions: string[];
  formationOptions: string[];
  statusOptions: Well['status'][];
  onToggleOperator: (value: string) => void;
  onToggleFormation: (value: string) => void;
  onToggleStatus: (value: string) => void;
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
  viewportLayout,
  groups,
  activeGroupId,
  selectedWellCount,
  onActivateGroup,
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
  onToggleOperator,
  onToggleFormation,
  onToggleStatus,
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
  const { map, isLoaded, mapContainerRef, viewState, selectionTrail, wellboreLayer } = useMapboxMap();

  // Canvas detection + nav/scale controls
  const { mapReady } = useMapInit({ map, isLoaded, mapContainerRef });
  const ensureTerrain = useCallback((targetMap: any) => {
    try {
      if (!targetMap.getSource('mapbox-dem')) {
        targetMap.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      targetMap.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });
    } catch {
      // Terrain is optional in unsupported environments.
    }
  }, []);

  const [activeTool, setActiveTool] = useState<SelectionTool | null>(null);
  const [layers, setLayers] = useState<Record<string, boolean>>({ grid: false, heatmap: false, satellite: false });
  const [mapLayerEpoch, setMapLayerEpoch] = useState(0);

  // Rail-toggled economics-heat + formation map layers (Task 3.5).
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>({ heat: false, formations: false });
  const handleToggleMapLayer = useCallback(
    (key: keyof MapLayerVisibility) => setLayerVisibility(v => ({ ...v, [key]: !v[key] })),
    [],
  );
  const [inspectorCollapsed, setInspectorCollapsed] = useState(() => getPanelCollapsed('inspector') ?? false);
  const handleToggleInspector = useCallback(() => {
    setInspectorCollapsed(prev => {
      const next = !prev;
      setPanelCollapsed('inspector', next);
      return next;
    });
  }, []);
  const [errorDismissed, setErrorDismissed] = useState(false);
  // InsightsDock visibility — dismissible, but auto-reopens when a NEW selection
  // is made (empty → non-empty) so the lasso→analytics flow always surfaces.
  const [dockDismissed, setDockDismissed] = useState(false);
  const prevSelCount = useRef(0);
  const selCount = selectedWellIds.size;
  useEffect(() => {
    if (selCount > 0 && prevSelCount.current === 0) setDockDismissed(false);
    prevSelCount.current = selCount;
  }, [selCount]);
  const [wellboreDiagnostics, setWellboreDiagnostics] = useState<WellboreRenderDiagnostics>(
    () => wellboreLayer?.getDiagnostics() ?? EMPTY_WELLBORE_DIAGNOSTICS,
  );
  const [sourceSetDataCount, setSourceSetDataCount] = useState(0);
  const lastSourceSetDataMs = useRef(0);
  const previousFeatureStateRef = useRef<Map<string, { selected: boolean; dimmed: boolean; visible: boolean }>>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- lazy init below
    null!
  );
  if (!previousFeatureStateRef.current) previousFeatureStateRef.current = new Map();
  const hoverRafRef = useRef<number | null>(null);

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
    laterals: true,
  });

  const spatialFilters = useMemo<SpatialLayerFilter>(() => {
    const statuses: Well['status'][] = [];
    if (dataLayers.producing) statuses.push('PRODUCING');
    if (dataLayers.duc) statuses.push('DUC');
    if (dataLayers.permit) statuses.push('PERMIT');

    // Pass operator/formation filter sets to the backend query.
    // Empty set means "no filter" (show all), matching useWellFiltering semantics.
    const operators = operatorFilter.size > 0 ? [...operatorFilter] : undefined;
    const formations = formationFilter.size > 0 ? [...formationFilter] : undefined;

    return {
      statuses: statuses.length > 0 ? statuses : undefined,
      operators,
      formations,
    };
  }, [dataLayers, operatorFilter, formationFilter]);

  // Compute all well IDs in groups that contain at least one selected well
  const groupLateralWellIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of groups) {
      let groupHasSelectedWell = false;
      for (const wid of selectedWellIds) {
        if (group.wellIds.has(wid)) {
          groupHasSelectedWell = true;
          break;
        }
      }
      if (groupHasSelectedWell) {
        for (const wid of group.wellIds) {
          ids.add(wid);
        }
      }
    }
    return ids;
  }, [groups, selectedWellIds]);

  const {
    wells: viewportWells,
    isLoading: spatialLoading,
    isLoadingTrajectories: spatialLoadingTrajectories,
    error: spatialError,
    trajectoryError: spatialTrajectoryError,
    source: spatialSource,
    totalCount: spatialTotalCount,
    truncated: spatialTruncated,
    fallbackActive: spatialFallback,
    diagnostics: viewportDiagnostics,
    refetch: spatialRefetch,
  } = useViewportData({
    map,
    isLoaded: mapReady,
    filters: spatialFilters,
    dataSourceId,
    includeLaterals: dataLayers.laterals || groupLateralWellIds.size > 0 || selectedWellIds.size > 0,
  });
  const displayedSpatialError = spatialError ?? spatialTrajectoryError;
  const isTrajectoryOnlyError = !spatialError && !!spatialTrajectoryError;

  // Combined connection state (data source). Mapbox availability is surfaced by
  // the centered fallback panel below; this banner covers the live data source.
  const connectionState = useMemo(
    () => deriveConnectionState({
      mapReady: true,
      dataError: spatialError ?? null,
      dataSource: dataSourceId ?? spatialSource ?? null,
      fallbackActive: spatialFallback,
    }),
    [spatialError, dataSourceId, spatialSource, spatialFallback],
  );

  const { handleSourceChange } = useSpatialSourcePolicy({ dataSourceId, onSourceChange });

  // Reset error dismissal when a new error arrives
  useEffect(() => {
    if (spatialError || spatialTrajectoryError) setErrorDismissed(false);
  }, [spatialError, spatialTrajectoryError]);

  const effectiveWells = useMemo(() => {
    if (viewportWells.length > 0 && spatialSource !== null) {
      return viewportWells;
    }
    return wells;
  }, [viewportWells, spatialSource, wells]);

  const onWellsLoadedEvent = useEffectEvent((wells: typeof effectiveWells) => onWellsLoaded?.(wells));

  // Notify parent when effective wells change
  useEffect(() => {
    onWellsLoadedEvent(effectiveWells);
  }, [effectiveWells]);

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

  // Theme overrides: lasso trail colour + Mapbox tile-style paint overrides
  useMapTheme({ map, isLoaded, selectionTrail, mp, satelliteActive: layers.satellite });

  const activeWellboreData = useMemo<WellboreData[]>(() => {
    if (viewState.zoom < SELECTED_WELLBORE_MIN_ZOOM) return [];

    const priorityWellIds = new Set([...selectedWellIds, ...groupLateralWellIds]);
    const backgroundBudget = dataLayers.laterals && viewState.zoom >= BACKGROUND_WELLBORE_MIN_ZOOM
      ? MAX_BACKGROUND_WELLBORES
      : 0;
    const sampleSeed = [
      `z${wellboreZoomBucket(viewState.zoom)}`,
      `status:${setKey(statusFilter as Set<string>)}`,
      `operator:${setKey(operatorFilter)}`,
      `formation:${setKey(formationFilter)}`,
    ].join('|');
    const candidates = effectiveWells.filter((w) => {
      if (!w.trajectory || w.trajectory.path.length < 2) return false;
      return dataLayers.laterals || priorityWellIds.has(w.id);
    });
    const selectedWells = stableSelectWellsForBudget(candidates, {
      seed: sampleSeed,
      budget: Math.min(MAX_TOTAL_WELLBORES, priorityWellIds.size + backgroundBudget),
      priorityIds: priorityWellIds,
    });

    return selectedWells.map((well) => ({
        id: well.id,
        path: simplifyWellborePath(
          well.trajectory!.path,
          wellboreSimplificationTolerance(viewState.zoom, selectedWellIds.has(well.id)),
        ),
        color: getWellColor(well.id),
        selected: selectedWellIds.has(well.id),
      }));
  }, [
    effectiveWells,
    dataLayers.laterals,
    getWellColor,
    selectedWellIds,
    groupLateralWellIds,
    viewState.zoom,
    statusFilter,
    operatorFilter,
    formationFilter,
  ]);

  // Feed wellbore data: toggle ON shows all, toggle OFF shows group members of any selected well
  useEffect(() => {
    if (!wellboreLayer) return;
    wellboreLayer.setWellbores(activeWellboreData);
  }, [wellboreLayer, activeWellboreData]);

  useEffect(() => {
    if (!wellboreLayer) return;
    setWellboreDiagnostics(wellboreLayer.getDiagnostics());
    wellboreLayer.setDiagnosticsListener(setWellboreDiagnostics);
    return () => {
      wellboreLayer.setDiagnosticsListener(null);
    };
  }, [wellboreLayer]);

  // Map selection tools (lasso / rectangle)
  const { selectionOverlay } = useMapSelection({
    map,
    mapContainerRef,
    activeTool,
    wellLayerIds: [...WELL_STATUS_LAYER_IDS],
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
      },
    })),
  }), [effectiveWells, getWellColor]);

  // Read per-feature groupColor from GeoJSON instead of building giant per-id match expressions.
  const colorMatchExpr = useMemo(() => {
    return buildWellColorExpression(mp.unassignedFill) as any;
  }, [mp.unassignedFill]);

  // Derive theme colors for cluster/label layers
  const clusterColor = mp.glowColor;
  const wellLabelColor = mp.mapboxOverrides?.labelColor ?? 'rgba(255,255,255,0.7)';
  const clusterTextColor = '#ffffff';
  const wellLabelHalo = mp.mapboxOverrides?.bgColor ?? 'rgba(0,0,0,0.6)';
  const wellLayerTheme = useMemo(() => ({
    clusterColor,
    clusterTextColor,
    wellLabelColor,
    wellLabelHalo,
    unassignedFill: mp.unassignedFill,
    selectedStroke: mp.selectedStroke,
  }), [clusterColor, clusterTextColor, wellLabelColor, wellLabelHalo, mp.unassignedFill, mp.selectedStroke]);

  // Themed map container frame
  const mapFrameClass = isClassic
    ? 'sc-screen theme-transition'
    : `rounded-panel ring-1 ring-inset ring-[rgb(var(--border)/0.4)] ${
        theme.features.glowEffects ? 'glow-cyan' : 'shadow-card'
      } theme-transition`;

  // Add/update wells layers on the map (with clustering + labels)
  useEffect(() => {
    if (!map || !isLoaded) return;

    const source = map.getSource(WELL_SOURCE_ID);
    if (source) {
      const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      source.setData(wellsGeoJson);
      lastSourceSetDataMs.current = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt;
      setSourceSetDataCount(count => count + 1);
      previousFeatureStateRef.current.clear();
      updateWellLayerPaint(map, colorMatchExpr, wellLayerTheme);
      return;
    }

    addWellSourceAndLayers(map, wellsGeoJson, colorMatchExpr, wellLayerTheme);
    previousFeatureStateRef.current.clear();
    setSourceSetDataCount(count => count + 1);
    setMapLayerEpoch(epoch => epoch + 1);
  }, [map, isLoaded, wellsGeoJson, colorMatchExpr, wellLayerTheme]);

  useEffect(() => {
    if (!map || !isLoaded || !map.getSource(WELL_SOURCE_ID)) return;

    const changedWells = effectiveWells.filter(well => {
      const next = {
        selected: selectedWellIds.has(well.id),
        dimmed: dimmedWellIds.has(well.id),
        visible: visibleWellIds.has(well.id),
      };
      const previous = previousFeatureStateRef.current.get(well.id);
      previousFeatureStateRef.current.set(well.id, next);
      return !previous ||
        previous.selected !== next.selected ||
        previous.dimmed !== next.dimmed ||
        previous.visible !== next.visible;
    });

    if (changedWells.length === 0) return;
    updateWellFeatureState(map, changedWells, selectedWellIds, dimmedWellIds, visibleWellIds);
  }, [map, isLoaded, effectiveWells, selectedWellIds, dimmedWellIds, visibleWellIds]);

  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(WELL_CLUSTER_LAYER_ID)) return;
    return bindWellLayerEvents(map, {
      onWellClick: (id, point) => {
        onToggleWell(id);
        setPopupWellId(id);
        setPopupPos(point);
        setHoveredWellId(null);
        setTooltipPos(null);
      },
      onWellHover: (id, point) => {
        if (hoverRafRef.current !== null) cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = requestAnimationFrame(() => {
          hoverRafRef.current = null;
          setHoveredWellId(id);
          setTooltipPos(point);
        });
      },
      onWellLeave: () => {
        if (hoverRafRef.current !== null) {
          cancelAnimationFrame(hoverRafRef.current);
          hoverRafRef.current = null;
        }
        setHoveredWellId(null);
        setTooltipPos(null);
      },
      onMapEmptyClick: () => {
        setPopupWellId(null);
        setPopupPos(null);
      },
    });
  }, [map, isLoaded, onToggleWell, mapLayerEpoch]);

  useEffect(() => {
    const rafRef = hoverRafRef;
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Toggle satellite style
  useEffect(() => {
    if (!map || !isLoaded) return;
    const style = layers.satellite
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v11';
    map.setStyle(style);
    // Re-add wells source/layers after style change (with clustering)
    map.once('style.load', () => {
      ensureTerrain(map);
      addWellSourceAndLayers(map, wellsGeoJson, colorMatchExpr, wellLayerTheme);
      setMapLayerEpoch(epoch => epoch + 1);
      // Re-register wellbore layer after style change
      try {
        if (wellboreLayer && !map.getLayer(wellboreLayer.id)) {
          map.addLayer(wellboreLayer);
        }
      } catch (e) {
        console.warn('[MapCommandCenter] Failed to re-add wellbore layer:', e);
      }
      if (wellboreLayer) {
        wellboreLayer.setWellbores(activeWellboreData);
      }
      if (!layers.satellite) {
        applyMapThemeOverrides(map, mp.mapboxOverrides);
      }
    });
  }, [layers.satellite]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleLayer = useCallback((layer: string) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // Right inspector targets the active group (empty-safe).
  const activeGroup = useMemo(
    () => groups.find(g => g.id === activeGroupId) ?? groups[0] ?? null,
    [groups, activeGroupId],
  );
  const activeGroupWells = useMemo(
    () => (activeGroup ? wells.filter(w => activeGroup.wellIds.has(w.id)) : []),
    [activeGroup, wells],
  );
  // Lasso-selected wells (drives the InsightsDock selection mode).
  const selectedWells = useMemo(
    () => wells.filter(w => selectedWellIds.has(w.id)),
    [wells, selectedWellIds],
  );
  const activeGroupStatusCounts = useMemo(() => {
    if (!activeGroup) return undefined;
    const s = summarizeGroupWells(activeGroupWells);
    const c = (st: WellStatus) => s.slices.find(x => x.status === st)?.count ?? 0;
    return { producing: c('PRODUCING'), duc: c('DUC'), permit: c('PERMIT') };
  }, [activeGroup, activeGroupWells]);

  // Economics-heat layer — recolours wells by NPV/acre. Re-bakes when wells or
  // the active group's metrics change. Guarded: the style may be mid-load.
  useEffect(() => {
    if (!map || !mapReady) return;
    try {
      if (layerVisibility.heat) {
        const heat = getNpvPerAcre(effectiveWells, activeGroup?.metrics);
        addHeatLayer(map, effectiveWells, heat);
      } else {
        removeHeatLayer(map);
      }
    } catch (e) {
      console.warn('[MapCommandCenter] heat layer update failed:', e);
    }
  }, [map, mapReady, layerVisibility.heat, effectiveWells, activeGroup]);

  // Formation polygon layers (fill + line + label). Static mock polygons.
  useEffect(() => {
    if (!map || !mapReady) return;
    try {
      if (layerVisibility.formations) {
        addFormationLayer(map, getFormationPolygons());
      } else {
        removeFormationLayer(map);
      }
    } catch (e) {
      console.warn('[MapCommandCenter] formation layer update failed:', e);
    }
  }, [map, mapReady, layerVisibility.formations]);

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden" data-testid="map-command-center">
      <div className={`relative flex-1 overflow-hidden ${mapFrameClass}`}>
        <div className="sr-only">
          <span data-testid="wells-selected-visible-count">{selectedWellCount}</span>
          <span data-testid="wells-filtered-count">{filteredWellsCount}</span>
          <span data-testid="map-instance-present">{map ? '1' : '0'}</span>
          <span data-testid="map-view-zoom">{viewState.zoom.toFixed(2)}</span>
          <span data-testid="map-viewport-well-count">{viewportWells.length}</span>
          <span data-testid="map-spatial-source">{spatialSource ?? 'none'}</span>
          <span data-testid="map-trajectory-error">{spatialTrajectoryError ?? ''}</span>
          <span data-testid="map-wellbore-mounted">{wellboreDiagnostics.mounted ? '1' : '0'}</span>
          <span data-testid="map-wellbore-count">{wellboreDiagnostics.wellboreCount}</span>
          <span data-testid="map-wellbore-vertex-count">{wellboreDiagnostics.vertexCount}</span>
          <span data-testid="map-wellbore-draw-calls">{wellboreDiagnostics.drawCalls}</span>
          <span data-testid="map-wellbore-last-draw-vertex-count">{wellboreDiagnostics.lastDrawVertexCount}</span>
          <span data-testid="map-wellbore-frame-count">{wellboreDiagnostics.frameCount}</span>
          <span data-testid="map-wellbore-last-frame-ms">{wellboreDiagnostics.lastFrameMs.toFixed(2)}</span>
          <span data-testid="map-source-setdata-count">{sourceSetDataCount}</span>
          <span data-testid="map-source-last-setdata-ms">{lastSourceSetDataMs.current.toFixed(2)}</span>
          <span data-testid="map-viewport-phase1-fetches">{viewportDiagnostics.phase1FetchCount}</span>
          <span data-testid="map-viewport-phase2-fetches">{viewportDiagnostics.phase2FetchCount}</span>
          <span data-testid="map-viewport-phase1-cache-hits">{viewportDiagnostics.phase1CacheHits}</span>
          <span data-testid="map-viewport-phase2-cache-hits">{viewportDiagnostics.phase2CacheHits}</span>
          <span data-testid="map-viewport-phase2-zoom-bucket">{viewportDiagnostics.lastPhase2ZoomBucket ?? ''}</span>
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
                Map unavailable
              </div>
              <div className={`text-[10px] ${
                isClassic ? 'text-white/25' : 'text-[var(--text-muted)]/60'
              }`}>
                Mapbox couldn’t load. Check your connection, or set VITE_MAPBOX_TOKEN to enable the map.
              </div>
            </div>
          </div>
        )}

        {/* Overlay container */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {mapReady && (
            <ConnectionWarningBanner
              state={connectionState}
              onRetry={spatialRefetch}
              onUseMock={onSourceChange ? () => onSourceChange('mock') : undefined}
            />
          )}

          <OverlayFiltersBar
            isClassic={isClassic}
            visibleCount={visibleWellIds.size}
            selectedCount={selectedWellIds.size}
            totalCount={totalWellCount}
            activeGroupName={activeGroup?.name}
            activeGroupColor={activeGroup?.color}
            statusCounts={activeGroupStatusCounts}
            operatorFilter={operatorFilter}
            formationFilter={formationFilter}
            statusFilter={statusFilter}
            operatorOptions={operatorOptions}
            formationOptions={formationOptions}
            statusOptions={statusOptions}
            onToggleOperator={onToggleOperator}
            onToggleFormation={onToggleFormation}
            onToggleStatus={onToggleStatus}
            onResetFilters={onResetFilters}
            onSelectAll={onSelectAll}
            onClearSelection={onClearSelection}
          />

          {(spatialLoading || spatialLoadingTrajectories) && (
            <div className="absolute top-14 right-14 z-20 pointer-events-none">
              <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
                isClassic
                  ? 'bg-black/60 text-white/60'
                  : 'bg-[var(--surface-1)]/80 text-[var(--text-muted)] backdrop-blur-sm'
              }`}>
                {spatialLoadingTrajectories ? 'Loading laterals…' : 'Loading wells…'}
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
            onSourceChange={handleSourceChange}
            fallbackActive={spatialFallback}
            layerVisibility={layerVisibility}
            onToggleMapLayer={handleToggleMapLayer}
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

          {/* Trajectory-only error card — full data-source errors are shown by
              the ConnectionWarningBanner above; this covers the laterals layer. */}
          {isTrajectoryOnlyError && !errorDismissed && (
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
                      {isTrajectoryOnlyError ? '3D laterals unavailable' : 'Failed to load wells'}
                    </div>
                    <div className={`text-[9px] mt-1 leading-snug ${isClassic ? 'text-white/50' : 'text-[var(--text-muted)]'}`}>
                      {displayedSpatialError}
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
                      {spatialError && onSourceChange && (
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

          {/* Context-aware insights dock — floats bottom-center; flips between
              group mode and lasso-selection mode based on selectedWells. */}
          {!dockDismissed && (
            <InsightsDock
              activeGroup={activeGroup}
              groupWells={activeGroupWells}
              selectedWells={selectedWells}
              isClassic={isClassic}
              onDismiss={() => setDockDismissed(true)}
              onClearSelection={onClearSelection}
            />
          )}
        </div>
      </div>

      {/* Right inspector column — active-group detail (collapsible, Task 1.2 'inspector' key) */}
      <aside
        data-testid="inspector-column"
        className={`flex-none transition-[width] duration-300 overflow-y-auto ${inspectorCollapsed ? 'w-9' : 'w-[288px]'}`}
        style={{ background: 'var(--glass-sidebar-bg)', borderLeft: '1px solid var(--glass-sidebar-border)' }}
        aria-label="Group inspector"
      >
        {inspectorCollapsed ? (
          <button
            type="button"
            data-testid="inspector-expand"
            aria-label="Expand inspector"
            title="Expand inspector"
            onClick={handleToggleInspector}
            className="w-full h-12 flex items-center justify-center text-theme-muted hover:text-theme-text focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-theme-cyan"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className="p-3">
            <div className="flex justify-end mb-1">
              <button
                type="button"
                data-testid="inspector-collapse"
                aria-label="Collapse inspector"
                title="Collapse inspector"
                onClick={handleToggleInspector}
                className="w-6 h-6 flex items-center justify-center text-theme-muted hover:text-theme-text rounded-inner focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-theme-cyan"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {activeGroup ? (
              <GroupInspector group={activeGroup} wells={activeGroupWells} />
            ) : (
              <div className="text-[10px] uppercase tracking-widest text-theme-muted p-2">No active group</div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
