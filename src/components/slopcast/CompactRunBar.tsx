import React, { useState } from 'react';

export interface CompactRunBarProps {
  isClassic: boolean;
  canUseSecondaryActions: boolean;
  onSaveSnapshot: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  lastSnapshotAt: string | null;
  actionMessage: string;
  validationWarnings: string[];
  stepGuidance: string;
}

const CompactRunBar: React.FC<CompactRunBarProps> = ({
  isClassic,
  canUseSecondaryActions,
  onSaveSnapshot,
  onExportCsv,
  onExportPdf,
  lastSnapshotAt,
  actionMessage,
  validationWarnings,
  stepGuidance,
}) => {
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const statusText = lastSnapshotAt
    ? `Last snapshot ${new Date(lastSnapshotAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Live economics — auto-computed';

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1 border-theme-border overflow-hidden'
      }
    >
      {canUseSecondaryActions ? (
        <>
          {/* Primary action row */}
          <div className={isClassic ? 'p-3 flex items-center gap-2 flex-wrap' : 'p-3 flex items-center gap-2 flex-wrap'}>
            <button
              type="button"
              onClick={onSaveSnapshot}
              className="px-4 py-2 rounded-inner text-xs font-black uppercase tracking-[0.14em] transition-all shrink-0 bg-theme-magenta text-theme-bg hover:shadow-glow-magenta"
            >
              Save Snapshot
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="inline-block size-1.5 rounded-full bg-theme-cyan animate-pulse shrink-0" />
              <span data-testid="economics-run-status" className="text-xs text-theme-muted truncate">
                {statusText}
              </span>
              {actionMessage && (
                <span className="text-xs text-theme-cyan truncate">{actionMessage}</span>
              )}
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowOverflow(prev => !prev)}
                className="px-2 py-1.5 rounded-inner border border-theme-border bg-theme-bg text-theme-muted hover:text-theme-text text-xs font-bold transition-colors"
                aria-label="More actions"
              >
                ···
              </button>
              {showOverflow && (
                <div className="absolute right-0 top-full mt-1 z-30 rounded-inner border border-theme-border bg-theme-surface1 shadow-card p-1 min-w-[140px]">
                  {[
                    { label: 'Export CSV', action: onExportCsv },
                    { label: 'Export PDF', action: onExportPdf },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => { item.action(); setShowOverflow(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-inner text-xs font-bold uppercase tracking-[0.1em] transition-colors text-theme-text hover:bg-theme-surface2"
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
              className="w-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-theme-muted hover:text-theme-cyan transition-colors flex items-center justify-between"
            >
              <span>{showDetails ? 'Hide Details' : 'Guidance & Validation'}</span>
              <span className={`transform transition-transform duration-300 text-[10px] ${showDetails ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showDetails && (
              <div className="px-3 pb-3 space-y-2">
                <div className="rounded-inner border px-3 py-2 text-xs bg-theme-bg border-theme-border text-theme-muted">
                  {stepGuidance}
                </div>
                <div className="rounded-inner border px-3 py-2 bg-theme-bg border-theme-border space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-theme-lavender">Validation</p>
                  {validationWarnings.length > 0 ? (
                    <>
                      <p className="text-xs text-theme-muted">{validationWarnings.length} checks need attention.</p>
                      {validationWarnings.map((w) => (
                        <p key={w} className="text-xs text-theme-muted pl-2 border-l-2 border-theme-warning/30">{w}</p>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-theme-muted">All checks passed.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-inner border p-6 bg-theme-bg border-theme-border text-center mx-3 my-3">
          <div className="text-2xl mb-3">⚙️</div>
          <p className="text-[11px] font-bold text-theme-text mb-2">Complete setup to continue</p>
          <p className="text-xs text-theme-muted">{stepGuidance}</p>
        </div>
      )}
    </div>
  );
};

export default CompactRunBar;
