import type { CellValueChangedEvent, ColDef } from 'ag-grid-community';
import type { CapacityMode, ScheduleScenario } from '../../types';
import { capacityLabels, toNumber, type ConstraintsGridRow } from '../../shared';
import { WorkbookGrid } from '../WorkbookGrid';

interface ConstraintsSectionProps {
  scenario: ScheduleScenario;
  autoFillRemaining: boolean;
  rowData: ConstraintsGridRow[];
  columnDefs: ColDef<ConstraintsGridRow>[];
  defaultColDef: ColDef;
  onCellValueChanged: (event: CellValueChangedEvent<ConstraintsGridRow>) => void;
  syncYears: (years: number) => void;
  updateScenario: (updater: (scenario: ScheduleScenario) => ScheduleScenario) => void;
  setAutoFillRemaining: (value: boolean) => void;
}

export const ConstraintsSection = ({
  scenario,
  autoFillRemaining,
  rowData,
  columnDefs,
  defaultColDef,
  onCellValueChanged,
  syncYears,
  updateScenario,
  setAutoFillRemaining,
}: ConstraintsSectionProps) => (
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
            value={scenario.years}
            onChange={(event) => syncYears(Math.max(1, toNumber(event.target.value)))}
          />
        </label>
        <label className="field">
          <span>Rig Start Date</span>
          <input
            type="date"
            value={scenario.rigStartDate}
            onChange={(event) =>
              updateScenario((current) => ({ ...current, rigStartDate: event.target.value }))
            }
          />
        </label>
        <label className="field">
          <span>Capacity Mode</span>
          <select
            value={scenario.capacityMode}
            onChange={(event) =>
              updateScenario((current) => ({ ...current, capacityMode: event.target.value as CapacityMode }))
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
            value={scenario.discountRate ?? 0.1}
            onChange={(event) =>
              updateScenario((current) => ({ ...current, discountRate: toNumber(event.target.value) }))
            }
          />
        </label>
        {scenario.capacityMode === 'RATE' ? (
          <label className="field">
            <span>Wells / Rig / Year</span>
            <input
              type="number"
              min={0}
              value={scenario.wellsPerRigPerYear ?? 0}
              onChange={(event) =>
                updateScenario((current) => ({
                  ...current,
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
              value={scenario.drillCycleDays ?? 90}
              onChange={(event) =>
                updateScenario((current) => ({
                  ...current,
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
            checked={scenario.applyRigConstraint ?? true}
            onChange={(event) =>
              updateScenario((current) => ({ ...current, applyRigConstraint: event.target.checked }))
            }
          />
          <span>Enforce annual rig count</span>
        </label>
        <label className="toggle-pill">
          <input
            type="checkbox"
            checked={scenario.applyCapexConstraint ?? true}
            onChange={(event) =>
              updateScenario((current) => ({ ...current, applyCapexConstraint: event.target.checked }))
            }
          />
          <span>Enforce annual CAPEX budget</span>
        </label>
        <label className="toggle-pill">
          <input
            type="checkbox"
            checked={autoFillRemaining}
            onChange={(event) => setAutoFillRemaining(event.target.checked)}
          />
          <span>Auto-fill remaining capacity</span>
        </label>
      </div>
    </div>

    <WorkbookGrid
      testId="constraints-grid"
      rowData={rowData}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      onCellValueChanged={onCellValueChanged}
      height={440}
    />
  </div>
);
