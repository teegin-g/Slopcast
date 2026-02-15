import React from 'react';
import GroupList from '../GroupList';
import MapVisualizer from '../MapVisualizer';
import { ThemeMeta, ThemeId } from '../../theme/themes';
import { Well, WellGroup } from '../../types';

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

const FiltersPanel: React.FC<{
  isClassic: boolean;
  theme: ThemeMeta;
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
}> = ({
  isClassic,
  theme,
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
}) => {
  if (isClassic) {
    return (
      <div className="sc-panel theme-transition">
        <div className="sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">Filters</h3>
          <button
            onClick={onResetFilters}
            className="text-[10px] font-black uppercase tracking-widest text-white/90 hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>
        <div className="p-3 space-y-3 bg-black/10">
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
              className="w-full rounded-md px-3 py-2 text-xs font-black sc-inputNavy"
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
              className="w-full rounded-md px-3 py-2 text-xs font-black sc-inputNavy"
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80 border border-black/25 rounded-md px-3 py-2">
            {filteredWellsCount} visible / {totalWellCount} total
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-panel border p-4 shadow-card theme-transition bg-theme-surface1/80 border-theme-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold text-sm uppercase tracking-wide text-theme-cyan ${theme.features.brandFont ? 'brand-font' : ''}`}>Filters</h3>
        <button
          onClick={onResetFilters}
          className="text-[10px] px-3 py-1 rounded-inner border font-black uppercase tracking-[0.16em] border-theme-border text-theme-muted hover:text-theme-text"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3">
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
      <div className="mt-3 rounded-inner border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-theme-muted border-theme-border bg-theme-bg">
        {filteredWellsCount} visible / {totalWellCount} total
      </div>
    </div>
  );
};

const DesignWellsView: React.FC<DesignWellsViewProps> = ({
  isClassic,
  theme,
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
                ? `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                    mobilePanel === 'GROUPS' ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                  }`
                : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border transition-colors ${
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
                ? `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                    mobilePanel === 'MAP' ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                  }`
                : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border transition-colors ${
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

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${viewportLayout === 'desktop' ? 'xl:min-h-[calc(100vh-11rem)] xl:auto-rows-fr' : ''}`}>
        <aside
          className={`xl:col-span-4 lg:col-span-5 lg:min-h-0 xl:overflow-y-auto scrollbar-hide space-y-6 pb-4 theme-transition ${
            isClassic ? 'p-1' : 'p-4 rounded-panel bg-theme-bg/60 backdrop-blur-sm border border-theme-border'
          } ${mobilePanel !== 'GROUPS' ? 'hidden lg:block' : ''}`}
        >
          <GroupList
            groups={groups}
            activeGroupId={activeGroupId}
            selectedWellCount={selectedWellCount}
            onActivateGroup={onActivateGroup}
            onAddGroup={onAddGroup}
            onCloneGroup={onCloneGroup}
            onAssignWells={onAssignWells}
            onCreateGroupFromSelection={onCreateGroupFromSelection}
          />

          <FiltersPanel
            isClassic={isClassic}
            theme={theme}
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
          />
        </aside>

        <section className={`xl:col-span-8 lg:col-span-7 lg:min-h-0 flex flex-col space-y-6 ${mobilePanel !== 'MAP' ? 'hidden lg:flex' : ''}`}>
          {isClassic ? (
            <div className="w-full shrink-0 min-h-[360px] h-[min(64vh,620px)] sc-panel theme-transition">
              <div className="sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex justify-between items-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-white/70"></span>
                  BASIN VISUALIZER
                </h2>
                <button
                  onClick={onSelectAll}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 hover:text-white transition-colors"
                >
                  {filteredWellsCount > 0 && selectedWellCount === filteredWellsCount ? 'DESELECT FILTERED' : 'SELECT FILTERED'}
                </button>
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
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full shrink-0 min-h-[360px] h-[min(64vh,620px)] rounded-panel border shadow-card relative overflow-hidden group theme-transition bg-theme-bg border-theme-border">
              <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-transparent pointer-events-none"></div>
              <div className="flex justify-between items-center px-4 py-3 relative z-10 bg-black/10 backdrop-blur-sm border-b border-white/5">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 theme-transition text-theme-cyan">
                  <span className="w-2 h-2 rounded-full animate-pulse bg-theme-cyan"></span>
                  Basin Visualizer
                </h2>
                <button onClick={onSelectAll} className="text-[10px] font-bold tracking-[0.1em] theme-transition hover:scale-105 text-theme-lavender">
                  {filteredWellsCount > 0 && selectedWellCount === filteredWellsCount ? 'DESELECT FILTERED' : 'SELECT FILTERED'}
                </button>
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
                />
              </div>
            </div>
          )}

          <div className={isClassic ? 'sc-panel theme-transition' : 'rounded-panel border shadow-card p-4 theme-transition bg-theme-surface1 border-theme-border'}>
            <h3 className={isClassic ? 'text-[10px] font-black uppercase tracking-[0.2em] text-white mb-3' : 'text-[10px] font-black uppercase tracking-[0.2em] text-theme-cyan mb-3'}>
              Selection Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onAssignWells}
                disabled={selectedWellCount === 0}
                className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                  selectedWellCount > 0 ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan' : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
                }`}
              >
                Assign
              </button>
              <button
                onClick={onCreateGroupFromSelection}
                disabled={selectedWellCount === 0}
                className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all ${
                  selectedWellCount > 0 ? 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan' : 'bg-theme-surface2 text-theme-muted cursor-not-allowed'
                }`}
              >
                Create Group
              </button>
              <button
                onClick={onSelectAll}
                className="px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all bg-theme-surface2 text-theme-text border border-theme-border hover:border-theme-cyan"
              >
                Select All
              </button>
              <button
                onClick={onClearSelection}
                disabled={selectedWellCount === 0}
                className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.12em] transition-all border ${
                  selectedWellCount > 0 ? 'bg-theme-surface2 text-theme-text border-theme-border hover:border-theme-cyan' : 'bg-theme-surface2 text-theme-muted border-theme-border cursor-not-allowed'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default DesignWellsView;
