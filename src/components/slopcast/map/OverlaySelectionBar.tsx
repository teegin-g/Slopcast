import React from 'react';

interface OverlaySelectionBarProps {
  isClassic: boolean;
  selectedCount: number;
  onAssignWells: () => void;
  onCreateGroupFromSelection: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export const OverlaySelectionBar: React.FC<OverlaySelectionBarProps> = ({
  isClassic,
  selectedCount,
  onAssignWells,
  onCreateGroupFromSelection,
  onSelectAll,
  onClearSelection,
}) => {
  const visible = selectedCount > 0;

  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : 'rounded-panel backdrop-blur-sm bg-[var(--surface-1)]/90 border border-[var(--border)] theme-transition';

  const btnClass = isClassic
    ? 'sc-btnPrimary text-[10px] px-3 py-1.5 rounded-md font-black uppercase tracking-widest'
    : 'rounded-inner border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--cyan)]/10 hover:border-[var(--cyan)]/40 transition-colors';

  const accentBtnClass = isClassic
    ? 'sc-btnPrimary text-[10px] px-3 py-1.5 rounded-md font-black uppercase tracking-widest'
    : 'rounded-inner bg-[var(--cyan)]/15 border border-[var(--cyan)]/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--cyan)] hover:bg-[var(--cyan)]/25 transition-colors';

  return (
    <div
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-all duration-200 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className={`${panelClass} px-4 py-2.5 flex items-center gap-3`}>
        <span className={`text-[10px] font-black tabular-nums ${isClassic ? 'text-white' : 'text-[var(--cyan)]'}`}>
          {selectedCount} selected
        </span>

        <div className={`w-px h-4 ${isClassic ? 'bg-white/20' : 'bg-[var(--border)]'}`} />

        <button type="button" onClick={onAssignWells} className={accentBtnClass}>
          Assign to Group
        </button>
        <button type="button" onClick={onCreateGroupFromSelection} className={btnClass}>
          New Group
        </button>
        <button type="button" onClick={onSelectAll} className={btnClass}>
          Select All
        </button>
        <button type="button" onClick={onClearSelection} className={`${btnClass} opacity-70`}>
          Clear
        </button>
      </div>
    </div>
  );
};
