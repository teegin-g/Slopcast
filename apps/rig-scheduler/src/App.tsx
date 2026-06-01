import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import { FIXTURES, defaultWorkspaceState } from './data/fixtures';
import { runSchedule } from './engine/scheduler';
import type {
  AnnualSummary,
  RemainingInventory,
  ScheduleRunRequest,
  WorkspaceState,
} from './types';
import {
  WORKBOOK_SECTIONS,
  capacityLabels,
  modeLabels,
  stringToTitle,
  type AnnualOverrideRow,
  type ConstraintsGridRow,
  type ForcedOverrideRow,
  type OverrideSection,
  type RigOverrideRow,
  type WorkbookSection,
} from './shared';
import { PlannerTopbar } from './components/PlannerTopbar';
import { WorkbookRail } from './components/WorkbookRail';
import { UtilityDrawer } from './components/UtilityDrawer';
import {
  annualOverrideChanged,
  buildAnnualOverrideColumns,
  buildAnnualSummaryColumns,
  buildConstraintsColumnDefs,
  buildForcedOverrideColumns,
  buildInventoryColumnDefs,
  buildRemainingColumns,
  buildRigOverrideColumns,
  constraintsGridChanged,
  forcedOverrideChanged,
  inventoryGridChanged,
  rigOverrideChanged,
} from './components/columnDefs';
import { InventorySection } from './components/sections/Inventory';
import { ConstraintsSection } from './components/sections/Constraints';
import { OverridesSection } from './components/sections/Overrides';
import { ResultsSection } from './components/sections/Results';
import { useWorkspaceUpdaters } from './hooks/useWorkspaceUpdaters';

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

  const updaters = useWorkspaceUpdaters({
    workspace,
    setWorkspace,
    rigOptions,
    setJsonDraft,
    setJsonError,
  });
  const {
    replaceRequest,
    updateScenario,
    updateInventory,
    updateManualYear,
    updateManualRig,
    updateForced,
    syncYears,
    addInventoryRow,
    addAnnualOverrideRow,
    addRigOverrideRow,
    addForcedOverrideRow,
    clearOverrides,
  } = updaters;

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

  const inventoryColumnDefs = useMemo(() => buildInventoryColumnDefs(updateInventory), [updateInventory]);
  const constraintsColumnDefs = useMemo(() => buildConstraintsColumnDefs(), []);
  const annualOverrideColumns = useMemo(
    () => buildAnnualOverrideColumns(workspace.request.scenario.years, workspace.request.inventory, updateManualYear),
    [workspace.request.inventory, workspace.request.scenario.years, updateManualYear],
  );
  const rigOverrideColumns = useMemo(
    () =>
      buildRigOverrideColumns(
        workspace.request.scenario.years,
        workspace.request.inventory,
        rigOptions,
        updateManualRig,
      ),
    [rigOptions, workspace.request.inventory, workspace.request.scenario.years, updateManualRig],
  );
  const forcedOverrideColumns = useMemo(
    () =>
      buildForcedOverrideColumns(
        workspace.request.scenario.years,
        workspace.request.inventory,
        rigOptions,
        updateForced,
      ),
    [rigOptions, workspace.request.inventory, workspace.request.scenario.years, updateForced],
  );
  const annualSummaryColumns = useMemo<ColDef<AnnualSummary>[]>(() => buildAnnualSummaryColumns(), []);
  const remainingColumns = useMemo<ColDef<RemainingInventory>[]>(() => buildRemainingColumns(), []);

  const horizonDays = Math.max(workspace.request.scenario.years * 365, 1);

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

  const setAutoFillRemaining = (value: boolean) =>
    setWorkspace((current) => ({
      ...current,
      request: {
        ...current.request,
        manualOverrides: {
          ...current.request.manualOverrides,
          autoFillRemaining: value,
        },
      },
    }));

  const sectionActions: Record<WorkbookSection, ReactNode> = {
    INVENTORY: (
      <div className="toolbar-actions">
        <button type="button" className="toolbar-button" onClick={addInventoryRow}>
          Add Bucket
        </button>
        <button type="button" className="toolbar-button secondary" onClick={() => replaceRequest(initialState.request, initialState.fixtureId)}>
          Reset Fixture
        </button>
      </div>
    ),
    CONSTRAINTS: (
      <div className="toolbar-actions">
        <button type="button" className="toolbar-button secondary" onClick={() => syncYears(Math.max(1, workspace.request.scenario.years))}>
          Re-sync Horizon
        </button>
      </div>
    ),
    OVERRIDES: (
      <div className="toolbar-actions">
        <button
          type="button"
          className="toolbar-button"
          onClick={() => {
            if (activeOverrideSection === 'ANNUAL') addAnnualOverrideRow();
            if (activeOverrideSection === 'RIG') addRigOverrideRow();
            if (activeOverrideSection === 'FORCED') addForcedOverrideRow();
          }}
        >
          Add {stringToTitle(activeOverrideSection)}
        </button>
        <button type="button" className="toolbar-button secondary" onClick={clearOverrides}>
          Clear Overrides
        </button>
      </div>
    ),
    RESULTS: (
      <div className="toolbar-actions">
        <button type="button" className="toolbar-button secondary" onClick={() => setIsUtilityDrawerOpen(true)}>
          Open Utilities
        </button>
      </div>
    ),
  };

  return (
    <div className="planner-shell">
      <PlannerTopbar
        fixtureId={workspace.fixtureId}
        mode={workspace.request.mode}
        result={result}
        totalInventory={totalInventory}
        scheduledInventory={scheduledInventory}
        onSelectFixture={(id) => {
          const fixture = FIXTURES.find((item) => item.id === id);
          if (!fixture) return;
          replaceRequest(fixture.request, fixture.id);
        }}
        onSelectMode={(mode) =>
          setWorkspace((current) => ({
            ...current,
            request: { ...current.request, mode },
          }))
        }
        onOpenUtilities={() => setIsUtilityDrawerOpen(true)}
        onReset={() => replaceRequest(initialState.request, initialState.fixtureId)}
      />

      <div className="context-strip">
        <div className="context-pills">
          <span className="context-pill">Fixture: {activeFixture?.name ?? 'Custom'}</span>
          <span className="context-pill">Mode: {modeLabels[workspace.request.mode]}</span>
          <span className="context-pill">Capacity: {capacityLabels[workspace.request.scenario.capacityMode]}</span>
        </div>
        <p className="context-description">{activeFixture?.description ?? 'Live custom scenario driven by workbook edits and utility imports.'}</p>
      </div>

      <div className="workbook-layout">
        <WorkbookRail
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          remainingInventory={remainingInventory}
          years={workspace.request.scenario.years}
          overrideRowCount={
            workspace.request.manualOverrides.annualBucketTargets.length +
            workspace.request.manualOverrides.perRigTargets.length +
            workspace.request.manualOverrides.forcedAllocations.length
          }
        />

        <section className="workbook-stage">
          <div className="stage-header">
            <div>
              <span className="pill-label">{activeSectionMeta.label}</span>
              <h2>{activeSectionMeta.title}</h2>
              <p>{activeSectionMeta.subtitle}</p>
            </div>
            {sectionActions[activeSection]}
          </div>

          {activeSection === 'INVENTORY' ? (
            <InventorySection
              rowData={inventoryGridRows}
              columnDefs={inventoryColumnDefs}
              defaultColDef={defaultColDef}
              onCellValueChanged={(event) => inventoryGridChanged(event, updateInventory)}
            />
          ) : null}
          {activeSection === 'CONSTRAINTS' ? (
            <ConstraintsSection
              scenario={workspace.request.scenario}
              autoFillRemaining={workspace.request.manualOverrides.autoFillRemaining}
              rowData={constraintsGridRows}
              columnDefs={constraintsColumnDefs}
              defaultColDef={defaultColDef}
              onCellValueChanged={(event) => constraintsGridChanged(event, updateScenario)}
              syncYears={syncYears}
              updateScenario={updateScenario}
              setAutoFillRemaining={setAutoFillRemaining}
            />
          ) : null}
          {activeSection === 'OVERRIDES' ? (
            <OverridesSection
              activeOverrideSection={activeOverrideSection}
              setActiveOverrideSection={setActiveOverrideSection}
              defaultColDef={defaultColDef}
              annualOverrideRows={annualOverrideRows}
              annualOverrideColumns={annualOverrideColumns}
              onAnnualChanged={(event) => annualOverrideChanged(event, updateManualYear)}
              rigOverrideRows={rigOverrideRows}
              rigOverrideColumns={rigOverrideColumns}
              onRigChanged={(event) => rigOverrideChanged(event, updateManualRig)}
              forcedOverrideRows={forcedOverrideRows}
              forcedOverrideColumns={forcedOverrideColumns}
              onForcedChanged={(event) => forcedOverrideChanged(event, updateForced)}
            />
          ) : null}
          {activeSection === 'RESULTS' ? (
            <ResultsSection
              result={result}
              scheduledInventory={scheduledInventory}
              remainingInventory={remainingInventory}
              years={workspace.request.scenario.years}
              rigStartDate={workspace.request.scenario.rigStartDate}
              horizonDays={horizonDays}
              rigOptions={rigOptions}
              defaultColDef={defaultColDef}
              annualSummaryColumns={annualSummaryColumns}
              remainingColumns={remainingColumns}
            />
          ) : null}
        </section>
      </div>

      {isUtilityDrawerOpen ? (
        <UtilityDrawer
          jsonDraft={jsonDraft}
          jsonError={jsonError}
          fileInputRef={fileInputRef}
          onClose={() => setIsUtilityDrawerOpen(false)}
          onSyncFromState={() => setJsonDraft(JSON.stringify(workspace.request, null, 2))}
          onApplyJsonDraft={applyJsonDraft}
          onDownloadJson={downloadJson}
          onUploadFile={(file) => void importFile(file)}
          onDraftChange={(value) => {
            setJsonDraft(value);
            setJsonError('');
          }}
        />
      ) : null}
    </div>
  );
};

export default App;
