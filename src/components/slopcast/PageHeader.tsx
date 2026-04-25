import React from 'react';
import { ThemeMeta } from '../../theme/themes';
import { phase1PrimaryNav, type Phase1WorkflowId } from './workflowModel';

interface PageHeaderProps {
  isClassic: boolean;
  theme: ThemeMeta;
  themes: ThemeMeta[];
  themeId: string;
  setThemeId: (id: string) => void;
  activeWorkflow: Phase1WorkflowId;
  onSetActiveWorkflow: (workflow: Phase1WorkflowId) => void;
  activeStageLabel: string;
  activeScenarioName: string;
  assetContextLabel: string;
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
  activeWorkflow,
  onSetActiveWorkflow,
  activeStageLabel,
  activeScenarioName,
  assetContextLabel,
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

          <div className="flex flex-col gap-2 w-full min-w-0">
            <div className={isClassic ? 'flex items-center gap-1.5 min-w-0 flex-wrap' : 'flex items-center gap-1 p-1 rounded-panel border theme-transition bg-theme-bg border-theme-border min-w-0 flex-wrap'}>
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
              {phase1PrimaryNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSetActiveWorkflow(item.id)}
                  className={
                    isClassic
                      ? `min-h-[44px] px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-md text-left theme-transition border-2 shadow-card whitespace-nowrap focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                          activeWorkflow === item.id
                            ? 'bg-theme-cyan text-white border-theme-magenta'
                            : 'bg-black/15 text-white/90 border-black/25 hover:bg-black/20'
                        }`
                      : `min-h-[44px] px-2 md:px-4 lg:px-5 py-1.5 md:py-2 rounded-inner text-left theme-transition whitespace-nowrap focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                          activeWorkflow === item.id
                            ? 'bg-theme-cyan text-theme-bg shadow-glow-cyan'
                            : 'text-theme-muted hover:text-theme-text'
                        }`
                  }
                >
                  <span className="block text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest">
                    {item.label}
                  </span>
                  <span className={`block text-[7px] md:text-[8px] uppercase tracking-[0.16em] ${activeWorkflow === item.id ? 'opacity-80' : 'opacity-60'}`}>
                    {item.eyebrow}
                  </span>
                </button>
              ))}
            </div>

            <div className={`flex flex-wrap items-center gap-2 rounded-panel border px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] ${
              isClassic ? 'border-black/25 bg-black/10 text-white/80' : 'border-theme-border/50 bg-theme-surface1/35 text-theme-muted'
            }`}>
              <span className={isClassic ? 'text-theme-warning' : 'text-theme-cyan'}>{activeWorkflow}</span>
              <span>/</span>
              <span>{activeStageLabel}</span>
              <span className="hidden sm:inline">/</span>
              <span className="hidden sm:inline">{assetContextLabel}</span>
              <span className="hidden md:inline">/</span>
              <span className={`hidden md:inline ${isClassic ? 'text-theme-warning' : 'text-theme-magenta'}`}>{activeScenarioName}</span>
              </div>
          </div>
        </div>

        <div className="min-w-0 flex items-center justify-between md:justify-end gap-3">
          <div className={`flex items-center rounded-full p-1 border theme-transition shrink-0 ${isClassic ? 'bg-black/25 border-black/30' : 'bg-theme-bg border-theme-border'}`}>
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                data-testid={`theme-option-${t.id}`}
                className={
                  isClassic
                    ? `w-7 h-7 md:w-8 md:h-8 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 rounded-full flex items-center justify-center theme-transition focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
                        themeId === t.id ? 'bg-theme-warning text-black scale-110 shadow-card' : 'text-white/80 hover:text-white'
                      }`
                    : `w-7 h-7 md:w-8 md:h-8 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 rounded-full flex items-center justify-center theme-transition focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${
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
