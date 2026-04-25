import React from 'react';
import type {
  PdpGroupForecastStatus,
  PdpReadinessStatus,
  Well,
  WellGroup,
  WellProductionHistoryStatus,
} from '../../types';
import { ReadinessChecklist } from './ReadinessChecklist';

const formatDate = (date: string | null) => date ?? 'Missing';
const number = (value: number, digits = 0) => value.toLocaleString(undefined, { maximumFractionDigits: digits });
const currencyMm = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;

const Panel: React.FC<{ title: string; eyebrow?: string; children: React.ReactNode; className?: string }> = ({
  title,
  eyebrow,
  children,
  className = '',
}) => (
  <section className={`rounded-panel border border-theme-border bg-theme-surface1/65 shadow-card theme-transition overflow-hidden ${className}`}>
    <div className="border-b border-theme-border/55 px-4 py-3">
      {eyebrow && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-cyan">{eyebrow}</p>}
      <h2 className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-theme-text">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const Metric: React.FC<{ label: string; value: string; detail?: string; tone?: string }> = ({ label, value, detail, tone = 'text-theme-cyan' }) => (
  <div className="rounded-inner border border-theme-border bg-theme-bg/75 px-3 py-3">
    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-theme-muted">{label}</p>
    <p className="mt-1 text-xl font-black tabular-nums text-theme-text">{value}</p>
    {detail && <p className={`mt-1 text-[10px] font-semibold ${tone}`}>{detail}</p>}
  </div>
);

interface PdpUniverseSurfaceProps {
  filteredWells: Well[];
  totalWellCount: number;
  operatorFilter: Set<string>;
  formationFilter: Set<string>;
  statusFilter: Set<string>;
  operatorOptions: string[];
  formationOptions: string[];
  statusOptions: string[];
  onToggleOperator: (value: string) => void;
  onToggleFormation: (value: string) => void;
  onToggleStatus: (value: string) => void;
  onResetFilters: () => void;
  historyByWellId: Record<string, WellProductionHistoryStatus>;
  summary: {
    producingWellCount: number;
    loadedWellCount: number;
    partialWellCount: number;
    missingWellCount: number;
    coveragePct: number;
    qualityFlags: string[];
  };
  onContinue: () => void;
}

export const PdpUniverseSurface: React.FC<PdpUniverseSurfaceProps> = ({
  filteredWells,
  totalWellCount,
  operatorFilter,
  formationFilter,
  statusFilter,
  operatorOptions,
  formationOptions,
  statusOptions,
  onToggleOperator,
  onToggleFormation,
  onToggleStatus,
  onResetFilters,
  historyByWellId,
  summary,
  onContinue,
}) => {
  const producingActive = statusFilter.has('PRODUCING');
  const preview = filteredWells.slice(0, 8);

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Panel title="Production Universe Filters" eyebrow="PDP Universe">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted">Status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onToggleStatus(status)}
                  className={`rounded-inner border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] ${
                    statusFilter.has(status) ? 'border-theme-cyan bg-theme-cyan/15 text-theme-cyan' : 'border-theme-border bg-theme-bg text-theme-muted'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            {!producingActive && (
              <button
                type="button"
                onClick={() => onToggleStatus('PRODUCING')}
                className="mt-2 w-full rounded-inner border border-theme-cyan/45 bg-theme-cyan/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-theme-cyan"
              >
                Default to producing wells
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted">Operator</p>
            <div className="space-y-2">
              {operatorOptions.map((operator) => (
                <button
                  key={operator}
                  type="button"
                  onClick={() => onToggleOperator(operator)}
                  className={`w-full rounded-inner border px-3 py-2 text-left text-[11px] ${
                    operatorFilter.has(operator) ? 'border-theme-magenta bg-theme-magenta/10 text-theme-text' : 'border-theme-border bg-theme-bg text-theme-muted'
                  }`}
                >
                  {operator}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted">Formation</p>
            <div className="flex flex-wrap gap-2">
              {formationOptions.map((formation) => (
                <button
                  key={formation}
                  type="button"
                  onClick={() => onToggleFormation(formation)}
                  className={`rounded-inner border px-3 py-2 text-[10px] font-semibold ${
                    formationFilter.has(formation) ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300' : 'border-theme-border bg-theme-bg text-theme-muted'
                  }`}
                >
                  {formation}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={onResetFilters} className="w-full rounded-inner border border-theme-border bg-theme-bg px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-theme-muted">
            Reset filters
          </button>
        </div>
      </Panel>

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Filtered Wells" value={number(filteredWells.length)} detail={`${number(totalWellCount)} total`} />
          <Metric label="Producing Wells" value={number(summary.producingWellCount)} detail="PDP candidates" tone="text-emerald-300" />
          <Metric label="History Coverage" value={`${summary.coveragePct.toFixed(0)}%`} detail={`${summary.loadedWellCount + summary.partialWellCount} loaded`} />
          <Metric label="Warnings" value={number(summary.qualityFlags.length)} detail={summary.qualityFlags[0] ?? 'Clean'} tone="text-amber-300" />
        </div>

        <Panel title="Historical Production Coverage" eyebrow="Loaded adapter">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Loaded" value={number(summary.loadedWellCount)} detail="complete streams" tone="text-emerald-300" />
            <Metric label="Partial" value={number(summary.partialWellCount)} detail="usable with warnings" tone="text-amber-300" />
            <Metric label="Missing" value={number(summary.missingWellCount)} detail="excluded from PDP forecast" tone="text-red-300" />
          </div>
          <div className="mt-4 rounded-inner border border-theme-border bg-theme-bg overflow-hidden">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] border-b border-theme-border bg-theme-surface1/70 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-theme-muted">
              <span>Well</span><span>Status</span><span>History</span><span>Last Prod</span><span>Flags</span>
            </div>
            {preview.map((well) => {
              const history = historyByWellId[well.id];
              return (
                <div key={well.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] border-b border-theme-border/35 px-3 py-2 text-[11px] text-theme-muted last:border-b-0">
                  <span className="font-semibold text-theme-text truncate">{well.name}</span>
                  <span>{well.status}</span>
                  <span>{history?.producingMonths ?? 0} mo</span>
                  <span>{formatDate(history?.lastProductionDate ?? null)}</span>
                  <span className="truncate">{history?.qualityFlags.join(', ') || 'Loaded'}</span>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={onContinue} className="mt-4 rounded-inner bg-theme-cyan px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-theme-bg shadow-glow-cyan">
            Continue to PDP wells
          </button>
        </Panel>
      </div>
    </div>
  );
};

interface PdpReviewSurfaceProps {
  groups: WellGroup[];
  summaries: PdpGroupForecastStatus[];
  readiness: PdpReadinessStatus;
  activeScenarioName: string;
  onAcknowledge: (groupId: string) => void;
  onOpenScenarios: () => void;
}

export const PdpReviewSurface: React.FC<PdpReviewSurfaceProps> = ({
  groups,
  summaries,
  readiness,
  activeScenarioName,
  onAcknowledge,
  onOpenScenarios,
}) => {
  const activeGroups = groups.filter((group) => group.wellIds.size > 0);
  const npv = activeGroups.reduce((sum, group) => sum + (group.metrics?.npv10 ?? 0), 0);
  const eur = activeGroups.reduce((sum, group) => sum + (group.metrics?.eur ?? 0), 0);
  const currentOil = summaries.reduce((sum, summary) => sum + summary.currentOilBblPerDay, 0);
  const flaggedGroups = activeGroups.filter((group) => group.pdpForecast?.qualityFlags.length);
  const items = [
    { label: 'Historical production data loaded', done: readiness.productionDataLoaded },
    { label: 'PDP groups selected', done: readiness.groupsSelected },
    { label: 'Production forecasts generated', done: readiness.forecastsGenerated },
    { label: 'LOE/OPEX forecast assigned', done: readiness.opexForecastAssigned },
    { label: 'Ownership and taxes assigned', done: readiness.ownershipTaxesAssigned },
    { label: 'Economics calculated', done: readiness.economicsCalculated },
    { label: 'Data quality issues acknowledged', done: readiness.dataQualityAcknowledged },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="PDP NPV10" value={currencyMm(npv)} detail={activeScenarioName} />
          <Metric label="PDP EUR" value={`${number(eur / 1_000, 0)} Mbo`} detail={`${activeGroups.length} groups`} tone="text-emerald-300" />
          <Metric label="Current Oil" value={`${number(currentOil, 0)} bopd`} detail="last loaded month" />
          <Metric label="Risk Flags" value={number(flaggedGroups.length)} detail="groups needing review" tone="text-amber-300" />
        </div>

        <Panel title="PDP Group Forecast Status" eyebrow="Review">
          <div className="space-y-3">
            {activeGroups.map((group) => {
              const summary = group.pdpForecast;
              return (
                <div key={group.id} className="rounded-inner border border-theme-border bg-theme-bg p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-theme-text truncate">{group.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-theme-muted">
                        {summary?.loadedWellCount ?? 0} loaded / {summary?.partialWellCount ?? 0} partial / {summary?.missingWellCount ?? 0} missing
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAcknowledge(group.id)}
                      className="rounded-inner border border-theme-border bg-theme-surface1 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted"
                    >
                      {group.dataQualityAcknowledged ? 'Acknowledged' : 'Acknowledge quality'}
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <Metric label="Last Prod" value={formatDate(summary?.lastProductionDate ?? null)} detail="coverage end" />
                    <Metric label="Oil Rate" value={`${number(summary?.currentOilBblPerDay ?? 0)} bopd`} detail="current" />
                    <Metric label="LOE/BOE" value={`$${(summary?.averageLoePerBoe ?? 0).toFixed(2)}`} detail="fixture estimate" tone="text-amber-300" />
                    <Metric label="Flags" value={number(summary?.qualityFlags.length ?? 0)} detail={summary?.qualityFlags[0] ?? 'Clean'} tone="text-amber-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <ReadinessChecklist items={items} />
        <Panel title="Scenario Handoff" eyebrow="PDP case">
          <p className="text-sm leading-6 text-theme-muted">
            This PDP case is scenario-ready when production history, generated forecasts, LOE/OPEX assumptions, and quality acknowledgements are complete.
          </p>
          <button type="button" onClick={onOpenScenarios} className="mt-4 w-full rounded-inner bg-theme-cyan px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-theme-bg shadow-glow-cyan">
            Send PDP case to scenarios
          </button>
        </Panel>
      </div>
    </div>
  );
};

export const UndevelopedPendingSurface: React.FC<{ stageLabel: string }> = ({ stageLabel }) => (
  <Panel title={`Undeveloped ${stageLabel}`} eyebrow="Phase 3 pending">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <p className="text-sm leading-7 text-theme-muted">
        Undeveloped remains visible in the workflow shell, but DSU creation, planned well inventory, spacing, type curve, CAPEX, and schedule controls are intentionally gated until the Phase 3 thin slice.
      </p>
      <div className="rounded-inner border border-theme-border bg-theme-bg p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-theme-cyan">Next phase inputs</p>
        <ul className="mt-3 space-y-2 text-xs text-theme-muted">
          <li>Development groups and DSUs</li>
          <li>Spacing and bench assignments</li>
          <li>Type curve, CAPEX, and schedule assumptions</li>
        </ul>
      </div>
    </div>
  </Panel>
);
