import { DEFAULT_TAX_ASSUMPTIONS, TaxAssumptions } from '../../../types';
import type {
  CapexCategory,
  CommodityPricingAssumptions,
  DealMetrics,
  MonthlyCashFlow,
  OpexSegment,
  Scenario,
  Well,
  WellGroup,
} from '../../../types';
import { applyTaxLayer } from '../../../utils/economics';
import type { EconomicsContext, EconomicsModule } from './types';

const CATEGORY_ORDER: CapexCategory[] = ['DRILLING', 'COMPLETION', 'FACILITIES', 'EQUIPMENT', 'OTHER'];
const STANDARD_LATERAL_FT = 10000;

export const currencyMm = (value: number) => `$${(value / 1e6).toFixed(2)}MM`;
export const currency = (value: number, digits = 2) => `$${value.toFixed(digits)}`;
export const percent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;
export const ratio = (value: number, digits = 2) => `${value.toFixed(digits)}x`;

export const monthsToYears = (months: number) => (months > 0 ? months / 12 : 0);

export const getGroupWells = (group: WellGroup, wells: Well[]) => wells.filter((well) => group.wellIds.has(well.id));

export const getFlow = (group: WellGroup) => group.flow ?? [];
export const getMetrics = (group: WellGroup): DealMetrics => (
  group.metrics ?? { totalCapex: 0, eur: 0, npv10: 0, payoutMonths: 0, wellCount: 0 }
);

export function getRealizedPricing(pricing: CommodityPricingAssumptions) {
  return {
    oil: pricing.oilPrice - (pricing.oilDifferential || 0),
    gas: pricing.gasPrice - (pricing.gasDifferential || 0),
    oilDifferential: pricing.oilDifferential || 0,
    gasDifferential: pricing.gasDifferential || 0,
  };
}

export function summarizeProduction(group: WellGroup) {
  const flow = getFlow(group);
  const metrics = getMetrics(group);
  const totalGas = flow.reduce((sum, row) => sum + row.gasProduction, 0);
  const peak = flow.reduce(
    (best, row) => (row.oilProduction > best.oilProduction ? row : best),
    flow[0] ?? { month: 0, oilProduction: 0, gasProduction: 0 } as MonthlyCashFlow,
  );
  const first = group.typeCurve.segments?.[0];

  return {
    flow,
    eur: metrics.eur,
    totalGas,
    peakOil: peak.oilProduction,
    peakMonth: peak.month,
    initialRate: first?.qi ?? group.typeCurve.qi,
    initialDecline: first?.initialDecline ?? group.typeCurve.di,
    bFactor: first?.b ?? group.typeCurve.b,
    gasOilRatio: group.typeCurve.gorMcfPerBbl || 0,
  };
}

export function summarizePricing(scenario: Scenario, flow: MonthlyCashFlow[]) {
  const realized = getRealizedPricing(scenario.pricing);
  const totalRevenue = flow.reduce((sum, row) => sum + row.revenue, 0);
  const oilVolume = flow.reduce((sum, row) => sum + row.oilProduction, 0);
  const gasVolume = flow.reduce((sum, row) => sum + row.gasProduction, 0);
  return {
    realized,
    totalRevenue,
    oilVolume,
    gasVolume,
    revenuePerBoe: oilVolume > 0 ? totalRevenue / oilVolume : 0,
  };
}

export function summarizeOpex(group: WellGroup) {
  const flow = getFlow(group);
  const metrics = getMetrics(group);
  const totalOpex = flow.reduce((sum, row) => sum + row.opex, 0);
  const totalOil = Math.max(1, flow.reduce((sum, row) => sum + row.oilProduction, 0));
  const segments = group.opex.segments ?? [];
  const fixedMonthly = segments.reduce((sum, seg) => sum + seg.fixedPerWellPerMonth, 0);
  const variableOil = segments.reduce((sum, seg) => sum + seg.variableOilPerBbl, 0);
  const variableGas = segments.reduce((sum, seg) => sum + seg.variableGasPerMcf, 0);

  return {
    flow,
    totalOpex,
    loePerBoe: totalOpex / totalOil,
    opexToCapexPct: metrics.totalCapex > 0 ? (totalOpex / metrics.totalCapex) * 100 : 0,
    fixedMonthly,
    variableOil,
    variableGas,
    segments,
  };
}

export function estimateSegmentAnnualizedCost(segment: OpexSegment, wellCount: number) {
  const months = Math.max(1, segment.endMonth - segment.startMonth + 1);
  return segment.fixedPerWellPerMonth * Math.max(1, wellCount) * Math.min(12, months);
}

