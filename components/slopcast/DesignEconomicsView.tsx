import React, { useState } from 'react';
import Controls from '../Controls';
import Charts from '../Charts';
import { ThemeId } from '../../theme/themes';
import { MonthlyCashFlow, WellGroup } from '../../types';
import KpiGrid from './KpiGrid';
import OperationsConsole, { OperationsConsoleProps } from './OperationsConsole';
import EconomicsDriversPanel from './EconomicsDriversPanel';
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

          {/* Setup Insights - compact vertical checklist */}
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

                {/* Compact vertical checklist instead of tile grid */}
                <div className="space-y-1">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-inner hover:bg-theme-surface2/50 transition-colors">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 text-[8px] font-black ${
                        item.done
                          ? 'bg-theme-cyan/20 border-theme-cyan text-theme-cyan'
                          : 'bg-transparent border-theme-border text-transparent'
                      }`}>
                        {item.done ? '✓' : ''}
                      </span>
                      <span className={`text-[10px] ${item.done ? 'text-theme-text' : 'text-theme-muted'}`}>
                        {item.label}
                      </span>
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
            <div className="space-y-6">
              {/* Hero NPV + stat strip */}
              <KpiGrid isClassic={isClassic} metrics={aggregateMetrics} />

              {/* Divider: Execution section */}
              <div className="border-t border-theme-border/30 pt-2">
                <p className={isClassic
                  ? 'text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3'
                  : 'text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted/60 mb-3'
                }>
                  Execution
                </p>
              </div>

              {/* Compact run bar (replaces separate Run Summary + OperationsConsole) */}
              <OperationsConsole {...operationsProps} showSelectionActions={false} compactEconomics />
            </div>
          )}

          {resultsTab === 'CHARTS' && chartPanel}

          {resultsTab === 'DRIVERS' && (
            <EconomicsDriversPanel
              isClassic={isClassic}
              topDrivers={operationsProps.topDrivers}
              biggestPositive={operationsProps.biggestPositive}
              biggestNegative={operationsProps.biggestNegative}
              breakevenOilPrice={operationsProps.breakevenOilPrice}
              payoutMonths={operationsProps.payoutMonths}
              fastestPayoutScenarioName={operationsProps.fastestPayoutScenarioName}
              scenarioRankings={operationsProps.scenarioRankings}
            />
          )}

          {resultsTab !== 'SUMMARY' && (
            <OperationsConsole {...operationsProps} showSelectionActions={false} compactEconomics />
          )}
        </section>
      </div>
    </>
  );
};

export default DesignEconomicsView;
