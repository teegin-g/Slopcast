import { describe, expect, it } from 'vitest';
import { FIXTURES } from '../data/fixtures';
import { runSchedule } from './scheduler';

describe('fixture schedules', () => {
  it('builds the base auto fixture with year summaries and rig timeline output', () => {
    const result = runSchedule(FIXTURES[0].request);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.annualSummaries).toHaveLength(FIXTURES[0].request.scenario.years);
    expect(result.events[0].rigId).toMatch(/^Rig /);
  });

  it('limits the budget constrained fixture by annual capital instead of slots', () => {
    const result = runSchedule(FIXTURES[1].request);
    expect(result.annualSummaries[0].capex).toBeLessThanOrEqual(12_000_000);
    expect(result.annualSummaries[2].capex).toBeLessThanOrEqual(8_000_000);
    expect(result.remainingInventory.some((row) => row.remainingCount > 0)).toBe(true);
  });

  it('honors forced and manual allocations in the hybrid fixture', () => {
    const result = runSchedule(FIXTURES[2].request);
    expect(result.events.filter((event) => event.source === 'FORCED')).toHaveLength(1);
    expect(result.events.filter((event) => event.source === 'MANUAL_RIG')).toHaveLength(1);
    expect(result.events.some((event) => event.source === 'AUTO')).toBe(true);
  });
});
