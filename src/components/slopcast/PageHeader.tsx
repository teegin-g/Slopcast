import React, { useEffect, useRef, useState } from 'react';
import { ThemeMeta } from '../../theme/themes';
import DesignWorkspaceTabs, { DesignWorkspace } from './DesignWorkspaceTabs';

type ViewMode = 'DASHBOARD' | 'ANALYSIS';

interface PageHeaderProps {
  isClassic: boolean;
  theme: ThemeMeta;
  themes: ThemeMeta[];
  themeId: string;
  setThemeId: (id: string) => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  designWorkspace: DesignWorkspace;
  onSetDesignWorkspace: (workspace: DesignWorkspace) => void;
  economicsNeedsAttention: boolean;
  wellsNeedsAttention: boolean;
  onNavigateHub: () => void;
  atmosphericOverlays: string[];
  headerAtmosphereClass: string;
  fxClass: string;
}

const ThemeGlyph: React.FC<{ themeId: string; className?: string }> = ({ themeId, className = '' }) => {
  const common = 'transition-colors';

  if (themeId === 'synthwave') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
        <defs>
          <linearGradient id="theme-glyph-synthwave" x1="7" x2="25" y1="8" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgb(var(--magenta))" />
            <stop offset="1" stopColor="rgb(var(--cyan))" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="14" r="8" fill="url(#theme-glyph-synthwave)" opacity="0.9" />
        <path d="M6 21h20M8 25h16M10 29h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={common} opacity="0.75" />
      </svg>
    );
  }

  if (themeId === 'permian') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
        <path d="M9 26V12h14v14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" className={common} />
        <path d="M16 5v21M10 12l6-7 6 7M9 18h14" fill="none" stroke="rgb(var(--warning))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (themeId === 'hyperborea') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
        <path d="M16 4v24M6 10l20 12M26 10L6 22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={common} />
        <circle cx="16" cy="16" r="4" fill="rgb(var(--cyan))" opacity="0.7" />
      </svg>
    );
  }

  if (themeId === 'mario') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
        <rect x="6" y="8" width="20" height="16" rx="3" fill="rgb(var(--warning))" />
        <path d="M10 12h4v4h-4zM18 12h4v4h-4zM14 16h4v4h-4z" fill="currentColor" opacity="0.75" className={common} />
      </svg>
    );
  }

  if (themeId === 'tropical') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
        <circle cx="22" cy="10" r="5" fill="rgb(var(--warning))" opacity="0.85" />
        <path d="M13 27c2-7 3-12 2-20M15 12c-5-3-8-1-10 3M16 12c5-3 8-1 10 3M14 15c-4 0-7 2-8 6M17 15c4 0 7 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={common} />
      </svg>
    );
  }

  if (themeId === 'league') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
        <path d="M16 4l9 5v7c0 6-4 10-9 12-5-2-9-6-9-12V9l9-5z" fill="none" stroke="currentColor" strokeWidth="2.3" className={common} />
        <path d="M16 9l3 5 5 1-4 4 1 6-5-3-5 3 1-6-4-4 5-1 3-5z" fill="rgb(var(--warning))" opacity="0.8" />
      </svg>
    );
  }

  if (themeId === 'stormwatch') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
        <path d="M9 20a6 6 0 0 1 1-12 8 8 0 0 1 15 4 5 5 0 0 1-1 10H9z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={common} />
        <path d="M16 17l-3 6h4l-2 5 6-8h-4l2-3h-3z" fill="rgb(var(--warning))" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect x="6" y="8" width="20" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2.2" className={common} />
      <path d="M10 14h12M10 19h8" stroke="rgb(var(--cyan))" strokeWidth="2" strokeLinecap="round" />
      <circle cx="23" cy="21" r="2" fill="rgb(var(--magenta))" />
    </svg>
  );
};

