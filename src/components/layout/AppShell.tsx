import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
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
    theme: ThemeMeta;
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

  // Theme dropdown for the top header bar
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!themeDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (themeDropRef.current && !themeDropRef.current.contains(e.target as Node)) setThemeDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [themeDropdownOpen]);

  const currentTheme = workspace.theme;

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
        {/* Top header bar */}
        <header
          className="flex-shrink-0 h-11 flex items-center justify-between px-4 border-b theme-transition"
          style={{
            background: 'var(--glass-sidebar-bg)',
            borderColor: 'var(--glass-sidebar-border)',
          }}
        >
          {/* Left: mobile hamburger + brand / section label */}
          <div className="flex items-center gap-3 min-w-0">
            {viewport === 'mobile' && (
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className={`p-1.5 rounded-inner focus-ring ${
                  workspace.isClassic ? 'text-white/80 hover:bg-white/10' : 'text-theme-text hover:bg-theme-surface2/50'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
            )}
            <span
              className={`text-sm font-semibold tracking-tight truncate ${
                workspace.isClassic ? 'text-white' : 'text-theme-cyan'
              }`}
            >
              {currentTheme.appName}
            </span>
            <span
              className={`hidden sm:inline text-[9px] uppercase font-bold tracking-[0.15em] ${
                workspace.isClassic ? 'text-theme-warning' : 'text-theme-muted'
              }`}
            >
              {sectionLabel}
            </span>
          </div>

          {/* Right: nav tabs + theme switcher */}
          <div className="flex items-center gap-2">
            {/* View mode tabs (compact) */}
            <div className={`hidden md:flex items-center gap-0.5 p-0.5 rounded-inner border ${
              workspace.isClassic ? 'bg-black/25 border-black/30' : 'bg-theme-bg/50 border-theme-border/40'
            }`}>
              {(['DASHBOARD', 'ANALYSIS'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => workspace.setViewMode(mode)}
                  className={`px-2.5 py-1 rounded-inner text-[10px] font-bold uppercase tracking-wider transition-colors focus-ring ${
                    workspace.viewMode === mode
                      ? workspace.isClassic
                        ? 'bg-theme-cyan text-white'
                        : 'bg-theme-cyan/20 text-theme-cyan'
                      : workspace.isClassic
                        ? 'text-white/60 hover:text-white/90'
                        : 'text-theme-muted hover:text-theme-text'
                  }`}
                >
                  {mode === 'DASHBOARD' ? 'Design' : 'Scenarios'}
                </button>
              ))}
            </div>

            {/* Theme dropdown */}
            <div ref={themeDropRef} className="relative">
              <button
                onClick={() => setThemeDropdownOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-bold transition-colors focus-ring ${
                  workspace.isClassic
                    ? 'bg-black/25 border-black/30 text-white hover:bg-black/35'
                    : 'bg-theme-bg/50 border-theme-border text-theme-text hover:border-theme-cyan'
                }`}
              >
                <span className="text-xs">{currentTheme.icon}</span>
                <span className="hidden sm:inline">{currentTheme.label}</span>
                <span className={`text-[8px] opacity-50 transition-transform duration-200 ${themeDropdownOpen ? 'rotate-180' : ''}`}>&#9660;</span>
              </button>

              {themeDropdownOpen && (
                <div
                  className={`absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-panel border shadow-card overflow-hidden ${
                    workspace.isClassic ? 'bg-black/80 border-black/40 backdrop-blur-md' : 'bg-theme-surface1 border-theme-border backdrop-blur-md'
                  }`}
                >
                  {workspace.themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { workspace.setThemeId(t.id); setThemeDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-bold transition-colors ${
                        workspace.isClassic
                          ? `${workspace.themeId === t.id ? 'bg-theme-warning/20 text-theme-warning' : 'text-white/80 hover:bg-white/10'}`
                          : `${workspace.themeId === t.id ? 'bg-theme-cyan/10 text-theme-cyan' : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'}`
                      }`}
                    >
                      <span className="text-xs">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

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
