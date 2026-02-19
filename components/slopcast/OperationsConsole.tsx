import React, { useState } from 'react';
import EconomicsDriversPanel from './EconomicsDriversPanel';

type OpsTab = 'SELECTION_ACTIONS' | 'KEY_DRIVERS';

interface DriverInsight {
  id: string;
  label: string;
  dominantDelta: number;
}

interface ShockSummary {
  label: string;
  deltaNpv: number;
}

interface ScenarioRanking {
  id: string;
  name: string;
  npv10: number;
  roi: number;
}

export interface OperationsConsoleProps {
  isClassic: boolean;
  opsTab: OpsTab;
  onOpsTabChange: (next: OpsTab) => void;
  selectedVisibleCount: number;
  filteredVisibleCount: number;
  activeGroupName: string;
  onAssign?: () => void;
  onCreateGroup?: () => void;
  onSelectAll?: () => void;
  onClear?: () => void;
  onRunEconomics: () => void;
  onSaveScenario: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  canAssign?: boolean;
  canClear?: boolean;
  canRun: boolean;
  canUseSecondaryActions: boolean;
  lastEconomicsRunAt: string | null;
  actionMessage: string;
  validationWarnings: string[];
  stepGuidance: string;
  needsRerun: boolean;
  topDrivers: DriverInsight[];
  biggestPositive: ShockSummary | null;
  biggestNegative: ShockSummary | null;
  breakevenOilPrice: number | null;
  payoutMonths: number;
  fastestPayoutScenarioName: string;
  scenarioRankings: ScenarioRanking[];
  showSelectionActions?: boolean;
  compactEconomics?: boolean;
}

const buttonTone = (isClassic: boolean, active: boolean) => {
  if (isClassic) {
    return active
      ? 'bg-theme-warning text-black border-black/20'
      : 'bg-black/20 text-white border-black/30';
  }

  return active
    ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan'
    : 'text-theme-muted';
};

