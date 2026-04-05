import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area } from 'recharts';
import { MonthlyCashFlow } from '../types';
import { ThemeId, getTheme } from '../theme/themes';
import { useStableChartContainer } from './slopcast/hooks/useStableChartContainer';

interface ChartsProps {
  data: MonthlyCashFlow[];
  themeId: ThemeId;
}

/**
 * SVG draw-on overlay for the production decline curve.
 * Animates a stroke from left to right with a glowing cursor dot.
 * Renders as an overlay on top of the Recharts chart area.
 */
const ProductionDrawOn: React.FC<{
  data: MonthlyCashFlow[];
  color: string;
  width: number;
  height: number;
  margin: { top: number; right: number; left: number; bottom: number };
}> = ({ data, color, width, height, margin }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number>(0);
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Compute SVG path from data
  const pathD = useMemo(() => {
    if (data.length < 2) return '';
    const values = data.map(d => d.oilProduction);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;

    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    return values
      .map((v, i) => {
        const x = margin.left + (i / (values.length - 1)) * plotW;
        const y = margin.top + plotH - ((v - minVal) / range) * plotH;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }, [data, width, height, margin]);

  // Compute cursor position along the path
  const cursorPos = useMemo(() => {
    if (!pathRef.current || pathLength === 0 || progress === 0) return null;
    try {
      const point = pathRef.current.getPointAtLength(progress * pathLength);
      return { x: point.x, y: point.y };
    } catch {
      return null;
    }
  }, [pathLength, progress]);

  // Measure path length on mount
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [pathD]);

  // Animate draw-on
  useEffect(() => {
    if (pathLength === 0 || prefersReduced) {
      setProgress(1);
      return;
    }

    setProgress(0);
    const duration = 1200; // ms
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease: cubic-bezier(0.22, 1, 0.36, 1) approximation
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, [pathLength, prefersReduced]);

  if (!pathD || data.length < 2) return null;

  const dashOffset = pathLength * (1 - progress);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ zIndex: 10 }}
    >
      <defs>
        <filter id="cursorGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="drawOnFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15 * progress} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill that fades in */}
      {progress > 0.1 && (
        <path
          d={`${pathD} L${width - margin.right},${height - margin.bottom} L${margin.left},${height - margin.bottom} Z`}
          fill="url(#drawOnFill)"
          opacity={progress}
        />
      )}

      {/* Animated stroke */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength || 0}
        strokeDashoffset={dashOffset}
      />

      {/* Glowing cursor dot */}
      {cursorPos && progress > 0 && progress < 1 && (
        <circle
          cx={cursorPos.x}
          cy={cursorPos.y}
          r={5}
          fill={color}
          filter="url(#cursorGlow)"
        />
      )}
    </svg>
  );
};

const Charts: React.FC<ChartsProps> = ({ data, themeId }) => {
  const { chartPalette: palette } = getTheme(themeId);
  const isClassic = themeId === 'mario';
  const productionChart = useStableChartContainer([themeId, data.length]);
  const cashChart = useStableChartContainer([themeId, data.length]);

  return (
    <div className={`space-y-6 h-full flex flex-col justify-between ${isClassic ? '' : 'p-2'}`}>
      {/* Production Forecast */}
      <div className={isClassic ? 'sc-screen theme-transition flex-1' : 'rounded-inner border p-5 flex-1 transition-all bg-transparent border-theme-border/40'}>
        {isClassic ? (
          <div className="sc-screenTitlebar sc-titlebar--red px-4 py-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
              PRODUCTION FORECAST (BBL/D)
            </h4>
          </div>
        ) : (
          <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center transition-all text-theme-cyan">
            <span className="w-1 h-1 rounded-full bg-theme-cyan mr-2"></span>
            Production Forecast (BBL/D)
          </h4>
        )}
        <div className={isClassic ? 'p-4' : ''}>
          <div className="h-40 relative" ref={productionChart.containerRef}>
          {productionChart.ready ? (
            <>
              <ProductionDrawOn
                data={data}
                color={palette.oil}
                width={productionChart.width}
                height={productionChart.height}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              />
              <ResponsiveContainer width={productionChart.width} height={productionChart.height}>
                <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={palette.grid} vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke={palette.text}
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value % 12 === 0 ? `Y${value/12}` : ''}
                  />
                  <YAxis
                    stroke={palette.text}
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: palette.surface, borderRadius: '8px', border: `1px solid ${palette.border}`, color: 'rgb(var(--text))', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ padding: 0 }}
                    formatter={(value: number) => [Math.round(value).toLocaleString(), 'BBLs']}
                    cursor={{ stroke: palette.lav, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="oilProduction"
                    stroke="transparent"
                    strokeWidth={0}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: palette.oil }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className={`h-full w-full rounded-inner ${isClassic ? 'bg-black/20' : 'bg-theme-bg/40 animate-pulse'}`} />
          )}
          </div>
        </div>
      </div>

      {/* Cash Flow */}
      <div className={isClassic ? 'sc-screen theme-transition flex-1' : 'rounded-inner border p-5 flex-1 transition-all bg-transparent border-theme-border/40'}>
        {isClassic ? (
          <div className="sc-screenTitlebar sc-titlebar--red px-4 py-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
              CUMULATIVE CASH FLOW (USD)
            </h4>
          </div>
        ) : (
          <h4 className="font-black text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center transition-all text-theme-magenta">
            <span className="w-1 h-1 rounded-full bg-theme-magenta mr-2"></span>
            Cumulative Cash Flow (USD)
          </h4>
        )}
        <div className={isClassic ? 'p-4' : ''}>
          <div className="h-40" ref={cashChart.containerRef}>
          {cashChart.ready ? (
            <ResponsiveContainer width={cashChart.width} height={cashChart.height}>
              <ComposedChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={palette.text}
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value % 12 === 0 ? `Y${value/12}` : ''}
                />
                <YAxis
                  stroke={palette.text}
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value/1e6).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: palette.surface, borderRadius: '8px', border: `1px solid ${palette.border}`, color: 'rgb(var(--text))', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  formatter={(value: number) => [`$${(value/1e6).toFixed(2)}MM`, '']}
                  cursor={{ fill: palette.grid, opacity: 0.3 }}
                />
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.cash} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={palette.cash} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="cumulativeCashFlow"
                  stroke={palette.cash}
                  fill="url(#colorCash)"
                  strokeWidth={3}
                  animationDuration={2000}
                />
                <Bar dataKey="netCashFlow" fill={palette.lav} opacity={0.3} barSize={2} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full w-full rounded-inner ${isClassic ? 'bg-black/20' : 'bg-theme-bg/40 animate-pulse'}`} />
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Charts);
