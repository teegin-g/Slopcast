import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverlayLegend } from './OverlayLegend';
import { createStoryGroup } from '../storybookData';
import { MOCK_WELLS } from '../../../constants';

const groups = [
  createStoryGroup('alpha', 'Alpha Pad', '#00ffff', ['w-0', 'w-1', 'w-2']),
  createStoryGroup('bravo', 'Bravo Pad', '#ff006e', ['w-3', 'w-4']),
  createStoryGroup('charlie', 'Charlie Pad', '#bf00ff', ['w-5', 'w-6', 'w-7', 'w-8']),
];

const meta = {
  title: 'Slopcast/Map/OverlayLegend',
  component: OverlayLegend,
  args: {
    isClassic: false,
    groups,
    wells: MOCK_WELLS.slice(0, 12),
    viewportLayout: 'desktop',
  },
} satisfies Meta<typeof OverlayLegend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: {
    viewportLayout: 'mobile',
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
