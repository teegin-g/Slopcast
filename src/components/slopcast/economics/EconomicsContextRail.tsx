import React from 'react';
import type { DealMetrics, MonthlyCashFlow, Scenario, Well, WellGroup } from '../../../types';
import { currency, currencyMm, getGroupWells, monthsToYears, percent } from './derived';
import { MetricTile, ModulePanel } from './EconomicsPrimitives';

interface EconomicsContextRailProps {
  activeGroup: WellGroup;
  wells: Well[];
  activeScenario: Scenario;
  aggregateMetrics: DealMetrics;
  aggregateFlow: MonthlyCashFlow[];
  breakevenOilPrice?: number | null;
}

const miniPath = (values: number[]) => {
  if (values.length < 2) return '';
  const sampled = values.filter((_, idx) => idx % 6 === 0);
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;
  return sampled.map((value, idx) => {
    const x = (idx / Math.max(1, sampled.length - 1)) * 100;
    const y = 34 - ((value - min) / range) * 30;
    return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
};

const EconomicsContextRail: React.FC<EconomicsContextRailProps> = ({
  activeGroup,
  wells,
  activeScenario,
  aggregateMetrics,
  aggregateFlow,
  breakevenOilPrice,
}) => {
  const groupWells = getGroupWells(activeGroup, wells);
  const statusCounts = groupWells.reduce<Record<string, number>>((acc, well) => {
    acc[well.status] = (acc[well.status] ?? 0) + 1;
    return acc;
  }, {});
  const path = miniPath(aggregateFlow.map((row) => row.cumulativeCashFlow));
  const npvDelta = aggregateMetrics.totalCapex > 0 ? (aggregateMetrics.npv10 / aggregateMetrics.totalCapex) * 100 : 0;

  return (
    <aside className="space-y-3 lg:sticky lg:top-4">
      <ModulePanel accent="cyan" className="bg-theme-surface1/70" bodyClassName="p-4 space-y-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-theme-muted">Asset</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-theme-border" style={{ backgroundColor: activeGroup.color }} />
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-theme-text truncate">{activeGroup.name}</h2>
          </div>
          <p className="mt-1 text-[10px] text-theme-muted">{groupWells.length} wells in active group</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['PRODUCING', 'DUC', 'PERMIT'] as const).map((status) => (
            <div key={status} className="rounded-inner border border-theme-border bg-theme-bg px-2 py-2">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-theme-muted">{status}</p>
              <p className="text-lg font-black text-theme-text">{statusCounts[status] ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="rounded-inner border border-theme-border bg-theme-bg p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted">Scenario</p>
              <p className="mt-1 text-xs font-black text-theme-cyan truncate">{activeScenario.name}</p>
            </div>
            <span className="rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] bg-theme-cyan/10 text-theme-cyan border border-theme-cyan/25">
              Live
            </span>
          </div>
        </div>
      </ModulePanel>

      <ModulePanel accent="green" title="Economic Pulse" bodyClassName="p-3 space-y-2">
        <MetricTile label="NPV10" value={currencyMm(aggregateMetrics.npv10)} detail={`${percent(npvDelta)} of CAPEX`} accent="green" compact />
        <MetricTile label="Payout" value={aggregateMetrics.payoutMonths > 0 ? `${monthsToYears(aggregateMetrics.payoutMonths).toFixed(1)} yrs` : '-'} detail="Undiscounted" accent="cyan" compact />
        <MetricTile label="Breakeven WTI" value={breakevenOilPrice != null ? currency(breakevenOilPrice, 1) : 'N/A'} detail="per bbl" accent="violet" compact />
        <div className="rounded-inner border border-theme-border bg-theme-bg p-3">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted">
            <span>Cash pulse</span>
            <span>{aggregateFlow.length} mo</span>
          </div>
          <svg viewBox="0 0 100 36" className="mt-2 h-12 w-full text-theme-cyan" preserveAspectRatio="none">
            <path d={path} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.85" />
          </svg>
        </div>
      </ModulePanel>
    </aside>
  );
};

export default EconomicsContextRail;
