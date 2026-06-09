import React, { useMemo } from 'react';
import type { Well, WellGroup } from '../../../types';
import KpiTile from '../KpiTile';
import { StatusDonut } from './StatusDonut';
import { summarizeGroupWells } from './groupInspectorStats';

interface GroupInspectorProps {
  group: WellGroup;
  /** The wells belonging to this group. */
  wells: Well[];
  onViewDetails?: () => void;
}

function fmtMoney(v: number): string {
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}MM`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtPayout(months: number): string {
  if (!isFinite(months) || months <= 0) return '—';
  return months >= 24 ? `${(months / 12).toFixed(1)} yr` : `${Math.round(months)} mo`;
}

function fmtIrr(irr?: number): string {
  if (irr === undefined || irr === null || !isFinite(irr)) return '—';
  // Tolerate either fraction (0.38) or already-percent (38) storage.
  const pct = Math.abs(irr) <= 2 ? irr * 100 : irr;
  return `${pct.toFixed(0)}%`;
}

/** Annual decline & NRI may be stored as a fraction (0.65) or a percent (65). */
function asPct(v: number): number {
  return Math.round((Math.abs(v) <= 2 ? v * 100 : v));
}

const AssumptionRow: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-theme-border/40 last:border-0">
    <span className="text-theme-muted">{k}</span>
    <span className="text-theme-text font-semibold tabular-nums">{v}</span>
  </div>
);

/**
 * Right-side inspector for the active group: headline metrics, a well-status
 * donut, and the group's economic assumptions. Presentational — caller passes
 * the group and its wells.
 */
export const GroupInspector: React.FC<GroupInspectorProps> = ({ group, wells, onViewDetails }) => {
  const summary = useMemo(() => summarizeGroupWells(wells), [wells]);
  const m = group.metrics;
  const tc = group.typeCurve;
  const opexFixed = group.opex.segments[0]?.fixedPerWellPerMonth ?? 0;
  const nri = group.ownership.baseNri;

  const tileProps = { bgClass: 'bg-theme-bg/70', valueSizeClass: 'text-sm', labelTrackingClass: 'tracking-[0.1em]' } as const;

  return (
    <div className="flex flex-col gap-3.5" data-testid="group-inspector">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: group.color }} />
            <h3 className="text-theme-text font-bold text-sm truncate">{group.name}</h3>
          </div>
          <p className="text-theme-muted text-[10px] mt-0.5">{summary.total} wells</p>
        </div>
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="text-[10px] font-bold uppercase tracking-widest text-theme-cyan hover:underline shrink-0"
          >
            View details
          </button>
        )}
      </div>

      {m ? (
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="NPV10" value={fmtMoney(m.npv10)} {...tileProps} />
          <KpiTile label="IRR" value={fmtIrr(m.irr)} {...tileProps} />
          <KpiTile label="EUR" value={`${(m.eur / 1e3).toFixed(0)} MBoe`} {...tileProps} />
          <KpiTile label="Payout" value={fmtPayout(m.payoutMonths)} {...tileProps} />
          <KpiTile label="CAPEX" value={fmtMoney(m.totalCapex)} {...tileProps} />
          <KpiTile label="Avg Lateral" value={`${summary.avgLateralFt.toLocaleString()} ft`} {...tileProps} />
        </div>
      ) : (
        <div className="rounded-inner border border-theme-border bg-theme-bg/60 px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-theme-muted">
          No economics yet
        </div>
      )}

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted mb-2">Well status</p>
        <StatusDonut slices={summary.slices} total={summary.total} />
      </div>

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted mb-1">Assumptions</p>
        <div className="text-[11px]">
          <AssumptionRow k="Type curve" v={`qi ${tc.qi} · b ${tc.b} · Di ${asPct(tc.di)}%`} />
          <AssumptionRow k="CAPEX" v={m ? fmtMoney(m.totalCapex) : '—'} />
          <AssumptionRow k="OPEX" v={`${fmtMoney(opexFixed)}/mo`} />
          <AssumptionRow k="Ownership" v={`${asPct(nri)}% NRI`} />
        </div>
      </div>
    </div>
  );
};
