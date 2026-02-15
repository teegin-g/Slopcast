import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_CAPEX, DEFAULT_COMMODITY_PRICING, DEFAULT_OPEX, DEFAULT_OWNERSHIP, DEFAULT_TYPE_CURVE, GROUP_COLORS, MOCK_WELLS } from '../constants';
import { Scenario, ScheduleParams, Well, WellGroup } from '../types';
import Charts from '../components/Charts';
import Controls from '../components/Controls';
import GroupList from '../components/GroupList';
import MapVisualizer from '../components/MapVisualizer';
import ScenarioDashboard from '../components/ScenarioDashboard';
import KpiGrid from '../components/slopcast/KpiGrid';
import OperationsConsole from '../components/slopcast/OperationsConsole';
import PageHeader from '../components/slopcast/PageHeader';
import WorkflowStepper, { DesignStep, StepStatus, WorkflowStep } from '../components/slopcast/WorkflowStepper';
import { useViewportLayout } from '../components/slopcast/hooks/useViewportLayout';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import { aggregateEconomics, calculateEconomics } from '../utils/economics';

type ViewMode = 'DASHBOARD' | 'ANALYSIS'; 
type MobileSection = 'SETUP' | 'WORKSPACE' | 'KPIS';
type OpsTab = 'SELECTION_ACTIONS' | 'KEY_DRIVERS';
type FxMode = 'cinematic' | 'max';
type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP';

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

type DriverFamily = {
  id: string;
  label: string;
  upShockId: string;
  downShockId: string;
};

