import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AnimatedButton } from './AnimatedButton';
import { useToast } from './Toast';

interface ToastStoryHarnessProps {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  withAction: boolean;
}

function hasVisibleToastMessage(messages: HTMLElement[]) {
  return messages.some(message => message.checkVisibility());
}

function hasVisibleElement(elements: HTMLElement[]) {
  return elements.some(element => element.checkVisibility());
}

const ToastStoryHarness = ({ message, type, withAction }: ToastStoryHarnessProps) => {
  const { addToast } = useToast();

  return (
    <div className="rounded-panel border border-theme-border bg-theme-surface1/70 p-6 shadow-card">
      <div className="space-y-3">
        <p className="typo-section">Toast Provider</p>
        <p className="typo-body max-w-xl">
          Trigger a real toast through the shared Storybook provider stack to validate theme tokens, motion, and overlay rendering together.
        </p>
        <AnimatedButton
          onClick={() => addToast({
            message,
            type,
            action: withAction ? { label: 'Undo', onClick: () => undefined } : undefined,
          })}
        >
          Trigger toast
        </AnimatedButton>
      </div>
    </div>
  );
};

const meta = {
  title: 'Slopcast/Toast',
  component: ToastStoryHarness,
  args: {
    message: 'Scenario saved successfully.',
    type: 'success',
    withAction: true,
  },
} satisfies Meta<typeof ToastStoryHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /trigger toast/i }));

    const page = within(document.body);
    const toastMessages = await page.findAllByText(args.message);
    await expect(hasVisibleToastMessage(toastMessages as HTMLElement[])).toBe(true);
    const undoButtons = await page.findAllByRole('button', { name: /undo/i });
    await expect(hasVisibleElement(undoButtons as HTMLElement[])).toBe(true);
  },
};

export const ErrorToast: Story = {
  args: {
    type: 'error',
    message: 'Unable to sync project changes.',
    withAction: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /trigger toast/i }));
    const toastMessages = await within(document.body).findAllByText(args.message);
    await expect(hasVisibleToastMessage(toastMessages as HTMLElement[])).toBe(true);
  },
};
