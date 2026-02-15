import React from 'react';
import { DealMetrics } from '../../types';

interface KpiGridProps {
  isClassic: boolean;
  metrics: DealMetrics;
}

const KpiTile: React.FC<{
  isClassic: boolean;
  title: string;
  value: string;
  unit?: string;
  danger?: boolean;
}> = ({ isClassic, title, value, unit, danger = false }) => {
  if (isClassic) {
    return (
      <div className={`sc-kpi sc-kpi--tile theme-transition ${danger ? 'sc-kpi--dangerBody' : ''}`}>
        <div className="sc-kpiTitlebar px-3 py-1.5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
        </div>
        <div className="px-4 py-4">
          <p className="sc-kpiValue text-3xl font-black tracking-tight">
            {value}
            {unit && <span className="text-lg font-black ml-1 opacity-90">{unit}</span>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-inner border p-6 theme-transition shadow-sm bg-theme-surface1 border-theme-border hover:bg-theme-surface2">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-theme-muted">{title}</p>
      <p className="text-3xl font-black text-theme-text">
        {value}
        {unit && <span className="text-lg text-theme-muted font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
};

const KpiGrid: React.FC<KpiGridProps> = ({ isClassic, metrics }) => {
  return (
    <div className="space-y-4">
      {isClassic ? (
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
      ) : (
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
      )}

      <div className="grid grid-cols-2 gap-4">
        <KpiTile
          isClassic={isClassic}
          title="Total CAPEX"
          value={`$${(metrics.totalCapex / 1e6).toFixed(1)}`}
          unit="MM"
        />
        <KpiTile
          isClassic={isClassic}
          title="Portfolio EUR"
          value={(metrics.eur / 1e3).toFixed(0)}
          unit="MBOE"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiTile
          isClassic={isClassic}
          title="Payout"
          value={metrics.payoutMonths > 0 ? String(metrics.payoutMonths) : '-'}
          unit="MO"
        />
        <KpiTile
          isClassic={isClassic}
          title="Wells"
          value={String(metrics.wellCount)}
          unit="UNIT"
          danger
        />
      </div>
    </div>
  );
};

export default KpiGrid;
