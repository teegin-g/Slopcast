import React from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import TaxControls from '../../TaxControls';
import { DEFAULT_TAX_ASSUMPTIONS } from '../../../types';
import { currencyMm, summarizeTaxes } from './derived';
import { AssumptionTable, InsightBanner, MetricTile, ModulePanel, StableChart } from './EconomicsPrimitives';
import type { EconomicsModuleProps } from './types';

const TaxesModule: React.FC<EconomicsModuleProps> = ({
  isClassic,
  activeGroup,
  onUpdateGroup,
  onMarkDirty,
}) => {
  const tax = activeGroup.taxAssumptions ?? DEFAULT_TAX_ASSUMPTIONS;
  const summary = summarizeTaxes(activeGroup, tax);
  const impact = summary.taxedFlow.map((row) => ({
    month: row.month,
    afterTax: row.afterTaxCashFlow ?? row.netCashFlow,
    cumulativeAfterTax: row.cumulativeAfterTaxCashFlow ?? row.cumulativeCashFlow,
  }));
  const severanceShare = summary.totalTax > 0 ? (summary.totalSeverance / summary.totalTax) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_320px] gap-4">
        <div className="space-y-4">
          <MetricTile label="Total Tax" value={currencyMm(summary.totalTax)} detail={`${summary.effectiveRate.toFixed(1)}% of revenue`} accent="red" />
          <MetricTile label="Effective Rate" value={`${summary.effectiveRate.toFixed(1)}%`} detail={`Statutory ${tax.federalTaxRate + tax.stateTaxRate}%`} accent="red" />
        </div>

        <ModulePanel accent="red" title="Tax Assumptions" bodyClassName="p-4">
          <TaxControls
            isClassic={isClassic}
            tax={tax}
            onChange={(next) => {
              onUpdateGroup({ ...activeGroup, taxAssumptions: next });
              onMarkDirty();
            }}
          />
        </ModulePanel>

        <ModulePanel accent="red" title="Tax Impact" bodyClassName="p-4">
          <StableChart className="h-56" deps={[impact.length, activeGroup.id]}>
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={impact} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgb(var(--border) / 0.35)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tickFormatter={(value) => (value % 24 === 0 ? `${value / 12}Y` : '')} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => `$${(Number(value) / 1e6).toFixed(0)}M`} tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => currencyMm(value)} contentStyle={{ background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
                <Area dataKey="cumulativeAfterTax" stroke="#f87171" fill="#ef444433" strokeWidth={3} />
              </AreaChart>
            )}
          </StableChart>
        </ModulePanel>
      </div>

      <ModulePanel accent="red" title="Impact by Tax Type" bodyClassName="p-4">
        <AssumptionTable
          accent="red"
          columns={['Tax Type', 'Basis', 'PV-10 Impact']}
          rows={[
            ['Severance', `${tax.severanceTaxPct.toFixed(2)}% gross`, `(${currencyMm(summary.totalSeverance)})`],
            ['Ad Valorem', `${tax.adValoremTaxPct.toFixed(2)}% capex proxy`, `(${currencyMm(summary.totalAdValorem)})`],
            ['Income Tax', `${(tax.federalTaxRate + tax.stateTaxRate).toFixed(2)}% taxable`, `(${currencyMm(summary.totalIncome)})`],
          ]}
        />
      </ModulePanel>

      <InsightBanner accent="red">
        Severance taxes represent {severanceShare.toFixed(0)}% of the modeled tax burden. This view shows an after-tax overlay without changing the engine’s pre-tax base case.
      </InsightBanner>
    </div>
  );
};

export default TaxesModule;