type SavedScenarioSnapshot = {
  id: string;
  name: string;
  createdAt: string;
  activeGroupId: string;
  selectedWellCount: number;
  portfolio: {
    npv10: number;
    totalCapex: number;
    eur: number;
    payoutMonths: number;
    wellCount: number;
  };
  groups: {
    id: string;
    name: string;
    wellCount: number;
    npv10: number;
    roi: number;
    payoutMonths: number;
  }[];
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

const SAVED_SCENARIOS_STORAGE_KEY = 'slopcast-saved-scenarios';
const FX_QUERY_KEY = 'fx';
const FX_STORAGE_KEY_PREFIX = 'slopcast-fx-';

const csvCell = (value: string | number) => {
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const SlopcastPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  // --- Theme (from provider) ---
  const { themeId, theme, themes, setThemeId } = useTheme();
  const { features } = theme;
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
  const [mobileSection, setMobileSection] = useState<MobileSection>('WORKSPACE');
  const [opsTab, setOpsTab] = useState<OpsTab>('SELECTION_ACTIONS');
  const viewportLayout = useViewportLayout();
  const [controlsOpenSection, setControlsOpenSection] = useState<ControlsSection | null>(null);
  const [economicsInputVersion, setEconomicsInputVersion] = useState(1);
  const [lastRunVersion, setLastRunVersion] = useState(0);

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
  const [lastEconomicsRunAt, setLastEconomicsRunAt] = useState<string | null>(null);
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

  // --- Handlers ---
  const activeGroup = processedGroups.find(g => g.id === activeGroupId) || processedGroups[0];
  const markEconomicsDirty = () => setEconomicsInputVersion(prev => prev + 1);
  const handleSetScenarios: React.Dispatch<React.SetStateAction<Scenario[]>> = (next) => {
    setScenarios(next);
    markEconomicsDirty();
  };

  const handleUpdateGroup = (updatedGroup: WellGroup) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    markEconomicsDirty();
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
    markEconomicsDirty();
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
    markEconomicsDirty();
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
    markEconomicsDirty();
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
    markEconomicsDirty();
  };

  const handleToggleWell = (id: string) => {
    if (!visibleWellIds.has(id)) return;
    setSelectedWellIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    markEconomicsDirty();
  };

  const handleSelectWells = (ids: string[]) => {
      setSelectedWellIds(prev => {
          const next = new Set(prev);
          ids.forEach(id => {
            if (visibleWellIds.has(id)) next.add(id);
          });
          return next;
      });
      markEconomicsDirty();
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
    markEconomicsDirty();
  };

  const handleClearSelection = () => {
    setSelectedWellIds(new Set());
    markEconomicsDirty();
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

  const handleRunEconomics = () => {
    setLastEconomicsRunAt(new Date().toISOString());
    setLastRunVersion(economicsInputVersion);
    setActionMessage('Economics refreshed.');
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

  const handleSaveScenario = () => {
    const snapshot: SavedScenarioSnapshot = {
      id: `snapshot-${Date.now()}`,
      name: `${activeGroup.name} Snapshot`,
      createdAt: new Date().toISOString(),
      activeGroupId,
      selectedWellCount: selectedWellIds.size,
      portfolio: {
        npv10: aggregateMetrics.npv10,
        totalCapex: aggregateMetrics.totalCapex,
        eur: aggregateMetrics.eur,
        payoutMonths: aggregateMetrics.payoutMonths,
        wellCount: aggregateMetrics.wellCount,
      },
      groups: scenarioRankings.map(group => ({
        id: group.id,
        name: group.name,
        wellCount: group.wellCount,
        npv10: group.npv10,
        roi: group.roi,
        payoutMonths: group.payoutMonths,
      })),
    };

    try {
      const raw = localStorage.getItem(SAVED_SCENARIOS_STORAGE_KEY);
      const existing: SavedScenarioSnapshot[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        SAVED_SCENARIOS_STORAGE_KEY,
        JSON.stringify([snapshot, ...existing].slice(0, 30))
      );
      setActionMessage(`${snapshot.name} saved.`);
    } catch {
      setActionMessage('Scenario save failed.');
    }
  };

  useEffect(() => {
    if (!actionMessage) return;
    const timeout = window.setTimeout(() => setActionMessage(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  useEffect(() => {
    if (viewMode === 'DASHBOARD') setMobileSection('WORKSPACE');
  }, [viewMode]);

  const setupComplete = !!activeGroup && activeGroup.capex.items.length > 0 && activeGroup.typeCurve.qi > 0;
  const selectionComplete = activeGroup.wellIds.size > 0 || selectedVisibleCount > 0;
  const hasRun = !!lastEconomicsRunAt;
  const needsRerun = economicsInputVersion > lastRunVersion;
  const runComplete = hasRun && !needsRerun;
  const activeStep: DesignStep = !setupComplete
    ? 'SETUP'
    : !selectionComplete
      ? 'SELECT'
      : !runComplete
        ? 'RUN'
        : 'REVIEW';

  const orderedSteps: DesignStep[] = ['SETUP', 'SELECT', 'RUN', 'REVIEW'];
  const stepStatusMap: Record<DesignStep, StepStatus> = {
    SETUP: setupComplete ? 'COMPLETE' : (activeStep === 'SETUP' ? 'ACTIVE' : 'NOT_STARTED'),
    SELECT: selectionComplete ? 'COMPLETE' : (activeStep === 'SELECT' ? 'ACTIVE' : 'NOT_STARTED'),
    RUN: runComplete ? 'COMPLETE' : (needsRerun && hasRun ? 'STALE' : (activeStep === 'RUN' ? 'ACTIVE' : 'NOT_STARTED')),
    REVIEW: runComplete ? (activeStep === 'REVIEW' ? 'ACTIVE' : 'COMPLETE') : 'NOT_STARTED',
  };
  const workflowSteps: WorkflowStep[] = orderedSteps.map(step => ({
    id: step,
    label: step === 'SETUP' ? 'Setup' : step === 'SELECT' ? 'Select Wells' : step === 'RUN' ? 'Run' : 'Review',
    status: stepStatusMap[step],
  }));
  const stepGuidance = activeStep === 'SETUP'
    ? 'Step 1: complete setup inputs (CAPEX, decline, ownership).'
    : activeStep === 'SELECT'
      ? 'Step 2: select wells and assign them to the active group.'
      : activeStep === 'RUN'
        ? 'Step 3: run economics to refresh portfolio outputs.'
        : 'Step 4: review KPIs, drivers, and rankings.';
  const canUseSecondaryActions = runComplete;

  useEffect(() => {
    if (viewMode !== 'DASHBOARD') return;
    if (activeStep !== 'SETUP') return;
    if (activeGroup.capex.items.length > 0) return;
    setControlsOpenSection('CAPEX');
    if (viewportLayout === 'mobile') setMobileSection('SETUP');
  }, [activeGroup.capex.items.length, activeStep, viewMode, viewportLayout]);

  const operationsPanel = (
    <OperationsConsole
      isClassic={isClassic}
      opsTab={opsTab}
      onOpsTabChange={setOpsTab}
      selectedVisibleCount={selectedVisibleCount}
      filteredVisibleCount={filteredWells.length}
      activeGroupName={activeGroup.name}
      onAssign={handleAssignWellsToActive}
      onCreateGroup={handleCreateGroupFromSelection}
      onSelectAll={handleSelectAll}
      onClear={handleClearSelection}
      onRunEconomics={handleRunEconomics}
      onSaveScenario={handleSaveScenario}
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
      canAssign={selectedVisibleCount > 0}
      canClear={selectedVisibleCount > 0}
      canRun={aggregateMetrics.wellCount > 0}
      canUseSecondaryActions={canUseSecondaryActions}
      lastEconomicsRunAt={lastEconomicsRunAt}
      actionMessage={actionMessage}
      validationWarnings={validationWarnings}
      stepGuidance={stepGuidance}
      needsRerun={needsRerun}
      topDrivers={keyDriverInsights.topDrivers}
      biggestPositive={keyDriverInsights.biggestPositive}
      biggestNegative={keyDriverInsights.biggestNegative}
      breakevenOilPrice={breakevenOilPrice}
      payoutMonths={aggregateMetrics.payoutMonths}
      fastestPayoutScenarioName={fastestPayoutScenarioName}
      scenarioRankings={scenarioRankings}
    />
  );

  const economicsPanel = (
    <>
      <KpiGrid isClassic={isClassic} metrics={aggregateMetrics} />
      <div
        className={
          isClassic
            ? 'flex-1 min-h-[320px] sc-panel theme-transition p-3'
            : 'flex-1 min-h-[320px] rounded-panel border p-1 theme-transition bg-theme-surface1/50 border-theme-border shadow-card'
        }
      >
        <Charts data={aggregateFlow} themeId={themeId} />
      </div>
    </>
  );

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
        onNavigateHub={() => navigate('/hub')}
        sessionDisplayName={session?.user.displayName || 'Demo User'}
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
               <div className="hidden lg:block">
                 <WorkflowStepper isClassic={isClassic} steps={workflowSteps} />
               </div>
               <div className="lg:hidden sticky top-[78px] z-30 mb-3">
                 <WorkflowStepper isClassic={isClassic} steps={workflowSteps} compact />
               </div>
               <div
                 className={`lg:hidden mb-4 border p-2 theme-transition ${
                   isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 border-theme-border shadow-card backdrop-blur-sm'
                 }`}
               >
                 <div className="grid grid-cols-3 gap-2">
                   <button
                     onClick={() => setMobileSection('SETUP')}
                     className={
                       isClassic
                         ? `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                             mobileSection === 'SETUP'
                               ? 'bg-theme-warning text-black border-black/20'
                               : 'bg-black/15 text-white/90 border-black/25'
                           }`
                         : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border transition-colors ${
                             mobileSection === 'SETUP'
                               ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                               : 'bg-theme-bg text-theme-muted border-theme-border'
                           }`
                     }
                   >
                     Setup
                   </button>
                   <button
                     onClick={() => setMobileSection('WORKSPACE')}
                     className={
                       isClassic
                         ? `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                             mobileSection === 'WORKSPACE'
                               ? 'bg-theme-warning text-black border-black/20'
                               : 'bg-black/15 text-white/90 border-black/25'
                           }`
                         : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border transition-colors ${
                             mobileSection === 'WORKSPACE'
                               ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                               : 'bg-theme-bg text-theme-muted border-theme-border'
                           }`
                     }
                   >
                     Workspace
                   </button>
                   <button
                     onClick={() => setMobileSection('KPIS')}
                     className={
                       isClassic
                         ? `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                             mobileSection === 'KPIS'
                               ? 'bg-theme-warning text-black border-black/20'
                               : 'bg-black/15 text-white/90 border-black/25'
                           }`
                         : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border transition-colors ${
                             mobileSection === 'KPIS'
                               ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                               : 'bg-theme-bg text-theme-muted border-theme-border'
                           }`
                     }
                   >
                     KPIs
                   </button>
                 </div>
               </div>

               <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${viewportLayout === 'desktop' ? 'xl:min-h-[calc(100vh-9rem)] xl:auto-rows-fr' : ''}`}>
                {/* LEFT: Inputs */}
                <aside
                  className={`xl:col-span-3 lg:col-span-4 lg:min-h-0 xl:overflow-y-auto scrollbar-hide space-y-6 pb-4 theme-transition ${
                    isClassic ? 'p-1' : 'p-4 rounded-panel bg-theme-bg/60 backdrop-blur-sm border border-theme-border'
                  } ${mobileSection !== 'SETUP' ? 'hidden lg:block' : ''}`}
                >
                    <GroupList 
                        groups={processedGroups}
                        activeGroupId={activeGroupId}
                        selectedWellCount={selectedVisibleCount}
                        onActivateGroup={setActiveGroupId}
                        onAddGroup={handleAddGroup}
                        onCloneGroup={handleCloneGroup}
                        onAssignWells={handleAssignWellsToActive}
                        onCreateGroupFromSelection={handleCreateGroupFromSelection}
                    />
                    {isClassic ? (
                      <div className="sc-panel theme-transition">
                        <div className="sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex items-center justify-between">
                          <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">Filters</h3>
                          <button
                            onClick={handleResetFilters}
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
                              onChange={(e) => setOperatorFilter(e.target.value)}
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
                              onChange={(e) => setFormationFilter(e.target.value)}
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
                              onChange={(e) => setStatusFilter(e.target.value as Well['status'] | 'ALL')}
                              className="w-full rounded-md px-3 py-2 text-xs font-black sc-inputNavy"
                            >
                              <option value="ALL">All Statuses</option>
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80 border border-black/25 rounded-md px-3 py-2">
                            {filteredWells.length} visible / {MOCK_WELLS.length} total
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-panel border p-4 shadow-card theme-transition bg-theme-surface1/80 border-theme-border">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`font-semibold text-sm uppercase tracking-wide text-theme-cyan ${theme.features.brandFont ? 'brand-font' : ''}`}>Filters</h3>
                          <button
                            onClick={handleResetFilters}
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
                              onChange={(e) => setOperatorFilter(e.target.value)}
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
                              onChange={(e) => setFormationFilter(e.target.value)}
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
                              onChange={(e) => setStatusFilter(e.target.value as Well['status'] | 'ALL')}
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
                          {filteredWells.length} visible / {MOCK_WELLS.length} total
                        </div>
                      </div>
                    )}
                    {!isClassic && <hr className="border-theme-border opacity-30" />}
                    <Controls
                      group={activeGroup}
                      onUpdateGroup={handleUpdateGroup}
                      onMarkDirty={markEconomicsDirty}
                      openSectionKey={controlsOpenSection}
                      onOpenSectionHandled={() => setControlsOpenSection(null)}
                    />
                </aside>

                {/* MIDDLE: Visuals */}
                <section className={`xl:col-span-5 lg:col-span-8 lg:min-h-0 flex flex-col space-y-6 ${mobileSection !== 'WORKSPACE' ? 'hidden lg:flex' : ''}`}>
                    {/* Map */}
                    {isClassic ? (
                      <div className="w-full shrink-0 min-h-[360px] h-[min(54vh,520px)] sc-panel theme-transition">
                        <div className="sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex justify-between items-center">
                          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-white/70"></span>
                            BASIN VISUALIZER
                          </h2>
                          <button
                            onClick={handleSelectAll}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 hover:text-white transition-colors"
                          >
                            {filteredWells.length > 0 && selectedVisibleCount === filteredWells.length ? 'DESELECT FILTERED' : 'SELECT FILTERED'}
                          </button>
                        </div>
                        <div className="p-3 h-[calc(100%-48px)]">
                          <div className="sc-screen h-full w-full">
                            <MapVisualizer 
                              wells={MOCK_WELLS} 
                              selectedWellIds={selectedWellIds}
                              visibleWellIds={visibleWellIds}
                              dimmedWellIds={dimmedWellIds}
                              groups={processedGroups}
                              onToggleWell={handleToggleWell}
                              onSelectWells={handleSelectWells}
                              themeId={themeId}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full shrink-0 min-h-[360px] h-[min(54vh,520px)] rounded-panel border shadow-card relative overflow-hidden group theme-transition bg-theme-bg border-theme-border">
                          {features.glowEffects && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-theme-cyan via-theme-magenta to-theme-cyan opacity-40"></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-transparent to-transparent pointer-events-none"></div>
                          <div className="flex justify-between items-center px-4 py-3 relative z-10 bg-black/10 backdrop-blur-sm border-b border-white/5">
                              <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 theme-transition text-theme-cyan">
                                  <span className="w-2 h-2 rounded-full animate-pulse bg-theme-cyan"></span>
                                  Basin Visualizer
                              </h2>
                              <div className="flex space-x-6">
                                  <button onClick={handleSelectAll} className="text-[10px] font-bold tracking-[0.1em] theme-transition hover:scale-105 text-theme-lavender">
                                      {filteredWells.length > 0 && selectedVisibleCount === filteredWells.length ? 'DESELECT FILTERED' : 'SELECT FILTERED'}
                                  </button>
                              </div>
                          </div>
                          <div className="h-[calc(100%-48px)] w-full relative z-0">
                              <MapVisualizer 
                                  wells={MOCK_WELLS} 
                                  selectedWellIds={selectedWellIds}
                                  visibleWellIds={visibleWellIds}
                                  dimmedWellIds={dimmedWellIds}
                                  groups={processedGroups}
                                  onToggleWell={handleToggleWell}
                                  onSelectWells={handleSelectWells}
                                  themeId={themeId}
                              />
                          </div>
                      </div>
                    )}

                    {economicsPanel}
                </section>

                {/* RIGHT: Selection / Actions */}
                <section className={`xl:col-span-4 lg:col-span-12 lg:min-h-0 xl:overflow-y-auto scrollbar-hide flex flex-col space-y-8 pb-4 ${mobileSection !== 'KPIS' ? 'hidden lg:flex' : ''}`}>
                  {operationsPanel}
                </section>
               </div>
             </>
        )}

      </main>
    </div>
  );
};

export default SlopcastPage;
