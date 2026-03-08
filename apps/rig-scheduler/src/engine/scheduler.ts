import type {
  AnnualSummary,
  ForcedAllocation,
  InventoryBucket,
  ManualOverrideSet,
  ManualRigAllocation,
  ManualYearAllocation,
  RigSlot,
  ScheduleEvent,
  ScheduleEventSource,
  ScheduleRunRequest,
  ScheduleRunResult,
  ScheduleScenario,
} from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BUDGET_QUANTUM = 50_000;

const clampInt = (value: number) => Math.max(0, Math.round(value || 0));

const parseIsoDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);
const formatIsoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (isoDate: string, days: number) => formatIsoDate(new Date(parseIsoDate(isoDate).getTime() + days * MS_PER_DAY));
const diffDays = (startIso: string, endIso: string) =>
  Math.round((parseIsoDate(endIso).getTime() - parseIsoDate(startIso).getTime()) / MS_PER_DAY);
const daysFromStart = (scenario: ScheduleScenario, isoDate: string) => diffDays(scenario.rigStartDate, isoDate);
const yearStartDate = (scenario: ScheduleScenario, yearIndex: number) => addDays(scenario.rigStartDate, yearIndex * 365);
const yearEndDate = (scenario: ScheduleScenario, yearIndex: number) => addDays(scenario.rigStartDate, yearIndex * 365 + 364);

const getBudget = (scenario: ScheduleScenario, yearIndex: number) => {
  if (!scenario.applyCapexConstraint) return Number.POSITIVE_INFINITY;
  return Math.max(0, scenario.annualCapexBudget[yearIndex] ?? 0);
};

const getRigCount = (scenario: ScheduleScenario, yearIndex: number) => {
  if (!scenario.applyRigConstraint) return 1;
  return clampInt(scenario.annualRigCount[yearIndex] ?? 0);
};

const getSlotsPerRig = (scenario: ScheduleScenario) => {
  if (scenario.capacityMode === 'RATE') {
    return clampInt(scenario.wellsPerRigPerYear ?? 0);
  }

  const cycleDays = scenario.drillCycleDays ?? 0;
  if (cycleDays <= 0) return 0;
  return Math.max(0, Math.floor(365 / cycleDays));
};

const getRigIds = (scenario: ScheduleScenario) => {
  if (!scenario.applyRigConstraint) return ['Capital Pool'];

  const maxRigCount = Math.max(...Array.from({ length: scenario.years }, (_, yearIndex) => getRigCount(scenario, yearIndex)), 0);
  return Array.from({ length: maxRigCount }, (_, index) => `Rig ${index + 1}`);
};

export const buildRigSlots = (request: ScheduleRunRequest): RigSlot[] => {
  const { scenario, inventory, manualOverrides } = request;
  const rigIds = getRigIds(scenario);
  const slotsPerRig = getSlotsPerRig(scenario);
  const totalInventory = inventory.reduce((sum, bucket) => sum + clampInt(bucket.inventoryCount), 0);
  const manualDemand = [
    ...manualOverrides.annualBucketTargets,
    ...manualOverrides.perRigTargets,
    ...manualOverrides.forcedAllocations,
  ].reduce((sum, item) => sum + clampInt(item.count), 0);
  const unconstrainedSlotsPerYear = Math.max(totalInventory + manualDemand, 1);
  const slots: RigSlot[] = [];

  for (let yearIndex = 0; yearIndex < scenario.years; yearIndex += 1) {
    const activeRigIds = scenario.applyRigConstraint ? rigIds.slice(0, getRigCount(scenario, yearIndex)) : ['Capital Pool'];
    const perRigSlots = scenario.applyRigConstraint ? slotsPerRig : unconstrainedSlotsPerYear;

    for (const rigId of activeRigIds) {
      for (let slotIndex = 0; slotIndex < perRigSlots; slotIndex += 1) {
        const startDate = yearStartDate(scenario, yearIndex);
        const spudOffsetDays = scenario.applyRigConstraint
          ? scenario.capacityMode === 'RATE'
            ? Math.round((slotIndex * 365) / Math.max(perRigSlots, 1))
            : Math.round(slotIndex * (scenario.drillCycleDays ?? 0))
          : slotIndex * 2;

        slots.push({
          id: `${rigId}-${yearIndex + 1}-${slotIndex + 1}`,
          rigId,
          yearIndex,
          slotIndex,
          spudDate: addDays(startDate, spudOffsetDays),
        });
      }
    }
  }

  return slots.sort((left, right) => left.spudDate.localeCompare(right.spudDate) || left.rigId.localeCompare(right.rigId));
};

