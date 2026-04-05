import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useReducedMotion } from 'motion/react';
import { SPRING } from '../../theme/motion';
import { DealMetrics, MonthlyCashFlow } from '../../types';

interface KpiGridProps {
  isClassic: boolean;
  metrics: DealMetrics;
  aggregateFlow?: MonthlyCashFlow[];
  breakevenOilPrice?: number | null;
  isDerivedComputing?: boolean;
  runCompleteToken?: number;
}

type AccentColor = 'cyan' | 'magenta' | 'lavender' | 'muted';

const accentBorder: Record<AccentColor, string> = {
  cyan: 'border-l-2 border-l-theme-cyan',
  magenta: 'border-l-2 border-l-theme-magenta',
  lavender: 'border-l-2 border-l-theme-lavender',
  muted: 'border-l-2 border-l-theme-muted/40',
};

/** Animated counter that rolls from previous value to new value */
const AnimatedNpvValue: React.FC<{ value: number; runToken: number }> = ({ value, runToken }) => {
  const prefersReduced = useReducedMotion();
  const displayRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!displayRef.current) return;

    const formatted = (v: number) => `$${(v / 1e6).toFixed(1)}`;

    // On first render or reduced motion, just set the value
    if (isFirstRender.current || prefersReduced) {
      displayRef.current.textContent = formatted(value);
      prevValueRef.current = value;
      isFirstRender.current = false;
      return;
    }

    const from = prevValueRef.current;
    const controls = animate(from, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (displayRef.current) {
          displayRef.current.textContent = formatted(latest);
        }
      },
    });

    prevValueRef.current = value;

    return () => controls.stop();
  }, [value, runToken, prefersReduced]);

  return (
    <span role="status" aria-live="polite" aria-atomic="true">
      <span ref={displayRef} aria-label="Portfolio NPV value">${(value / 1e6).toFixed(1)}</span>
    </span>
  );
};

/** Tiny SVG sparkline from cumulative cash flow data */
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
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.25"
        points={points.join(' ')}
      />
      <polygon
        fill="url(#sparkFill)"
        points={`0,${h} ${points.join(' ')} ${w},${h}`}
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
  value: string;
  unit?: string;
  accent: AccentColor;
  extra?: React.ReactNode;
  valueSize?: string;
  valueColor?: string;
}> = ({ title, value, unit, accent, extra, valueSize = 'text-xl', valueColor = 'text-theme-text' }) => (
  <div className={`rounded-inner border border-theme-border bg-theme-surface1/60 px-4 py-3 theme-transition hover:bg-theme-surface2 ${accentBorder[accent]}`}>
    <p className="typo-kpi-label heading-font mb-1.5">{title}</p>
    <div className="flex items-center gap-2">
      <p className={`typo-value ${valueSize} font-black ${valueColor} leading-none`}>
        {value}
        {unit && <span className="typo-kpi-label ml-1 text-theme-muted">{unit}</span>}
      </p>
      {extra}
    </div>
  </div>
);

const WellsBadge: React.FC<{ count: number }> = ({ count }) => (
  <div className="rounded-inner border border-theme-border bg-theme-surface1/60 px-4 py-3 theme-transition hover:bg-theme-surface2 border-l-2 border-l-theme-muted/40 flex items-center gap-3">
    <div>
      <p className="typo-kpi-label heading-font mb-1.5">Wells</p>
      <p className="typo-kpi-value text-theme-muted">{count}</p>
    </div>
    <span className="typo-button ml-auto relative rounded-full border border-theme-cyan/20 bg-theme-cyan/10 px-2 py-0.5 text-[8px] text-theme-cyan">
      <span className="absolute inset-0 rounded-full bg-theme-cyan/20 motion-safe:animate-ping" />
      <span className="relative">active</span>
    </span>
  </div>
);

