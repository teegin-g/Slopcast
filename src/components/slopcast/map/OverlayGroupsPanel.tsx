import React, { useState } from 'react';
import type { Well, WellGroup } from '../../../types';
import GroupList from '../../GroupList';
import GroupWellsTable from '../GroupWellsTable';
import { useTheme } from '../../../theme/ThemeProvider';
import { overlayPanelClass } from '../../../theme/themes';

interface OverlayGroupsPanelProps {
  isClassic: boolean;
  groups: WellGroup[];
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  onAddGroup: () => void;
  onCloneGroup: (groupId: string) => void;
  wells: Well[];
  selectedWellIds: Set<string>;
  visibleWellIds: Set<string>;
}

export const OverlayGroupsPanel: React.FC<OverlayGroupsPanelProps> = ({
  isClassic,
  groups,
  activeGroupId,
  onActivateGroup,
  onAddGroup,
  onCloneGroup,
  wells,
  selectedWellIds,
  visibleWellIds,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  const { theme } = useTheme();

  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : `rounded-panel ${overlayPanelClass(theme.features.panelStyle)} theme-transition`;

  return (
    <div
      className={`absolute left-3 top-3 bottom-3 z-20 pointer-events-auto transition-all duration-200 ${
        collapsed ? 'w-10' : 'w-[280px]'
      }`}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute -right-3 top-4 z-30 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
          isClassic
            ? 'sc-btnPrimary'
            : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        } transition-colors shadow-lg`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d={collapsed ? 'M4 2L8 6L4 10' : 'M8 2L4 6L8 10'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {!collapsed && (
        <div className={`${panelClass} h-full overflow-y-auto`}>
          <div className="p-3 space-y-3">
            <GroupList
              groups={groups}
              activeGroupId={activeGroupId}
              onActivateGroup={onActivateGroup}
              onAddGroup={onAddGroup}
              onCloneGroup={onCloneGroup}
            />

            {activeGroup && (
              <GroupWellsTable
                isClassic={isClassic}
                group={activeGroup}
                wells={wells.filter(w => activeGroup.wellIds.has(w.id))}
                dense
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
