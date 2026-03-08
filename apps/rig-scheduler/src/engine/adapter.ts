import type { InventoryBucket, ScheduleScenario } from '../types';

export interface SlopcastAdapterBucketInput {
  id: string;
  name: string;
  inventoryCount: number;
  npvPerWell: number;
  capexPerWell: number;
  spudToOnlineDays?: number;
  color?: string;
}

export interface SlopcastAdapterScenarioInput {
  annualRigCount?: number[];
  annualCapexBudget?: number[];
  rigStartDate?: string;
  years?: number;
}

export const mapSlopcastBucketsToInventory = (
  buckets: SlopcastAdapterBucketInput[],
): InventoryBucket[] =>
  buckets.map((bucket, index) => ({
    id: bucket.id,
    name: bucket.name,
    inventoryCount: Math.max(0, Math.round(bucket.inventoryCount)),
    npvPerWell: bucket.npvPerWell,
    capexPerWell: bucket.capexPerWell,
    spudToOnlineDays: bucket.spudToOnlineDays ?? 120,
    color: bucket.color ?? ['#6ee7b7', '#93c5fd', '#f9a8d4', '#fdba74'][index % 4],
  }));

export const mapSlopcastScenarioToPrototype = (
  input: SlopcastAdapterScenarioInput,
): ScheduleScenario => ({
  years: input.years ?? Math.max(input.annualRigCount?.length ?? 0, input.annualCapexBudget?.length ?? 0, 5),
  annualRigCount: input.annualRigCount ?? [2, 2, 2, 2, 2],
  annualCapexBudget: input.annualCapexBudget ?? [45_000_000, 45_000_000, 45_000_000, 45_000_000, 45_000_000],
  capacityMode: 'RATE',
  wellsPerRigPerYear: 6,
  rigStartDate: input.rigStartDate ?? '2026-01-01',
  discountRate: 0.1,
  applyRigConstraint: true,
  applyCapexConstraint: true,
});
