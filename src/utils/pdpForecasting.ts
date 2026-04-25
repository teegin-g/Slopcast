import type {
  PdpGroupForecastStatus,
  PdpReadinessStatus,
  ProductionHistoryPoint,
  ProductionHistoryQualityFlag,
  Well,
  WellGroup,
  WellProductionHistoryStatus,
} from '../types';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const FIXTURE_END = Date.UTC(2026, 1, 1);

const parseIndex = (id: string) => {
  const match = id.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const isoMonth = (dateMs: number) => new Date(dateMs).toISOString().slice(0, 10);

const uniqueFlags = (flags: ProductionHistoryQualityFlag[]) => Array.from(new Set(flags));

export function buildMockProductionHistory(well: Well): WellProductionHistoryStatus {
  if (well.status !== 'PRODUCING') {
    return {
      wellId: well.id,
      status: 'MISSING',
      coverageStart: null,
      coverageEnd: null,
      producingMonths: 0,
      missingMonths: 0,
      lastProductionDate: null,
      streams: [],
      qualityFlags: ['NO_HISTORY'],
      history: [],
    };
  }

  const index = parseIndex(well.id);
  const producingMonths = 18 + (index % 54);
  const missingMonths = index % 7 === 0 ? 4 : index % 5 === 0 ? 2 : 0;
  const staleOffsetMonths = index % 11 === 0 ? 5 : 0;
  const endMs = FIXTURE_END - staleOffsetMonths * MONTH_MS;
  const startMs = endMs - (producingMonths - 1 + missingMonths) * MONTH_MS;
  const initialOil = 980 - (index % 9) * 55;
  const gasRatio = 1.7 + (index % 4) * 0.35;
  const monthlyDecline = 0.965 - (index % 3) * 0.006;

  const history: ProductionHistoryPoint[] = [];
  for (let month = 0; month < producingMonths; month += 1) {
    if (missingMonths > 0 && month > 0 && month % Math.max(5, Math.floor(producingMonths / missingMonths)) === 0) {
      continue;
    }
    const oilBbl = Math.max(180, initialOil * 30 * Math.pow(monthlyDecline, month));
    const gasMcf = oilBbl * gasRatio;
    history.push({
      month: isoMonth(startMs + month * MONTH_MS),
      oilBbl: Math.round(oilBbl),
      gasMcf: Math.round(gasMcf),
      waterBbl: Math.round(oilBbl * (0.25 + (index % 4) * 0.08)),
      loeCost: Math.round(8200 + oilBbl * 0.42 + gasMcf * 0.04),
    });
  }

  const flags: ProductionHistoryQualityFlag[] = [];
  if (history.length < 24) flags.push('SHORT_HISTORY');
  if (missingMonths > 0) flags.push('MISSING_MONTHS');
  if (staleOffsetMonths > 0) flags.push('STALE_PRODUCTION');

  return {
    wellId: well.id,
    status: flags.length > 0 ? 'PARTIAL' : 'LOADED',
    coverageStart: history[0]?.month ?? null,
    coverageEnd: history.at(-1)?.month ?? null,
    producingMonths: history.length,
    missingMonths,
    lastProductionDate: history.at(-1)?.month ?? null,
    streams: ['OIL', 'GAS', 'WATER'],
    qualityFlags: flags,
    history,
  };
}

export function buildProductionHistoryMap(wells: Well[]) {
  return wells.reduce<Record<string, WellProductionHistoryStatus>>((acc, well) => {
    acc[well.id] = buildMockProductionHistory(well);
    return acc;
  }, {});
}

export function summarizePdpGroup(
  group: WellGroup,
  wells: Well[],
  historyByWellId: Record<string, WellProductionHistoryStatus>,
): PdpGroupForecastStatus {
  const groupWells = wells.filter((well) => group.wellIds.has(well.id));
  const histories = groupWells.map((well) => historyByWellId[well.id]).filter(Boolean);
  const loaded = histories.filter((history) => history.status === 'LOADED');
  const partial = histories.filter((history) => history.status === 'PARTIAL');
  const missing = histories.filter((history) => history.status === 'MISSING');
  const latestRows = histories.flatMap((history) => history.history.at(-1) ? [history.history.at(-1)!] : []);
  const oilPerDay = latestRows.reduce((sum, row) => sum + row.oilBbl / 30, 0);
  const gasPerDay = latestRows.reduce((sum, row) => sum + row.gasMcf / 30, 0);
  const loe = latestRows.reduce((sum, row) => sum + (row.loeCost ?? 0), 0);
  const boe = latestRows.reduce((sum, row) => sum + row.oilBbl + row.gasMcf / 6, 0);
  const dates = histories.map((history) => history.lastProductionDate).filter((date): date is string => !!date).sort();
  const starts = histories.map((history) => history.coverageStart).filter((date): date is string => !!date).sort();

  return {
    groupId: group.id,
    loadedWellCount: loaded.length,
    partialWellCount: partial.length,
    missingWellCount: missing.length,
    producingWellCount: groupWells.filter((well) => well.status === 'PRODUCING').length,
    coverageStart: starts[0] ?? null,
    coverageEnd: dates.at(-1) ?? null,
    lastProductionDate: dates.at(-1) ?? null,
    currentOilBblPerDay: oilPerDay,
    currentGasMcfPerDay: gasPerDay,
    forecastGenerated: (loaded.length + partial.length) > 0 && group.typeCurve.qi > 0,
    opexForecastAssigned: group.opex.segments.length > 0,
    averageLoePerBoe: boe > 0 ? loe / boe : 0,
    qualityFlags: uniqueFlags(histories.flatMap((history) => history.qualityFlags)),
  };
}

export function getPdpReadiness(groups: WellGroup[], summaries: PdpGroupForecastStatus[]): PdpReadinessStatus {
  const activeGroups = groups.filter((group) => group.wellIds.size > 0);
  const activeSummaries = summaries.filter((summary) => activeGroups.some((group) => group.id === summary.groupId));
  return {
    productionDataLoaded: activeSummaries.some((summary) => summary.loadedWellCount + summary.partialWellCount > 0),
    groupsSelected: activeGroups.length > 0,
    forecastsGenerated: activeSummaries.length > 0 && activeSummaries.every((summary) => summary.forecastGenerated),
    opexForecastAssigned: activeGroups.length > 0 && activeGroups.every((group) => group.opex.segments.length > 0),
    ownershipTaxesAssigned: activeGroups.length > 0 && activeGroups.every((group) => group.ownership.baseNri > 0 && group.ownership.baseCostInterest > 0),
    economicsCalculated: activeGroups.length > 0 && activeGroups.every((group) => !!group.metrics && group.metrics.wellCount > 0),
    dataQualityAcknowledged: activeGroups.length > 0 && activeGroups.every((group) => group.dataQualityAcknowledged || summaries.find((summary) => summary.groupId === group.id)?.qualityFlags.length === 0),
  };
}

export function summarizeProductionUniverse(wells: Well[], historyByWellId: Record<string, WellProductionHistoryStatus>) {
  const producing = wells.filter((well) => well.status === 'PRODUCING');
  const histories = producing.map((well) => historyByWellId[well.id]).filter(Boolean);
  const loaded = histories.filter((history) => history.status === 'LOADED').length;
  const partial = histories.filter((history) => history.status === 'PARTIAL').length;
  const missing = histories.filter((history) => history.status === 'MISSING').length;
  const qualityFlags = uniqueFlags(histories.flatMap((history) => history.qualityFlags));
  return {
    producingWellCount: producing.length,
    loadedWellCount: loaded,
    partialWellCount: partial,
    missingWellCount: missing,
    coveragePct: producing.length > 0 ? ((loaded + partial) / producing.length) * 100 : 0,
    qualityFlags,
  };
}
