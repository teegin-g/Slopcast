import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { DealMetrics, MonthlyCashFlow } from '../../types';
import { useRecalcStatus } from './hooks/useRecalcStatus';
import { useTheme } from '../../theme/ThemeProvider';

/** Smoothly animates between numeric values with spring physics */
const AnimatedValue: React.FC<{
  value: number;
  format: (n: number) => string;
  className?: string;
}> = ({ value, format, className }) => {
  const motionValue = useMotionValue(value);
  const display = useTransform(motionValue, (v) => format(v));
  const ref = useRef<HTMLSpanElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      type: 'spring',
      stiffness: 80,
      damping: 20,
      mass: 0.8,
    });
    return controls.stop;
  }, [value, motionValue]);

  useEffect(() => {
    return display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [display]);

  return <span ref={ref} className={className}>{format(value)}</span>;
};

interface SnapshotHistoryEntry {
  npv: number;
  capex: number;
  eur: number;
  payout: number;
  timestamp: number;
}

interface KpiGridProps {
  isClassic: boolean;
  metrics: DealMetrics;
  aggregateFlow?: MonthlyCashFlow[];
  breakevenOilPrice?: number | null;
  snapshotHistory?: SnapshotHistoryEntry[];
  showAfterTax?: boolean;
  showLevered?: boolean;
}

type AccentColor = 'cyan' | 'magenta' | 'lavender' | 'muted';

const accentBorder: Record<AccentColor, string> = {
  cyan: 'border-l-2 border-l-theme-cyan',
  magenta: 'border-l-2 border-l-theme-magenta',
  lavender: 'border-l-2 border-l-theme-lavender',
  muted: 'border-l-2 border-l-theme-muted/40',
};

