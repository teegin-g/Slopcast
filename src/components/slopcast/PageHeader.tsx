import React from 'react';
import { ThemeMeta } from '../../theme/themes';
import ThemeSelectorMenu from './ThemeSelectorMenu';
import ConnectionStatusChip from './map/ConnectionStatusChip';
import type { ConnectionLevel } from './map/connectionState';

interface PageHeaderProps {
  isClassic: boolean;
  theme: ThemeMeta;
  themes: ThemeMeta[];
  themeId: string;
  setThemeId: (id: string) => void;
  /** Active scenario name (read-only context chip). Omit to hide. */
  scenarioName?: string | null;
  /** Active scenario price deck label, e.g. "$75 / $3.25" (read-only context chip). Omit to hide. */
  priceDeck?: string | null;
  /** Derived connection level for the status chip. */
  connectionLevel: ConnectionLevel;
  /** User-facing connection title for the status chip. */
  connectionTitle: string;
  atmosphericOverlays: string[];
  headerAtmosphereClass: string;
  fxClass: string;
}

/**
 * Slim action/context bar. Primary section navigation now lives in the
 * two-tier nav (ActivityRail + ContextualPanel) and HUB navigation moved into
 * the ActivityRail, so the header is reduced to: brand mark + read-only
 * context chips (scenario, price deck, connection) on the left, and the theme
 * selector on the right.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  isClassic,
  theme,
  themes,
  themeId,
  setThemeId,
  scenarioName,
  priceDeck,
  connectionLevel,
  connectionTitle,
  atmosphericOverlays,
  headerAtmosphereClass,
  fxClass,
}) => {
  const chipClass = isClassic
    ? 'inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] theme-transition whitespace-nowrap border-2 border-black/25 bg-black/15 text-white/90 shadow-card'
    : 'inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-inner text-[10px] font-bold uppercase tracking-[0.14em] theme-transition whitespace-nowrap border border-theme-border bg-theme-surface2/60 text-theme-muted';
  const chipLabelClass = isClassic ? 'text-theme-warning' : 'text-theme-cyan';

  return (
    <header
      className={`px-3 md:px-6 lg:px-8 py-2 md:py-3 sticky top-0 z-50 theme-transition ${
        isClassic ? 'sc-header' : 'backdrop-blur-md border-b shadow-sm bg-theme-surface1/80 border-theme-border'
      } ${headerAtmosphereClass} ${fxClass}`}
    >
      {atmosphericOverlays.map(cls => (
        <div key={cls} className={`${cls} ${fxClass} pointer-events-none`} />
      ))}
      <div className="relative z-10 flex items-center gap-3 md:gap-4">
        {/* Brand mark + name */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 shrink-0">
          <div
            className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center theme-transition overflow-hidden shrink-0 ${
              isClassic ? 'rounded-full border border-black/30 shadow-card bg-theme-magenta' : 'rounded-panel bg-theme-surface2 border border-theme-border'
            }`}
          >
            <span
              className={
                isClassic
                  ? 'text-white font-black text-base md:text-lg leading-none'
                  : 'text-theme-cyan brand-title text-base md:text-lg leading-none'
              }
            >
              {theme.appName.substring(0, 2)}
            </span>
          </div>
          <h1
            className={`hidden sm:block text-sm md:text-base leading-tight theme-transition tracking-tight ${
              isClassic ? 'text-white font-black uppercase' : `text-theme-cyan ${theme.features.brandFont ? 'brand-title' : 'font-bold'}`
            }`}
          >
            {theme.appName}
          </h1>
        </div>

        {/* Read-only context chips (left/center) */}
        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
          {scenarioName ? (
            <span data-testid="header-scenario-chip" title={`Scenario: ${scenarioName}`} className={chipClass}>
              <span className={chipLabelClass}>Scenario</span>
              <span className="truncate normal-case text-theme-text font-semibold tracking-normal">{scenarioName}</span>
            </span>
          ) : null}
          {priceDeck ? (
            <span data-testid="header-pricedeck-chip" title={`Price deck: ${priceDeck}`} className={chipClass}>
              <span className={chipLabelClass}>Price deck</span>
              <span className="truncate normal-case text-theme-text font-semibold tracking-normal">{priceDeck}</span>
            </span>
          ) : null}
          <ConnectionStatusChip level={connectionLevel} title={connectionTitle} isClassic={isClassic} />
        </div>

        {/* Theme selector (right) */}
        <div className="shrink-0">
          <ThemeSelectorMenu
            isClassic={isClassic}
            theme={theme}
            themes={themes}
            themeId={themeId}
            setThemeId={setThemeId}
          />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
