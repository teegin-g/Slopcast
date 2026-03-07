import React from 'react';
import { SidebarNav } from './SidebarNav';
import { SidebarGroupTree } from './SidebarGroupTree';
import type { Section } from '../../hooks/useSidebarNav';
import type { WellGroup } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  section: Section;
  onSetSection: (s: Section) => void;
  isClassic: boolean;
  groups: WellGroup[];
  activeGroupId: string | null;
  onActivateGroup: (id: string) => void;
  economicsNeedsAttention?: boolean;
  wellsNeedsAttention?: boolean;
}

const CollapseChevron: React.FC<{ collapsed: boolean; isClassic: boolean }> = ({ collapsed, isClassic }) => (
  <svg
    className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export function Sidebar({
  collapsed,
  onToggleCollapse,
  section,
  onSetSection,
  isClassic,
  groups,
  activeGroupId,
  onActivateGroup,
  economicsNeedsAttention,
  wellsNeedsAttention,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Toggle button */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2`}>
        {!collapsed && (
          <span
            className={`typo-label font-bold tracking-widest theme-transition ${
              isClassic ? 'text-theme-warning' : 'text-theme-cyan'
            }`}
          >
            Slopcast
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`p-1 rounded-inner theme-transition focus-visible:outline-2 focus-visible:outline-theme-cyan focus-visible:outline-offset-[-2px] ${
            isClassic
              ? 'text-white/60 hover:text-white/90 hover:bg-white/10'
              : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface2/50'
          }`}
        >
          <CollapseChevron collapsed={collapsed} isClassic={isClassic} />
        </button>
      </div>

      {/* Divider */}
      <div className={`mx-2 border-t theme-transition ${isClassic ? 'border-white/10' : 'border-theme-border/30'}`} />

      {/* Navigation */}
      <div className="mt-1">
        <SidebarNav
          section={section}
          onSetSection={onSetSection}
          collapsed={collapsed}
          isClassic={isClassic}
          economicsNeedsAttention={economicsNeedsAttention}
          wellsNeedsAttention={wellsNeedsAttention}
        />
      </div>

      {/* Divider */}
      <div className={`mx-2 mt-1 border-t theme-transition ${isClassic ? 'border-white/10' : 'border-theme-border/30'}`} />

      {/* Group tree */}
      <div className="flex-1 overflow-y-auto mt-1">
        <SidebarGroupTree
          groups={groups}
          activeGroupId={activeGroupId}
          onActivateGroup={onActivateGroup}
          collapsed={collapsed}
          isClassic={isClassic}
        />
      </div>

    </div>
  );
}
