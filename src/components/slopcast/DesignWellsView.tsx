import React, { useState } from 'react';
import GroupList from '../GroupList';
import MapVisualizer from '../MapVisualizer';
import { ThemeMeta, ThemeId } from '../../theme/themes';
import { Well, WellGroup } from '../../types';
import WellsTable from './WellsTable';
import FilterChips, { FilterChip } from './FilterChips';

export type WellsMobilePanel = 'GROUPS' | 'MAP';

interface DesignWellsViewProps {
  isClassic: boolean;
  theme: ThemeMeta;
  themeId: ThemeId;
  viewportLayout: 'mobile' | 'mid' | 'desktop';
  mobilePanel: WellsMobilePanel;
  onSetMobilePanel: (panel: WellsMobilePanel) => void;
  groups: WellGroup[];
  activeGroupId: string;
  selectedWellCount: number;
  onActivateGroup: (id: string) => void;
  onAddGroup: () => void;
  onCloneGroup: (groupId: string) => void;
  onAssignWells: () => void;
  onCreateGroupFromSelection: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  operatorFilter: string;
  formationFilter: string;
  statusFilter: Well['status'] | 'ALL';
  operatorOptions: string[];
  formationOptions: string[];
  statusOptions: Well['status'][];
  onSetOperatorFilter: (value: string) => void;
  onSetFormationFilter: (value: string) => void;
  onSetStatusFilter: (value: Well['status'] | 'ALL') => void;
  onResetFilters: () => void;
  filteredWellsCount: number;
  totalWellCount: number;
  wells: Well[];
  selectedWellIds: Set<string>;
  visibleWellIds: Set<string>;
  dimmedWellIds: Set<string>;
  onToggleWell: (id: string) => void;
  onSelectWells: (ids: string[]) => void;
}

