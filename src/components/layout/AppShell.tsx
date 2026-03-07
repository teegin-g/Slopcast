import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { Vignette } from '../ui/Vignette';
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
    themeId: workspace.themeId,
    onSetThemeId: workspace.setThemeId,
    themes: workspace.themes,
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

      {/* Mobile header bar */}
      {viewport === 'mobile' && (
        <div
          className="fixed top-0 left-0 right-0 z-30 h-12 flex items-center gap-3 px-3"
          style={{ background: 'var(--glass-sidebar-bg)' }}
        >
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className={`p-1.5 rounded-inner ${
              workspace.isClassic ? 'text-white/80 hover:bg-white/10' : 'text-theme-text hover:bg-theme-surface2/50'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span
            className={`text-sm font-medium ${
              workspace.isClassic ? 'text-white' : 'text-theme-text'
            }`}
          >
            {sectionLabel}
          </span>
        </div>
      )}

      {/* Content area */}
      <main
        className={`relative z-20 flex-1 overflow-y-auto ${
          viewport === 'mobile' ? 'pt-12' : ''
        }`}
      >
        <div className="p-3 max-w-[1920px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
