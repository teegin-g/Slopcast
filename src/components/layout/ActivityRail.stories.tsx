import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ActivityRail } from './ActivityRail';

const meta = {
  title: 'Layout/ActivityRail',
  component: ActivityRail,
  args: {
    section: 'wells',
    isClassic: false,
    onSetSection: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ height: 300, display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WellsActive: Story = {};

export const EconomicsActive: Story = {
  args: { section: 'economics' },
};

export const ScenariosActive: Story = {
  args: { section: 'scenarios' },
};

export const Classic: Story = {
  args: { isClassic: true },
};
