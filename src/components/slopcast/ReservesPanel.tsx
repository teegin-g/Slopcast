import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { WellGroup, ReserveCategory, DEFAULT_RESERVE_RISK_FACTORS } from '../../types';

interface ReservesPanelProps {
  isClassic: boolean;
  groups: WellGroup[];
}

const CATEGORY_COLORS: Record<ReserveCategory, string> = {
  PDP: '#3b82f6',
  PUD: '#E566DA',
  PROBABLE: '#DBA1DD',
  POSSIBLE: '#475569',
};

const CATEGORY_ORDER: ReserveCategory[] = ['PDP', 'PUD', 'PROBABLE', 'POSSIBLE'];

interface CategoryRollup {
  category: ReserveCategory;
  wells: number;
  grossEur: number;
  riskedEur: number;
  riskedNpv: number;
}

const formatMboe = (boe: number): string => `${(boe / 1000).toFixed(1)}`;
const formatMm = (value: number): string => `$${(value / 1e6).toFixed(1)}MM`;

const ReservesPanel: React.FC<ReservesPanelProps> = ({ isClassic, groups }) => {
  const rollups = useMemo(() => {
    const map = new Map<ReserveCategory, CategoryRollup>();

    for (const cat of CATEGORY_ORDER) {
      map.set(cat, { category: cat, wells: 0, grossEur: 0, riskedEur: 0, riskedNpv: 0 });
    }

    for (const group of groups) {
      const cat = group.reserveCategory ?? 'PDP';
      const entry = map.get(cat)!;
      const riskFactor = DEFAULT_RESERVE_RISK_FACTORS[cat];
      const wellCount = group.wellIds.size;
      const eur = group.metrics?.eur ?? 0;
      const npv10 = group.metrics?.npv10 ?? 0;

      entry.wells += wellCount;
      entry.grossEur += eur;
      entry.riskedEur += eur * riskFactor;
      entry.riskedNpv += npv10 * riskFactor;
    }

    return CATEGORY_ORDER.map(cat => map.get(cat)!).filter(r => r.wells > 0);
  }, [groups]);

  const totals = useMemo(() => {
    return rollups.reduce(
      (acc, r) => ({
        wells: acc.wells + r.wells,
        grossEur: acc.grossEur + r.grossEur,
        riskedEur: acc.riskedEur + r.riskedEur,
        riskedNpv: acc.riskedNpv + r.riskedNpv,
      }),
      { wells: 0, grossEur: 0, riskedEur: 0, riskedNpv: 0 }
    );
  }, [rollups]);

  const pieData = useMemo(
    () => rollups.map(r => ({ name: r.category, value: r.grossEur })),
    [rollups]
  );

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition overflow-hidden'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
      }
    >
      {/* Title bar */}
      <div
        className={
          isClassic
            ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex items-center justify-between'
            : 'px-4 py-3 border-b border-theme-border/60 flex items-center justify-between'
        }
      >
        <h3
          className={
            isClassic
              ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white'
              : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'
          }
        >
          Reserves Classification
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-theme-muted">
                <th className="text-left py-1.5 pr-3 font-bold uppercase tracking-[0.12em]">Category</th>
                <th className="text-right py-1.5 px-3 font-bold uppercase tracking-[0.12em]">Wells</th>
                <th className="text-right py-1.5 px-3 font-bold uppercase tracking-[0.12em]">Gross EUR</th>
                <th className="text-right py-1.5 px-3 font-bold uppercase tracking-[0.12em]">Risked EUR</th>
                <th className="text-right py-1.5 pl-3 font-bold uppercase tracking-[0.12em]">Risked NPV</th>
              </tr>
            </thead>
            <tbody className="text-theme-text">
              {rollups.map(row => (
                <tr
                  key={row.category}
                  className={
                    isClassic
                      ? 'border-t border-black/20'
                      : 'border-t border-theme-border/30'
                  }
                >
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[row.category] }}
                      />
                      <span className="font-bold">{row.category}</span>
                    </div>
                  </td>
                  <td className="text-right py-2 px-3 tabular-nums">{row.wells}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{formatMboe(row.grossEur)} MBOE</td>
                  <td className="text-right py-2 px-3 tabular-nums">{formatMboe(row.riskedEur)} MBOE</td>
                  <td className="text-right py-2 pl-3 tabular-nums">{formatMm(row.riskedNpv)}</td>
                </tr>
              ))}
              {/* Totals row */}
              <tr
                className={
                  isClassic
                    ? 'border-t-2 border-white/20'
                    : 'border-t-2 border-theme-border/60'
                }
              >
                <td className="py-2 pr-3 font-black">Total</td>
                <td className="text-right py-2 px-3 tabular-nums font-black">{totals.wells}</td>
                <td className="text-right py-2 px-3 tabular-nums font-black">{formatMboe(totals.grossEur)} MBOE</td>
                <td className="text-right py-2 px-3 tabular-nums font-black">{formatMboe(totals.riskedEur)} MBOE</td>
                <td className="text-right py-2 pl-3 tabular-nums font-black">{formatMm(totals.riskedNpv)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pie chart - EUR split by category */}
        {pieData.length > 0 && (
          <div
            className={
              isClassic
                ? 'rounded-inner border-2 border-black/25 bg-black/10 p-3'
                : 'rounded-inner border border-theme-border/60 bg-theme-bg/40 p-3'
            }
          >
            <p
              className={`text-[9px] font-black uppercase tracking-[0.18em] mb-2 ${
                isClassic ? 'text-white/70' : 'text-theme-muted'
              }`}
            >
              EUR by Reserve Category
            </p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="70%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name as ReserveCategory]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2">
              {pieData.map(entry => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[entry.name as ReserveCategory] }}
                  />
                  <span
                    className={`text-[9px] font-bold ${
                      isClassic ? 'text-white/70' : 'text-theme-muted'
                    }`}
                  >
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservesPanel;
