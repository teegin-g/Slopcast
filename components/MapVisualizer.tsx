import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Well, WellGroup } from '../types';

interface MapVisualizerProps {
  wells: Well[];
  selectedWellIds: Set<string>;
  groups: WellGroup[];
  onToggleWell: (id: string) => void;
  onSelectWells: (ids: string[]) => void;
}

const MapVisualizer: React.FC<MapVisualizerProps> = ({ wells, selectedWellIds, groups, onToggleWell, onSelectWells }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLassoMode, setIsLassoMode] = useState(false);
  const [lassoPoints, setLassoPoints] = useState<[number, number][]>([]);
  
  // Ref to track points synchronously for D3 callbacks to avoid stale closures
  const lassoPointsRef = useRef<[number, number][]>([]);

  // Create a quick lookup for well ID -> Group Color
  const getWellColor = (wellId: string): string => {
    for (const group of groups) {
      if (group.wellIds.has(wellId)) {
        return group.color;
      }
    }
    return "#475569";
  };

  // Handle Resize
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

  // Main Drawing & Lasso Logic
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll(".map-content").remove(); // Clear map content but keep potential lasso overlay if needed

    // Create a group for map content to separate from lasso
    const mapG = svg.append("g").classed("map-content", true);

    const width = dimensions.width;
    const height = dimensions.height;
    const padding = 40;

    // Scales
    const xExtent = d3.extent(wells, d => d.lng) as [number, number];
    const yExtent = d3.extent(wells, d => d.lat) as [number, number];

    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([padding, width - padding]);

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height - padding, padding]);

    // Background Grid
    mapG.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#0f172a")
        .attr("opacity", 0); // Transparent to show parent BG
    
    // Draw "Lease Lines" (Grid)
    const gridData = d3.range(0, width, 100);
    mapG.selectAll(".grid-v")
        .data(gridData)
        .enter().append("line")
        .attr("x1", d => d)
        .attr("x2", d => d)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "#1e293b")
        .attr("stroke-width", 1)
        .attr("opacity", 0.3);

    // Draw Lateral Sticks
    mapG.selectAll("line.lateral")
      .data(wells)
      .enter()
      .append("line")
      .classed("lateral", true)
      .attr("x1", d => xScale(d.lng))
      .attr("y1", d => yScale(d.lat))
      .attr("x2", d => xScale(d.lng) + (d.lateralLength / 1000) * 2)
      .attr("y2", d => yScale(d.lat) + 5)
      .attr("stroke", d => getWellColor(d.id))
      .attr("stroke-width", 2)
      .attr("opacity", 0.2) // Reduced visibility
      .attr("pointer-events", "none");

    // Draw Wells
    mapG.selectAll("circle")
      .data(wells)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.lng))
      .attr("cy", d => yScale(d.lat))
      .attr("r", 5) // Slightly smaller
      .attr("fill", d => getWellColor(d.id))
      .attr("stroke", d => selectedWellIds.has(d.id) ? "#ffffff" : "#1e293b")
      .attr("stroke-width", d => selectedWellIds.has(d.id) ? 2 : 0)
      .attr("fill-opacity", d => selectedWellIds.has(d.id) ? 1 : 0.5) // Less intrusive by default
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
            .attr("fill-opacity", selectedWellIds.has(d.id) ? 1 : 0.5);
      })
      .append("title")
      .text(d => `${d.name}\n${d.status}\nLatLen: ${d.lateralLength}'`);

    // --- Lasso Implementation ---
    
    // Remove old drag behavior to prevent stacking
    svg.on(".drag", null);

    const drag = d3.drag<SVGSVGElement, unknown>()
        .filter((event) => {
            // Allow drag if Lasso Mode is ON or Shift key is held
            return isLassoMode || event.shiftKey;
        })
        .on("start", () => {
            setLassoPoints([]);
            lassoPointsRef.current = [];
        })
        .on("drag", (event) => {
            const [x, y] = d3.pointer(event, svgRef.current);
            const newPoint: [number, number] = [x, y];
            
            // Update State (for rendering)
            setLassoPoints(prev => [...prev, newPoint]);
            // Update Ref (for logic)
            lassoPointsRef.current.push(newPoint);
        })
        .on("end", (event) => {
            // Use Ref to get points to avoid stale closure issues
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
                
                if (selected.length > 0) {
                    onSelectWells(selected);
                }
            }
            
            setLassoPoints([]);
            lassoPointsRef.current = [];
            
            // Auto-exit lasso mode if it was on
            if (isLassoMode) {
                setIsLassoMode(false);
            }
        });

    svg.call(drag);

    // Update cursor based on mode
    svg.style("cursor", isLassoMode ? "crosshair" : "default");

  }, [wells, selectedWellIds, groups, dimensions, isLassoMode, onToggleWell, onSelectWells]); 

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] overflow-hidden relative select-none">
      
      {/* HUD Info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded backdrop-blur">
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
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
            `}
          >
             <span>{isLassoMode ? 'Lasso Active' : 'Lasso'}</span>
          </button>
      </div>

      <svg ref={svgRef} width="100%" height="100%">
          {/* Render Lasso Polygon dynamically */}
          {lassoPoints.length > 0 && (
              <polygon 
                points={lassoPoints.map(p => p.join(",")).join(" ")}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="4"
              />
          )}
      </svg>
    </div>
  );
};

export default MapVisualizer;
