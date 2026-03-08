import { useMemo, useRef, useState } from 'react';
import type {
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { FIXTURES, defaultWorkspaceState } from './data/fixtures';
import { createEmptyManualOverrides, runSchedule } from './engine/scheduler';
import type {
  CapacityMode,
  ForcedAllocation,
  InventoryBucket,
  ManualRigAllocation,
  ManualYearAllocation,
  ScheduleRunRequest,
  ScheduleScenario,
  SchedulerMode,
  WorkspaceState,
} from './types';

ModuleRegistry.registerModules([AllCommunityModule]);

declare global {
  interface Window {
    __rigPlannerGridApis?: Record<string, GridApi>;
  }
}

type WorkbookSection = 'INVENTORY' | 'CONSTRAINTS' | 'OVERRIDES' | 'RESULTS';
type OverrideSection = 'ANNUAL' | 'RIG' | 'FORCED';

type ConstraintsGridRow = {
  id: string;
  yearIndex: number;
  yearLabel: string;
  rigCount: number;
  capexBudget: number;
};

type AnnualOverrideRow = ManualYearAllocation & { id: string; yearLabel: string; bucketName: string };
type RigOverrideRow = ManualRigAllocation & { id: string; yearLabel: string; bucketName: string };
type ForcedOverrideRow = ForcedAllocation & { id: string; yearLabel: string; bucketName: string };

const WORKBOOK_SECTIONS: Array<{ id: WorkbookSection; label: string; title: string; subtitle: string }> = [
  {
    id: 'INVENTORY',
    label: 'Inventory',
    title: 'Inventory Workbook',
    subtitle: 'Edit bucket-level inventory, economics, and timing assumptions in one grid.',
  },
  {
    id: 'CONSTRAINTS',
    label: 'Constraints',
    title: 'Constraint Workbook',
    subtitle: 'Tune planning horizon, rig logic, and annual budget / fleet rows together.',
  },
  {
    id: 'OVERRIDES',
    label: 'Overrides',
    title: 'Override Workbook',
    subtitle: 'Lock annual, per-rig, or forced scheduling intent before auto-fill runs.',
  },
  {
    id: 'RESULTS',
    label: 'Results',
    title: 'Results Workbook',
    subtitle: 'Review annual output, deferred inventory, warnings, and the synchronized rig timeline.',
  },
];

const OVERRIDE_SECTIONS: Array<{ id: OverrideSection; label: string }> = [
  { id: 'ANNUAL', label: 'Annual' },
  { id: 'RIG', label: 'Per Rig' },
  { id: 'FORCED', label: 'Forced' },
];

const modeLabels: Record<SchedulerMode, string> = {
  AUTO: 'Auto',
  MANUAL_YEAR: 'Manual Year',
  MANUAL_RIG: 'Manual Rig',
  HYBRID: 'Hybrid',
};

const capacityLabels: Record<CapacityMode, string> = {
  RATE: 'Wells / Rig / Year',
  CYCLE_DAYS: 'Cycle Days',
};

const colors = ['#7dd3fc', '#86efac', '#f9a8d4', '#fdba74', '#c4b5fd', '#fca5a5'];
const GRID_THEME_CLASS = 'ag-theme-quartz workbook-grid-theme';

const fmtCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const fmtCompact = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const cloneRequest = (request: ScheduleRunRequest) => structuredClone(request);
const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const currencyFormatter = (params: ValueFormatterParams<any, number | null>) => {
  if (params.value == null) return 'Unconstrained';
  return fmtCurrency(params.value);
};

const stringToTitle = (value: string) => value.toLowerCase().replace(/_/g, ' ');

const App = () => {
  const initialState = defaultWorkspaceState();
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialState);
  const [activeSection, setActiveSection] = useState<WorkbookSection>('INVENTORY');
  const [activeOverrideSection, setActiveOverrideSection] = useState<OverrideSection>('ANNUAL');
  const [isUtilityDrawerOpen, setIsUtilityDrawerOpen] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(initialState.request, null, 2));
  const [jsonError, setJsonError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const result = useMemo(() => runSchedule(workspace.request), [workspace.request]);

  const rigOptions = useMemo(() => {
    const maxRigCount = Math.max(...workspace.request.scenario.annualRigCount, 1);
    if (!workspace.request.scenario.applyRigConstraint) return ['Capital Pool'];
    return Array.from({ length: maxRigCount }, (_, index) => `Rig ${index + 1}`);
  }, [workspace.request.scenario]);

  const totalInventory = workspace.request.inventory.reduce((sum, bucket) => sum + bucket.inventoryCount, 0);
  const scheduledInventory = result.events.length;
  const remainingInventory = result.remainingInventory.reduce((sum, row) => sum + row.remainingCount, 0);
  const activeFixture = FIXTURES.find((fixture) => fixture.id === workspace.fixtureId);
  const activeSectionMeta = WORKBOOK_SECTIONS.find((section) => section.id === activeSection)!;

  const inventoryGridRows = useMemo(() => workspace.request.inventory, [workspace.request.inventory]);
  const constraintsGridRows = useMemo<ConstraintsGridRow[]>(
    () =>
      Array.from({ length: workspace.request.scenario.years }, (_, yearIndex) => ({
        id: `year-${yearIndex}`,
        yearIndex,
        yearLabel: `Y${yearIndex + 1}`,
        rigCount: workspace.request.scenario.annualRigCount[yearIndex] ?? 0,
        capexBudget: workspace.request.scenario.annualCapexBudget[yearIndex] ?? 0,
      })),
    [workspace.request.scenario],
  );
  const annualOverrideRows = useMemo<AnnualOverrideRow[]>(
    () =>
      workspace.request.manualOverrides.annualBucketTargets.map((row, index) => ({
        ...row,
        id: `annual-${index}`,
        yearLabel: `Y${row.yearIndex + 1}`,
        bucketName: workspace.request.inventory.find((bucket) => bucket.id === row.bucketId)?.name ?? row.bucketId,
      })),
    [workspace.request.manualOverrides.annualBucketTargets, workspace.request.inventory],
  );
  const rigOverrideRows = useMemo<RigOverrideRow[]>(
    () =>
      workspace.request.manualOverrides.perRigTargets.map((row, index) => ({
        ...row,
        id: `rig-${index}`,
        yearLabel: `Y${row.yearIndex + 1}`,
        bucketName: workspace.request.inventory.find((bucket) => bucket.id === row.bucketId)?.name ?? row.bucketId,
      })),
    [workspace.request.manualOverrides.perRigTargets, workspace.request.inventory],
  );
  const forcedOverrideRows = useMemo<ForcedOverrideRow[]>(
    () =>
      workspace.request.manualOverrides.forcedAllocations.map((row, index) => ({
        ...row,
        id: `forced-${index}`,
        yearLabel: `Y${row.yearIndex + 1}`,
        bucketName: workspace.request.inventory.find((bucket) => bucket.id === row.bucketId)?.name ?? row.bucketId,
      })),
    [workspace.request.manualOverrides.forcedAllocations, workspace.request.inventory],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      editable: true,
      resizable: true,
      sortable: true,
      filter: false,
      flex: 1,
      minWidth: 110,
      singleClickEdit: true,
      suppressHeaderMenuButton: true,
    }),
    [],
  );

  const replaceRequest = (request: ScheduleRunRequest, fixtureId = 'custom') => {
    setWorkspace({ fixtureId, request: cloneRequest(request) });
    setJsonDraft(JSON.stringify(request, null, 2));
    setJsonError('');
  };

  const updateScenario = (updater: (scenario: ScheduleScenario) => ScheduleScenario) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        scenario: updater(current.request.scenario),
      },
    }));
  };

  const updateInventory = (updater: (inventory: InventoryBucket[]) => InventoryBucket[]) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        inventory: updater(current.request.inventory),
      },
    }));
  };

  const updateManualYear = (updater: (rows: ManualYearAllocation[]) => ManualYearAllocation[]) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        manualOverrides: {
          ...current.request.manualOverrides,
          annualBucketTargets: updater(current.request.manualOverrides.annualBucketTargets),
        },
      },
    }));
  };

  const updateManualRig = (updater: (rows: ManualRigAllocation[]) => ManualRigAllocation[]) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        manualOverrides: {
          ...current.request.manualOverrides,
          perRigTargets: updater(current.request.manualOverrides.perRigTargets),
        },
      },
    }));
  };

  const updateForced = (updater: (rows: ForcedAllocation[]) => ForcedAllocation[]) => {
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        manualOverrides: {
          ...current.request.manualOverrides,
          forcedAllocations: updater(current.request.manualOverrides.forcedAllocations),
        },
      },
    }));
  };

  const syncYears = (years: number) => {
    updateScenario((scenario) => {
      const resize = (values: number[], fallback: number) =>
        Array.from({ length: years }, (_, index) => values[index] ?? fallback);

      return {
        ...scenario,
        years,
        annualRigCount: resize(
          scenario.annualRigCount,
          scenario.annualRigCount[scenario.annualRigCount.length - 1] ?? 0,
        ),
        annualCapexBudget: resize(
          scenario.annualCapexBudget,
          scenario.annualCapexBudget[scenario.annualCapexBudget.length - 1] ?? 0,
        ),
      };
    });
  };

  const addInventoryRow = () => {
    updateInventory((inventory) => [
      ...inventory,
      {
        id: `bucket-${Date.now()}`,
        name: `New Bucket ${inventory.length + 1}`,
        inventoryCount: 1,
        npvPerWell: 5_000_000,
        capexPerWell: 3_500_000,
        spudToOnlineDays: 120,
        color: colors[inventory.length % colors.length],
        notes: '',
      },
    ]);
  };

  const addAnnualOverrideRow = () =>
    updateManualYear((rows) => [
      ...rows,
      {
        yearIndex: 0,
        bucketId: workspace.request.inventory[0]?.id ?? '',
        count: 1,
      },
    ]);

  const addRigOverrideRow = () =>
    updateManualRig((rows) => [
      ...rows,
      {
        rigId: rigOptions[0] ?? 'Rig 1',
        yearIndex: 0,
        bucketId: workspace.request.inventory[0]?.id ?? '',
        count: 1,
      },
    ]);

  const addForcedOverrideRow = () =>
    updateForced((rows) => [
      ...rows,
      {
        rigId: rigOptions[0] ?? 'Rig 1',
        yearIndex: 0,
        bucketId: workspace.request.inventory[0]?.id ?? '',
        count: 1,
      },
    ]);

  const applyJsonDraft = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as ScheduleRunRequest;
      replaceRequest(parsed, 'custom');
      setIsUtilityDrawerOpen(false);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Failed to parse JSON.');
    }
  };

  const downloadJson = () => {
    const payload = JSON.stringify(workspace.request, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rig-scheduler-scenario.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    setJsonDraft(text);
    setJsonError('');
  };

  const inventoryColumnDefs = useMemo<ColDef<InventoryBucket>[]>(
    () => [
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
        headerName: '',
        colId: 'actions',
        editable: false,
        sortable: false,
        filter: false,
        pinned: 'right',
        width: 96,
        cellRenderer: (params: { node: { rowIndex: number | null } }) => (
          <button
            className="grid-action-button"
            onClick={() =>
              updateInventory((rows) =>
                rows.filter((_, rowIndex) => rowIndex !== (params.node.rowIndex ?? -1)),
              )
            }
          >
            Delete
          </button>
        ),
      },
    ],
    [],
  );

  const inventoryGridChanged = (event: CellValueChangedEvent<InventoryBucket>) => {
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

  const constraintsColumnDefs = useMemo<ColDef<ConstraintsGridRow>[]>(
    () => [
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
    ],
    [],
  );

  const constraintsGridChanged = (event: CellValueChangedEvent<ConstraintsGridRow>) => {
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

  const annualOverrideColumns = useMemo<ColDef<AnnualOverrideRow>[]>(
    () => [
      {
        field: 'yearIndex',
        headerName: 'Year',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: Array.from({ length: workspace.request.scenario.years }, (_, yearIndex) => yearIndex),
        },
        valueFormatter: (params) => `Y${(params.value ?? 0) + 1}`,
        minWidth: 100,
      },
      {
        field: 'bucketId',
        headerName: 'Bucket',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: workspace.request.inventory.map((bucket) => bucket.id),
        },
        valueFormatter: (params) =>
          workspace.request.inventory.find((bucket) => bucket.id === params.value)?.name ?? String(params.value ?? ''),
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
        headerName: '',
        colId: 'actions',
        editable: false,
        sortable: false,
        filter: false,
        width: 96,
        cellRenderer: (params: { node: { rowIndex: number | null } }) => (
          <button
            className="grid-action-button"
            onClick={() =>
              updateManualYear((rows) =>
                rows.filter((_, rowIndex) => rowIndex !== (params.node.rowIndex ?? -1)),
              )
            }
          >
            Delete
          </button>
        ),
      },
    ],
    [workspace.request.inventory, workspace.request.scenario.years],
  );

  const rigOverrideColumns = useMemo<ColDef<RigOverrideRow>[]>(
    () => [
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
          values: Array.from({ length: workspace.request.scenario.years }, (_, yearIndex) => yearIndex),
        },
        valueFormatter: (params) => `Y${(params.value ?? 0) + 1}`,
        minWidth: 100,
      },
      {
        field: 'bucketId',
        headerName: 'Bucket',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: workspace.request.inventory.map((bucket) => bucket.id),
        },
        valueFormatter: (params) =>
          workspace.request.inventory.find((bucket) => bucket.id === params.value)?.name ?? String(params.value ?? ''),
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
        headerName: '',
        colId: 'actions',
        editable: false,
        sortable: false,
        filter: false,
        width: 96,
        cellRenderer: (params: { node: { rowIndex: number | null } }) => (
          <button
            className="grid-action-button"
            onClick={() =>
              updateManualRig((rows) =>
                rows.filter((_, rowIndex) => rowIndex !== (params.node.rowIndex ?? -1)),
              )
            }
          >
            Delete
          </button>
        ),
      },
    ],
    [rigOptions, workspace.request.inventory, workspace.request.scenario.years],
  );

  const forcedOverrideColumns = useMemo<ColDef<ForcedOverrideRow>[]>(
    () => [
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
          values: Array.from({ length: workspace.request.scenario.years }, (_, yearIndex) => yearIndex),
        },
        valueFormatter: (params) => `Y${(params.value ?? 0) + 1}`,
        minWidth: 100,
      },
      {
        field: 'bucketId',
        headerName: 'Bucket',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: workspace.request.inventory.map((bucket) => bucket.id),
        },
        valueFormatter: (params) =>
          workspace.request.inventory.find((bucket) => bucket.id === params.value)?.name ?? String(params.value ?? ''),
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
      {
        headerName: '',
        colId: 'actions',
        editable: false,
        sortable: false,
        filter: false,
        width: 96,
        cellRenderer: (params: { node: { rowIndex: number | null } }) => (
          <button
            className="grid-action-button"
            onClick={() =>
              updateForced((rows) =>
                rows.filter((_, rowIndex) => rowIndex !== (params.node.rowIndex ?? -1)),
              )
            }
          >
            Delete
          </button>
        ),
      },
    ],
    [rigOptions, workspace.request.inventory, workspace.request.scenario.years],
  );

  const annualOverrideChanged = (event: CellValueChangedEvent<AnnualOverrideRow>) => {
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

  const rigOverrideChanged = (event: CellValueChangedEvent<RigOverrideRow>) => {
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

  const forcedOverrideChanged = (event: CellValueChangedEvent<ForcedOverrideRow>) => {
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

  const annualSummaryColumns = useMemo<ColDef<(typeof result.annualSummaries)[number]>[]>(
    () => [
      { field: 'yearLabel', headerName: 'Year', pinned: 'left', width: 90 },
      { field: 'rigCount', headerName: 'Rigs', width: 80, cellClass: 'cell-number' },
      { field: 'slotCapacity', headerName: 'Slots', width: 90, cellClass: 'cell-number' },
      { field: 'scheduledWells', headerName: 'Scheduled', width: 110, cellClass: 'cell-number' },
      { field: 'onlineWells', headerName: 'Online', width: 90, cellClass: 'cell-number' },
      { field: 'capex', headerName: 'CAPEX', valueFormatter: currencyFormatter, minWidth: 140 },
      { field: 'discountedNpv', headerName: 'Discounted NPV', valueFormatter: currencyFormatter, minWidth: 170 },
      { field: 'budgetRemaining', headerName: 'Budget Remaining', valueFormatter: currencyFormatter, minWidth: 170 },
      { field: 'unusedSlots', headerName: 'Unused', width: 90, cellClass: 'cell-number' },
    ],
    [],
  );

  const remainingColumns = useMemo<ColDef<(typeof result.remainingInventory)[number]>[]>(
    () => [
      { field: 'bucketName', headerName: 'Bucket', pinned: 'left', minWidth: 180 },
      { field: 'remainingCount', headerName: 'Remaining Wells', width: 140, cellClass: 'cell-number' },
      { field: 'unscheduledCapex', headerName: 'Deferred CAPEX', valueFormatter: currencyFormatter, minWidth: 150 },
      { field: 'unscheduledNpv', headerName: 'Deferred NPV', valueFormatter: currencyFormatter, minWidth: 150 },
    ],
    [],
  );

  const horizonDays = Math.max(workspace.request.scenario.years * 365, 1);

  const sectionActions = {
    INVENTORY: (
      <div className="toolbar-actions">
        <button className="toolbar-button" onClick={addInventoryRow}>
          Add Bucket
        </button>
        <button className="toolbar-button secondary" onClick={() => replaceRequest(initialState.request, initialState.fixtureId)}>
          Reset Fixture
        </button>
      </div>
    ),
    CONSTRAINTS: (
      <div className="toolbar-actions">
        <button className="toolbar-button secondary" onClick={() => syncYears(Math.max(1, workspace.request.scenario.years))}>
          Re-sync Horizon
        </button>
      </div>
    ),
    OVERRIDES: (
      <div className="toolbar-actions">
        <button
          className="toolbar-button"
          onClick={() => {
            if (activeOverrideSection === 'ANNUAL') addAnnualOverrideRow();
            if (activeOverrideSection === 'RIG') addRigOverrideRow();
            if (activeOverrideSection === 'FORCED') addForcedOverrideRow();
          }}
        >
          Add {stringToTitle(activeOverrideSection)}
        </button>
        <button
          className="toolbar-button secondary"
          onClick={() =>
            setWorkspace((current) => ({
              ...current,
              request: {
                ...current.request,
                manualOverrides: createEmptyManualOverrides(),
              },
            }))
          }
        >
          Clear Overrides
        </button>
      </div>
    ),
    RESULTS: (
      <div className="toolbar-actions">
        <button className="toolbar-button secondary" onClick={() => setIsUtilityDrawerOpen(true)}>
          Open Utilities
        </button>
      </div>
    ),
  };

  const renderInventorySection = () => (
    <div className="section-grid-stack">
      <div className="note-card">
        <span className="pill-label">Grid behavior</span>
        <p>Single-click edit, tab across cells, and pin the bucket name while scanning economics and timing assumptions.</p>
      </div>
      <WorkbookGrid
        testId="inventory-grid"
        rowData={inventoryGridRows}
        columnDefs={inventoryColumnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={inventoryGridChanged}
        height={520}
      />
    </div>
  );

  const renderConstraintsSection = () => (
    <div className="constraints-layout">
      <div className="control-card">
        <div className="control-card-grid">
          <label className="field">
            <span>Planning Years</span>
            <input
              data-testid="planning-years-input"
              type="number"
              min={1}
              max={12}
              value={workspace.request.scenario.years}
              onChange={(event) => syncYears(Math.max(1, toNumber(event.target.value)))}
            />
          </label>
          <label className="field">
            <span>Rig Start Date</span>
            <input
              type="date"
              value={workspace.request.scenario.rigStartDate}
              onChange={(event) =>
                updateScenario((scenario) => ({ ...scenario, rigStartDate: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Capacity Mode</span>
            <select
              value={workspace.request.scenario.capacityMode}
              onChange={(event) =>
                updateScenario((scenario) => ({ ...scenario, capacityMode: event.target.value as CapacityMode }))
              }
            >
              {Object.entries(capacityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Discount Rate</span>
            <input
              type="number"
              step="0.01"
              value={workspace.request.scenario.discountRate ?? 0.1}
              onChange={(event) =>
                updateScenario((scenario) => ({ ...scenario, discountRate: toNumber(event.target.value) }))
              }
            />
          </label>
          {workspace.request.scenario.capacityMode === 'RATE' ? (
            <label className="field">
              <span>Wells / Rig / Year</span>
              <input
                type="number"
                min={0}
                value={workspace.request.scenario.wellsPerRigPerYear ?? 0}
                onChange={(event) =>
                  updateScenario((scenario) => ({
                    ...scenario,
                    wellsPerRigPerYear: toNumber(event.target.value),
                  }))
                }
              />
            </label>
          ) : (
            <label className="field">
              <span>Drill Cycle Days</span>
              <input
                type="number"
                min={1}
                value={workspace.request.scenario.drillCycleDays ?? 90}
                onChange={(event) =>
                  updateScenario((scenario) => ({
                    ...scenario,
                    drillCycleDays: toNumber(event.target.value),
                  }))
                }
              />
            </label>
          )}
        </div>

        <div className="toggle-stack">
          <label className="toggle-pill">
            <input
              type="checkbox"
              checked={workspace.request.scenario.applyRigConstraint ?? true}
              onChange={(event) =>
                updateScenario((scenario) => ({ ...scenario, applyRigConstraint: event.target.checked }))
              }
            />
            <span>Enforce annual rig count</span>
          </label>
          <label className="toggle-pill">
            <input
              type="checkbox"
              checked={workspace.request.scenario.applyCapexConstraint ?? true}
              onChange={(event) =>
                updateScenario((scenario) => ({ ...scenario, applyCapexConstraint: event.target.checked }))
              }
            />
            <span>Enforce annual CAPEX budget</span>
          </label>
          <label className="toggle-pill">
            <input
              type="checkbox"
              checked={workspace.request.manualOverrides.autoFillRemaining}
              onChange={(event) =>
                setWorkspace((current) => ({
                  ...current,
                  request: {
                    ...current.request,
                    manualOverrides: {
                      ...current.request.manualOverrides,
                      autoFillRemaining: event.target.checked,
                    },
                  },
                }))
              }
            />
            <span>Auto-fill remaining capacity</span>
          </label>
        </div>
      </div>

      <WorkbookGrid
        testId="constraints-grid"
        rowData={constraintsGridRows}
        columnDefs={constraintsColumnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={constraintsGridChanged}
        height={440}
      />
    </div>
  );

  const renderOverridesSection = () => {
    return (
      <div className="section-grid-stack">
        <div className="subtab-row">
          {OVERRIDE_SECTIONS.map((section) => (
            <button
              key={section.id}
              data-testid={`override-tab-${section.id}`}
              className={activeOverrideSection === section.id ? 'subtab active' : 'subtab'}
              onClick={() => setActiveOverrideSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
        <div className="note-card">
          <span className="pill-label">Override precedence</span>
          <p>Forced allocations lock first, then per-rig, then annual, and auto-fill consumes whatever fleet and budget remain.</p>
        </div>
        {activeOverrideSection === 'ANNUAL' ? (
          <WorkbookGrid
            testId="overrides-grid"
            rowData={annualOverrideRows}
            columnDefs={annualOverrideColumns}
            defaultColDef={defaultColDef}
            onCellValueChanged={annualOverrideChanged}
            height={480}
            emptyMessage="No annual overrides defined."
          />
        ) : null}
        {activeOverrideSection === 'RIG' ? (
          <WorkbookGrid
            testId="overrides-grid"
            rowData={rigOverrideRows}
            columnDefs={rigOverrideColumns}
            defaultColDef={defaultColDef}
            onCellValueChanged={rigOverrideChanged}
            height={480}
            emptyMessage="No per-rig overrides defined."
          />
        ) : null}
        {activeOverrideSection === 'FORCED' ? (
          <WorkbookGrid
            testId="overrides-grid"
            rowData={forcedOverrideRows}
            columnDefs={forcedOverrideColumns}
            defaultColDef={defaultColDef}
            onCellValueChanged={forcedOverrideChanged}
            height={480}
            emptyMessage="No forced overrides defined."
          />
        ) : null}
      </div>
    );
  };

  const renderResultsSection = () => (
    <div className="results-layout">
      <div className="results-summary-row">
        <article className="summary-card" data-testid="scheduled-wells-card">
          <span>Scheduled wells</span>
          <strong data-testid="scheduled-wells-value">{scheduledInventory}</strong>
          <small>{fmtCurrency(result.totalCapex)} spend</small>
        </article>
        <article className="summary-card">
          <span>Deferred wells</span>
          <strong>{remainingInventory}</strong>
          <small>{fmtCompact(result.remainingInventory.reduce((sum, row) => sum + row.unscheduledCapex, 0))} deferred</small>
        </article>
        <article className="summary-card">
          <span>Average discounted NPV / well</span>
          <strong>{scheduledInventory > 0 ? fmtCompact(result.totalDiscountedNpv / scheduledInventory) : '$0'}</strong>
          <small>Scenario rate applied to online timing</small>
        </article>
      </div>

      {result.warnings.length > 0 ? (
        <div className="warning-list">
          {result.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="results-grid-pair">
        <div>
          <div className="grid-caption">Annual summary</div>
          <WorkbookGrid
            testId="results-annual-grid"
            rowData={result.annualSummaries}
            columnDefs={annualSummaryColumns}
            defaultColDef={{ ...defaultColDef, editable: false }}
            height={280}
          />
        </div>
        <div>
          <div className="grid-caption">Remaining inventory</div>
          <WorkbookGrid
            testId="results-remaining-grid"
            rowData={result.remainingInventory}
            columnDefs={remainingColumns}
            defaultColDef={{ ...defaultColDef, editable: false }}
            height={280}
          />
        </div>
      </div>

      <div className="timeline-card">
        <div className="timeline-header">
          <div>
            <span className="pill-label">Timeline</span>
            <h3>Spud to online by rig</h3>
          </div>
          <p className="muted">Grid edits and fixture switches flow straight into this schedule pane without leaving the workbook.</p>
        </div>
        <div className="timeline-years">
          {Array.from({ length: workspace.request.scenario.years }, (_, yearIndex) => (
            <span key={yearIndex} style={{ left: `${((yearIndex * 365) / horizonDays) * 100}%` }}>
              Y{yearIndex + 1}
            </span>
          ))}
        </div>
        <div className="timeline-rows">
          {rigOptions.map((rigId) => (
            <div key={rigId} className="timeline-row">
              <div className="timeline-rig-label">{rigId}</div>
              <div className="timeline-lane">
                {result.events
                  .filter((event) => event.rigId === rigId)
                  .map((event) => {
                    const start =
                      (new Date(`${event.spudDate}T00:00:00Z`).getTime() -
                        new Date(`${workspace.request.scenario.rigStartDate}T00:00:00Z`).getTime()) /
                      (24 * 60 * 60 * 1000);
                    const end =
                      (new Date(`${event.onlineDate}T00:00:00Z`).getTime() -
                        new Date(`${workspace.request.scenario.rigStartDate}T00:00:00Z`).getTime()) /
                      (24 * 60 * 60 * 1000);

                    return (
                      <div
                        key={event.id}
                        className={`timeline-event ${event.locked ? 'locked' : ''}`}
                        style={{
                          left: `${(start / horizonDays) * 100}%`,
                          width: `${Math.max(((end - start) / horizonDays) * 100, 2.4)}%`,
                          background: `linear-gradient(135deg, ${event.color}, rgba(12, 20, 33, 0.96))`,
                        }}
                        title={`${event.bucketName} | ${event.spudDate} -> ${event.onlineDate} | ${event.source}`}
                      >
                        <span>{event.bucketName}</span>
                        <small>{event.source}</small>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="planner-shell">
      <header className="planner-topbar">
        <div className="brand-block">
          <p className="eyebrow">Standalone Prototype</p>
          <h1>Rig Planner Workbook</h1>
          <p className="lede">Spreadsheet-style scheduling for undeveloped inventory, tuned for desktop decision work instead of long-form scrolling.</p>
        </div>

        <div className="topbar-controls">
          <label className="mini-field">
            <span>Fixture</span>
            <select
              aria-label="Fixture"
              value={workspace.fixtureId}
              onChange={(event) => {
                const fixture = FIXTURES.find((item) => item.id === event.target.value);
                if (!fixture) return;
                replaceRequest(fixture.request, fixture.id);
              }}
            >
              {FIXTURES.map((fixture) => (
                <option key={fixture.id} value={fixture.id}>
                  {fixture.name}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </label>

          <label className="mini-field">
            <span>Mode</span>
            <select
              aria-label="Mode"
              value={workspace.request.mode}
              onChange={(event) =>
                setWorkspace((current) => ({
                  ...current,
                  request: {
                    ...current.request,
                    mode: event.target.value as SchedulerMode,
                  },
                }))
              }
            >
              {Object.entries(modeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="topbar-button-row">
            <button
              aria-label="Open utility drawer"
              className="toolbar-button secondary"
              onClick={() => setIsUtilityDrawerOpen(true)}
            >
              Utilities
            </button>
            <button
              aria-label="Reset workbook"
              className="toolbar-button secondary"
              onClick={() => replaceRequest(initialState.request, initialState.fixtureId)}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="metrics-strip">
          <MetricTile label="Inventory" value={String(totalInventory)} />
          <MetricTile label="Scheduled" value={String(scheduledInventory)} />
          <MetricTile label="CAPEX" value={fmtCompact(result.totalCapex)} />
          <MetricTile label="Discounted NPV" value={fmtCompact(result.totalDiscountedNpv)} />
        </div>
      </header>

      <div className="context-strip">
        <div className="context-pills">
          <span className="context-pill">Fixture: {activeFixture?.name ?? 'Custom'}</span>
          <span className="context-pill">Mode: {modeLabels[workspace.request.mode]}</span>
          <span className="context-pill">Capacity: {capacityLabels[workspace.request.scenario.capacityMode]}</span>
        </div>
        <p className="context-description">{activeFixture?.description ?? 'Live custom scenario driven by workbook edits and utility imports.'}</p>
      </div>

      <div className="workbook-layout">
        <aside className="workbook-rail">
          <div className="rail-card">
            <span className="pill-label">Workbook</span>
            <div className="section-tab-list">
              {WORKBOOK_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  data-testid={`section-tab-${section.id}`}
                  className={activeSection === section.id ? 'section-tab active' : 'section-tab'}
                  onClick={() => setActiveSection(section.id)}
                >
                  <strong>{section.label}</strong>
                  <span>{section.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rail-card">
            <span className="pill-label">At a glance</span>
            <div className="rail-metric-list">
              <div>
                <span>Remaining wells</span>
                <strong>{remainingInventory}</strong>
              </div>
              <div>
                <span>Rig years</span>
                <strong>{workspace.request.scenario.years}</strong>
              </div>
              <div>
                <span>Override rows</span>
                <strong>
                  {workspace.request.manualOverrides.annualBucketTargets.length +
                    workspace.request.manualOverrides.perRigTargets.length +
                    workspace.request.manualOverrides.forcedAllocations.length}
                </strong>
              </div>
            </div>
          </div>
        </aside>

        <section className="workbook-stage">
          <div className="stage-header">
            <div>
              <span className="pill-label">{activeSectionMeta.label}</span>
              <h2>{activeSectionMeta.title}</h2>
              <p>{activeSectionMeta.subtitle}</p>
            </div>
            {sectionActions[activeSection]}
          </div>

          {activeSection === 'INVENTORY' ? renderInventorySection() : null}
          {activeSection === 'CONSTRAINTS' ? renderConstraintsSection() : null}
          {activeSection === 'OVERRIDES' ? renderOverridesSection() : null}
          {activeSection === 'RESULTS' ? renderResultsSection() : null}
        </section>
      </div>

      {isUtilityDrawerOpen ? (
        <div className="utility-overlay" onClick={() => setIsUtilityDrawerOpen(false)}>
          <aside
            className="utility-drawer"
            data-testid="utility-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <span className="pill-label">Utilities</span>
                <h3>JSON import / export</h3>
              </div>
              <button className="toolbar-button secondary" onClick={() => setIsUtilityDrawerOpen(false)}>
                Close
              </button>
            </div>

            <div className="drawer-button-row">
              <button className="toolbar-button secondary" onClick={() => setJsonDraft(JSON.stringify(workspace.request, null, 2))}>
                Sync from state
              </button>
              <button aria-label="Load JSON draft" className="toolbar-button" onClick={applyJsonDraft}>
                Load JSON
              </button>
              <button className="toolbar-button secondary" onClick={downloadJson}>
                Download JSON
              </button>
              <button className="toolbar-button secondary" onClick={() => fileInputRef.current?.click()}>
                Upload file
              </button>
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importFile(file);
                }}
              />
            </div>

            {jsonError ? <p className="drawer-error">{jsonError}</p> : null}

            <textarea
              data-testid="json-draft"
              className="drawer-textarea"
              value={jsonDraft}
              onChange={(event) => {
                setJsonDraft(event.target.value);
                setJsonError('');
              }}
              spellCheck={false}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
};

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function WorkbookGrid<RowData extends { id?: string }>({
  rowData,
  columnDefs,
  defaultColDef,
  onCellValueChanged,
  height,
  emptyMessage,
  testId,
}: {
  rowData: RowData[];
  columnDefs: ColDef<RowData>[];
  defaultColDef: ColDef<RowData>;
  onCellValueChanged?: (event: CellValueChangedEvent<RowData>) => void;
  height: number;
  emptyMessage?: string;
  testId?: string;
}) {
  const onGridReady = (event: GridReadyEvent<RowData>) => {
    if (!testId) return;
    window.__rigPlannerGridApis = window.__rigPlannerGridApis ?? {};
    window.__rigPlannerGridApis[testId] = event.api as GridApi;
  };

  return (
    <div className="grid-frame" style={{ height }}>
      <div className={GRID_THEME_CLASS} data-testid={testId} style={{ height: '100%', width: '100%' }}>
        <AgGridReact<RowData>
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={40}
          headerHeight={42}
          animateRows={false}
          suppressMovableColumns
          stopEditingWhenCellsLoseFocus
          singleClickEdit
          getRowId={(params) => String(params.data.id ?? rowData.indexOf(params.data))}
          noRowsOverlayComponent={() => <span className="grid-empty-state">{emptyMessage ?? 'No rows to display.'}</span>}
          onCellValueChanged={onCellValueChanged}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
}

export default App;
