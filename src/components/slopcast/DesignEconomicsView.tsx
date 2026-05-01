import React from 'react';
import { ThemeId } from '../../theme/themes';
import { DealMetrics, MonthlyCashFlow, Scenario, Well, WellGroup } from '../../types';
import OperationsConsole, { OperationsConsoleProps } from './OperationsConsole';
import EconomicsGroupBar from './EconomicsGroupBar';
import CapexModule from './economics/CapexModule';
import EconomicsModuleTabs from './economics/EconomicsModuleTabs';
import OpexModule from './economics/OpexModule';
import OwnershipModule from './economics/OwnershipModule';
import PricingModule from './economics/PricingModule';
import ProductionModule from './economics/ProductionModule';
import ScenarioCompareStrip from './economics/ScenarioCompareStrip';
import TaxesModule from './economics/TaxesModule';
import { currency, currencyMm, getFlow, getMetrics, monthsToYears, ratio } from './economics/derived';
import { EconomicsModule, EconomicsModuleProps } from './economics/types';

export type EconomicsMobilePanel = 'SETUP' | 'RESULTS';

interface DesignEconomicsViewProps {
  isClassic: boolean;
  themeId: ThemeId;
  mobilePanel: EconomicsMobilePanel;
  onSetMobilePanel: (panel: EconomicsMobilePanel) => void;
  economicsModule: EconomicsModule;
  onSetEconomicsModule: (module: EconomicsModule) => void;
  wells: Well[];
  groups: WellGroup[];
  activeGroupId: string;
  onActivateGroup: (id: string) => void;
  onCloneGroup: (groupId: string) => void;
  activeGroup: WellGroup;
  onUpdateGroup: (group: WellGroup) => void;
  onMarkDirty: () => void;
  scenarios: Scenario[];
  activeScenarioId: string;
  onSetActiveScenarioId: (id: string) => void;
  aggregateMetrics: DealMetrics;
  aggregateFlow: MonthlyCashFlow[];
  operationsProps: OperationsConsoleProps;
  breakevenOilPrice?: number | null;
}

