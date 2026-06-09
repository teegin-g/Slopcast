import React from 'react';
import type { Well, WellGroup } from '../../../../types';
import { DEFAULT_TYPE_CURVE } from '../../../../constants';
import { useTheme } from '../../../../theme/ThemeProvider';
import { overlayPanelClass } from '../../../../theme/themes';
import { useDockMode } from './useDockMode';
import ForecastTab from './ForecastTab';
import EconomicsTab from './EconomicsTab';
import AssumptionsTab from './AssumptionsTab';
import SummaryTab from './SummaryTab';
import ProductionChart from './ProductionChart';
import ProbitChart from './ProbitChart';

export interface InsightsDockProps {
  /** The active group (group mode). */
  activeGroup: WellGroup | null;
  /** Wells in the active group (group mode: forecast). */
  groupWells: Well[];
  /** Lasso-selected wells (selection mode). */
  selectedWells: Well[];
  isClassic: boolean;
  /** Dismiss handler — parent hides the dock. */
  onDismiss: () => void;
  /** Clear-selection handler (selection mode header action). Optional. */
  onClearSelection?: () => void;
}

// ─── Tab definitions per mode ─────────────────────────────────────────────────

interface TabDef {
  id: string;
  label: string;
}

const GROUP_TABS: TabDef[] = [
  { id: 'forecast', label: 'Forecast' },
  { id: 'economics', label: 'Economics' },
  { id: 'assumptions', label: 'Assumptions' },
];

const SELECTION_TABS: TabDef[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'production', label: 'Production' },
  { id: 'probit', label: 'Probit' },
];

/**
 * InsightsDock — a dismissible floating dock at the bottom of the map.
 *
 * Mode (group vs selection) is *derived* from selection count via useDockMode;
 * tabs swap with mode and the active tab is remembered per-mode by the hook.
 *
 *   - GROUP mode (no wells lasso-selected): forecast / economics / assumptions
 *     for the active group. A blue dot + the group name is the mode "tell".
 *   - SELECTION mode (≥1 well selected): summary / production / probit for the
 *     custom lasso selection. A green dot + "N selected" + a "Clear selection"
 *     action is the mode "tell".
 *
 * Presentational shell only — it does NOT mount itself into the map (Task 2.9
 * wires it into MapCommandCenter). The parent owns dock visibility via onDismiss.
 */
const InsightsDock: React.FC<InsightsDockProps> = ({
  activeGroup,
  groupWells,
  selectedWells,
  isClassic,
  onDismiss,
  onClearSelection,
}) => {
  const { theme } = useTheme();

  // Hooks must be unconditional and above any early return (Rules of Hooks).
  const selectionCount = selectedWells.length;
  const { mode, activeTab, setActiveTab } = useDockMode(selectionCount, 'forecast', 'summary');

  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : `rounded-panel ${overlayPanelClass(theme.features.panelStyle)} theme-transition`;

  const tabs = mode === 'group' ? GROUP_TABS : SELECTION_TABS;

  // ProductionChart needs a typeCurve; prefer the active group's, else the
  // app-wide default so the chart still renders without an active group.
  const typeCurve = activeGroup?.typeCurve ?? DEFAULT_TYPE_CURVE;

  return (
    <div
      data-testid="insights-dock"
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[64%] max-w-[920px] pointer-events-auto"
    >
      <div className={`${panelClass} shadow-card overflow-hidden`}>
        {/* ── Header row: mode tell + dismiss ──────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-theme-border/50">
          {mode === 'group' ? (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="size-2 rounded-full shrink-0 bg-theme-cyan"
                aria-hidden="true"
              />
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-theme-text truncate">
                {activeGroup ? activeGroup.name : 'No active group'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="size-2 rounded-full shrink-0 bg-theme-success"
                aria-hidden="true"
              />
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-theme-text tabular-nums">
                {selectionCount} selected
              </span>
              {onClearSelection && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted hover:text-theme-text transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>
          )}

          {/* Tab bar (segmented) — pushed to center/right of header */}
          <div
            role="tablist"
            aria-label={`${mode === 'group' ? 'Group' : 'Selection'} insight tabs`}
            className="ml-auto flex items-center gap-1"
            tabIndex={-1}
            onKeyDown={(e) => {
              const idx = tabs.findIndex((t) => t.id === activeTab);
              if (e.key === 'ArrowRight') { e.preventDefault(); setActiveTab(tabs[(idx + 1) % tabs.length].id); }
              else if (e.key === 'ArrowLeft') { e.preventDefault(); setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length].id); }
              else if (e.key === 'Home') { e.preventDefault(); setActiveTab(tabs[0].id); }
              else if (e.key === 'End') { e.preventDefault(); setActiveTab(tabs[tabs.length - 1].id); }
            }}
          >
            {tabs.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`dock-tab-btn-${tab.id}`}
                  aria-selected={selected}
                  aria-controls="dock-tabpanel"
                  tabIndex={selected ? 0 : -1}
                  data-testid={`dock-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'rounded-inner px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] transition-colors',
                    selected
                      ? isClassic
                        ? 'bg-theme-surface2 text-theme-warning border border-theme-border'
                        : 'bg-theme-surface2 text-theme-cyan border border-[var(--cyan)]/40'
                      : 'text-theme-muted border border-transparent hover:text-theme-text',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss dock"
            className="shrink-0 -mr-1 rounded-inner px-1.5 py-1 text-theme-muted hover:text-theme-text transition-colors leading-none"
          >
            <span aria-hidden="true" className="text-sm">✕</span>
          </button>
        </div>

        {/* ── Body: active tab content ─────────────────────────────────── */}
        <div
          id="dock-tabpanel"
          role="tabpanel"
          aria-labelledby={`dock-tab-btn-${activeTab}`}
          className="max-h-[240px] overflow-y-auto"
        >
          {mode === 'group'
            ? renderGroupBody({ activeTab, activeGroup, groupWells, isClassic })
            : renderSelectionBody({ activeTab, selectedWells, typeCurve, isClassic })}
        </div>
      </div>
    </div>
  );
};

// ─── Body renderers ───────────────────────────────────────────────────────────

function renderGroupBody(args: {
  activeTab: string;
  activeGroup: WellGroup | null;
  groupWells: Well[];
  isClassic: boolean;
}): React.ReactNode {
  const { activeTab, activeGroup, groupWells, isClassic } = args;

  if (!activeGroup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[140px] py-8 text-center px-4">
        <p className="text-[11px] font-semibold text-theme-muted leading-relaxed">
          No active group. Pick a group to see its forecast, economics, and assumptions.
        </p>
      </div>
    );
  }

  switch (activeTab) {
    case 'economics':
      return <EconomicsTab group={activeGroup} isClassic={isClassic} />;
    case 'assumptions':
      return <AssumptionsTab group={activeGroup} isClassic={isClassic} />;
    case 'forecast':
    default:
      return <ForecastTab group={activeGroup} wells={groupWells} isClassic={isClassic} />;
  }
}

function renderSelectionBody(args: {
  activeTab: string;
  selectedWells: Well[];
  typeCurve: WellGroup['typeCurve'];
  isClassic: boolean;
}): React.ReactNode {
  const { activeTab, selectedWells, typeCurve, isClassic } = args;

  switch (activeTab) {
    case 'production':
      return <ProductionChart wells={selectedWells} typeCurve={typeCurve} isClassic={isClassic} />;
    case 'probit':
      return <ProbitChart wells={selectedWells} isClassic={isClassic} />;
    case 'summary':
    default:
      return <SummaryTab wells={selectedWells} isClassic={isClassic} />;
  }
}

export default InsightsDock;
