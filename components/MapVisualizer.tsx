import React, { useEffect, useRef, useState } from 'react';
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
  const isClassic = themeId === 'mario';
  
  const lassoPointsRef = useRef<[number, number][]>([]);

  const themeMeta = getTheme(themeId);
  const mp = themeMeta.mapPalette;

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
      .on("mouseover", function(event, d) {
         if (isDimmedWell(d.id)) return;
         d3.select(this).attr("r", 8).attr("fill-opacity", 1);
      })
      .on("mouseout", function(event, d) {
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
      
      {/* HUD Info */}
      {!isClassic && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur transition-all bg-theme-bg/80 text-theme-cyan border border-theme-border">
              {visibleWellIds.size} Visible / {selectedWellIds.size} Selected
          </p>
        </div>
      )}

      {isClassic && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
          <div className="px-3 py-1.5 rounded border border-black/40 shadow-card bg-theme-cyan text-white text-[10px] font-black uppercase tracking-widest">
            <span className="mr-2">🔒</span>
            BASIN VISUALIZER
          </div>
        </div>
      )}

      {/* Lasso Button */}
      <div className="absolute top-4 right-4 z-10">
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

      <svg ref={svgRef} width="100%" height="100%">
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
