import React, { useEffect, useMemo, useState } from 'react';

export type DriverFamilyId = 'oil' | 'capex' | 'eur' | 'rig';

interface DriverShockSummary {
  label: string;
  deltaNpv: number;
}

interface DriverInsight {
  id: DriverFamilyId;
  label: string;
  dominantDelta: number;
  upShock?: DriverShockSummary;
  downShock?: DriverShockSummary;
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
  totalCapex: number;
  payoutMonths: number;
  wellCount: number;
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
  onJumpToDriver?: (driverId: DriverFamilyId) => void;
}

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => (
  <span className="w-5 h-5 rounded-full bg-theme-surface2 border border-theme-border text-[9px] font-black text-theme-text flex items-center justify-center shrink-0">
    {rank}
  </span>
);

const formatDeltaMm = (deltaNpv: number) => {
  const abs = Math.abs(deltaNpv) / 1e6;
  const sign = deltaNpv >= 0 ? '+' : '−';
  return `${sign}$${abs.toFixed(1)} MM`;
};

const formatNpvMm = (npv10: number) => `$${(npv10 / 1e6).toFixed(1)} MM`;

const formatDeltaClass = (deltaNpv: number) => (deltaNpv >= 0 ? 'text-theme-cyan' : 'text-theme-magenta');

