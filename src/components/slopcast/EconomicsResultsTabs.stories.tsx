import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import EconomicsResultsTabs, { type EconomicsResultsTab } from './EconomicsResultsTabs';

interface StoryHarnessProps {
  isClassic: boolean;
  initialTab: EconomicsResultsTab;
  hasFlowData?: boolean;
}

function EconomicsResultsTabsHarness({
  isClassic,
  initialTab,
  hasFlowData = true,
}: StoryHarnessProps) {
  const [tab, setTab] = useState<EconomicsResultsTab>(initialTab);

  return (
    <div className="space-y-4">
      <EconomicsResultsTabs
        isClassic={isClassic}
        tab={tab}
        onChange={setTab}
        hasFlowData={hasFlowData}
      />
      <p className="typo-body text-theme-muted">
        Active results tab: <span className="text-theme-text">{tab}</span>
      </p>
    </div>
  );
}

const meta = {
  title: 'Slopcast/EconomicsResultsTabs',
  component: EconomicsResultsTabsHarness,
  args: {
    isClassic: false,
    initialTab: 'SUMMARY',
    hasFlowData: true,
  },
} satisfies Meta<typeof EconomicsResultsTabsHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /drivers/i }));
    await expect(canvas.getByText(/active results tab:/i)).toHaveTextContent(/drivers/i);
  },
};

export const CashFlowDisabled: Story = {
  args: {
    initialTab: 'CHARTS',
    hasFlowData: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /cash flow/i })).toBeDisabled();
  },
};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
    initialTab: 'DRIVERS',
  },
  globals: {
    theme: 'mario',
  },
};
