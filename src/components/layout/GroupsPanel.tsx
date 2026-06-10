import React from 'react';
import GroupList from '../GroupList';
import GroupWellsTable from '../slopcast/GroupWellsTable';
import { useTheme } from '../../theme/ThemeProvider';
import { overlayPanelClass } from '../../theme/themes';
import { summarizeGroupWells } from '../slopcast/map/groupInspectorStats';
import type { Well, WellGroup } from '../../types';

interface GroupsPanelProps {
  groups: WellGroup[];
  /**
   * Currently-active group id. If it matches no group, the panel falls back to
   * the first group (and warns in dev), so keep this in sync with `groups`.
   */
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  /** Maps to GroupList's onAddGroup. */
  onNewGroup: () => void;
  onCloneGroup: (groupId: string) => void;
  wells: Well[];
  /** Controlled by the parent (AppShell, via Task 1.2 collapse persistence). */
  collapsed: boolean;
  onToggleCollapse: () => void;
  isClassic: boolean;
}

/**
 * Tier-2 rich contextual panel for the Wells screen. Lists group cards (via
 * GroupList — cyan active accent), a compact status-mix line for the active
 * group, and the active group's well list. This is a flex-column leaf: the
 * parent column owns width/position. Collapse is controlled by the parent.
 */
const GroupsPanel: React.FC<GroupsPanelProps> = ({
  groups,
  activeGroupId,
  onActivateGroup,
  onNewGroup,
  onCloneGroup,
  wells,
  collapsed,
  onToggleCollapse,
  isClassic,
}) => {
  const { theme } = useTheme();
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  if (import.meta.env.DEV && groups.length > 0 && !groups.some(g => g.id === activeGroupId)) {
    console.warn(`GroupsPanel: activeGroupId "${activeGroupId}" not found in groups; falling back to first group.`);
  }

  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : `rounded-panel ${overlayPanelClass(theme.features.panelStyle)} theme-transition`;

  const toggleButton = (
    <button
      type="button"
      aria-label={collapsed ? 'Expand groups panel' : 'Collapse groups panel'}
      title={collapsed ? 'Expand groups panel' : 'Collapse groups panel'}
      onClick={onToggleCollapse}
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
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
  );

  if (collapsed) {
    // Thin sliver: just the expand chevron so the parent column can shrink.
    // Carries panelClass so it reads as a panel even if the parent supplies no surface.
    return (
      <div className={`${panelClass} h-full flex flex-col items-center pt-4`}>
        {toggleButton}
      </div>
    );
  }

  const activeWells = activeGroup ? wells.filter(w => activeGroup.wellIds.has(w.id)) : [];
  const summary = activeGroup ? summarizeGroupWells(activeWells) : null;

  return (
    <div className={`${panelClass} h-full flex flex-col overflow-y-auto`}>
      <div className="p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2
            className={`text-[11px] font-black uppercase tracking-[0.24em] ${
              isClassic ? 'text-white' : 'text-theme-cyan'
            }`}
          >
            Groups
          </h2>
          {toggleButton}
        </div>

        <GroupList
          groups={groups}
          activeGroupId={activeGroupId}
          onActivateGroup={onActivateGroup}
          onAddGroup={onNewGroup}
          onCloneGroup={onCloneGroup}
        />

        {summary && summary.total > 0 && (
          <div
            className={`rounded-inner px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${
              isClassic
                ? 'sc-insetDark text-white/90'
                : 'border border-theme-border/60 bg-theme-bg/40 text-theme-muted'
            }`}
          >
            {summary.slices.filter(s => s.count > 0).map(slice => (
              <span key={slice.status} className="flex items-center gap-1.5 tabular-nums">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                />
                {slice.count} {slice.label}
              </span>
            ))}
          </div>
        )}

        {activeGroup && (
          <GroupWellsTable
            isClassic={isClassic}
            group={activeGroup}
            wells={activeWells}
            dense
          />
        )}
      </div>
    </div>
  );
};

export default GroupsPanel;