const discountedNpvForEvent = (scenario: ScheduleScenario, bucket: InventoryBucket, spudDate: string) => {
  const onlineDate = addDays(spudDate, bucket.spudToOnlineDays);
  const yearsFromStart = daysFromStart(scenario, onlineDate) / 365;
  const discountRate = scenario.discountRate ?? 0.1;
  return bucket.npvPerWell / Math.pow(1 + discountRate, yearsFromStart);
};

const applyAllocation = (
  count: number,
  bucket: InventoryBucket,
  slots: RigSlot[],
  scenario: ScheduleScenario,
  source: ScheduleEventSource,
  locked: boolean,
  events: ScheduleEvent[],
  budgetRemaining: number[],
  remainingInventory: Map<string, number>,
  warnings: string[],
  context: string,
  explicitSpudDate?: string,
) => {
  const requiredCount = clampInt(count);
  const availableInventory = remainingInventory.get(bucket.id) ?? 0;

  if (requiredCount <= 0) return;
  if (availableInventory < requiredCount) {
    warnings.push(`${context} skipped: requested ${requiredCount} wells from ${bucket.name}, but only ${availableInventory} remain.`);
    return;
  }

  if (slots.length < requiredCount) {
    warnings.push(`${context} skipped: requested ${requiredCount} wells from ${bucket.name}, but only ${slots.length} slot(s) are available.`);
    return;
  }

  const affectedYears = new Set(slots.slice(0, requiredCount).map((slot) => slot.yearIndex));
  for (const yearIndex of affectedYears) {
    const yearSlotCount = slots.slice(0, requiredCount).filter((slot) => slot.yearIndex === yearIndex).length;
    const yearCost = yearSlotCount * bucket.capexPerWell;
    if (budgetRemaining[yearIndex] < yearCost) {
      warnings.push(`${context} skipped: ${bucket.name} exceeds year ${yearIndex + 1} budget by $${(yearCost - budgetRemaining[yearIndex]).toLocaleString()}.`);
      return;
    }
  }

  const selectedSlots = slots.splice(0, requiredCount);
  remainingInventory.set(bucket.id, availableInventory - requiredCount);

  for (const slot of selectedSlots) {
    budgetRemaining[slot.yearIndex] -= bucket.capexPerWell;
    const spudDate = explicitSpudDate ?? slot.spudDate;
    events.push({
      id: `${source}-${bucket.id}-${slot.id}-${events.length + 1}`,
      rigId: slot.rigId,
      yearIndex: slot.yearIndex,
      slotIndex: slot.slotIndex,
      bucketId: bucket.id,
      bucketName: bucket.name,
      spudDate,
      onlineDate: addDays(spudDate, bucket.spudToOnlineDays),
      capex: bucket.capexPerWell,
      discountedNpv: discountedNpvForEvent(scenario, bucket, spudDate),
      source,
      locked,
      color: bucket.color,
    });
  }
};

const expandCounts = (items: Array<{ bucketId: string; count: number }>) => {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.bucketId, (counts.get(item.bucketId) ?? 0) + clampInt(item.count));
  }
  return counts;
};