const EconomicsDriversPanel: React.FC<EconomicsDriversPanelProps> = ({
  isClassic,
  topDrivers,
  biggestPositive,
  biggestNegative,
  breakevenOilPrice,
  payoutMonths,
  fastestPayoutScenarioName,
  scenarioRankings,
  onJumpToDriver,
}) => {
  const maxAbs = useMemo(
    () => topDrivers.reduce((m, d) => Math.max(m, Math.abs(d.dominantDelta)), 0),
    [topDrivers]
  );

  const [selectedDriverId, setSelectedDriverId] = useState<DriverFamilyId | null>(() => topDrivers[0]?.id ?? null);

  useEffect(() => {
    if (!topDrivers.length) {
      setSelectedDriverId(null);
      return;
    }
    if (!selectedDriverId || !topDrivers.some(d => d.id === selectedDriverId)) {
      setSelectedDriverId(topDrivers[0].id);
    }
  }, [selectedDriverId, topDrivers]);

  const selectedDriver = useMemo(
    () => topDrivers.find(d => d.id === selectedDriverId) ?? null,
    [selectedDriverId, topDrivers]
  );

  const narrative = useMemo(() => {
    const byId: Record<DriverFamilyId, { why: string; cta: string }> = {
      oil: {
        why: 'Oil price flows through revenue on every barrel. A small change compounds across the entire program.',
        cta: 'Edit Pricing',
      },
      rig: {
        why: 'Development pace changes timing. Faster or slower drilling shifts discounted cash flow and payout.',
        cta: 'Edit Schedule',
      },
      capex: {
        why: 'CAPEX intensity shifts upfront spend and payout. Capital efficiency strongly drives NPV and ROI.',
        cta: 'Edit CAPEX',
      },
      eur: {
        why: 'Production yield changes recovered volumes, affecting revenue and operating costs over time.',
        cta: 'Edit Decline Profile',
      },
    };

    return selectedDriver ? byId[selectedDriver.id] : null;
  }, [selectedDriver]);

  const focusRing = isClassic
    ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-theme-warning focus-visible:outline-offset-2'
    : 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-theme-cyan focus-visible:outline-offset-2';

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition p-4 space-y-6'
          : 'rounded-panel border shadow-card p-5 theme-transition bg-theme-surface1/70 border-theme-border space-y-6'
      }
    >
      {/* Key drivers - list surface (selectable rows) */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={isClassic ? 'text-sm font-black text-white' : 'text-sm font-semibold text-theme-text'}>
            Key sensitivity drivers
          </h3>
          <p className={`text-[10px] ${isClassic ? 'text-white/60' : 'text-theme-muted'}`}>
            Select a driver to see details.
          </p>
        </div>

        <div
          className={
            isClassic
              ? 'rounded-inner border-2 border-black/25 bg-black/10 p-1'
              : 'rounded-inner border border-theme-border/60 bg-theme-bg/40 p-1'
          }
        >
          <div className="space-y-1">
            {topDrivers.map((driver) => {
              const selected = driver.id === selectedDriverId;
              const pct = maxAbs > 0 ? Math.min(Math.abs(driver.dominantDelta) / maxAbs, 1) * 100 : 0;
              const positive = driver.dominantDelta >= 0;

              return (
                <button
                  key={driver.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedDriverId(driver.id)}
                  className={`w-full rounded-inner px-3 py-2.5 transition-colors ${focusRing} ${
                    selected
                      ? isClassic
                        ? 'bg-black/25'
                        : 'bg-theme-surface2/70'
                      : isClassic
                        ? 'hover:bg-black/15'
                        : 'hover:bg-theme-surface2/40'
                  }`}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-3 items-center">
                    <div className="min-w-0 flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${positive ? 'bg-theme-cyan' : 'bg-theme-magenta'}`}
                      />
                      <span className={`truncate text-[11px] ${isClassic ? 'text-white/90 font-black uppercase tracking-[0.08em]' : 'text-theme-text font-semibold'}`}>
                        {driver.label}
                      </span>
                    </div>

                    <div className={isClassic ? 'h-2 rounded-full bg-black/20 overflow-hidden' : 'h-2 rounded-full bg-theme-surface2 overflow-hidden'}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${positive ? 'bg-theme-cyan' : 'bg-theme-magenta'}`}
                        style={{ width: `${pct}%`, opacity: selected ? 1 : 0.7 }}
                      />
                    </div>

                    <div className={`text-[12px] font-black tabular-nums ${positive ? (isClassic ? 'text-theme-warning' : 'text-theme-cyan') : 'text-theme-magenta'}`}>
                      {formatDeltaMm(driver.dominantDelta)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDriver && narrative && (
          <div
            className={
              isClassic
                ? 'rounded-inner border-2 border-black/25 bg-black/10 p-4'
                : 'rounded-inner border border-theme-border/60 bg-theme-bg/40 p-4'
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                  Driver details
                </p>
                <p className={`text-sm font-black ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                  {selectedDriver.label}
                </p>
              </div>

              {onJumpToDriver && (
                <button
                  type="button"
                  onClick={() => onJumpToDriver(selectedDriver.id)}
                  className={
                    isClassic
                      ? `sc-btnPrimary px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] ${focusRing}`
                      : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] bg-theme-cyan text-theme-bg shadow-glow-cyan ${focusRing}`
                  }
                >
                  {narrative.cta}
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={isClassic ? 'rounded-inner border-2 border-black/25 bg-black/15 p-3' : 'rounded-inner border border-theme-border/50 bg-theme-surface1/60 p-3'}>
                <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-2 ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                  What moved
                </p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className={isClassic ? 'text-white/70' : 'text-theme-muted'}>
                      {selectedDriver.upShock?.label ?? '—'}
                    </span>
                    <span className={`font-black tabular-nums ${formatDeltaClass(selectedDriver.upShock?.deltaNpv ?? 0)}`}>
                      {selectedDriver.upShock ? formatDeltaMm(selectedDriver.upShock.deltaNpv) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className={isClassic ? 'text-white/70' : 'text-theme-muted'}>
                      {selectedDriver.downShock?.label ?? '—'}
                    </span>
                    <span className={`font-black tabular-nums ${formatDeltaClass(selectedDriver.downShock?.deltaNpv ?? 0)}`}>
                      {selectedDriver.downShock ? formatDeltaMm(selectedDriver.downShock.deltaNpv) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={isClassic ? 'rounded-inner border-2 border-black/25 bg-black/15 p-3' : 'rounded-inner border border-theme-border/50 bg-theme-surface1/60 p-3'}>
                <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-2 ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                  Why it matters
                </p>
                <p className={`text-[10px] leading-relaxed ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                  {narrative.why}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className={isClassic ? 'rounded-inner border-2 border-black/25 bg-black/15 p-3' : 'rounded-inner border border-theme-border/50 bg-theme-surface1/60 p-3'}>
                <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-1 ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                  Best case
                </p>
                <p className={`text-sm font-black tabular-nums ${formatDeltaClass(Math.max(selectedDriver.upShock?.deltaNpv ?? 0, selectedDriver.downShock?.deltaNpv ?? 0))}`}>
                  {selectedDriver.upShock && selectedDriver.downShock
                    ? formatDeltaMm(Math.max(selectedDriver.upShock.deltaNpv, selectedDriver.downShock.deltaNpv))
                    : '—'}
                </p>
              </div>
              <div className={isClassic ? 'rounded-inner border-2 border-black/25 bg-black/15 p-3' : 'rounded-inner border border-theme-border/50 bg-theme-surface1/60 p-3'}>
                <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-1 ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                  Worst case
                </p>
                <p className={`text-sm font-black tabular-nums ${formatDeltaClass(Math.min(selectedDriver.upShock?.deltaNpv ?? 0, selectedDriver.downShock?.deltaNpv ?? 0))}`}>
                  {selectedDriver.upShock && selectedDriver.downShock
                    ? formatDeltaMm(Math.min(selectedDriver.upShock.deltaNpv, selectedDriver.downShock.deltaNpv))
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upside / Downside - asymmetric with color tints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-inner border p-4 border-theme-border bg-theme-cyan/5 theme-transition">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-cyan mb-1">Biggest Upside</p>
          <p className="text-[10px] text-theme-muted mb-2">{biggestPositive?.label || '—'}</p>
          <p className="text-xl font-black text-theme-cyan leading-none tabular-nums">
            {biggestPositive ? formatDeltaMm(biggestPositive.deltaNpv) : '—'}
          </p>
        </div>
        <div className="rounded-inner border p-4 border-theme-border bg-theme-magenta/5 theme-transition">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-magenta mb-1">Biggest Downside</p>
          <p className="text-[10px] text-theme-muted mb-2">{biggestNegative?.label || '—'}</p>
          <p className="text-xl font-black text-theme-magenta leading-none tabular-nums">
            {biggestNegative ? formatDeltaMm(biggestNegative.deltaNpv) : '—'}
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
                <span className="text-theme-cyan font-bold">{formatNpvMm(row.npv10)}</span>
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
