import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import DesignWorkspaceTabs, { type DesignWorkspace } from './DesignWorkspaceTabs';

interface StoryHarnessProps {
  isClassic: boolean;
  initialWorkspace: DesignWorkspace;
  compact?: boolean;
  economicsNeedsAttention: boolean;
  wellsNeedsAttention: boolean;
}

function DesignWorkspaceTabsHarness({
  isClassic,
  initialWorkspace,
  compact = false,
  economicsNeedsAttention,
  wellsNeedsAttention,
}: StoryHarnessProps) {
  const [workspace, setWorkspace] = useState<DesignWorkspace>(initialWorkspace);

  return (
    <div className="space-y-4">
      <DesignWorkspaceTabs
        isClassic={isClassic}
        workspace={workspace}
        onChange={setWorkspace}
        economicsNeedsAttention={economicsNeedsAttention}
        wellsNeedsAttention={wellsNeedsAttention}
        compact={compact}
      />
      <p className="typo-body text-theme-muted">
        Active workspace: <span className="text-theme-text">{workspace}</span>
      </p>
    </div>
  );
}

const meta = {
  title: 'Slopcast/DesignWorkspaceTabs',
  component: DesignWorkspaceTabsHarness,
  args: {
    isClassic: false,
    initialWorkspace: 'WELLS',
    compact: false,
    economicsNeedsAttention: true,
    wellsNeedsAttention: false,
  },
} satisfies Meta<typeof DesignWorkspaceTabsHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByTestId('design-workspace-economics'));
    await expect(canvas.getByText(/active workspace:/i)).toHaveTextContent(/economics/i);
  },
};

export const Compact: Story = {
  args: {
    compact: true,
  },
};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
    initialWorkspace: 'ECONOMICS',
    economicsNeedsAttention: false,
    wellsNeedsAttention: true,
  },
  globals: {
    theme: 'mario',
  },
};
