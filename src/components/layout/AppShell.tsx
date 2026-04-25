import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { Vignette } from '../ui/Vignette';
import PageHeader from '../slopcast/PageHeader';
import type { Phase1WorkflowId } from '../slopcast/workflowModel';
import { ViewTransition } from './ViewTransition';
import { useSidebarNav } from '../../hooks/useSidebarNav';
import { getSidebarCollapsed, setSidebarCollapsed } from '../../services/storage/workspacePreferences';
import { useViewportLayout } from '../slopcast/hooks/useViewportLayout';
import type { WellGroup } from '../../types';
import type { ThemeMeta } from '../../theme/themes';

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
    activeWorkflow: Phase1WorkflowId;
    setActiveWorkflow: (workflow: Phase1WorkflowId) => void;
    activeStageLabel: string;
    activeScenario?: { name: string };
    assetContextLabel: string;
    processedGroups: WellGroup[];
    activeGroupId: string | null;
    setActiveGroupId: (id: string) => void;
    economicsNeedsAttention: boolean;
    wellsNeedsAttention: boolean;
    themeId: string;
    setThemeId: (id: string) => void;
    themes: ThemeMeta[];
    theme: ThemeMeta;
    navigate: (path: string) => void;
    atmosphericOverlays: string[];
    headerAtmosphereClass: string;
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

  // Close mobile drawer on section change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [section]);

  const sidebarProps = {
    collapsed,
    onToggleCollapse: handleToggleCollapse,
    section,
    onSetSection: setSection,
    isClassic: workspace.isClassic,
    groups: workspace.processedGroups,
    activeGroupId: workspace.activeGroupId,
    onActivateGroup: workspace.setActiveGroupId,
    economicsNeedsAttention: workspace.economicsNeedsAttention,
    wellsNeedsAttention: workspace.wellsNeedsAttention,
  };

  const sectionLabel = section === 'wells' ? 'Wells' : section === 'economics' ? 'Economics' : 'Scenarios';

  return (
    <div className={`flex h-screen overflow-hidden ${workspace.atmosphereClass} ${workspace.fxClass}`}>
      {/* Animated background - fixed behind everything */}
      <div className="fixed inset-0 z-0">
        {workspace.BackgroundComponent && (
          <Suspense fallback={null}>
            <workspace.BackgroundComponent />
          </Suspense>
        )}
      </div>

      {/* Vignette overlay — skip when theme has an animated background,
          because each canvas scene draws its own tuned vignette. Stacking
          both darkens corners past 0.8 effective opacity, wasting the
          background art. */}
      {!workspace.BackgroundComponent && <Vignette />}

      {/* Desktop/mid sidebar */}
      {viewport !== 'mobile' && (
        <aside
          className={`relative z-30 flex-shrink-0 h-screen overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-in-out ${
            collapsed ? 'w-14' : 'w-56'
          }`}
          style={{
            background: 'var(--glass-sidebar-bg)',
            backdropFilter: `blur(var(--glass-sidebar-blur))`,
            WebkitBackdropFilter: `blur(var(--glass-sidebar-blur))`,
            borderRight: '1px solid var(--glass-sidebar-border)',
          }}
        >
          <Sidebar {...sidebarProps} />
        </aside>
      )}

      {/* Mobile drawer */}
      {viewport === 'mobile' && (
        <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)}>
          <Sidebar {...sidebarProps} collapsed={false} />
        </MobileDrawer>
      )}

      {/* Main column: header + content */}
      <div className="relative z-20 flex-1 flex flex-col overflow-hidden">
        {/* Project header with Phase 1 workflow navigation */}
        <PageHeader
          isClassic={workspace.isClassic}
          theme={workspace.theme}
          themes={workspace.themes}
          themeId={workspace.themeId}
          setThemeId={workspace.setThemeId}
          activeWorkflow={workspace.activeWorkflow}
          onSetActiveWorkflow={workspace.setActiveWorkflow}
          activeStageLabel={workspace.activeStageLabel}
          activeScenarioName={workspace.activeScenario?.name ?? 'Base Case'}
          assetContextLabel={workspace.assetContextLabel}
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
