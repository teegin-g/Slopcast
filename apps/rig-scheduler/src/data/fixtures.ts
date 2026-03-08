import { createEmptyManualOverrides } from '../engine/scheduler';
import type { ScheduleRunRequest } from '../types';

export interface SchedulerFixture {
  id: string;
  name: string;
  description: string;
  request: ScheduleRunRequest;
}

export const FIXTURES: SchedulerFixture[] = [
  {
    id: 'base-auto',
    name: 'Base Auto',
    description: 'Balanced rig and budget constraints with auto-allocation maximizing discounted value.',
    request: {
      mode: 'AUTO',
      scenario: {
        years: 5,
        annualRigCount: [2, 2, 3, 3, 3],
        annualCapexBudget: [34_000_000, 34_000_000, 46_000_000, 46_000_000, 46_000_000],
        capacityMode: 'RATE',
        wellsPerRigPerYear: 4,
        rigStartDate: '2026-01-01',
        discountRate: 0.1,
        applyRigConstraint: true,
        applyCapexConstraint: true,
      },
      inventory: [
        {
          id: 'wolfcamp-a-premium',
          name: 'Wolfcamp A Premium',
          inventoryCount: 8,
          npvPerWell: 11_500_000,
          capexPerWell: 7_200_000,
          spudToOnlineDays: 120,
          color: '#7dd3fc',
          notes: 'Best rock, highest EUR and payout speed.',
        },
        {
          id: 'wolfcamp-b-core',
          name: 'Wolfcamp B Core',
          inventoryCount: 10,
          npvPerWell: 8_800_000,
          capexPerWell: 6_400_000,
          spudToOnlineDays: 135,
          color: '#86efac',
          notes: 'Core inventory with lower CAPEX intensity.',
        },
        {
          id: 'bone-spring-extension',
          name: 'Bone Spring Extension',
          inventoryCount: 7,
          npvPerWell: 4_900_000,
          capexPerWell: 5_600_000,
          spudToOnlineDays: 150,
          color: '#f9a8d4',
          notes: 'Margin-positive but weaker than core.',
        },
      ],
      manualOverrides: createEmptyManualOverrides(),
    },
  },
  {
    id: 'budget-constrained',
    name: 'Budget Constrained',
    description: 'Budget-only planning with unconstrained rig capacity to test capital gating.',
    request: {
      mode: 'AUTO',
      scenario: {
        years: 4,
        annualRigCount: [0, 0, 0, 0],
        annualCapexBudget: [12_000_000, 8_000_000, 4_000_000, 0],
        capacityMode: 'RATE',
        wellsPerRigPerYear: 8,
        rigStartDate: '2026-01-01',
        discountRate: 0.1,
        applyRigConstraint: false,
        applyCapexConstraint: true,
      },
      inventory: [
        {
          id: 'premium',
          name: 'Premium Tier',
          inventoryCount: 3,
          npvPerWell: 7_500_000,
          capexPerWell: 4_000_000,
          spudToOnlineDays: 110,
          color: '#60a5fa',
        },
        {
          id: 'standard',
          name: 'Standard Tier',
          inventoryCount: 4,
          npvPerWell: 5_200_000,
          capexPerWell: 3_000_000,
          spudToOnlineDays: 135,
          color: '#34d399',
        },
      ],
      manualOverrides: createEmptyManualOverrides(),
    },
  },
  {
    id: 'hybrid-manual',
    name: 'Hybrid Manual',
    description: 'Locked manual allocations with optimizer filling the remaining fleet and budget.',
    request: {
      mode: 'HYBRID',
      scenario: {
        years: 3,
        annualRigCount: [2, 2, 2],
        annualCapexBudget: [18_000_000, 18_000_000, 18_000_000],
        capacityMode: 'CYCLE_DAYS',
        drillCycleDays: 90,
        rigStartDate: '2026-01-01',
        discountRate: 0.1,
        applyRigConstraint: true,
        applyCapexConstraint: true,
      },
      inventory: [
        {
          id: 'core-oil',
          name: 'Core Oil',
          inventoryCount: 5,
          npvPerWell: 7_000_000,
          capexPerWell: 4_500_000,
          spudToOnlineDays: 100,
          color: '#38bdf8',
        },
        {
          id: 'combo',
          name: 'Combo Bench',
          inventoryCount: 6,
          npvPerWell: 5_000_000,
          capexPerWell: 3_800_000,
          spudToOnlineDays: 130,
          color: '#fbbf24',
        },
        {
          id: 'science-fair',
          name: 'Science Fair',
          inventoryCount: 2,
          npvPerWell: -500_000,
          capexPerWell: 3_500_000,
          spudToOnlineDays: 150,
          color: '#fda4af',
        },
      ],
      manualOverrides: {
        annualBucketTargets: [{ yearIndex: 0, bucketId: 'combo', count: 1 }],
        perRigTargets: [{ rigId: 'Rig 1', yearIndex: 0, bucketId: 'core-oil', count: 1 }],
        forcedAllocations: [{ rigId: 'Rig 2', yearIndex: 0, bucketId: 'combo', count: 1 }],
        autoFillRemaining: true,
      },
    },
  },
];

export const defaultWorkspaceState = () => ({
  fixtureId: FIXTURES[0].id,
  request: structuredClone(FIXTURES[0].request),
});
