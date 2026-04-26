import type {
  DevelopmentInventoryGroup,
  DevelopmentInventorySummary,
  DsuInventory,
  PlannedWell,
  UndevelopedReadinessStatus,
} from '../types';
import { generateMockDsuLayer } from './mockDsuLayer';

const BENCHES = ['Upper Wolfcamp A', 'Lower Wolfcamp A', 'Wolfcamp B', 'Third Bone Spring'];
const COLORS = ['#38bdf8', '#34d399', '#f59e0b', '#a78bfa'];
const BASE_DSU_ACRES = 640;
const BASE_CAPEX_PER_WELL = 9_200_000;
const BASE_NPV_PER_WELL = 4_850_000;
const BASE_EUR_PER_WELL = 690_000;

export function buildMockDevelopmentInventory(centerLat = 31.75, centerLng = -103.55) {
  const layer = generateMockDsuLayer(centerLat, centerLng, 3, 73);
  const dsus: DsuInventory[] = layer.dsus.map((dsu, index) => ({
    id: dsu.id,
    name: dsu.name,
    operator: dsu.operator,
    formation: dsu.formation,
    bench: BENCHES[index % BENCHES.length],
    acreage: BASE_DSU_ACRES,
    plannedWellIds: layer.wellbores.filter((well) => well.dsuId === dsu.id).map((well) => well.id),
    coordinates: dsu.coordinates,
  }));

  const plannedWells: PlannedWell[] = layer.wellbores.map((well, index) => ({
    id: well.id,
    dsuId: well.dsuId,
    name: `PUD ${index + 1}`,
    formation: well.formation,
    bench: BENCHES[index % BENCHES.length],
    status: well.status,
    lateralLength: well.lateralLength,
    spacingFt: 660 + (index % 3) * 220,
    firstProductionMonth: 6 + (index % 24),
    coordinates: well.coordinates,
  }));

  const groups: DevelopmentInventoryGroup[] = [
    makeInventoryGroup('dev-core', 'Core DSU Program', COLORS[0], dsus.slice(0, 3), plannedWells, 0.86),
    makeInventoryGroup('dev-west', 'West Bench Extension', COLORS[1], dsus.slice(3, 6), plannedWells, 0.72),
    makeInventoryGroup('dev-stepout', 'Step-out Concepts', COLORS[2], dsus.slice(6), plannedWells, 0.58),
  ];

  return { dsus, plannedWells, groups };
}

function makeInventoryGroup(
  id: string,
  name: string,
  color: string,
  dsus: DsuInventory[],
  plannedWells: PlannedWell[],
  riskFactor: number,
): DevelopmentInventoryGroup {
  const plannedWellIds = dsus.flatMap((dsu) => dsu.plannedWellIds);
  const groupWells = plannedWells.filter((well) => plannedWellIds.includes(well.id));
  const average = (values: number[]) => values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const bench = dsus[0]?.bench ?? 'Wolfcamp A';

  return {
    id,
    name,
    color,
    dsuIds: dsus.map((dsu) => dsu.id),
    plannedWellIds,
    spacingAssumptions: {
      spacingFt: Math.round(average(groupWells.map((well) => well.spacingFt)) || 880),
      lateralLengthFt: Math.round(average(groupWells.map((well) => well.lateralLength)) || 9_500),
      bench,
      parentChildRisk: Number((1 - riskFactor).toFixed(2)),
    },
    typeCurveId: `${id}-type-curve`,
    capexAssigned: true,
    scheduleAssigned: true,
    loeAssigned: true,
    ownershipAssigned: true,
    taxesAssigned: true,
    riskFactor,
  };
}

export function summarizeDevelopmentInventory(
  groups: DevelopmentInventoryGroup[],
  dsus: DsuInventory[],
  plannedWells: PlannedWell[],
): DevelopmentInventorySummary {
  const groupDsuIds = new Set(groups.flatMap((group) => group.dsuIds));
  const groupWellIds = new Set(groups.flatMap((group) => group.plannedWellIds));
  const includedDsus = dsus.filter((dsu) => groupDsuIds.has(dsu.id));
  const includedWells = plannedWells.filter((well) => groupWellIds.has(well.id));
  const weightedRisk = groups.length > 0
    ? groups.reduce((sum, group) => sum + group.riskFactor * group.plannedWellIds.length, 0) / Math.max(1, groups.reduce((sum, group) => sum + group.plannedWellIds.length, 0))
    : 0;
  const totalCapex = includedWells.length * BASE_CAPEX_PER_WELL;
  const unriskedNpv10 = includedWells.length * BASE_NPV_PER_WELL;

  return {
    dsuCount: includedDsus.length,
    plannedWellCount: includedWells.length,
    totalAcreage: includedDsus.reduce((sum, dsu) => sum + dsu.acreage, 0),
    averageSpacingFt: average(includedWells.map((well) => well.spacingFt)),
    averageLateralLengthFt: average(includedWells.map((well) => well.lateralLength)),
    totalCapex,
    unriskedNpv10,
    riskedNpv10: unriskedNpv10 * weightedRisk,
    eur: includedWells.length * BASE_EUR_PER_WELL,
    wellsPerYear: Math.max(1, Math.round(includedWells.length / 3)),
    riskFactor: weightedRisk,
    benches: Array.from(new Set(includedDsus.map((dsu) => dsu.bench))),
    formations: Array.from(new Set(includedDsus.map((dsu) => dsu.formation))),
  };
}

export function getUndevelopedReadiness(
  groups: DevelopmentInventoryGroup[],
  summary: DevelopmentInventorySummary,
): UndevelopedReadinessStatus {
  return {
    inventoryCreated: groups.length > 0 && summary.plannedWellCount > 0,
    spacingAssigned: groups.length > 0 && groups.every((group) => group.spacingAssumptions.spacingFt > 0 && group.spacingAssumptions.lateralLengthFt > 0),
    typeCurveAssigned: groups.length > 0 && groups.every((group) => !!group.typeCurveId),
    capexAssigned: groups.length > 0 && groups.every((group) => group.capexAssigned),
    scheduleAssigned: groups.length > 0 && groups.every((group) => group.scheduleAssigned),
    loeOwnershipTaxesAssigned: groups.length > 0 && groups.every((group) => group.loeAssigned && group.ownershipAssigned && group.taxesAssigned),
    economicsCalculated: summary.riskedNpv10 > 0 && summary.totalCapex > 0,
  };
}

function average(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
