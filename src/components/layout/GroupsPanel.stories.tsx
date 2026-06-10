import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import GroupsPanel from './GroupsPanel';
import { createStoryGroup } from '../slopcast/storybookData';
import { MOCK_WELLS } from '../../constants';

const wells = MOCK_WELLS.slice(0, 18);

const groups = [
  createStoryGroup('core', 'Tier 1 · Core', '#4ea1ff', wells.slice(0, 8).map(w => w.id), {
    npv10: 791_200_000,
    eur: 132_900,
    totalCapex: 40_400_000,
    payoutMonths: 14,
    irr: 0.38,
    wellCount: 8,
  }),
  createStoryGroup('flank', 'Tier 2 · Flank', '#a78bfa', wells.slice(8, 14).map(w => w.id), {
    npv10: 312_500_000,
    eur: 88_400,
    totalCapex: 27_900_000,
    payoutMonths: 21,
    irr: 0.24,
    wellCount: 6,
  }),
  createStoryGroup('scout', 'Scout Package', '#f0b86c', wells.slice(14, 18).map(w => w.id), {
    npv10: 96_300_000,
    eur: 41_200,
    totalCapex: 18_100_000,
    payoutMonths: 28,
    irr: 0.16,
    wellCount: 4,
  }),
];

const meta = {
  title: 'Layout/GroupsPanel',
  component: GroupsPanel,
  decorators: [
    (Story) => (
      <div style={{ width: 300, height: 640 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    groups,
    activeGroupId: 'core',
    wells,
    collapsed: false,
    isClassic: false,
    onActivateGroup: fn(),
    onNewGroup: fn(),
    onCloneGroup: fn(),
    onToggleCollapse: fn(),
  },
} satisfies Meta<typeof GroupsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: {
    collapsed: true,
  },
};

export const SingleGroup: Story = {
  args: {
    groups: [groups[0]],
    activeGroupId: 'core',
  },
};

export const Classic: Story = {
  args: {
    isClassic: true,
  },
  globals: { theme: 'mario' },
};
