import React, { useMemo, useState } from 'react';
import type { DealMetrics, MonthlyCashFlow, Scenario, Well, WellGroup } from '../../../types';
import { buildWhatChanged, currency, ratio } from './derived';

interface ScenarioCompareStripProps {
  activeGroup: WellGroup;
  wells: Well[];
  scenarios: Scenario[];
  activeScenarioId: string;
  onSetActiveScenarioId: (id: string) => void;
  baseScenario: Scenario;
  aggregateFlow: MonthlyCashFlow[];
  aggregateMetrics: DealMetrics;
}

const ScenarioCompareStrip: React.FC<ScenarioCompareStripProps> = ({
  activeGroup,
  wells,
  scenarios,
  activeScenarioId,
  onSetActiveScenarioId,
  baseScenario,
  aggregateFlow,
  aggregateMetrics,
}) => {
  const [open, setOpen] = useState(false);
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? baseScenario;
  const changes = useMemo(
    () => buildWhatChanged({ activeGroup, wells, activeScenario, baseScenario, aggregateFlow, aggregateMetrics }),
    [activeGroup, aggregateFlow, aggregateMetrics, activeScenario, baseScenario, wells],
  );
  const activeIsBase = activeScenario.id === baseScenario.id;
  const scenarioSummary = (scenario: Scenario) => {
    const priceChanged = scenario.pricing.oilPrice !== baseScenario.pricing.oilPrice || scenario.pricing.gasPrice !== baseScenario.pricing.gasPrice;
    if (priceChanged) return `WTI ${currency(scenario.pricing.oilPrice, 0)} | Gas ${currency(scenario.pricing.gasPrice, 2)}`;
    if (scenario.productionScalar !== 1 || scenario.capexScalar !== 1) return `Prod ${ratio(scenario.productionScalar)} | CAPEX ${ratio(scenario.capexScalar)}`;
    return 'Flat price | Base costs';
  };

  return (
    <div className="rounded-panel border border-theme-border bg-theme-surface1/55 shadow-card px-3 py-2 theme-transition relative">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 lg:w-32">
          <span className="text-[9px] font-black uppercase tracking-[0.12em] text-theme-muted">Scenario</span>
          <span className="hidden lg:inline text-[10px] text-theme-muted">
            {activeIsBase ? 'Base active' : `vs ${baseScenario.name}`}
          </span>
        </div>

        <div className="flex-1 flex items-stretch gap-1 overflow-x-auto pb-1 lg:pb-0">
          {scenarios.map((scenario) => {
            const active = scenario.id === activeScenario.id;
            const base = scenario.id === baseScenario.id;
            const label = scenario.isBaseCase ? 'Base' : scenario.name.replace(/scenario/i, '').trim();
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSetActiveScenarioId(scenario.id)}
                aria-pressed={active}
                aria-current={active ? 'true' : undefined}
                className={`min-w-[132px] rounded-inner border px-3 py-2 text-left transition-colors ${
                  active
                    ? 'border-theme-cyan bg-theme-cyan/12 text-theme-text'
                    : 'border-theme-border/70 bg-theme-bg/80 text-theme-muted hover:text-theme-text'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-[0.08em] ${active ? 'text-theme-cyan' : ''}`}>
                    {label}
                  </span>
                  {base && <span className="text-[8px] font-black uppercase tracking-[0.08em] text-theme-muted">Base</span>}
                </span>
                <span className="mt-1 block text-[10px] font-semibold normal-case tracking-normal text-theme-muted">
                  {scenarioSummary(scenario)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-inner border border-theme-cyan/35 bg-theme-cyan/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-theme-cyan hover:bg-theme-cyan/15 transition-colors whitespace-nowrap"
          >
            What changed <span className="ml-1 rounded-full bg-theme-cyan/20 px-1.5 py-0.5">{changes.length}</span>
          </button>
          {open && (
            <div className="absolute right-0 top-full z-30 mt-2 w-[min(420px,calc(100vw-2rem))] rounded-panel border border-theme-border bg-theme-surface1 shadow-card p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-cyan">Scenario deltas</p>
              <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-theme-border/35">
                {changes.length > 0 ? changes.map((change) => (
                  <div key={`${change.module}-${change.label}`} className="py-2 grid grid-cols-[1fr_auto] gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-theme-text">{change.label}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-theme-muted">{change.module}</p>
                    </div>
                    <p className="text-right tabular-nums text-theme-muted">
                      {change.from} <span className="text-theme-cyan">→</span> <span className="text-theme-text">{change.to}</span>
                    </p>
                  </div>
                )) : (
                  <p className="py-6 text-center text-xs text-theme-muted">No modeled differences from the base scenario.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioCompareStrip;
