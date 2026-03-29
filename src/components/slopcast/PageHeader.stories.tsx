import { useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { ThemeId } from '../../theme/themes';
import { THEMES, getTheme } from '../../theme/themes';
import PageHeader from './PageHeader';
import type { DesignWorkspace } from './DesignWorkspaceTabs';

type ViewMode = 'DASHBOARD' | 'ANALYSIS';

interface PageHeaderHarnessProps {
  isClassic: boolean;
  initialThemeId: ThemeId;
  initialViewMode: ViewMode;
  initialWorkspace: DesignWorkspace;
  economicsNeedsAttention: boolean;
  wellsNeedsAttention: boolean;
}

function PageHeaderHarness({
  isClassic,
  initialThemeId,
  initialViewMode,
  initialWorkspace,
  economicsNeedsAttention,
  wellsNeedsAttention,
}: PageHeaderHarnessProps) {
  const [themeId, setThemeId] = useState<ThemeId>(initialThemeId);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [designWorkspace, setDesignWorkspace] = useState<DesignWorkspace>(initialWorkspace);
  const [hubVisits, setHubVisits] = useState(0);
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme.id;
    document.documentElement.dataset.mode = theme.variant;
  }, [theme]);

  return (
    <div className="space-y-4">
      <PageHeader
        isClassic={isClassic}
        theme={theme}
        themes={THEMES}
        themeId={themeId}
        setThemeId={setThemeId}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        designWorkspace={designWorkspace}
        onSetDesignWorkspace={setDesignWorkspace}
        economicsNeedsAttention={economicsNeedsAttention}
        wellsNeedsAttention={wellsNeedsAttention}
        onNavigateHub={() => setHubVisits((count) => count + 1)}
        atmosphericOverlays={theme.atmosphericOverlays ?? []}
        headerAtmosphereClass={theme.headerAtmosphereClass ?? ''}
        fxClass=""
      />
      <div className="rounded-panel border border-theme-border bg-theme-surface1/70 p-4 shadow-card">
        <dl className="grid gap-3 sm:grid-cols-4">
          <div>
            <dt className="typo-label">Theme</dt>
            <dd data-testid="page-header-theme" className="typo-body text-theme-text">
              {theme.label}
            </dd>
          </div>
          <div>
            <dt className="typo-label">Mode</dt>
            <dd data-testid="page-header-mode" className="typo-body text-theme-text">
              {viewMode}
            </dd>
          </div>
          <div>
            <dt className="typo-label">Workspace</dt>
            <dd data-testid="page-header-workspace" className="typo-body text-theme-text">
              {designWorkspace}
            </dd>
          </div>
          <div>
            <dt className="typo-label">Hub visits</dt>
            <dd data-testid="page-header-hub" className="typo-body text-theme-text">
              {hubVisits}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

const meta = {
  title: 'Slopcast/PageHeader',
  component: PageHeaderHarness,
  args: {
    isClassic: false,
    initialThemeId: 'slate',
    initialViewMode: 'DASHBOARD',
    initialWorkspace: 'WELLS',
    economicsNeedsAttention: true,
    wellsNeedsAttention: false,
  },
} satisfies Meta<typeof PageHeaderHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /scenarios/i }));
    await expect(canvas.getByTestId('page-header-mode')).toHaveTextContent(/analysis/i);

    await userEvent.click(canvas.getByRole('button', { name: /design/i }));
    await expect(canvas.getByTestId('page-header-mode')).toHaveTextContent(/dashboard/i);

    await userEvent.click(canvas.getByTestId('design-workspace-economics'));
    await expect(canvas.getByTestId('page-header-workspace')).toHaveTextContent(/economics/i);

    await userEvent.click(canvas.getByRole('button', { name: /hub/i }));
    await expect(canvas.getByTestId('page-header-hub')).toHaveTextContent('1');
  },
};

export const AnalysisMode: Story = {
  args: {
    initialViewMode: 'ANALYSIS',
    economicsNeedsAttention: false,
  },
};

export const ClassicTheme: Story = {
  args: {
    isClassic: true,
    initialThemeId: 'mario',
  },
  globals: {
    theme: 'mario',
  },
};
