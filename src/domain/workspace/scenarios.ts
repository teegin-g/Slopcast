import { DEFAULT_COMMODITY_PRICING } from '../../constants';
import type { Scenario, ScheduleParams } from '../../types';

export const DEFAULT_SCHEDULE: ScheduleParams = {
  annualRigs: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  drillDurationDays: 18,
  stimDurationDays: 12,
  rigStartDate: new Date().toISOString().split('T')[0],
};

export const createDefaultScenarios = (): Scenario[] => [
  {
    id: 's-base',
    name: 'BASE CASE',
    color: '#9ED3F0',
    isBaseCase: true,
    pricing: { ...DEFAULT_COMMODITY_PRICING },
    schedule: { ...DEFAULT_SCHEDULE },
    capexScalar: 1.0,
    productionScalar: 1.0,
  },
  {
    id: 's-upside',
    name: 'BULL SCENARIO',
    color: '#E566DA',
    isBaseCase: false,
    pricing: { ...DEFAULT_COMMODITY_PRICING, oilPrice: 85 },
    schedule: { ...DEFAULT_SCHEDULE },
    capexScalar: 1.0,
    productionScalar: 1.0,
  },
  {
    id: 's-fast',
    name: 'RAMP PROGRAM',
    color: '#2DFFB1',
    isBaseCase: false,
    pricing: { ...DEFAULT_COMMODITY_PRICING },
    schedule: { ...DEFAULT_SCHEDULE, annualRigs: [1, 2, 3, 4, 4, 4, 4, 4, 4, 4] },
    capexScalar: 1.0,
    productionScalar: 1.0,
  },
];
