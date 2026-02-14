import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Well, WellGroup } from '../types';
import { ThemeId, getTheme } from '../theme/themes';

interface MapVisualizerProps {
  wells: Well[];
  selectedWellIds: Set<string>;
  visibleWellIds: Set<string>;
  dimmedWellIds: Set<string>;
  groups: WellGroup[];
  onToggleWell: (id: string) => void;
  onSelectWells: (ids: string[]) => void;
  themeId: ThemeId;
}

const PERMIAN_CENTER = {
  lat: 31.9,
  lng: -102.3,
};

const PERMIAN_BASEMAP_ZOOM = 5;
const USA_BOUNDS = {
  minLat: 24.0,
  maxLat: 50.0,
  minLng: -125.0,
  maxLng: -66.0,
};

function buildPermianBasemapUrl(width: number, height: number): string {
  const deviceScale = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const mapWidth = Math.max(640, Math.min(1280, Math.round(width * deviceScale)));
  const mapHeight = Math.max(400, Math.min(1280, Math.round(height * deviceScale)));
  const params = new URLSearchParams({
    center: `${PERMIAN_CENTER.lat},${PERMIAN_CENTER.lng}`,
    zoom: String(PERMIAN_BASEMAP_ZOOM),
    size: `${mapWidth}x${mapHeight}`,
    maptype: 'mapnik',
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${params.toString()}`;
}

function buildOfflineUsFallbackMap(width: number, height: number, accentHex = '#f59e0b'): string {
  const mapWidth = Math.max(640, Math.min(1280, Math.round(width || 1024)));
  const mapHeight = Math.max(400, Math.min(900, Math.round(height || 560)));

  const project = (lng: number, lat: number) => {
    const x = ((lng - USA_BOUNDS.minLng) / (USA_BOUNDS.maxLng - USA_BOUNDS.minLng)) * mapWidth;
    const y = mapHeight - ((lat - USA_BOUNDS.minLat) / (USA_BOUNDS.maxLat - USA_BOUNDS.minLat)) * mapHeight;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  };

  // Simplified lower-48 outline in lon/lat order.
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

  const lonLines = [-120, -110, -100, -90, -80, -70]
    .map((lng) => {
      const [x1, y1] = project(lng, USA_BOUNDS.minLat);
      const [x2, y2] = project(lng, USA_BOUNDS.maxLat);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    })
    .join('');

  const latLines = [26, 30, 35, 40, 45, 49]
    .map((lat) => {
      const [x1, y1] = project(USA_BOUNDS.minLng, lat);
      const [x2, y2] = project(USA_BOUNDS.maxLng, lat);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    })
    .join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${mapWidth} ${mapHeight}" width="${mapWidth}" height="${mapHeight}">
  <defs>
    <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d1f36" />
      <stop offset="100%" stop-color="#071322" />
    </linearGradient>
    <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#31537a" />
      <stop offset="100%" stop-color="#213f61" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${mapWidth}" height="${mapHeight}" fill="url(#ocean)" />
  <g stroke="rgba(129,164,204,0.2)" stroke-width="1">
    ${lonLines}
    ${latLines}
  </g>
  <polygon points="${outlinePoints}" fill="url(#land)" stroke="rgba(193,220,255,0.55)" stroke-width="2" />
  <circle cx="${permian[0]}" cy="${permian[1]}" r="${permianGlowRadius}" fill="${accentHex}" fill-opacity="0.16" />
  <circle cx="${permian[0]}" cy="${permian[1]}" r="${permianCoreRadius + 5}" fill="none" stroke="${accentHex}" stroke-opacity="0.38" stroke-width="2" />
  <circle cx="${permian[0]}" cy="${permian[1]}" r="${permianCoreRadius}" fill="${accentHex}" stroke="rgba(255,255,255,0.65)" stroke-width="2" />
  <text x="${permian[0] + 10}" y="${permian[1] - 10}" fill="rgba(244,220,182,0.9)" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="0.08em">
    PERMIAN BASIN
  </text>
  <text x="${mapWidth - 10}" y="${mapHeight - 12}" fill="rgba(165,186,212,0.7)" font-family="Inter, Arial, sans-serif" font-size="11" text-anchor="end">
    Offline US fallback basemap
  </text>
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
  themeId
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLassoMode, setIsLassoMode] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<[number, number][]>([]);
  const [basemapLoadError, setBasemapLoadError] = useState(false);
  const isClassic = themeId === 'mario';

  const lassoPointsRef = useRef<[number, number][]>([]);

  const themeMeta = getTheme(themeId);
  const mp = themeMeta.mapPalette;
  const basemapUrl = useMemo(() => {
    if (dimensions.width <= 0 || dimensions.height <= 0) return '';
    return buildPermianBasemapUrl(dimensions.width, dimensions.height);
  }, [dimensions.width, dimensions.height]);
  const fallbackBasemapUrl = useMemo(() => {
    return buildOfflineUsFallbackMap(dimensions.width, dimensions.height, mp.glowColor);
  }, [dimensions.width, dimensions.height, mp.glowColor]);

  const getWellColor = (wellId: string): string => {
    for (const group of groups) {
      if (group.wellIds.has(wellId)) {
        return group.color;
      }
    }
    return mp.unassignedFill;
  };

  const isDimmedWell = (wellId: string) => dimmedWellIds.has(wellId);
  const isVisibleWell = (wellId: string) => visibleWellIds.has(wellId);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setBasemapLoadError(false);
  }, [basemapUrl]);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll(".map-content").remove();

    const mapG = svg.append("g").classed("map-content", true);
    const width = dimensions.width;
    const height = dimensions.height;
    const padding = 40;

    const xExtent = d3.extent(wells, d => d.lng) as [number, number];
    const yExtent = d3.extent(wells, d => d.lat) as [number, number];

    const xScale = d3.scaleLinear().domain(xExtent).range([padding, width - padding]);
    const yScale = d3.scaleLinear().domain(yExtent).range([height - padding, padding]);

    // Grid
    mapG.selectAll(".grid-v")
      .data(d3.range(0, width, 100))
      .enter().append("line")
      .attr("x1", d => d).attr("x2", d => d)
      .attr("y1", 0).attr("y2", height)
      .attr("stroke", mp.gridColor).attr("stroke-width", 1).attr("opacity", mp.gridOpacity);

    mapG.selectAll(".grid-h")
      .data(d3.range(0, height, 100))
      .enter().append("line")
      .attr("x1", 0).attr("x2", width)
      .attr("y1", d => d).attr("y2", d => d)
      .attr("stroke", mp.gridColor).attr("stroke-width", 1).attr("opacity", mp.gridOpacity);

    // Laterals
    mapG.selectAll("line.lateral")
      .data(wells)
      .enter()
      .append("line")
      .classed("lateral", true)
      .attr("x1", d => xScale(d.lng))
      .attr("y1", d => yScale(d.lat))
      .attr("x2", d => xScale(d.lng) + (d.lateralLength / 1000) * 4)
      .attr("y2", d => yScale(d.lat) + 5)
      .attr("stroke", d => getWellColor(d.id))
      .attr("stroke-width", 2)
      .attr("opacity", d => (isDimmedWell(d.id) ? 0.08 : 0.4))
      .attr("pointer-events", "none");

    // Wells
    mapG.selectAll("circle")
      .data(wells)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.lng))
      .attr("cy", d => yScale(d.lat))
      .attr("r", 5)
      .attr("fill", d => getWellColor(d.id))
      .attr("stroke", d => (selectedWellIds.has(d.id) && !isDimmedWell(d.id)) ? mp.selectedStroke : "none")
      .attr("stroke-width", d => (selectedWellIds.has(d.id) && !isDimmedWell(d.id)) ? 3 : 0)
      .attr("fill-opacity", d => {
        if (isDimmedWell(d.id)) return 0.12;
        return selectedWellIds.has(d.id) ? 1 : 0.6;
      })
      .attr("filter", d => (selectedWellIds.has(d.id) && !isDimmedWell(d.id) && themeMeta.features.glowEffects) ? "url(#neon-glow)" : "none")
      .attr("cursor", d => (isDimmedWell(d.id) ? "default" : "pointer"))
      .on("click", (event, d) => {
        if (!event.defaultPrevented && isVisibleWell(d.id)) {
          onToggleWell(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        if (isDimmedWell(d.id)) return;
        d3.select(this).attr("r", 8).attr("fill-opacity", 1);
      })
      .on("mouseout", function (event, d) {
        if (isDimmedWell(d.id)) return;
        d3.select(this)
          .attr("r", 5)
          .attr("fill-opacity", selectedWellIds.has(d.id) ? 1 : 0.6);
      });

    // Lasso
    svg.on(".drag", null);
    const drag = d3.drag<SVGSVGElement, unknown>()
      .filter((event) => isLassoMode || event.shiftKey)
      .on("start", () => {
        setLassoPoints([]);
        lassoPointsRef.current = [];
      })
      .on("drag", (event) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        const newPoint: [number, number] = [x, y];
        setLassoPoints(prev => [...prev, newPoint]);
        lassoPointsRef.current.push(newPoint);
      })
      .on("end", () => {
        const currentPoints = lassoPointsRef.current;
        if (currentPoints.length > 2) {
          const selected: string[] = [];
          wells.forEach(w => {
            if (!isVisibleWell(w.id)) return;
            const px = xScale(w.lng);
            const py = yScale(w.lat);
            if (d3.polygonContains(currentPoints, [px, py])) {
              selected.push(w.id);
            }
          });
          if (selected.length > 0) onSelectWells(selected);
        }
        setLassoPoints([]);
        lassoPointsRef.current = [];
        if (isLassoMode) setIsLassoMode(false);
      });

    svg.call(drag);
    svg.style("cursor", isLassoMode ? "crosshair" : "default");

  }, [wells, selectedWellIds, visibleWellIds, dimmedWellIds, groups, dimensions, isLassoMode, onToggleWell, onSelectWells, themeId]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] overflow-hidden relative select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={fallbackBasemapUrl}
          alt="Offline US fallback map centered on the Permian Basin"
          className={`h-full w-full object-cover ${isClassic ? 'opacity-42' : 'opacity-52'}`}
        />
        {!basemapLoadError && basemapUrl && (
          <img
            src={basemapUrl}
            alt="US basemap centered on the Permian Basin"
            className={`absolute inset-0 h-full w-full object-cover ${isClassic ? 'opacity-28' : 'opacity-40'}`}
            onError={() => setBasemapLoadError(true)}
          />
        )}
        <div
          className={`absolute inset-0 ${isClassic
              ? 'bg-[linear-gradient(180deg,rgba(10,18,30,0.46)_0%,rgba(7,14,24,0.72)_100%)]'
              : 'bg-[linear-gradient(180deg,rgba(9,16,28,0.50)_0%,rgba(3,8,16,0.74)_100%)]'
            }`}
        />
      </div>

      {/* HUD Info */}
      {!isClassic && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none select-none">
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur transition-all bg-theme-bg/80 text-theme-cyan border border-theme-border">
            {visibleWellIds.size} Visible / {selectedWellIds.size} Selected
          </p>
        </div>
      )}

      {isClassic && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none select-none">
          <div className="px-3 py-1.5 rounded border border-black/40 shadow-card bg-theme-cyan text-white text-[10px] font-black uppercase tracking-widest">
            <span className="mr-2">🔒</span>
            BASIN VISUALIZER
          </div>
        </div>
      )}

      {/* Lasso Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsLassoMode(!isLassoMode)}
          className={`
                flex items-center space-x-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all
                ${isClassic ? 'rounded-md border border-black/40 shadow-card' : 'rounded shadow-lg'}
                ${isLassoMode
              ? (isClassic ? 'bg-theme-magenta text-white' : 'bg-theme-magenta text-white glow-magenta')
              : (isClassic ? 'bg-theme-cyan text-white' : 'bg-theme-surface2 text-theme-cyan hover:bg-theme-surface1')}
            `}
        >
          <span>{isLassoMode ? 'LASSO ENGAGED' : 'LASSO'}</span>
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
        <p className={`px-2 py-1 rounded text-[9px] uppercase tracking-[0.14em] ${isClassic ? 'bg-black/40 text-white/80 border border-black/35' : 'bg-theme-bg/70 text-theme-muted border border-theme-border/70'}`}>
          Map data © OpenStreetMap contributors
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
        {lassoPoints.length > 0 && (
          <polygon
            points={lassoPoints.map(p => p.join(",")).join(" ")}
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
