import React from 'react';
import { ThemeMeta } from '../../theme/themes';
import DesignWorkspaceTabs, { DesignWorkspace } from './DesignWorkspaceTabs';
import ThemeSelectorMenu from './ThemeSelectorMenu';

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
  return (
    <header
      className={`px-3 md:px-6 lg:px-8 py-3 md:py-4 sticky top-0 z-50 theme-transition ${
        isClassic ? 'sc-header' : 'backdrop-blur-md border-b shadow-sm bg-theme-surface1/80 border-theme-border'
      } ${headerAtmosphereClass} ${fxClass}`}
    >
      {atmosphericOverlays.map(cls => (
        <div key={cls} className={`${cls} ${fxClass} pointer-events-none`} />
      ))}
      <div className="relative z-10 grid grid-cols-1 gap-3 md:gap-4 items-start md:items-center">
        <div className="min-w-0 flex flex-col md:flex-row md:items-center gap-3 md:gap-10">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center theme-transition overflow-hidden shrink-0 ${
                isClassic ? 'rounded-full border border-black/30 shadow-card bg-theme-magenta' : 'rounded-panel bg-theme-surface2 border border-theme-border'
              }`}
            >
              <span
                className={
                  isClassic
                    ? 'text-white font-black text-lg md:text-xl leading-none'
                    : 'text-theme-cyan brand-title text-lg md:text-xl leading-none'
                }
              >
                {theme.appName.substring(0, 2)}
              </span>
            </div>

            <div className={`flex flex-col gap-2 pr-2 md:pr-8 min-w-0 ${isClassic ? 'md:border-r md:border-black/20' : 'md:border-r md:border-white/5'}`}>
              <div className="min-w-0">
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
              <ThemeSelectorMenu
                isClassic={isClassic}
                theme={theme}
                themes={themes}
                themeId={themeId}
                setThemeId={setThemeId}
              />
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
      </div>

    </header>
  );
};

export default PageHeader;
