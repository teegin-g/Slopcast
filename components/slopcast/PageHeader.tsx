import React, { useState, useRef, useEffect } from 'react';
import { ThemeMeta, ColorMode } from '../../theme/themes';
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
  colorMode?: ColorMode;
  onSetColorMode?: (mode: ColorMode) => void;
  effectiveMode?: 'dark' | 'light';
  onShare?: () => void;
  onRestartTour?: () => void;
}

const ThemeDropdown: React.FC<{
  themes: ThemeMeta[];
  themeId: string;
  currentTheme: ThemeMeta;
  isClassic: boolean;
  onSelect: (id: string) => void;
}> = ({ themes, themeId, currentTheme, isClassic, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold theme-transition ${
          isClassic
            ? 'bg-black/25 border-black/30 text-white hover:bg-black/35'
            : 'bg-theme-bg border-theme-border text-theme-text hover:border-theme-cyan'
        }`}
      >
        <span className="text-xs">{currentTheme.icon}</span>
        <span className="hidden sm:inline">{currentTheme.label}</span>
        <span className={`text-[8px] opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-panel border shadow-card overflow-hidden theme-transition ${
            isClassic ? 'bg-black/80 border-black/40 backdrop-blur-md' : 'bg-theme-surface1 border-theme-border backdrop-blur-md'
          }`}
        >
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => { onSelect(t.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-bold transition-colors ${
                isClassic
                  ? `${themeId === t.id ? 'bg-theme-warning/20 text-theme-warning' : 'text-white/80 hover:bg-white/10'}`
                  : `${themeId === t.id ? 'bg-theme-cyan/10 text-theme-cyan' : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'}`
              }`}
            >
              <span className="text-xs">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
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
  colorMode,
  onSetColorMode,
  effectiveMode = 'dark',
  onShare,
  onRestartTour,
}) => {
  return (
    <header
      className={`px-3 md:px-6 py-3 sticky top-0 z-50 theme-transition ${
        isClassic ? 'sc-header' : 'backdrop-blur-md border-b shadow-sm bg-theme-surface1/80 border-theme-border'
      } ${headerAtmosphereClass} ${fxClass}`}
    >
      {atmosphericOverlays.map(cls => (
        <div key={cls} className={`${cls} ${fxClass}`} />
      ))}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 md:gap-4 items-start md:items-center">
        <div className="min-w-0 flex flex-col md:flex-row md:items-center gap-3 md:gap-10">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button
              onClick={onNavigateHub}
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center theme-transition overflow-hidden shrink-0 hover:scale-105 transition-transform ${
                isClassic ? 'rounded-full border border-black/30 shadow-card bg-theme-magenta' : 'rounded-panel bg-theme-surface2 border border-theme-border hover:border-theme-cyan'
              }`}
              title="Back to Hub"
            >
              {isClassic ? (
                <span className="text-white font-black text-lg md:text-xl leading-none">SL</span>
              ) : (
                <img
                  src="sandbox:/mnt/data/slopcast_logo_transparent.png"
                  alt="SC"
                  className="w-full h-full object-contain"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent && !parent.querySelector('.brand-fallback')) {
                      const span = document.createElement('span');
                      span.innerText = theme.appName.substring(0, 2);
                      span.className = 'text-theme-cyan brand-title text-xl brand-fallback';
                      parent.appendChild(span);
                    }
                  }}
                />
              )}
            </button>

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
                    ? 'px-2 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-md text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-widest theme-transition border-2 shadow-card bg-black/15 text-white/90 border-black/25 hover:bg-black/20 whitespace-nowrap'
                    : 'px-2 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-inner text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition text-theme-muted hover:text-theme-text whitespace-nowrap'
                }
              >
                HUB
              </button>
              <button
                onClick={() => onSetViewMode('DASHBOARD')}
                className={
                  isClassic
                    ? `px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-md text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-widest theme-transition border-2 shadow-card whitespace-nowrap ${
                        viewMode === 'DASHBOARD'
                          ? 'bg-theme-cyan text-white border-theme-magenta'
                        : 'bg-black/15 text-white/90 border-black/25 hover:bg-black/20'
                      }`
                    : `px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-inner text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition whitespace-nowrap ${
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
                    ? `px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-md text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-widest theme-transition border-2 shadow-card whitespace-nowrap ${
                        viewMode === 'ANALYSIS'
                          ? 'bg-theme-cyan text-white border-theme-magenta'
                        : 'bg-black/15 text-white/90 border-black/25 hover:bg-black/20'
                      }`
                    : `px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-inner text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest theme-transition whitespace-nowrap ${
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

        <div className="min-w-0 flex items-center justify-between md:justify-end gap-2">
          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {onShare && (
              <button
                onClick={onShare}
                className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide transition-colors ${
                  isClassic
                    ? 'bg-black/25 text-white/80 border border-black/30 hover:bg-black/35'
                    : 'bg-theme-surface2 text-theme-muted border border-theme-border hover:text-theme-text'
                }`}
                title="Share Project"
              >
                Share
              </button>
            )}
            {onRestartTour && (
              <button
                onClick={onRestartTour}
                className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide transition-colors ${
                  isClassic
                    ? 'bg-black/25 text-white/80 border border-black/30 hover:bg-black/35'
                    : 'bg-theme-surface2 text-theme-muted border border-theme-border hover:text-theme-text'
                }`}
                title="Restart Tour"
              >
                Tour
              </button>
            )}
          </div>

          {/* Dark/Light mode toggle */}
          {onSetColorMode && theme.hasLightVariant && (
            <button
              onClick={() => onSetColorMode(effectiveMode === 'dark' ? 'light' : 'dark')}
              className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center theme-transition shrink-0 ${
                isClassic
                  ? 'bg-black/25 border border-black/30 text-white/80 hover:text-white'
                  : 'bg-theme-bg border border-theme-border text-theme-muted hover:text-theme-text'
              }`}
              title={effectiveMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="text-xs">{effectiveMode === 'dark' ? '\u2600' : '\u263E'}</span>
            </button>
          )}

          {/* Theme dropdown selector */}
          <ThemeDropdown
            themes={themes}
            themeId={themeId}
            currentTheme={theme}
            isClassic={isClassic}
            onSelect={setThemeId}
          />
        </div>
      </div>

    </header>
  );
};

export default React.memo(PageHeader);
