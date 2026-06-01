import type { CellValueChangedEvent, ColDef } from 'ag-grid-community';
import type {
  ForcedAllocation,
  InventoryBucket,
  ManualRigAllocation,
  ManualYearAllocation,
  ScheduleRunResult,
  ScheduleScenario,
} from '../types';
import {
  currencyFormatter,
  fmtCompact,
  fmtCurrency,
  toNumber,
  type AnnualOverrideRow,
  type ConstraintsGridRow,
  type ForcedOverrideRow,
  type RigOverrideRow,
} from '../shared';

type RowIndexParams = { node: { rowIndex: number | null } };

const deleteButton = (onDelete: (rowIndex: number) => void) => ({
  headerName: '',
  colId: 'actions',
  editable: false,
  sortable: false,
  filter: false,
  width: 96,
  cellRenderer: (params: RowIndexParams) => (
    <button
      type="button"
      className="grid-action-button"
      onClick={() => onDelete(params.node.rowIndex ?? -1)}
    >
      Delete
    </button>
  ),
});

export const buildInventoryColumnDefs = (
  updateInventory: (updater: (inventory: InventoryBucket[]) => InventoryBucket[]) => void,
): ColDef<InventoryBucket>[] => [
  {
    field: 'name',
    headerName: 'Bucket',
    pinned: 'left',
    minWidth: 180,
  },
  {
    field: 'inventoryCount',
    headerName: 'Inventory',
    valueParser: (params) => toNumber(params.newValue),
    cellClass: 'cell-number',
    minWidth: 120,
  },
  {
    field: 'npvPerWell',
    headerName: 'NPV / Well',
    valueParser: (params) => toNumber(params.newValue),
    valueFormatter: (params) => fmtCompact(params.value ?? 0),
    cellClass: 'cell-number',
    minWidth: 130,
  },
  {
    field: 'capexPerWell',
    headerName: 'CAPEX / Well',
    valueParser: (params) => toNumber(params.newValue),
    valueFormatter: (params) => fmtCompact(params.value ?? 0),
    cellClass: 'cell-number',
    minWidth: 130,
  },
  {
    field: 'spudToOnlineDays',
    headerName: 'Spud to Online',
    valueParser: (params) => toNumber(params.newValue),
    cellClass: 'cell-number',
    minWidth: 140,
  },
  {
    field: 'color',
    headerName: 'Color',
    minWidth: 120,
    cellRenderer: (params: { value: string }) => (
      <div className="color-chip-cell">
        <span className="color-swatch" style={{ backgroundColor: params.value }} />
        <span>{params.value}</span>
      </div>
    ),
  },
  {
    field: 'notes',
    headerName: 'Notes',
    minWidth: 220,
    flex: 1.4,
  },
  {
    ...deleteButton((rowIndex) =>
      updateInventory((rows) => rows.filter((_, index) => index !== rowIndex)),
    ),
    pinned: 'right',
  },
];

export const inventoryGridChanged = (
  event: CellValueChangedEvent<InventoryBucket>,
  updateInventory: (updater: (inventory: InventoryBucket[]) => InventoryBucket[]) => void,
) => {
  const rowIndex = event.node.rowIndex ?? -1;
  const field = event.colDef.field as keyof InventoryBucket | undefined;
  if (!field || rowIndex < 0) return;

  updateInventory((rows) =>
    rows.map((row, index) =>
      index === rowIndex
        ? {
            ...row,
            [field]:
              field === 'inventoryCount' ||
              field === 'npvPerWell' ||
              field === 'capexPerWell' ||
              field === 'spudToOnlineDays'
                ? toNumber(event.newValue)
                : (event.newValue as string),
          }
        : row,
    ),
  );
};

export const constraintsGridChanged = (
  event: CellValueChangedEvent<ConstraintsGridRow>,
  updateScenario: (updater: (scenario: ScheduleScenario) => ScheduleScenario) => void,
) => {
  const rowIndex = event.node.rowIndex ?? -1;
  const field = event.colDef.field as 'rigCount' | 'capexBudget' | undefined;
  if (!field || rowIndex < 0) return;

  if (field === 'rigCount') {
    updateScenario((scenario) => {
      const annualRigCount = [...scenario.annualRigCount];
      annualRigCount[rowIndex] = toNumber(event.newValue);
      return { ...scenario, annualRigCount };
    });
    return;
  }

  updateScenario((scenario) => {
    const annualCapexBudget = [...scenario.annualCapexBudget];
    annualCapexBudget[rowIndex] = toNumber(event.newValue);
    return { ...scenario, annualCapexBudget };
  });
};

