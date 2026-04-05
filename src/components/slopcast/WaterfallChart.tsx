import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '../../theme/ThemeProvider';
import { useStableChartContainer } from './hooks/useStableChartContainer';

interface WaterfallChartProps {
  isClassic: boolean;
  baseNpv: number;
  drivers: Array<{
    label: string;
    deltaNpv: number;
  }>;
}

const formatMm = (value: number) => `$${(value / 1e6).toFixed(1)}MM`;

type BarType = 'base' | 'positive' | 'negative' | 'adjusted';

interface WaterfallDatum {
  name: string;
  invisible: number;
  value: number;
  type: BarType;
}

/** Custom bar shape that animates height with spring physics instead of Recharts' ease-out. */
const SpringBar: React.FC<Record<string, unknown>> = (props) => {
  const { x, y, width, height, fill, index } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    index: number;
  };
  const prefersReduced = useReducedMotion();

  if (!height || height === 0) return null;

  const absHeight = Math.abs(height);

  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={absHeight}
      fill={fill}
      rx={3}
      initial={prefersReduced ? false : { height: 0, y: y + absHeight }}
      animate={{ height: absHeight, y }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 18,
        delay: (index ?? 0) * 0.06,
      }}
    />
  );
};

const WaterfallChart: React.FC<WaterfallChartProps> = ({ isClassic, baseNpv, drivers }) => {
  const { theme } = useTheme();
  const { chartPalette } = theme;
  const waterfallChart = useStableChartContainer([theme.id, baseNpv, drivers.length]);

  const data = useMemo(() => {
    const result: WaterfallDatum[] = [];

    // Base Case bar
    result.push({
      name: 'Base Case',
      invisible: 0,
      value: baseNpv,
      type: 'base',
    });

    // Driver bars
    let runningTotal = baseNpv;
    for (const driver of drivers) {
      if (driver.deltaNpv >= 0) {
        result.push({
          name: driver.label,
          invisible: runningTotal,
          value: driver.deltaNpv,
          type: 'positive',
        });
      } else {
        result.push({
          name: driver.label,
          invisible: runningTotal + driver.deltaNpv,
          value: Math.abs(driver.deltaNpv),
          type: 'negative',
        });
      }
      runningTotal += driver.deltaNpv;
    }

    // Adjusted bar
    result.push({
      name: 'Adjusted',
      invisible: 0,
      value: runningTotal,
      type: 'adjusted',
    });

    return result;
  }, [baseNpv, drivers]);

  const fillForType = (type: BarType): string => {
    switch (type) {
      case 'positive':
        return chartPalette.oil;
      case 'negative':
        return chartPalette.cash;
      case 'base':
      case 'adjusted':
      default:
        return chartPalette.lav;
    }
  };

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition p-4'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border p-5'
      }
    >
      <h3
        className={
          isClassic
            ? 'text-xs font-black uppercase tracking-[0.24em] text-white mb-3'
            : 'text-xs font-black uppercase tracking-[0.24em] text-theme-cyan mb-3'
        }
      >
        NPV Drivers
      </h3>

      <div className="h-[280px] w-full" ref={waterfallChart.containerRef}>
        {waterfallChart.ready ? (
          <ResponsiveContainer width={waterfallChart.width} height={waterfallChart.height}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke={chartPalette.grid}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={chartPalette.text}
                fontSize={9}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis
                stroke={chartPalette.text}
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatMm(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartPalette.surface,
                  borderRadius: '8px',
                  border: `1px solid ${chartPalette.border}`,
                  color: 'rgb(var(--text))',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'invisible') return [null, null];
                  return [formatMm(value), 'NPV Impact'];
                }}
                labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />

              {/* Invisible spacer series */}
              <Bar dataKey="invisible" stackId="waterfall" fill="transparent" isAnimationActive={false}>
                {data.map((entry, index) => (
                  <Cell key={`spacer-${index}`} fill="transparent" />
                ))}
              </Bar>

              {/* Visible value series — spring physics rise from axis */}
              <Bar
                dataKey="value"
                stackId="waterfall"
                isAnimationActive={false}
                shape={<SpringBar />}
              >
                {data.map((entry, index) => (
                  <Cell key={`val-${index}`} fill={fillForType(entry.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-inner bg-theme-bg/40 animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default WaterfallChart;
