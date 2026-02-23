import React, { useEffect, useState } from 'react';
import Controls from '../Controls';
import Charts from '../Charts';
import TaxControls from '../TaxControls';
import DebtControls from '../DebtControls';
import { ThemeId } from '../../theme/themes';
import { MonthlyCashFlow, Well, WellGroup, TaxAssumptions, DebtAssumptions, ReserveCategory, DEFAULT_TAX_ASSUMPTIONS, DEFAULT_DEBT_ASSUMPTIONS } from '../../types';
import KpiGrid from './KpiGrid';
import OperationsConsole, { OperationsConsoleProps } from './OperationsConsole';
import EconomicsDriversPanel, { DriverFamilyId } from './EconomicsDriversPanel';
import { WorkflowStep } from './WorkflowStepper';
import EconomicsGroupBar from './EconomicsGroupBar';
import EconomicsResultsTabs, { EconomicsResultsTab } from './EconomicsResultsTabs';
import GroupWellsTable from './GroupWellsTable';
import GroupComparisonStrip from './GroupComparisonStrip';
import MiniMapPreview from './MiniMapPreview';
import ReservesPanel from './ReservesPanel';

export type EconomicsMobilePanel = 'SETUP' | 'RESULTS';

type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP';
type AnalysisOpenSection = 'PRICING' | 'SCHEDULE' | 'SCALARS';

interface DesignEconomicsViewProps {
  isClassic: boolean;
  themeId: ThemeId;
  workflowSteps: WorkflowStep[];
  mobilePanel: EconomicsMobilePanel;
  onSetMobilePanel: (panel: EconomicsMobilePanel) => void;
  resultsTab: EconomicsResultsTab;
  onSetResultsTab: (tab: EconomicsResultsTab) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onRequestOpenControlsSection: (section: ControlsSection) => void;
  onRequestOpenAnalysisSection: (section: AnalysisOpenSection) => void;
  wells: Well[];
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
  aggregateMetrics: {
    npv10: number;
    totalCapex: number;
    eur: number;
    payoutMonths: number;
    wellCount: number;
    afterTaxNpv10?: number;
    leveredNpv10?: number;
    dscr?: number;
  };
  aggregateFlow: MonthlyCashFlow[];
  operationsProps: OperationsConsoleProps;
  breakevenOilPrice?: number | null;
  snapshotHistory?: Array<{ npv: number; capex: number; eur: number; payout: number; timestamp: number }>;
  showAfterTax?: boolean;
  showLevered?: boolean;
  onToggleAfterTax?: () => void;
  onToggleLevered?: () => void;
}

