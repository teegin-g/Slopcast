import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Well, WellGroup } from '../types';

interface MapVisualizerProps {
  wells: Well[];
  selectedWellIds: Set<string>;
  groups: WellGroup[];
  onToggleWell: (id: string) => void;
  onSelectWells: (ids: string[]) => void;
  theme?: 'slate' | 'synthwave';
}

const MapVisualizer: React.FC<MapVisualizerProps> = ({ wells, selectedWellIds, groups, onToggleWell, onSelectWells, theme = 'slate' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLassoMode, setIsLassoMode] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<[number, number][]>([]);
  
  const lassoPointsRef = useRef<[number, number][]>([]);
  const isSynthwave = theme === 'synthwave';

  const getWellColor = (wellId: string): string => {
    for (const group of groups) {
      if (group.wellIds.has(wellId)) {
        return group.color;
      }
    }
    return isSynthwave ? "#6053A0" : "#475569";
  };

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
    const gridColor = isSynthwave ? "#6053A0" : "#1e293b";
    const gridOpacity = isSynthwave ? 0.4 : 0.3;
    
    mapG.selectAll(".grid-v")
        .data(d3.range(0, width, 100))
        .enter().append("line")
        .attr("x1", d => d).attr("x2", d => d)
        .attr("y1", 0).attr("y2", height)
        .attr("stroke", gridColor).attr("stroke-width", 1).attr("opacity", gridOpacity);

    mapG.selectAll(".grid-h")
        .data(d3.range(0, height, 100))
        .enter().append("line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", d => d).attr("y2", d => d)
        .attr("stroke", gridColor).attr("stroke-width", 1).attr("opacity", gridOpacity);

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
      .attr("opacity", 0.4)
      .attr("pointer-events", "none");

    // Wells
    const wellNodes = mapG.selectAll("circle")
      .data(wells)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.lng))
      .attr("cy", d => yScale(d.lat))
      .attr("r", 5)
      .attr("fill", d => getWellColor(d.id))
      .attr("stroke", d => selectedWellIds.has(d.id) ? (isSynthwave ? "#9ED3F0" : "#ffffff") : "none")
      .attr("stroke-width", d => selectedWellIds.has(d.id) ? 3 : 0)
      .attr("fill-opacity", d => selectedWellIds.has(d.id) ? 1 : 0.6)
      .attr("filter", d => selectedWellIds.has(d.id) && isSynthwave ? "url(#neon-glow)" : "none")
      .attr("cursor", "pointer") 
      .on("click", (event, d) => {
        if (!event.defaultPrevented) {
             onToggleWell(d.id);
        }
      })
      .on("mouseover", function() {
         d3.select(this).attr("r", 8).attr("fill-opacity", 1);
      })
      .on("mouseout", function(event, d) {
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

  }, [wells, selectedWellIds, groups, dimensions, isLassoMode, onToggleWell, onSelectWells, theme]); 

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] overflow-hidden relative select-none">
      
      {/* HUD Info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
        <p className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur transition-all ${isSynthwave ? 'bg-theme-bg/80 text-theme-cyan border border-theme-border' : 'bg-slate-900/50 text-slate-500'}`}>
            {selectedWellIds.size} Wells Selected
        </p>
      </div>

      {/* Lasso Button */}
      <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={() => setIsLassoMode(!isLassoMode)}
            className={`
                flex items-center space-x-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-lg transition-all
                ${isLassoMode 
                    ? (isSynthwave ? 'bg-theme-magenta text-white glow-magenta' : 'bg-blue-600 text-white') 
                    : (isSynthwave ? 'bg-theme-surface2 text-theme-cyan hover:bg-theme-surface1' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}
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
              <feFlood floodColor={isSynthwave ? "#9ED3F0" : "#3b82f6"} result="color" />
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
                fill={isSynthwave ? "rgba(229, 102, 218, 0.15)" : "rgba(59, 130, 246, 0.1)"}
                stroke={isSynthwave ? "#E566DA" : "#3b82f6"}
                strokeWidth={isSynthwave ? 2 : 1}
                strokeDasharray={isSynthwave ? "8, 4" : "4"}
              />
          )}
      </svg>
    </div>
  );
};

export default MapVisualizer;