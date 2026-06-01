import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Well, WellGroup } from '../types';
import { ThemeId, getTheme } from '../theme/themes';
import { useMapboxGL } from './mapVisualizer/useMapboxGL';
import { useMapboxHeatmap } from './mapVisualizer/useMapboxHeatmap';
import { useD3WellMap } from './mapVisualizer/useD3WellMap';

interface ActiveFilter {
  label: string;
  value: string;
}

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
const EMPTY_ACTIVE_FILTERS: ActiveFilter[] = [];

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
  activeFilters = EMPTY_ACTIVE_FILTERS,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [formationFilter, setFormationFilter] = useState<string | null>(null);

  const themeMeta = getTheme(themeId);
  const isClassic = themeMeta.features.isClassicTheme;
  const mp = themeMeta.mapPalette;

  // Mapbox GL map: init / satellite toggle / instance ref
  const {
    mapboxContainerRef,
    mapRef,
    useMapbox,
    mapboxLoaded,
    isSatellite,
    setIsSatellite,
  } = useMapboxGL(MAPBOX_TOKEN);

  // Mapbox GL heatmap layer + visibility/metric state
  const {
    showHeatmap,
    setShowHeatmap,
    heatmapMetric,
    setHeatmapMetric,
  } = useMapboxHeatmap(mapRef, mapboxLoaded, wells);

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

  // D3 well-map rendering + lasso/rectangle selection state
  const {
    selectionTool,
    setSelectionTool,
    isSelecting,
    setIsSelecting,
    lassoPoints,
    rectStart,
    rectEnd,
  } = useD3WellMap({
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
  });

  // Formation filter handler
  const handleFormationSelect = useCallback((formation: string | null) => {
    setFormationFilter(formation);
    if (formation) {
      const matching = wells.flatMap(w => w.formation === formation ? [w.id] : []);
      if (matching.length > 0) onSelectWells(matching);
    }
  }, [wells, onSelectWells]);

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
          <button type="button" onClick={() => { setSelectionTool('lasso'); setIsSelecting(!isSelecting || selectionTool !== 'lasso'); }} className={toolBtnClass(isSelecting && selectionTool === 'lasso')}>
            Lasso
          </button>
          <button type="button" onClick={() => { setSelectionTool('rectangle'); setIsSelecting(!isSelecting || selectionTool !== 'rectangle'); }} className={toolBtnClass(isSelecting && selectionTool === 'rectangle')}>
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
          <button type="button" onClick={() => setShowGrid(!showGrid)} className={toolBtnClass(showGrid)}>Grid</button>
          <button type="button" onClick={() => setShowHeatmap(!showHeatmap)} className={toolBtnClass(showHeatmap)}>Heat</button>
          {showHeatmap && (
            <select
              value={heatmapMetric}
              onChange={e => setHeatmapMetric(e.target.value as typeof heatmapMetric)}
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
            <button type="button" onClick={() => setIsSatellite(!isSatellite)} className={toolBtnClass(isSatellite)}>
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

export default React.memo(MapVisualizer);
