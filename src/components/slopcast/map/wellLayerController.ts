import type { Well } from '../../../types';

export const WELL_SOURCE_ID = 'wells-source';
export const WELL_CLUSTER_LAYER_ID = 'wells-clusters';
const WELL_CLUSTER_COUNT_LAYER_ID = 'wells-cluster-count';
const WELL_LABEL_LAYER_ID = 'wells-labels';
const WELL_GLOW_LAYER_ID = 'wells-glow';
export const WELL_STATUS_LAYER_IDS = ['wells-producing', 'wells-duc', 'wells-permit'] as const;

export type WellStatusLayerId = typeof WELL_STATUS_LAYER_IDS[number];

export interface WellLayerPalette {
  selectedStroke: string;
}

export interface WellLayerTheme {
  clusterColor: string;
  clusterTextColor: string;
  wellLabelColor: string;
  wellLabelHalo: string;
  unassignedFill: string;
  selectedStroke: string;
}

export interface WellLayerEventHandlers {
  onWellClick: (id: string, point: { x: number; y: number }) => void;
  onWellHover: (id: string, point: { x: number; y: number }) => void;
  onWellLeave: () => void;
  onMapEmptyClick: () => void;
}

export const buildWellColorExpression = (fallbackColor: string) => {
  return ['coalesce', ['get', 'groupColor'], fallbackColor];
};

const buildWellColorMatchExpression = (
  _wells: Well[],
  _getWellColor: (wellId: string) => string,
  fallbackColor: string,
) => {
  return buildWellColorExpression(fallbackColor);
};

const clusterRadiusExpression = [
  'interpolate', ['linear'], ['zoom'],
  5, ['interpolate', ['linear'], ['get', 'point_count'], 10, 16, 50, 24, 200, 32],
  8, ['interpolate', ['linear'], ['get', 'point_count'], 10, 12, 50, 18, 200, 24],
  10, ['interpolate', ['linear'], ['get', 'point_count'], 10, 10, 50, 14, 100, 18],
];

export function addWellSourceAndLayers(map: any, geoJson: unknown, colorMatchExpr: unknown, theme: WellLayerTheme) {
  if (!map.getSource(WELL_SOURCE_ID)) {
    map.addSource(WELL_SOURCE_ID, {
      type: 'geojson',
      data: geoJson,
      cluster: true,
      clusterRadius: 72,
      clusterMaxZoom: 10,
      promoteId: 'id',
    });
  }

  if (!map.getLayer(WELL_CLUSTER_LAYER_ID)) {
    map.addLayer({
      id: WELL_CLUSTER_LAYER_ID,
      type: 'circle',
      source: WELL_SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': clusterRadiusExpression,
        'circle-color': theme.clusterColor,
        'circle-opacity': 0.45,
        'circle-stroke-width': 2,
        'circle-stroke-color': theme.clusterColor,
        'circle-stroke-opacity': 0.25,
      },
    });
  }

  if (!map.getLayer(WELL_CLUSTER_COUNT_LAYER_ID)) {
    map.addLayer({
      id: WELL_CLUSTER_COUNT_LAYER_ID,
      type: 'symbol',
      source: WELL_SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12, 8, 10, 10, 9],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': theme.clusterTextColor,
        'text-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 10, 0.55],
      },
    });
  }

  addWellStatusLayers(map, colorMatchExpr, theme);

  if (!map.getLayer(WELL_LABEL_LAYER_ID)) {
    map.addLayer({
      id: WELL_LABEL_LAYER_ID,
      type: 'symbol',
      source: WELL_SOURCE_ID,
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
        'text-color': theme.wellLabelColor,
        'text-halo-color': theme.wellLabelHalo,
        'text-halo-width': 1,
      },
    });
  }
}

