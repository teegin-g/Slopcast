import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { Vignette } from '../ui/Vignette';
import PageHeader from '../slopcast/PageHeader';
import { useSidebarNav } from '../../hooks/useSidebarNav';
import { useViewportLayout } from '../slopcast/hooks/useViewportLayout';
import type { WellGroup } from '../../types';
import type { ThemeMeta } from '../../theme/themes';

const SIDEBAR_COLLAPSE_KEY = 'slopcast-sidebar-collapsed';

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
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Auto-collapse on mid viewport
  useEffect(() => {
    if (viewport === 'mid') {
      setCollapsed(true);
    } else if (viewport === 'desktop') {
      try {
        const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
        if (stored === '1') setCollapsed(true);
        else if (stored === '0') setCollapsed(false);
      } catch {
        // no-op
      }
    }
  }, [viewport]);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // no-op
      }
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

      {/* Vignette overlay */}
      <Vignette />

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
          <div className="p-3 max-w-[1920px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