export const buildConstraintsColumnDefs = (): ColDef<ConstraintsGridRow>[] => [
  {
    field: 'yearLabel',
    headerName: 'Year',
    editable: false,
    pinned: 'left',
    width: 90,
  },
  {
    field: 'rigCount',
    headerName: 'Rig Count',
    valueParser: (params) => toNumber(params.newValue),
    cellClass: 'cell-number',
  },
  {
    field: 'capexBudget',
    headerName: 'CAPEX Budget',
    valueParser: (params) => toNumber(params.newValue),
    valueFormatter: (params) => fmtCurrency(params.value ?? 0),
    cellClass: 'cell-number',
    minWidth: 160,
  },
];

export const buildAnnualOverrideColumns = (
  years: number,
  inventory: InventoryBucket[],
  updateManualYear: (updater: (rows: ManualYearAllocation[]) => ManualYearAllocation[]) => void,
): ColDef<AnnualOverrideRow>[] => [
  {
    field: 'yearIndex',
    headerName: 'Year',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: Array.from({ length: years }, (_, yearIndex) => yearIndex),
    },
    valueFormatter: (params) => `Y${(params.value ?? 0) + 1}`,
    minWidth: 100,
  },
  {
    field: 'bucketId',
    headerName: 'Bucket',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: inventory.map((bucket) => bucket.id),
    },
    valueFormatter: (params) =>
      inventory.find((bucket) => bucket.id === params.value)?.name ?? String(params.value ?? ''),
    minWidth: 180,
  },
  {
    field: 'count',
    headerName: 'Count',
    valueParser: (params) => toNumber(params.newValue),
    cellClass: 'cell-number',
    minWidth: 100,
  },
  deleteButton((rowIndex) =>
    updateManualYear((rows) => rows.filter((_, index) => index !== rowIndex)),
  ),
];

export const buildRigOverrideColumns = (
  years: number,
  inventory: InventoryBucket[],
  rigOptions: string[],
  updateManualRig: (updater: (rows: ManualRigAllocation[]) => ManualRigAllocation[]) => void,
): ColDef<RigOverrideRow>[] => [
  {
    field: 'rigId',
    headerName: 'Rig',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: rigOptions,
    },
    minWidth: 120,
  },
  {
    field: 'yearIndex',
    headerName: 'Year',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: Array.from({ length: years }, (_, yearIndex) => yearIndex),
    },
    valueFormatter: (params) => `Y${(params.value ?? 0) + 1}`,
    minWidth: 100,
  },
  {
    field: 'bucketId',
    headerName: 'Bucket',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: inventory.map((bucket) => bucket.id),
    },
    valueFormatter: (params) =>
      inventory.find((bucket) => bucket.id === params.value)?.name ?? String(params.value ?? ''),
    minWidth: 180,
  },
  {
    field: 'count',
    headerName: 'Count',
    valueParser: (params) => toNumber(params.newValue),
    cellClass: 'cell-number',
    minWidth: 100,
  },
  deleteButton((rowIndex) =>
    updateManualRig((rows) => rows.filter((_, index) => index !== rowIndex)),
  ),
];

export const buildForcedOverrideColumns = (
  years: number,
  inventory: InventoryBucket[],
  rigOptions: string[],
  updateForced: (updater: (rows: ForcedAllocation[]) => ForcedAllocation[]) => void,
): ColDef<ForcedOverrideRow>[] => [
  {
    field: 'rigId',
    headerName: 'Rig',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: rigOptions,
    },
    minWidth: 120,
  },
  {
    field: 'yearIndex',
    headerName: 'Year',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: Array.from({ length: years }, (_, yearIndex) => yearIndex),
    },
    valueFormatter: (params) => `Y${(params.value ?? 0) + 1}`,
    minWidth: 100,
  },
  {
    field: 'bucketId',
    headerName: 'Bucket',
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: inventory.map((bucket) => bucket.id),
    },
    valueFormatter: (params) =>
      inventory.find((bucket) => bucket.id === params.value)?.name ?? String(params.value ?? ''),
    minWidth: 180,
  },
  {
    field: 'count',
    headerName: 'Count',
    valueParser: (params) => toNumber(params.newValue),
    cellClass: 'cell-number',
    minWidth: 100,
  },
  {
    field: 'spudDate',
    headerName: 'Spud Date',
    minWidth: 150,
  },
  deleteButton((rowIndex) =>
    updateForced((rows) => rows.filter((_, index) => index !== rowIndex)),
  ),
];

