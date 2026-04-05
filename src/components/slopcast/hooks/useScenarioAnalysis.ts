import { useMemo } from 'react';
import type { WellGroup, Well, Scenario, SensitivityVariable, SensitivityMatrixResult } from '../../../types';
import { calculateEconomics, generateSensitivityMatrix } from '../../../utils/economics';
import { DEFAULT_COMMODITY_PRICING } from '../../../constants';

export interface ScenarioResult {
  scenario: Scenario;
  metrics: {
    npv10: number;
    totalCapex: number;
    eur: number;
    roi: number;
  };
  flow: number[];
}

export interface ChartDataPoint {
  month: number;
  [scenarioId: string]: number;
}

interface UseScenarioAnalysisParams {
  groups: WellGroup[];
  wells: Well[];
  scenarios: Scenario[];
  activeScenarioId: string;
  sensX: SensitivityVariable;
  sensY: SensitivityVariable;
}

const FLOW_MONTHS = 120;

function getSteps(v: SensitivityVariable): number[] {
  switch (v) {
    case 'OIL_PRICE': return [50, 60, 70, 80, 90];
    case 'CAPEX_SCALAR': return [0.8, 0.9, 1.0, 1.1, 1.2];
    case 'EUR_SCALAR': return [0.8, 0.9, 1.0, 1.1, 1.2];
    case 'RIG_COUNT': return [1, 2, 3, 4, 6];
    default: return [1, 2, 3, 4, 5];
  }
}

export function useScenarioAnalysis({
  groups,
  wells,
  scenarios,
  activeScenarioId,
  sensX,
  sensY,
}: UseScenarioAnalysisParams) {
  const scenarioResults = useMemo<ScenarioResult[]>(() => {
    return scenarios.map(scenario => {
      let scenarioNpv = 0;
      let scenarioCapex = 0;
      let scenarioEur = 0;
      let scenarioRevenue = 0;
      let scenarioOpex = 0;
      const cumulativeFlows = new Array(FLOW_MONTHS).fill(0);

      groups.forEach(group => {
        const groupWells = wells.filter(w => group.wellIds.has(w.id));
        const { flow, metrics } = calculateEconomics(
          groupWells,
          group.typeCurve,
          group.capex,
          scenario.pricing,
          group.opex,
          group.ownership,
          { capex: scenario.capexScalar, production: scenario.productionScalar },
          scenario.schedule,
        );
        scenarioNpv += metrics.npv10;
        scenarioCapex += metrics.totalCapex;
        scenarioEur += metrics.eur;
        flow.forEach((f, i) => { if (i < FLOW_MONTHS) cumulativeFlows[i] += f.netCashFlow; });
        flow.forEach((f) => { scenarioRevenue += f.revenue; scenarioOpex += f.opex; });
      });

      let runningCum = 0;
      return {
        scenario,
        metrics: {
          npv10: scenarioNpv,
          totalCapex: scenarioCapex,
          eur: scenarioEur,
          roi: scenarioCapex > 0 ? (scenarioRevenue - scenarioOpex) / scenarioCapex : 0,
        },
        flow: cumulativeFlows.map(cf => { runningCum += cf; return runningCum; }),
      };
    }).sort((a, b) => b.metrics.npv10 - a.metrics.npv10);
  }, [groups, wells, scenarios]);

  const cfChartData = useMemo<ChartDataPoint[]>(() => {
    const data: ChartDataPoint[] = [];
    for (let i = 0; i < FLOW_MONTHS; i++) {
      const pt: ChartDataPoint = { month: i + 1 };
      scenarioResults.forEach(res => { pt[res.scenario.id] = res.flow[i]; });
      data.push(pt);
    }
    return data;
  }, [scenarioResults]);

  const sensitivityData = useMemo<SensitivityMatrixResult[][]>(() => {
    const base = scenarios.find(s => s.id === activeScenarioId)
      || scenarios.find(s => s.isBaseCase)
      || scenarios[0];
    const basePricing = base?.pricing || DEFAULT_COMMODITY_PRICING;
    return generateSensitivityMatrix(groups, wells, basePricing, sensX, getSteps(sensX), sensY, getSteps(sensY).reverse());
  }, [activeScenarioId, groups, scenarios, wells, sensX, sensY]);

  return { scenarioResults, cfChartData, sensitivityData };
}
