import { describe, expect, it } from 'vitest';
import {
  buildMockDevelopmentInventory,
  getUndevelopedReadiness,
  summarizeDevelopmentInventory,
} from './undevelopedInventory';

describe('undeveloped inventory adapter', () => {
  it('builds deterministic DSU and planned well inventory', () => {
    const inventory = buildMockDevelopmentInventory();

    expect(inventory.dsus.length).toBe(9);
    expect(inventory.plannedWells.length).toBeGreaterThan(9);
    expect(inventory.groups.length).toBe(3);
    expect(inventory.groups[0].plannedWellIds.length).toBeGreaterThan(0);
  });

  it('summarizes readiness for structured development inventory', () => {
    const { dsus, plannedWells, groups } = buildMockDevelopmentInventory();
    const summary = summarizeDevelopmentInventory(groups, dsus, plannedWells);
    const readiness = getUndevelopedReadiness(groups, summary);

    expect(summary.dsuCount).toBe(9);
    expect(summary.plannedWellCount).toBe(plannedWells.length);
    expect(summary.totalCapex).toBeGreaterThan(0);
    expect(summary.riskedNpv10).toBeLessThan(summary.unriskedNpv10);
    expect(readiness.inventoryCreated).toBe(true);
    expect(readiness.spacingAssigned).toBe(true);
    expect(readiness.capexAssigned).toBe(true);
    expect(readiness.economicsCalculated).toBe(true);
  });
});
