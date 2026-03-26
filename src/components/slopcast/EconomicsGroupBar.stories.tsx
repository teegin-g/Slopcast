import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import EconomicsGroupBar from './EconomicsGroupBar';
import { createStoryGroup, storyGroups, storyScenarioRankings } from './storybookData';

interface StoryHarnessProps {
  isClassic: boolean;
  focusMode?: boolean;
}

function EconomicsGroupBarHarness({
  isClassic,
  focusMode = false,
}: StoryHarnessProps) {
  const [groups, setGroups] = useState(storyGroups);
  const [activeGroupId, setActiveGroupId] = useState(storyGroups[0]?.id ?? '');
  const [isFocusMode, setIsFocusMode] = useState(focusMode);

  const scenarioRankings = useMemo(() => {
    return groups.map((group, index) => ({
      ...storyScenarioRankings[index % storyScenarioRankings.length],
      id: group.id,
      npv10: group.metrics?.npv10 ?? 0,
      totalCapex: group.metrics?.totalCapex ?? 0,
      payoutMonths: group.metrics?.payoutMonths ?? 0,
      wellCount: group.metrics?.wellCount ?? group.wellIds.size,
      roi: group.metrics && group.metrics.totalCapex > 0 ? group.metrics.npv10 / group.metrics.totalCapex : 0,
    }));
  }, [groups]);

  return (
    <EconomicsGroupBar
      isClassic={isClassic}
      groups={groups}
      activeGroupId={activeGroupId}
      onActivateGroup={setActiveGroupId}
      onCloneActiveGroup={() => {
        const active = groups.find((group) => group.id === activeGroupId) ?? groups[0];
        if (!active) {
          return;
        }

        const cloneId = `${active.id}-clone-${groups.length + 1}`;
        const clone = createStoryGroup(
          cloneId,
          `${active.name} Copy`,
          active.color,
          Array.from(active.wellIds),
          active.metrics,
        );

        setGroups((current) => [...current, clone]);
        setActiveGroupId(cloneId);
      }}
      scenarioRankings={scenarioRankings}
      focusMode={isFocusMode}
      onToggleFocusMode={() => setIsFocusMode((current) => !current)}
    />
  );
}

const meta = {
  title: 'Slopcast/EconomicsGroupBar',
  component: EconomicsGroupBarHarness,
  args: {
    isClassic: false,
    focusMode: false,
  },
} satisfies Meta<typeof EconomicsGroupBarHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId('economics-group-next'));
    await expect(canvas.getByTestId('economics-active-group-label')).toHaveTextContent(/bravo west/i);

    await userEvent.click(canvas.getByTestId('economics-group-select'));
    await userEvent.type(canvas.getByLabelText(/search groups/i), 'charlie');
    await userEvent.click(canvas.getByTestId('economics-group-option-charlie'));
    await expect(canvas.getByTestId('economics-active-group-label')).toHaveTextContent(/charlie bench/i);
  },
};

export const FocusModeEnabled: Story = {
  args: {
    focusMode: true,
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
