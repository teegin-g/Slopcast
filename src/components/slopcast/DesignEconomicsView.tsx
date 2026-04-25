import React from 'react';
import { ThemeId } from '../../theme/themes';
import { DealMetrics, MonthlyCashFlow, Scenario, Well, WellGroup } from '../../types';
import type { Phase1WorkflowId } from './workflowModel';
import OperationsConsole, { OperationsConsoleProps } from './OperationsConsole';
import EconomicsGroupBar from './EconomicsGroupBar';
import CapexModule from './economics/CapexModule';
import EconomicsContextRail from './economics/EconomicsContextRail';
import EconomicsModuleTabs from './economics/EconomicsModuleTabs';
import OpexModule from './economics/OpexModule';
import OwnershipModule from './economics/OwnershipModule';
import PricingModule from './economics/PricingModule';
import ProductionModule from './economics/ProductionModule';
import ScenarioCompareStrip from './economics/ScenarioCompareStrip';
import TaxesModule from './economics/TaxesModule';
import { currency, currencyMm, monthsToYears, ratio } from './economics/derived';
import { EconomicsModule, EconomicsModuleProps, getEconomicsModuleMeta } from './economics/types';

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
  activeWorkflow?: Phase1WorkflowId;
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

const DesignEconomicsView: React.FC<DesignEconomicsViewProps> = ({
  isClassic,
  themeId,
  mobilePanel,
  onSetMobilePanel,
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
  aggregateFlow,
  operationsProps,
  breakevenOilPrice,
  activeWorkflow = 'PDP',
}) => {
  const baseScenario = scenarios.find((scenario) => scenario.isBaseCase) ?? scenarios[0];
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? baseScenario;
  const meta = getEconomicsModuleMeta(economicsModule);

  const moduleProps: EconomicsModuleProps = {
    isClassic,
    activeWorkflow,
    activeGroup,
    groups,
    wells,
    scenarios,
    activeScenario,
    baseScenario,
    aggregateFlow,
    aggregateMetrics,
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
      <EconomicsGroupBar
        isClassic={isClassic}
        groups={groups}
        activeGroupId={activeGroupId}
        onActivateGroup={onActivateGroup}
        onCloneActiveGroup={() => onCloneGroup(activeGroupId)}
      />

      <div
        className={`lg:hidden border p-2 theme-transition ${
          isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 border-theme-border shadow-card backdrop-blur-sm'
        }`}
      >
        <div className="grid grid-cols-2 gap-2">
          {[
            ['SETUP', 'Context'],
            ['RESULTS', 'Workspace'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSetMobilePanel(id as EconomicsMobilePanel)}
              className={`px-3 py-2 rounded-inner text-[9px] font-bold uppercase tracking-widest border transition-colors ${
                mobilePanel === id
                  ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                  : 'bg-theme-bg text-theme-muted border-theme-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4 lg:min-h-[calc(100vh-16rem)]">
        <div className={mobilePanel !== 'SETUP' ? 'hidden lg:block' : ''}>
          <EconomicsContextRail
            activeGroup={activeGroup}
            wells={wells}
            activeScenario={activeScenario}
            aggregateMetrics={aggregateMetrics}
            aggregateFlow={aggregateFlow}
            breakevenOilPrice={breakevenOilPrice}
          />
        </div>

        <section className={`space-y-4 min-w-0 ${mobilePanel !== 'RESULTS' ? 'hidden lg:block' : ''}`}>
          <ScenarioCompareStrip
            activeGroup={activeGroup}
            wells={wells}
            scenarios={scenarios}
            activeScenarioId={activeScenario.id}
            onSetActiveScenarioId={onSetActiveScenarioId}
            baseScenario={baseScenario}
            aggregateFlow={aggregateFlow}
            aggregateMetrics={aggregateMetrics}
          />

          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3">
          <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-theme-muted">
                {activeWorkflow === 'PDP' ? 'PDP Forecast & Economics' : 'Economics'}
              </p>
              <h1 className="mt-1 text-xl font-black tracking-normal text-theme-text">{meta.label}</h1>
            </div>
            <p className="max-w-2xl text-xs text-theme-muted">{meta.eyebrow}</p>
          </div>

          <EconomicsModuleTabs module={economicsModule} onChange={onSetEconomicsModule} activeWorkflow={activeWorkflow} />
          {moduleCanvas}
        </section>
      </div>

      <div className="space-y-3">
        <BottomKpiStrip metrics={aggregateMetrics} breakevenOilPrice={breakevenOilPrice} />
        <OperationsConsole {...operationsProps} showSelectionActions={false} compactEconomics />
      </div>
    </div>
  );
};

export default DesignEconomicsView;