const KpiGrid: React.FC<KpiGridProps> = ({
  isClassic,
  metrics,
  aggregateFlow,
  breakevenOilPrice,
  isDerivedComputing,
  runCompleteToken = 0,
}) => {
  const prefersReduced = useReducedMotion();
  // Track previous token to detect fresh completions for stagger re-trigger
  const [staggerKey, setStaggerKey] = useState(0);
  const prevTokenRef = useRef(runCompleteToken);

  useEffect(() => {
    if (runCompleteToken > 0 && runCompleteToken !== prevTokenRef.current) {
      setStaggerKey(prev => prev + 1);
      prevTokenRef.current = runCompleteToken;
    }
  }, [runCompleteToken]);

  const shimmerClass = isDerivedComputing ? 'economics-shimmer' : '';

  if (isClassic) {
    return (
      <div className="space-y-4">
        <div className={`sc-kpi sc-kpi--main theme-transition relative overflow-hidden ${shimmerClass}`}>
          {aggregateFlow && aggregateFlow.length > 1 && (
            <div className="absolute inset-0 text-white/30 pointer-events-none">
              <CashFlowSparkline flow={aggregateFlow} />
            </div>
          )}
          <div className="sc-kpiTitlebar px-4 py-2 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em]">PORTFOLIO NPV (10%)</p>
          </div>
          <div className="px-6 py-6 flex items-baseline relative z-10">
            <span className="sc-kpiValue text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter leading-none">
              <AnimatedNpvValue value={metrics.npv10} runToken={runCompleteToken} />
            </span>
            <span className="sc-kpiValue text-2xl font-black ml-3">MM</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`sc-kpi sc-kpi--tile theme-transition ${shimmerClass}`}>
            <div className="sc-kpiTitlebar px-3 py-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Total CAPEX</p>
            </div>
            <div className="px-4 py-4">
              <p className="sc-kpiValue text-3xl font-black tracking-tight">
                ${(metrics.totalCapex / 1e6).toFixed(1)}
                <span className="text-lg font-black ml-1 opacity-90">MM</span>
              </p>
            </div>
          </div>
          <div className={`sc-kpi sc-kpi--tile theme-transition ${shimmerClass}`}>
            <div className="sc-kpiTitlebar px-3 py-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Portfolio EUR</p>
            </div>
            <div className="px-4 py-4">
              <p className="sc-kpiValue text-3xl font-black tracking-tight">
                {(metrics.eur / 1e3).toFixed(0)}
                <span className="text-lg font-black ml-1 opacity-90">MBOE</span>
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`sc-kpi sc-kpi--tile theme-transition ${shimmerClass}`}>
            <div className="sc-kpiTitlebar px-3 py-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Payout</p>
            </div>
            <div className="px-4 py-4">
              <p className="sc-kpiValue text-3xl font-black tracking-tight">
                {metrics.payoutMonths > 0 ? String(metrics.payoutMonths) : '-'}
                <span className="text-lg font-black ml-1 opacity-90">MO</span>
              </p>
            </div>
          </div>
          <div className={`sc-kpi sc-kpi--tile sc-kpi--dangerBody theme-transition ${shimmerClass}`}>
            <div className="sc-kpiTitlebar px-3 py-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Wells</p>
            </div>
            <div className="px-4 py-4">
              <p className="sc-kpiValue text-3xl font-black tracking-tight">
                {String(metrics.wellCount)}
                <span className="text-lg font-black ml-1 opacity-90">UNIT</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tiles = [
    <KpiStripTile
      key="capex"
      title="Total CAPEX"
      value={`$${(metrics.totalCapex / 1e6).toFixed(1)}`}
      unit="MM"
      accent="magenta"
      valueSize="text-2xl"
      valueColor="text-theme-text"
    />,
    <KpiStripTile
      key="eur"
      title="Portfolio EUR"
      value={(metrics.eur / 1e3).toFixed(0)}
      unit="MBOE"
      accent="cyan"
      valueSize="text-2xl"
      valueColor="text-theme-text"
    />,
    <KpiStripTile
      key="payout"
      title="Payout"
      value={metrics.payoutMonths > 0 ? String(metrics.payoutMonths) : '-'}
      unit="MO"
      accent="lavender"
      valueColor="text-theme-lavender"
      extra={<PayoutRing months={metrics.payoutMonths} />}
    />,
    <WellsBadge key="wells" count={metrics.wellCount} />,
  ];

  return (
    <div className="space-y-4">
      <div className={`rounded-panel border p-8 shadow-card relative overflow-hidden group theme-transition bg-theme-surface1 border-theme-border hover:border-theme-magenta ${shimmerClass}`}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none transition-opacity duration-700 bg-theme-cyan/15 opacity-60 group-hover:opacity-100"></div>
        {aggregateFlow && aggregateFlow.length > 1 && (
          <div className="absolute inset-0 text-theme-cyan pointer-events-none">
            <CashFlowSparkline flow={aggregateFlow} />
          </div>
        )}
        <p className="typo-section heading-font relative z-10 mb-3 text-theme-muted">Portfolio NPV (10%)</p>
        <div className="flex items-baseline relative z-10">
          <span className="typo-hero-value text-theme-cyan">
            <AnimatedNpvValue value={metrics.npv10} runToken={runCompleteToken} />
          </span>
          <span className="typo-kpi-value ml-3 italic text-theme-lavender">MM</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {tiles.map((tile, index) => (
          <motion.div
            key={`${tile.key}-${staggerKey}`}
            initial={prefersReduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.snappy, delay: index * 0.08 }}
            className={shimmerClass}
          >
            {tile}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default KpiGrid;