const CompactRunBar: React.FC<{
  isClassic: boolean;
  canRun: boolean;
  canUseSecondaryActions: boolean;
  onRunEconomics: () => void;
  onSaveScenario: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  lastEconomicsRunAt: string | null;
  needsRerun: boolean;
  actionMessage: string;
  validationWarnings: string[];
  stepGuidance: string;
}> = ({
  isClassic,
  canRun,
  canUseSecondaryActions,
  onRunEconomics,
  onSaveScenario,
  onExportCsv,
  onExportPdf,
  lastEconomicsRunAt,
  needsRerun,
  actionMessage,
  validationWarnings,
  stepGuidance,
}) => {
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const statusText = lastEconomicsRunAt
    ? `Last run ${new Date(lastEconomicsRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not yet run';

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1 border-theme-border overflow-hidden'
      }
    >
      {/* Primary action row */}
      <div className={isClassic ? 'p-3 flex items-center gap-2 flex-wrap' : 'p-3 flex items-center gap-2 flex-wrap'}>
        <button
          onClick={onRunEconomics}
          disabled={!canRun}
          className={`px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.14em] transition-all shrink-0 ${
            canRun
              ? 'bg-theme-magenta text-white hover:shadow-glow-magenta'
              : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
          }`}
        >
          Run Economics
        </button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span data-testid="economics-run-status" className="text-[10px] text-theme-muted truncate">
            {statusText}
          </span>
          {needsRerun && (
            <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-theme-warning/15 text-theme-warning border border-theme-warning/20 shrink-0">
              rerun
            </span>
          )}
          {actionMessage && (
            <span className="text-[10px] text-theme-cyan truncate">{actionMessage}</span>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowOverflow(prev => !prev)}
            className="px-2 py-1.5 rounded-inner border border-theme-border bg-theme-bg text-theme-muted hover:text-theme-text text-xs font-bold transition-colors"
            aria-label="More actions"
          >
            ···
          </button>
          {showOverflow && (
            <div className="absolute right-0 top-full mt-1 z-30 rounded-inner border border-theme-border bg-theme-surface1 shadow-card p-1 min-w-[140px]">
              {[
                { label: 'Save Scenario', action: onSaveScenario },
                { label: 'Export CSV', action: onExportCsv },
                { label: 'Export PDF', action: onExportPdf },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setShowOverflow(false); }}
                  disabled={!canUseSecondaryActions}
                  className={`w-full text-left px-3 py-1.5 rounded-inner text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                    canUseSecondaryActions
                      ? 'text-theme-text hover:bg-theme-surface2'
                      : 'text-theme-muted cursor-not-allowed'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible details drawer */}
      <div className="border-t border-theme-border/40">
        <button
          type="button"
          onClick={() => setShowDetails(prev => !prev)}
          className="w-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted hover:text-theme-cyan transition-colors flex items-center justify-between"
        >
          <span>{showDetails ? 'Hide Details' : 'Guidance & Validation'}</span>
          <span className={`transform transition-transform duration-300 text-[8px] ${showDetails ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showDetails && (
          <div className="px-3 pb-3 space-y-2">
            <div className="rounded-inner border px-3 py-2 text-[10px] bg-theme-bg border-theme-border text-theme-muted">
              {stepGuidance}
            </div>
            <div className="rounded-inner border px-3 py-2 bg-theme-bg border-theme-border space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-theme-lavender">Validation</p>
              {validationWarnings.length > 0 ? (
                <>
                  <p className="text-[10px] text-theme-muted">{validationWarnings.length} checks need attention.</p>
                  {validationWarnings.map((w) => (
                    <p key={w} className="text-[10px] text-theme-muted pl-2 border-l-2 border-theme-warning/30">{w}</p>
                  ))}
                </>
              ) : (
                <p className="text-[10px] text-theme-muted">All checks passed.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OperationsConsole: React.FC<OperationsConsoleProps> = ({
  isClassic,
  opsTab,
  onOpsTabChange,
  selectedVisibleCount,
  filteredVisibleCount,
  activeGroupName,
  onAssign,
  onCreateGroup,
  onSelectAll,
  onClear,
  onRunEconomics,
  onSaveScenario,
  onExportCsv,
  onExportPdf,
  canAssign,
  canClear,
  canRun,
  canUseSecondaryActions,
  lastEconomicsRunAt,
  actionMessage,
  validationWarnings,
  stepGuidance,
  needsRerun,
  topDrivers,
  biggestPositive,
  biggestNegative,
  breakevenOilPrice,
  payoutMonths,
  fastestPayoutScenarioName,
  scenarioRankings,
  showSelectionActions = true,
  compactEconomics = false,
}) => {
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  if (compactEconomics) {
    return (
      <CompactRunBar
        isClassic={isClassic}
        canRun={canRun}
        canUseSecondaryActions={canUseSecondaryActions}
        onRunEconomics={onRunEconomics}
        onSaveScenario={onSaveScenario}
        onExportCsv={onExportCsv}
        onExportPdf={onExportPdf}
        lastEconomicsRunAt={lastEconomicsRunAt}
        needsRerun={needsRerun}
        actionMessage={actionMessage}
        validationWarnings={validationWarnings}
        stepGuidance={stepGuidance}
      />
    );
  }

  const showDriverPane = opsTab === 'KEY_DRIVERS';
  const showSelectionSummary = showSelectionActions;

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition'
          : 'rounded-panel border shadow-card p-4 md:p-6 relative overflow-hidden theme-transition bg-theme-surface1 border-theme-border'
      }
    >
      {!isClassic && <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] bg-theme-magenta/20" />}

      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3
            className={
              isClassic
                ? 'text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-white px-4 pt-4'
                : 'text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3 text-theme-magenta'
            }
          >
            <span className="text-lg leading-none">{isClassic ? '🧱' : '🏢'}</span>
            Operations Console
          </h3>

          <div className={isClassic ? 'flex items-center gap-2 px-4 pt-4' : 'flex items-center gap-2 p-1 rounded-inner border bg-theme-bg/70 border-theme-border'}>
            <button
              onClick={() => onOpsTabChange('SELECTION_ACTIONS')}
              className={`px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] transition-all border ${buttonTone(isClassic, opsTab === 'SELECTION_ACTIONS')}`}
            >
              {showSelectionActions ? 'Selection' : 'Run Panel'}
            </button>
            <button
              onClick={() => onOpsTabChange('KEY_DRIVERS')}
              className={`px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] transition-all border ${buttonTone(isClassic, opsTab === 'KEY_DRIVERS')}`}
            >
              Key Drivers
            </button>
          </div>
        </div>

        <div className={isClassic ? 'p-4 space-y-4' : 'space-y-4'}>
          {!showDriverPane ? (
            <>
              <div className="rounded-inner border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] bg-theme-bg border-theme-border text-theme-muted">
                {stepGuidance}
              </div>

              {showSelectionSummary && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Selected Wells</p>
                    <p className="text-2xl font-black text-theme-text">{selectedVisibleCount}</p>
                    <p className="text-[9px] text-theme-muted uppercase tracking-[0.16em]">of {filteredVisibleCount} visible</p>
                  </div>
                  <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Active Group</p>
                    <p className="text-sm font-black text-theme-text truncate">{activeGroupName}</p>
                  </div>
                </div>
              )}

              {showSelectionActions && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onAssign}
                    disabled={!canAssign}
                    className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                      canAssign
                        ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan'
                        : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
                    }`}
                  >
                    Assign
                  </button>
                  <button
                    onClick={onCreateGroup}
                    disabled={!canAssign}
                    className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                      canAssign
                        ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan'
                        : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
                    }`}
                  >
                    Create Group
                  </button>
                  <button
                    onClick={onSelectAll}
                    className="px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all bg-theme-surface2 text-theme-text border border-theme-border hover:border-theme-cyan"
                  >
                    Select All
                  </button>
                  <button
                    onClick={onClear}
                    disabled={!canClear}
                    className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border ${
                      canClear
                        ? 'bg-theme-surface2 text-theme-text border-theme-border hover:border-theme-cyan'
                        : 'bg-theme-surface2 text-theme-muted cursor-not-allowed border-theme-border'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={onRunEconomics}
                  disabled={!canRun}
                  className={`w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
                    canRun
                      ? 'bg-theme-magenta text-white hover:shadow-glow-magenta'
                      : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
                  }`}
                >
                  Run Economics
                </button>

                <button
                  onClick={() => setShowSecondaryActions(prev => !prev)}
                  className="w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.14em] transition-all border border-theme-border bg-theme-bg text-theme-muted hover:text-theme-text"
                >
                  {showSecondaryActions ? 'Hide More Actions' : 'More Actions'}
                </button>

                {showSecondaryActions && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={onSaveScenario}
                      disabled={!canUseSecondaryActions}
                      className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border ${
                        canUseSecondaryActions
                          ? 'bg-theme-bg text-theme-text border-theme-border hover:border-theme-cyan'
                          : 'bg-theme-surface2 text-theme-muted border-theme-border cursor-not-allowed'
                      }`}
                    >
                      Save Scenario
                    </button>
                    <button
                      onClick={onExportCsv}
                      disabled={!canUseSecondaryActions}
                      className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border ${
                        canUseSecondaryActions
                          ? 'bg-theme-bg text-theme-text border-theme-border hover:border-theme-cyan'
                          : 'bg-theme-surface2 text-theme-muted border-theme-border cursor-not-allowed'
                      }`}
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={onExportPdf}
                      disabled={!canUseSecondaryActions}
                      className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border ${
                        canUseSecondaryActions
                          ? 'bg-theme-bg text-theme-text border-theme-border hover:border-theme-cyan'
                          : 'bg-theme-surface2 text-theme-muted border-theme-border cursor-not-allowed'
                      }`}
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>

              <div data-testid="economics-run-status" className="rounded-inner border px-3 py-2 text-[10px] bg-theme-bg border-theme-border text-theme-muted">
                {lastEconomicsRunAt
                  ? `Last run: ${new Date(lastEconomicsRunAt).toLocaleString()}`
                  : 'Last run: not yet triggered'}
                {needsRerun && <span className="ml-2 text-theme-warning">Inputs changed, rerun needed.</span>}
                {actionMessage && <span className="ml-2 text-theme-cyan">{actionMessage}</span>}
              </div>

              <div className="rounded-inner border p-3 bg-theme-bg border-theme-border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Validation</p>
                  <button
                    type="button"
                    onClick={() => setShowValidationDetails(prev => !prev)}
                    className="text-[9px] font-black uppercase tracking-[0.16em] text-theme-cyan"
                  >
                    {showValidationDetails ? 'Hide' : 'Details'}
                  </button>
                </div>
                {validationWarnings.length > 0 ? (
                  <p className="text-[10px] text-theme-muted">
                    {validationWarnings.length} checks need attention.
                  </p>
                ) : (
                  <p className="text-[10px] text-theme-muted">All checks passed.</p>
                )}
                {showValidationDetails && validationWarnings.length > 0 && (
                  <div className="space-y-1">
                    {validationWarnings.map((warning) => (
                      <p key={warning} className="text-[10px] text-theme-muted">{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <EconomicsDriversPanel
              isClassic={isClassic}
              topDrivers={topDrivers}
              biggestPositive={biggestPositive}
              biggestNegative={biggestNegative}
              breakevenOilPrice={breakevenOilPrice}
              payoutMonths={payoutMonths}
              fastestPayoutScenarioName={fastestPayoutScenarioName}
              scenarioRankings={scenarioRankings}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsConsole;
