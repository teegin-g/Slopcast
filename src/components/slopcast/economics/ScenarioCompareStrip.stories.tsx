import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { createDefaultScenarios } from '../../../domain/workspace/scenarios';
import { storyGroups } from '../storybookData';
import ScenarioCompareStrip from './ScenarioCompareStrip';

const scenarios = createDefaultScenarios();

const meta = {
  title: 'Slopcast/Economics/ScenarioCompareStrip',
  component: ScenarioCompareStrip,
  args: {
    activeGroup: storyGroups[0],
    wells: [],
    scenarios,
    activeScenarioId: scenarios[1].id,
    onSetActiveScenarioId: fn(),
    baseScenario: scenarios[0],
    aggregateFlow: [],
    aggregateMetrics: {
      totalCapex: 8_400_000,
      eur: 1_240_000,
      npv10: 11_700_000,
      irr: 0.22,
      payoutMonths: 18,
      wellCount: 3,
    },
  },
} satisfies Meta<typeof ScenarioCompareStrip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tropical: Story = {
  globals: {
    theme: 'tropical',
  },
};
