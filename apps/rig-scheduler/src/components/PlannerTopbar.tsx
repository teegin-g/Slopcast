import { FIXTURES } from '../data/fixtures';
import type { ScheduleRunResult, SchedulerMode } from '../types';
import { fmtCompact, modeLabels } from '../shared';
import { MetricTile } from './MetricTile';

interface PlannerTopbarProps {
  fixtureId: string;
  mode: SchedulerMode;
  result: ScheduleRunResult;
  totalInventory: number;
  scheduledInventory: number;
  onSelectFixture: (fixtureId: string) => void;
  onSelectMode: (mode: SchedulerMode) => void;
  onOpenUtilities: () => void;
  onReset: () => void;
}

export const PlannerTopbar = ({
  fixtureId,
  mode,
  result,
  totalInventory,
  scheduledInventory,
  onSelectFixture,
  onSelectMode,
  onOpenUtilities,
  onReset,
}: PlannerTopbarProps) => (
  <header className="planner-topbar">
    <div className="brand-block">
      <p className="eyebrow">Standalone Prototype</p>
      <h1>Rig Planner Workbook</h1>
      <p className="lede">Spreadsheet-style scheduling for undeveloped inventory, tuned for desktop decision work instead of long-form scrolling.</p>
    </div>

    <div className="topbar-controls">
      <label className="mini-field">
        <span>Fixture</span>
        <select aria-label="Fixture" value={fixtureId} onChange={(event) => onSelectFixture(event.target.value)}>
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
        <select aria-label="Mode" value={mode} onChange={(event) => onSelectMode(event.target.value as SchedulerMode)}>
          {Object.entries(modeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="topbar-button-row">
        <button type="button" aria-label="Open utility drawer" className="toolbar-button secondary" onClick={onOpenUtilities}>
          Utilities
        </button>
        <button type="button" aria-label="Reset workbook" className="toolbar-button secondary" onClick={onReset}>
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
);
