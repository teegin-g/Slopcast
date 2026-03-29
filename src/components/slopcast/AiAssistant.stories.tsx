import { useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DEFAULT_COMMODITY_PRICING } from '../../constants';
import type { CommodityPricingAssumptions } from '../../types';
import { clearHistory } from '../../services/assistantService';
import AiAssistant from './AiAssistant';
import { createStoryGroup, storyGroups } from './storybookData';

interface AiAssistantHarnessProps {
  isClassic: boolean;
}

function AiAssistantHarness({ isClassic }: AiAssistantHarnessProps) {
  const baseGroup = useMemo(() => {
    const sourceGroup = storyGroups[0];

    return createStoryGroup(
      `${sourceGroup.id}-assistant`,
      sourceGroup.name,
      sourceGroup.color,
      Array.from(sourceGroup.wellIds),
      sourceGroup.metrics,
    );
  }, []);

  const [group, setGroup] = useState(baseGroup);
  const [pricing, setPricing] = useState<CommodityPricingAssumptions>({ ...DEFAULT_COMMODITY_PRICING });
  const [scalars, setScalars] = useState({ capex: 1, production: 1 });

  useEffect(() => {
    clearHistory();
  }, []);

  return (
    <div className="relative min-h-[36rem] overflow-hidden rounded-panel border border-theme-border bg-theme-bg p-6">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-inner border border-theme-border bg-theme-surface1/70 p-3">
          <p className="typo-label">Oil price</p>
          <p data-testid="assistant-oil-price" className="typo-body text-theme-text">
            ${pricing.oilPrice.toFixed(2)}
          </p>
        </div>
        <div className="rounded-inner border border-theme-border bg-theme-surface1/70 p-3">
          <p className="typo-label">Qi</p>
          <p data-testid="assistant-qi" className="typo-body text-theme-text">
            {group.typeCurve.qi.toFixed(0)} bopd
          </p>
        </div>
        <div className="rounded-inner border border-theme-border bg-theme-surface1/70 p-3">
          <p className="typo-label">Capex scalar</p>
          <p data-testid="assistant-capex-scalar" className="typo-body text-theme-text">
            {scalars.capex.toFixed(2)}x
          </p>
        </div>
        <div className="rounded-inner border border-theme-border bg-theme-surface1/70 p-3">
          <p className="typo-label">Production scalar</p>
          <p data-testid="assistant-production-scalar" className="typo-body text-theme-text">
            {scalars.production.toFixed(2)}x
          </p>
        </div>
      </div>

      <div className="mt-5 max-w-xl">
        <p className="typo-section heading-font">Assistant Sandbox</p>
        <p className="typo-body text-theme-muted">
          Use natural-language prompts to change pricing or group assumptions and verify the state summary updates.
        </p>
      </div>

      <AiAssistant
        isClassic={isClassic}
        activeGroup={group}
        onUpdateGroup={setGroup}
        onUpdatePricing={updates => setPricing(current => ({ ...current, ...updates }))}
        onUpdateScalars={setScalars}
        currentScalars={scalars}
      />
    </div>
  );
}

const meta = {
  title: 'Slopcast/AiAssistant',
  component: AiAssistantHarness,
  args: {
    isClassic: false,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AiAssistantHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /open ai assistant/i }));
    await userEvent.type(canvas.getByPlaceholderText(/ask the ai/i), 'Set oil price to $82');
    await userEvent.click(canvas.getByRole('button', { name: /^send$/i }));

    await waitFor(async () => {
      await expect(canvas.getByTestId('assistant-oil-price')).toHaveTextContent('$82.00');
    });
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
