import type { Meta, StoryObj } from '@storybook/react-vite';
import WorkflowStepper from './WorkflowStepper';
import { storyWorkflowSteps } from './storybookData';

const meta = {
  title: 'Slopcast/WorkflowStepper',
  component: WorkflowStepper,
  args: {
    isClassic: false,
    steps: storyWorkflowSteps,
    compact: false,
  },
} satisfies Meta<typeof WorkflowStepper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    compact: true,
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