const chooseAutoAllocation = (
  scenario: ScheduleScenario,
  buckets: InventoryBucket[],
  remainingInventory: Map<string, number>,
  yearIndex: number,
  slotCount: number,
  budgetRemaining: number,
  warnings: string[],
) => {
  const availableItems = buckets.flatMap((bucket) => {
    const remaining = remainingInventory.get(bucket.id) ?? 0;
    if (remaining <= 0) return [];
    const discountedNpv = discountedNpvForEvent(scenario, bucket, yearStartDate(scenario, yearIndex));
    if (discountedNpv <= 0) return [];
    const count = Math.min(remaining, slotCount);
    return Array.from({ length: count }, () => ({
      bucketId: bucket.id,
      capex: bucket.capexPerWell,
      capexSteps: Math.max(1, Math.round(bucket.capexPerWell / BUDGET_QUANTUM)),
      value: discountedNpv,
    }));
  });

  if (availableItems.length === 0 || slotCount <= 0) return new Map<string, number>();

  if (!Number.isFinite(budgetRemaining)) {
    const topItems = availableItems.sort((left, right) => right.value - left.value).slice(0, slotCount);
    return expandCounts(topItems.map((item) => ({ bucketId: item.bucketId, count: 1 })));
  }

  const budgetSteps = Math.max(0, Math.floor(budgetRemaining / BUDGET_QUANTUM));
  if (budgetSteps === 0) return new Map<string, number>();

  if (budgetSteps > 1200) {
    warnings.push(`Year ${yearIndex + 1} budget was approximated with a greedy selector because the dynamic program would exceed ${budgetSteps} budget steps.`);
    const selected = availableItems
      .sort((left, right) => right.value / right.capex - left.value / left.capex)
      .reduce(
        (state, item) => {
          if (state.slotCount >= slotCount || state.budget + item.capex > budgetRemaining) return state;
          state.items.push(item);
          state.slotCount += 1;
          state.budget += item.capex;
          return state;
        },
        { items: [] as typeof availableItems, slotCount: 0, budget: 0 },
      );
    return expandCounts(selected.items.map((item) => ({ bucketId: item.bucketId, count: 1 })));
  }

  type Cell = { value: number; items: number[] };
  const dp: Cell[][] = Array.from({ length: slotCount + 1 }, () =>
    Array.from({ length: budgetSteps + 1 }, () => ({ value: Number.NEGATIVE_INFINITY, items: [] })),
  );
  dp[0][0] = { value: 0, items: [] };

  availableItems.forEach((item, itemIndex) => {
    for (let usedSlots = slotCount - 1; usedSlots >= 0; usedSlots -= 1) {
      for (let usedBudget = budgetSteps - item.capexSteps; usedBudget >= 0; usedBudget -= 1) {
        const baseCell = dp[usedSlots][usedBudget];
        if (baseCell.value === Number.NEGATIVE_INFINITY) continue;
        const nextBudget = usedBudget + item.capexSteps;
        const nextValue = baseCell.value + item.value;
        if (nextValue > dp[usedSlots + 1][nextBudget].value) {
          dp[usedSlots + 1][nextBudget] = {
            value: nextValue,
            items: [...baseCell.items, itemIndex],
          };
        }
      }
    }
  });

  let bestCell: Cell = { value: Number.NEGATIVE_INFINITY, items: [] };
  for (let usedSlots = 0; usedSlots <= slotCount; usedSlots += 1) {
    for (let usedBudget = 0; usedBudget <= budgetSteps; usedBudget += 1) {
      if (dp[usedSlots][usedBudget].value > bestCell.value) {
        bestCell = dp[usedSlots][usedBudget];
      }
    }
  }

  return expandCounts(bestCell.items.map((itemIndex) => ({ bucketId: availableItems[itemIndex].bucketId, count: 1 })));
};

const getBucketOrWarn = (bucketMap: Map<string, InventoryBucket>, bucketId: string, warnings: string[], context: string) => {
  const bucket = bucketMap.get(bucketId);
  if (!bucket) warnings.push(`${context} skipped: unknown bucket "${bucketId}".`);
  return bucket;
};

const groupSlotsByYear = (slots: RigSlot[]) => {
  const byYear = new Map<number, RigSlot[]>();
  for (const slot of slots) {
    const yearSlots = byYear.get(slot.yearIndex) ?? [];
    yearSlots.push(slot);
    byYear.set(slot.yearIndex, yearSlots);
  }
  return byYear;
};

const groupSlotsByRigYear = (slots: RigSlot[]) => {
  const byRigYear = new Map<string, RigSlot[]>();
  for (const slot of slots) {
    const key = `${slot.rigId}::${slot.yearIndex}`;
    const rigSlots = byRigYear.get(key) ?? [];
    rigSlots.push(slot);
    byRigYear.set(key, rigSlots);
  }
  return byRigYear;
};

const sortSlots = (slots: RigSlot[]) => slots.sort((left, right) => left.spudDate.localeCompare(right.spudDate) || left.slotIndex - right.slotIndex);

