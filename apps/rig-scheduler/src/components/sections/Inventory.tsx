import type { CellValueChangedEvent, ColDef } from 'ag-grid-community';
import type { InventoryBucket } from '../../types';
import { WorkbookGrid } from '../WorkbookGrid';

interface InventorySectionProps {
  rowData: InventoryBucket[];
  columnDefs: ColDef<InventoryBucket>[];
  defaultColDef: ColDef;
  onCellValueChanged: (event: CellValueChangedEvent<InventoryBucket>) => void;
}

export const InventorySection = ({
  rowData,
  columnDefs,
  defaultColDef,
  onCellValueChanged,
}: InventorySectionProps) => (
  <div className="section-grid-stack">
    <div className="note-card">
      <span className="pill-label">Grid behavior</span>
      <p>Single-click edit, tab across cells, and pin the bucket name while scanning economics and timing assumptions.</p>
    </div>
    <WorkbookGrid
      testId="inventory-grid"
      rowData={rowData}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      onCellValueChanged={onCellValueChanged}
      height={520}
    />
  </div>
);
