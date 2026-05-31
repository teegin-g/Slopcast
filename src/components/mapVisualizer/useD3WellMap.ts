import { useEffect, useRef, useState, useEffectEvent } from 'react';
import * as d3 from 'd3';
import type { Well, WellGroup } from '../../types';
import { ThemeId, getTheme, MapPalette } from '../../theme/themes';
import type { HeatmapMetric } from './useMapboxHeatmap';

export type SelectionTool = 'lasso' | 'rectangle' | 'formation';

// Section grid: 1 mile ≈ 0.01449° lat at ~32°N
const SECTION_MILE_LAT = 0.01449;
const SECTION_MILE_LNG = 0.01709; // adjusted for ~32°N latitude

export interface UseD3WellMapParams {
  svgRef: React.RefObject<SVGSVGElement>;
  wells: Well[];
  selectedWellIds: Set<string>;
  visibleWellIds: Set<string>;
  dimmedWellIds: Set<string>;
  groups: WellGroup[];
  dimensions: { width: number; height: number };
  themeId: ThemeId;
  showGrid: boolean;
  showHeatmap: boolean;
  heatmapMetric: HeatmapMetric;
  formationFilter: string | null;
  useMapbox: boolean;
  mapboxLoaded: boolean;
  getWellColor: (wellId: string) => string;
  isDimmedWell: (wellId: string) => boolean;
  isVisibleWell: (wellId: string) => boolean;
  mp: MapPalette;
  onToggleWell: (id: string) => void;
  onSelectWells: (ids: string[]) => void;
}

export interface UseD3WellMapResult {
  selectionTool: SelectionTool;
  setSelectionTool: React.Dispatch<React.SetStateAction<SelectionTool>>;
  isSelecting: boolean;
  setIsSelecting: React.Dispatch<React.SetStateAction<boolean>>;
  lassoPoints: [number, number][];
  rectStart: [number, number] | null;
  rectEnd: [number, number] | null;
}

/**
 * Owns the D3 well-map rendering effect (laterals, wells, grids, fallback
 * heatmap glow) and the lasso/rectangle selection + drag logic. The drawing
 * math, scales, projections, event handlers and the full dependency array are
 * preserved exactly from the original MapVisualizer effect.
 */
