import React from 'react';
import Controls from '../Controls';
import Charts from '../Charts';
import { ThemeId } from '../../theme/themes';
import { MonthlyCashFlow, Well, WellGroup } from '../../types';
import KpiGrid from './KpiGrid';
import OperationsConsole, { OperationsConsoleProps } from './OperationsConsole';
import { WorkflowStep } from './WorkflowStepper';

export type EconomicsMobilePanel = 'SETUP' | 'RESULTS';

type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP';

interface DesignEconomicsViewProps {
  isClassic: boolean;
  themeId: ThemeId;
  workflowSteps: WorkflowStep[];
  mobilePanel: EconomicsMobilePanel;
  onSetMobilePanel: (panel: EconomicsMobilePanel) => void;
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
  onJumpToWells: () => void;
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

const checklistTone = (done: boolean) => {
  return done ? 'text-theme-cyan' : 'text-theme-muted';
};

const DesignEconomicsView: React.FC<DesignEconomicsViewProps> = ({
  isClassic,
  themeId,
  workflowSteps,
  mobilePanel,
  onSetMobilePanel,
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
  onJumpToWells,
  aggregateMetrics,
  aggregateFlow,
  operationsProps,
}) => {
  const checklist = [
    { id: 'group', label: 'Choose active group', done: hasGroup },
    { id: 'wells', label: 'Assign wells to group', done: hasGroupWells },
    { id: 'capex', label: 'Confirm CAPEX items', done: hasCapexItems },
    { id: 'run', label: 'Run economics', done: hasRun && !needsRerun },
  ];

  return (
    <>
      <div className="hidden lg:block">
        <div className={isClassic ? 'sc-panel theme-transition mb-4' : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border mb-4'}>
          <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-3' : 'px-4 py-3 border-b border-theme-border/60'}>
            <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
              Economics Readiness
            </h2>
          </div>
          <div className="p-4 grid grid-cols-4 gap-2">
            {checklist.map((item) => (
              <div key={item.id} className="rounded-inner border border-theme-border bg-theme-bg px-3 py-2">
                <p className={`text-[9px] font-black uppercase tracking-[0.16em] ${checklistTone(item.done)}`}>
                  {item.done ? 'Done' : 'Pending'}
                </p>
                <p className="text-[10px] text-theme-text mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          {(!hasGroupWells || !hasCapexItems) && (
            <div className="px-4 pb-4">
              <button
                onClick={onJumpToWells}
                className="px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.16em] bg-theme-cyan text-theme-bg hover:shadow-glow-cyan transition-all"
              >
                Jump To Wells
              </button>
            </div>
          )}
        </div>
      </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <aside className={`xl:col-span-5 space-y-6 ${mobilePanel !== 'SETUP' ? 'hidden lg:block' : ''}`}>
          <div className={isClassic ? 'sc-panel theme-transition' : 'rounded-panel border shadow-card p-4 theme-transition bg-theme-surface1 border-theme-border'}>
            <h3 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.2em] text-white mb-3' : 'text-[10px] font-black uppercase tracking-[0.2em] text-theme-cyan mb-3'}>
              Workflow Focus
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {workflowSteps.map(step => (
                <div key={step.id} className="rounded-inner border border-theme-border bg-theme-bg px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted">{step.label}</p>
                  <p className="text-[9px] uppercase tracking-[0.12em] mt-1 text-theme-cyan">{step.status.toLowerCase()}</p>
                </div>
              ))}
            </div>
          </div>

          <Controls
            group={activeGroup}
            onUpdateGroup={onUpdateGroup}
            onMarkDirty={onMarkDirty}
            openSectionKey={controlsOpenSection}
            onOpenSectionHandled={onControlsOpenHandled}
          />
        </aside>

        <section className={`xl:col-span-7 space-y-6 ${mobilePanel !== 'RESULTS' ? 'hidden lg:block' : ''}`}>
          <OperationsConsole {...operationsProps} showSelectionActions={false} />
          <KpiGrid isClassic={isClassic} metrics={aggregateMetrics} />
          <div className={isClassic ? 'sc-panel theme-transition p-3 min-h-[320px]' : 'rounded-panel border p-1 theme-transition bg-theme-surface1/50 border-theme-border shadow-card min-h-[320px]'}>
            <Charts data={aggregateFlow} themeId={themeId} />
          </div>
        </section>
      </div>
    </>
  );
};

export default DesignEconomicsView;
