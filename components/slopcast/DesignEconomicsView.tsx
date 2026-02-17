import React, { useState } from 'react';
import Controls from '../Controls';
import Charts from '../Charts';
import { ThemeId } from '../../theme/themes';
import { MonthlyCashFlow, WellGroup } from '../../types';
import KpiGrid from './KpiGrid';
import OperationsConsole, { OperationsConsoleProps } from './OperationsConsole';
import { WorkflowStep } from './WorkflowStepper';
import EconomicsGroupBar from './EconomicsGroupBar';
import EconomicsResultsTabs, { EconomicsResultsTab } from './EconomicsResultsTabs';

export type EconomicsMobilePanel = 'SETUP' | 'RESULTS';

type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP';

interface DesignEconomicsViewProps {
  isClassic: boolean;
  themeId: ThemeId;
  workflowSteps: WorkflowStep[];
  mobilePanel: EconomicsMobilePanel;
  onSetMobilePanel: (panel: EconomicsMobilePanel) => void;
  resultsTab: EconomicsResultsTab;
  onSetResultsTab: (tab: EconomicsResultsTab) => void;
  groups: WellGroup[];
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  onCloneGroup: (groupId: string) => void;
  activeGroup: WellGroup;
  onUpdateGroup: (group: WellGroup) => void;
  onMarkDirty: () => void;
  controlsOpenSection: ControlsSection | null;
  onControlsOpenHandled: () => void;
  hasGroup: boolean;
  hasGroupWells: boolean;
  hasCapexItems: boolean;
  hasRun: boolean;
  needsRerun: boolean;
  aggregateMetrics: {
    npv10: number;
    totalCapex: number;
    eur: number;
    payoutMonths: number;
    wellCount: number;
  };
  aggregateFlow: MonthlyCashFlow[];
  operationsProps: OperationsConsoleProps;
}

const readinessTone = (done: boolean) => {
  return done ? 'text-theme-cyan' : 'text-theme-muted';
};

