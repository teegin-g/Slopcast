import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { OverlaySelectionBar } from './OverlaySelectionBar';

const meta = {
  title: 'Slopcast/Map/OverlaySelectionBar',
  component: OverlaySelectionBar,
  args: {
    isClassic: false,
    selectedCount: 5,
    onAssignWells: fn(),
    onCreateGroupFromSelection: fn(),
    onSelectAll: fn(),
    onClearSelection: fn(),
  },
} satisfies Meta<typeof OverlaySelectionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithSelection: Story = {};

export const NoSelection: Story = {
  args: {
    selectedCount: 0,
  },
};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
    selectedCount: 12,
  },
  globals: {
    theme: 'mario',
  },
};
