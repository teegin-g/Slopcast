import { describe, expect, it } from 'vitest';
import { buildRigSlots, createEmptyManualOverrides, runSchedule } from './scheduler';
import type { ScheduleRunRequest } from '../types';

const makeRequest = (): ScheduleRunRequest => ({
  mode: 'AUTO',
  scenario: {
    years: 3,
    annualRigCount: [2, 2, 2],
    annualCapexBudget: [99_000_000, 99_000_000, 99_000_000],
    capacityMode: 'RATE',
    wellsPerRigPerYear: 4,
    rigStartDate: '2026-01-01',
    discountRate: 0.1,
    applyRigConstraint: true,
    applyCapexConstraint: true,
  },
  inventory: [
    {
      id: 'a',
      name: 'A',
      inventoryCount: 10,
      npvPerWell: 8_000_000,
      capexPerWell: 4_000_000,
      spudToOnlineDays: 120,
      color: '#60a5fa',
    },
    {
      id: 'b',
      name: 'B',
      inventoryCount: 10,
      npvPerWell: 5_000_000,
      capexPerWell: 3_000_000,
      spudToOnlineDays: 140,
      color: '#34d399',
    },
  ],
  manualOverrides: createEmptyManualOverrides(),
});

describe('buildRigSlots', () => {
  it('builds rate-based slot capacity from wells per rig per year', () => {
    const request = makeRequest();
    const slots = buildRigSlots(request);
    expect(slots).toHaveLength(24);
    expect(slots.filter((slot) => slot.yearIndex === 0)).toHaveLength(8);
  });

  it('builds cycle-day capacity from drill cycle timing', () => {
    const request = makeRequest();
    request.scenario.capacityMode = 'CYCLE_DAYS';
    request.scenario.drillCycleDays = 90;
    const slots = buildRigSlots(request);
    expect(slots).toHaveLength(24);
    expect(slots.find((slot) => slot.rigId === 'Rig 1' && slot.slotIndex === 1)?.spudDate).toBe('2026-04-01');
  });
});

describe('runSchedule', () => {
  it('enforces capex budgets when rig capacity is unconstrained', () => {
    const request = makeRequest();
    request.scenario.applyRigConstraint = false;
    request.scenario.annualCapexBudget = [8_000_000, 4_000_000, 4_000_000];
    request.inventory = [
      {
        id: 'premium',
        name: 'Premium',
        inventoryCount: 3,
        npvPerWell: 9_000_000,
        capexPerWell: 4_000_000,
        spudToOnlineDays: 90,
        color: '#38bdf8',
      },
    ];
    const result = runSchedule(request);
    expect(result.annualSummaries[0].scheduledWells).toBe(2);
    expect(result.annualSummaries[1].scheduledWells).toBe(1);
    expect(result.totalCapex).toBe(12_000_000);
  });

  it('respects manual year and rig allocations before hybrid auto-fill', () => {
    const request = makeRequest();
    request.mode = 'HYBRID';
    request.scenario.annualCapexBudget = [14_000_000, 14_000_000, 14_000_000];
    request.manualOverrides = {
      annualBucketTargets: [{ yearIndex: 0, bucketId: 'b', count: 1 }],
      perRigTargets: [{ rigId: 'Rig 1', yearIndex: 0, bucketId: 'a', count: 1 }],
      forcedAllocations: [],
      autoFillRemaining: true,
    };
    const result = runSchedule(request);
    expect(result.events.filter((event) => event.source === 'MANUAL_YEAR')).toHaveLength(1);
    expect(result.events.filter((event) => event.source === 'MANUAL_RIG')).toHaveLength(1);
    expect(result.events.some((event) => event.source === 'AUTO')).toBe(true);
    expect(result.events[0].rigId).toBe('Rig 1');
  });

  it('keeps capex in spud year and computes online date from spud lag', () => {
    const request = makeRequest();
    request.inventory = [
      {
        id: 'single',
        name: 'Single',
        inventoryCount: 1,
        npvPerWell: 6_000_000,
        capexPerWell: 3_500_000,
        spudToOnlineDays: 150,
        color: '#f59e0b',
      },
    ];
    const result = runSchedule(request);
    expect(result.annualSummaries[0].capex).toBe(3_500_000);
    expect(result.events[0].spudDate).toBe('2026-01-01');
    expect(result.events[0].onlineDate).toBe('2026-05-31');
  });

  it('prefers higher discounted NPV inventory and leaves non-economic wells unscheduled', () => {
    const request = makeRequest();
    request.scenario.annualRigCount = [1, 0, 0];
    request.scenario.wellsPerRigPerYear = 2;
    request.inventory = [
      {
        id: 'best',
        name: 'Best',
        inventoryCount: 3,
        npvPerWell: 8_000_000,
        capexPerWell: 3_500_000,
        spudToOnlineDays: 90,
        color: '#38bdf8',
      },
      {
        id: 'negative',
        name: 'Negative',
        inventoryCount: 2,
        npvPerWell: -100_000,
        capexPerWell: 3_000_000,
        spudToOnlineDays: 110,
        color: '#fda4af',
      },
    ];
    const result = runSchedule(request);
    expect(result.events).toHaveLength(2);
    expect(result.events.every((event) => event.bucketId === 'best')).toBe(true);
    expect(result.remainingInventory.find((row) => row.bucketId === 'negative')?.remainingCount).toBe(2);
    expect(result.warnings.some((warning) => warning.includes('non-economic'))).toBe(true);
  });

  it('warns when manual allocations are infeasible', () => {
    const request = makeRequest();
    request.mode = 'MANUAL_RIG';
    request.scenario.annualRigCount = [1, 1, 1];
    request.scenario.wellsPerRigPerYear = 1;
    request.manualOverrides = {
      annualBucketTargets: [],
      perRigTargets: [{ rigId: 'Rig 1', yearIndex: 0, bucketId: 'a', count: 2 }],
      forcedAllocations: [],
      autoFillRemaining: false,
    };
    const result = runSchedule(request);
    expect(result.events).toHaveLength(0);
    expect(result.warnings[0]).toContain('slot');
  });
});
