import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { ActivityRail } from './ActivityRail';
import { ContextualPanel } from './ContextualPanel';
import { MobileDrawer } from './MobileDrawer';
import PageHeader from '../slopcast/PageHeader';
import { ViewTransition } from './ViewTransition';
import { useSidebarNav } from '../../hooks/useSidebarNav';
import {
  getSidebarCollapsed,
  setSidebarCollapsed,
  getPanelCollapsed,
  setPanelCollapsed,
} from '../../services/storage/workspacePreferences';
import { useViewportLayout } from '../slopcast/hooks/useViewportLayout';
import type { Well, WellGroup } from '../../types';
import type { ThemeMeta } from '../../theme/themes';
import { ThemeSceneLayer } from '../../theme/scene/ThemeSceneLayer';
import type { ThemeSceneFxMode } from '../../theme/scene/types';

interface AppShellProps {
  /** The workspace object from useSlopcastWorkspace */
  workspace: {
    isClassic: boolean;
    BackgroundComponent: React.ComponentType | null | undefined;
    atmosphereClass: string;
    fxClass: string;
    viewMode: 'DASHBOARD' | 'ANALYSIS';
    setViewMode: (mode: 'DASHBOARD' | 'ANALYSIS') => void;
    designWorkspace: 'WELLS' | 'ECONOMICS';
    setDesignWorkspace: (ws: 'WELLS' | 'ECONOMICS') => void;
    processedGroups: WellGroup[];
    activeGroupId: string | null;
    setActiveGroupId: (id: string) => void;
    /** Full well universe — ContextualPanel/GroupsPanel filters by active group's wellIds. */
    wells?: Well[];
    /** Create a new (empty) group. Maps to GroupList's "Add group". */
    handleAddGroup?: () => void;
    /** Duplicate an existing group by id. */
    handleCloneGroup?: (groupId: string) => void;
    economicsNeedsAttention: boolean;
    wellsNeedsAttention: boolean;
    themeId: string;
    setThemeId: (id: string) => void;
    themes: ThemeMeta[];
    theme: ThemeMeta;
    effectiveMode: 'dark' | 'light';
    fxMode: ThemeSceneFxMode;
    navigate: (path: string) => void;
    atmosphericOverlays: string[];
    headerAtmosphereClass: string;
    pageOverlayClasses: string[];
  };
  children: React.ReactNode;
}

/**
 * Root layout component with sidebar + content area grid.
 * Background canvas renders behind everything, sidebar is a solid anchor,
 * content floats in the glass area.
 */
