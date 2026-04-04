import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_CAPEX, DEFAULT_COMMODITY_PRICING, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE, GROUP_COLORS, MOCK_WELLS } from '../constants';
import { Scenario, ScheduleParams, Well, WellGroup, DEFAULT_TAX_ASSUMPTIONS, DEFAULT_DEBT_ASSUMPTIONS } from '../types';
import { DesignWorkspace } from '../components/slopcast/DesignWorkspaceTabs';
import { EconomicsResultsTab } from '../components/slopcast/EconomicsResultsTabs';
import { DesignStep, StepStatus, WorkflowStep } from '../components/slopcast/WorkflowStepper';
import { WellsMobilePanel } from '../components/slopcast/DesignWellsView';
import { EconomicsMobilePanel } from '../components/slopcast/DesignEconomicsView';
import type { OperationsConsoleProps } from '../components/slopcast/OperationsConsole';
import { useViewportLayout } from '../components/slopcast/hooks/useViewportLayout';
import { useProjectPersistence } from '../components/slopcast/hooks/useProjectPersistence';
import { useAuth } from '../auth/AuthProvider';
import { hasSupabaseEnv } from '../services/supabaseClient';
import { useTheme } from '../theme/ThemeProvider';
import { aggregateEconomics, cachedCalculateEconomics, applyTaxLayer, applyDebtLayer, applyReservesRisk } from '../utils/economics';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useDerivedMetrics } from './useDerivedMetrics';
import {
  getDesignWorkspace,
  setDesignWorkspace as storeDesignWorkspace,
  getEconomicsResultsTab,
  setEconomicsResultsTab as storeEconomicsResultsTab,
  getEconomicsFocusMode,
  setEconomicsFocusMode as storeEconomicsFocusMode,
  getFxMode,
  setFxMode,
  clearFxMode,
  setAnalysisOpenSection as storeAnalysisOpenSection,
} from '../services/storage/workspacePreferences';
import type { ParsedFilters } from '../components/slopcast/LandingPage';
import type { DealRecord } from '../types';

// ─── Types ──────────────────────────────────────────────────────────

type ViewMode = 'DASHBOARD' | 'ANALYSIS';
type OpsTab = 'SELECTION_ACTIONS' | 'KEY_DRIVERS';
type FxMode = 'cinematic' | 'max';
type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP';
type AnalysisOpenSection = 'PRICING' | 'SCHEDULE' | 'SCALARS';
type PageMode = 'landing' | 'workspace';

export type { ViewMode, OpsTab, FxMode, ControlsSection, AnalysisOpenSection, PageMode };

// ─── Constants ──────────────────────────────────────────────────────

const DEFAULT_SCHEDULE: ScheduleParams = {
  annualRigs: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  drillDurationDays: 18,
  stimDurationDays: 12,
  rigStartDate: new Date().toISOString().split('T')[0],
};

export const FX_QUERY_KEY = 'fx';

// ─── Helpers ────────────────────────────────────────────────────────

