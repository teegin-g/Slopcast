import React from 'react';
import { ThemeMeta } from '../../theme/themes';
import DesignWorkspaceTabs, { DesignWorkspace } from './DesignWorkspaceTabs';
import { AnimatedButton } from './AnimatedButton';

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
  const controlGroupClass = isClassic
    ? 'grid grid-cols-3 gap-1.5 min-w-0 w-full md:flex md:w-auto md:items-center'
    : 'grid grid-cols-3 gap-1 rounded-panel border border-theme-border bg-theme-bg/80 p-1 min-w-0 w-full md:flex md:w-auto md:items-center';

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

          <div className="flex flex-col gap-2 w-full min-w-0 md:flex-row md:items-center">
            <div className={controlGroupClass}>
              <AnimatedButton
                onClick={onNavigateHub}
                isClassic={isClassic}
                variant={isClassic ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1 md:flex-none px-2 md:px-3 lg:px-4 whitespace-nowrap"
              >
                HUB
              </AnimatedButton>
              <AnimatedButton
                onClick={() => onSetViewMode('DASHBOARD')}
                isClassic={isClassic}
                variant="tab"
                active={viewMode === 'DASHBOARD'}
                aria-pressed={viewMode === 'DASHBOARD'}
                size="sm"
                className="flex-1 md:flex-none px-2 md:px-4 lg:px-5 whitespace-nowrap"
              >
                DESIGN
              </AnimatedButton>
              <AnimatedButton
                onClick={() => onSetViewMode('ANALYSIS')}
                isClassic={isClassic}
                variant="tab"
                active={viewMode === 'ANALYSIS'}
                aria-pressed={viewMode === 'ANALYSIS'}
                size="sm"
                className="flex-1 md:flex-none px-2 md:px-4 lg:px-5 whitespace-nowrap"
              >
                SCENARIOS
              </AnimatedButton>
            </div>

            {viewMode === 'DASHBOARD' && (
              <div className="min-w-0 w-full md:w-auto md:flex-1">
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

        <div className="min-w-0 flex items-center justify-start md:justify-end gap-3 overflow-x-auto pb-1 md:pb-0">
          <div className={`flex w-max items-center rounded-full p-1 border theme-transition shrink-0 ${isClassic ? 'bg-black/25 border-black/30' : 'bg-theme-bg border-theme-border'}`}>
            {themes.map(t => (
              <AnimatedButton
                key={t.id}
                onClick={() => setThemeId(t.id)}
                isClassic={isClassic}
                variant="icon"
                active={themeId === t.id}
                size="icon"
                shape="circle"
                data-testid={`theme-option-${t.id}`}
                aria-label={`Switch theme to ${t.label}`}
                aria-pressed={themeId === t.id}
                className="h-11 w-11 min-h-[44px] min-w-[44px] md:h-10 md:w-10 md:min-h-10 md:min-w-10"
                title={t.label}
              >
                <span className="text-xs">{t.icon}</span>
              </AnimatedButton>
            ))}
          </div>
        </div>
      </div>

    </header>
  );
};

export default PageHeader;
