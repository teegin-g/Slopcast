import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MobileDrawer } from './MobileDrawer';

interface MobileDrawerHarnessProps {
  initialOpen: boolean;
}

function MobileDrawerHarness({ initialOpen }: MobileDrawerHarnessProps) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div className="relative min-h-[32rem] overflow-hidden rounded-panel border border-theme-border bg-theme-bg">
      <div className="flex items-center justify-between border-b border-theme-border/60 px-5 py-4">
        <div>
          <p className="typo-section heading-font">Mobile Navigation</p>
          <p className="typo-body text-theme-muted">Review drawer transitions, focus handling, and escape-close behavior.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring rounded-inner border border-theme-border bg-theme-surface2 px-3 py-2 text-sm font-semibold text-theme-text"
        >
          Open menu
        </button>
      </div>

      <div className="p-5">
        <p className="typo-label">Drawer status</p>
        <p data-testid="mobile-drawer-status" className="typo-body text-theme-text">
          {open ? 'open' : 'closed'}
        </p>
      </div>

      <MobileDrawer open={open} onClose={() => setOpen(false)}>
        <div className="flex h-full flex-col p-4 text-theme-text">
          <p className="typo-section heading-font border-b border-theme-border/50 pb-3">Workspace Menu</p>
          <nav aria-label="Mobile workspace navigation" className="mt-4 space-y-2">
            {['Wells', 'Economics', 'Scenarios'].map(label => (
              <button
                key={label}
                type="button"
                className="focus-ring block w-full rounded-inner border border-theme-border/50 bg-theme-surface1/70 px-3 py-2 text-left text-sm"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </MobileDrawer>
    </div>
  );
}

const meta = {
  title: 'Layout/MobileDrawer',
  component: MobileDrawerHarness,
  args: {
    initialOpen: false,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MobileDrawerHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /open menu/i }));
    await expect(canvas.getByRole('navigation', { name: /mobile workspace navigation/i })).toBeVisible();
    await expect(canvas.getByTestId('mobile-drawer-status')).toHaveTextContent(/open/i);

    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByTestId('mobile-drawer-status')).toHaveTextContent(/closed/i);
  },
};

export const OpenByDefault: Story = {
  args: {
    initialOpen: true,
  },
};