const allocateForced = (
  allocations: ForcedAllocation[],
  bucketMap: Map<string, InventoryBucket>,
  slotsByRigYear: Map<string, RigSlot[]>,
  scenario: ScheduleScenario,
  events: ScheduleEvent[],
  budgetRemaining: number[],
  remainingInventory: Map<string, number>,
  warnings: string[],
) => {
  for (const allocation of allocations) {
    const bucket = getBucketOrWarn(bucketMap, allocation.bucketId, warnings, `Forced allocation on ${allocation.rigId} Y${allocation.yearIndex + 1}`);
    if (!bucket) continue;
    const rigSlots = slotsByRigYear.get(`${allocation.rigId}::${allocation.yearIndex}`) ?? [];
    applyAllocation(
      allocation.count,
      bucket,
      rigSlots,
      scenario,
      'FORCED',
      true,
      events,
      budgetRemaining,
      remainingInventory,
      warnings,
      `Forced allocation on ${allocation.rigId} Y${allocation.yearIndex + 1}`,
      allocation.spudDate,
    );
  }
};

const allocateManualRig = (
  allocations: ManualRigAllocation[],
  bucketMap: Map<string, InventoryBucket>,
  slotsByRigYear: Map<string, RigSlot[]>,
  scenario: ScheduleScenario,
  events: ScheduleEvent[],
  budgetRemaining: number[],
  remainingInventory: Map<string, number>,
  warnings: string[],
) => {
  for (const allocation of allocations) {
    const bucket = getBucketOrWarn(bucketMap, allocation.bucketId, warnings, `Manual rig allocation on ${allocation.rigId} Y${allocation.yearIndex + 1}`);
    if (!bucket) continue;
    const rigSlots = slotsByRigYear.get(`${allocation.rigId}::${allocation.yearIndex}`) ?? [];
    applyAllocation(
      allocation.count,
      bucket,
      rigSlots,
      scenario,
      'MANUAL_RIG',
      true,
      events,
      budgetRemaining,
      remainingInventory,
      warnings,
      `Manual rig allocation on ${allocation.rigId} Y${allocation.yearIndex + 1}`,
    );
  }
};

const allocateManualYear = (
  allocations: ManualYearAllocation[],
  bucketMap: Map<string, InventoryBucket>,
  slotsByYear: Map<number, RigSlot[]>,
  scenario: ScheduleScenario,
  events: ScheduleEvent[],
  budgetRemaining: number[],
  remainingInventory: Map<string, number>,
  warnings: string[],
) => {
  for (const allocation of allocations) {
    const bucket = getBucketOrWarn(bucketMap, allocation.bucketId, warnings, `Manual year allocation in Y${allocation.yearIndex + 1}`);
    if (!bucket) continue;
    const yearSlots = slotsByYear.get(allocation.yearIndex) ?? [];
    applyAllocation(
      allocation.count,
      bucket,
      yearSlots,
      scenario,
      'MANUAL_YEAR',
      true,
      events,
      budgetRemaining,
      remainingInventory,
      warnings,
      `Manual year allocation in Y${allocation.yearIndex + 1}`,
    );
  }
};