/** Tiny SVG sparkline from cumulative cash flow data — draws on mount */
const CashFlowSparkline: React.FC<{ flow: MonthlyCashFlow[] }> = ({ flow }) => {
  if (flow.length < 2) return null;
  const cumValues = flow.map(f => f.cumulativeCashFlow);
  const min = Math.min(...cumValues);
  const max = Math.max(...cumValues);
  const range = max - min || 1;
  const w = 320;
  const h = 80;
  const points = cumValues.map((v, i) => {
    const x = (i / (cumValues.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  // Approximate polyline length for stroke animation
  const pathLength = cumValues.reduce((acc, _, i) => {
    if (i === 0) return 0;
    const dx = (1 / (cumValues.length - 1)) * w;
    const dy = (h - ((cumValues[i] - min) / range) * h) - (h - ((cumValues[i - 1] - min) / range) * h);
    return acc + Math.sqrt(dx * dx + dy * dy);
  }, 0);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.25"
        points={points.join(' ')}
        strokeDasharray={pathLength || 1}
        initial={{ strokeDashoffset: pathLength || 1 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <motion.polygon
        fill="url(#sparkFill)"
        points={`0,${h} ${points.join(' ')} ${w},${h}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      />
    </svg>
  );
};

/** Small SVG ring showing payout progress relative to 60-month benchmark */
const PayoutRing: React.FC<{ months: number; benchmark?: number }> = ({ months, benchmark = 60 }) => {
  if (months <= 0) return null;
  const r = 12;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(1, months / benchmark);
  const dashLen = progress * circumference;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.12" />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={`${dashLen} ${circumference}`}
        strokeLinecap="round"
        opacity="0.5"
        transform="rotate(-90 14 14)"
        className="text-theme-lavender"
      />
    </svg>
  );
};

const KpiStripTile: React.FC<{
  title: string;
  value?: string;
  valueNode?: React.ReactNode;
  unit?: string;
  accent: AccentColor;
  extra?: React.ReactNode;
  shimmer?: string;
  bgClass?: string;
}> = ({ title, value, valueNode, unit, accent, extra, shimmer = '', bgClass = 'bg-theme-surface1/60' }) => (
  <div className={`rounded-inner border border-theme-border ${bgClass} px-4 py-3 theme-transition hover:bg-theme-surface2 ${accentBorder[accent]}`}>
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5 text-theme-muted heading-font">{title}</p>
    <div className="flex items-center gap-2">
      {valueNode ? (
        <p className="flex items-center">
          {valueNode}
          {unit && <span className="text-[11px] text-theme-muted font-semibold ml-1">{unit}</span>}
        </p>
      ) : (
        <p className={`text-xl font-black text-theme-text leading-none ${shimmer}`}>
          {value}
          {unit && <span className="text-[11px] text-theme-muted font-semibold ml-1">{unit}</span>}
        </p>
      )}
      {extra}
    </div>
  </div>
);

const WellsBadge: React.FC<{ count: number }> = ({ count }) => (
  <div className="rounded-inner border border-theme-border bg-theme-surface1/60 px-4 py-3 theme-transition hover:bg-theme-surface2 border-l-2 border-l-theme-muted/40 flex items-center gap-3">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5 text-theme-muted">Wells</p>
      <p className="text-xl font-black text-theme-text leading-none">{count}</p>
    </div>
    <span className="ml-auto text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-theme-cyan/10 text-theme-cyan border border-theme-cyan/20">
      active
    </span>
  </div>
);

/** Tiny inline sparkline for metric trends across snapshots */
const MetricSparkline: React.FC<{ values: number[] }> = ({ values }) => {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 48;
  const h = 16;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="shrink-0 opacity-40">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
    </svg>
  );
};

const heroBgMap: Record<'glass' | 'solid' | 'outline', string> = {
  glass: 'bg-theme-surface1/85',
  solid: 'bg-theme-surface1',
  outline: 'bg-theme-surface1/25',
};

const tileBgMap: Record<'glass' | 'solid' | 'outline', string> = {
  glass: 'bg-theme-surface1/60',
  solid: 'bg-theme-surface1',
  outline: 'bg-theme-surface1/25',
};

const KpiGrid: React.FC<KpiGridProps> = ({ isClassic, metrics, aggregateFlow, breakevenOilPrice, snapshotHistory, showAfterTax, showLevered }) => {
  const { isRecalculating } = useRecalcStatus();
  const { theme } = useTheme();
  const panelStyle = theme.features.panelStyle;
  const shimmerClass = isRecalculating ? 'animate-shimmer' : '';
  const breakevenLabel = breakevenOilPrice != null ? `Breakeven $${breakevenOilPrice}/bbl` : null;

  if (isClassic) {
    return (
      <div className="space-y-4">
        <div className="sc-kpi sc-kpi--main theme-transition relative overflow-hidden">
          {aggregateFlow && aggregateFlow.length > 1 && (
            <div className="absolute inset-0 text-white/30 pointer-events-none">
              <CashFlowSparkline flow={aggregateFlow} />
            </div>
          )}
          <div className="sc-kpiTitlebar px-4 py-2 relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.25em]">PORTFOLIO NPV (10%)</p>
          </div>
          <div className="px-6 py-6 flex items-baseline relative z-10">
            <span className={`sc-kpiValue text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter leading-none ${shimmerClass}`}>
              ${(metrics.npv10 / 1e6).toFixed(1)}
            </span>
            <span className="sc-kpiValue text-2xl font-black ml-3">MM</span>
          </div>
          {breakevenLabel && (
            <div className="px-6 pb-4 relative z-10">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">{breakevenLabel}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="sc-kpi sc-kpi--tile theme-transition">
            <div className="sc-kpiTitlebar px-3 py-1.5">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Total CAPEX</p>
            </div>
            <div className="px-4 py-4">
              <p className={`sc-kpiValue text-3xl font-black tracking-tight ${shimmerClass}`}>
                ${(metrics.totalCapex / 1e6).toFixed(1)}
                <span className="text-lg font-black ml-1 opacity-90">MM</span>
              </p>
            </div>
          </div>
          <div className="sc-kpi sc-kpi--tile theme-transition">
            <div className="sc-kpiTitlebar px-3 py-1.5">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Portfolio EUR</p>
            </div>
            <div className="px-4 py-4">
              <p className={`sc-kpiValue text-3xl font-black tracking-tight ${shimmerClass}`}>
                {(metrics.eur / 1e3).toFixed(0)}
                <span className="text-lg font-black ml-1 opacity-90">MBOE</span>
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="sc-kpi sc-kpi--tile theme-transition">
            <div className="sc-kpiTitlebar px-3 py-1.5">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Payout</p>
            </div>
            <div className="px-4 py-4">
              <p className={`sc-kpiValue text-3xl font-black tracking-tight ${shimmerClass}`}>
                {metrics.payoutMonths > 0 ? String(metrics.payoutMonths) : '-'}
                <span className="text-lg font-black ml-1 opacity-90">MO</span>
              </p>
            </div>
          </div>
          <div className="sc-kpi sc-kpi--tile sc-kpi--dangerBody theme-transition">
            <div className="sc-kpiTitlebar px-3 py-1.5">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Wells</p>
            </div>
            <div className="px-4 py-4">
              <p className={`sc-kpiValue text-3xl font-black tracking-tight ${shimmerClass}`}>
                {String(metrics.wellCount)}
                <span className="text-lg font-black ml-1 opacity-90">UNIT</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        className={`rounded-panel border p-8 shadow-card relative overflow-hidden group theme-transition ${heroBgMap[panelStyle]} border-theme-border hover:border-theme-border/80`}
      >
        {aggregateFlow && aggregateFlow.length > 1 && (
          <div className="absolute inset-0 text-theme-cyan pointer-events-none">
            <CashFlowSparkline flow={aggregateFlow} />
          </div>
        )}
        <p className="text-theme-muted text-xs font-bold uppercase tracking-[0.4em] mb-2 relative z-10 heading-font">Portfolio NPV (10%)</p>
        <div className="flex items-baseline relative z-10">
          <AnimatedValue
            value={metrics.npv10 / 1e6}
            format={(n) => `$${n.toFixed(1)}`}
            className={`text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter leading-none text-theme-cyan ${shimmerClass}`}
          />
          <span className="text-2xl font-black ml-3 text-theme-lavender italic">MM</span>
        </div>
        {breakevenLabel && (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-theme-muted/70 mt-2 relative z-10">{breakevenLabel}</p>
        )}
        {/* After-tax / Levered NPV indicators */}
        {(showAfterTax || showLevered) && (
          <div className="flex items-center gap-4 mt-2 relative z-10">
            {showAfterTax && metrics.afterTaxNpv10 != null && (
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-theme-lavender">
                After-Tax: ${(metrics.afterTaxNpv10 / 1e6).toFixed(1)}MM
              </span>
            )}
            {showLevered && metrics.leveredNpv10 != null && (
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-theme-magenta">
                Levered: ${(metrics.leveredNpv10 / 1e6).toFixed(1)}MM
              </span>
            )}
            {showLevered && metrics.dscr != null && metrics.dscr > 0 && (
              <span className="text-xs font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-theme-surface2 text-theme-muted border border-theme-border">
                DSCR: {metrics.dscr.toFixed(2)}x
              </span>
            )}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <KpiStripTile
          title="Total CAPEX"
          valueNode={
            <AnimatedValue
              value={metrics.totalCapex / 1e6}
              format={(n) => `$${n.toFixed(1)}`}
              className={`text-xl font-black text-theme-text leading-none ${shimmerClass}`}
            />
          }
          unit="MM"
          accent="magenta"
          shimmer={shimmerClass}
          bgClass={tileBgMap[panelStyle]}
          extra={snapshotHistory && snapshotHistory.length >= 2 ? <MetricSparkline values={snapshotHistory.map(s => s.capex)} /> : undefined}
        />
        <KpiStripTile
          title="Portfolio EUR"
          valueNode={
            <AnimatedValue
              value={metrics.eur / 1e3}
              format={(n) => n.toFixed(0)}
              className={`text-xl font-black text-theme-text leading-none ${shimmerClass}`}
            />
          }
          unit="MBOE"
          accent="cyan"
          shimmer={shimmerClass}
          bgClass={tileBgMap[panelStyle]}
          extra={snapshotHistory && snapshotHistory.length >= 2 ? <MetricSparkline values={snapshotHistory.map(s => s.eur)} /> : undefined}
        />
        <KpiStripTile
          title="IRR"
          valueNode={
            <AnimatedValue
              value={metrics.irr * 100}
              format={(n) => `${n.toFixed(1)}`}
              className={`text-xl font-black text-theme-text leading-none ${shimmerClass}`}
            />
          }
          unit="%"
          accent="magenta"
          shimmer={shimmerClass}
          bgClass={tileBgMap[panelStyle]}
        />
        <KpiStripTile
          title="Payout"
          valueNode={
            <AnimatedValue
              value={metrics.payoutMonths}
              format={(n) => n > 0 ? String(Math.round(n)) : '-'}
              className={`text-xl font-black text-theme-text leading-none ${shimmerClass}`}
            />
          }
          unit="MO"
          accent="lavender"
          shimmer={shimmerClass}
          bgClass={tileBgMap[panelStyle]}
          extra={<PayoutRing months={metrics.payoutMonths} />}
        />
        <WellsBadge count={metrics.wellCount} />
      </div>
    </div>
  );
};

export default React.memo(KpiGrid);
