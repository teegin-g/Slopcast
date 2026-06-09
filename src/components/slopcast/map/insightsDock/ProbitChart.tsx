import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Well } from '../../../../types';
import { toProbitPoints, probitColor } from '../../../../utils/probit';
import { formatFeet } from '../../../../utils/formatters';

export interface ProbitChartProps {
  wells: Well[];
  isClassic: boolean;
}

// ─── Variable options ─────────────────────────────────────────────────────────

type PlotVariable = 'lateralLength';

// Currently only lateralLength is always-present on Well.
// The selector UI is wired but only one option is exposed — easy to extend later.
const VARIABLE_OPTIONS: { value: PlotVariable; label: string; unit: string }[] = [
  { value: 'lateralLength', label: 'Lateral Length', unit: 'ft' },
];

// ─── Shape-by attribute options ───────────────────────────────────────────────

type ShapeBy = 'none' | 'formation';

const SHAPE_BY_OPTIONS: { value: ShapeBy; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'formation', label: 'Formation' },
];

// Recharts scatter shape names. Deterministic index from sorted distinct values.
type ScatterShape = 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye';
const SHAPE_CYCLE: ScatterShape[] = ['circle', 'diamond', 'triangle', 'square', 'star', 'cross', 'wye'];

function buildShapeMap(wells: Well[], attr: Exclude<ShapeBy, 'none'>): Map<string, ScatterShape> {
  const distinct = Array.from(new Set(wells.map((w) => w[attr]))).sort();
  const map = new Map<string, ScatterShape>();
  distinct.forEach((val, i) => {
    map.set(val, SHAPE_CYCLE[i % SHAPE_CYCLE.length]);
  });
  return map;
}

function fmtYAxis(v: number): string {
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(Math.round(v));
}

function formatValue(v: number, variable: PlotVariable): string {
  if (variable === 'lateralLength') return formatFeet(v);
  return String(Math.round(v));
}

// ─── Point type ───────────────────────────────────────────────────────────────

interface PlotPoint {
  z: number;
  value: number;
  rank: number;
  wellId: string;
  wellName: string;
  attrValue: string; // For shape-by
  color: string;
  shape: ScatterShape;
}

/**
 * ProbitChart — selection-mode dock tab.
 *
 * Renders a probit scatter plot for a per-well numeric variable (default:
 * lateralLength). X-axis = z (normal quantile / probit position), Y-axis =
 * the variable value. Each point is colored via probitColor() over the value
 * domain (cool-to-warm: low = steel blue, high = warm orange).
 *
 * A "shape-by" selector (none | formation) encodes an additional categorical
 * dimension via recharts scatter shape (circle, diamond, triangle, …).
 *
 * Deterministic: no Math.random(). Shape assignment indexed by sorted distinct
 * attribute values. Color uses a continuous scale over the value domain.
 */
