import React from 'react';
import type { WellGroup } from '../../../../types';

export interface AssumptionsTabProps {
  group: WellGroup;
  isClassic: boolean;
}

/** Mirrors the AssumptionRow style from GroupInspector: label left muted, value right semibold tabular. */
const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-theme-border/40 last:border-0">
    <span className="text-[11px] text-theme-muted">{k}</span>
    <span className="text-[11px] text-theme-text font-semibold tabular-nums">{v}</span>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-theme-muted mb-1 mt-3 first:mt-0">
    {children}
  </p>
);

/** Format an ownership fraction (0..1) as a percentage string, e.g. 0.75 → "75.0%". */
function fractionToPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

/** Format a decline rate already stored in percent-scale, e.g. 65 → "65%". */
function declinePct(v: number): string {
  return `${v.toFixed(0)}%`;
}

function fmtMoney(v: number): string {
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}MM`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/**
 * AssumptionsTab — group-mode dock tab: read-only parameter summary.
 *
 * Displays type curve (qi, b, Di, terminal decline, GOR), CAPEX total,
 * OPEX fixed rate, and ownership NRI. Dense, dock-appropriate, no chart.
 * Mirrors the AssumptionRow style from GroupInspector.
 */
const AssumptionsTab: React.FC<AssumptionsTabProps> = ({ group, isClassic: _isClassic }) => {
  const tc = group.typeCurve;
  const capexTotal = group.capex.items.reduce((sum, item) => sum + item.value, 0);
  const opexFixed = group.opex.segments[0]?.fixedPerWellPerMonth ?? 0;
  const nri = group.ownership.baseNri;

  return (
    <div className="py-2 px-3">
      <SectionLabel>Type Curve</SectionLabel>
      <div className="rounded-inner border border-theme-border/60 bg-theme-bg/50 px-3">
        <Row k="Qi (initial rate)" v={`${tc.qi.toLocaleString()} bopd`} />
        <Row k="b-factor" v={tc.b.toFixed(2)} />
        <Row k="Initial decline (Di)" v={declinePct(tc.di)} />
        <Row k="Terminal decline" v={declinePct(tc.terminalDecline)} />
        <Row k="GOR" v={`${tc.gorMcfPerBbl.toFixed(2)} mcf/bbl`} />
      </div>

      <SectionLabel>CAPEX</SectionLabel>
      <div className="rounded-inner border border-theme-border/60 bg-theme-bg/50 px-3">
        <Row k="AFE total" v={fmtMoney(capexTotal)} />
        <Row k="Line items" v={`${group.capex.items.length}`} />
      </div>

      <SectionLabel>OPEX</SectionLabel>
      <div className="rounded-inner border border-theme-border/60 bg-theme-bg/50 px-3">
        <Row k="LOE (fixed)" v={`${fmtMoney(opexFixed)}/well/mo`} />
        <Row k="Segments" v={`${group.opex.segments.length}`} />
      </div>

      <SectionLabel>Ownership</SectionLabel>
      <div className="rounded-inner border border-theme-border/60 bg-theme-bg/50 px-3">
        <Row k="Base NRI" v={fractionToPct(nri)} />
        <Row k="Cost interest" v={fractionToPct(group.ownership.baseCostInterest)} />
      </div>
    </div>
  );
};

export default AssumptionsTab;
