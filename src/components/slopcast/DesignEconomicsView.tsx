import React, { useEffect, useState } from 'react';
import Controls from '../Controls';
import Charts from '../Charts';
import TaxControls from '../TaxControls';
import DebtControls from '../DebtControls';
import { ThemeId } from '../../theme/themes';
import { MonthlyCashFlow, Well, WellGroup, ReserveCategory, DEFAULT_TAX_ASSUMPTIONS, DEFAULT_DEBT_ASSUMPTIONS } from '../../types';
import KpiGrid from './KpiGrid';
import OperationsConsole, { OperationsConsoleProps } from './OperationsConsole';
import EconomicsDriversPanel, { DriverFamilyId } from './EconomicsDriversPanel';
import { WorkflowStep } from './WorkflowStepper';
import EconomicsGroupBar from './EconomicsGroupBar';
import EconomicsResultsTabs, { EconomicsResultsTab } from './EconomicsResultsTabs';
import GroupWellsTable from './GroupWellsTable';
import GroupComparisonStrip from './GroupComparisonStrip';
import ReservesPanel from './ReservesPanel';
import CashFlowTable from './CashFlowTable';
import { ViewTransition } from '../layout/ViewTransition';
import { useDebouncedRecalc } from './hooks/useDebouncedRecalc';
import { RecalcStatusProvider } from './hooks/useRecalcStatus';

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

