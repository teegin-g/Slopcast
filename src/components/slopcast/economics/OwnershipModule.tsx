import React from 'react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import OwnershipControls from '../../OwnershipControls';
import { currencyMm, percent, summarizeOwnership } from './derived';
import { AssumptionTable, InsightBanner, MetricTile, ModulePanel, StableChart } from './EconomicsPrimitives';
import type { EconomicsModuleProps } from './types';

const OwnershipModule: React.FC<EconomicsModuleProps> = ({
  activeGroup,
  onUpdateGroup,
  onMarkDirty,
}) => {
  const summary = summarizeOwnership(activeGroup);
  const split = [
    { name: 'Net Revenue Interest', value: summary.netRevenueShare, color: '#5eead4' },
    { name: 'Partner / JV', value: summary.partnerShare, color: '#a7f3d0' },
    { name: 'Royalty Burden', value: summary.royaltyBurden, color: '#64748b' },
  ].filter((row) => row.value > 0);
  const reconcile = Math.abs(summary.splitCheck - 1) < 0.005;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_360px] gap-4">
        <ModulePanel accent="mint" title="Party Structure" bodyClassName="p-4">
          <OwnershipControls
            ownership={activeGroup.ownership}
            onChange={(ownership) => {
              onUpdateGroup({ ...activeGroup, ownership });
              onMarkDirty();
            }}
          />
        </ModulePanel>

        <ModulePanel accent="mint" title="Ownership Summary" bodyClassName="p-4">
          <StableChart className="h-56" deps={[split.length, activeGroup.id]}>
            {({ width, height }) => (
              <PieChart width={width} height={height}>
                <Pie data={split} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={86} stroke="rgb(var(--border))" strokeWidth={1}>
                  {split.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => percent(value * 100)} contentStyle={{ background: 'rgb(var(--surface-1))', border: '1px solid rgb(var(--border))', borderRadius: 8 }} />
              </PieChart>
            )}
          </StableChart>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Base NRI" value={percent(summary.baseNri * 100)} detail="gross revenue share" accent="mint" compact />
            <MetricTile label="Cost Interest" value={percent(summary.baseCost * 100)} detail="cost burden share" accent="cyan" compact />
          </div>
        </ModulePanel>
      </div>

      <ModulePanel accent="mint" title="Party Impact" bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <MetricTile label="Operator Net" value={currencyMm(summary.totalRevenue * summary.netRevenueShare)} detail={percent(summary.netRevenueShare * 100)} accent="mint" compact />
          <MetricTile label="Royalty Burden" value={currencyMm(summary.totalRevenue * summary.royaltyBurden)} detail={percent(summary.royaltyBurden * 100)} accent="violet" compact />
          <MetricTile label="Partner / JV" value={currencyMm(summary.totalRevenue * summary.partnerShare)} detail={percent(summary.partnerShare * 100)} accent="cyan" compact />
          <MetricTile label="Split Check" value={percent(summary.splitCheck * 100)} detail={reconcile ? 'reconciled' : 'review'} accent={reconcile ? 'green' : 'red'} compact />
        </div>
      </ModulePanel>

      <ModulePanel accent="mint" title="Revenue Split Check" bodyClassName="p-4">
        <AssumptionTable
          accent="mint"
          columns={['Component', 'Share', 'Revenue']}
          rows={[
            ['Net Revenue Interest', percent(summary.netRevenueShare * 100), currencyMm(summary.totalRevenue * summary.netRevenueShare)],
            ['Partner / JV', percent(summary.partnerShare * 100), currencyMm(summary.totalRevenue * summary.partnerShare)],
            ['Royalty Burden', percent(summary.royaltyBurden * 100), currencyMm(summary.totalRevenue * summary.royaltyBurden)],
          ]}
        />
      </ModulePanel>

      <InsightBanner accent="mint">
        The split check reconciles to {percent(summary.splitCheck * 100)}. JV agreements are modeled as payout-based revenue and cost conveyances against base interests.
      </InsightBanner>
    </div>
  );
};

export default OwnershipModule;