const ProbitChart: React.FC<ProbitChartProps> = ({ wells, isClassic: _isClassic }) => {
  const [variable] = useState<PlotVariable>('lateralLength');
  const [shapeBy, setShapeBy] = useState<ShapeBy>('none');

  const { points, domain, shapeMap } = useMemo(() => {
    if (wells.length === 0) {
      return {
        points: [] as PlotPoint[],
        domain: { min: 0, max: 1 },
        shapeMap: new Map<string, ScatterShape>(),
      };
    }

    const values = wells.map((w) => w[variable]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const dom = { min, max };

    const probitPts = toProbitPoints(values);
    const sm = shapeBy !== 'none' ? buildShapeMap(wells, shapeBy) : new Map<string, ScatterShape>();

    const pts: PlotPoint[] = wells.map((well, i) => {
      const pp = probitPts[i];
      const attrValue = shapeBy !== 'none' ? well[shapeBy] : 'default';
      const shape: ScatterShape =
        shapeBy !== 'none' ? sm.get(attrValue) ?? 'circle' : 'circle';

      return {
        z: pp.z,
        value: pp.value,
        rank: pp.rank,
        wellId: well.id,
        wellName: well.name,
        attrValue,
        color: probitColor(pp.value, dom),
        shape,
      };
    });

    return { points: pts, domain: dom, shapeMap: sm };
  }, [wells, variable, shapeBy]);

  // Group by shape for rendering — each distinct shape needs its own <Scatter>
  // when shape-by is active, so tooltip names work correctly.
  // NOTE: must be declared BEFORE any early return to satisfy Rules of Hooks.
  const scatterGroups = useMemo((): { shape: ScatterShape; pts: PlotPoint[] }[] => {
    if (shapeBy === 'none') {
      return [{ shape: 'circle', pts: points }];
    }
    const groups = new Map<ScatterShape, PlotPoint[]>();
    for (const pt of points) {
      const s = pt.shape;
      if (!groups.has(s)) groups.set(s, []);
      groups.get(s)!.push(pt);
    }
    return Array.from(groups.entries()).map(([shape, pts]) => ({ shape, pts }));
  }, [points, shapeBy]);

  if (wells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[120px] py-8 text-center px-4">
        <p className="text-[11px] font-semibold text-theme-muted leading-relaxed">
          Lasso wells to compare a custom selection
        </p>
      </div>
    );
  }

  const varMeta = VARIABLE_OPTIONS.find((o) => o.value === variable) ?? VARIABLE_OPTIONS[0];

  return (
    <div className="flex flex-col gap-2 py-2 px-3" aria-label="Probit plot of selected wells">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Shape-by toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted mr-1">
            Shape
          </span>
          {SHAPE_BY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setShapeBy(opt.value)}
              className={[
                'rounded-inner px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] transition-colors',
                shapeBy === opt.value
                  ? 'bg-theme-surface2 text-theme-text border border-theme-border'
                  : 'text-theme-muted border border-transparent hover:text-theme-text',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgb(var(--border) / 0.25)"
          />
          <XAxis
            type="number"
            dataKey="z"
            name="z-score"
            tick={{ fontSize: 9, fill: 'rgb(var(--muted))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v.toFixed(1)}
            label={{
              value: 'z',
              position: 'insideBottomRight',
              offset: -4,
              style: { fontSize: 9, fill: 'rgb(var(--muted))' },
            }}
          />
          <YAxis
            type="number"
            dataKey="value"
            name={varMeta.label}
            tickFormatter={fmtYAxis}
            tick={{ fontSize: 9, fill: 'rgb(var(--muted))' }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={[domain.min * 0.9, domain.max * 1.05]}
          />
          <Tooltip
            cursor={{ strokeDasharray: '4 4', stroke: 'rgb(var(--border) / 0.5)' }}
            contentStyle={{
              background: 'rgb(var(--surface-1))',
              border: '1px solid rgb(var(--border))',
              borderRadius: 8,
              fontSize: 10,
              color: 'rgb(var(--text))',
            }}
            content={<ProbitTooltip variable={variable} varMeta={varMeta} />}
          />
          {scatterGroups.map(({ shape, pts }) => (
            <Scatter
              key={shape}
              data={pts}
              shape={shape}
              isAnimationActive={false}
              r={4}
            >
              {pts.map((pt) => (
                <Cell key={pt.wellId} fill={pt.color} stroke={pt.color} fillOpacity={0.85} />
              ))}
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Shape legend (only when shape-by is active) */}
      {shapeBy !== 'none' && (
        <ShapeLegend wells={wells} shapeBy={shapeBy} shapeMap={shapeMap} />
      )}

      {/* Color scale caption */}
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] text-theme-muted"
          style={{ color: probitColor(domain.min, domain) }}
        >
          Low
        </span>
        <div
          className="flex-1 h-1 rounded-full"
          style={{
            background: `linear-gradient(to right, ${probitColor(domain.min, domain)}, ${probitColor(
              (domain.min + domain.max) / 2,
              domain,
            )}, ${probitColor(domain.max, domain)})`,
          }}
        />
        <span className="text-[9px] text-theme-muted" style={{ color: probitColor(domain.max, domain) }}>
          High
        </span>
        <span className="text-[9px] text-theme-muted ml-1">{varMeta.label}</span>
      </div>

      <p className="text-[9px] text-theme-muted text-right">
        {wells.length} well{wells.length !== 1 ? 's' : ''} · Hazen plotting position
      </p>
    </div>
  );
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface ProbitTooltipProps {
  active?: boolean;
  payload?: { payload?: PlotPoint }[];
  variable: PlotVariable;
  varMeta: { label: string; unit: string };
}

const ProbitTooltip: React.FC<ProbitTooltipProps> = ({ active, payload, varMeta }) => {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  return (
    <div
      style={{
        background: 'rgb(var(--surface-1))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 8,
        padding: '6px 10px',
        fontSize: 10,
        color: 'rgb(var(--text))',
        minWidth: 140,
      }}
    >
      <p className="font-black text-theme-text mb-1" style={{ fontSize: 10 }}>
        {pt.wellName}
      </p>
      <p style={{ color: 'rgb(var(--muted))' }}>
        {varMeta.label}: <span className="font-semibold text-theme-text">{formatFeet(pt.value)}</span>
      </p>
      <p style={{ color: 'rgb(var(--muted))' }}>
        Rank:{' '}
        <span className="font-semibold text-theme-text">
          P{Math.round(pt.rank * 100)}
        </span>
      </p>
      <p style={{ color: 'rgb(var(--muted))' }}>
        z:{' '}
        <span className="font-semibold text-theme-text tabular-nums">
          {pt.z.toFixed(2)}
        </span>
      </p>
    </div>
  );
};

// ─── Shape legend ─────────────────────────────────────────────────────────────

interface ShapeLegendProps {
  wells: Well[];
  shapeBy: Exclude<ShapeBy, 'none'>;
  shapeMap: Map<string, ScatterShape>;
}

const SHAPE_GLYPHS: Record<ScatterShape, string> = {
  circle: '●',
  diamond: '◆',
  triangle: '▲',
  square: '■',
  star: '★',
  cross: '✚',
  wye: 'Y',
};

const ShapeLegend: React.FC<ShapeLegendProps> = ({ wells, shapeBy, shapeMap }) => {
  const entries = useMemo(() => {
    const distinct = Array.from(new Set(wells.map((w) => w[shapeBy]))).sort();
    return distinct.map((val) => ({ val, shape: shapeMap.get(val) ?? 'circle' as ScatterShape }));
  }, [wells, shapeBy, shapeMap]);

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {entries.map(({ val, shape }) => (
        <span key={val} className="flex items-center gap-1 text-[9px] text-theme-muted">
          <span className="text-[10px]" style={{ lineHeight: 1 }}>
            {SHAPE_GLYPHS[shape]}
          </span>
          {val}
        </span>
      ))}
    </div>
  );
};

export default ProbitChart;
