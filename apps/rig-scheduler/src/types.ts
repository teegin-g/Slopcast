export type SchedulerMode = 'AUTO' | 'MANUAL_YEAR' | 'MANUAL_RIG' | 'HYBRID';
export type CapacityMode = 'RATE' | 'CYCLE_DAYS';
export type ScheduleEventSource = 'AUTO' | 'MANUAL_YEAR' | 'MANUAL_RIG' | 'FORCED';

export interface InventoryBucket {
  id: string;
  name: string;
  inventoryCount: number;
  npvPerWell: number;
  capexPerWell: number;
  spudToOnlineDays: number;
  color: string;
  notes?: string;
}

export interface ScheduleScenario {
  years: number;
  annualRigCount: number[];
  annualCapexBudget: number[];
  capacityMode: CapacityMode;
  wellsPerRigPerYear?: number;
  drillCycleDays?: number;
  rigStartDate: string;
  discountRate?: number;
  applyRigConstraint?: boolean;
  applyCapexConstraint?: boolean;
}

export interface ManualYearAllocation {
  yearIndex: number;
  bucketId: string;
  count: number;
}

export interface ManualRigAllocation {
  rigId: string;
  yearIndex: number;
  bucketId: string;
  count: number;
}

export interface ForcedAllocation {
  rigId: string;
  yearIndex: number;
  bucketId: string;
  count: number;
  spudDate?: string;
}

export interface ManualOverrideSet {
  annualBucketTargets: ManualYearAllocation[];
  perRigTargets: ManualRigAllocation[];
  forcedAllocations: ForcedAllocation[];
  autoFillRemaining: boolean;
}

export interface ScheduleRunRequest {
  mode: SchedulerMode;
  inventory: InventoryBucket[];
  scenario: ScheduleScenario;
  manualOverrides: ManualOverrideSet;
}

export interface RigSlot {
  id: string;
  rigId: string;
  yearIndex: number;
  slotIndex: number;
  spudDate: string;
}

export interface ScheduleEvent {
  id: string;
  rigId: string;
  yearIndex: number;
  slotIndex: number;
  bucketId: string;
  bucketName: string;
  spudDate: string;
  onlineDate: string;
  capex: number;
  discountedNpv: number;
  source: ScheduleEventSource;
  locked: boolean;
  color: string;
}

export interface RemainingInventory {
  bucketId: string;
  bucketName: string;
  remainingCount: number;
  unscheduledCapex: number;
  unscheduledNpv: number;
}

export interface AnnualSummary {
  yearIndex: number;
  yearLabel: string;
  rigCount: number;
  slotCapacity: number;
  scheduledWells: number;
  onlineWells: number;
  capex: number;
  discountedNpv: number;
  budget: number | null;
  budgetRemaining: number | null;
  unusedSlots: number;
}

export interface ScheduleRunResult {
  events: ScheduleEvent[];
  annualSummaries: AnnualSummary[];
  remainingInventory: RemainingInventory[];
  warnings: string[];
  rigSlots: RigSlot[];
  totalDiscountedNpv: number;
  totalCapex: number;
}

export interface WorkspaceState {
  fixtureId: string;
  request: ScheduleRunRequest;
}
