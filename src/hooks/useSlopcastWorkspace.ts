import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_CAPEX, DEFAULT_COMMODITY_PRICING, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE, GROUP_COLORS, MOCK_WELLS } from '../constants';
import { Scenario, SpatialDataSourceId, Well, WellGroup } from '../types';
import { DesignStep, StepStatus, WorkflowStep } from '../components/slopcast/WorkflowStepper';
import type { OperationsConsoleProps } from '../components/slopcast/OperationsConsole';
import { useProjectPersistence } from '../components/slopcast/hooks/useProjectPersistence';
import {
  useWorkspaceUiState,
  type AnalysisOpenSection,
  type ControlsSection,
  type FxMode,
  type OpsTab,
  type PageMode,
  type ViewMode,
} from '../components/slopcast/hooks/useWorkspaceUiState';
import { useWorkspaceActions } from '../components/slopcast/hooks/useWorkspaceActions';
import { useAuth } from '../auth/AuthProvider';
import { hasSupabaseEnv } from '../services/supabaseClient';
import { useTheme } from '../theme/ThemeProvider';
import { aggregateEconomics, cachedCalculateEconomics, applyTaxLayer, applyDebtLayer, applyReservesRisk } from '../utils/economics';
import { getStoredSpatialSourceId, setStoredSpatialSourceId } from '../services/spatialService';
import { useDerivedMetrics } from './useDerivedMetrics';
import { useWellFiltering } from './useWellFiltering';
import { useWellSelection } from './useWellSelection';
import { createLocalId } from '../utils/id';
import {
  appendWorkspaceGroup,
  assignWellsToActiveGroup,
  clearGroupAssignments,
  cloneWorkspaceGroup,
  createGroupFromSelection,
  updateWorkspaceGroup,
} from '../domain/workspace/groupState';
import {
  selectPortfolioRoi,
  selectScenarioRankings,
  selectValidationWarnings,
} from '../domain/workspace/selectors';
import { createDefaultScenarios } from '../domain/workspace/scenarios';
import {
  setDesignWorkspace as storeDesignWorkspace,
  setEconomicsModule as storeEconomicsModule,
  setEconomicsFocusMode as storeEconomicsFocusMode,
  getFxMode,
  setFxMode,
  clearFxMode,
  setAnalysisOpenSection as storeAnalysisOpenSection,
} from '../services/storage/workspacePreferences';
import type { DealRecord } from '../types';

export type { ViewMode, OpsTab, FxMode, ControlsSection, AnalysisOpenSection, PageMode };

// ─── Constants ──────────────────────────────────────────────────────

export const FX_QUERY_KEY = 'fx';

// ─── Hook ───────────────────────────────────────────────────────────