const PageHeader: React.FC<PageHeaderProps> = ({
  isClassic,
  theme,
  themes,
  themeId,
  setThemeId,
  viewMode,
  onSetViewMode,
  designWorkspace,
  onSetDesignWorkspace,
  economicsNeedsAttention,
  wellsNeedsAttention,
  onNavigateHub,
  atmosphericOverlays,
  headerAtmosphereClass,
  fxClass,
}) => {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!themeMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!themeMenuRef.current?.contains(target)) {
        setThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setThemeMenuOpen(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [themeMenuOpen]);

  return (
    <header
      className={`px-3 md:px-6 lg:px-8 py-3 md:py-4 sticky top-0 z-50 theme-transition ${
        isClassic ? 'sc-header' : 'backdrop-blur-md border-b shadow-sm bg-theme-surface1/80 border-theme-border'
      } ${headerAtmosphereClass} ${fxClass}`}
    >
      {atmosphericOverlays.map(cls => (
        <div key={cls} className={`${cls} ${fxClass} pointer-events-none`} />
      ))}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 md:gap-4 items-start md:items-center">
        <div className="min-w-0 flex flex-col md:flex-row md:items-center gap-3 md:gap-10">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div ref={themeMenuRef} className="relative shrink-0">
              <button
                type="button"
                data-testid="theme-dropdown-toggle"
                aria-haspopup="listbox"
                aria-expanded={themeMenuOpen}
                aria-label={`Theme: ${theme.label}`}
                onClick={() => setThemeMenuOpen(open => !open)}
                className={`group min-h-[44px] min-w-[44px] md:min-w-[132px] px-2 md:px-3 py-2 flex items-center justify-center md:justify-start gap-2 theme-transition overflow-hidden focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                  isClassic ? 'rounded-full md:rounded-panel border border-black/30 shadow-card bg-theme-magenta text-white' : 'rounded-panel bg-theme-surface2 border border-theme-border text-theme-cyan'
                }`}
              >
                <ThemeGlyph themeId={themeId} className="h-6 w-6 shrink-0" />
                <span className="hidden md:flex min-w-0 flex-col items-start leading-none">
                  <span className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.12em]' : 'text-[10px] font-black uppercase tracking-[0.12em] text-theme-text'}>
                    {theme.label}
                  </span>
                  <span className={isClassic ? 'mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white/70' : 'mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-theme-muted'}>
                    Theme
                  </span>
                </span>
                <span className={isClassic ? 'hidden md:block text-white/70' : 'hidden md:block text-theme-muted'}>▾</span>
              </button>

              {themeMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Theme selector"
                  className={`absolute left-0 top-full z-[80] mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden border p-2 theme-transition ${
                    isClassic
                      ? 'rounded-panel border-black/35 bg-black/95 shadow-card'
                      : 'rounded-panel border-theme-border bg-theme-surface1/95 shadow-card backdrop-blur-md'
                  }`}
                >
                  <div className="grid gap-1">
                    {themes.map(t => {
                      const active = themeId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setThemeId(t.id);
                            setThemeMenuOpen(false);
                          }}
                          data-testid={`theme-option-${t.id}`}
                          className={
                            isClassic
                              ? `flex w-full items-center gap-3 rounded-inner border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-theme-warning/50 focus-visible:outline-none ${
                                  active ? 'border-theme-warning bg-theme-warning text-black' : 'border-black/25 bg-black/20 text-white/85 hover:bg-black/35'
                                }`
                              : `flex w-full items-center gap-3 rounded-inner border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                                  active ? 'border-theme-cyan bg-theme-cyan/12 text-theme-text' : 'border-theme-border/65 bg-theme-bg/80 text-theme-muted hover:text-theme-text hover:border-theme-cyan/60'
                                }`
                          }
                          title={t.label}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border ${
                            isClassic
                              ? (active ? 'border-black/20 bg-black/10' : 'border-black/25 bg-black/25')
                              : (active ? 'border-theme-cyan/40 bg-theme-cyan/10 text-theme-cyan' : 'border-theme-border bg-theme-surface2/80 text-theme-muted')
                          }`}>
                            <ThemeGlyph themeId={t.id} className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-black uppercase tracking-[0.12em]">{t.label}</span>
                            <span className={`mt-0.5 block truncate text-[10px] ${active && isClassic ? 'text-black/70' : 'text-theme-muted'}`}>
                              {t.description}
                            </span>
                          </span>
                          {active && <span className="text-[9px] font-black uppercase tracking-[0.12em]">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className={`flex flex-col pr-2 md:pr-8 min-w-0 ${isClassic ? 'md:border-r md:border-black/20' : 'md:border-r md:border-white/5'}`}>
              <h1
                className={`text-base md:text-xl leading-tight theme-transition tracking-tight ${
                  isClassic ? 'text-white font-black uppercase' : `text-theme-cyan ${theme.features.brandFont ? 'brand-title' : 'font-bold'}`
                }`}
              >
                {theme.appName}
              </h1>
              <span
                className={`text-[8px] md:text-[10px] uppercase font-bold tracking-[0.2em] theme-transition ${
                  isClassic ? 'text-theme-warning' : 'text-theme-magenta'
                }`}
              >
                {theme.appSubtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full min-w-0 flex-nowrap">
            <div className={isClassic ? 'flex items-center gap-1.5 min-w-0 flex-nowrap' : 'flex items-center gap-1 p-1 rounded-panel border theme-transition bg-theme-bg border-theme-border min-w-0 flex-nowrap'}>
              <button
                onClick={onNavigateHub}
                className={
                  isClassic
                    ? 'min-h-[44px] px-2 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-md text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition border-2 shadow-card bg-black/15 text-white/90 border-black/25 hover:bg-black/20 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none'
                    : 'min-h-[44px] px-2 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-inner text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition text-theme-muted hover:text-theme-text whitespace-nowrap focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none'
                }
              >
                HUB
              </button>
              <button
                onClick={() => onSetViewMode('DASHBOARD')}
                className={
                  isClassic
                    ? `min-h-[44px] px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-md text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition border-2 shadow-card whitespace-nowrap focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                        viewMode === 'DASHBOARD'
                          ? 'bg-theme-cyan text-white border-theme-magenta'
                        : 'bg-black/15 text-white/90 border-black/25 hover:bg-black/20'
                      }`
                    : `min-h-[44px] px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-inner text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition whitespace-nowrap focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                        viewMode === 'DASHBOARD'
                          ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan'
                        : 'text-theme-muted hover:text-theme-text'
                      }`
                }
              >
                DESIGN
              </button>
              <button
                onClick={() => onSetViewMode('ANALYSIS')}
                className={
                  isClassic
                    ? `min-h-[44px] px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-md text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition border-2 shadow-card whitespace-nowrap focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                        viewMode === 'ANALYSIS'
                          ? 'bg-theme-cyan text-white border-theme-magenta'
                        : 'bg-black/15 text-white/90 border-black/25 hover:bg-black/20'
                      }`
                    : `min-h-[44px] px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-inner text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition whitespace-nowrap focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                        viewMode === 'ANALYSIS'
                          ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan'
                        : 'text-theme-muted hover:text-theme-text'
                      }`
                }
              >
                SCENARIOS
              </button>
            </div>

            {viewMode === 'DASHBOARD' && (
              <div className="min-w-0 flex-1">
                <DesignWorkspaceTabs
                  isClassic={isClassic}
                  workspace={designWorkspace}
                  onChange={onSetDesignWorkspace}
                  economicsNeedsAttention={economicsNeedsAttention}
                  wellsNeedsAttention={wellsNeedsAttention}
                  compact
                />
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block" aria-hidden="true" />
      </div>

    </header>
  );
};

export default PageHeader;
