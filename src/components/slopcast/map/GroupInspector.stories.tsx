import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { GroupInspector } from './GroupInspector';
import { createStoryGroup } from '../storybookData';
import { MOCK_WELLS } from '../../../constants';

const wells = MOCK_WELLS.slice(0, 12);
const group = createStoryGroup('core', 'Tier 1 · Core', '#4ea1ff', wells.map(w => w.id), {
  npv10: 791_200_000,
  eur: 132_900,
  totalCapex: 40_400_000,
  payoutMonths: 14,
  irr: 0.38,
  wellCount: wells.length,
});

const emptyGroup = createStoryGroup('scout', 'Scout Package', '#f0b86c', wells.slice(0, 4).map(w => w.id));

const meta = {
  title: 'Slopcast/Map/GroupInspector',
  component: GroupInspector,
  decorators: [
    (Story) => (
      <div style={{ width: 264, padding: 12 }} className="rounded-panel border border-theme-border bg-theme-surface1">
        <Story />
      </div>
    ),
  ],
  args: {
    group,
    wells,
    onViewDetails: fn(),
  },
} satisfies Meta<typeof GroupInspector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoEconomicsYet: Story = {
  args: {
    group: emptyGroup,
    wells: wells.slice(0, 4),
  },
};

export const PermianTheme: Story = {
  globals: { theme: 'permian' },
};