export function AppShell({ workspace, children }: AppShellProps) {
  const { section, setSection } = useSidebarNav();
  const viewport = useViewportLayout();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Mobile-only: drives the old <Sidebar> in MobileDrawer. Desktop uses groupsCollapsed. Cleanup deferred to mobile-nav refactor.
  // Sidebar collapse: auto-collapse on mid viewport, manual toggle on desktop
  const [collapsed, setCollapsed] = useState(() => {
    if (viewport === 'mid') return true;
    return getSidebarCollapsed() ?? false;
  });

  // Auto-collapse on mid viewport
  useEffect(() => {
    if (viewport === 'mid') {
      setCollapsed(true);
    } else if (viewport === 'desktop' || viewport === 'wide') {
      const stored = getSidebarCollapsed();
      if (stored !== null) setCollapsed(stored);
    }
  }, [viewport]);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      setSidebarCollapsed(next);
      return next;
    });
  }, []);

  // Tier-2 groups panel collapse (Task 1.2 persistence helpers)
  const [groupsCollapsed, setGroupsCollapsed] = useState(() => getPanelCollapsed('groups') ?? false);
  const handleToggleGroups = useCallback(() => {
    setGroupsCollapsed(prev => {
      const next = !prev;
      setPanelCollapsed('groups', next);
      return next;
    });
  }, []);

  // Stable no-op fallbacks so ContextualPanel handler identity is steady across
  // renders when workspace omits create/clone (avoids memo-busting downstream).
  const noopNewGroup = useCallback(() => {}, []);
  const noopCloneGroup = useCallback((_id: string) => {}, []);

  const handleSetSection = useCallback((nextSection: typeof section) => {
    setMobileDrawerOpen(false);
    setSection(nextSection);
  }, [setSection]);

  // Sync section -> workspace state
  useEffect(() => {
    if (section === 'wells') {
      if (workspace.designWorkspace !== 'WELLS') workspace.setDesignWorkspace('WELLS');
      if (workspace.viewMode !== 'DASHBOARD') workspace.setViewMode('DASHBOARD');
    } else if (section === 'economics') {
      if (workspace.designWorkspace !== 'ECONOMICS') workspace.setDesignWorkspace('ECONOMICS');
      if (workspace.viewMode !== 'DASHBOARD') workspace.setViewMode('DASHBOARD');
    } else if (section === 'scenarios') {
      if (workspace.viewMode !== 'ANALYSIS') workspace.setViewMode('ANALYSIS');
    }
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally only sync on section change

  const sidebarProps = {
    collapsed,
    onToggleCollapse: handleToggleCollapse,
    section,
    onSetSection: handleSetSection,
    isClassic: workspace.isClassic,
    groups: workspace.processedGroups,
    activeGroupId: workspace.activeGroupId,
    onActivateGroup: workspace.setActiveGroupId,
    economicsNeedsAttention: workspace.economicsNeedsAttention,
    wellsNeedsAttention: workspace.wellsNeedsAttention,
  };

  const sectionLabel = section === 'wells' ? 'Wells' : section === 'economics' ? 'Economics' : 'Scenarios';

  return (
    <div className={`flex h-screen overflow-hidden theme-transition ${workspace.atmosphereClass} ${workspace.fxClass}`}>
      <ThemeSceneLayer
        theme={workspace.theme}
        effectiveMode={workspace.effectiveMode}
        fxMode={workspace.fxMode}
        pageOverlayClasses={workspace.pageOverlayClasses}
        fxClass={workspace.fxClass}
      />

      {/* Desktop/mid two-tier nav: [ActivityRail][ContextualPanel] */}
      {viewport !== 'mobile' && (
        <>
          {/* Tier 1: section rail (owns its own --glass-sidebar-bg + right border) */}
          <ActivityRail
            section={section}
            onSetSection={handleSetSection}
            isClassic={workspace.isClassic}
          />
          {/* Tier 2: contextual panel. Plain flex container — the inner panel
              owns its surface (panelClass), so no double border/background here. */}
          <aside
            aria-label="Groups panel"
            className={`relative z-30 flex-shrink-0 h-screen overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-in-out ${
              groupsCollapsed ? 'w-12' : 'w-72'
            }`}
          >
            <ContextualPanel
              section={section}
              groups={workspace.processedGroups}
              activeGroupId={workspace.activeGroupId ?? ''}
              onActivateGroup={workspace.setActiveGroupId}
              onNewGroup={workspace.handleAddGroup ?? noopNewGroup}
              onCloneGroup={workspace.handleCloneGroup ?? noopCloneGroup}
              wells={workspace.wells ?? []}
              collapsed={groupsCollapsed}
              onToggleCollapse={handleToggleGroups}
              isClassic={workspace.isClassic}
            />
          </aside>
        </>
      )}

      {/* Mobile drawer */}
      {viewport === 'mobile' && (
        <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)}>
          <Sidebar {...sidebarProps} collapsed={false} />
        </MobileDrawer>
      )}

      {/* Main column: header + content */}
      <div className="relative z-20 flex-1 flex flex-col overflow-hidden">
        {/* Original PageHeader with brand, HUB/DESIGN/SCENARIOS tabs, theme icons */}
        <PageHeader
          isClassic={workspace.isClassic}
          theme={workspace.theme}
          themes={workspace.themes}
          themeId={workspace.themeId}
          setThemeId={workspace.setThemeId}
          viewMode={workspace.viewMode}
          onSetViewMode={workspace.setViewMode}
          designWorkspace={workspace.designWorkspace}
          onSetDesignWorkspace={workspace.setDesignWorkspace}
          economicsNeedsAttention={workspace.economicsNeedsAttention}
          wellsNeedsAttention={workspace.wellsNeedsAttention}
          onNavigateHub={() => workspace.navigate('/hub')}
          atmosphericOverlays={workspace.atmosphericOverlays}
          headerAtmosphereClass={workspace.headerAtmosphereClass}
          fxClass={workspace.fxClass}
        />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-5 xl:p-8 max-w-[1920px] mx-auto w-full">
            <ViewTransition transitionKey={section}>
              {children}
            </ViewTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
