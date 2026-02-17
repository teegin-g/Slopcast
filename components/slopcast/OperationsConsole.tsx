import React, { useState } from 'react';

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

  const showDriverPane = !compactEconomics && opsTab === 'KEY_DRIVERS';
  const showSelectionSummary = showSelectionActions || !compactEconomics;

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
            {compactEconomics ? 'Run Panel' : 'Operations Console'}
          </h3>

          {!compactEconomics && (
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
          )}
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

              {compactEconomics && !showValidationDetails ? (
                <button
                  type="button"
                  onClick={() => setShowValidationDetails(true)}
                  className="w-full rounded-inner border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-theme-cyan bg-theme-bg border-theme-border text-left"
                >
                  Show Validation
                </button>
              ) : (
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
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topDrivers.map(driver => (
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
                  <p className="text-[10px] text-theme-muted">{biggestPositive?.label || 'n/a'}</p>
                  <p className="text-lg font-black text-theme-cyan">{biggestPositive ? `${(biggestPositive.deltaNpv / 1e6).toFixed(1)} MM` : '-'}</p>
                </div>
                <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Biggest Downside</p>
                  <p className="text-[10px] text-theme-muted">{biggestNegative?.label || 'n/a'}</p>
                  <p className="text-lg font-black text-theme-magenta">{biggestNegative ? `${(biggestNegative.deltaNpv / 1e6).toFixed(1)} MM` : '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Breakeven Oil</p>
                  <p className="text-2xl font-black text-theme-text">
                    {breakevenOilPrice !== null ? `$${breakevenOilPrice.toFixed(1)}` : 'Out of range'}
                  </p>
                </div>
                <div className="rounded-inner border p-3 bg-theme-bg border-theme-border">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender">Payout Highlights</p>
                  <p className="text-[10px] text-theme-muted">Portfolio: {payoutMonths > 0 ? `${payoutMonths} mo` : '-'}</p>
                  <p className="text-[10px] text-theme-muted">Fastest: {fastestPayoutScenarioName}</p>
                </div>
              </div>

              <div className="rounded-inner border overflow-hidden bg-theme-bg border-theme-border">
                <div className="px-3 py-2 border-b text-[9px] font-bold uppercase tracking-[0.2em] text-theme-lavender border-theme-border">
                  Scenario Rank (NPV / ROI)
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {scenarioRankings.map((row, idx) => (
                    <div key={row.id} className="px-3 py-2 text-[10px] border-b border-theme-border/30 flex items-center justify-between text-theme-muted">
                      <span className="font-semibold text-theme-text">{idx + 1}. {row.name}</span>
                      <span>NPV {(row.npv10 / 1e6).toFixed(1)} | ROI {row.roi.toFixed(2)}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationsConsole;
