import { useMemo } from 'react';
import type { WellGroup, Well } from '../../types';
import type { Scenario } from '../../types';
import { calculateEconomics } from '../../utils/economics';

export interface ScenarioResultMetrics {
  npv10: number;
  totalCapex: number;
  eur: number;
  roi: number;
}

export interface ScenarioResult {
  scenario: Scenario;
  metrics: ScenarioResultMetrics;
  /** Running cumulative net cash flow, one entry per month (120 months). */
  flow: number[];
}

export interface ScenarioChartDatum {
  month: number;
  [scenarioId: string]: number;
}

export interface UseScenarioResults {
  /** Per-scenario rolled-up economics, sorted by NPV10 descending. */
  scenarioResults: ScenarioResult[];
  /** Recharts-ready series: one row per month, one key per scenario id. */
  cfChartData: ScenarioChartDatum[];
}

/**
 * Computes per-scenario portfolio economics (rolling each well group through
 * {@link calculateEconomics}) and the cumulative-cash-flow chart series consumed
 * by the portfolio overlay chart.
 *
 * Extracted verbatim from ScenarioDashboard to keep numbers byte-identical.
 */
export function useScenarioResults(
  groups: WellGroup[],
  wells: Well[],
  scenarios: Scenario[],
): UseScenarioResults {
  const scenarioResults = useMemo<ScenarioResult[]>(() => {
    return scenarios
      .map(scenario => {
        let scenarioNpv = 0;
        let scenarioCapex = 0;
        let scenarioEur = 0;
        let scenarioRevenue = 0;
        let scenarioOpex = 0;
        const cumulativeFlows = new Array(120).fill(0);

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
          flow.forEach((f, i) => {
            if (i < 120) cumulativeFlows[i] += f.netCashFlow;
          });
          flow.forEach(f => {
            scenarioRevenue += f.revenue;
            scenarioOpex += f.opex;
          });
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
          flow: cumulativeFlows.map(cf => {
            runningCum += cf;
            return runningCum;
          }),
        };
      })
      .sort((a, b) => b.metrics.npv10 - a.metrics.npv10);
  }, [groups, wells, scenarios]);

  const cfChartData = useMemo<ScenarioChartDatum[]>(() => {
    const data: ScenarioChartDatum[] = [];
    for (let i = 0; i < 120; i++) {
      const pt = { month: i + 1 } as ScenarioChartDatum;
      scenarioResults.forEach(res => {
        pt[res.scenario.id] = res.flow[i];
      });
      data.push(pt);
    }
    return data;
  }, [scenarioResults]);

  return { scenarioResults, cfChartData };
}