function addWellStatusLayers(map: any, colorMatchExpr: unknown, theme: WellLayerTheme) {
  const defaultRadius = ['interpolate', ['linear'], ['zoom'], 6, 3, 10, 6, 14, 10];
  const permitRadius = ['interpolate', ['linear'], ['zoom'], 6, 2, 10, 4, 14, 7];
  const selectedState = ['boolean', ['feature-state', 'selected'], false];
  const dimmedState = ['boolean', ['feature-state', 'dimmed'], false];
  const visibleState = ['boolean', ['feature-state', 'visible'], true];
  const baseOpacity = ['case', dimmedState, 0.3, visibleState, 1, 0.3];
  const glowRadius = ['interpolate', ['linear'], ['zoom'], 6, 6, 10, 14, 14, 22];
  const glowOpacity = [
    'case',
    dimmedState, 0.05,
    ['!', visibleState], 0.05,
    ['==', ['get', 'status'], 'PRODUCING'], 0.35,
    ['==', ['get', 'status'], 'DUC'], 0.18,
    0.10,
  ];

  if (!map.getLayer(WELL_GLOW_LAYER_ID)) {
    map.addLayer({
      id: WELL_GLOW_LAYER_ID,
      type: 'circle',
      source: WELL_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': glowRadius,
        'circle-color': colorMatchExpr,
        'circle-blur': 0.7,
        'circle-opacity': glowOpacity,
        'circle-opacity-transition': { duration: 300 },
        'circle-radius-transition': { duration: 300 },
      },
    });
  }

  if (!map.getLayer('wells-producing')) {
    map.addLayer({
      id: 'wells-producing',
      type: 'circle',
      source: WELL_SOURCE_ID,
      filter: ['==', ['get', 'status'], 'PRODUCING'],
      paint: {
        'circle-radius': defaultRadius,
        'circle-color': colorMatchExpr,
        'circle-stroke-width': ['case', selectedState, 2, 0],
        'circle-stroke-color': theme.selectedStroke,
        'circle-opacity': baseOpacity,
      },
    });
  }

  if (!map.getLayer('wells-duc')) {
    map.addLayer({
      id: 'wells-duc',
      type: 'circle',
      source: WELL_SOURCE_ID,
      filter: ['==', ['get', 'status'], 'DUC'],
      paint: {
        'circle-radius': defaultRadius,
        'circle-color': colorMatchExpr,
        'circle-opacity': ['case', dimmedState, 0.1, visibleState, 0.15, 0.1],
        'circle-stroke-width': ['case', selectedState, 2.5, 2],
        'circle-stroke-color': colorMatchExpr,
        'circle-stroke-opacity': baseOpacity,
      },
    });
  }

  if (!map.getLayer('wells-permit')) {
    map.addLayer({
      id: 'wells-permit',
      type: 'circle',
      source: WELL_SOURCE_ID,
      filter: ['==', ['get', 'status'], 'PERMIT'],
      paint: {
        'circle-radius': permitRadius,
        'circle-color': colorMatchExpr,
        'circle-stroke-width': ['case', selectedState, 2, 0],
        'circle-stroke-color': theme.selectedStroke,
        'circle-opacity': ['case', dimmedState, 0.15, visibleState, 0.5, 0.15],
      },
    });
  }
}

export function updateWellFeatureState(
  map: any,
  wells: Well[],
  selectedWellIds: Set<string>,
  dimmedWellIds: Set<string>,
  visibleWellIds: Set<string>,
) {
  for (const well of wells) {
    try {
      map.setFeatureState(
        { source: WELL_SOURCE_ID, id: well.id },
        {
          selected: selectedWellIds.has(well.id),
          dimmed: dimmedWellIds.has(well.id),
          visible: visibleWellIds.has(well.id),
        },
      );
    } catch {
      // Style/source can disappear during Mapbox style swaps.
    }
  }
}

