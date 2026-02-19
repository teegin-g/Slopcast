import React from 'react';
import { DealMetrics } from '../../types';

interface KpiGridProps {
  isClassic: boolean;
  metrics: DealMetrics;
}

type AccentColor = 'cyan' | 'magenta' | 'lavender' | 'muted';

const accentBorder: Record<AccentColor, string> = {
  cyan: 'border-l-2 border-l-theme-cyan',
  magenta: 'border-l-2 border-l-theme-magenta',
  lavender: 'border-l-2 border-l-theme-lavender',
  muted: 'border-l-2 border-l-theme-muted/40',
};

const KpiStripTile: React.FC<{
  title: string;
  value: string;
  unit?: string;
  accent: AccentColor;
}> = ({ title, value, unit, accent }) => (
  <div className={`rounded-inner border border-theme-border bg-theme-surface1/60 px-4 py-3 theme-transition hover:bg-theme-surface2 ${accentBorder[accent]}`}>
    <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5 text-theme-muted">{title}</p>
    <p className="text-xl font-black text-theme-text leading-none">
      {value}
      {unit && <span className="text-[11px] text-theme-muted font-semibold ml-1">{unit}</span>}
    </p>
  </div>
);

const WellsBadge: React.FC<{ count: number }> = ({ count }) => (
  <div className="rounded-inner border border-theme-border bg-theme-surface1/60 px-4 py-3 theme-transition hover:bg-theme-surface2 border-l-2 border-l-theme-muted/40 flex items-center gap-3">
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5 text-theme-muted">Wells</p>
      <p className="text-xl font-black text-theme-text leading-none">{count}</p>
    </div>
    <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-theme-cyan/10 text-theme-cyan border border-theme-cyan/20">
      active
    </span>
  </div>
);

const KpiGrid: React.FC<KpiGridProps> = ({ isClassic, metrics }) => {
  if (isClassic) {
    return (
      <div className="space-y-4">
        <div className="sc-kpi sc-kpi--main theme-transition">
          <div className="sc-kpiTitlebar px-4 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.25em]">PORTFOLIO NPV (10%)</p>
          </div>
          <div className="px-6 py-6 flex items-baseline">
            <span className="sc-kpiValue text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter leading-none">
              ${(metrics.npv10 / 1e6).toFixed(1)}
            </span>
            <span className="sc-kpiValue text-2xl font-black ml-3">MM</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="sc-kpi sc-kpi--tile theme-transition">
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
          <div className="sc-kpi sc-kpi--tile theme-transition">
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
          <div className="sc-kpi sc-kpi--tile theme-transition">
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
          <div className="sc-kpi sc-kpi--tile sc-kpi--dangerBody theme-transition">
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

  return (
    <div className="space-y-4">
      <div className="rounded-panel border p-8 shadow-card relative overflow-hidden group theme-transition bg-theme-surface1 border-theme-border hover:border-theme-magenta">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none transition-opacity duration-700 bg-theme-cyan/15 opacity-60 group-hover:opacity-100"></div>
        <p className="text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em] mb-2">Portfolio NPV (10%)</p>
        <div className="flex items-baseline relative z-10">
          <span className="text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter leading-none text-theme-cyan">
            ${(metrics.npv10 / 1e6).toFixed(1)}
          </span>
          <span className="text-2xl font-black ml-3 text-theme-lavender italic">MM</span>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiStripTile
          title="Total CAPEX"
          value={`$${(metrics.totalCapex / 1e6).toFixed(1)}`}
          unit="MM"
          accent="magenta"
        />
        <KpiStripTile
          title="Portfolio EUR"
          value={(metrics.eur / 1e3).toFixed(0)}
          unit="MBOE"
          accent="cyan"
        />
        <KpiStripTile
          title="Payout"
          value={metrics.payoutMonths > 0 ? String(metrics.payoutMonths) : '-'}
          unit="MO"
          accent="lavender"
        />
        <WellsBadge count={metrics.wellCount} />
      </div>
    </div>
  );
};

export default KpiGrid;
