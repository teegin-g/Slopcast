import { describe, it, expect } from 'vitest';
import { summarizeGroupWells } from './groupInspectorStats';
import type { Well } from '../../../types';

const well = (id: string, status: Well['status'], lateralLength: number): Well => ({
  id, name: id, lat: 0, lng: 0, lateralLength, status, operator: 'Op', formation: 'Wolfcamp A',
});

describe('summarizeGroupWells', () => {
  it('counts wells by status with percentages', () => {
    const s = summarizeGroupWells([
      well('a', 'PRODUCING', 10000),
      well('b', 'PRODUCING', 12000),
      well('c', 'DUC', 11000),
      well('d', 'PERMIT', 9000),
    ]);
    expect(s.total).toBe(4);
    const byStatus = Object.fromEntries(s.slices.map(x => [x.status, x]));
    expect(byStatus.PRODUCING.count).toBe(2);
    expect(byStatus.PRODUCING.pct).toBe(50);
    expect(byStatus.DUC.count).toBe(1);
    expect(byStatus.DUC.pct).toBe(25);
    expect(byStatus.PERMIT.pct).toBe(25);
  });

  it('averages lateral length across the group', () => {
    const s = summarizeGroupWells([well('a', 'PRODUCING', 10000), well('b', 'DUC', 12000)]);
    expect(s.avgLateralFt).toBe(11000);
  });

  it('handles an empty group without NaN', () => {
    const s = summarizeGroupWells([]);
    expect(s.total).toBe(0);
    expect(s.avgLateralFt).toBe(0);
    expect(s.slices.every(x => x.pct === 0 && x.count === 0)).toBe(true);
  });

  it('always returns the three statuses in a stable order', () => {
    const s = summarizeGroupWells([well('a', 'PERMIT', 9000)]);
    expect(s.slices.map(x => x.status)).toEqual(['PRODUCING', 'DUC', 'PERMIT']);
  });
});
