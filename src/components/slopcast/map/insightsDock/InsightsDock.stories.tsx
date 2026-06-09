import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import InsightsDock from './InsightsDock';
import { createStoryGroup } from '../../storybookData';
import { MOCK_WELLS } from '../../../../constants';

const groupWells = MOCK_WELLS.slice(0, 8);
const group = createStoryGroup(
  'core',
  'Tier 1 · Core',
  '#4ea1ff',
  groupWells.map((w) => w.id),
  {
    npv10: 791_200_000,
    eur: 132_900,
    totalCapex: 40_400_000,
    payoutMonths: 14,
    irr: 0.38,
    wellCount: groupWells.length,
  },
);

const selectedWells = MOCK_WELLS.slice(10, 16);

const meta = {
  title: 'Slopcast/Map/InsightsDock',
  component: InsightsDock,
  decorators: [
    (Story) => (
      <div className="relative h-[420px] bg-theme-bg overflow-hidden rounded-panel border border-theme-border">
        <Story />
      </div>
    ),
  ],
  args: {
    activeGroup: group,
    groupWells,
    selectedWells: [],
    isClassic: false,
    onDismiss: fn(),
    onClearSelection: fn(),
  },
} satisfies Meta<typeof InsightsDock>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Group mode: active group set, no lasso selection → forecast tab. */
export const GroupMode: Story = {};

/** Selection mode: lasso-selected wells present → summary tab. */
export const SelectionMode: Story = {
  args: {
    selectedWells,
  },
};

/**
 * Group mode with no active group → opinionated empty state.
 *
 * NOTE: there's no `Dismissed` story (as the plan listed) because the dock has
 * no internal visibility state — the parent owns dismissal — so a Dismissed
 * story would render nothing. NoActiveGroup exercises the empty-state path instead.
 */
export const NoActiveGroup: Story = {
  args: {
    activeGroup: null,
    groupWells: [],
    selectedWells: [],
  },
};