const csvCell = (value: string | number) => {
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

// ─── Hook ───────────────────────────────────────────────────────────

export function useSlopcastWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, session } = useAuth();

  // --- Theme ---
  const { themeId, theme, themes, setThemeId, colorMode, setColorMode, effectiveMode } = useTheme();
  const isClassic = themeId === 'mario';
  const isFxTheme = !!theme.fxTheme;

  const fxMode = useMemo<FxMode>(() => {
    if (!isFxTheme) return 'cinematic';
    const fromQuery = new URLSearchParams(location.search).get(FX_QUERY_KEY);
    if (fromQuery === 'cinematic' || fromQuery === 'max') return fromQuery;
    if (fromQuery === 'clear') return 'cinematic';
    return getFxMode(themeId) ?? 'cinematic';
  }, [isFxTheme, location.search, themeId]);

  useEffect(() => {
    if (!isFxTheme) return;
    const fromQuery = new URLSearchParams(location.search).get(FX_QUERY_KEY);
    if (fromQuery === 'clear') {
      clearFxMode(themeId);
      return;
    }
    if (fromQuery !== 'cinematic' && fromQuery !== 'max') return;
    setFxMode(themeId, fromQuery);
  }, [isFxTheme, location.search, themeId]);

  const fxClass = isFxTheme ? `fx-${fxMode}` : '';
  const atmosphereClass = theme.atmosphereClass || '';
  const headerAtmosphereClass = theme.headerAtmosphereClass || '';
  const BackgroundComponent = theme.BackgroundComponent;
  const atmosphericOverlays = theme.atmosphericOverlays || [];

  // --- Page mode ---
  const [pageMode, setPageMode] = useState<PageMode>('landing');
  const [savedDeals, setSavedDeals] = useState<DealRecord[]>([]);

  const handleSelectDeal = useCallback((dealId: string) => {
    setPageMode('workspace');
  }, []);

  const handleCreateDeal = useCallback(() => {
    setPageMode('workspace');
  }, []);

  const handleAcreageSearch = useCallback((query: string, filters: ParsedFilters) => {
    console.log('[AcreageSearch]', query, filters);
  }, []);

  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [designWorkspace, setDesignWorkspace] = useState<DesignWorkspace>(getDesignWorkspace);
  const [wellsMobilePanel, setWellsMobilePanel] = useState<WellsMobilePanel>('MAP');
  const [economicsMobilePanel, setEconomicsMobilePanel] = useState<EconomicsMobilePanel>('RESULTS');
  const [economicsResultsTab, setEconomicsResultsTab] = useState<EconomicsResultsTab>(getEconomicsResultsTab);
  const [economicsFocusMode, setEconomicsFocusMode] = useState<boolean>(getEconomicsFocusMode);
  const [opsTab, setOpsTab] = useState<OpsTab>('SELECTION_ACTIONS');
  const viewportLayout = useViewportLayout();
  const [controlsOpenSection, setControlsOpenSection] = useState<ControlsSection | null>(null);

  const [groups, setGroups] = useState<WellGroup[]>([
    {
      id: 'g-1',
      name: 'Tier 1 - Core',
      color: GROUP_COLORS[0],
      wellIds: new Set(MOCK_WELLS.map(w => w.id)),
      typeCurve: { ...DEFAULT_TYPE_CURVE },
      capex: { ...DEFAULT_CAPEX },
      opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map(seg => ({ ...seg })) },
      ownership: { ...DEFAULT_OWNERSHIP, agreements: [] }
    }
  ]);

  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 's-base',
      name: 'BASE CASE',
      color: '#9ED3F0',
      isBaseCase: true,
      pricing: { ...DEFAULT_COMMODITY_PRICING },
      schedule: { ...DEFAULT_SCHEDULE },
      capexScalar: 1.0,
      productionScalar: 1.0
    },
    {
      id: 's-upside',
      name: 'BULL SCENARIO',
      color: '#E566DA',
      isBaseCase: false,
      pricing: { ...DEFAULT_COMMODITY_PRICING, oilPrice: 85 },
      schedule: { ...DEFAULT_SCHEDULE },
      capexScalar: 1.0,
      productionScalar: 1.0
    },
    {
      id: 's-fast',
      name: 'RAMP PROGRAM',
      color: '#2DFFB1',
      isBaseCase: false,
      pricing: { ...DEFAULT_COMMODITY_PRICING },
      schedule: { ...DEFAULT_SCHEDULE, annualRigs: [1, 2, 3, 4, 4, 4, 4, 4, 4, 4] },
      capexScalar: 1.0,
      productionScalar: 1.0
    }
  ]);

  const [activeGroupId, setActiveGroupId] = useState<string>('g-1');
  const [selectedWellIds, setSelectedWellIds] = useState<Set<string>>(new Set());
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [snapshotHistory, setSnapshotHistory] = useState<Array<{ npv: number; capex: number; eur: number; payout: number; timestamp: number }>>([]);
  const [showAfterTax, setShowAfterTax] = useState(false);
  const [showLevered, setShowLevered] = useState(false);
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [formationFilter, setFormationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<Well['status'] | 'ALL'>('ALL');

  // --- Computed Economics per Group ---
  const processedGroups = useMemo(() => {
    const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
    const basePricing = baseScenario?.pricing || DEFAULT_COMMODITY_PRICING;
    return groups.map(group => {
      const groupWells = MOCK_WELLS.filter(w => group.wellIds.has(w.id));
      let { flow, metrics } = cachedCalculateEconomics(groupWells, group.typeCurve, group.capex, basePricing, group.opex, group.ownership);

      if (group.taxAssumptions) {
        const taxResult = applyTaxLayer(flow, metrics, group.taxAssumptions);
        flow = taxResult.flow;
        metrics = taxResult.metrics;
      }

      if (group.debtAssumptions?.enabled) {
        const debtResult = applyDebtLayer(flow, metrics, group.debtAssumptions);
        flow = debtResult.flow;
        metrics = debtResult.metrics;
      }

      if (group.reserveCategory) {
        metrics = applyReservesRisk(metrics, group.reserveCategory);
      }

      return { ...group, flow, metrics };
    });
  }, [groups, scenarios]);

  // --- Aggregate Portfolio Economics ---
  const { flow: aggregateFlow, metrics: aggregateMetrics } = useMemo(() => {
    return aggregateEconomics(processedGroups);
  }, [processedGroups]);

  const operatorOptions = useMemo(() => {
    return Array.from(new Set(MOCK_WELLS.map(well => well.operator))).sort();
  }, []);

  const formationOptions = useMemo(() => {
    return Array.from(new Set(MOCK_WELLS.map(well => well.formation))).sort();
  }, []);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(MOCK_WELLS.map(well => well.status)));
  }, []);

  const filteredWells = useMemo(() => {
    return MOCK_WELLS.filter(well => {
      if (operatorFilter !== 'ALL' && well.operator !== operatorFilter) return false;
      if (formationFilter !== 'ALL' && well.formation !== formationFilter) return false;
      if (statusFilter !== 'ALL' && well.status !== statusFilter) return false;
      return true;
    });
  }, [formationFilter, operatorFilter, statusFilter]);

  const visibleWellIds = useMemo(() => {
    return new Set(filteredWells.map(well => well.id));
  }, [filteredWells]);

  const dimmedWellIds = useMemo(() => {
    const ids = new Set<string>();
    MOCK_WELLS.forEach(well => {
      if (!visibleWellIds.has(well.id)) ids.add(well.id);
    });
    return ids;
  }, [visibleWellIds]);

  const selectedVisibleCount = useMemo(() => {
    let count = 0;
    selectedWellIds.forEach(id => {
      if (visibleWellIds.has(id)) count += 1;
    });
    return count;
  }, [selectedWellIds, visibleWellIds]);

  const supabasePersistenceEnabled =
    status === 'authenticated' && session?.provider === 'supabase' && hasSupabaseEnv();

  const persistence = useProjectPersistence({
    enabled: supabasePersistenceEnabled,
    projectName: 'Slopcast Project',
    groups,
    scenarios,
    activeGroupId,
    uiState: {
      designWorkspace,
      economicsResultsTab,
      operatorFilter,
      formationFilter,
      statusFilter,
    },
    setGroups,
    setScenarios,
    setActiveGroupId,
    setDesignWorkspace,
    setEconomicsResultsTab,
    setOperatorFilter,
    setFormationFilter,
    setStatusFilter,
    onStatusMessage: setActionMessage,
  });

  // --- Handlers ---
  const activeGroup = processedGroups.find(g => g.id === activeGroupId) || processedGroups[0];
  const handleSetScenarios: React.Dispatch<React.SetStateAction<Scenario[]>> = useCallback((next) => {
    setScenarios(next);
  }, []);

  const handleUpdateGroup = useCallback((updatedGroup: WellGroup) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  }, []);

  const handleAddGroup = useCallback(() => {
    const newId = `g-${Date.now()}`;
    setGroups(prev => {
      const color = GROUP_COLORS[prev.length % GROUP_COLORS.length];
      const newGroup: WellGroup = {
        id: newId,
        name: `Group ${prev.length + 1}`,
        color,
        wellIds: new Set(),
        typeCurve: { ...DEFAULT_TYPE_CURVE },
        capex: { ...DEFAULT_CAPEX },
        opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map(seg => ({ ...seg, id: `o-${Date.now()}-${Math.random()}` })) },
        ownership: { ...DEFAULT_OWNERSHIP, agreements: [] }
      };
      return [...prev, newGroup];
    });
    setActiveGroupId(newId);
  }, []);

  const handleCloneGroup = useCallback((groupId: string) => {
    const newId = `g-${Date.now()}`;
    setGroups(prev => {
      const sourceGroup = prev.find(g => g.id === groupId);
      if (!sourceGroup) return prev;
      const color = GROUP_COLORS[prev.length % GROUP_COLORS.length];
      const newGroup: WellGroup = {
        id: newId,
        name: `${sourceGroup.name} (Copy)`,
        color,
        wellIds: new Set(sourceGroup.wellIds),
        typeCurve: { ...sourceGroup.typeCurve },
        capex: {
          ...sourceGroup.capex,
          items: sourceGroup.capex.items.map(i => ({ ...i, id: `c-${Date.now()}-${Math.random()}` }))
        },
        opex: { ...sourceGroup.opex, segments: sourceGroup.opex.segments.map(seg => ({ ...seg, id: `o-${Date.now()}-${Math.random()}` })) },
        ownership: { ...sourceGroup.ownership, agreements: sourceGroup.ownership.agreements.map(a => ({ ...a, id: `jv-${Date.now()}-${Math.random()}` })) }
      };
      return [...prev, newGroup];
    });
    setActiveGroupId(newId);
  }, []);

  const handleAssignWellsToActive = useCallback(() => {
    setSelectedWellIds(prevSelected => {
      if (prevSelected.size === 0) return prevSelected;
      setGroups(prevGroups => {
        return prevGroups.map(g => {
          const nextIds = new Set(g.wellIds);
          if (g.id === activeGroupId) {
            prevSelected.forEach(id => nextIds.add(id));
          } else {
            prevSelected.forEach(id => nextIds.delete(id));
          }
          return { ...g, wellIds: nextIds };
        });
      });
      return new Set();
    });
  }, [activeGroupId]);

  const handleCreateGroupFromSelection = useCallback(() => {
    setSelectedWellIds(prevSelected => {
      if (prevSelected.size === 0) return prevSelected;
      const newId = `g-${Date.now()}`;
      const newGroup: WellGroup = {
        id: newId,
        name: `Selection Set`,
        color: '#888',
        wellIds: new Set(prevSelected),
        typeCurve: { ...DEFAULT_TYPE_CURVE },
        capex: { ...DEFAULT_CAPEX },
        opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map(seg => ({ ...seg, id: `o-${Date.now()}-${Math.random()}` })) },
        ownership: { ...DEFAULT_OWNERSHIP, agreements: [] }
      };
      setGroups(prevGroups => {
        newGroup.color = GROUP_COLORS[prevGroups.length % GROUP_COLORS.length];
        newGroup.name = `Selection Set ${prevGroups.length + 1}`;
        const updatedPrevGroups = prevGroups.map(g => {
          const nextIds = new Set(g.wellIds);
          prevSelected.forEach(id => nextIds.delete(id));
          return { ...g, wellIds: nextIds };
        });
        return [...updatedPrevGroups, newGroup];
      });
      setActiveGroupId(newId);
      return new Set();
    });
  }, []);

  const handleToggleWell = useCallback((id: string) => {
    setSelectedWellIds(prev => {
      if (!visibleWellIds.has(id)) return prev;
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [visibleWellIds]);

  const handleSelectWells = useCallback((ids: string[]) => {
    setSelectedWellIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => {
        if (visibleWellIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [visibleWellIds]);

  const handleSelectAll = useCallback(() => {
    if (filteredWells.length === 0) {
      setActionMessage('No visible wells match current filters.');
      return;
    }

    if (selectedVisibleCount === filteredWells.length) {
      setSelectedWellIds(prev => {
        const next = new Set(prev);
        visibleWellIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedWellIds(prev => {
        const next = new Set(prev);
        visibleWellIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [filteredWells.length, selectedVisibleCount, visibleWellIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedWellIds(new Set());
  }, []);

  const handleResetFilters = () => {
    setOperatorFilter('ALL');
    setFormationFilter('ALL');
    setStatusFilter('ALL');
  };

  // Sync selected wells with visible wells
  useEffect(() => {
    setSelectedWellIds(prev => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach(id => {
        if (visibleWellIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [visibleWellIds]);

  const scenarioRankings = useMemo(() => {
    return processedGroups
      .map(group => {
        const metrics = group.metrics || { npv10: 0, totalCapex: 0, eur: 0, payoutMonths: 0, wellCount: 0 };
        const totalRevenue = group.flow?.reduce((sum, f) => sum + f.revenue, 0) || 0;
        const totalOpex = group.flow?.reduce((sum, f) => sum + f.opex, 0) || 0;
        const roi = metrics.totalCapex > 0
          ? (totalRevenue - totalOpex) / metrics.totalCapex
          : 0;
        return {
          id: group.id,
          name: group.name,
          wellCount: metrics.wellCount,
          npv10: metrics.npv10,
          totalCapex: metrics.totalCapex,
          eur: metrics.eur,
          roi,
          payoutMonths: metrics.payoutMonths,
          baseNri: group.ownership.baseNri,
          baseCostInterest: group.ownership.baseCostInterest,
        };
      })
      .sort((a, b) => {
        if (b.npv10 !== a.npv10) return b.npv10 - a.npv10;
        return b.roi - a.roi;
      });
  }, [processedGroups]);

  const portfolioRoi = useMemo(() => {
    const totalRevenue = aggregateFlow.reduce((sum, f) => sum + f.revenue, 0);
    const totalOpex = aggregateFlow.reduce((sum, f) => sum + f.opex, 0);
    return aggregateMetrics.totalCapex > 0 ? (totalRevenue - totalOpex) / aggregateMetrics.totalCapex : 0;
  }, [aggregateFlow, aggregateMetrics.totalCapex]);

  const fastestPayoutScenarioName = useMemo(() => {
    const fastest = scenarioRankings
      .filter(row => row.payoutMonths > 0)
      .sort((a, b) => a.payoutMonths - b.payoutMonths)[0];
    return fastest?.name || '-';
  }, [scenarioRankings]);

  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (aggregateMetrics.wellCount === 0) warnings.push('No wells assigned to a scenario yet.');
    if (filteredWells.length === 0) warnings.push('Current filters exclude all wells.');
    if (selectedVisibleCount === 0) warnings.push('Step 2 incomplete: no visible wells are currently selected in the basin map.');
    const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
    const basePricing = baseScenario?.pricing || DEFAULT_COMMODITY_PRICING;
    if (basePricing.oilPrice <= 0 || basePricing.gasPrice < 0) warnings.push('Scenario pricing inputs are incomplete or invalid.');
    if (activeGroup.ownership.baseNri <= 0 || activeGroup.ownership.baseNri > 1) warnings.push('Base NRI is invalid in the active group.');
    if (activeGroup.ownership.baseCostInterest < 0 || activeGroup.ownership.baseCostInterest > 1) warnings.push('Base cost interest is invalid in the active group.');
    if ((activeGroup.opex.segments || []).length === 0) warnings.push('OPEX segments are missing for the active group.');
    if (activeGroup.capex.items.length === 0) {
      warnings.push('CAPEX items are missing for the active group.');
    }
    return warnings;
  }, [
    activeGroup.capex.items.length,
    activeGroup.opex.segments,
    activeGroup.ownership.baseCostInterest,
    activeGroup.ownership.baseNri,
    aggregateMetrics.wellCount,
    filteredWells.length,
    selectedVisibleCount,
    scenarios,
  ]);

  // Debounced derived metrics
  const { keyDriverInsights, breakevenOilPrice } = useDerivedMetrics(
    processedGroups,
    scenarios,
    aggregateMetrics.wellCount,
  );

  const handleSaveSnapshot = async () => {
    setSnapshotHistory(prev => [
      ...prev.slice(-19),
      {
        npv: aggregateMetrics.npv10,
        capex: aggregateMetrics.totalCapex,
        eur: aggregateMetrics.eur,
        payout: aggregateMetrics.payoutMonths,
        timestamp: Date.now(),
      },
    ]);

    if (!supabasePersistenceEnabled) {
      setLastSnapshotAt(new Date().toISOString());
      setActionMessage('Snapshot saved locally.');
      return;
    }

    try {
      await persistence.runEconomicsSnapshot(aggregateMetrics, scenarioRankings, validationWarnings);
      setLastSnapshotAt(new Date().toISOString());
      setActionMessage(`${activeGroup.name} Snapshot saved.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Snapshot save failed.';
      setActionMessage(`Snapshot save failed: ${message}`);
    }
  };

  const handleExportCsv = () => {
    const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
    const basePricing = baseScenario?.pricing || DEFAULT_COMMODITY_PRICING;
    const rows: Array<Array<string | number>> = [
      ['scope', 'name', 'wells', 'npv10_mm', 'capex_mm', 'eur_mboe', 'roi_cash', 'payout_months', 'deck_oil', 'deck_gas', 'base_nri', 'base_cost_int'],
      [
        'portfolio',
        'Portfolio',
        aggregateMetrics.wellCount,
        (aggregateMetrics.npv10 / 1e6).toFixed(2),
        (aggregateMetrics.totalCapex / 1e6).toFixed(2),
        (aggregateMetrics.eur / 1e3).toFixed(2),
        portfolioRoi.toFixed(2),
        aggregateMetrics.payoutMonths || '-',
        basePricing.oilPrice,
        basePricing.gasPrice,
        '-',
        '-',
      ],
      ...scenarioRankings.map(row => [
        'group',
        row.name,
        row.wellCount,
        (row.npv10 / 1e6).toFixed(2),
        (row.totalCapex / 1e6).toFixed(2),
        (row.eur / 1e3).toFixed(2),
        row.roi.toFixed(2),
        row.payoutMonths || '-',
        basePricing.oilPrice,
        basePricing.gasPrice,
        row.baseNri.toFixed(3),
        row.baseCostInterest.toFixed(3),
      ]),
    ];

    const csv = rows.map(row => row.map(cell => csvCell(cell)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `slopcast-economics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setActionMessage('CSV export complete.');
  };

  const handleExportPdf = () => {
    window.print();
    setActionMessage('Print dialog opened for PDF export.');
  };

  // --- Keyboard Shortcuts ---
  useKeyboardShortcuts({
    onSwitchToWells: useCallback(() => setDesignWorkspace('WELLS'), []),
    onSwitchToEconomics: useCallback(() => setDesignWorkspace('ECONOMICS'), []),
    onSaveSnapshot: handleSaveSnapshot,
    onExportCsv: handleExportCsv,
    onSelectAll: handleSelectAll,
    onClearSelection: handleClearSelection,
    onShowHelp: useCallback(() => setShowShortcutsHelp(prev => !prev), []),
  });

  // --- Effects ---
  useEffect(() => {
    if (!actionMessage) return;
    const timeout = window.setTimeout(() => setActionMessage(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  useEffect(() => {
    if (!persistence.error) return;
    setActionMessage(`Persistence error: ${persistence.error}`);
  }, [persistence.error]);

  useEffect(() => {
    if (supabasePersistenceEnabled) return;
    storeDesignWorkspace(designWorkspace);
  }, [designWorkspace, supabasePersistenceEnabled]);

  useEffect(() => {
    if (supabasePersistenceEnabled) return;
    storeEconomicsResultsTab(economicsResultsTab);
  }, [economicsResultsTab, supabasePersistenceEnabled]);

  useEffect(() => {
    storeEconomicsFocusMode(economicsFocusMode);
  }, [economicsFocusMode]);

  // --- Workflow ---
  const hasGroup = !!activeGroup;
  const hasGroupWells = activeGroup.wellIds.size > 0;
  const hasCapexItems = activeGroup.capex.items.length > 0;
  const setupComplete = hasGroup && hasCapexItems && activeGroup.typeCurve.qi > 0;
  const selectionComplete = hasGroupWells || selectedVisibleCount > 0;
  const reviewReady = setupComplete && selectionComplete;
  const activeStep: DesignStep = !setupComplete
    ? 'SETUP'
    : !selectionComplete
      ? 'SELECT'
      : 'REVIEW';

  const orderedSteps: DesignStep[] = ['SETUP', 'SELECT', 'REVIEW'];
  const stepStatusMap: Record<DesignStep, StepStatus> = {
    SETUP: setupComplete ? 'COMPLETE' : (activeStep === 'SETUP' ? 'ACTIVE' : 'NOT_STARTED'),
    SELECT: selectionComplete ? 'COMPLETE' : (activeStep === 'SELECT' ? 'ACTIVE' : 'NOT_STARTED'),
    RUN: 'NOT_STARTED',
    REVIEW: reviewReady ? (activeStep === 'REVIEW' ? 'ACTIVE' : 'COMPLETE') : 'NOT_STARTED',
  };
  const workflowSteps: WorkflowStep[] = orderedSteps.map(step => ({
    id: step,
    label: step === 'SETUP' ? 'Setup' : step === 'SELECT' ? 'Select Wells' : 'Review',
    status: stepStatusMap[step],
  }));
  const stepGuidance = activeStep === 'SETUP'
    ? 'Complete setup inputs (CAPEX, decline, ownership).'
    : activeStep === 'SELECT'
      ? 'Assign wells to the active group.'
      : 'Review live KPIs, charts, and drivers.';
  const canUseSecondaryActions = reviewReady;
  const wellsNeedsAttention = !setupComplete || !selectionComplete;
  const economicsNeedsAttention = !reviewReady;

  const handleRequestOpenControlsSection = (section: ControlsSection) => {
    setControlsOpenSection(section);
    if (viewportLayout === 'mobile') setEconomicsMobilePanel('SETUP');
  };

  const handleRequestOpenAnalysisSection = (section: AnalysisOpenSection) => {
    storeAnalysisOpenSection(section);
    setViewMode('ANALYSIS');
  };

  useEffect(() => {
    if (viewMode !== 'DASHBOARD') return;
    if (designWorkspace !== 'ECONOMICS') return;
    if (hasCapexItems) return;
    setControlsOpenSection('CAPEX');
    if (viewportLayout === 'mobile') setEconomicsMobilePanel('SETUP');
  }, [designWorkspace, hasCapexItems, viewMode, viewportLayout]);

  const operationsProps = useMemo(() => ({
    isClassic,
    opsTab,
    onOpsTabChange: setOpsTab,
    selectedVisibleCount,
    filteredVisibleCount: filteredWells.length,
    activeGroupName: activeGroup.name,
    onAssign: handleAssignWellsToActive,
    onCreateGroup: handleCreateGroupFromSelection,
    onSelectAll: handleSelectAll,
    onClear: handleClearSelection,
    onSaveSnapshot: handleSaveSnapshot,
    onExportCsv: handleExportCsv,
    onExportPdf: handleExportPdf,
    canAssign: selectedVisibleCount > 0,
    canClear: selectedVisibleCount > 0,
    canUseSecondaryActions,
    lastSnapshotAt,
    actionMessage,
    validationWarnings,
    stepGuidance,
    topDrivers: keyDriverInsights.topDrivers as OperationsConsoleProps['topDrivers'],
    biggestPositive: keyDriverInsights.biggestPositive,
    biggestNegative: keyDriverInsights.biggestNegative,
    breakevenOilPrice,
    payoutMonths: aggregateMetrics.payoutMonths,
    fastestPayoutScenarioName,
    scenarioRankings,
  }), [
    isClassic, opsTab, selectedVisibleCount, filteredWells.length,
    activeGroup.name, handleAssignWellsToActive, handleCreateGroupFromSelection,
    handleSelectAll, handleClearSelection, handleSaveSnapshot, handleExportCsv,
    handleExportPdf, canUseSecondaryActions, lastSnapshotAt, actionMessage,
    validationWarnings, stepGuidance, keyDriverInsights, breakevenOilPrice,
    aggregateMetrics.payoutMonths, fastestPayoutScenarioName, scenarioRankings,
  ]);

  return {
    // Navigation
    navigate,

    // Theme
    isClassic, themeId, theme, themes, setThemeId, colorMode, setColorMode, effectiveMode,
    fxClass, atmosphereClass, headerAtmosphereClass, BackgroundComponent, atmosphericOverlays,

    // Page mode
    pageMode, setPageMode, savedDeals,
    handleSelectDeal, handleCreateDeal, handleAcreageSearch,

    // View state
    viewMode, setViewMode,
    designWorkspace, setDesignWorkspace,
    wellsMobilePanel, setWellsMobilePanel,
    economicsMobilePanel, setEconomicsMobilePanel,
    economicsResultsTab, setEconomicsResultsTab,
    economicsFocusMode, setEconomicsFocusMode,
    viewportLayout,
    controlsOpenSection, setControlsOpenSection,

    // Data
    groups, processedGroups, activeGroupId, setActiveGroupId, activeGroup,
    scenarios, handleSetScenarios,
    selectedWellIds, selectedVisibleCount,
    filteredWells, visibleWellIds, dimmedWellIds,

    // Economics
    aggregateFlow, aggregateMetrics,
    scenarioRankings, portfolioRoi,
    breakevenOilPrice, keyDriverInsights,
    snapshotHistory,
    showAfterTax, showLevered,
    setShowAfterTax: () => setShowAfterTax(prev => !prev),
    setShowLevered: () => setShowLevered(prev => !prev),

    // Filters
    operatorFilter, setOperatorFilter,
    formationFilter, setFormationFilter,
    statusFilter, setStatusFilter,
    operatorOptions, formationOptions, statusOptions,
    handleResetFilters,

    // Handlers
    handleUpdateGroup, handleAddGroup, handleCloneGroup,
    handleAssignWellsToActive, handleCreateGroupFromSelection,
    handleToggleWell, handleSelectWells, handleSelectAll, handleClearSelection,
    handleSaveSnapshot, handleExportCsv, handleExportPdf,
    handleRequestOpenControlsSection, handleRequestOpenAnalysisSection,

    // UI state
    opsTab, setOpsTab,
    showShortcutsHelp, setShowShortcutsHelp,
    showSharePanel, setShowSharePanel,
    actionMessage, lastSnapshotAt,
    validationWarnings,

    // Workflow
    workflowSteps, stepGuidance,
    hasGroup, hasGroupWells, hasCapexItems,
    canUseSecondaryActions,
    wellsNeedsAttention, economicsNeedsAttention,
    operationsProps,
    fastestPayoutScenarioName,
  };
}
