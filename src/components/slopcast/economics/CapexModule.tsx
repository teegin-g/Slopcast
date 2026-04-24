import React from 'react';
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Tooltip, XAxis, YAxis } from 'recharts';
import CapexControls from '../../CapexControls';
import { currency, currencyMm, monthsToYears, summarizeCapex } from './derived';
import { AssumptionTable, InsightBanner, MetricTile, ModulePanel, StableChart } from './EconomicsPrimitives';
import type { EconomicsModuleProps } from './types';

const CapexModule: React.FC<EconomicsModuleProps> = ({
  activeGroup,
  wells,
  onUpdateGroup,
  onMarkDirty,
}) => {
  const summary = summarizeCapex(activeGroup, wells);
  const flow = activeGroup.flow ?? [];
  const metrics = activeGroup.metrics;
  const payoutYears = monthsToYears(metrics?.payoutMonths ?? 0);
  const capexToRevenue = flow.reduce((sum, row) => sum + row.revenue, 0) > 0
    ? ((metrics?.totalCapex ?? 0) / flow.reduce((sum, row) => sum + row.revenue, 0)) * 100
    : 0;
  const cashFlow = flow.map((row) => ({ month: row.month, cumulativeCashFlow: row.cumulativeCashFlow, netCashFlow: row.netCashFlow }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_360px] gap-4">
        <ModulePanel accent="violet" title="CAPEX Summary" bodyClassName="p-4 space-y-3">
          <MetricTile label="Total CAPEX" value={currencyMm(metrics?.totalCapex ?? summary.total)} detail={`${currency(summary.representativeLateral, 0)} ft lateral basis`} accent="violet" />
          <AssumptionTable
            accent="violet"
            columns={['Category', 'Cost']}
            rows={summary.categories.map((row) => [row.category, currencyMm(row.total)])}
          />
        </ModulePanel>

        <ModulePanel accent="violet" title="CAPEX Timing" bodyClassName="p-4">
          <StableChart className="h-72" deps={[summary.timing.length, activeGroup.id]}>
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={summary.timing} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--border) / 0.35)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="offsetDays" tickFormatter={(value) => `${value}d`} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `$${(Number(value) / 1e6).toFixed(0)}M`} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => currencyMm(value)} contentStyle={{ background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
                <Area type="stepAfter" dataKey="cumulative" stroke="#a78bfa" fill="#8b5cf633" strokeWidth={3} />
              </AreaChart>
            )}
          </StableChart>
        </ModulePanel>

        <ModulePanel accent="violet" title="Payout Analysis" bodyClassName="p-4 space-y-3">
          <MetricTile label="Payout" value={payoutYears > 0 ? `${payoutYears.toFixed(1)} yrs` : '-'} detail="undiscounted" accent="green" />
          <StableChart className="h-44" deps={[cashFlow.length, activeGroup.id]}>
            {({ width, height }) => (
              <ComposedChart width={width} height={height} data={cashFlow} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--border) / 0.35)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tickFormatter={(value) => (value % 24 === 0 ? `${value / 12}Y` : '')} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `$${(Number(value) / 1e6).toFixed(0)}M`} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => currencyMm(value)} contentStyle={{ background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="netCashFlow" fill="#8b5cf655" barSize={2} />
                <Area dataKey="cumulativeCashFlow" stroke="#a78bfa" fill="#8b5cf622" strokeWidth={2} />
              </ComposedChart>
            )}
          </StableChart>
        </ModulePanel>
      </div>

      <ModulePanel accent="violet" title="CAPEX Logic" bodyClassName="p-4">
        <CapexControls
          capex={activeGroup.capex}
          onChange={(capex) => {
            onUpdateGroup({ ...activeGroup, capex });
            onMarkDirty();
          }}
        />
      </ModulePanel>

      <ModulePanel accent="violet" title="CAPEX Impact" bodyClassName="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricTile label="PV-10 Impact" value={currencyMm(metrics?.npv10 ?? 0)} detail="current active economics" accent="violet" compact />
          <MetricTile label="% Revenue" value={`${capexToRevenue.toFixed(1)}%`} detail="capital intensity" accent="cyan" compact />
          <MetricTile label="Line Items" value={String(activeGroup.capex.items.length)} detail="capital ledger" accent="green" compact />
        </div>
      </ModulePanel>

      <InsightBanner accent="violet">
        CAPEX timing uses line-item offsets from rig start. Capital phases are represented by categories until Slopcast adds explicit drill / complete / tie-in phase entities.
      </InsightBanner>
    </div>
  );
};

export default CapexModule;
