import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AnimatedButton } from './AnimatedButton';

const meta = {
  title: 'Slopcast/AnimatedButton',
  component: AnimatedButton,
  args: {
    children: 'Run scenario',
    variant: 'primary',
    size: 'md',
    onClick: fn(),
  },
} satisfies Meta<typeof AnimatedButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /run scenario/i });

    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Adjust pricing',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Locked',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /locked/i });

    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
