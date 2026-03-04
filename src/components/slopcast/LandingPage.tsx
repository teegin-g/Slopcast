import React, { useState, useCallback, useEffect } from 'react';
import { ThemeMeta } from '../../theme/themes';
import AcreageSearchBar from './AcreageSearchBar';
import DealsTable from './DealsTable';
import MiniMapPreview from './MiniMapPreview';
import type { DealRecord, Well, WellGroup } from '../../types';

interface LandingPageProps {
  isClassic: boolean;
  theme: ThemeMeta;
  deals: DealRecord[];
  onSelectDeal: (dealId: string) => void;
  onCreateDeal: () => void;
  onSearch: (query: string, parsedFilters: ParsedFilters) => void;
  onEnterWorkspace: () => void;
  wells: Well[];
  activeGroup: WellGroup | null;
}

export interface ParsedFilters {
  operator?: string;
  formation?: string;
  basin?: string;
  wellType?: string;
  rawQuery: string;
}

/**
 * Simple local query parser — extracts known keywords without requiring Gemini.
 * The AI-powered parsing is optional and can be added when the Gemini service
 * is configured with acreage-query prompts.
 */
function parseSearchQuery(query: string): ParsedFilters {
  const q = query.toLowerCase();
  const filters: ParsedFilters = { rawQuery: query };

  // Basin detection
  const basins = ['permian', 'delaware', 'midland', 'williston', 'powder river', 'eagle ford', 'bakken', 'dj', 'anadarko'];
  for (const basin of basins) {
    if (q.includes(basin)) {
      filters.basin = basin.charAt(0).toUpperCase() + basin.slice(1);
      break;
    }
  }

  // Formation detection
  const formations = ['wolfcamp', 'bone spring', 'spraberry', 'avalon', 'meramec', 'woodford'];
  for (const fm of formations) {
    if (q.includes(fm)) {
      filters.formation = fm.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // Operator detection — look for capitalized multi-word names
  const operators = ['devon', 'pioneer', 'diamondback', 'conoco', 'eog', 'marathon', 'continental'];
  for (const op of operators) {
    if (q.includes(op)) {
      filters.operator = op.charAt(0).toUpperCase() + op.slice(1);
      break;
    }
  }

  // Well type
  if (q.includes('undeveloped') || q.includes('pud') || q.includes('duc')) {
    filters.wellType = 'undeveloped';
  } else if (q.includes('developed') || q.includes('pdp')) {
    filters.wellType = 'developed';
  }

  return filters;
}

const LandingPage: React.FC<LandingPageProps> = ({
  isClassic,
  theme,
  deals,
  onSelectDeal,
  onCreateDeal,
  onSearch,
  onEnterWorkspace,
  wells,
  activeGroup,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setAnimateIn(true));
  }, []);

  const handleSearch = useCallback((query: string) => {
    setIsSearching(true);
    setLastQuery(query);
    const filters = parseSearchQuery(query);
    onSearch(query, filters);
    // Simulate brief loading state
    setTimeout(() => setIsSearching(false), 600);
  }, [onSearch]);

  return (
    <div
      className={`min-h-screen relative overflow-hidden bg-transparent theme-transition transition-opacity duration-700 ${
        animateIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Ambient background effects */}
      {!isClassic && (
        <>
          <div className="sc-pageAmbient" />
          <div className="sc-pageAmbientOrbLeft" />
          <div className="sc-pageAmbientOrbRight" />
        </>
      )}

      {/* Hero section */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 pt-12 md:pt-20">
        <div className="text-center mb-8 md:mb-12">
          <h1
            className={`text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 ${
              isClassic
                ? 'text-white font-black uppercase'
                : `text-theme-text font-black tracking-tight ${theme.features.brandFont ? 'brand-title' : ''}`
            }`}
          >
            {theme.appName}
          </h1>
          <p
            className={`text-sm md:text-base max-w-xl mx-auto mb-8 ${
              isClassic ? 'text-white/70' : 'text-theme-muted'
            }`}
          >
            Search acreage, load saved deals, or jump into a blank workspace.
          </p>

          {/* AI Search bar */}
          <AcreageSearchBar
            isClassic={isClassic}
            onSearch={handleSearch}
            isLoading={isSearching}
          />

          {lastQuery && (
            <p className={`mt-3 text-[10px] ${isClassic ? 'text-white/40' : 'text-theme-muted/50'}`}>
              Showing results for: "{lastQuery}"
            </p>
          )}
        </div>

        {/* Quick actions strip */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={onEnterWorkspace}
            className={`px-5 py-2.5 rounded-panel text-[10px] font-black uppercase tracking-widest transition-all ${
              isClassic
                ? 'bg-theme-cyan text-white border border-theme-magenta/40 shadow-card hover:bg-theme-cyan/90'
                : 'bg-theme-cyan text-theme-bg shadow-glow-cyan hover:scale-[1.02]'
            }`}
          >
            Open Blank Workspace
          </button>
          <button
            onClick={onCreateDeal}
            className={`px-5 py-2.5 rounded-panel text-[10px] font-black uppercase tracking-widest transition-all border ${
              isClassic
                ? 'bg-black/20 text-white border-black/30 hover:bg-black/30'
                : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text hover:border-theme-cyan'
            }`}
          >
            New Deal
          </button>
        </div>

        {/* Main content: deals table + map preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-16">
          <div className="lg:col-span-7 xl:col-span-8">
            <DealsTable
              isClassic={isClassic}
              deals={deals}
              onSelectDeal={onSelectDeal}
              onCreateDeal={onCreateDeal}
            />
          </div>

          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <MiniMapPreview
              isClassic={isClassic}
              wells={wells}
              activeGroup={activeGroup || undefined}
            />

            {/* Quick stats */}
            <div
              className={
                isClassic
                  ? 'sc-panel theme-transition p-4'
                  : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border p-4'
              }
            >
              <h3 className={`text-[10px] font-black uppercase tracking-[0.24em] mb-3 ${isClassic ? 'text-white' : 'text-theme-cyan'}`}>
                Portfolio Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-inner border p-3 ${isClassic ? 'border-black/30 bg-black/10' : 'border-theme-border bg-theme-bg'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-wide ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>Total Deals</p>
                  <p className={`text-lg font-black tabular-nums ${isClassic ? 'text-white' : 'text-theme-text'}`}>{deals.length}</p>
                </div>
                <div className={`rounded-inner border p-3 ${isClassic ? 'border-black/30 bg-black/10' : 'border-theme-border bg-theme-bg'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-wide ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>Active</p>
                  <p className={`text-lg font-black tabular-nums ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
                    {deals.filter(d => d.status === 'active').length}
                  </p>
                </div>
                <div className={`rounded-inner border p-3 ${isClassic ? 'border-black/30 bg-black/10' : 'border-theme-border bg-theme-bg'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-wide ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>Total PV10</p>
                  <p className={`text-lg font-black tabular-nums ${isClassic ? 'text-theme-warning' : 'text-theme-lavender'}`}>
                    ${(deals.reduce((sum, d) => sum + (d.kpis.pv10 || 0), 0) / 1e6).toFixed(1)}M
                  </p>
                </div>
                <div className={`rounded-inner border p-3 ${isClassic ? 'border-black/30 bg-black/10' : 'border-theme-border bg-theme-bg'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-wide ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>Total Wells</p>
                  <p className={`text-lg font-black tabular-nums ${isClassic ? 'text-white' : 'text-theme-text'}`}>
                    {deals.reduce((sum, d) => sum + (d.kpis.wellCount || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LandingPage);
