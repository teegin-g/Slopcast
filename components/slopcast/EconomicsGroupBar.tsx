import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WellGroup } from '../../types';

export interface EconomicsGroupBarProps {
  isClassic: boolean;
  groups: WellGroup[];
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  onCloneActiveGroup: () => void;
}

const EconomicsGroupBar: React.FC<EconomicsGroupBarProps> = ({
  isClassic,
  groups,
  activeGroupId,
  onActivateGroup,
  onCloneActiveGroup,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = useMemo(() => {
    const idx = groups.findIndex(group => group.id === activeGroupId);
    return idx >= 0 ? idx : 0;
  }, [activeGroupId, groups]);

  const activeGroup = groups[activeIndex] || groups[0];

  const cycleGroup = (direction: -1 | 1) => {
    if (groups.length === 0) return;
    const nextIndex = (activeIndex + direction + groups.length) % groups.length;
    onActivateGroup(groups[nextIndex].id);
    setIsOpen(false);
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      cycleGroup(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      cycleGroup(1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      data-testid="economics-group-bar"
      className={`lg:sticky lg:top-[84px] lg:z-20 mb-3 border px-2.5 py-1.5 theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/65 border-theme-border shadow-card backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          data-testid="economics-group-prev"
          aria-label="Previous group"
          onClick={() => cycleGroup(-1)}
          className={
            isClassic
              ? 'px-1.5 py-1 rounded-inner border-2 border-black/25 bg-black/20 text-white/85 text-[9px] font-black'
              : 'px-1.5 py-1 rounded-inner border border-theme-border bg-theme-bg text-theme-muted text-[9px] font-black hover:text-theme-text'
          }
        >
          &larr;
        </button>

        <div className="relative flex-1">
          <button
            type="button"
            data-testid="economics-group-select"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(prev => !prev)}
            onKeyDown={handleSelectKeyDown}
            style={{
              boxShadow: `inset 0 0 0 1px ${activeGroup?.color || '#4F8BFF'}66`,
            }}
            className={
              isClassic
                ? 'w-full rounded-inner border-2 border-black/25 bg-black/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-white text-left flex items-center justify-between'
                : 'w-full rounded-inner border border-theme-border bg-theme-bg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-theme-text text-left flex items-center justify-between'
            }
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: activeGroup?.color || '#4F8BFF', boxShadow: `0 0 0 2px ${(activeGroup?.color || '#4F8BFF')}33` }} />
              <span className="truncate">{activeGroup?.name || 'No group'}</span>
            </span>
            <span className="text-theme-muted">▾</span>
            <span data-testid="economics-active-group-label" className="sr-only">{activeGroup?.name || 'No group'}</span>
          </button>

          {isOpen && (
            <div
              role="listbox"
              data-testid="economics-group-menu"
              className={
                isClassic
                  ? 'absolute z-30 mt-1 w-full rounded-inner border-2 border-black/30 bg-black/95 p-1 max-h-56 overflow-y-auto'
                  : 'absolute z-30 mt-1 w-full rounded-inner border border-theme-border bg-theme-surface1 shadow-card p-1 max-h-56 overflow-y-auto'
              }
            >
              {groups.map((group) => {
                const isActive = group.id === activeGroupId;
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-testid={`economics-group-option-${group.id}`}
                    onClick={() => {
                      onActivateGroup(group.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2 py-1 rounded-inner text-left text-[9px] font-black uppercase tracking-[0.08em] flex items-center justify-between transition-all ${
                      isActive
                        ? (isClassic ? 'bg-theme-warning text-black' : 'bg-theme-cyan text-theme-bg')
                        : (isClassic ? 'text-white/90 hover:bg-black/40' : 'text-theme-text hover:bg-theme-surface2')
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: group.color }} />
                      <span className="truncate">{group.name}</span>
                    </span>
                    <span className={isActive ? '' : 'text-theme-muted'}>{group.wellIds.size}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          data-testid="economics-group-next"
          aria-label="Next group"
          onClick={() => cycleGroup(1)}
          className={
            isClassic
              ? 'px-1.5 py-1 rounded-inner border-2 border-black/25 bg-black/20 text-white/85 text-[9px] font-black'
              : 'px-1.5 py-1 rounded-inner border border-theme-border bg-theme-bg text-theme-muted text-[9px] font-black hover:text-theme-text'
          }
        >
          &rarr;
        </button>

        <button
          type="button"
          data-testid="economics-group-clone"
          onClick={onCloneActiveGroup}
          className={
            isClassic
              ? 'px-2 py-1 rounded-inner text-[8px] font-black uppercase tracking-[0.12em] border-2 border-black/25 bg-black/20 text-white/90 whitespace-nowrap'
              : 'px-2 py-1 rounded-inner text-[8px] font-black uppercase tracking-[0.12em] border border-theme-border bg-theme-bg text-theme-text hover:border-theme-cyan whitespace-nowrap'
          }
        >
          Clone Group
        </button>
      </div>
    </div>
  );
};

export default EconomicsGroupBar;