const BottomKpiStrip: React.FC<{
  metrics: DealMetrics;
  breakevenOilPrice?: number | null;
}> = ({ metrics, breakevenOilPrice }) => {
  const payout = metrics.payoutMonths > 0 ? `${monthsToYears(metrics.payoutMonths).toFixed(1)} yrs` : '-';
  const capitalRatio = metrics.totalCapex > 0 ? metrics.npv10 / metrics.totalCapex : 0;
  const items = [
    { label: 'NPV10', value: currencyMm(metrics.npv10), delta: 'live' },
    { label: 'EUR', value: `${(metrics.eur / 1e3).toFixed(0)} Mbo`, delta: `${metrics.wellCount} wells` },
    { label: 'Payout', value: payout, delta: 'undisc.' },
    { label: 'Breakeven WTI', value: breakevenOilPrice != null ? currency(breakevenOilPrice, 1) : 'N/A', delta: 'per bbl' },
    { label: 'Ratio', value: ratio(capitalRatio), delta: 'NPV / CAPEX' },
  ];

  return (
    <div className="rounded-panel border border-theme-border bg-theme-surface1/70 shadow-card p-2">
      <p className="px-1 pb-2 text-[9px] font-black uppercase tracking-[0.12em] text-theme-muted">Portfolio</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-inner border border-theme-border bg-theme-bg px-3 py-2 min-h-[58px]">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted">{item.label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="text-sm lg:text-base font-black text-theme-text tabular-nums">{item.value}</p>
              <p className="text-[9px] font-semibold text-theme-cyan whitespace-nowrap">{item.delta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GroupPulse: React.FC<{
  metrics: DealMetrics;
}> = ({ metrics }) => {
  const payout = metrics.payoutMonths > 0 ? `${monthsToYears(metrics.payoutMonths).toFixed(1)} yrs` : '-';
  const items = [
    { label: 'NPV10', value: currencyMm(metrics.npv10) },
    { label: 'Payout', value: payout },
    { label: 'CAPEX', value: currencyMm(metrics.totalCapex) },
    { label: 'EUR', value: `${(metrics.eur / 1e3).toFixed(0)} Mbo` },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-inner border border-theme-border bg-theme-bg/75 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-theme-muted">{item.label}</p>
          <p className="mt-1 text-sm font-black text-theme-text tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

const DesignEconomicsView: React.FC<DesignEconomicsViewProps> = ({
  isClassic,
  economicsModule,
  onSetEconomicsModule,
  wells,
  groups,
  activeGroupId,
  onActivateGroup,
  onCloneGroup,
  activeGroup,
  onUpdateGroup,
  onMarkDirty,
  scenarios,
  activeScenarioId,
  onSetActiveScenarioId,
  aggregateMetrics,
  operationsProps,
  breakevenOilPrice,
}) => {
  const baseScenario = scenarios.find((scenario) => scenario.isBaseCase) ?? scenarios[0];
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? baseScenario;
  const selectedGroupMetrics = getMetrics(activeGroup);
  const selectedGroupFlow = getFlow(activeGroup);

  const moduleProps: EconomicsModuleProps = {
    isClassic,
    activeGroup,
    groups,
    wells,
    scenarios,
    activeScenario,
    baseScenario,
    aggregateFlow: selectedGroupFlow,
    aggregateMetrics: selectedGroupMetrics,
    breakevenOilPrice,
    onUpdateGroup,
    onMarkDirty,
  };

  const moduleCanvas = (() => {
    switch (economicsModule) {
      case 'PRICING':
        return <PricingModule {...moduleProps} />;
      case 'OPEX':
        return <OpexModule {...moduleProps} />;
      case 'TAXES':
        return <TaxesModule {...moduleProps} />;
      case 'OWNERSHIP':
        return <OwnershipModule {...moduleProps} />;
      case 'CAPEX':
        return <CapexModule {...moduleProps} />;
      case 'PRODUCTION':
      default:
        return <ProductionModule {...moduleProps} />;
    }
  })();

  return (
    <div className="space-y-4">
      <div className={`lg:sticky lg:top-0 lg:z-20 space-y-3 border p-3 theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/75 border-theme-border shadow-card backdrop-blur-sm'
      }`}>
        <ScenarioCompareStrip
          activeGroup={activeGroup}
          wells={wells}
          scenarios={scenarios}
          activeScenarioId={activeScenario.id}
          onSetActiveScenarioId={onSetActiveScenarioId}
          baseScenario={baseScenario}
          aggregateFlow={selectedGroupFlow}
          aggregateMetrics={selectedGroupMetrics}
        />

        <EconomicsGroupBar
          isClassic={isClassic}
          groups={groups}
          wells={wells}
          activeGroupId={activeGroupId}
          onActivateGroup={onActivateGroup}
          onCloneActiveGroup={() => onCloneGroup(activeGroupId)}
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)] lg:items-end">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-theme-muted">Driver</p>
              <button
                type="button"
                onClick={operationsProps.onSaveSnapshot}
                disabled={!operationsProps.canUseSecondaryActions}
                className="rounded-inner border border-theme-cyan/35 bg-theme-cyan/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-theme-cyan transition-colors hover:bg-theme-cyan/15 disabled:cursor-not-allowed disabled:border-theme-border disabled:bg-theme-bg disabled:text-theme-muted"
              >
                Save Snapshot
              </button>
            </div>
            <EconomicsModuleTabs module={economicsModule} onChange={onSetEconomicsModule} variant="compact" />
          </div>
          <GroupPulse metrics={selectedGroupMetrics} />
        </div>
      </div>

      <section className="min-w-0 space-y-4">
        {moduleCanvas}
      </section>

      <div className="space-y-3">
        <BottomKpiStrip metrics={aggregateMetrics} breakevenOilPrice={breakevenOilPrice} />
        <details className="rounded-panel border border-theme-border bg-theme-surface1/55 shadow-card">
          <summary className="cursor-pointer px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-theme-muted">
            Operations
          </summary>
          <div className="border-t border-theme-border p-3">
            <OperationsConsole {...operationsProps} showSelectionActions={false} compactEconomics />
          </div>
        </details>
      </div>
    </div>
  );
};

export default DesignEconomicsView;
