import { useEffect, useRef, useState } from 'react';
import { CommodityPricingAssumptions, DealMetrics, Scenario, Well, WellGroup } from '../types';
import { cachedCalculateEconomics } from '../utils/economics';
import { DEFAULT_COMMODITY_PRICING, MOCK_WELLS } from '../constants';

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

export type TopDriver = {
  id: DriverFamilyId;
  label: string;
  dominantDelta: number;
  upShock?: { label: string; deltaNpv: number };
  downShock?: { label: string; deltaNpv: number };
  bestDelta: number;
  worstDelta: number;
  magnitude: number;
};

export type ShockResult = DriverShock & {
  npv: number;
  deltaNpv: number;
};

export type KeyDriverInsights = {
  topDrivers: TopDriver[];
  biggestPositive: ShockResult | null;
  biggestNegative: ShockResult | null;
};

const EMPTY_INSIGHTS: KeyDriverInsights = {
  topDrivers: [],
  biggestPositive: null,
  biggestNegative: null,
};

const DEBOUNCE_MS = 300;

export const useDerivedMetrics = (
  processedGroups: WellGroup[],
  scenarios: Scenario[],
  aggregateWellCount: number,
) => {
  const [keyDriverInsights, setKeyDriverInsights] = useState<KeyDriverInsights>(EMPTY_INSIGHTS);
  const [breakevenOilPrice, setBreakevenOilPrice] = useState<number | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  // Monotonically increasing token — increments after each successful compute.
  // Animation components key off this to re-trigger reveal animations on every run.
  const [runCompleteToken, setRunCompleteToken] = useState(0);

  // Use refs to track latest inputs for debounce
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setIsComputing(true);

    timerRef.current = setTimeout(() => {
      // --- Compute keyDriverInsights ---
      const baseScenario = scenarios.find(s => s.isBaseCase) || scenarios[0];
      const basePricing = baseScenario?.pricing || DEFAULT_COMMODITY_PRICING;

      const evaluateNpv = (modifier: DriverModifier = {}) => {
        return processedGroups.reduce((sum, group) => {
          const groupWells = MOCK_WELLS.filter(w => group.wellIds.has(w.id));
          const pricing = {
            ...basePricing,
            oilPrice: Math.max(0, basePricing.oilPrice + (modifier.oilPriceDelta ?? 0)),
          };
          const capex = {
            ...group.capex,
            rigCount: Math.max(1, Math.round(group.capex.rigCount + (modifier.rigDelta ?? 0))),
          };
          const { metrics } = cachedCalculateEconomics(
            groupWells,
            group.typeCurve,
            capex,
            pricing,
            group.opex,
            group.ownership,
            {
              capex: modifier.capexScalar ?? 1,
              production: modifier.productionScalar ?? 1,
            },
          );
          return sum + metrics.npv10;
        }, 0);
      };

      const baseNpv = evaluateNpv();
      const shocks: ShockResult[] = DRIVER_SHOCKS.map(shock => {
        const npv = evaluateNpv(shock.modifiers);
        return { ...shock, npv, deltaNpv: npv - baseNpv };
      });

      const findShock = (id: string) => shocks.find(s => s.id === id);
      const topDrivers: TopDriver[] = DRIVER_FAMILIES
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

      setKeyDriverInsights({ topDrivers, biggestPositive, biggestNegative });

      // --- Compute breakevenOilPrice ---
      if (aggregateWellCount === 0) {
        setBreakevenOilPrice(null);
      } else {
        const evaluateAtOil = (oilPrice: number) => {
          return processedGroups.reduce((sum, group) => {
            const groupWells = MOCK_WELLS.filter(w => group.wellIds.has(w.id));
            const { metrics } = cachedCalculateEconomics(
              groupWells, group.typeCurve, group.capex,
              { ...basePricing, oilPrice }, group.opex, group.ownership,
            );
            return sum + metrics.npv10;
          }, 0);
        };

        let low = 30;
        let high = 140;
        let lowNpv = evaluateAtOil(low);
        let highNpv = evaluateAtOil(high);

        let result: number | null = null;

        if (Math.abs(lowNpv) < 1e-2) {
          result = low;
        } else if (Math.abs(highNpv) < 1e-2) {
          result = high;
        } else if ((lowNpv < 0 && highNpv < 0) || (lowNpv > 0 && highNpv > 0)) {
          result = null;
        } else {
          for (let i = 0; i < 28; i++) {
            const mid = (low + high) / 2;
            const midNpv = evaluateAtOil(mid);
            if (Math.abs(midNpv) < 1e-2) {
              result = Number(mid.toFixed(1));
              break;
            }
            if ((lowNpv < 0 && midNpv > 0) || (lowNpv > 0 && midNpv < 0)) {
              high = mid;
              highNpv = midNpv;
            } else {
              low = mid;
              lowNpv = midNpv;
            }
          }
          if (result === null) {
            result = Number(((low + high) / 2).toFixed(1));
          }
        }

        setBreakevenOilPrice(result);
      }

      setIsComputing(false);
      setRunCompleteToken(prev => prev + 1);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [processedGroups, scenarios, aggregateWellCount]);

  return { keyDriverInsights, breakevenOilPrice, isComputing, runCompleteToken };
};
