import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Well, WellGroup } from '../../../../types';
import { getProductionSeries } from '../../../../services/productionService';
import { aggregateNormalized } from '../../../../utils/productionNormalize';

export interface ForecastTabProps {
  group: WellGroup;
  wells: Well[];
  isClassic: boolean;
}

type Stream = 'oil' | 'gas' | 'boe';

const STREAM_OPTIONS: { value: Stream; label: string }[] = [
  { value: 'oil', label: 'Oil' },
  { value: 'gas', label: 'Gas' },
  { value: 'boe', label: 'BOE' },
];

const STREAM_COLOR: Record<Stream, string> = {
  oil: '#34d399',
  gas: '#f59e0b',
  boe: '#818cf8',
};

const STREAM_UNIT: Record<Stream, string> = {
  oil: 'bbl/mo',
  gas: 'mcf/mo',
  boe: 'boe/mo',
};

function fmtYAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(Math.round(v));
}

/**
 * ForecastTab — group-mode dock tab showing an aggregated production forecast.
 *
 * Renders oil/gas/BOE rate vs. time using recharts. Uses getProductionSeries
 * (mock Arps per well) + aggregateNormalized to sum across all wells in the
 * group. A small Oil | Gas | BOE toggle selects the visible stream.
 */
const ForecastTab: React.FC<ForecastTabProps> = ({ group, wells, isClassic: _isClassic }) => {
  const [stream, setStream] = useState<Stream>('oil');

  // Aggregate normalized production across all wells in the group.
  // Memoized by wells array identity, typeCurve reference, and selected stream.
  const chartData = useMemo(() => {
    if (wells.length === 0) return [];
    const series = getProductionSeries(wells, group.typeCurve);
    const agg = aggregateNormalized(series);
    return agg.map((pt) => {
      const boe = pt.oilBbl + pt.gasMcf / 6;
      return {
        monthIndex: pt.monthIndex,
        oil: pt.oilBbl,
        gas: pt.gasMcf,
        boe,
        value: stream === 'oil' ? pt.oilBbl : stream === 'gas' ? pt.gasMcf : boe,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wells, group.typeCurve, stream]);

  if (wells.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px] text-[11px] font-semibold text-theme-muted">
        No wells in group
      </div>
    );
  }

  const color = STREAM_COLOR[stream];
  const unit = STREAM_UNIT[stream];

  return (
    <div className="flex flex-col gap-2 py-2 px-3">
      {/* Stream toggle */}
      <div className="flex items-center gap-1 self-end">
        {STREAM_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStream(opt.value)}
            className={[
              'rounded-inner px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] transition-colors',
              stream === opt.value
                ? 'bg-theme-surface2 text-theme-text border border-theme-border'
                : 'text-theme-muted border border-transparent hover:text-theme-text',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={`fg-grad-${stream}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgb(var(--border) / 0.25)"
            vertical={false}
          />
          <XAxis
            dataKey="monthIndex"
            tickFormatter={(v: number) => (v % 12 === 0 && v > 0 ? `Yr ${v / 12}` : '')}
            tick={{ fontSize: 9, fill: 'rgb(var(--muted))' }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tickFormatter={fmtYAxis}
            tick={{ fontSize: 9, fill: 'rgb(var(--muted))' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: 'rgb(var(--surface-1))',
              border: '1px solid rgb(var(--border))',
              borderRadius: 8,
              fontSize: 10,
              color: 'rgb(var(--text))',
            }}
            formatter={(value: number | undefined) => [
              `${Math.round(value ?? 0).toLocaleString()} ${unit}`,
              stream.charAt(0).toUpperCase() + stream.slice(1),
            ]}
            labelFormatter={(label: unknown) => `Month ${label}`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#fg-grad-${stream})`}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-[9px] text-theme-muted text-right">
        {wells.length} well{wells.length !== 1 ? 's' : ''} · t = 0-aligned
      </p>
    </div>
  );
};

export default ForecastTab;