/** SVG progress ring for Setup Insights */
const SetupProgressRing: React.FC<{ completed: number; total: number; isClassic: boolean }> = ({ completed, total, isClassic }) => {
  const r = 10;
  const circumference = 2 * Math.PI * r;
  const progress = total > 0 ? completed / total : 0;
  const dashLen = progress * circumference;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0">
      <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="2" className={isClassic ? 'text-white/15' : 'text-theme-border'} />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray={`${dashLen} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
        className={isClassic ? 'text-theme-warning' : 'text-theme-cyan'}
      />
      <text x="12" y="12" textAnchor="middle" dominantBaseline="central" className="text-[7px] font-black" style={{ fill: isClassic ? 'white' : 'rgb(var(--text))' }}>
        {completed}/{total}
      </text>
    </svg>
  );
};

/** Gradient accent divider */
const AccentDivider: React.FC = () => (
  <div className="h-[2px] rounded-full bg-gradient-to-r from-theme-cyan via-theme-magenta to-theme-lavender opacity-40" />
);

/** Quick Drivers mini-panel shown in the 2-column layout */
const QuickDrivers: React.FC<{
  isClassic: boolean;
  topDrivers: Array<{ id: string; label: string; dominantDelta: number }>;
  breakevenOilPrice: number | null;
}> = ({ isClassic, topDrivers, breakevenOilPrice }) => {
  const top2 = topDrivers.slice(0, 2);
  const maxMag = Math.max(...top2.map(d => Math.abs(d.dominantDelta)), 1);

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition h-full'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border h-full'
      }
    >
      <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
        <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
          Quick Drivers
        </h2>
      </div>

      <div className="p-3 space-y-2">
        {top2.map(driver => {
          const isPositive = driver.dominantDelta >= 0;
          const barPct = (Math.abs(driver.dominantDelta) / maxMag) * 100;
          return (
            <div key={driver.id}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                  {driver.label}
                </span>
                <span className={`text-[9px] font-black tabular-nums ${isPositive ? (isClassic ? 'text-theme-warning' : 'text-theme-cyan') : 'text-theme-magenta'}`}>
                  {isPositive ? '+' : ''}${(driver.dominantDelta / 1e6).toFixed(1)}M
                </span>
              </div>
              <div className="h-1 rounded-full bg-theme-bg/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(2, barPct)}%`,
                    backgroundColor: isPositive ? 'rgb(var(--cyan))' : 'rgb(var(--magenta))',
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}

        {breakevenOilPrice != null && (
          <div className={`mt-2 pt-2 border-t ${isClassic ? 'border-white/10' : 'border-theme-border/30'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>
                Breakeven Oil
              </span>
              <span className={`text-[10px] font-black tabular-nums ${isClassic ? 'text-theme-warning' : 'text-theme-lavender'}`}>
                ${breakevenOilPrice}/bbl
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DesignEconomicsView: React.FC<DesignEconomicsViewProps> = ({
  isClassic,
  themeId,
  workflowSteps,
  mobilePanel,
  onSetMobilePanel,
  resultsTab,
  onSetResultsTab,
  focusMode,
  onToggleFocusMode,
  onRequestOpenControlsSection,
  onRequestOpenAnalysisSection,
  wells,
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
  aggregateMetrics,
  aggregateFlow,
  operationsProps,
  breakevenOilPrice,
  snapshotHistory,
  showAfterTax,
  showLevered,
  onToggleAfterTax,
  onToggleLevered,
}) => {
  const hasReadinessBlocker = !hasGroup || !hasGroupWells || !hasCapexItems;
  const [showSetupInsights, setShowSetupInsights] = useState(hasReadinessBlocker);
  const [didAutoOpenInsights, setDidAutoOpenInsights] = useState(hasReadinessBlocker);

  useEffect(() => {
    if (didAutoOpenInsights) return;
    if (!hasReadinessBlocker) return;
    setShowSetupInsights(true);
    setDidAutoOpenInsights(true);
  }, [didAutoOpenInsights, hasReadinessBlocker]);

  useEffect(() => {
    if (!focusMode) return;
    if (mobilePanel === 'RESULTS') return;
    onSetMobilePanel('RESULTS');
  }, [focusMode, mobilePanel, onSetMobilePanel]);
  const checklist = [
    { id: 'group', label: 'Choose active group', done: hasGroup },
    { id: 'wells', label: 'Assign wells to group', done: hasGroupWells },
    { id: 'capex', label: 'Confirm CAPEX items', done: hasCapexItems },
  ];

  const completedCount = checklist.filter(c => c.done).length;

  const activeWorkflowStep =
    workflowSteps.find(step => step.status === 'ACTIVE' || step.status === 'STALE') || workflowSteps[0];

  const readinessBlocker =
    !hasGroup
      ? 'Choose an active group to begin.'
      : !hasGroupWells
        ? 'Assign wells to this group in Wells workspace.'
        : !hasCapexItems
          ? 'Add CAPEX line items to see economics.'
          : 'Ready — economics are live.';

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

  const handleJumpToDriver = (driverId: DriverFamilyId) => {
    if (driverId === 'capex') {
      onRequestOpenControlsSection('CAPEX');
      onSetMobilePanel('SETUP');
      return;
    }

    if (driverId === 'eur') {
      onRequestOpenControlsSection('TYPE_CURVE');
      onSetMobilePanel('SETUP');
      return;
    }

    if (driverId === 'oil') {
      onRequestOpenAnalysisSection('PRICING');
      return;
    }

    if (driverId === 'rig') {
      onRequestOpenAnalysisSection('SCHEDULE');
    }
  };

  return (
    <>
      <EconomicsGroupBar
        isClassic={isClassic}
        groups={groups}
        activeGroupId={activeGroupId}
        onActivateGroup={onActivateGroup}
        onCloneActiveGroup={() => onCloneGroup(activeGroupId)}
        scenarioRankings={operationsProps.scenarioRankings}
        focusMode={focusMode}
        onToggleFocusMode={onToggleFocusMode}
      />

      {!focusMode && (
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:min-h-[calc(100vh-13.5rem)]">
        {!focusMode && (
          <aside
            className={`lg:col-span-5 xl:col-span-4 space-y-4 lg:max-h-[calc(100vh-13.5rem)] lg:overflow-y-auto lg:pr-1 ${
              mobilePanel !== 'SETUP' ? 'hidden lg:block' : ''
            }`}
          >
            <MiniMapPreview
              isClassic={isClassic}
              wells={wells}
              activeGroup={activeGroup}
            />

            <Controls
              group={activeGroup}
              onUpdateGroup={onUpdateGroup}
              onMarkDirty={onMarkDirty}
              openSectionKey={controlsOpenSection}
              onOpenSectionHandled={onControlsOpenHandled}
            />

            {/* Tax & Fiscal Controls */}
            <div
              className={
                isClassic
                  ? 'sc-panel theme-transition'
                  : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
              }
            >
              <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
                <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
                  Tax &amp; Fiscal
                </h2>
              </div>
              <div className="p-3">
                <TaxControls
                  isClassic={isClassic}
                  tax={activeGroup.taxAssumptions || DEFAULT_TAX_ASSUMPTIONS}
                  onChange={(tax) => onUpdateGroup({ ...activeGroup, taxAssumptions: tax })}
                />
              </div>
            </div>

            {/* Leverage / Debt Controls */}
            <div
              className={
                isClassic
                  ? 'sc-panel theme-transition'
                  : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
              }
            >
              <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
                <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
                  Leverage
                </h2>
              </div>
              <div className="p-3">
                <DebtControls
                  isClassic={isClassic}
                  debt={activeGroup.debtAssumptions || DEFAULT_DEBT_ASSUMPTIONS}
                  onChange={(debt) => onUpdateGroup({ ...activeGroup, debtAssumptions: debt })}
                />
              </div>
            </div>

            {/* Reserve Category Selector */}
            <div
              className={
                isClassic
                  ? 'sc-panel theme-transition'
                  : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
              }
            >
              <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
                <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
                  Reserve Category
                </h2>
              </div>
              <div className="p-3">
                <select
                  value={activeGroup.reserveCategory || 'PDP'}
                  onChange={(e) => onUpdateGroup({ ...activeGroup, reserveCategory: e.target.value as ReserveCategory })}
                  className={
                    isClassic
                      ? 'w-full rounded-md px-2 py-1 text-[10px] font-black sc-inputNavy'
                      : 'w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-cyan theme-transition'
                  }
                >
                  <option value="PDP">PDP (Proved Developed)</option>
                  <option value="PUD">PUD (Proved Undeveloped)</option>
                  <option value="PROBABLE">Probable</option>
                  <option value="POSSIBLE">Possible</option>
                </select>
              </div>
            </div>

            <GroupWellsTable
              isClassic={isClassic}
              group={activeGroup}
              wells={wells}
              title="Wells in active group"
              defaultSort={{ key: 'name', dir: 'asc' }}
              dense
            />

            {/* Setup Insights - compact vertical checklist with progress ring */}
            <div
              className={
                isClassic
                  ? 'sc-panel theme-transition'
                  : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
              }
            >
              <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SetupProgressRing completed={completedCount} total={checklist.length} isClassic={isClassic} />
                    <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
                      Setup Insights
                    </h2>
                  </div>
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
        )}

        <section
          className={`space-y-4 lg:max-h-[calc(100vh-13.5rem)] lg:overflow-y-auto lg:pr-1 ${
            focusMode ? 'lg:col-span-12 xl:col-span-12' : 'lg:col-span-7 xl:col-span-8'
          } ${
            !focusMode && mobilePanel !== 'RESULTS' ? 'hidden lg:block' : ''
          }`}
        >
          <EconomicsResultsTabs isClassic={isClassic} tab={resultsTab} onChange={onSetResultsTab} />

          {resultsTab === 'SUMMARY' && (
            <div className="space-y-4">
              {/* Hero NPV + stat strip */}
              <KpiGrid
                isClassic={isClassic}
                metrics={aggregateMetrics}
                aggregateFlow={aggregateFlow}
                breakevenOilPrice={breakevenOilPrice}
                snapshotHistory={snapshotHistory}
                showAfterTax={showAfterTax}
                showLevered={showLevered}
              />

              {/* Accent divider */}
              <AccentDivider />

              {/* 2-column: Group Comparison + Quick Drivers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GroupComparisonStrip
                  isClassic={isClassic}
                  groups={groups}
                  activeGroupId={activeGroupId}
                  onActivateGroup={onActivateGroup}
                  scenarioRankings={operationsProps.scenarioRankings}
                />
                <QuickDrivers
                  isClassic={isClassic}
                  topDrivers={operationsProps.topDrivers}
                  breakevenOilPrice={operationsProps.breakevenOilPrice}
                />
              </div>

              {/* Accent divider before Execution */}
              {!focusMode && <AccentDivider />}

              {!focusMode && (
                <div className="pt-1">
                  <p className={isClassic
                    ? 'text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3'
                    : 'text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted/60 mb-3'
                  }>
                    Execution
                  </p>
                </div>
              )}

              {/* Compact run bar */}
              {!focusMode && <OperationsConsole {...operationsProps} showSelectionActions={false} compactEconomics />}
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
              onJumpToDriver={handleJumpToDriver}
              baseNpv={aggregateMetrics.npv10}
            />
          )}

          {resultsTab === 'RESERVES' && (
            <ReservesPanel
              isClassic={isClassic}
              groups={groups}
            />
          )}

          {!focusMode && resultsTab !== 'SUMMARY' && (
            <OperationsConsole {...operationsProps} showSelectionActions={false} compactEconomics />
          )}
        </section>
      </div>
    </>
  );
};

export default DesignEconomicsView;
