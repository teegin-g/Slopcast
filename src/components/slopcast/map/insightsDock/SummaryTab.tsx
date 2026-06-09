import React, { useMemo } from 'react';
import type { Well } from '../../../../types';
import { summarizeGroupWells, STATUS_COLORS, type WellStatus } from '../groupInspectorStats';
import { formatFeet } from '../../../../utils/formatters';

export interface SummaryTabProps {
  wells: Well[];
  isClassic: boolean;
}

// WellsTable is too heavy for this use case: it requires selectedWellIds,
// onSelectWells, and onToggleWell callbacks, and renders a full filterable /
// sortable table. For a read-only selected-wells summary list the coupling
// cost outweighs the reuse benefit, so we render a lightweight inline table.

/**
 * SummaryTab — selection-mode dock tab.
 *
 * Shows a compact list of lasso-selected wells (name, operator, formation,
 * lateral length, status) and a handful of aggregate stats (total, avg
 * lateral, status mix). Presentational — props in, no callbacks out.
 */
const SummaryTab: React.FC<SummaryTabProps> = ({ wells, isClassic: _isClassic }) => {
  const summary = useMemo(() => summarizeGroupWells(wells), [wells]);

  if (wells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[120px] py-8 text-center px-4">
        <p className="text-[11px] font-semibold text-theme-muted leading-relaxed">
          Lasso wells to compare a custom selection
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-2 px-3">
      {/* Count header */}
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-cyan heading-font">
        {wells.length} well{wells.length !== 1 ? 's' : ''} selected
      </p>

      {/* Aggregate stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-inner border border-theme-border bg-theme-surface2/30 px-2 py-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted">Total</p>
          <p className="text-sm font-black text-theme-text tabular-nums mt-0.5">{summary.total}</p>
        </div>
        <div className="rounded-inner border border-theme-border bg-theme-surface2/30 px-2 py-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted">Avg Lateral</p>
          <p className="text-sm font-black text-theme-text tabular-nums mt-0.5">
            {summary.avgLateralFt > 0 ? formatFeet(summary.avgLateralFt) : '—'}
          </p>
        </div>
        <div className="rounded-inner border border-theme-border bg-theme-surface2/30 px-2 py-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted">Status Mix</p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {summary.slices.reduce<React.ReactElement[]>((acc, s) => {
              if (s.count > 0) {
                acc.push(
                  <span
                    key={s.status}
                    className="text-[9px] font-semibold tabular-nums"
                    style={{ color: s.color }}
                  >
                    {s.count} {s.label}
                  </span>,
                );
              }
              return acc;
            }, [])}
          </div>
        </div>
      </div>

      {/* Well list table */}
      <div className="rounded-inner border border-theme-border overflow-hidden">
        <div className="overflow-auto max-h-[220px]">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 z-10 bg-theme-surface1 border-b border-theme-border">
              <tr>
                {['Well', 'Operator', 'Formation', 'Lateral', 'Status'].map((col) => (
                  <th
                    key={col}
                    className="py-1.5 px-2 text-left font-black uppercase tracking-[0.18em] text-theme-cyan heading-font text-[9px] whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-theme-text">
              {wells.map((well, i) => (
                <tr
                  key={well.id}
                  className={[
                    'border-b border-theme-border/40 hover:bg-theme-surface2/20 transition-colors',
                    i % 2 === 0 ? '' : 'bg-theme-surface2/10',
                  ].join(' ')}
                >
                  <td className="py-1 px-2 font-semibold truncate max-w-[120px]" title={well.name}>
                    {well.name}
                  </td>
                  <td className="py-1 px-2 truncate max-w-[100px] text-theme-muted" title={well.operator}>
                    {well.operator}
                  </td>
                  <td className="py-1 px-2 truncate max-w-[90px] text-theme-muted" title={well.formation}>
                    {well.formation}
                  </td>
                  <td className="py-1 px-2 tabular-nums text-theme-muted whitespace-nowrap">
                    {formatFeet(well.lateralLength)}
                  </td>
                  <td className="py-1 px-2 whitespace-nowrap">
                    <StatusBadge status={well.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Internal status badge ────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className="text-[9px] font-black uppercase tracking-[0.12em]"
    style={{ color: STATUS_COLORS[status as WellStatus] ?? 'currentColor' }}
  >
    {status}
  </span>
);

export default SummaryTab;