const DesignEconomicsView: React.FC<DesignEconomicsViewProps> = ({
  isClassic,
  themeId,
  workflowSteps,
  mobilePanel,
  onSetMobilePanel,
  resultsTab,
  onSetResultsTab,
  groups,
  activeGroupId,
  onActivateGroup,
  onCloneGroup,
  activeGroup,
  onUpdateGroup,
  onMarkDirty,
  controlsOpenSection,
  onControlsOpenHandled,
  hasGroup,
  hasGroupWells,
  hasCapexItems,
  hasRun,
  needsRerun,
  aggregateMetrics,
  aggregateFlow,
  operationsProps,
}) => {
  const [showSetupInsights, setShowSetupInsights] = useState(false);
  const checklist = [
    { id: 'group', label: 'Choose active group', done: hasGroup },
    { id: 'wells', label: 'Assign wells to group', done: hasGroupWells },
    { id: 'capex', label: 'Confirm CAPEX items', done: hasCapexItems },
    { id: 'run', label: 'Run economics', done: hasRun && !needsRerun },
  ];

  const activeWorkflowStep =
    workflowSteps.find(step => step.status === 'ACTIVE' || step.status === 'STALE') || workflowSteps[0];

  const readinessBlocker =
    !hasGroup
      ? 'Choose an active group to begin.'
      : !hasGroupWells
        ? 'Assign wells to this group in Wells workspace.'
        : !hasCapexItems
          ? 'Add CAPEX line items before running economics.'
          : needsRerun
            ? 'Inputs changed. Run economics to refresh results.'
            : 'Ready for review.';

  const runMetaSummary = operationsProps.validationWarnings.length > 0
    ? `${operationsProps.validationWarnings.length} validation checks need attention.`
    : 'All validation checks passed.';

  const chartPanel = (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition p-3 min-h-[360px]'
          : 'rounded-panel border p-1 theme-transition bg-theme-surface1/50 border-theme-border shadow-card min-h-[360px]'
      }
    >
      <Charts data={aggregateFlow} themeId={themeId} />
    </div>
  );

  return (
    <>
      <EconomicsGroupBar
        isClassic={isClassic}
        groups={groups}
        activeGroupId={activeGroupId}
        onActivateGroup={onActivateGroup}
        onCloneActiveGroup={() => onCloneGroup(activeGroupId)}
      />

      <div
        className={`lg:hidden mb-4 border p-2 theme-transition ${
          isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 border-theme-border shadow-card backdrop-blur-sm'
        }`}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSetMobilePanel('SETUP')}
            className={
              isClassic
                ? `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                    mobilePanel === 'SETUP' ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                  }`
                : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border transition-colors ${
                    mobilePanel === 'SETUP'
                      ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                      : 'bg-theme-bg text-theme-muted border-theme-border'
                  }`
            }
          >
            Setup
          </button>
          <button
            onClick={() => onSetMobilePanel('RESULTS')}
            className={
              isClassic
                ? `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                    mobilePanel === 'RESULTS' ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                  }`
                : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border transition-colors ${
                    mobilePanel === 'RESULTS'
                      ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                      : 'bg-theme-bg text-theme-muted border-theme-border'
                  }`
            }
          >
            Results
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:min-h-[calc(100vh-13.5rem)]">
        <aside
          className={`lg:col-span-5 xl:col-span-4 space-y-4 lg:max-h-[calc(100vh-13.5rem)] lg:overflow-y-auto lg:pr-1 ${
            mobilePanel !== 'SETUP' ? 'hidden lg:block' : ''
          }`}
        >
          <Controls
            group={activeGroup}
            onUpdateGroup={onUpdateGroup}
            onMarkDirty={onMarkDirty}
            openSectionKey={controlsOpenSection}
            onOpenSectionHandled={onControlsOpenHandled}
          />

          <div
            className={
              isClassic
                ? 'sc-panel theme-transition'
                : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
            }
          >
            <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
              <div className="flex items-center justify-between gap-2">
                <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
                  Setup Insights
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSetupInsights(prev => !prev)}
                  className="text-[9px] font-black uppercase tracking-[0.16em] text-theme-cyan"
                >
                  {showSetupInsights ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {showSetupInsights && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-theme-muted">
                  {activeWorkflowStep?.label || 'Setup'} step is <span className="uppercase font-black text-theme-cyan">{activeWorkflowStep?.status.toLowerCase()}</span>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  {checklist.map((item) => (
                    <div key={item.id} className="rounded-inner border border-theme-border bg-theme-bg px-3 py-2">
                      <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${readinessTone(item.done)}`}>
                        {item.done ? 'Done' : 'Pending'}
                      </p>
                      <p className="text-[10px] text-theme-text mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-inner border border-theme-border bg-theme-bg px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-theme-lavender">Current blocker</p>
                  <p className="text-[10px] text-theme-muted mt-1">{readinessBlocker}</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <section
          className={`lg:col-span-7 xl:col-span-8 space-y-4 lg:max-h-[calc(100vh-13.5rem)] lg:overflow-y-auto lg:pr-1 ${
            mobilePanel !== 'RESULTS' ? 'hidden lg:block' : ''
          }`}
        >
          <EconomicsResultsTabs isClassic={isClassic} tab={resultsTab} onChange={onSetResultsTab} />

          {resultsTab === 'SUMMARY' && (
            <>
              <KpiGrid isClassic={isClassic} metrics={aggregateMetrics} />
              <div
                className={
                  isClassic
                    ? 'sc-panel theme-transition p-4'
                    : 'rounded-panel border shadow-card p-4 theme-transition bg-theme-surface1/70 border-theme-border'
                }
              >
                <p className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.2em] text-white' : 'text-[10px] font-black uppercase tracking-[0.2em] text-theme-cyan'}>
                  Run Summary
                </p>
                <p className="text-[10px] text-theme-muted mt-2">
                  {operationsProps.lastEconomicsRunAt
                    ? `Last run ${new Date(operationsProps.lastEconomicsRunAt).toLocaleString()}`
                    : 'No run yet'}
                  {needsRerun && <span className="ml-2 text-theme-warning">Rerun needed.</span>}
                </p>
                <p className="text-[10px] text-theme-muted mt-1">{runMetaSummary}</p>
              </div>
            </>
          )}

          {resultsTab === 'CHARTS' && chartPanel}

          {resultsTab === 'DRIVERS' && (
            <div
              className={
                isClassic
                  ? 'sc-panel theme-transition p-4 space-y-3'
                  : 'rounded-panel border shadow-card p-4 theme-transition bg-theme-surface1/70 border-theme-border space-y-3'
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {operationsProps.topDrivers.map((driver) => (
                  <div key={driver.id} className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">{driver.label}</p>
                    <p className={`text-lg font-black ${driver.dominantDelta >= 0 ? 'text-theme-cyan' : 'text-theme-magenta'}`}>
                      {(driver.dominantDelta / 1e6).toFixed(1)} MM
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Biggest Upside</p>
                  <p className="text-[10px] text-theme-muted">{operationsProps.biggestPositive?.label || 'n/a'}</p>
                  <p className="text-lg font-black text-theme-cyan">
                    {operationsProps.biggestPositive ? `${(operationsProps.biggestPositive.deltaNpv / 1e6).toFixed(1)} MM` : '-'}
                  </p>
                </div>
                <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Biggest Downside</p>
                  <p className="text-[10px] text-theme-muted">{operationsProps.biggestNegative?.label || 'n/a'}</p>
                  <p className="text-lg font-black text-theme-magenta">
                    {operationsProps.biggestNegative ? `${(operationsProps.biggestNegative.deltaNpv / 1e6).toFixed(1)} MM` : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Breakeven Oil</p>
                  <p className="text-2xl font-black text-theme-text">
                    {operationsProps.breakevenOilPrice !== null ? `$${operationsProps.breakevenOilPrice.toFixed(1)}` : 'Out of range'}
                  </p>
                </div>
                <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Payout Highlights</p>
                  <p className="text-[10px] text-theme-muted">Portfolio: {operationsProps.payoutMonths > 0 ? `${operationsProps.payoutMonths} mo` : '-'}</p>
                  <p className="text-[10px] text-theme-muted">Fastest: {operationsProps.fastestPayoutScenarioName}</p>
                </div>
              </div>

              <div className="rounded-inner border overflow-hidden bg-theme-bg border-theme-border">
                <div className="px-3 py-2 border-b text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender border-theme-border">
                  Scenario Rank (NPV / ROI)
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {operationsProps.scenarioRankings.map((row, idx) => (
                    <div key={row.id} className="px-3 py-2 text-[10px] border-b border-theme-border/30 flex items-center justify-between text-theme-muted">
                      <span className="font-semibold text-theme-text">{idx + 1}. {row.name}</span>
                      <span>NPV {(row.npv10 / 1e6).toFixed(1)} | ROI {row.roi.toFixed(2)}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <OperationsConsole {...operationsProps} showSelectionActions={false} compactEconomics />
        </section>
      </div>
    </>
  );
};

export default DesignEconomicsView;
