import type { CellValueChangedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GRID_THEME_CLASS } from '../shared';

ModuleRegistry.registerModules([AllCommunityModule]);

declare global {
  interface Window {
    __rigPlannerGridApis?: Record<string, GridApi>;
  }
}

export function WorkbookGrid<RowData extends { id?: string }>({
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
