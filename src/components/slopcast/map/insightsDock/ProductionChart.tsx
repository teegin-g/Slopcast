import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Well, TypeCurveParams } from '../../../../types';
import { getProductionSeries } from '../../../../services/productionService';
import { normalizeToFirstProduction } from '../../../../utils/productionNormalize';

export interface ProductionChartProps {
  wells: Well[];
  typeCurve: TypeCurveParams;
  isClassic: boolean;
}

// ─── Color-by attribute options ───────────────────────────────────────────────

type ColorBy = 'formation' | 'operator';

const COLOR_BY_OPTIONS: { value: ColorBy; label: string }[] = [
  { value: 'formation', label: 'Formation' },
  { value: 'operator', label: 'Operator' },
];

// Fixed categorical palette — indexed by sorted-distinct position; deterministic.
// No Math.random() — stable order guaranteed by sorting distinct values.
const CATEGORICAL_PALETTE: string[] = [
  '#34d399', // green-400
  '#818cf8', // indigo-400
  '#f59e0b', // amber-400
  '#f472b6', // pink-400
  '#38bdf8', // sky-400
  '#a3e635', // lime-400
  '#fb923c', // orange-400
  '#e879f9', // fuchsia-400
  '#2dd4bf', // teal-400
  '#facc15', // yellow-400
];

function buildColorMap(
  wells: Well[],
  attr: ColorBy,
): Map<string, string> {
  // Collect distinct values in sorted order — deterministic index assignment
  const distinct = Array.from(new Set(wells.map((w) => w[attr]))).sort();
  const map = new Map<string, string>();
  distinct.forEach((val, i) => {
    map.set(val, CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]);
  });
  return map;
}

function fmtYAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(Math.round(v));
}

// ─── Chart row type (wide format) ────────────────────────────────────────────

type ChartRow = Record<string, number>;

/**
 * ProductionChart — selection-mode dock tab.
 *
 * Renders one oil production line per selected well, normalized to each
 * well's own first producing month (t=0). A "color-by" selector
 * (formation | operator) maps each line to a deterministic categorical color.
 *
 * Data is built in wide-format rows: { monthIndex, [wellId]: oilBbl, … }
 * so recharts can render a separate <Line> per well.
 */
const ProductionChart: React.FC<ProductionChartProps> = ({
  wells,
  typeCurve,
  isClassic: _isClassic,
}) => {
  const [colorBy, setColorBy] = useState<ColorBy>('formation');

  const { rows, colorMap, maxMonths } = useMemo(() => {
    if (wells.length === 0) {
      return { rows: [], colorMap: new Map<string, string>(), maxMonths: 0 };
    }

    const seriesList = getProductionSeries(wells, typeCurve);
    const normalizedMap = new Map<string, { monthIndex: number; oilBbl: number }[]>();

    let maxIdx = 0;
    for (const s of seriesList) {
      const pts = normalizeToFirstProduction(s);
      normalizedMap.set(s.wellId, pts);
      const last = pts[pts.length - 1];
      if (last && last.monthIndex > maxIdx) maxIdx = last.monthIndex;
    }

    // Build wide-format rows
    const rowsArr: ChartRow[] = [];
    for (let mi = 0; mi <= maxIdx; mi++) {
      const row: ChartRow = { monthIndex: mi };
      for (const [wellId, pts] of normalizedMap) {
        const pt = pts.find((p) => p.monthIndex === mi);
        row[wellId] = pt ? pt.oilBbl : 0;
      }
      rowsArr.push(row);
    }

    const cm = buildColorMap(wells, colorBy);

    return { rows: rowsArr, colorMap: cm, maxMonths: maxIdx };
  }, [wells, typeCurve, colorBy]);

  if (wells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[120px] py-8 text-center px-4">
        <p className="text-[11px] font-semibold text-theme-muted leading-relaxed">
          Lasso wells to compare a custom selection
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2 px-3">
      {/* Color-by toggle */}
      <div className="flex items-center gap-1.5 self-end">
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted mr-1">
          Color by
        </span>
        {COLOR_BY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setColorBy(opt.value)}
            className={[
              'rounded-inner px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] transition-colors',
              colorBy === opt.value
                ? 'bg-theme-surface2 text-theme-text border border-theme-border'
                : 'text-theme-muted border border-transparent hover:text-theme-text',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={rows} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgb(var(--border) / 0.25)"
            vertical={false}
          />
          <XAxis
            dataKey="monthIndex"
            tickFormatter={(v: number) =>
              v % 12 === 0 && v > 0 ? `Yr ${v / 12}` : ''
            }
            tick={{ fontSize: 9, fill: 'rgb(var(--muted))' }}
            axisLine={false}
            tickLine={false}
            interval={0}
            domain={[0, maxMonths]}
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
            labelFormatter={(label: unknown) => `Month ${label}`}
            formatter={(value: number | undefined, name: string | undefined) => {
              const well = name ? wells.find((w) => w.id === name) : undefined;
              const displayName = well ? well.name : (name ?? '');
              const displayValue = value != null ? `${Math.round(value).toLocaleString()} bbl/mo` : '—';
              return [displayValue, displayName];
            }}
          />
          {wells.map((well) => {
            const attrValue = well[colorBy];
            const stroke = colorMap.get(attrValue) ?? '#818cf8';
            return (
              <Line
                key={well.id}
                dataKey={well.id}
                stroke={stroke}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, stroke }}
                isAnimationActive={false}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Color legend */}
      <ColorLegend wells={wells} colorBy={colorBy} colorMap={colorMap} />

      <p className="text-[9px] text-theme-muted text-right">
        {wells.length} well{wells.length !== 1 ? 's' : ''} · t = 0-aligned · oil (bbl/mo)
      </p>
    </div>
  );
};

// ─── Compact color legend ─────────────────────────────────────────────────────

interface ColorLegendProps {
  wells: Well[];
  colorBy: ColorBy;
  colorMap: Map<string, string>;
}

const ColorLegend: React.FC<ColorLegendProps> = ({ wells, colorBy, colorMap }) => {
  const entries = useMemo(() => {
    const distinct = Array.from(new Set(wells.map((w) => w[colorBy]))).sort();
    return distinct.map((val) => ({ val, color: colorMap.get(val) ?? '#818cf8' }));
  }, [wells, colorBy, colorMap]);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {entries.map(({ val, color }) => (
        <span key={val} className="flex items-center gap-1 text-[9px] text-theme-muted">
          <span
            className="inline-block w-2.5 h-0.5 rounded-full"
            style={{ background: color }}
          />
          {val}
        </span>
      ))}
    </div>
  );
};

export default ProductionChart;
