import React from 'react';
import type { Section } from '../../hooks/useSidebarNav';
import type { Well, WellGroup } from '../../types';
import GroupsPanel from './GroupsPanel';
import { SlimGroupSelector } from './SlimGroupSelector';

export interface ContextualPanelProps {
  section: Section;
  groups: WellGroup[];
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  onNewGroup: () => void;
  onCloneGroup: (groupId: string) => void;
  wells: Well[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  isClassic: boolean;
}

/**
 * Tier-2 contextual panel router. Renders the rich GroupsPanel on the Wells
 * screen, and a compact SlimGroupSelector on Economics / Scenarios screens.
 * This is a thin routing layer — all logic lives in the leaf components.
 * Mount target: AppShell (Task 1.5).
 */
export function ContextualPanel(props: ContextualPanelProps) {
  const {
    section,
    groups,
    activeGroupId,
    onActivateGroup,
    onNewGroup,
    onCloneGroup,
    wells,
    collapsed,
    onToggleCollapse,
    isClassic,
  } = props;

  if (section === 'wells') {
    return (
      <GroupsPanel
        groups={groups}
        activeGroupId={activeGroupId}
        onActivateGroup={onActivateGroup}
        onNewGroup={onNewGroup}
        onCloneGroup={onCloneGroup}
        wells={wells}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        isClassic={isClassic}
      />
    );
  }

  // collapsed/onToggleCollapse aren't forwarded — SlimGroupSelector has no collapse affordance.
  return (
    <SlimGroupSelector
      groups={groups}
      activeGroupId={activeGroupId}
      onActivateGroup={onActivateGroup}
      isClassic={isClassic}
    />
  );
}
