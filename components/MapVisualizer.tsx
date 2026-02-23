import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Well, WellGroup } from '../types';
import { ThemeId, getTheme } from '../theme/themes';

interface ActiveFilter {
  label: string;
  value: string;
}

type SelectionTool = 'lasso' | 'rectangle' | 'formation';
type HeatmapMetric = 'density' | 'eur_ft' | 'npv';

interface MapVisualizerProps {
  wells: Well[];
  selectedWellIds: Set<string>;
  visibleWellIds: Set<string>;
  dimmedWellIds: Set<string>;
  groups: WellGroup[];
  onToggleWell: (id: string) => void;
  onSelectWells: (ids: string[]) => void;
  themeId: ThemeId;
  uiBottomInsetPx?: number;
  activeFilters?: ActiveFilter[];
}

const PERMIAN_CENTER = { lat: 31.9, lng: -102.3 };
const MAPBOX_TOKEN = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_MAPBOX_TOKEN : '';

const USA_BOUNDS = { minLat: 24.0, maxLat: 50.0, minLng: -125.0, maxLng: -66.0 };

function buildOfflineUsFallbackMap(width: number, height: number, accentHex = '#f59e0b'): string {
  const mapWidth = Math.max(640, Math.min(1280, Math.round(width || 1024)));
  const mapHeight = Math.max(400, Math.min(900, Math.round(height || 560)));
  const project = (lng: number, lat: number) => {
    const x = ((lng - USA_BOUNDS.minLng) / (USA_BOUNDS.maxLng - USA_BOUNDS.minLng)) * mapWidth;
    const y = mapHeight - ((lat - USA_BOUNDS.minLat) / (USA_BOUNDS.maxLat - USA_BOUNDS.minLat)) * mapHeight;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  };
  const usaOutlineLonLat: Array<[number, number]> = [
    [-124.8, 48.8], [-123.1, 46.2], [-124.1, 42.0], [-122.7, 40.0], [-121.8, 38.5],
    [-120.3, 37.1], [-118.4, 34.0], [-117.1, 32.5], [-113.0, 32.3], [-109.0, 31.3],
    [-106.5, 31.8], [-104.5, 29.9], [-100.5, 28.9], [-97.6, 26.1], [-94.5, 28.8],
    [-90.2, 29.1], [-88.0, 30.4], [-85.1, 29.9], [-82.6, 27.2], [-80.0, 26.0],
    [-80.4, 30.8], [-79.0, 33.8], [-77.2, 35.7], [-75.4, 38.8], [-74.0, 40.7],
    [-71.0, 41.7], [-70.0, 43.7], [-73.5, 45.0], [-78.8, 43.5], [-82.8, 42.2],
    [-84.5, 46.0], [-89.6, 47.8], [-95.2, 49.0], [-103.2, 49.0], [-111.0, 49.0],
    [-117.2, 49.0], [-124.8, 48.8],
  ];
  const outlinePoints = usaOutlineLonLat.map(([lng, lat]) => project(lng, lat).join(',')).join(' ');
  const permian = project(PERMIAN_CENTER.lng, PERMIAN_CENTER.lat);
  const permianGlowRadius = Math.max(14, Math.round(mapWidth * 0.018));
  const permianCoreRadius = Math.max(5, Math.round(mapWidth * 0.006));
  const lonLines = [-120, -110, -100, -90, -80, -70].map(lng => {
    const [x1, y1] = project(lng, USA_BOUNDS.minLat);
    const [x2, y2] = project(lng, USA_BOUNDS.maxLat);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join('');
  const latLines = [26, 30, 35, 40, 45, 49].map(lat => {
    const [x1, y1] = project(USA_BOUNDS.minLng, lat);
    const [x2, y2] = project(USA_BOUNDS.maxLng, lat);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${mapWidth} ${mapHeight}" width="${mapWidth}" height="${mapHeight}">
  <defs><linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0d1f36" /><stop offset="100%" stop-color="#071322" /></linearGradient>
  <linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#31537a" /><stop offset="100%" stop-color="#213f61" /></linearGradient></defs>
  <rect x="0" y="0" width="${mapWidth}" height="${mapHeight}" fill="url(#ocean)" />
  <g stroke="rgba(129,164,204,0.2)" stroke-width="1">${lonLines}${latLines}</g>
  <polygon points="${outlinePoints}" fill="url(#land)" stroke="rgba(193,220,255,0.55)" stroke-width="2" />
  <circle cx="${permian[0]}" cy="${permian[1]}" r="${permianGlowRadius}" fill="${accentHex}" fill-opacity="0.16" />
  <circle cx="${permian[0]}" cy="${permian[1]}" r="${permianCoreRadius + 5}" fill="none" stroke="${accentHex}" stroke-opacity="0.38" stroke-width="2" />
  <circle cx="${permian[0]}" cy="${permian[1]}" r="${permianCoreRadius}" fill="${accentHex}" stroke="rgba(255,255,255,0.65)" stroke-width="2" />
  <text x="${permian[0] + 10}" y="${permian[1] - 10}" fill="rgba(244,220,182,0.9)" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="0.08em">PERMIAN BASIN</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Section grid: 1 mile ≈ 0.01449° lat at ~32°N
const SECTION_MILE_LAT = 0.01449;
const SECTION_MILE_LNG = 0.01709; // adjusted for ~32°N latitude

const MapVisualizer: React.FC<MapVisualizerProps> = ({
  wells,
  selectedWellIds,
  visibleWellIds,
  dimmedWellIds,
  groups,
  onToggleWell,
  onSelectWells,
  themeId,
  uiBottomInsetPx = 0,
  activeFilters = [],
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapboxContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectionTool, setSelectionTool] = useState<SelectionTool>('lasso');
  const [isSelecting, setIsSelecting] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<[number, number][]>([]);
  const [rectStart, setRectStart] = useState<[number, number] | null>(null);
  const [rectEnd, setRectEnd] = useState<[number, number] | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('density');
  const [useMapbox, setUseMapbox] = useState(!!MAPBOX_TOKEN);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [formationFilter, setFormationFilter] = useState<string | null>(null);
  const isClassic = themeId === 'mario';

  const lassoPointsRef = useRef<[number, number][]>([]);
  const themeMeta = getTheme(themeId);
  const mp = themeMeta.mapPalette;

  const fallbackBasemapUrl = useMemo(() => {
    return buildOfflineUsFallbackMap(dimensions.width, dimensions.height, mp.glowColor);
  }, [dimensions.width, dimensions.height, mp.glowColor]);

  const formations = useMemo(() => {
    const set = new Set<string>();
    wells.forEach(w => set.add(w.formation));
    return Array.from(set).sort();
  }, [wells]);

  const getWellColor = useCallback((wellId: string): string => {
    for (const group of groups) {
      if (group.wellIds.has(wellId)) return group.color;
    }
    return mp.unassignedFill;
  }, [groups, mp.unassignedFill]);

  const isDimmedWell = useCallback((wellId: string) => dimmedWellIds.has(wellId), [dimmedWellIds]);
  const isVisibleWell = useCallback((wellId: string) => visibleWellIds.has(wellId), [visibleWellIds]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Mapbox GL if token available
  useEffect(() => {
    if (!useMapbox || !mapboxContainerRef.current || mapRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const mapboxgl = await import('mapbox-gl');
        // @ts-ignore - Vite handles CSS imports at runtime
        await import('mapbox-gl/dist/mapbox-gl.css');
        if (cancelled) return;

        (mapboxgl as any).default.accessToken = MAPBOX_TOKEN;
        const map = new (mapboxgl as any).default.Map({
          container: mapboxContainerRef.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [PERMIAN_CENTER.lng, PERMIAN_CENTER.lat],
          zoom: 8,
          attributionControl: false,
        });

        map.on('load', () => {
          if (cancelled) return;
          mapRef.current = map;
          setMapboxLoaded(true);
        });
      } catch {
        setUseMapbox(false);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapboxLoaded(false);
      }
    };
  }, [useMapbox]);

  // Toggle satellite style
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded) return;
    const style = isSatellite
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v11';
    mapRef.current.setStyle(style);
  }, [isSatellite, mapboxLoaded]);

  // Heatmap layer on Mapbox
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded) return;
    const map = mapRef.current;

    // Remove existing heatmap
    if (map.getLayer('well-heatmap')) map.removeLayer('well-heatmap');
    if (map.getSource('well-heatmap-source')) map.removeSource('well-heatmap-source');

    if (!showHeatmap) return;

    const features = wells.map(w => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [w.lng, w.lat] },
      properties: {
        weight: heatmapMetric === 'density' ? 1 : heatmapMetric === 'eur_ft' ? w.lateralLength / 10000 : 1,
      },
    }));

    map.addSource('well-heatmap-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    map.addLayer({
      id: 'well-heatmap',
      type: 'heatmap',
      source: 'well-heatmap-source',
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': 1,
        'heatmap-radius': 30,
        'heatmap-opacity': 0.6,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, 'rgba(0,0,255,0.3)',
          0.4, 'rgba(0,128,0,0.5)',
          0.6, 'rgba(255,255,0,0.6)',
          0.8, 'rgba(255,128,0,0.7)',
          1, 'rgba(255,0,0,0.8)',
        ],
      },
    });
  }, [showHeatmap, heatmapMetric, wells, mapboxLoaded]);

  // Formation filter handler
  const handleFormationSelect = useCallback((formation: string | null) => {
    setFormationFilter(formation);
    if (formation) {
      const matching = wells.filter(w => w.formation === formation).map(w => w.id);
      if (matching.length > 0) onSelectWells(matching);
    }
  }, [wells, onSelectWells]);

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
      .attr('filter', d => (selectedWellIds.has(d.id) && !isDimmedWell(d.id) && themeMeta.features.glowEffects) ? 'url(#neon-glow)' : 'none')
      .attr('cursor', d => isDimmedWell(d.id) ? 'default' : 'pointer')
      .on('click', (event, d) => {
        if (!event.defaultPrevented && isVisibleWell(d.id)) onToggleWell(d.id);
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
            const selected = wells.filter(w => {
              if (!isVisibleWell(w.id)) return false;
              return d3.polygonContains(pts, [xScale(w.lng), yScale(w.lat)]);
            }).map(w => w.id);
            if (selected.length > 0) onSelectWells(selected);
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
            const selected = wells.filter(w => {
              if (!isVisibleWell(w.id)) return false;
              const wx = xScale(w.lng), wy = yScale(w.lat);
              return wx >= minX && wx <= maxX && wy >= minY && wy <= maxY;
            }).map(w => w.id);
            if (selected.length > 0) onSelectWells(selected);
          }
          setRectStart(null);
          setRectEnd(null);
          if (isSelecting) setIsSelecting(false);
        });
      svg.call(drag);
    }

    svg.style('cursor', isSelecting ? 'crosshair' : 'default');
  }, [wells, selectedWellIds, visibleWellIds, dimmedWellIds, groups, dimensions, selectionTool, isSelecting, onToggleWell, onSelectWells, themeId, showGrid, showHeatmap, heatmapMetric, formationFilter, useMapbox, mapboxLoaded]);

  const toolBtnClass = (active: boolean) => isClassic
    ? `px-2 py-1 text-[9px] font-black uppercase tracking-wide rounded-md border transition-colors ${active ? 'bg-theme-magenta text-white border-black/40' : 'bg-black/25 text-white/80 border-black/30 hover:bg-black/35'}`
    : `px-2 py-1 text-[9px] font-black uppercase tracking-wide rounded transition-colors ${active ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan' : 'bg-theme-surface2 text-theme-muted hover:text-theme-text hover:bg-theme-surface1'}`;

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] overflow-hidden relative select-none">
      {/* Basemap layer */}
      {useMapbox ? (
        <div ref={mapboxContainerRef} className="absolute inset-0 z-0" />
      ) : (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={fallbackBasemapUrl}
            alt="Offline US fallback map centered on the Permian Basin"
            className={`h-full w-full object-cover ${isClassic ? 'opacity-42' : 'opacity-52'}`}
          />
          <div className={`absolute inset-0 ${isClassic
            ? 'bg-[linear-gradient(180deg,rgba(10,18,30,0.46)_0%,rgba(7,14,24,0.72)_100%)]'
            : 'bg-[linear-gradient(180deg,rgba(9,16,28,0.50)_0%,rgba(3,8,16,0.74)_100%)]'
          }`} />
        </div>
      )}

      {/* HUD Info */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none select-none space-y-1.5">
        {isClassic ? (
          <div className="px-3 py-1.5 rounded border border-black/40 shadow-card bg-theme-cyan text-white text-[10px] font-black uppercase tracking-widest">
            BASIN VISUALIZER
          </div>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur transition-all bg-theme-bg/80 text-theme-cyan border border-theme-border">
            {visibleWellIds.size} Visible / {selectedWellIds.size} Selected
          </p>
        )}
        {activeFilters.length > 0 && (
          <div className="flex flex-col gap-1">
            {activeFilters.map((f) => (
              <span key={f.label} className={`inline-block text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded backdrop-blur ${
                isClassic ? 'bg-black/40 text-white/80 border border-black/35' : 'bg-theme-surface1/80 text-theme-lavender border border-theme-border/70'
              }`}>{f.label}: {f.value}</span>
            ))}
          </div>
        )}
        {formationFilter && (
          <span className="inline-block text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded backdrop-blur bg-theme-cyan/20 text-theme-cyan border border-theme-cyan/30">
            Formation: {formationFilter}
          </span>
        )}
      </div>

      {/* Map toolbar - selection tools + toggles */}
      <div className="absolute top-4 right-4 z-20 space-y-2">
        {/* Selection tools */}
        <div className="flex gap-1">
          <button onClick={() => { setSelectionTool('lasso'); setIsSelecting(!isSelecting || selectionTool !== 'lasso'); }} className={toolBtnClass(isSelecting && selectionTool === 'lasso')}>
            Lasso
          </button>
          <button onClick={() => { setSelectionTool('rectangle'); setIsSelecting(!isSelecting || selectionTool !== 'rectangle'); }} className={toolBtnClass(isSelecting && selectionTool === 'rectangle')}>
            Rect
          </button>
        </div>

        {/* Formation filter dropdown */}
        <select
          value={formationFilter || ''}
          onChange={e => handleFormationSelect(e.target.value || null)}
          className={`w-full text-[9px] font-bold uppercase rounded px-2 py-1 ${
            isClassic ? 'sc-selectNavy' : 'bg-theme-surface2 text-theme-muted border border-theme-border'
          }`}
        >
          <option value="">By Formation</option>
          {formations.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Toggle buttons */}
        <div className="flex flex-col gap-1">
          <button onClick={() => setShowGrid(!showGrid)} className={toolBtnClass(showGrid)}>Grid</button>
          <button onClick={() => setShowHeatmap(!showHeatmap)} className={toolBtnClass(showHeatmap)}>Heat</button>
          {showHeatmap && (
            <select
              value={heatmapMetric}
              onChange={e => setHeatmapMetric(e.target.value as HeatmapMetric)}
              className={`text-[8px] font-bold uppercase rounded px-1 py-0.5 ${
                isClassic ? 'sc-selectNavy' : 'bg-theme-surface2 text-theme-muted border border-theme-border'
              }`}
            >
              <option value="density">Density</option>
              <option value="eur_ft">EUR/ft</option>
              <option value="npv">NPV</option>
            </select>
          )}
          {useMapbox && mapboxLoaded && (
            <button onClick={() => setIsSatellite(!isSatellite)} className={toolBtnClass(isSatellite)}>
              {isSatellite ? 'Dark' : 'Sat'}
            </button>
          )}
        </div>

        <div className="pointer-events-none">
          <p className={`px-2 py-1 rounded text-[9px] uppercase tracking-[0.14em] ${
            isClassic ? 'bg-black/40 text-white/80 border border-black/35' : 'bg-theme-bg/70 text-theme-muted border border-theme-border/70'
          }`}>
            {isSelecting ? `${selectionTool === 'lasso' ? 'Lasso' : 'Rect'} active` : 'Shift+drag to select'}
          </p>
        </div>
      </div>

      <div className="absolute left-3 z-20 pointer-events-none" style={{ bottom: 12 + uiBottomInsetPx }}>
        <p className={`px-2 py-1 rounded text-[9px] uppercase tracking-[0.14em] ${isClassic ? 'bg-black/40 text-white/80 border border-black/35' : 'bg-theme-bg/70 text-theme-muted border border-theme-border/70'}`}>
          {useMapbox ? 'Map data © Mapbox © OpenStreetMap' : 'Map data © OpenStreetMap contributors'}
        </p>
      </div>

      <svg ref={svgRef} className="relative z-10" width="100%" height="100%">
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset dx="0" dy="0" result="offsetblur" />
            <feFlood floodColor={mp.glowColor} result="color" />
            <feComposite in="color" in2="offsetblur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Lasso polygon */}
        {lassoPoints.length > 0 && (
          <polygon
            points={lassoPoints.map(p => p.join(',')).join(' ')}
            fill={mp.lassoFill}
            stroke={mp.lassoStroke}
            strokeWidth={2}
            strokeDasharray={mp.lassoDash}
          />
        )}
        {/* Rectangle selection */}
        {rectStart && rectEnd && (
          <rect
            x={Math.min(rectStart[0], rectEnd[0])}
            y={Math.min(rectStart[1], rectEnd[1])}
            width={Math.abs(rectEnd[0] - rectStart[0])}
            height={Math.abs(rectEnd[1] - rectStart[1])}
            fill={mp.lassoFill}
            stroke={mp.lassoStroke}
            strokeWidth={2}
            strokeDasharray={mp.lassoDash}
          />
        )}
      </svg>
    </div>
  );
};

export default MapVisualizer;
