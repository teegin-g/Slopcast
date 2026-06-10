import React, { useId } from 'react';
import type { WellGroup } from '../../types';

export interface SlimGroupSelectorProps {
  groups: WellGroup[];
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  isClassic: boolean;
}

/**
 * Compact group-switcher for Economics / Scenarios screens. Renders a
 * labeled native <select> so the user can switch the active group without
 * the full Wells panel. Color dot at left mirrors the map-pin identity.
 */
export function SlimGroupSelector({
  groups,
  activeGroupId,
  onActivateGroup,
  isClassic,
}: SlimGroupSelectorProps) {
  const selectId = useId();
  const activeGroup = groups.find(g => g.id === activeGroupId);

  const labelClass = isClassic
    ? 'block text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-white/60'
    : 'block text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 text-theme-muted';

  const selectClass = isClassic
    ? 'w-full rounded-inner px-2 py-1 text-[10px] font-black sc-inputNavy focus-ring'
    : 'w-full rounded-inner px-2 py-1 text-[10px] font-bold focus-ring border border-theme-border bg-theme-bg text-theme-text theme-transition';

  const emptyClass = isClassic
    ? 'text-[11px] text-white/40 italic'
    : 'text-[11px] text-theme-muted italic';

  if (groups.length === 0) {
    return (
      <div className="p-3" data-testid="slim-group-selector-empty">
        <span className={emptyClass}>No groups</span>
      </div>
    );
  }

  return (
    <div className="p-3">
      <label htmlFor={selectId} className={labelClass}>Active Group</label>
      <div className="relative flex items-center gap-2">
        {activeGroup && (
          <span
            className="shrink-0 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: activeGroup.color }}
            aria-hidden="true"
          />
        )}
        <select
          id={selectId}
          data-testid="slim-group-selector"
          value={activeGroupId}
          onChange={e => onActivateGroup(e.target.value)}
          className={selectClass}
        >
          {groups.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
