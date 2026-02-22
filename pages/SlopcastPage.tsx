import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_CAPEX, DEFAULT_COMMODITY_PRICING, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE, GROUP_COLORS, MOCK_WELLS } from '../constants';
import { Scenario, ScheduleParams, Well, WellGroup } from '../types';
import ScenarioDashboard from '../components/ScenarioDashboard';
import DesignEconomicsView, { EconomicsMobilePanel } from '../components/slopcast/DesignEconomicsView';
import DesignWellsView, { WellsMobilePanel } from '../components/slopcast/DesignWellsView';
import { DesignWorkspace } from '../components/slopcast/DesignWorkspaceTabs';
import { EconomicsResultsTab } from '../components/slopcast/EconomicsResultsTabs';
import PageHeader from '../components/slopcast/PageHeader';
import { DesignStep, StepStatus, WorkflowStep } from '../components/slopcast/WorkflowStepper';
import { useViewportLayout } from '../components/slopcast/hooks/useViewportLayout';
import { useProjectPersistence } from '../components/slopcast/hooks/useProjectPersistence';
import { useAuth } from '../auth/AuthProvider';
import { hasSupabaseEnv } from '../services/supabaseClient';
import { useTheme } from '../theme/ThemeProvider';
import { aggregateEconomics, calculateEconomics } from '../utils/economics';

type ViewMode = 'DASHBOARD' | 'ANALYSIS'; 
type OpsTab = 'SELECTION_ACTIONS' | 'KEY_DRIVERS';
type FxMode = 'cinematic' | 'max';
type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP';
type AnalysisOpenSection = 'PRICING' | 'SCHEDULE' | 'SCALARS';

type DriverModifier = {
  oilPriceDelta?: number;
  capexScalar?: number;
  productionScalar?: number;
  rigDelta?: number;
};

type DriverShock = {
  id: string;
  label: string;
  modifiers: DriverModifier;
};

type DriverFamilyId = 'oil' | 'capex' | 'eur' | 'rig';

type DriverFamily = {
  id: DriverFamilyId;
  label: string;
  upShockId: string;
  downShockId: string;
};

const DRIVER_SHOCKS: DriverShock[] = [
  { id: 'oil-up', label: 'Oil +$10/bbl', modifiers: { oilPriceDelta: 10 } },
  { id: 'oil-down', label: 'Oil -$10/bbl', modifiers: { oilPriceDelta: -10 } },
  { id: 'capex-up', label: 'CAPEX +10%', modifiers: { capexScalar: 1.1 } },
  { id: 'capex-down', label: 'CAPEX -10%', modifiers: { capexScalar: 0.9 } },
  { id: 'eur-up', label: 'EUR +10%', modifiers: { productionScalar: 1.1 } },
  { id: 'eur-down', label: 'EUR -10%', modifiers: { productionScalar: 0.9 } },
  { id: 'rig-up', label: 'Rig count +1', modifiers: { rigDelta: 1 } },
  { id: 'rig-down', label: 'Rig count -1', modifiers: { rigDelta: -1 } },
];

const DRIVER_FAMILIES: DriverFamily[] = [
  { id: 'oil', label: 'Oil Benchmark', upShockId: 'oil-up', downShockId: 'oil-down' },
  { id: 'capex', label: 'CAPEX Intensity', upShockId: 'capex-up', downShockId: 'capex-down' },
  { id: 'eur', label: 'Production Yield', upShockId: 'eur-up', downShockId: 'eur-down' },
  { id: 'rig', label: 'Development Pace', upShockId: 'rig-up', downShockId: 'rig-down' },
];

const DEFAULT_SCHEDULE: ScheduleParams = { 
  annualRigs: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 
  drillDurationDays: 18, 
  stimDurationDays: 12, 
  rigStartDate: new Date().toISOString().split('T')[0],
};

