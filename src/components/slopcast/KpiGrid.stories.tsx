import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import KpiGrid from './KpiGrid';
import { storyAggregateFlow, storyDealMetrics } from './storybookData';

const meta = {
  title: 'Slopcast/KpiGrid',
  component: KpiGrid,
  args: {
    isClassic: false,
    metrics: storyDealMetrics,
    aggregateFlow: storyAggregateFlow,
    breakevenOilPrice: 52.75,
  },
} satisfies Meta<typeof KpiGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PortfolioOverview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/portfolio npv/i)).toBeVisible();
    await expect(canvas.getByText('$13.4')).toBeVisible();
    await expect(canvas.getByText(/total capex/i)).toBeVisible();
  },
};

export const LeanMetrics: Story = {
  args: {
    aggregateFlow: undefined,
    metrics: {
      ...storyDealMetrics,
      npv10: 5_200_000,
      totalCapex: 4_600_000,
      eur: 640_000,
      payoutMonths: 0,
      wellCount: 1,
    },
  },
};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
  },
  globals: {
    theme: 'mario',
  },
};
