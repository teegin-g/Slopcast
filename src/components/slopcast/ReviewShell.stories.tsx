import { useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { ThemeId } from '../../theme/themes';
import { THEMES, getTheme } from '../../theme/themes';
import type { DesignWorkspace } from './DesignWorkspaceTabs';
import EconomicsResultsTabs, { type EconomicsResultsTab } from './EconomicsResultsTabs';
import KpiGrid from './KpiGrid';
import PageHeader from './PageHeader';
import SectionCard from './SectionCard';
import WorkflowStepper from './WorkflowStepper';
import { storyAggregateFlow, storyDealMetrics, storyWorkflowSteps } from './storybookData';

type ViewMode = 'DASHBOARD' | 'ANALYSIS';

interface ReviewShellHarnessProps {
  isClassic: boolean;
  initialThemeId: ThemeId;
  initialViewMode: ViewMode;
  initialWorkspace: DesignWorkspace;
  initialResultsTab: EconomicsResultsTab;
}

function ReviewShellHarness({
  isClassic,
  initialThemeId,
  initialViewMode,
  initialWorkspace,
  initialResultsTab,
}: ReviewShellHarnessProps) {
  const [themeId, setThemeId] = useState<ThemeId>(initialThemeId);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [designWorkspace, setDesignWorkspace] = useState<DesignWorkspace>(initialWorkspace);
  const [resultsTab, setResultsTab] = useState<EconomicsResultsTab>(initialResultsTab);
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme.id;
    document.documentElement.dataset.mode = theme.variant;
  }, [theme]);

  return (
    <div className={`min-h-screen bg-theme-bg text-theme-text ${theme.atmosphereClass ?? ''}`}>
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
        economicsNeedsAttention={viewMode === 'DASHBOARD' && designWorkspace === 'WELLS'}
        wellsNeedsAttention={viewMode === 'DASHBOARD' && designWorkspace === 'ECONOMICS'}
        onNavigateHub={() => undefined}
        atmosphericOverlays={theme.atmosphericOverlays ?? []}
        headerAtmosphereClass={theme.headerAtmosphereClass ?? ''}
        fxClass=""
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <WorkflowStepper isClassic={isClassic} steps={storyWorkflowSteps} />

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-6">
            <KpiGrid isClassic={isClassic} metrics={storyDealMetrics} aggregateFlow={storyAggregateFlow} breakevenOilPrice={52.75} />

            {viewMode === 'DASHBOARD' ? (
              <SectionCard isClassic={isClassic} title={`${designWorkspace} workspace`} panelStyle="glass">
                <div data-testid="review-shell-workspace-panel" className="space-y-3">
                  <p className="typo-body text-theme-muted">
                    {designWorkspace === 'WELLS'
                      ? 'Filter operators, inspect mapped wells, and assign them to active groups.'
                      : 'Tune decline curves, CAPEX, OPEX, and ownership before rerunning economics.'}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      designWorkspace === 'WELLS' ? 'Operator filters' : 'Type curve',
                      designWorkspace === 'WELLS' ? 'Selection actions' : 'CAPEX schedule',
                      designWorkspace === 'WELLS' ? 'Group assignment' : 'Ownership terms',
                    ].map(label => (
                      <div key={label} className="rounded-inner border border-theme-border/60 bg-theme-surface2/40 p-3">
                        <p className="typo-label">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            ) : (
              <div className="space-y-4">
                <EconomicsResultsTabs isClassic={isClassic} tab={resultsTab} onChange={setResultsTab} />
                <SectionCard isClassic={isClassic} title="Analysis view" panelStyle="glass">
                  <div data-testid="review-shell-results-panel" className="space-y-2">
                    <p className="typo-body text-theme-muted">
                      {resultsTab === 'OVERVIEW' && 'Scan summary economics, payout timing, and capital intensity across the active portfolio.'}
                      {resultsTab === 'CASH_FLOW' && 'Review monthly revenue, capex loading, and cumulative cash flow shape through time.'}
                      {resultsTab === 'RESERVES' && 'Compare proved and risked barrels, reserve categories, and recovery mix.'}
                    </p>
                    <p className="typo-label text-theme-text">Active results tab: {resultsTab}</p>
                  </div>
                </SectionCard>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <SectionCard isClassic={isClassic} title="Review notes" panelStyle="outline">
              <div className="space-y-3">
                <p className="typo-body text-theme-muted">
                  This harness combines the header, workspace switching, KPI hierarchy, and results tabs in one reusable Storybook surface.
                </p>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="typo-label">Theme</dt>
                    <dd className="typo-body text-theme-text">{theme.label}</dd>
                  </div>
                  <div>
                    <dt className="typo-label">Mode</dt>
                    <dd data-testid="review-shell-mode" className="typo-body text-theme-text">
                      {viewMode}
                    </dd>
                  </div>
                </dl>
              </div>
            </SectionCard>

            <SectionCard isClassic={isClassic} title="Panel stack" panelStyle="solid">
              <div className="space-y-3">
                {['Snapshot health', 'Export readiness', 'Theme token coverage'].map(label => (
                  <div key={label} className="rounded-inner border border-theme-border/60 bg-theme-surface2/35 px-3 py-2">
                    <p className="typo-label">{label}</p>
                    <p className="typo-body text-theme-muted">Ready for visual review</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: 'Slopcast/ReviewShell',
  component: ReviewShellHarness,
  args: {
    isClassic: false,
    initialThemeId: 'slate',
    initialViewMode: 'DASHBOARD',
    initialWorkspace: 'WELLS',
    initialResultsTab: 'OVERVIEW',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ReviewShellHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

export const IntegratedSurface: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /scenarios/i }));
    await expect(canvas.getByTestId('review-shell-mode')).toHaveTextContent(/analysis/i);

    await userEvent.click(canvas.getByRole('button', { name: /reserves/i }));
    await expect(canvas.getByTestId('review-shell-results-panel')).toHaveTextContent(/proved and risked barrels/i);

    await userEvent.click(canvas.getByRole('button', { name: /design/i }));
    await userEvent.click(canvas.getByTestId('design-workspace-economics'));
    await expect(canvas.getByTestId('review-shell-workspace-panel')).toHaveTextContent(/decline curves, capex, opex, and ownership/i);
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