export function updateWellLayerPaint(map: any, colorMatchExpr: unknown, theme: WellLayerTheme) {
  if (map.getLayer(WELL_GLOW_LAYER_ID)) {
    map.setPaintProperty(WELL_GLOW_LAYER_ID, 'circle-color', colorMatchExpr);
  }
  for (const layerId of WELL_STATUS_LAYER_IDS) {
    if (!map.getLayer(layerId)) continue;
    map.setPaintProperty(layerId, 'circle-color', colorMatchExpr);
    if (layerId === 'wells-duc') {
      map.setPaintProperty(layerId, 'circle-stroke-color', colorMatchExpr);
    }
  }
  if (map.getLayer(WELL_CLUSTER_LAYER_ID)) {
    map.setPaintProperty(WELL_CLUSTER_LAYER_ID, 'circle-color', theme.clusterColor);
    map.setPaintProperty(WELL_CLUSTER_LAYER_ID, 'circle-stroke-color', theme.clusterColor);
  }
  if (map.getLayer(WELL_LABEL_LAYER_ID)) {
    map.setPaintProperty(WELL_LABEL_LAYER_ID, 'text-color', theme.wellLabelColor);
  }
}

export function bindWellLayerEvents(map: any, handlers: WellLayerEventHandlers) {
  const layerHandlers = WELL_STATUS_LAYER_IDS.map((layerId) => {
    const click = (event: any) => {
      const feature = event.features?.[0];
      if (!feature?.properties?.id) return;
      const point = map.project(event.features[0].geometry.coordinates);
      handlers.onWellClick(feature.properties.id, { x: point.x, y: point.y });
    };
    const mouseenter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const mousemove = (event: any) => {
      const feature = event.features?.[0];
      if (feature?.properties?.id) {
        handlers.onWellHover(feature.properties.id, { x: event.point.x, y: event.point.y });
      }
    };
    const mouseleave = () => {
      map.getCanvas().style.cursor = '';
      handlers.onWellLeave();
    };
    map.on('click', layerId, click);
    map.on('mouseenter', layerId, mouseenter);
    map.on('mousemove', layerId, mousemove);
    map.on('mouseleave', layerId, mouseleave);
    return { layerId, click, mouseenter, mousemove, mouseleave };
  });

  const mapClick = (event: any) => {
    const features = map.queryRenderedFeatures(event.point, { layers: [...WELL_STATUS_LAYER_IDS] });
    if (!features || features.length === 0) handlers.onMapEmptyClick();
  };
  const clusterClick = (event: any) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const clusterId = feature.properties.cluster_id;
    const source = map.getSource(WELL_SOURCE_ID);
    source.getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number) => {
      if (err) return;
      map.easeTo({ center: feature.geometry.coordinates, zoom });
    });
  };
  const clusterMouseEnter = () => {
    map.getCanvas().style.cursor = 'pointer';
  };
  const clusterMouseLeave = () => {
    map.getCanvas().style.cursor = '';
  };

  map.on('click', mapClick);
  map.on('click', WELL_CLUSTER_LAYER_ID, clusterClick);
  map.on('mouseenter', WELL_CLUSTER_LAYER_ID, clusterMouseEnter);
  map.on('mouseleave', WELL_CLUSTER_LAYER_ID, clusterMouseLeave);

  return () => {
    for (const entry of layerHandlers) {
      try {
        map.off('click', entry.layerId, entry.click);
        map.off('mouseenter', entry.layerId, entry.mouseenter);
        map.off('mousemove', entry.layerId, entry.mousemove);
        map.off('mouseleave', entry.layerId, entry.mouseleave);
      } catch {
        // map style may already be torn down
      }
    }
    try {
      map.off('click', mapClick);
      map.off('click', WELL_CLUSTER_LAYER_ID, clusterClick);
      map.off('mouseenter', WELL_CLUSTER_LAYER_ID, clusterMouseEnter);
      map.off('mouseleave', WELL_CLUSTER_LAYER_ID, clusterMouseLeave);
    } catch {
      // map style may already be torn down
    }
  };
}