export function useSlopcastWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, session } = useAuth();

  // --- Theme ---
  const { themeId, theme, themes, setThemeId, colorMode, setColorMode, effectiveMode } = useTheme();
  const isClassic = theme.features.isClassicTheme;
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
  const pageOverlayClasses = theme.pageOverlayClasses || [];

  // --- View state ---
  const {
    pageMode,
    setPageMode,
    viewMode,
    setViewMode,
    designWorkspace,
    setDesignWorkspace,
    wellsMobilePanel,
    setWellsMobilePanel,
    economicsMobilePanel,
    setEconomicsMobilePanel,
    economicsModule,
    setEconomicsModule,
    economicsFocusMode,
    setEconomicsFocusMode,
    opsTab,
    setOpsTab,
    controlsOpenSection,
    setControlsOpenSection,
    viewportLayout,
  } = useWorkspaceUiState();

  const [savedDeals, setSavedDeals] = useState<DealRecord[]>([]);

  const handleSelectDeal = useCallback((dealId: string) => {
    setPageMode('workspace');
  }, []);

  const handleCreateDeal = useCallback(() => {
    setPageMode('workspace');
  }, []);

  // --- Wells & spatial source ---
  const [wells, setWells] = useState<Well[]>(MOCK_WELLS);
  const [spatialSourceId, setSpatialSourceId] = useState<SpatialDataSourceId>(getStoredSpatialSourceId());
  const prevWellIdsRef = useRef<Set<string>>(new Set(MOCK_WELLS.map(w => w.id)));

  const handleSourceChange = useCallback((id: SpatialDataSourceId) => {
    setSpatialSourceId(id);
    setStoredSpatialSourceId(id);
  }, []);

  const handleWellsLoaded = useCallback((loadedWells: Well[]) => {
    setWells(loadedWells);
    const newIds = new Set(loadedWells.map(w => w.id));
    const prevIds = prevWellIdsRef.current;
    // If the well IDs changed and there's no overlap with previous set,
    // reset group assignments so stale IDs don't linger
    if (prevIds.size > 0 && newIds.size > 0) {
      let hasOverlap = false;
      for (const id of newIds) {
        if (prevIds.has(id)) { hasOverlap = true; break; }
      }
      if (!hasOverlap) {
        setGroups(clearGroupAssignments);
      }
    }
    prevWellIdsRef.current = newIds;
  }, []);

  // --- Domain state ---
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

  const [scenarios, setScenarios] = useState<Scenario[]>(createDefaultScenarios);

  const [activeGroupId, setActiveGroupId] = useState<string>('g-1');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('s-base');
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [snapshotHistory, setSnapshotHistory] = useState<Array<{ npv: number; capex: number; eur: number; payout: number; timestamp: number }>>([]);
  const [showAfterTax, setShowAfterTax] = useState(false);
  const [showLevered, setShowLevered] = useState(false);

  // --- Well filtering & selection (delegated to extracted hooks) ---
  const {
    operatorFilter, toggleOperator, replaceOperatorFilter,
    formationFilter, toggleFormation, replaceFormationFilter,
    statusFilter, toggleStatus, replaceStatusFilter,
    operatorOptions, formationOptions, statusOptions,
    filteredWells, visibleWellIds, dimmedWellIds,
    handleResetFilters,
  } = useWellFiltering(wells);

  const {
    selectedWellIds, setSelectedWellIds,
    selectedVisibleCount,
    handleToggleWell, handleSelectWells, handleSelectAll, handleClearSelection,
  } = useWellSelection({
    visibleWellIds,
    filteredWellsCount: filteredWells.length,
    onEmptyVisibleSelection: () => {
      setActionMessage('No visible wells match current filters.');
    },
  });

  // --- Computed Economics per Group ---
  const processedGroups = useMemo(() => {
    const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
    const activeScenario = scenarios.find(s => s.id === activeScenarioId) || baseScenario;
    const activePricing = activeScenario?.pricing || DEFAULT_COMMODITY_PRICING;
    return groups.map(group => {
      const groupWells = wells.filter(w => group.wellIds.has(w.id));
      let { flow, metrics } = cachedCalculateEconomics(
        groupWells,
        group.typeCurve,
        group.capex,
        activePricing,
        group.opex,
        group.ownership,
        {
          capex: activeScenario?.capexScalar ?? 1,
          production: activeScenario?.productionScalar ?? 1,
        },
        activeScenario?.schedule,
      );

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
  }, [activeScenarioId, groups, scenarios, wells]);

  // --- Aggregate Portfolio Economics ---
  const { flow: aggregateFlow, metrics: aggregateMetrics } = useMemo(() => {
    return aggregateEconomics(processedGroups);
  }, [processedGroups]);

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
      economicsModule,
      operatorFilter,
      formationFilter,
      statusFilter,
    },
    setGroups,
    setScenarios,
    setActiveGroupId,
    setDesignWorkspace,
    setEconomicsModule,
    setOperatorFilter: replaceOperatorFilter,
    setFormationFilter: replaceFormationFilter,
    setStatusFilter: replaceStatusFilter,
    onStatusMessage: setActionMessage,
  });

  // --- Handlers ---
  const activeGroup = processedGroups.find(g => g.id === activeGroupId) || processedGroups[0];
  const handleSetScenarios: React.Dispatch<React.SetStateAction<Scenario[]>> = useCallback((next) => {
    setScenarios(next);
  }, []);

  const handleUpdateGroup = useCallback((updatedGroup: WellGroup) => {
    setGroups(prev => updateWorkspaceGroup(prev, updatedGroup));
  }, []);

  const handleAddGroup = useCallback(() => {
    const newId = createLocalId('g');
    setGroups(prev => appendWorkspaceGroup(prev, newId));
    setActiveGroupId(newId);
  }, []);

  const handleCloneGroup = useCallback((groupId: string) => {
    const newId = createLocalId('g');
    setGroups(prev => cloneWorkspaceGroup(prev, groupId, newId));
    setActiveGroupId(newId);
  }, []);

  const handleAssignWellsToActive = useCallback(() => {
    if (selectedWellIds.size === 0) return;
    setGroups(prevGroups => assignWellsToActiveGroup(prevGroups, activeGroupId, selectedWellIds));
    setSelectedWellIds(new Set());
  }, [activeGroupId, selectedWellIds, setSelectedWellIds]);

  const handleCreateGroupFromSelection = useCallback(() => {
    if (selectedWellIds.size === 0) return;
    const newId = createLocalId('g');
    setGroups(prevGroups => createGroupFromSelection(prevGroups, newId, selectedWellIds));
    setActiveGroupId(newId);
    setSelectedWellIds(new Set());
  }, [selectedWellIds, setSelectedWellIds]);

  // --- Derived analytics ---
  const scenarioRankings = useMemo(() => {
    return selectScenarioRankings(processedGroups);
  }, [processedGroups]);

  const portfolioRoi = useMemo(() => {
    return selectPortfolioRoi(aggregateFlow, aggregateMetrics);
  }, [aggregateFlow, aggregateMetrics]);

  const fastestPayoutScenarioName = useMemo(() => {
    const fastest = scenarioRankings
      .filter(row => row.payoutMonths > 0)
      .sort((a, b) => a.payoutMonths - b.payoutMonths)[0];
    return fastest?.name || '-';
  }, [scenarioRankings]);

  const validationWarnings = useMemo(() => {
    return selectValidationWarnings({
      aggregateMetrics,
      filteredWellCount: filteredWells.length,
      selectedVisibleCount,
      scenarios,
      activeScenarioId,
      activeGroup,
    });
  }, [
    activeGroup,
    aggregateMetrics,
    filteredWells.length,
    selectedVisibleCount,
    activeScenarioId,
    scenarios,
  ]);

  // Debounced derived metrics
  const { keyDriverInsights, breakevenOilPrice, isComputing: isDerivedComputing } = useDerivedMetrics(
    processedGroups,
    scenarios,
    aggregateMetrics.wellCount,
  );

  const { handleSaveSnapshot, handleExportCsv, handleExportPdf } = useWorkspaceActions({
    aggregateMetrics,
    aggregateFlow,
    portfolioRoi,
    scenarios,
    activeScenarioId,
    activeGroupName: activeGroup.name,
    scenarioRankings,
    validationWarnings,
    supabasePersistenceEnabled,
    runEconomicsSnapshot: persistence.runEconomicsSnapshot,
    setSnapshotHistory,
    setLastSnapshotAt,
    setActionMessage,
    onSwitchToWells: useCallback(() => setDesignWorkspace('WELLS'), [setDesignWorkspace]),
    onSwitchToEconomics: useCallback(() => setDesignWorkspace('ECONOMICS'), [setDesignWorkspace]),
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
    storeEconomicsModule(economicsModule);
  }, [economicsModule, supabasePersistenceEnabled]);

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
    fxMode, fxClass, atmosphereClass, headerAtmosphereClass, BackgroundComponent, atmosphericOverlays, pageOverlayClasses,

    // Page mode
    pageMode, setPageMode, savedDeals,
    handleSelectDeal, handleCreateDeal,

    // View state
    viewMode, setViewMode,
    designWorkspace, setDesignWorkspace,
    wellsMobilePanel, setWellsMobilePanel,
    economicsMobilePanel, setEconomicsMobilePanel,
    economicsModule, setEconomicsModule,
    activeScenarioId, setActiveScenarioId,
    economicsFocusMode, setEconomicsFocusMode,
    viewportLayout,
    controlsOpenSection, setControlsOpenSection,

    // Wells & spatial
    wells,
    spatialSourceId, handleSourceChange, handleWellsLoaded,

    // Data
    groups, processedGroups, activeGroupId, setActiveGroupId, activeGroup,
    scenarios, handleSetScenarios,
    selectedWellIds, selectedVisibleCount,
    filteredWells, visibleWellIds, dimmedWellIds,

    // Economics
    aggregateFlow, aggregateMetrics,
    scenarioRankings, portfolioRoi,
    breakevenOilPrice, keyDriverInsights,
    isDerivedComputing,
    snapshotHistory,
    showAfterTax, showLevered,
    setShowAfterTax: () => setShowAfterTax(prev => !prev),
    setShowLevered: () => setShowLevered(prev => !prev),

    // Filters (multi-select: Set<string>, empty = all)
    operatorFilter, toggleOperator,
    formationFilter, toggleFormation,
    statusFilter, toggleStatus,
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
