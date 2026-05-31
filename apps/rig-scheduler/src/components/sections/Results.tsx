import type { ColDef } from 'ag-grid-community';
import type { ScheduleRunResult } from '../../types';
import { fmtCompact, fmtCurrency } from '../../shared';
import { WorkbookGrid } from '../WorkbookGrid';

interface ResultsSectionProps {
  result: ScheduleRunResult;
  scheduledInventory: number;
  remainingInventory: number;
  years: number;
  rigStartDate: string;
  horizonDays: number;
  rigOptions: string[];
  defaultColDef: ColDef;
  annualSummaryColumns: ColDef<ScheduleRunResult['annualSummaries'][number]>[];
  remainingColumns: ColDef<ScheduleRunResult['remainingInventory'][number]>[];
}

export const ResultsSection = ({
  result,
  scheduledInventory,
  remainingInventory,
  years,
  rigStartDate,
  horizonDays,
  rigOptions,
  defaultColDef,
  annualSummaryColumns,
  remainingColumns,
}: ResultsSectionProps) => (
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
        {Array.from({ length: years }, (_, yearIndex) => (
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
              {result.events.flatMap((event) => {
                if (event.rigId !== rigId) return [];
                const start =
                  (new Date(`${event.spudDate}T00:00:00Z`).getTime() -
                    new Date(`${rigStartDate}T00:00:00Z`).getTime()) /
                  (24 * 60 * 60 * 1000);
                const end =
                  (new Date(`${event.onlineDate}T00:00:00Z`).getTime() -
                    new Date(`${rigStartDate}T00:00:00Z`).getTime()) /
                  (24 * 60 * 60 * 1000);

                return [
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
                  </div>,
                ];
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