export function useD3WellMap(params: UseD3WellMapParams): UseD3WellMapResult {
  const {
    svgRef,
    wells,
    selectedWellIds,
    visibleWellIds,
    dimmedWellIds,
    groups,
    dimensions,
    themeId,
    showGrid,
    showHeatmap,
    heatmapMetric,
    formationFilter,
    useMapbox,
    mapboxLoaded,
    getWellColor,
    isDimmedWell,
    isVisibleWell,
    mp,
    onToggleWell,
    onSelectWells,
  } = params;

  const [selectionTool, setSelectionTool] = useState<SelectionTool>('lasso');
  const [isSelecting, setIsSelecting] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<[number, number][]>([]);
  const [rectStart, setRectStart] = useState<[number, number] | null>(null);
  const [rectEnd, setRectEnd] = useState<[number, number] | null>(null);

  const lassoPointsRef = useRef<[number, number][]>([]);

  // Effect Events: always read latest prop values without being reactive deps
  const onToggleWellEvent = useEffectEvent(onToggleWell);
  const onSelectWellsEvent = useEffectEvent(onSelectWells);

  // Main D3 rendering
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.map-content').remove();

    const mapG = svg.append('g').classed('map-content', true);
    const width = dimensions.width;
    const height = dimensions.height;
    const padding = 40;

    const xExtent = d3.extent(wells, d => d.lng) as [number, number];
    const yExtent = d3.extent(wells, d => d.lat) as [number, number];
    const xScale = d3.scaleLinear().domain(xExtent).range([padding, width - padding]);
    const yScale = d3.scaleLinear().domain(yExtent).range([height - padding, padding]);

    // Regular grid
    if (!useMapbox || !mapboxLoaded) {
      mapG.selectAll('.grid-v').data(d3.range(0, width, 100)).enter().append('line')
        .attr('x1', d => d).attr('x2', d => d).attr('y1', 0).attr('y2', height)
        .attr('stroke', mp.gridColor).attr('stroke-width', 1).attr('opacity', mp.gridOpacity);
      mapG.selectAll('.grid-h').data(d3.range(0, height, 100)).enter().append('line')
        .attr('x1', 0).attr('x2', width).attr('y1', d => d).attr('y2', d => d)
        .attr('stroke', mp.gridColor).attr('stroke-width', 1).attr('opacity', mp.gridOpacity);
    }

    // Section grid overlay (1-mile grid)
    if (showGrid) {
      const [minLng, maxLng] = xExtent;
      const [minLat, maxLat] = yExtent;
      const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

      // Vertical lines (longitude)
      const startLng = Math.floor(minLng / SECTION_MILE_LNG) * SECTION_MILE_LNG;
      for (let lng = startLng; lng <= maxLng + SECTION_MILE_LNG; lng += SECTION_MILE_LNG) {
        gridLines.push({ x1: xScale(lng), y1: yScale(minLat), x2: xScale(lng), y2: yScale(maxLat) });
      }
      // Horizontal lines (latitude)
      const startLat = Math.floor(minLat / SECTION_MILE_LAT) * SECTION_MILE_LAT;
      for (let lat = startLat; lat <= maxLat + SECTION_MILE_LAT; lat += SECTION_MILE_LAT) {
        gridLines.push({ x1: xScale(minLng), y1: yScale(lat), x2: xScale(maxLng), y2: yScale(lat) });
      }

      mapG.selectAll('.section-grid').data(gridLines).enter().append('line')
        .classed('section-grid', true)
        .attr('x1', d => d.x1).attr('y1', d => d.y1)
        .attr('x2', d => d.x2).attr('y2', d => d.y2)
        .attr('stroke', mp.gridColor).attr('stroke-width', 0.5).attr('opacity', 0.3)
        .attr('stroke-dasharray', '3,3');
    }

    // Heatmap overlay for non-Mapbox mode
    if (showHeatmap && (!useMapbox || !mapboxLoaded)) {
      wells.forEach(w => {
        const x = xScale(w.lng);
        const y = yScale(w.lat);
        mapG.append('circle')
          .attr('cx', x).attr('cy', y).attr('r', 25)
          .attr('fill', mp.glowColor).attr('fill-opacity', 0.08)
          .attr('pointer-events', 'none');
      });
    }

    // Laterals
    mapG.selectAll('line.lateral').data(wells).enter().append('line')
      .classed('lateral', true)
      .attr('x1', d => xScale(d.lng)).attr('y1', d => yScale(d.lat))
      .attr('x2', d => xScale(d.lng) + (d.lateralLength / 1000) * 4).attr('y2', d => yScale(d.lat) + 5)
      .attr('stroke', d => getWellColor(d.id)).attr('stroke-width', 2)
      .attr('opacity', d => isDimmedWell(d.id) ? 0.08 : 0.4)
      .attr('pointer-events', 'none');

    // Wells
    mapG.selectAll('circle.well').data(wells).enter().append('circle')
      .classed('well', true)
      .attr('cx', d => xScale(d.lng)).attr('cy', d => yScale(d.lat)).attr('r', 5)
      .attr('fill', d => {
        if (formationFilter && d.formation === formationFilter) return mp.glowColor;
        return getWellColor(d.id);
      })
      .attr('stroke', d => (selectedWellIds.has(d.id) && !isDimmedWell(d.id)) ? mp.selectedStroke : 'none')
      .attr('stroke-width', d => (selectedWellIds.has(d.id) && !isDimmedWell(d.id)) ? 3 : 0)
      .attr('fill-opacity', d => {
        if (isDimmedWell(d.id)) return 0.12;
        return selectedWellIds.has(d.id) ? 1 : 0.6;
      })
      .attr('filter', d => (selectedWellIds.has(d.id) && !isDimmedWell(d.id) && getTheme(themeId).features.glowEffects) ? 'url(#neon-glow)' : 'none')
      .attr('cursor', d => isDimmedWell(d.id) ? 'default' : 'pointer')
      .on('click', (event, d) => {
        if (!event.defaultPrevented && isVisibleWell(d.id)) onToggleWellEvent(d.id);
      })
      .on('mouseover', function (_event, d) {
        if (isDimmedWell(d.id)) return;
        d3.select(this).attr('r', 8).attr('fill-opacity', 1);
      })
      .on('mouseout', function (_event, d) {
        if (isDimmedWell(d.id)) return;
        d3.select(this).attr('r', 5).attr('fill-opacity', selectedWellIds.has(d.id) ? 1 : 0.6);
      });

    // Selection tools
    svg.on('.drag', null);

    if (selectionTool === 'lasso') {
      const drag = d3.drag<SVGSVGElement, unknown>()
        .filter((event) => isSelecting || event.shiftKey)
        .on('start', () => { setLassoPoints([]); lassoPointsRef.current = []; })
        .on('drag', (event) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          const pt: [number, number] = [x, y];
          setLassoPoints(prev => [...prev, pt]);
          lassoPointsRef.current.push(pt);
        })
        .on('end', () => {
          const pts = lassoPointsRef.current;
          if (pts.length > 2) {
            const selected = wells.flatMap(w => {
              if (!isVisibleWell(w.id)) return [];
              return d3.polygonContains(pts, [xScale(w.lng), yScale(w.lat)]) ? [w.id] : [];
            });
            if (selected.length > 0) onSelectWellsEvent(selected);
          }
          setLassoPoints([]);
          lassoPointsRef.current = [];
          if (isSelecting) setIsSelecting(false);
        });
      svg.call(drag);
    } else if (selectionTool === 'rectangle') {
      const drag = d3.drag<SVGSVGElement, unknown>()
        .filter((event) => isSelecting || event.shiftKey)
        .on('start', (event) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setRectStart([x, y]);
          setRectEnd([x, y]);
        })
        .on('drag', (event) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setRectEnd([x, y]);
        })
        .on('end', () => {
          if (rectStart && rectEnd) {
            const [x1, y1] = rectStart;
            const [x2, y2] = rectEnd || rectStart;
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            const selected = wells.flatMap(w => {
              if (!isVisibleWell(w.id)) return [];
              const wx = xScale(w.lng), wy = yScale(w.lat);
              return (wx >= minX && wx <= maxX && wy >= minY && wy <= maxY) ? [w.id] : [];
            });
            if (selected.length > 0) onSelectWellsEvent(selected);
          }
          setRectStart(null);
          setRectEnd(null);
          if (isSelecting) setIsSelecting(false);
        });
      svg.call(drag);
    }

    svg.style('cursor', isSelecting ? 'crosshair' : 'default');

    return () => {
      svg.on('.drag', null);
      svg.selectAll('.map-content').remove();
    };
  }, [wells, selectedWellIds, visibleWellIds, dimmedWellIds, groups, dimensions, selectionTool, isSelecting, themeId, showGrid, showHeatmap, heatmapMetric, formationFilter, useMapbox, mapboxLoaded, getWellColor, isDimmedWell, isVisibleWell, mp]);

  return {
    selectionTool,
    setSelectionTool,
    isSelecting,
    setIsSelecting,
    lassoPoints,
    rectStart,
    rectEnd,
  };
}