type AdvancedConfigSection = 'FINANCIAL' | 'RESERVES' | 'GROUP_WELLS';

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
          : 'utility-surface theme-transition h-full'
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
  const { debouncedUpdate, isRecalculating } = useDebouncedRecalc(onUpdateGroup, 400);
  const hasReadinessBlocker = !hasGroup || !hasGroupWells || !hasCapexItems;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedSection, setAdvancedSection] = useState<AdvancedConfigSection>('FINANCIAL');

  useEffect(() => {
    if (!focusMode) return;
    if (mobilePanel === 'RESULTS') return;
    onSetMobilePanel('RESULTS');
  }, [focusMode, mobilePanel, onSetMobilePanel]);

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
                  ? `px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                      mobilePanel === 'SETUP' ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                    }`
                  : `px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-widest border transition-colors ${
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
                  ? `px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                      mobilePanel === 'RESULTS' ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                    }`
                  : `px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-widest border transition-colors ${
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
            {hasReadinessBlocker && (
              <div
                className={
                  isClassic
                    ? 'sc-panel theme-transition'
                    : 'rounded-inner utility-inset px-4 py-3 theme-transition'
                }
              >
                <p className={isClassic ? 'text-[9px] font-black uppercase tracking-[0.16em] text-theme-warning' : 'text-[9px] font-black uppercase tracking-[0.16em] text-theme-lavender'}>
                  Current blocker
                </p>
                <p className={isClassic ? 'mt-1 text-[10px] text-white/80' : 'mt-1 text-[10px] text-theme-muted'}>
                  {readinessBlocker}
                </p>
              </div>
            )}

            <Controls
              group={activeGroup}
              onUpdateGroup={debouncedUpdate}
              onMarkDirty={onMarkDirty}
            />

            <div
              className={
                isClassic
                  ? 'sc-panel theme-transition'
                  : 'utility-surface theme-transition'
              }
            >
              <button
                type="button"
                onClick={() => setAdvancedOpen(prev => !prev)}
                className={`w-full px-4 py-2.5 flex items-center justify-between ${
                  isClassic
                    ? 'sc-panelTitlebar sc-titlebar--neutral hover:bg-black/10'
                    : 'border-b border-theme-border/60 hover:bg-theme-surface2/30'
                } transition-colors`}
              >
                <h2 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.24em] text-white' : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'}>
                  Advanced Configuration
                </h2>
                <span className={`transform transition-transform duration-300 text-xs ${advancedOpen ? 'rotate-180' : ''} ${
                  isClassic ? 'text-white/50' : 'text-theme-muted'
                }`}>
                  ▼
                </span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  advancedOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: 'FINANCIAL', label: 'Financial' },
                      { id: 'RESERVES', label: 'Reserves' },
                      { id: 'GROUP_WELLS', label: 'Group Wells' },
                    ] as const).map((item) => {
                      const isActive = advancedSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAdvancedSection(item.id)}
                          className={
                            isClassic
                              ? `px-3 py-1.5 rounded-inner border-2 text-[9px] font-black uppercase tracking-[0.14em] transition-colors ${
                                  isActive ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/85 border-black/25'
                                }`
                              : `px-3 py-1.5 rounded-inner border text-[9px] font-black uppercase tracking-[0.14em] transition-colors ${
                                  isActive
                                    ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                                    : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text'
                                }`
                          }
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {advancedSection === 'FINANCIAL' && (
                    <div className="space-y-3">
                      <div className="rounded-inner utility-inset p-3">
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-theme-lavender">
                          Tax &amp; Fiscal
                        </p>
                        <TaxControls
                          isClassic={isClassic}
                          tax={activeGroup.taxAssumptions || DEFAULT_TAX_ASSUMPTIONS}
                          onChange={(tax) => onUpdateGroup({ ...activeGroup, taxAssumptions: tax })}
                        />
                      </div>

                      <div className="rounded-inner utility-inset p-3">
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-theme-lavender">
                          Leverage
                        </p>
                        <DebtControls
                          isClassic={isClassic}
                          debt={activeGroup.debtAssumptions || DEFAULT_DEBT_ASSUMPTIONS}
                          onChange={(debt) => onUpdateGroup({ ...activeGroup, debtAssumptions: debt })}
                        />
                      </div>
                    </div>
                  )}

                  {advancedSection === 'RESERVES' && (
                    <div className="rounded-inner utility-inset p-3">
                      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-theme-lavender">
                        Reserve Category
                      </p>
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
                  )}

                  {advancedSection === 'GROUP_WELLS' && (
                    <div className="rounded-inner utility-inset p-3">
                      <GroupWellsTable
                        isClassic={isClassic}
                        group={activeGroup}
                        wells={wells}
                        title="Wells in active group"
                        defaultSort={{ key: 'name', dir: 'asc' }}
                        dense
                      />
                    </div>
                  )}
                </div>
              </div>
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

          <RecalcStatusProvider isRecalculating={isRecalculating}>
          <ViewTransition transitionKey={resultsTab}>
            {resultsTab === 'SUMMARY' && (
              <div className="space-y-4">
                {/* Hero NPV + stat strip */}
                <KpiGrid
                  isClassic={isClassic}
                  metrics={aggregateMetrics}
                  aggregateFlow={aggregateFlow}
                  snapshotHistory={snapshotHistory}
                  showAfterTax={showAfterTax}
                  showLevered={showLevered}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <GroupComparisonStrip
                    isClassic={isClassic}
                    groups={groups}
                    activeGroupId={activeGroupId}
                    onActivateGroup={onActivateGroup}
                    scenarioRankings={operationsProps.scenarioRankings}
                  />
                  {operationsProps.topDrivers.length > 0 && (
                    <QuickDrivers
                      isClassic={isClassic}
                      topDrivers={operationsProps.topDrivers}
                      breakevenOilPrice={operationsProps.breakevenOilPrice}
                    />
                  )}
                </div>
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

            {resultsTab === 'CASH_FLOW' && (
              <CashFlowTable
                flow={aggregateFlow}
                pricing={activeGroup.pricing}
              />
            )}

            {resultsTab === 'RESERVES' && (
              <ReservesPanel
                isClassic={isClassic}
                groups={groups}
              />
            )}
          </ViewTransition>
          </RecalcStatusProvider>

          {!focusMode && (
            <OperationsConsole {...operationsProps} showSelectionActions={false} compactEconomics />
          )}
        </section>
      </div>

      {/* Mobile Sticky Action Strip */}
      {!focusMode && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md lg:hidden px-4 py-3 border-t ${
            isClassic
              ? 'bg-black/70 border-white/10'
              : 'bg-theme-bg/80 border-theme-border/60'
          }`}
        >
          {mobilePanel === 'SETUP' ? (
            <button
              type="button"
              onClick={() => onSetMobilePanel('RESULTS')}
              className={`w-full py-2.5 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                isClassic
                  ? 'bg-theme-warning text-black border-2 border-black/20 shadow-card'
                  : 'bg-theme-cyan text-theme-bg border border-theme-cyan shadow-glow-cyan'
              }`}
            >
              View Results &rarr;
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSetMobilePanel('SETUP')}
              className={`w-full py-2.5 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                isClassic
                  ? 'bg-black/30 text-white/90 border-2 border-black/25 shadow-card'
                  : 'bg-theme-surface1 text-theme-text border border-theme-border'
              }`}
            >
              &larr; Edit Setup
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default React.memo(DesignEconomicsView);
