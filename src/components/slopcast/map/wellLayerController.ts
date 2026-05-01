import type { Well } from '../../../types';

export const WELL_SOURCE_ID = 'wells-source';
export const WELL_CLUSTER_LAYER_ID = 'wells-clusters';
export const WELL_CLUSTER_COUNT_LAYER_ID = 'wells-cluster-count';
export const WELL_LABEL_LAYER_ID = 'wells-labels';
export const WELL_GLOW_LAYER_ID = 'wells-glow';
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

export const buildWellColorMatchExpression = (
  wells: Well[],
  getWellColor: (wellId: string) => string,
  fallbackColor: string,
) => {
  const pairs: string[] = [];
  const colorMap = new Map<string, string>();
  wells.forEach(well => {
    const color = getWellColor(well.id);
    if (!colorMap.has(well.id)) colorMap.set(well.id, color);
  });
  colorMap.forEach((color, id) => {
    pairs.push(id, color);
  });
  return ['match', ['get', 'id'], ...pairs, fallbackColor];
};

const clusterRadiusExpression = [
  'interpolate', ['linear'], ['zoom'],
  5, ['interpolate', ['linear'], ['get', 'point_count'], 10, 20, 50, 30, 200, 40],
  8, ['interpolate', ['linear'], ['get', 'point_count'], 10, 15, 50, 22, 200, 30],
  11, ['interpolate', ['linear'], ['get', 'point_count'], 10, 12, 50, 18, 100, 22],
];

export function addWellSourceAndLayers(map: any, geoJson: unknown, colorMatchExpr: unknown, theme: WellLayerTheme) {
  if (!map.getSource(WELL_SOURCE_ID)) {
    map.addSource(WELL_SOURCE_ID, {
      type: 'geojson',
      data: geoJson,
      cluster: true,
      clusterRadius: 100,
      clusterMaxZoom: 12,
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
        'circle-opacity': 0.7,
        'circle-stroke-width': 2,
        'circle-stroke-color': theme.clusterColor,
        'circle-stroke-opacity': 0.4,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 14, 8, 12, 11, 10],
        'text-allow-overlap': true,
      },
      paint: { 'text-color': theme.clusterTextColor },
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

export function addWellStatusLayers(map: any, colorMatchExpr: unknown, theme: WellLayerTheme) {
  const defaultRadius = ['interpolate', ['linear'], ['zoom'], 6, 3, 10, 6, 14, 10];
  const permitRadius = ['interpolate', ['linear'], ['zoom'], 6, 2, 10, 4, 14, 7];
  const baseOpacity = ['case', ['get', 'dimmed'], 0.3, ['get', 'visible'], 1, 0.3];
  const glowRadius = ['interpolate', ['linear'], ['zoom'], 6, 6, 10, 14, 14, 22];
  const glowOpacity = [
    'case',
    ['get', 'dimmed'], 0.05,
    ['!', ['get', 'visible']], 0.05,
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
        'circle-stroke-width': ['case', ['get', 'selected'], 2, 0],
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
        'circle-opacity': ['case', ['get', 'dimmed'], 0.1, ['get', 'visible'], 0.15, 0.1],
        'circle-stroke-width': ['case', ['get', 'selected'], 2.5, 2],
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
        'circle-stroke-width': ['case', ['get', 'selected'], 2, 0],
        'circle-stroke-color': theme.selectedStroke,
        'circle-opacity': ['case', ['get', 'dimmed'], 0.15, ['get', 'visible'], 0.5, 0.15],
      },
    });
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