export function summarizeTaxes(group: WellGroup, tax: TaxAssumptions = group.taxAssumptions ?? DEFAULT_TAX_ASSUMPTIONS) {
  const flow = getFlow(group);
  const metrics = getMetrics(group);
  const taxed = applyTaxLayer(flow, metrics, tax);
  const totalSeverance = taxed.flow.reduce((sum, row) => sum + (row.severanceTax ?? 0), 0);
  const totalAdValorem = taxed.flow.reduce((sum, row) => sum + (row.adValoremTax ?? 0), 0);
  const totalIncome = taxed.flow.reduce((sum, row) => sum + (row.incomeTax ?? 0), 0);
  const totalTax = totalSeverance + totalAdValorem + totalIncome;
  const totalRevenue = flow.reduce((sum, row) => sum + row.revenue, 0);
  return {
    tax,
    taxedFlow: taxed.flow,
    taxedMetrics: taxed.metrics,
    totalTax,
    totalSeverance,
    totalAdValorem,
    totalIncome,
    effectiveRate: totalRevenue > 0 ? (totalTax / totalRevenue) * 100 : 0,
  };
}

export function summarizeOwnership(group: WellGroup) {
  const flow = getFlow(group);
  const totalRevenue = flow.reduce((sum, row) => sum + row.revenue, 0);
  const baseNri = group.ownership.baseNri;
  const baseCost = group.ownership.baseCostInterest;
  const agreementRevenueConveyed = (group.ownership.agreements ?? []).reduce(
    (sum, agreement) => sum + agreement.prePayout.conveyRevenuePctOfBase,
    0,
  );
  const royaltyBurden = Math.max(0, 1 - baseNri);
  const netRevenueShare = Math.max(0, baseNri * (1 - agreementRevenueConveyed));
  const splitCheck = netRevenueShare + royaltyBurden + Math.max(0, baseNri - netRevenueShare);
  return {
    totalRevenue,
    baseNri,
    baseCost,
    royaltyBurden,
    netRevenueShare,
    partnerShare: Math.max(0, baseNri - netRevenueShare),
    splitCheck,
    agreements: group.ownership.agreements ?? [],
  };
}

export function summarizeCapex(group: WellGroup, wells: Well[]) {
  const groupWells = getGroupWells(group, wells);
  const representativeLateral = groupWells.length > 0
    ? groupWells.reduce((sum, well) => sum + well.lateralLength, 0) / groupWells.length
    : STANDARD_LATERAL_FT;

  const categories = CATEGORY_ORDER.map((category) => {
    const total = group.capex.items
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + (item.basis === 'PER_FOOT' ? item.value * representativeLateral : item.value), 0);
    return { category, total };
  }).filter((row) => row.total > 0);

  const total = categories.reduce((sum, row) => sum + row.total, 0);
  const timing = [...group.capex.items]
    .sort((a, b) => a.offsetDays - b.offsetDays)
    .reduce<Array<{ offsetDays: number; cumulative: number; item: string }>>((rows, item) => {
      const cost = item.basis === 'PER_FOOT' ? item.value * representativeLateral : item.value;
      const cumulative = (rows[rows.length - 1]?.cumulative ?? 0) + cost;
      rows.push({ offsetDays: item.offsetDays, cumulative, item: item.name });
      return rows;
    }, []);

  return {
    total,
    categories,
    timing,
    representativeLateral,
    perWell: total,
  };
}

export function buildWhatChanged(context: EconomicsContext) {
  const changes: Array<{ label: string; from: string; to: string; module: EconomicsModule }> = [];
  const basePricing = context.baseScenario.pricing;
  const activePricing = context.activeScenario.pricing;
  const addPrice = (label: string, key: keyof CommodityPricingAssumptions, module: EconomicsModule = 'PRICING') => {
    if (basePricing[key] === activePricing[key]) return;
    changes.push({ label, from: currency(basePricing[key]), to: currency(activePricing[key]), module });
  };

  addPrice('Oil benchmark', 'oilPrice');
  addPrice('Gas benchmark', 'gasPrice');
  addPrice('Oil differential', 'oilDifferential');
  addPrice('Gas differential', 'gasDifferential');

  if (context.baseScenario.capexScalar !== context.activeScenario.capexScalar) {
    changes.push({
      label: 'CAPEX scalar',
      from: ratio(context.baseScenario.capexScalar),
      to: ratio(context.activeScenario.capexScalar),
      module: 'CAPEX',
    });
  }
  if (context.baseScenario.productionScalar !== context.activeScenario.productionScalar) {
    changes.push({
      label: 'Production scalar',
      from: ratio(context.baseScenario.productionScalar),
      to: ratio(context.activeScenario.productionScalar),
      module: 'PRODUCTION',
    });
  }
  const baseRigCount = context.baseScenario.schedule.annualRigs[0] ?? 0;
  const activeRigCount = context.activeScenario.schedule.annualRigs[0] ?? 0;
  if (baseRigCount !== activeRigCount) {
    changes.push({
      label: 'Year 1 rigs',
      from: String(baseRigCount),
      to: String(activeRigCount),
      module: 'CAPEX',
    });
  }

  return changes;
}