const DESIGN_WORKSPACE_STORAGE_KEY = 'slopcast-design-workspace';
const ECONOMICS_RESULTS_TAB_STORAGE_KEY = 'slopcast-econ-results-tab';
const ECONOMICS_FOCUS_MODE_STORAGE_KEY = 'slopcast-econ-focus-mode';
const FX_QUERY_KEY = 'fx';
const FX_STORAGE_KEY_PREFIX = 'slopcast-fx-';
const ANALYSIS_OPEN_SECTION_STORAGE_KEY = 'slopcast-analysis-open-section';

const csvCell = (value: string | number) => {
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const readStoredDesignWorkspace = (): DesignWorkspace => {
  try {
    const raw = localStorage.getItem(DESIGN_WORKSPACE_STORAGE_KEY);
    if (raw === 'WELLS' || raw === 'ECONOMICS') return raw;
  } catch {
    // no-op
  }
  return 'WELLS';
};

const readStoredEconomicsResultsTab = (): EconomicsResultsTab => {
  try {
    const raw = localStorage.getItem(ECONOMICS_RESULTS_TAB_STORAGE_KEY);
    if (raw === 'SUMMARY' || raw === 'CHARTS' || raw === 'DRIVERS') return raw;
  } catch {
    // no-op
  }
  return 'SUMMARY';
};

const readStoredEconomicsFocusMode = (): boolean => {
  try {
    const raw = localStorage.getItem(ECONOMICS_FOCUS_MODE_STORAGE_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
  } catch {
    // no-op
  }
  return false;
};

const SlopcastPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, session } = useAuth();
  // --- Theme (from provider) ---
  const { themeId, theme, themes, setThemeId } = useTheme();
  const isClassic = themeId === 'mario';
  const isFxTheme = !!theme.fxTheme;

  const fxMode = useMemo<FxMode>(() => {
    if (!isFxTheme) return 'cinematic';
    const fromQuery = new URLSearchParams(location.search).get(FX_QUERY_KEY);
    if (fromQuery === 'cinematic' || fromQuery === 'max') return fromQuery;
    if (fromQuery === 'clear') return 'cinematic';
    try {
      const stored = localStorage.getItem(`${FX_STORAGE_KEY_PREFIX}${themeId}`);
      if (stored === 'cinematic' || stored === 'max') return stored;
    } catch {
      // no-op
    }
    return 'cinematic';
  }, [isFxTheme, location.search, themeId]);

  useEffect(() => {
    if (!isFxTheme) return;
    const fromQuery = new URLSearchParams(location.search).get(FX_QUERY_KEY);
    if (fromQuery === 'clear') {
      try {
        localStorage.removeItem(`${FX_STORAGE_KEY_PREFIX}${themeId}`);
      } catch {
        // no-op
      }
      return;
    }
    if (fromQuery !== 'cinematic' && fromQuery !== 'max') return;
    try {
      localStorage.setItem(`${FX_STORAGE_KEY_PREFIX}${themeId}`, fromQuery);
    } catch {
      // no-op
    }
  }, [isFxTheme, location.search, themeId]);

  const fxClass = isFxTheme ? `fx-${fxMode}` : '';
  const atmosphereClass = theme.atmosphereClass || '';
  const headerAtmosphereClass = theme.headerAtmosphereClass || '';
  const BackgroundComponent = theme.BackgroundComponent;
  const atmosphericOverlays = theme.atmosphericOverlays || [];

  // --- State ---
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [designWorkspace, setDesignWorkspace] = useState<DesignWorkspace>(readStoredDesignWorkspace);
  const [wellsMobilePanel, setWellsMobilePanel] = useState<WellsMobilePanel>('MAP');
  const [economicsMobilePanel, setEconomicsMobilePanel] = useState<EconomicsMobilePanel>('RESULTS');
  const [economicsResultsTab, setEconomicsResultsTab] = useState<EconomicsResultsTab>(readStoredEconomicsResultsTab);
  const [economicsFocusMode, setEconomicsFocusMode] = useState<boolean>(readStoredEconomicsFocusMode);
  const [opsTab, setOpsTab] = useState<OpsTab>('SELECTION_ACTIONS');
  const viewportLayout = useViewportLayout();
  const [controlsOpenSection, setControlsOpenSection] = useState<ControlsSection | null>(null);
  // Economics are now auto-computed (live via useMemo). No run gate needed.

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
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [formationFilter, setFormationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<Well['status'] | 'ALL'>('ALL');

  // --- Computed Economics per Group ---
  const processedGroups = useMemo(() => {
    const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
    const basePricing = baseScenario?.pricing || DEFAULT_COMMODITY_PRICING;
    return groups.map(group => {
      const groupWells = MOCK_WELLS.filter(w => group.wellIds.has(w.id));
      const { flow, metrics } = calculateEconomics(groupWells, group.typeCurve, group.capex, basePricing, group.opex, group.ownership);
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
  const handleSetScenarios: React.Dispatch<React.SetStateAction<Scenario[]>> = (next) => {
    setScenarios(next);
  };

  const handleUpdateGroup = (updatedGroup: WellGroup) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));

  };

  const handleAddGroup = () => {
    const newId = `g-${Date.now()}`;
    const color = GROUP_COLORS[groups.length % GROUP_COLORS.length];
    const newGroup: WellGroup = {
      id: newId,
      name: `Group ${groups.length + 1}`,
      color,
      wellIds: new Set(),
      typeCurve: { ...DEFAULT_TYPE_CURVE },
      capex: { ...DEFAULT_CAPEX },
      opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map(seg => ({ ...seg, id: `o-${Date.now()}-${Math.random()}` })) },
      ownership: { ...DEFAULT_OWNERSHIP, agreements: [] }
    };
    setGroups([...groups, newGroup]);
    setActiveGroupId(newId);

  };

  const handleCloneGroup = (groupId: string) => {
    const sourceGroup = groups.find(g => g.id === groupId);
    if (!sourceGroup) return;
    const newId = `g-${Date.now()}`;
    const color = GROUP_COLORS[(groups.length) % GROUP_COLORS.length];
    const newGroup: WellGroup = {
        id: newId,
        name: `${sourceGroup.name} (Copy)`,
        color: color,
        wellIds: new Set(sourceGroup.wellIds),
        typeCurve: { ...sourceGroup.typeCurve },
        capex: { 
            ...sourceGroup.capex, 
            items: sourceGroup.capex.items.map(i => ({...i, id: `c-${Date.now()}-${Math.random()}`})) 
        },
        opex: { ...sourceGroup.opex, segments: sourceGroup.opex.segments.map(seg => ({ ...seg, id: `o-${Date.now()}-${Math.random()}` })) },
        ownership: { ...sourceGroup.ownership, agreements: sourceGroup.ownership.agreements.map(a => ({ ...a, id: `jv-${Date.now()}-${Math.random()}` })) }
    };
    setGroups([...groups, newGroup]);
    setActiveGroupId(newId);

  };

  const handleAssignWellsToActive = () => {
    if (selectedWellIds.size === 0) return;
    setGroups(prevGroups => {
      return prevGroups.map(g => {
        const nextIds = new Set(g.wellIds);
        if (g.id === activeGroupId) {
          selectedWellIds.forEach(id => nextIds.add(id));
        } else {
          selectedWellIds.forEach(id => nextIds.delete(id));
        }
        return { ...g, wellIds: nextIds };
      });
    });
    setSelectedWellIds(new Set());

  };

  const handleCreateGroupFromSelection = () => {
    if (selectedWellIds.size === 0) return;
    const newId = `g-${Date.now()}`;
    const color = GROUP_COLORS[groups.length % GROUP_COLORS.length];
    const newGroup: WellGroup = {
      id: newId,
      name: `Selection Set ${groups.length + 1}`,
      color,
      wellIds: new Set(selectedWellIds),
      typeCurve: { ...DEFAULT_TYPE_CURVE },
      capex: { ...DEFAULT_CAPEX },
      opex: { ...DEFAULT_OPEX, segments: DEFAULT_OPEX.segments.map(seg => ({ ...seg, id: `o-${Date.now()}-${Math.random()}` })) },
      ownership: { ...DEFAULT_OWNERSHIP, agreements: [] }
    };
    setGroups(prevGroups => {
        const updatedPrevGroups = prevGroups.map(g => {
            const nextIds = new Set(g.wellIds);
            selectedWellIds.forEach(id => nextIds.delete(id));
            return { ...g, wellIds: nextIds };
        });
        return [...updatedPrevGroups, newGroup];
    });
    setActiveGroupId(newId);
    setSelectedWellIds(new Set());

  };

  const handleToggleWell = (id: string) => {
    if (!visibleWellIds.has(id)) return;
    setSelectedWellIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  };

  const handleSelectWells = (ids: string[]) => {
      setSelectedWellIds(prev => {
          const next = new Set(prev);
          ids.forEach(id => {
            if (visibleWellIds.has(id)) next.add(id);
          });
          return next;
      });
  
  };

  const handleSelectAll = () => {
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

  };

  const handleClearSelection = () => {
    setSelectedWellIds(new Set());

  };

  const handleResetFilters = () => {
    setOperatorFilter('ALL');
    setFormationFilter('ALL');
    setStatusFilter('ALL');
  };

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

  const keyDriverInsights = useMemo(() => {
    const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
    const basePricing = baseScenario?.pricing || DEFAULT_COMMODITY_PRICING;
    const evaluateNpv = (modifier: DriverModifier = {}, forceOilPrice?: number) => {
      return processedGroups.reduce((sum, group) => {
        const groupWells = MOCK_WELLS.filter(w => group.wellIds.has(w.id));
        const pricing = {
          ...basePricing,
          oilPrice: forceOilPrice ?? Math.max(0, basePricing.oilPrice + (modifier.oilPriceDelta ?? 0)),
        };
        const capex = {
          ...group.capex,
          rigCount: Math.max(1, Math.round(group.capex.rigCount + (modifier.rigDelta ?? 0))),
        };
        const { metrics } = calculateEconomics(
          groupWells,
          group.typeCurve,
          capex,
          pricing,
          group.opex,
          group.ownership,
          {
            capex: modifier.capexScalar ?? 1,
            production: modifier.productionScalar ?? 1,
          }
        );
        return sum + metrics.npv10;
      }, 0);
    };

    const baseNpv = evaluateNpv();
    const shocks = DRIVER_SHOCKS.map(shock => {
      const npv = evaluateNpv(shock.modifiers);
      return {
        ...shock,
        npv,
        deltaNpv: npv - baseNpv,
      };
    });

    const findShock = (id: string) => shocks.find(shock => shock.id === id);
    const topDrivers = DRIVER_FAMILIES
      .map(family => {
        const up = findShock(family.upShockId);
        const down = findShock(family.downShockId);
        const upDelta = up?.deltaNpv ?? 0;
        const downDelta = down?.deltaNpv ?? 0;
        const dominantDelta = Math.abs(upDelta) >= Math.abs(downDelta) ? upDelta : downDelta;
        return {
          id: family.id,
          label: family.label,
          dominantDelta,
          upShock: up ? { label: up.label, deltaNpv: up.deltaNpv } : undefined,
          downShock: down ? { label: down.label, deltaNpv: down.deltaNpv } : undefined,
          bestDelta: Math.max(upDelta, downDelta),
          worstDelta: Math.min(upDelta, downDelta),
          magnitude: Math.max(Math.abs(upDelta), Math.abs(downDelta)),
        };
      })
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 3);

    const orderedShocks = [...shocks].sort((a, b) => b.deltaNpv - a.deltaNpv);
    const biggestPositive = orderedShocks[0] || null;
    const biggestNegative = orderedShocks[orderedShocks.length - 1] || null;

    return {
      topDrivers,
      biggestPositive,
      biggestNegative,
    };
  }, [processedGroups, scenarios]);

  const breakevenOilPrice = useMemo(() => {
    if (aggregateMetrics.wellCount === 0) return null;
    const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
    const basePricing = baseScenario?.pricing || DEFAULT_COMMODITY_PRICING;

    const evaluateAtOil = (oilPrice: number) => {
      return processedGroups.reduce((sum, group) => {
        const groupWells = MOCK_WELLS.filter(w => group.wellIds.has(w.id));
        const { metrics } = calculateEconomics(groupWells, group.typeCurve, group.capex, { ...basePricing, oilPrice }, group.opex, group.ownership);
        return sum + metrics.npv10;
      }, 0);
    };

    let low = 30;
    let high = 140;
    let lowNpv = evaluateAtOil(low);
    let highNpv = evaluateAtOil(high);

    if (Math.abs(lowNpv) < 1e-2) return low;
    if (Math.abs(highNpv) < 1e-2) return high;
    if ((lowNpv < 0 && highNpv < 0) || (lowNpv > 0 && highNpv > 0)) return null;

    for (let i = 0; i < 28; i++) {
      const mid = (low + high) / 2;
      const midNpv = evaluateAtOil(mid);
      if (Math.abs(midNpv) < 1e-2) return Number(mid.toFixed(1));

      if ((lowNpv < 0 && midNpv > 0) || (lowNpv > 0 && midNpv < 0)) {
        high = mid;
        highNpv = midNpv;
      } else {
        low = mid;
        lowNpv = midNpv;
      }
    }

    return Number(((low + high) / 2).toFixed(1));
  }, [aggregateMetrics.wellCount, processedGroups, scenarios]);

  const handleSaveSnapshot = async () => {
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

  // handleSaveScenario merged into handleSaveSnapshot above

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
    try {
      localStorage.setItem(DESIGN_WORKSPACE_STORAGE_KEY, designWorkspace);
    } catch {
      // no-op
    }
  }, [designWorkspace, supabasePersistenceEnabled]);

  useEffect(() => {
    if (supabasePersistenceEnabled) return;
    try {
      localStorage.setItem(ECONOMICS_RESULTS_TAB_STORAGE_KEY, economicsResultsTab);
    } catch {
      // no-op
    }
  }, [economicsResultsTab, supabasePersistenceEnabled]);

  useEffect(() => {
    try {
      if (economicsFocusMode) {
        localStorage.setItem(ECONOMICS_FOCUS_MODE_STORAGE_KEY, '1');
      } else {
        localStorage.removeItem(ECONOMICS_FOCUS_MODE_STORAGE_KEY);
      }
    } catch {
      // no-op
    }
  }, [economicsFocusMode]);

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
    RUN: 'NOT_STARTED', // kept for type compatibility but not rendered
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
    try {
      localStorage.setItem(ANALYSIS_OPEN_SECTION_STORAGE_KEY, section);
    } catch {
      // no-op
    }
    setViewMode('ANALYSIS');
  };

  useEffect(() => {
    if (viewMode !== 'DASHBOARD') return;
    if (designWorkspace !== 'ECONOMICS') return;
    if (hasCapexItems) return;
    setControlsOpenSection('CAPEX');
    if (viewportLayout === 'mobile') setEconomicsMobilePanel('SETUP');
  }, [designWorkspace, hasCapexItems, viewMode, viewportLayout]);

  const operationsProps = {
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
    topDrivers: keyDriverInsights.topDrivers,
    biggestPositive: keyDriverInsights.biggestPositive,
    biggestNegative: keyDriverInsights.biggestNegative,
    breakevenOilPrice,
    payoutMonths: aggregateMetrics.payoutMonths,
    fastestPayoutScenarioName,
    scenarioRankings,
  };

  return (
    <div className={`min-h-screen bg-transparent theme-transition ${atmosphereClass} ${fxClass}`}>
      {BackgroundComponent && (
        <Suspense fallback={null}>
          <BackgroundComponent />
        </Suspense>
      )}
      
      <PageHeader
        isClassic={isClassic}
        theme={theme}
        themes={themes}
        themeId={themeId}
        setThemeId={setThemeId}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        designWorkspace={designWorkspace}
        onSetDesignWorkspace={setDesignWorkspace}
        economicsNeedsAttention={economicsNeedsAttention}
        wellsNeedsAttention={wellsNeedsAttention}
        onNavigateHub={() => navigate('/hub')}
        atmosphericOverlays={atmosphericOverlays}
        headerAtmosphereClass={headerAtmosphereClass}
        fxClass={fxClass}
      />

      <main className="p-4 md:p-6 max-w-[1920px] mx-auto w-full">
        
        {viewMode === 'ANALYSIS' ? (
             <ScenarioDashboard
               groups={processedGroups}
               wells={MOCK_WELLS}
               scenarios={scenarios}
               setScenarios={handleSetScenarios}
             />
        ) : (
             <>
               {designWorkspace === 'WELLS' ? (
                 <DesignWellsView
                   isClassic={isClassic}
                   theme={theme}
                   themeId={themeId}
                   viewportLayout={viewportLayout}
                   mobilePanel={wellsMobilePanel}
                   onSetMobilePanel={setWellsMobilePanel}
                   groups={processedGroups}
                   activeGroupId={activeGroupId}
                   selectedWellCount={selectedVisibleCount}
                   onActivateGroup={setActiveGroupId}
                   onAddGroup={handleAddGroup}
                   onCloneGroup={handleCloneGroup}
                   onAssignWells={handleAssignWellsToActive}
                   onCreateGroupFromSelection={handleCreateGroupFromSelection}
                   onSelectAll={handleSelectAll}
                   onClearSelection={handleClearSelection}
                   operatorFilter={operatorFilter}
                   formationFilter={formationFilter}
                   statusFilter={statusFilter}
                   operatorOptions={operatorOptions}
                   formationOptions={formationOptions}
                   statusOptions={statusOptions}
                   onSetOperatorFilter={setOperatorFilter}
                   onSetFormationFilter={setFormationFilter}
                   onSetStatusFilter={(value) => setStatusFilter(value)}
                   onResetFilters={handleResetFilters}
                   filteredWellsCount={filteredWells.length}
                   totalWellCount={MOCK_WELLS.length}
                   wells={MOCK_WELLS}
                   selectedWellIds={selectedWellIds}
                   visibleWellIds={visibleWellIds}
                   dimmedWellIds={dimmedWellIds}
                   onToggleWell={handleToggleWell}
                   onSelectWells={handleSelectWells}
                 />
               ) : (
                 <DesignEconomicsView
                   isClassic={isClassic}
                   themeId={themeId}
                   workflowSteps={workflowSteps}
                   mobilePanel={economicsMobilePanel}
                   onSetMobilePanel={setEconomicsMobilePanel}
                   resultsTab={economicsResultsTab}
                   onSetResultsTab={setEconomicsResultsTab}
                   focusMode={economicsFocusMode}
                   onToggleFocusMode={() => setEconomicsFocusMode(prev => !prev)}
                   onRequestOpenControlsSection={handleRequestOpenControlsSection}
                   onRequestOpenAnalysisSection={handleRequestOpenAnalysisSection}
                   wells={MOCK_WELLS}
                   groups={processedGroups}
                   activeGroupId={activeGroupId}
                   onActivateGroup={setActiveGroupId}
                   onCloneGroup={handleCloneGroup}
                   activeGroup={activeGroup}
                   onUpdateGroup={handleUpdateGroup}
                   onMarkDirty={() => {}}
                   controlsOpenSection={controlsOpenSection}
                   onControlsOpenHandled={() => setControlsOpenSection(null)}
                   hasGroup={hasGroup}
                   hasGroupWells={hasGroupWells}
                   hasCapexItems={hasCapexItems}
                   aggregateMetrics={aggregateMetrics}
                   aggregateFlow={aggregateFlow}
                   operationsProps={operationsProps}
                   breakevenOilPrice={breakevenOilPrice}
                 />
               )}
             </>
        )}

      </main>
    </div>
  );
};

export default SlopcastPage;
