import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import OpexControls from '../../OpexControls';
import { currency, currencyMm, estimateSegmentAnnualizedCost, summarizeOpex } from './derived';
import { AssumptionTable, InsightBanner, MetricTile, ModulePanel, StableChart } from './EconomicsPrimitives';
import type { EconomicsModuleProps } from './types';

const OpexModule: React.FC<EconomicsModuleProps> = ({
  activeGroup,
  onUpdateGroup,
  onMarkDirty,
}) => {
  const summary = summarizeOpex(activeGroup);
  const wellCount = Math.max(1, activeGroup.wellIds.size);
  const structure = summary.segments.map((segment, index) => ({
    name: segment.label,
    value: estimateSegmentAnnualizedCost(segment, wellCount),
    color: ['#f59e0b', '#22d3ee', '#34d399', '#a78bfa'][index % 4],
  }));
  const impact = summary.flow
    .filter((_, index) => index % 12 === 0)
    .map((row) => ({ year: `${Math.floor(row.month / 12)}Y`, opex: row.opex }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ModulePanel accent="amber" title="OPEX Structure" bodyClassName="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-4 items-center">
            <StableChart className="h-44" deps={[structure.length, activeGroup.id]}>
              {({ width, height }) => (
                <PieChart width={width} height={height}>
                  <Pie data={structure} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={74} strokeWidth={1} stroke="rgb(var(--border))">
                    {structure.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => currencyMm(value)} contentStyle={{ background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
                </PieChart>
              )}
            </StableChart>
            <div className="space-y-2">
              <MetricTile label="Total LOE" value={currencyMm(summary.totalOpex)} detail={`${currency(summary.loePerBoe)} / bbl`} accent="amber" compact />
              {structure.map((row) => (
                <div key={row.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                  <span className="text-theme-muted truncate">{row.name}</span>
                  <span className="ml-auto font-semibold text-theme-text tabular-nums">{currencyMm(row.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ModulePanel>

        <ModulePanel accent="amber" title="OPEX Impact" bodyClassName="p-4">
          <StableChart className="h-64" deps={[impact.length, activeGroup.id]}>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={impact} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--border) / 0.35)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => currencyMm(value)} contentStyle={{ background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="opex" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </StableChart>
        </ModulePanel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4">
        <ModulePanel accent="amber" title="OPEX Assumptions" bodyClassName="p-4">
          <OpexControls
            opex={activeGroup.opex}
            onChange={(opex) => {
              onUpdateGroup({ ...activeGroup, opex });
              onMarkDirty();
            }}
          />
        </ModulePanel>

        <ModulePanel accent="amber" title="Field Costs" bodyClassName="p-4">
          <AssumptionTable
            accent="amber"
            columns={['Item', 'Monthly', 'Oil Var']}
            rows={summary.segments.map((segment) => [
              segment.label,
              currency(segment.fixedPerWellPerMonth, 0),
              `${currency(segment.variableOilPerBbl)} / bbl`,
            ])}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MetricTile label="Variable Gas" value={currency(summary.variableGas)} detail="$/mcf total schedule" accent="amber" compact />
            <MetricTile label="OPEX / CAPEX" value={`${summary.opexToCapexPct.toFixed(1)}%`} detail="10-year ratio" accent="violet" compact />
          </div>
        </ModulePanel>
      </div>

      <InsightBanner accent="amber">
        Fixed field costs currently carry the OPEX structure. Segment hover and category cross-highlighting can build on this once Slopcast supports richer cost categories.
      </InsightBanner>
    </div>
  );
};

export default OpexModule;
