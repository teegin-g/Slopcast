import React, { useMemo } from 'react';
import { Well, WellGroup } from '../../types';

interface MiniMapPreviewProps {
  isClassic: boolean;
  wells: Well[];
  activeGroup: WellGroup;
}

const PERMIAN_CENTER = { lat: 31.9, lng: -102.3 };
const USA_BOUNDS = {
  minLat: 24.0, maxLat: 50.0,
  minLng: -125.0, maxLng: -66.0,
};

const MiniMapPreview: React.FC<MiniMapPreviewProps> = ({ isClassic, wells, activeGroup }) => {
  const groupWells = useMemo(
    () => wells.filter(w => activeGroup.wellIds.has(w.id)),
    [wells, activeGroup.wellIds]
  );

  if (groupWells.length === 0) {
    return (
      <div className={`rounded-panel border overflow-hidden ${
        isClassic ? 'sc-panel' : 'bg-theme-surface1/50 border-theme-border shadow-card'
      }`}>
        <div className="h-[80px] flex items-center justify-center">
          <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${isClassic ? 'text-white/50' : 'text-theme-muted/60'}`}>
            No wells in group
          </p>
        </div>
      </div>
    );
  }

  // Compute well extent with padding
  const lats = groupWells.map(w => w.lat);
  const lngs = groupWells.map(w => w.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latPad = Math.max((maxLat - minLat) * 0.3, 0.02);
  const lngPad = Math.max((maxLng - minLng) * 0.3, 0.03);

  const viewMinLat = minLat - latPad;
  const viewMaxLat = maxLat + latPad;
  const viewMinLng = minLng - lngPad;
  const viewMaxLng = maxLng + lngPad;

  const svgWidth = 400;
  const svgHeight = 120;

  const projectX = (lng: number) =>
    ((lng - viewMinLng) / (viewMaxLng - viewMinLng)) * svgWidth;
  const projectY = (lat: number) =>
    svgHeight - ((lat - viewMinLat) / (viewMaxLat - viewMinLat)) * svgHeight;

  // USA outline simplified (same as MapVisualizer)
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

  // Project USA outline to mini-map SVG coordinates (using full USA bounds for context)
  const projectUsaX = (lng: number) =>
    ((lng - USA_BOUNDS.minLng) / (USA_BOUNDS.maxLng - USA_BOUNDS.minLng)) * svgWidth;
  const projectUsaY = (lat: number) =>
    svgHeight - ((lat - USA_BOUNDS.minLat) / (USA_BOUNDS.maxLat - USA_BOUNDS.minLat)) * svgHeight;

  return (
    <div className={`rounded-panel border overflow-hidden ${
      isClassic ? 'sc-panel' : 'bg-theme-surface1/50 border-theme-border shadow-card'
    }`}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '120px' }}
      >
        {/* Background */}
        <rect width={svgWidth} height={svgHeight} fill={isClassic ? '#0a1220' : '#060e1a'} />

        {/* Grid lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const x = (svgWidth / 5) * (i + 1);
          return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={svgHeight} stroke="rgba(100,140,180,0.12)" strokeWidth={0.5} />;
        })}
        {Array.from({ length: 3 }, (_, i) => {
          const y = (svgHeight / 3) * (i + 1);
          return <line key={`h${i}`} x1={0} y1={y} x2={svgWidth} y2={y} stroke="rgba(100,140,180,0.12)" strokeWidth={0.5} />;
        })}

        {/* Well dots */}
        {groupWells.map(w => (
          <circle
            key={w.id}
            cx={projectX(w.lng)}
            cy={projectY(w.lat)}
            r={3.5}
            fill={activeGroup.color}
            fillOpacity={0.85}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={0.8}
          />
        ))}

        {/* Glow effect behind cluster */}
        <circle
          cx={projectX((minLng + maxLng) / 2)}
          cy={projectY((minLat + maxLat) / 2)}
          r={30}
          fill={activeGroup.color}
          fillOpacity={0.08}
        />

        {/* Label */}
        <text
          x={6}
          y={12}
          fill={isClassic ? 'rgba(255,255,255,0.5)' : 'rgba(180,200,220,0.5)'}
          fontSize={8}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          letterSpacing="0.08em"
        >
          {activeGroup.name.toUpperCase()} — {groupWells.length} WELLS
        </text>
      </svg>
    </div>
  );
};

export default MiniMapPreview;
