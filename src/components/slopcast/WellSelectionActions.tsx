import React from 'react';

export interface WellSelectionActionsProps {
  isClassic: boolean;
  selectedWellCount: number;
  selectFilteredLabel: string;
  onAssignWells: () => void;
  onCreateGroupFromSelection: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

/**
 * Desktop "Selection Actions" panel — the 4-button grid rendered below the map
 * in DesignWellsView when the layout is not the mobile-map view (!isMobileMap).
 *
 * data-testids preserved exactly as in the original:
 *   wells-selection-actions-select-filtered (Select filtered button)
 *   wells-selection-actions-clear           (Clear button)
 */
const WellSelectionActions: React.FC<WellSelectionActionsProps> = ({
  isClassic,
  selectedWellCount,
  selectFilteredLabel,
  onAssignWells,
  onCreateGroupFromSelection,
  onSelectAll,
  onClearSelection,
}) => (
  <div className={isClassic ? 'sc-panel theme-transition' : 'rounded-panel border shadow-card p-4 theme-transition bg-theme-surface1 border-theme-border'}>
    <h3 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.2em] text-white mb-3' : 'text-[10px] font-black uppercase tracking-[0.2em] text-theme-cyan mb-3'}>
      Selection Actions
    </h3>
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onAssignWells}
        disabled={selectedWellCount === 0}
        className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
          selectedWellCount > 0 ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan' : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
        }`}
      >
        Assign to active group
      </button>
      <button
        type="button"
        onClick={onCreateGroupFromSelection}
        disabled={selectedWellCount === 0}
        className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
          selectedWellCount > 0 ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan' : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
        }`}
      >
        Create group from selection
      </button>
      <button
        type="button"
        onClick={onSelectAll}
        data-testid="wells-selection-actions-select-filtered"
        className="px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all bg-theme-surface2 text-theme-text border border-theme-border hover:border-theme-cyan"
      >
        {selectFilteredLabel}
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        disabled={selectedWellCount === 0}
        data-testid="wells-selection-actions-clear"
        className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border ${
          selectedWellCount > 0 ? 'bg-theme-surface2 text-theme-text border-theme-border hover:border-theme-cyan' : 'bg-theme-surface2 text-theme-muted border-theme-border cursor-not-allowed'
        }`}
      >
        Clear
      </button>
    </div>
  </div>
);

export default WellSelectionActions;