export const runSchedule = (request: ScheduleRunRequest): ScheduleRunResult => {
  const warnings: string[] = [];
  const scenario = {
    discountRate: 0.1,
    applyRigConstraint: true,
    applyCapexConstraint: true,
    ...request.scenario,
  };
  const inventory = request.inventory.map((bucket) => ({
    ...bucket,
    inventoryCount: clampInt(bucket.inventoryCount),
    spudToOnlineDays: clampInt(bucket.spudToOnlineDays),
  }));
  const bucketMap = new Map(inventory.map((bucket) => [bucket.id, bucket]));
  const rigSlots = buildRigSlots({ ...request, scenario, inventory });
  const allSlots = rigSlots.map((slot) => ({ ...slot }));
  const slotsByYear = groupSlotsByYear(allSlots);
  const slotsByRigYear = groupSlotsByRigYear(allSlots);
  Array.from(slotsByYear.values()).forEach(sortSlots);
  Array.from(slotsByRigYear.values()).forEach(sortSlots);

  const remainingInventory = new Map(inventory.map((bucket) => [bucket.id, bucket.inventoryCount]));
  const budgetRemaining = Array.from({ length: scenario.years }, (_, yearIndex) => getBudget(scenario, yearIndex));
  const events: ScheduleEvent[] = [];

  if (getSlotsPerRig(scenario) === 0 && scenario.applyRigConstraint) {
    warnings.push('No drilling slots were created because the selected capacity settings resolve to zero wells per rig per year.');
  }

  allocateForced(request.manualOverrides.forcedAllocations, bucketMap, slotsByRigYear, scenario, events, budgetRemaining, remainingInventory, warnings);
  allocateManualRig(request.manualOverrides.perRigTargets, bucketMap, slotsByRigYear, scenario, events, budgetRemaining, remainingInventory, warnings);
  allocateManualYear(request.manualOverrides.annualBucketTargets, bucketMap, slotsByYear, scenario, events, budgetRemaining, remainingInventory, warnings);

  const shouldAutoFill =
    request.mode === 'AUTO' || request.mode === 'HYBRID' || request.manualOverrides.autoFillRemaining;

  if (shouldAutoFill) {
    for (let yearIndex = 0; yearIndex < scenario.years; yearIndex += 1) {
      const yearSlots = slotsByYear.get(yearIndex) ?? [];
      const bucketCounts = chooseAutoAllocation(
        scenario,
        inventory,
        remainingInventory,
        yearIndex,
        yearSlots.length,
        budgetRemaining[yearIndex],
        warnings,
      );

      for (const [bucketId, count] of bucketCounts.entries()) {
        const bucket = bucketMap.get(bucketId);
        if (!bucket) continue;
        applyAllocation(
          count,
          bucket,
          yearSlots,
          scenario,
          'AUTO',
          false,
          events,
          budgetRemaining,
          remainingInventory,
          warnings,
          `Auto allocation in Y${yearIndex + 1}`,
        );
      }
    }
  }

  const annualSummaries: AnnualSummary[] = Array.from({ length: scenario.years }, (_, yearIndex) => {
    const yearEvents = events.filter((event) => event.yearIndex === yearIndex);
    const slotCapacity = rigSlots.filter((slot) => slot.yearIndex === yearIndex).length;
    const budget = scenario.applyCapexConstraint ? getBudget(scenario, yearIndex) : null;
    const rigCount = getRigCount(scenario, yearIndex);
    const startDate = yearStartDate(scenario, yearIndex);
    const endDate = yearEndDate(scenario, yearIndex);
    const onlineWells = yearEvents.filter((event) => event.onlineDate >= startDate && event.onlineDate <= endDate).length;

    return {
      yearIndex,
      yearLabel: `Y${yearIndex + 1}`,
      rigCount,
      slotCapacity,
      scheduledWells: yearEvents.length,
      onlineWells,
      capex: yearEvents.reduce((sum, event) => sum + event.capex, 0),
      discountedNpv: yearEvents.reduce((sum, event) => sum + event.discountedNpv, 0),
      budget,
      budgetRemaining: budget === null ? null : Math.max(0, budgetRemaining[yearIndex]),
      unusedSlots: Math.max(0, slotCapacity - yearEvents.length),
    };
  });

  const remainingInventoryRows = inventory.map((bucket) => {
    const remainingCount = remainingInventory.get(bucket.id) ?? 0;
    if (remainingCount > 0 && bucket.npvPerWell <= 0) {
      warnings.push(`${bucket.name} has ${remainingCount} well(s) left unscheduled because its per-well NPV is non-economic.`);
    }

    return {
      bucketId: bucket.id,
      bucketName: bucket.name,
      remainingCount,
      unscheduledCapex: remainingCount * bucket.capexPerWell,
      unscheduledNpv: remainingCount * bucket.npvPerWell,
    };
  });

  return {
    events: events.sort((left, right) => left.spudDate.localeCompare(right.spudDate) || left.rigId.localeCompare(right.rigId)),
    annualSummaries,
    remainingInventory: remainingInventoryRows,
    warnings: Array.from(new Set(warnings)),
    rigSlots,
    totalDiscountedNpv: events.reduce((sum, event) => sum + event.discountedNpv, 0),
    totalCapex: events.reduce((sum, event) => sum + event.capex, 0),
  };
};

export const createEmptyManualOverrides = (): ManualOverrideSet => ({
  annualBucketTargets: [],
  perRigTargets: [],
  forcedAllocations: [],
  autoFillRemaining: true,
});