const CompactFiltersBar: React.FC<{
  isClassic: boolean;
  operatorFilter: string;
  formationFilter: string;
  statusFilter: Well['status'] | 'ALL';
  operatorOptions: string[];
  formationOptions: string[];
  statusOptions: Well['status'][];
  onSetOperatorFilter: (value: string) => void;
  onSetFormationFilter: (value: string) => void;
  onSetStatusFilter: (value: Well['status'] | 'ALL') => void;
  onResetFilters: () => void;
  filteredWellsCount: number;
  totalWellCount: number;
  activeFilters: FilterChip[];
  onRemoveFilter: (id: string) => void;
}> = ({
  isClassic,
  operatorFilter,
  formationFilter,
  statusFilter,
  operatorOptions,
  formationOptions,
  statusOptions,
  onSetOperatorFilter,
  onSetFormationFilter,
  onSetStatusFilter,
  onResetFilters,
  filteredWellsCount,
  totalWellCount,
  activeFilters,
  onRemoveFilter,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const hasActiveFilters = activeFilters.length > 0;

  if (isClassic) {
    return (
      <div className="sc-panel theme-transition">
        <div className="sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">Basin Filters</h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
              {filteredWellsCount} visible / {totalWellCount} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              className="text-[10px] font-black uppercase tracking-widest text-white/90 hover:text-white transition-colors"
            >
              {showAdvancedFilters ? 'Hide' : 'Adjust'}
            </button>
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="text-[10px] font-black uppercase tracking-widest text-white/90 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {hasActiveFilters && <FilterChips filters={activeFilters} onRemove={onRemoveFilter} />}
        {showAdvancedFilters && (
          <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/10">
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-warning">Operator</label>
              <select
                value={operatorFilter}
                onChange={(e) => onSetOperatorFilter(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-xs font-black sc-inputNavy"
              >
                <option value="ALL">All Operators</option>
                {operatorOptions.map(operator => (
                  <option key={operator} value={operator}>{operator}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-warning">Formation</label>
              <select
                value={formationFilter}
                onChange={(e) => onSetFormationFilter(e.target.value)}
                className="w-full rounded-inner px-3 py-2 text-xs font-black sc-inputNavy"
              >
                <option value="ALL">All Formations</option>
                {formationOptions.map(formation => (
                  <option key={formation} value={formation}>{formation}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-warning">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => onSetStatusFilter(e.target.value as Well['status'] | 'ALL')}
                className="w-full rounded-inner px-3 py-2 text-xs font-black sc-inputNavy"
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="utility-surface p-4 theme-transition">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide text-theme-cyan">Basin Filters</h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-theme-muted">
            {filteredWellsCount} visible / {totalWellCount} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className="text-[10px] px-3 py-1 rounded-inner border font-black uppercase tracking-[0.16em] border-theme-border text-theme-muted hover:text-theme-text"
          >
            {showAdvancedFilters ? 'Hide Filters' : 'Adjust Filters'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-[10px] px-3 py-1 rounded-inner border font-black uppercase tracking-[0.16em] border-theme-border text-theme-muted hover:text-theme-text"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      {hasActiveFilters && <FilterChips filters={activeFilters} onRemove={onRemoveFilter} />}
      {showAdvancedFilters && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-muted">Operator</label>
            <select
              value={operatorFilter}
              onChange={(e) => onSetOperatorFilter(e.target.value)}
              className="w-full bg-theme-bg border rounded-inner px-3 py-2 text-xs text-theme-text outline-none border-theme-border"
            >
              <option value="ALL">All Operators</option>
              {operatorOptions.map(operator => (
                <option key={operator} value={operator}>{operator}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-muted">Formation</label>
            <select
              value={formationFilter}
              onChange={(e) => onSetFormationFilter(e.target.value)}
              className="w-full bg-theme-bg border rounded-inner px-3 py-2 text-xs text-theme-text outline-none border-theme-border"
            >
              <option value="ALL">All Formations</option>
              {formationOptions.map(formation => (
                <option key={formation} value={formation}>{formation}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 block text-theme-muted">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onSetStatusFilter(e.target.value as Well['status'] | 'ALL')}
              className="w-full bg-theme-bg border rounded-inner px-3 py-2 text-xs text-theme-text outline-none border-theme-border"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

const DesignWellsView: React.FC<DesignWellsViewProps> = ({
  isClassic,
  themeId,
  viewportLayout,
  mobilePanel,
  onSetMobilePanel,
  groups,
  activeGroupId,
  selectedWellCount,
  onActivateGroup,
  onAddGroup,
  onCloneGroup,
  onAssignWells,
  onCreateGroupFromSelection,
  onSelectAll,
  onClearSelection,
  operatorFilter,
  formationFilter,
  statusFilter,
  operatorOptions,
  formationOptions,
  statusOptions,
  onSetOperatorFilter,
  onSetFormationFilter,
  onSetStatusFilter,
  onResetFilters,
  filteredWellsCount,
  totalWellCount,
  wells,
  selectedWellIds,
  visibleWellIds,
  dimmedWellIds,
  onToggleWell,
  onSelectWells,
}) => {
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
  const isMobileMap = viewportLayout === 'mobile' && mobilePanel === 'MAP';
  const [mobileTrayExpanded, setMobileTrayExpanded] = useState(false);
  const selectFilteredLabel =
    filteredWellsCount > 0 && selectedWellCount === filteredWellsCount ? 'Deselect filtered' : 'Select filtered';
  const mapHeightClass = isMobileMap ? 'h-[min(56vh,560px)]' : 'h-[min(64vh,620px)]';

  const activeFilters = [
    ...(operatorFilter !== 'ALL' ? [{ id: 'operator', label: `Operator: ${operatorFilter}`, value: operatorFilter }] : []),
    ...(formationFilter !== 'ALL' ? [{ id: 'formation', label: `Formation: ${formationFilter}`, value: formationFilter }] : []),
    ...(statusFilter !== 'ALL' ? [{ id: 'status', label: `Status: ${statusFilter}`, value: statusFilter }] : []),
  ];

  const handleRemoveFilter = (id: string) => {
    if (id === 'operator') onSetOperatorFilter('ALL');
    if (id === 'formation') onSetFormationFilter('ALL');
    if (id === 'status') onSetStatusFilter('ALL');
  };

  return (
    <>
      <div
        className={`lg:hidden mb-4 border p-2 theme-transition ${
          isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 border-theme-border shadow-card backdrop-blur-sm'
        }`}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSetMobilePanel('GROUPS')}
            className={
              isClassic
                ? `px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                    mobilePanel === 'GROUPS' ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                  }`
                : `px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-widest border transition-colors ${
                    mobilePanel === 'GROUPS'
                      ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                      : 'bg-theme-bg text-theme-muted border-theme-border'
                  }`
            }
          >
            Groups
          </button>
          <button
            onClick={() => onSetMobilePanel('MAP')}
            className={
              isClassic
                ? `px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                    mobilePanel === 'MAP' ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                  }`
                : `px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-widest border transition-colors ${
                    mobilePanel === 'MAP'
                      ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                      : 'bg-theme-bg text-theme-muted border-theme-border'
                  }`
            }
          >
            Map
          </button>
        </div>
      </div>

      <CompactFiltersBar
        isClassic={isClassic}
        operatorFilter={operatorFilter}
        formationFilter={formationFilter}
        statusFilter={statusFilter}
        operatorOptions={operatorOptions}
        formationOptions={formationOptions}
        statusOptions={statusOptions}
        onSetOperatorFilter={onSetOperatorFilter}
        onSetFormationFilter={onSetFormationFilter}
        onSetStatusFilter={onSetStatusFilter}
        onResetFilters={onResetFilters}
        filteredWellsCount={filteredWellsCount}
        totalWellCount={totalWellCount}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
      />

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${viewportLayout === 'desktop' ? 'xl:min-h-[calc(100vh-11rem)] xl:auto-rows-fr' : ''}`}>
        <aside
          className={`xl:col-span-4 lg:col-span-5 lg:min-h-0 xl:overflow-y-auto scrollbar-hide space-y-6 pb-4 theme-transition ${
            isClassic ? 'p-1' : 'p-4 rounded-panel bg-theme-bg/60 backdrop-blur-sm border border-theme-border'
          } ${mobilePanel !== 'GROUPS' ? 'hidden lg:block' : ''}`}
        >
          <GroupList
            groups={groups}
            activeGroupId={activeGroupId}
            onActivateGroup={onActivateGroup}
            onAddGroup={onAddGroup}
            onCloneGroup={onCloneGroup}
          />

          {activeGroup && (
            <WellsTable
              wells={wells.filter(w => activeGroup.wellIds.has(w.id))}
              selectedWellIds={selectedWellIds}
              onSelectWells={onSelectWells}
              onToggleWell={onToggleWell}
            />
          )}

        </aside>

        <section className={`xl:col-span-8 lg:col-span-7 lg:min-h-0 flex flex-col space-y-6 ${mobilePanel !== 'MAP' ? 'hidden lg:flex' : ''}`}>
          {isClassic ? (
            <div className={`w-full shrink-0 min-h-[360px] ${mapHeightClass} ${isMobileMap ? 'mb-24' : ''} sc-panel theme-transition`}>
              <div className="sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex justify-between items-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-white/70"></span>
                  BASIN VISUALIZER
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onSelectAll}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 hover:text-white transition-colors"
                  >
                    {selectFilteredLabel.toUpperCase()}
                  </button>
                  <button
                    onClick={onClearSelection}
                    disabled={selectedWellCount === 0}
                    className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                      selectedWellCount > 0 ? 'text-white/70 hover:text-white' : 'text-white/30 cursor-not-allowed'
                    }`}
                  >
                    CLEAR
                  </button>
                </div>
              </div>
              <div className="p-3 h-[calc(100%-48px)]">
                <div className="sc-screen h-full w-full">
                  <MapVisualizer
                    wells={wells}
                    selectedWellIds={selectedWellIds}
                    visibleWellIds={visibleWellIds}
                    dimmedWellIds={dimmedWellIds}
                    groups={groups}
                    onToggleWell={onToggleWell}
                    onSelectWells={onSelectWells}
                    themeId={themeId}
                    uiBottomInsetPx={isMobileMap ? 96 : 0}
                    activeFilters={activeFilters}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full shrink-0 min-h-[360px] ${mapHeightClass} ${isMobileMap ? 'mb-24' : ''} rounded-panel border shadow-card relative overflow-hidden group theme-transition bg-theme-bg border-theme-border`}>
              <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-center px-4 py-3 relative z-10 bg-theme-surface1/30 backdrop-blur-sm border-b border-theme-border/20">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 theme-transition text-theme-cyan">
                  <span className="w-2 h-2 rounded-full animate-pulse bg-theme-cyan"></span>
                  Basin Visualizer
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={onSelectAll} className="text-[10px] font-bold tracking-[0.1em] theme-transition hover:scale-105 text-theme-lavender">
                    {selectFilteredLabel.toUpperCase()}
                  </button>
                  <button
                    onClick={onClearSelection}
                    disabled={selectedWellCount === 0}
                    className={`px-2 py-1 rounded-inner border text-[9px] font-black uppercase tracking-[0.14em] transition-colors ${
                      selectedWellCount > 0
                        ? 'bg-theme-bg/60 border-theme-border text-theme-muted hover:text-theme-text'
                        : 'bg-theme-bg/40 border-theme-border/60 text-theme-muted/50 cursor-not-allowed'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="h-[calc(100%-48px)] w-full relative z-0">
                <MapVisualizer
                  wells={wells}
                  selectedWellIds={selectedWellIds}
                  visibleWellIds={visibleWellIds}
                  dimmedWellIds={dimmedWellIds}
                  groups={groups}
                  onToggleWell={onToggleWell}
                  onSelectWells={onSelectWells}
                  themeId={themeId}
                  uiBottomInsetPx={isMobileMap ? 96 : 0}
                  activeFilters={activeFilters}
                />
              </div>
            </div>
          )}

          {!isMobileMap && (
            <div className={isClassic ? 'sc-panel theme-transition' : 'utility-surface p-4 theme-transition'}>
              <h3 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.2em] text-white mb-3' : 'text-[10px] font-black uppercase tracking-[0.2em] text-theme-cyan mb-3'}>
                Selection Actions
              </h3>
              {selectedWellCount === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-2xl mb-2">📍</div>
                  <p className="text-[11px] text-theme-muted">Select wells on the map to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={onAssignWells}
                    className="w-full px-3 py-2.5 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all bg-theme-cyan text-theme-bg hover:shadow-glow-cyan"
                  >
                    Assign to {activeGroup?.name || 'active group'}
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={onCreateGroupFromSelection}
                      className="px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border bg-theme-surface2 text-theme-text border-theme-border hover:border-theme-cyan"
                    >
                      Create group
                    </button>
                    <button
                      onClick={onSelectAll}
                      className="px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all bg-theme-surface2 text-theme-text border border-theme-border hover:border-theme-cyan"
                    >
                      {selectFilteredLabel}
                    </button>
                    <button
                      onClick={onClearSelection}
                      className="px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border bg-theme-surface2 text-theme-text border-theme-border hover:border-theme-cyan"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {isMobileMap && (
        <div className="fixed left-3 right-3 bottom-3 z-50 pb-[env(safe-area-inset-bottom)]">
          <div
            className={
              isClassic
                ? 'sc-panel theme-transition'
                : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/80 border-theme-border backdrop-blur-sm'
            }
          >
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={isClassic ? 'text-white font-black text-[11px] uppercase tracking-[0.18em]' : 'text-theme-muted text-[10px] font-black uppercase tracking-[0.18em]'}>
                    Selected {selectedWellCount} / Visible {filteredWellsCount}
                  </div>
                  <div className={isClassic ? 'text-white/85 text-sm font-black truncate' : 'text-theme-text text-sm font-black truncate'}>
                    Active: {activeGroup?.name || '—'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileTrayExpanded(v => !v)}
                  className={
                    isClassic
                      ? 'sc-btnSecondary px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-widest transition-all'
                      : 'px-3 py-1.5 rounded-inner border border-theme-border bg-theme-bg text-theme-muted text-[9px] font-black uppercase tracking-[0.16em] hover:text-theme-text transition-colors'
                  }
                  aria-expanded={mobileTrayExpanded}
                >
                  {mobileTrayExpanded ? 'Less' : 'More'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={onAssignWells}
                  disabled={selectedWellCount === 0}
                  className={
                    isClassic
                      ? `sc-btnPrimary w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedWellCount > 0 ? '' : 'opacity-60 cursor-not-allowed'
                        }`
                      : `w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                          selectedWellCount > 0 ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan' : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
                        }`
                  }
                >
                  Assign to group
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onClearSelection}
                  disabled={selectedWellCount === 0}
                  className={
                    isClassic
                      ? `sc-btnSecondary w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedWellCount > 0 ? '' : 'opacity-60 cursor-not-allowed'
                        }`
                      : `w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border ${
                          selectedWellCount > 0 ? 'bg-theme-surface2 text-theme-text border-theme-border hover:border-theme-cyan' : 'bg-theme-surface2 text-theme-muted border-theme-border cursor-not-allowed'
                        }`
                  }
                >
                  Clear
                </button>
                <button
                  onClick={onSelectAll}
                  className={
                    isClassic
                      ? 'sc-btnSecondary w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-widest transition-all'
                      : 'w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all bg-theme-surface2 text-theme-text border border-theme-border hover:border-theme-cyan'
                  }
                >
                  {selectFilteredLabel}
                </button>
              </div>

              {mobileTrayExpanded && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onCreateGroupFromSelection}
                    disabled={selectedWellCount === 0}
                    className={
                      isClassic
                        ? `sc-btnSecondary w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-widest transition-all ${
                            selectedWellCount > 0 ? '' : 'opacity-60 cursor-not-allowed'
                          }`
                        : `w-full px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border ${
                            selectedWellCount > 0 ? 'bg-theme-surface2 text-theme-text border-theme-border hover:border-theme-cyan' : 'bg-theme-surface2 text-theme-muted border-theme-border cursor-not-allowed'
                          }`
                    }
                  >
                    Create group
                  </button>
                  <div className="rounded-inner border border-dashed border-theme-border/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-theme-muted text-center">
                    {activeGroup?.name || 'Active group'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(DesignWellsView);
