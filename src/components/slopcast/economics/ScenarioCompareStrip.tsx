import React, { useMemo, useState } from 'react';
import type { DealMetrics, MonthlyCashFlow, Scenario, Well, WellGroup } from '../../../types';
import { buildWhatChanged } from './derived';

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

  return (
    <div className="rounded-panel border border-theme-border bg-theme-surface1/55 shadow-card p-3 theme-transition relative">
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xl:w-[380px]">
          <label className="space-y-1">
            <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted">Scenario</span>
            <select
              value={activeScenario.id}
              onChange={(event) => onSetActiveScenarioId(event.target.value)}
              className="w-full rounded-inner border border-theme-border bg-theme-bg px-3 py-2 text-xs font-semibold text-theme-text outline-none focus:border-theme-cyan"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted">Compare to</span>
            <select
              value={baseScenario.id}
              disabled
              className="w-full rounded-inner border border-theme-border bg-theme-bg/70 px-3 py-2 text-xs font-semibold text-theme-muted outline-none"
            >
              <option>{baseScenario.name}</option>
            </select>
          </label>
        </div>

        <div className="flex-1 flex flex-wrap items-center gap-2">
          {scenarios.map((scenario) => {
            const active = scenario.id === activeScenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSetActiveScenarioId(scenario.id)}
                className={`rounded-inner border px-3 py-2 text-[9px] font-black uppercase tracking-[0.13em] transition-colors ${
                  active
                    ? 'border-theme-cyan bg-theme-cyan/12 text-theme-cyan'
                    : 'border-theme-border bg-theme-bg text-theme-muted hover:text-theme-text'
                }`}
              >
                {scenario.isBaseCase ? 'Base' : scenario.name.replace(/scenario/i, '').trim()}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="rounded-inner border border-theme-cyan/40 bg-theme-cyan/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-theme-cyan hover:bg-theme-cyan/15 transition-colors"
          >
            What Changed? <span className="ml-1 rounded-full bg-theme-cyan/20 px-1.5 py-0.5">{changes.length}</span>
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
