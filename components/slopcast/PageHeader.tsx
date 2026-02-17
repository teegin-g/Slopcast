import React from 'react';
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
            <div
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center theme-transition overflow-hidden shrink-0 ${
                isClassic ? 'rounded-full border border-black/30 shadow-card bg-theme-magenta' : 'rounded-panel bg-theme-surface2 border border-theme-border'
              }`}
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

        <div className="min-w-0 flex items-center justify-between md:justify-end gap-3">
          <div className={`flex items-center rounded-full p-1 border theme-transition shrink-0 ${isClassic ? 'bg-black/25 border-black/30' : 'bg-theme-bg border-theme-border'}`}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={
                  isClassic
                    ? `w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center theme-transition ${
                        themeId === t.id ? 'bg-theme-warning text-black scale-110 shadow-card' : 'text-white/80 hover:text-white'
                      }`
                    : `w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center theme-transition ${
                        themeId === t.id ? 'bg-theme-cyan text-theme-bg scale-110 shadow-glow-cyan' : 'text-theme-muted hover:text-theme-text'
                      }`
                }
                title={t.label}
              >
                <span className="text-xs">{t.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </header>
  );
};

export default PageHeader;
