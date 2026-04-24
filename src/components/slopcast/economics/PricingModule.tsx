import React from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { currency, currencyMm, summarizePricing } from './derived';
import { AssumptionTable, InsightBanner, MetricTile, ModulePanel, StableChart } from './EconomicsPrimitives';
import type { EconomicsModuleProps } from './types';

const PricingModule: React.FC<EconomicsModuleProps> = ({
  activeGroup,
  activeScenario,
  baseScenario,
}) => {
  const flow = activeGroup.flow ?? [];
  const summary = summarizePricing(activeScenario, flow);
  const base = summarizePricing(baseScenario, flow);
  const chartData = flow.map((row) => ({
    month: row.month,
    oil: summary.realized.oil,
    gas: summary.realized.gas,
    revenuePerBoe: row.oilProduction > 0 ? row.revenue / row.oilProduction : 0,
  }));
  const oilDelta = summary.realized.oil - base.realized.oil;
  const gasDelta = summary.realized.gas - base.realized.gas;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricTile label="Oil Net Price" value={currency(summary.realized.oil)} detail={`${oilDelta >= 0 ? '+' : ''}${currency(oilDelta)} vs base`} accent="green" />
            <MetricTile label="Gas Net Price" value={currency(summary.realized.gas)} detail={`${gasDelta >= 0 ? '+' : ''}${currency(gasDelta)} vs base`} accent="green" />
            <MetricTile label="Revenue" value={currencyMm(summary.totalRevenue)} detail={`${currency(summary.revenuePerBoe)} / oil bbl`} accent="cyan" />
          </div>

          <ModulePanel accent="green" title="Realized Net Price" bodyClassName="p-4">
            <StableChart className="h-[300px]" deps={[chartData.length, activeScenario.id]}>
              {({ width, height }) => (
                <LineChart width={width} height={height} data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgb(var(--border) / 0.35)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={(value) => (value % 24 === 0 ? `${value / 12}Y` : '')} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))', borderRadius: 8, color: 'rgb(var(--text))' }} formatter={(value: number) => currency(value)} />
                  <Line type="monotone" dataKey="revenuePerBoe" name="Revenue / bbl" stroke="#34d399" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="oil" name="Oil net" stroke="#22d3ee" strokeWidth={2} dot={false} strokeDasharray="6 4" />
                </LineChart>
              )}
            </StableChart>
          </ModulePanel>
        </div>

        <div className="space-y-4">
          <ModulePanel accent="green" title="Price Assumptions" bodyClassName="p-4">
            <AssumptionTable
              accent="green"
              columns={['Commodity', 'Benchmark', 'Diff', 'Net']}
              rows={[
                ['Oil', currency(activeScenario.pricing.oilPrice), `(${currency(activeScenario.pricing.oilDifferential)})`, currency(summary.realized.oil)],
                ['Gas', currency(activeScenario.pricing.gasPrice), `(${currency(activeScenario.pricing.gasDifferential)})`, currency(summary.realized.gas)],
                ['NGL', 'Not modeled', '-', '-'],
              ]}
            />
          </ModulePanel>

          <ModulePanel accent="green" title="Price Deck" bodyClassName="p-4 space-y-3">
            <div className="rounded-inner border border-theme-border bg-theme-bg p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-theme-muted">Deck source</p>
              <p className="mt-1 text-sm font-black text-theme-text">{activeScenario.name}</p>
              <p className="mt-1 text-[10px] text-theme-muted">Scenario pricing is the v1 price deck source.</p>
            </div>
            <div className="rounded-inner border border-theme-border bg-theme-bg p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-theme-muted">Effective Date</p>
              <p className="mt-1 text-xs font-semibold text-theme-text">{activeScenario.schedule.rigStartDate}</p>
            </div>
          </ModulePanel>
        </div>
      </div>

      <ModulePanel accent="green" title="Price Drivers Impact" bodyClassName="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <MetricTile label="Oil Differential" value={currency(activeScenario.pricing.oilDifferential)} detail="deducted from benchmark" accent="green" compact />
          <MetricTile label="Gas Differential" value={currency(activeScenario.pricing.gasDifferential)} detail="deducted from benchmark" accent="green" compact />
          <MetricTile label="Oil Volume" value={`${(summary.oilVolume / 1e3).toFixed(0)} Mbbl`} detail="pricing exposure" accent="cyan" compact />
          <MetricTile label="Gas Volume" value={`${(summary.gasVolume / 1e3).toFixed(0)} Mmcf`} detail="derived from GOR" accent="violet" compact />
        </div>
      </ModulePanel>

      <InsightBanner accent="green">
        Pricing uses scenario-level oil and gas assumptions. NGL pricing is intentionally not shown until Slopcast has a modeled NGL stream.
      </InsightBanner>
    </div>
  );
};

export default PricingModule;
