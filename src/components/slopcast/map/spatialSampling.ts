import type { Well } from '../../../types';

interface StableSelectionOptions {
  seed: string;
  budget: number;
  priorityIds: Set<string>;
}

export function wellboreZoomBucket(zoom: number): number {
  return Math.floor(zoom);
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function stableSelectWellsForBudget(wells: Well[], options: StableSelectionOptions): Well[] {
  const budget = Math.max(0, options.budget);
  if (budget === 0) return [];

  const priority = wells
    .filter((well) => options.priorityIds.has(well.id))
    .sort((a, b) => a.id.localeCompare(b.id));
  const remainingBudget = Math.max(0, budget - priority.length);
  const background = wells
    .flatMap((well) =>
      options.priorityIds.has(well.id)
        ? []
        : [{ well, score: stableHash(`${options.seed}|${well.id}`) }],
    )
    .sort((a, b) => a.score - b.score || a.well.id.localeCompare(b.well.id))
    .slice(0, remainingBudget)
    .map((entry) => entry.well);

  return [...priority, ...background].slice(0, budget);
}