export const annualOverrideChanged = (
  event: CellValueChangedEvent<AnnualOverrideRow>,
  updateManualYear: (updater: (rows: ManualYearAllocation[]) => ManualYearAllocation[]) => void,
) => {
  const rowIndex = event.node.rowIndex ?? -1;
  const field = event.colDef.field as keyof ManualYearAllocation | undefined;
  if (!field || rowIndex < 0) return;

  updateManualYear((rows) =>
    rows.map((row, index) =>
      index === rowIndex
        ? {
            ...row,
            [field]:
              field === 'yearIndex' || field === 'count'
                ? toNumber(event.newValue)
                : String(event.newValue ?? ''),
          }
        : row,
    ),
  );
};

export const rigOverrideChanged = (
  event: CellValueChangedEvent<RigOverrideRow>,
  updateManualRig: (updater: (rows: ManualRigAllocation[]) => ManualRigAllocation[]) => void,
) => {
  const rowIndex = event.node.rowIndex ?? -1;
  const field = event.colDef.field as keyof ManualRigAllocation | undefined;
  if (!field || rowIndex < 0) return;

  updateManualRig((rows) =>
    rows.map((row, index) =>
      index === rowIndex
        ? {
            ...row,
            [field]:
              field === 'yearIndex' || field === 'count'
                ? toNumber(event.newValue)
                : String(event.newValue ?? ''),
          }
        : row,
    ),
  );
};

export const forcedOverrideChanged = (
  event: CellValueChangedEvent<ForcedOverrideRow>,
  updateForced: (updater: (rows: ForcedAllocation[]) => ForcedAllocation[]) => void,
) => {
  const rowIndex = event.node.rowIndex ?? -1;
  const field = event.colDef.field as keyof ForcedAllocation | undefined;
  if (!field || rowIndex < 0) return;

  updateForced((rows) =>
    rows.map((row, index) =>
      index === rowIndex
        ? {
            ...row,
            [field]:
              field === 'yearIndex' || field === 'count'
                ? toNumber(event.newValue)
                : event.newValue == null
                  ? undefined
                  : String(event.newValue),
          }
        : row,
    ),
  );
};

export const buildAnnualSummaryColumns = (): ColDef<ScheduleRunResult['annualSummaries'][number]>[] => [
  { field: 'yearLabel', headerName: 'Year', pinned: 'left', width: 90 },
  { field: 'rigCount', headerName: 'Rigs', width: 80, cellClass: 'cell-number' },
  { field: 'slotCapacity', headerName: 'Slots', width: 90, cellClass: 'cell-number' },
  { field: 'scheduledWells', headerName: 'Scheduled', width: 110, cellClass: 'cell-number' },
  { field: 'onlineWells', headerName: 'Online', width: 90, cellClass: 'cell-number' },
  { field: 'capex', headerName: 'CAPEX', valueFormatter: currencyFormatter, minWidth: 140 },
  { field: 'discountedNpv', headerName: 'Discounted NPV', valueFormatter: currencyFormatter, minWidth: 170 },
  { field: 'budgetRemaining', headerName: 'Budget Remaining', valueFormatter: currencyFormatter, minWidth: 170 },
  { field: 'unusedSlots', headerName: 'Unused', width: 90, cellClass: 'cell-number' },
];

export const buildRemainingColumns = (): ColDef<ScheduleRunResult['remainingInventory'][number]>[] => [
  { field: 'bucketName', headerName: 'Bucket', pinned: 'left', minWidth: 180 },
  { field: 'remainingCount', headerName: 'Remaining Wells', width: 140, cellClass: 'cell-number' },
  { field: 'unscheduledCapex', headerName: 'Deferred CAPEX', valueFormatter: currencyFormatter, minWidth: 150 },
  { field: 'unscheduledNpv', headerName: 'Deferred NPV', valueFormatter: currencyFormatter, minWidth: 150 },
];
