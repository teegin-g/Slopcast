import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { Vignette } from '../ui/Vignette';
import PageHeader from '../slopcast/PageHeader';
import { ViewTransition } from './ViewTransition';
import { useSidebarNav } from '../../hooks/useSidebarNav';
import { getSidebarCollapsed, setSidebarCollapsed } from '../../services/storage/workspacePreferences';
import { useViewportLayout } from '../slopcast/hooks/useViewportLayout';
import type { WellGroup } from '../../types';
import type { ThemeMeta } from '../../theme/themes';

/** Visual/atmospheric rendering fields */
interface AppShellAtmosphere {
  isClassic: boolean;
  BackgroundComponent: React.ComponentType | null | undefined;
  atmosphereClass: string;
  fxClass: string;
  atmosphericOverlays: string[];
  headerAtmosphereClass: string;
}

/** Workspace view-state and attention indicators */
interface AppShellViewState {
  viewMode: 'DASHBOARD' | 'ANALYSIS';
  setViewMode: (mode: 'DASHBOARD' | 'ANALYSIS') => void;
  designWorkspace: 'WELLS' | 'ECONOMICS';
  setDesignWorkspace: (ws: 'WELLS' | 'ECONOMICS') => void;
  economicsNeedsAttention: boolean;
  wellsNeedsAttention: boolean;
}

/** Well-group data and active selection */
interface AppShellGroups {
  processedGroups: WellGroup[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string) => void;
}

/** Theme picker state */
interface AppShellTheme {
  themeId: string;
  setThemeId: (id: string) => void;
  themes: ThemeMeta[];
  theme: ThemeMeta;
}

interface AppShellProps {
  /** Visual/atmospheric rendering (background, CSS classes, overlays) */
  atmosphere: AppShellAtmosphere;
  /** Workspace view-state and attention indicators */
  viewState: AppShellViewState;
  /** Well-group data and active selection */
  groups: AppShellGroups;
  /** Theme picker state */
  themeState: AppShellTheme;
  /** Navigate to a route path */
  navigate: (path: string) => void;
  children: React.ReactNode;
}

/**
 * Root layout component with sidebar + content area grid.
 * Background canvas renders behind everything, sidebar is a solid anchor,
 * content floats in the glass area.
 */
export function AppShell({ atmosphere, viewState, groups, themeState, navigate, children }: AppShellProps) {
  const { section, setSection } = useSidebarNav();
  const viewport = useViewportLayout();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [prevSection, setPrevSection] = useState(section);
  if (prevSection !== section) {
    setPrevSection(section);
    setMobileDrawerOpen(false);
  }

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
      if (viewState.designWorkspace !== 'WELLS') viewState.setDesignWorkspace('WELLS');
      if (viewState.viewMode !== 'DASHBOARD') viewState.setViewMode('DASHBOARD');
    } else if (section === 'economics') {
      if (viewState.designWorkspace !== 'ECONOMICS') viewState.setDesignWorkspace('ECONOMICS');
      if (viewState.viewMode !== 'DASHBOARD') viewState.setViewMode('DASHBOARD');
    } else if (section === 'scenarios') {
      if (viewState.viewMode !== 'ANALYSIS') viewState.setViewMode('ANALYSIS');
    }
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally only sync on section change


  const sidebarProps = {
    collapsed,
    onToggleCollapse: handleToggleCollapse,
    section,
    onSetSection: setSection,
    isClassic: atmosphere.isClassic,
    groups: groups.processedGroups,
    activeGroupId: groups.activeGroupId,
    onActivateGroup: groups.setActiveGroupId,
    economicsNeedsAttention: viewState.economicsNeedsAttention,
    wellsNeedsAttention: viewState.wellsNeedsAttention,
  };

  return (
    <div className={`flex h-screen overflow-hidden ${atmosphere.atmosphereClass} ${atmosphere.fxClass}`}>
      {/* Animated background - fixed behind everything */}
      <div className="fixed inset-0 z-0">
        {atmosphere.BackgroundComponent && (
          <Suspense fallback={null}>
            <atmosphere.BackgroundComponent />
          </Suspense>
        )}
      </div>

      {/* Vignette overlay — skip when theme has an animated background,
          because each canvas scene draws its own tuned vignette. Stacking
          both darkens corners past 0.8 effective opacity, wasting the
          background art. */}
      {!atmosphere.BackgroundComponent && <Vignette />}

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
          isClassic={atmosphere.isClassic}
          theme={themeState.theme}
          themes={themeState.themes}
          themeId={themeState.themeId}
          setThemeId={themeState.setThemeId}
          viewMode={viewState.viewMode}
          onSetViewMode={viewState.setViewMode}
          designWorkspace={viewState.designWorkspace}
          onSetDesignWorkspace={viewState.setDesignWorkspace}
          economicsNeedsAttention={viewState.economicsNeedsAttention}
          wellsNeedsAttention={viewState.wellsNeedsAttention}
          onNavigateHub={() => navigate('/hub')}
          atmosphericOverlays={atmosphere.atmosphericOverlays}
          headerAtmosphereClass={atmosphere.headerAtmosphereClass}
          fxClass={atmosphere.fxClass}
        />

        {/* relative z-0: subtree z-index stays below sticky PageHeader (z-50). */}
        <main className="relative z-0 flex-1 overflow-y-auto">
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
