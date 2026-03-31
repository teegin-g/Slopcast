import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { OverlayGroupsPanel } from './OverlayGroupsPanel';
import { createStoryGroup } from '../storybookData';
import { MOCK_WELLS } from '../../../constants';

const groups = [
  createStoryGroup('alpha', 'Alpha Pad', '#00ffff', ['w-0', 'w-1', 'w-2']),
  createStoryGroup('bravo', 'Bravo Pad', '#ff006e', ['w-3', 'w-4']),
  createStoryGroup('charlie', 'Charlie Pad', '#bf00ff', ['w-5', 'w-6', 'w-7', 'w-8']),
];

const meta = {
  title: 'Slopcast/Map/OverlayGroupsPanel',
  component: OverlayGroupsPanel,
  args: {
    isClassic: false,
    groups,
    activeGroupId: 'alpha',
    onActivateGroup: fn(),
    onAddGroup: fn(),
    onCloneGroup: fn(),
    wells: MOCK_WELLS.slice(0, 9),
    selectedWellIds: new Set(['w-1', 'w-2']),
    visibleWellIds: new Set(MOCK_WELLS.slice(0, 9).map(w => w.id)),
  },
} satisfies Meta<typeof OverlayGroupsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
  },
  globals: {
    theme: 'mario',
  },
};
