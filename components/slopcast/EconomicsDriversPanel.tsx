import React from 'react';

interface DriverInsight {
  id: string;
  label: string;
  dominantDelta: number;
}

interface ShockSummary {
  label: string;
  deltaNpv: number;
}

interface ScenarioRanking {
  id: string;
  name: string;
  npv10: number;
  roi: number;
}

export interface EconomicsDriversPanelProps {
  isClassic: boolean;
  topDrivers: DriverInsight[];
  biggestPositive: ShockSummary | null;
  biggestNegative: ShockSummary | null;
  breakevenOilPrice: number | null;
  payoutMonths: number;
  fastestPayoutScenarioName: string;
  scenarioRankings: ScenarioRanking[];
}

const DriverBar: React.FC<{ driver: DriverInsight; maxAbs: number }> = ({ driver, maxAbs }) => {
  const positive = driver.dominantDelta >= 0;
  const pct = maxAbs > 0 ? Math.min(Math.abs(driver.dominantDelta) / maxAbs, 1) * 100 : 0;

  return (
    <div className="rounded-inner border border-theme-border bg-theme-bg p-3 theme-transition">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-muted">{driver.label}</p>
        <p className={`text-sm font-black ${positive ? 'text-theme-cyan' : 'text-theme-magenta'}`}>
          {positive ? '+' : ''}{(driver.dominantDelta / 1e6).toFixed(1)} MM
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-theme-surface2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${positive ? 'bg-theme-cyan' : 'bg-theme-magenta'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => (
  <span className="w-5 h-5 rounded-full bg-theme-surface2 border border-theme-border text-[9px] font-black text-theme-text flex items-center justify-center shrink-0">
    {rank}
  </span>
);

const EconomicsDriversPanel: React.FC<EconomicsDriversPanelProps> = ({
  isClassic,
  topDrivers,
  biggestPositive,
  biggestNegative,
  breakevenOilPrice,
  payoutMonths,
  fastestPayoutScenarioName,
  scenarioRankings,
}) => {
  const maxAbs = topDrivers.reduce((m, d) => Math.max(m, Math.abs(d.dominantDelta)), 0);

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition p-4 space-y-6'
          : 'rounded-panel border shadow-card p-5 theme-transition bg-theme-surface1/70 border-theme-border space-y-6'
      }
    >
      {/* Top drivers with horizontal bar indicators */}
      <div className="space-y-2">
        <p className={isClassic
          ? 'text-[10px] font-black uppercase tracking-[0.2em] text-white mb-3'
          : 'text-[10px] font-black uppercase tracking-[0.2em] text-theme-cyan mb-3'
        }>
          Key Sensitivity Drivers
        </p>
        <div className="grid grid-cols-1 gap-2">
          {topDrivers.map((driver) => (
            <DriverBar key={driver.id} driver={driver} maxAbs={maxAbs} />
          ))}
        </div>
      </div>

      <div className="border-t border-theme-border/30" />

      {/* Upside / Downside - asymmetric with color tints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-inner border p-4 border-theme-border bg-theme-cyan/5 theme-transition">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-cyan mb-1">Biggest Upside</p>
          <p className="text-[10px] text-theme-muted mb-2">{biggestPositive?.label || 'n/a'}</p>
          <p className="text-2xl font-black text-theme-cyan leading-none">
            {biggestPositive ? `+${(biggestPositive.deltaNpv / 1e6).toFixed(1)}` : '-'}
            {biggestPositive && <span className="text-sm ml-1 font-semibold">MM</span>}
          </p>
        </div>
        <div className="rounded-inner border p-4 border-theme-border bg-theme-magenta/5 theme-transition">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-magenta mb-1">Biggest Downside</p>
          <p className="text-[10px] text-theme-muted mb-2">{biggestNegative?.label || 'n/a'}</p>
          <p className="text-2xl font-black text-theme-magenta leading-none">
            {biggestNegative ? `${(biggestNegative.deltaNpv / 1e6).toFixed(1)}` : '-'}
            {biggestNegative && <span className="text-sm ml-1 font-semibold">MM</span>}
          </p>
        </div>
      </div>

      {/* Breakeven + Payout - mixed layout for rhythm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-inner border p-4 border-theme-border bg-theme-bg theme-transition border-l-2 border-l-theme-lavender">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-muted mb-2">Breakeven Oil</p>
          <p className="text-3xl font-black text-theme-text leading-none">
            {breakevenOilPrice !== null ? `$${breakevenOilPrice.toFixed(1)}` : 'N/A'}
          </p>
          {breakevenOilPrice !== null && (
            <p className="text-[9px] text-theme-muted mt-1 uppercase tracking-wide">per barrel</p>
          )}
        </div>
        <div className="rounded-inner border p-4 border-theme-border bg-theme-bg theme-transition border-l-2 border-l-theme-cyan">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-muted mb-2">Payout Highlights</p>
          <p className="text-xl font-black text-theme-text leading-none">
            {payoutMonths > 0 ? `${payoutMonths} mo` : '-'}
          </p>
          <p className="text-[10px] text-theme-muted mt-1.5">Fastest: {fastestPayoutScenarioName}</p>
        </div>
      </div>

      <div className="border-t border-theme-border/30" />

      {/* Scenario rankings with rank badges */}
      <div className="rounded-inner border overflow-hidden bg-theme-bg border-theme-border">
        <div className="px-4 py-2.5 border-b border-theme-border flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Scenario Rank</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-theme-muted">NPV / ROI</p>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-theme-border/20">
          {scenarioRankings.map((row, idx) => (
            <div key={row.id} className="px-4 py-2.5 text-[10px] flex items-center gap-3 text-theme-muted">
              <RankBadge rank={idx + 1} />
              <span className="font-semibold text-theme-text flex-1 truncate">{row.name}</span>
              <span className="tabular-nums shrink-0">
                <span className="text-theme-cyan font-bold">{(row.npv10 / 1e6).toFixed(1)}</span>
                <span className="mx-1 opacity-40">|</span>
                <span className="text-theme-lavender font-bold">{row.roi.toFixed(2)}x</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EconomicsDriversPanel;
