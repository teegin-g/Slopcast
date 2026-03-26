import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import EconomicsResultsTabs, { type EconomicsResultsTab } from './EconomicsResultsTabs';

interface StoryHarnessProps {
  isClassic: boolean;
  initialTab: EconomicsResultsTab;
}

function EconomicsResultsTabsHarness({
  isClassic,
  initialTab,
}: StoryHarnessProps) {
  const [tab, setTab] = useState<EconomicsResultsTab>(initialTab);

  return (
    <div className="space-y-4">
      <EconomicsResultsTabs
        isClassic={isClassic}
        tab={tab}
        onChange={setTab}
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
    initialTab: 'OVERVIEW',
  },
} satisfies Meta<typeof EconomicsResultsTabsHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /reserves/i }));
    await expect(canvas.getByText(/active results tab:/i)).toHaveTextContent(/reserves/i);
  },
};

export const CashFlow: Story = {
  args: {
    initialTab: 'CASH_FLOW',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/active results tab:/i)).toHaveTextContent(/cash_flow/i);
  },
};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
    initialTab: 'OVERVIEW',
  },
  globals: {
    theme: 'mario',
  },
};
