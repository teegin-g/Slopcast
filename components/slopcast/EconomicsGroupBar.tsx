import React, { useMemo } from 'react';
import { WellGroup } from '../../types';

export interface EconomicsGroupBarProps {
  isClassic: boolean;
  groups: WellGroup[];
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  onCloneActiveGroup: () => void;
  onJumpToWells: () => void;
  needsRerun: boolean;
  canRun: boolean;
}

const statusClass = (isClassic: boolean, needsRerun: boolean) => {
  if (isClassic) {
    return needsRerun ? 'bg-theme-warning text-black' : 'bg-theme-cyan text-white';
  }
  return needsRerun ? 'bg-theme-warning text-theme-bg' : 'bg-theme-cyan text-theme-bg';
};

const EconomicsGroupBar: React.FC<EconomicsGroupBarProps> = ({
  isClassic,
  groups,
  activeGroupId,
  onActivateGroup,
  onCloneActiveGroup,
  onJumpToWells,
  needsRerun,
  canRun,
}) => {
  const activeIndex = useMemo(() => {
    const idx = groups.findIndex(group => group.id === activeGroupId);
    return idx >= 0 ? idx : 0;
  }, [activeGroupId, groups]);

  const activeGroup = groups[activeIndex] || groups[0];

  const cycleGroup = (direction: -1 | 1) => {
    if (groups.length === 0) return;
    const nextIndex = (activeIndex + direction + groups.length) % groups.length;
    onActivateGroup(groups[nextIndex].id);
  };

  return (
    <div
      data-testid="economics-group-bar"
      className={`lg:sticky lg:top-[84px] lg:z-20 mb-4 border p-3 theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/70 border-theme-border shadow-card backdrop-blur-sm'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[220px] flex-1">
          <p className={isClassic ? 'text-[9px] font-black uppercase tracking-[0.2em] text-white/90 mb-1' : 'text-[9px] font-black uppercase tracking-[0.2em] text-theme-cyan mb-1'}>
            Economics Group
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous group"
              onClick={() => cycleGroup(-1)}
              className={
                isClassic
                  ? 'px-2 py-2 rounded-inner border-2 border-black/25 bg-black/20 text-white/85 text-[10px] font-black uppercase tracking-[0.1em]'
                  : 'px-2 py-2 rounded-inner border border-theme-border bg-theme-bg text-theme-muted text-[10px] font-black uppercase tracking-[0.1em] hover:text-theme-text'
              }
            >
              Prev
            </button>
            <select
              data-testid="economics-group-select"
              value={activeGroup?.id || ''}
              onChange={(event) => onActivateGroup(event.target.value)}
              className={
                isClassic
                  ? 'flex-1 rounded-inner border-2 border-black/25 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white'
                  : 'flex-1 rounded-inner border border-theme-border bg-theme-bg px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-theme-text'
              }
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} • {group.wellIds.size} wells
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Next group"
              onClick={() => cycleGroup(1)}
              className={
                isClassic
                  ? 'px-2 py-2 rounded-inner border-2 border-black/25 bg-black/20 text-white/85 text-[10px] font-black uppercase tracking-[0.1em]'
                  : 'px-2 py-2 rounded-inner border border-theme-border bg-theme-bg text-theme-muted text-[10px] font-black uppercase tracking-[0.1em] hover:text-theme-text'
              }
            >
              Next
            </button>
          </div>
          {activeGroup && (
            <p data-testid="economics-active-group-label" className="text-[10px] mt-2 text-theme-muted">
              {activeGroup.name} • {activeGroup.wellIds.size} wells • NPV10 ${((activeGroup.metrics?.npv10 || 0) / 1e6).toFixed(1)}M
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.14em] ${statusClass(isClassic, needsRerun)}`}>
            {needsRerun ? 'Rerun Needed' : 'Current'}
          </span>
          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.14em] ${
            canRun ? 'bg-theme-surface2 text-theme-cyan' : 'bg-theme-surface2 text-theme-muted'
          }`}>
            {canRun ? 'Run Ready' : 'Blocked'}
          </span>
          <button
            type="button"
            onClick={onCloneActiveGroup}
            className={
              isClassic
                ? 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] border-2 border-black/25 bg-black/20 text-white/90'
                : 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] border border-theme-border bg-theme-bg text-theme-text hover:border-theme-cyan'
            }
          >
            Clone Group
          </button>
          <button
            type="button"
            onClick={onJumpToWells}
            className={
              isClassic
                ? 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] border-2 border-black/25 bg-theme-warning text-black'
                : 'px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.16em] bg-theme-cyan text-theme-bg hover:shadow-glow-cyan'
            }
          >
            Jump To Wells
          </button>
        </div>
      </div>
    </div>
  );
};

export default EconomicsGroupBar;
