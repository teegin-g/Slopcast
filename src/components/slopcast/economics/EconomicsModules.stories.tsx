import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { DEFAULT_COMMODITY_PRICING } from '../../../constants';
import type { EconomicsModule } from './types';
import type { MonthlyCashFlow, Scenario, WellGroup } from '../../../types';
import { createStoryGroup } from '../storybookData';
import EconomicsModuleTabs from './EconomicsModuleTabs';
import PricingModule from './PricingModule';

const flow: MonthlyCashFlow[] = Array.from({ length: 120 }, (_, index) => {
  const month = index + 1;
  const oilProduction = Math.max(120, 1800 * Math.exp(-index / 38));
  const gasProduction = oilProduction * 0.7;
  const revenue = oilProduction * 72.5 + gasProduction * 2.9;
  const capex = index === 0 ? 7_500_000 : 0;
  const opex = 22_000 + oilProduction * 0.45;
  const netCashFlow = revenue - capex - opex;
  const cumulativeCashFlow = netCashFlow + (index > 0 ? 0 : -1_800_000);
  return {
    month,
    date: `Month ${month}`,
    oilProduction,
    gasProduction,
    revenue,
    capex,
    opex,
    netCashFlow,
    cumulativeCashFlow,
  };
});

const activeGroup: WellGroup = {
  ...createStoryGroup('economics-story', 'Permian Core', '#22d3ee', ['w-1', 'w-2', 'w-3'], {
    npv10: 13_200_000,
    totalCapex: 9_100_000,
    eur: 1_320_000,
    payoutMonths: 20,
    wellCount: 3,
  }),
  flow,
};

const baseScenario: Scenario = {
  id: 'base',
  name: 'Base Case',
  color: '#22d3ee',
  isBaseCase: true,
  pricing: { ...DEFAULT_COMMODITY_PRICING },
  schedule: { annualRigs: [2], drillDurationDays: 18, stimDurationDays: 12, rigStartDate: '2026-01-01' },
  capexScalar: 1,
  productionScalar: 1,
};

const upsideScenario: Scenario = {
  ...baseScenario,
  id: 'upside',
  name: 'Upside',
  color: '#34d399',
  isBaseCase: false,
  pricing: { ...DEFAULT_COMMODITY_PRICING, oilPrice: 85 },
};

interface StoryHarnessProps {
  initialModule: EconomicsModule;
}

function ModuleTabsHarness({ initialModule }: StoryHarnessProps) {
  const [module, setModule] = useState<EconomicsModule>(initialModule);
  return (
    <div className="space-y-4">
      <EconomicsModuleTabs module={module} onChange={setModule} />
      <p className="text-xs text-theme-muted">Active module: <span className="text-theme-text">{module}</span></p>
    </div>
  );
}

const meta = {
  title: 'Slopcast/Economics/Modules',
  component: ModuleTabsHarness,
  args: {
    initialModule: 'PRODUCTION',
  },
} satisfies Meta<typeof ModuleTabsHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ModuleNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('economics-module-tab-taxes'));
    await expect(canvas.getByText(/active module:/i)).toHaveTextContent(/taxes/i);
  },
};

export const PricingWorkspace: Story = {
  render: () => (
    <PricingModule
      isClassic={false}
      activeGroup={activeGroup}
      groups={[activeGroup]}
      wells={[]}
      scenarios={[baseScenario, upsideScenario]}
      activeScenario={upsideScenario}
      baseScenario={baseScenario}
      aggregateFlow={flow}
      aggregateMetrics={activeGroup.metrics!}
      onUpdateGroup={() => {}}
      onMarkDirty={() => {}}
    />
  ),
};
