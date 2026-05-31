import type { CellValueChangedEvent, ColDef } from 'ag-grid-community';
import {
  OVERRIDE_SECTIONS,
  type AnnualOverrideRow,
  type ForcedOverrideRow,
  type OverrideSection,
  type RigOverrideRow,
} from '../../shared';
import { WorkbookGrid } from '../WorkbookGrid';

interface OverridesSectionProps {
  activeOverrideSection: OverrideSection;
  setActiveOverrideSection: (section: OverrideSection) => void;
  defaultColDef: ColDef;
  annualOverrideRows: AnnualOverrideRow[];
  annualOverrideColumns: ColDef<AnnualOverrideRow>[];
  onAnnualChanged: (event: CellValueChangedEvent<AnnualOverrideRow>) => void;
  rigOverrideRows: RigOverrideRow[];
  rigOverrideColumns: ColDef<RigOverrideRow>[];
  onRigChanged: (event: CellValueChangedEvent<RigOverrideRow>) => void;
  forcedOverrideRows: ForcedOverrideRow[];
  forcedOverrideColumns: ColDef<ForcedOverrideRow>[];
  onForcedChanged: (event: CellValueChangedEvent<ForcedOverrideRow>) => void;
}

export const OverridesSection = ({
  activeOverrideSection,
  setActiveOverrideSection,
  defaultColDef,
  annualOverrideRows,
  annualOverrideColumns,
  onAnnualChanged,
  rigOverrideRows,
  rigOverrideColumns,
  onRigChanged,
  forcedOverrideRows,
  forcedOverrideColumns,
  onForcedChanged,
}: OverridesSectionProps) => (
  <div className="section-grid-stack">
    <div className="subtab-row">
      {OVERRIDE_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
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
        onCellValueChanged={onAnnualChanged}
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
        onCellValueChanged={onRigChanged}
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
        onCellValueChanged={onForcedChanged}
        height={480}
        emptyMessage="No forced overrides defined."
      />
    ) : null}
  </div>
);
