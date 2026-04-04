import React, { useState, useMemo } from 'react';
import { WellGroup, Well, Scenario, SensitivityVariable, ScheduleParams } from '../types';
import { calculateEconomics } from '../utils/economics';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import SensitivityMatrix from './SensitivityMatrix';
import { generateSensitivityMatrix } from '../utils/economics';
import { useTheme } from '../theme/ThemeProvider';
import { DEFAULT_COMMODITY_PRICING } from '../constants';
import { useStableChartContainer } from './slopcast/hooks/useStableChartContainer';
import { AnimatedButton } from './slopcast/AnimatedButton';
import SectionCard from './slopcast/SectionCard';

interface ScenarioDashboardProps {
  groups: WellGroup[]; 
  wells: Well[];
  scenarios: Scenario[];
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
}

const DEFAULT_SCHEDULE: ScheduleParams = { 
    annualRigs: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], 
    drillDurationDays: 18, 
    stimDurationDays: 12, 
    rigStartDate: new Date().toISOString().split('T')[0] 
};

interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
  useBrandFont?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, isOpen, onClick, children, useBrandFont }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;
  const sectionId = `scenario-dashboard-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  if (isClassic) {
    return (
      <div className="sc-panel theme-transition mb-3">
        <button
          type="button"
          onClick={onClick}
          aria-expanded={isOpen}
          aria-controls={`${sectionId}-content`}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-all sc-panelTitlebar sc-titlebar--red focus-ring"
        >
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-white ${useBrandFont ? 'brand-font' : 'heading-font'}`}>{title}</span>
          <span className={`transform transition-transform opacity-30 text-white motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isOpen && (
          <div id={`${sectionId}-content`} className="p-4">
            <div className="sc-insetDark rounded-inner p-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`mb-3 overflow-hidden rounded-panel border transition-all duration-300 motion-reduce:transition-none ${isOpen ? 'border-theme-magenta bg-theme-surface1 shadow-glow-magenta' : 'border-theme-border bg-theme-surface1/40'}`}>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={`${sectionId}-content`}
        className={`focus-ring flex w-full items-center justify-between px-5 py-4 text-left transition-all motion-reduce:transition-none ${isOpen ? 'text-theme-cyan' : 'text-theme-muted hover:text-theme-text'}`}
      >
        <span className={`typo-section ${useBrandFont ? 'brand-font' : 'heading-font'}`}>{title}</span>
        <span className={`transform transition-transform opacity-30 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div id={`${sectionId}-content`} className="border-t border-theme-border/20 p-5">{children}</div>}
    </div>
  );
};

const ScenarioDashboard: React.FC<ScenarioDashboardProps> = ({ groups, wells, scenarios, setScenarios }) => {
  const { theme } = useTheme();
  const { chartPalette } = theme;
  const isClassic = theme.features.isClassicTheme;

  const [activeScenarioId, setActiveScenarioId] = useState<string>('s-base');
  const [editingScenario, setEditingScenario] = useState<boolean>(false);
  const [openSection, setOpenSection] = useState<'PRICING' | 'SCHEDULE' | 'SCALARS'>('PRICING');

  const [sensX, setSensX] = useState<SensitivityVariable>('OIL_PRICE');
  const [sensY, setSensY] = useState<SensitivityVariable>('RIG_COUNT');

  const scenarioResults = useMemo(() => {
    return scenarios.map(scenario => {
        let scenarioNpv = 0;
        let scenarioCapex = 0;
        let scenarioEur = 0;
        let scenarioRevenue = 0;
        let scenarioOpex = 0;
        const cumulativeFlows = new Array(120).fill(0);

        groups.forEach(group => {
            const groupWells = wells.filter(w => group.wellIds.has(w.id));
            const { flow, metrics } = calculateEconomics(
              groupWells,
              group.typeCurve,
              group.capex,
              scenario.pricing,
              group.opex,
              group.ownership,
              { capex: scenario.capexScalar, production: scenario.productionScalar },
              scenario.schedule
            );
            scenarioNpv += metrics.npv10;
            scenarioCapex += metrics.totalCapex;
            scenarioEur += metrics.eur;
            flow.forEach((f, i) => { if(i < 120) cumulativeFlows[i] += f.netCashFlow; });
            flow.forEach((f) => { scenarioRevenue += f.revenue; scenarioOpex += f.opex; });
        });

        let runningCum = 0;
        return {
            scenario,
            metrics: {
              npv10: scenarioNpv,
              totalCapex: scenarioCapex,
              eur: scenarioEur,
              roi: scenarioCapex > 0 ? (scenarioRevenue - scenarioOpex) / scenarioCapex : 0,
            },
            flow: cumulativeFlows.map(cf => { runningCum += cf; return runningCum; })
        };
    }).sort((a,b) => b.metrics.npv10 - a.metrics.npv10);
  }, [groups, wells, scenarios]);

  const cfChartData = useMemo(() => {
      const data = [];
      for(let i=0; i<120; i++) {
          const pt: any = { month: i+1 };
          scenarioResults.forEach(res => { pt[res.scenario.id] = res.flow[i]; });
          data.push(pt);
      }
      return data;
  }, [scenarioResults]);
  const overlayChart = useStableChartContainer([theme.id, scenarios.length, cfChartData.length]);

  const sensitivityData = useMemo(() => {
      const getSteps = (v: SensitivityVariable) => {
        if(v === 'OIL_PRICE') return [50, 60, 70, 80, 90];
        if(v === 'CAPEX_SCALAR') return [0.8, 0.9, 1.0, 1.1, 1.2];
        if(v === 'EUR_SCALAR') return [0.8, 0.9, 1.0, 1.1, 1.2];
        if(v === 'RIG_COUNT') return [1, 2, 3, 4, 6];
        return [1,2,3,4,5];
      };
      const base = scenarios.find(s => s.id === activeScenarioId) || scenarios.find(s => s.isBaseCase) || scenarios[0];
      const basePricing = base?.pricing || DEFAULT_COMMODITY_PRICING;
      return generateSensitivityMatrix(groups, wells, basePricing, sensX, getSteps(sensX), sensY, getSteps(sensY).reverse());
  }, [activeScenarioId, groups, scenarios, wells, sensX, sensY]);

  const handleAddScenario = () => {
      const base = scenarios.find(s => s.isBaseCase) || scenarios[0];
      const newScen: Scenario = {
        id: `s-${Date.now()}`,
        name: 'NEW CASE',
        color: '#DBA1DD',
        isBaseCase: false,
        pricing: { ...(base?.pricing || DEFAULT_COMMODITY_PRICING) },
        schedule: { ...(base?.schedule || DEFAULT_SCHEDULE) },
        capexScalar: 1.0,
        productionScalar: 1.0
      };
      setScenarios([...scenarios, newScen]);
      setActiveScenarioId(newScen.id);
      setEditingScenario(true);
  };

  const updateScenario = (id: string, updates: Partial<Scenario>) => setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const updatePricing = (id: string, field: string, value: number) => {
      const s = scenarios.find(sc => sc.id === id);
      if(s) updateScenario(id, { pricing: { ...s.pricing, [field]: value } });
  };
  const updateAnnualRig = (id: string, yearIdx: number, value: number) => {
      const s = scenarios.find(sc => sc.id === id);
      if(s) {
          const newRigs = [...s.schedule.annualRigs];
          newRigs[yearIdx] = value;
          updateScenario(id, { schedule: { ...s.schedule, annualRigs: newRigs } });
      }
  };
  const updateScheduleParam = (id: string, field: string, value: any) => {
      const s = scenarios.find(sc => sc.id === id);
      if(s) updateScenario(id, { schedule: { ...s.schedule, [field]: value } });
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const inputClass = isClassic
    ? 'w-full rounded-inner px-3 py-2 text-xs font-black sc-inputNavy focus-ring'
    : 'w-full rounded-inner border border-theme-border bg-theme-bg/85 px-3 py-2 text-xs text-theme-text theme-transition focus-ring focus:border-theme-cyan focus:bg-theme-surface1';
  const labelClass = isClassic
    ? `typo-label heading-font block mb-2 text-theme-warning ${theme.features.brandFont ? 'brand-font' : ''}`
    : `typo-label heading-font block mb-2 ${theme.features.brandFont ? 'brand-font' : ''}`;
  const scenarioCardTitleClass = theme.features.brandFont ? 'brand-font' : 'heading-font';
  const colorInputClass = isClassic
    ? 'h-10 w-full cursor-pointer rounded-inner sc-inputNavy focus-ring'
    : 'h-10 w-full cursor-pointer rounded-inner border border-theme-border bg-theme-bg theme-transition focus-ring focus:border-theme-magenta';
  const compactNumberInputClass = isClassic
    ? 'w-full rounded-inner py-1.5 text-center text-[11px] font-black sc-inputNavy focus-ring'
    : 'w-full rounded-inner border border-theme-border bg-theme-surface1 py-1.5 text-center text-[11px] font-black text-theme-cyan transition-colors focus-ring focus:border-theme-magenta';
  const selectClass = isClassic
    ? 'sc-selectNavy rounded-inner px-3 py-2 text-[10px] font-black outline-none transition-all cursor-pointer focus-ring'
    : 'rounded-inner border border-theme-border bg-theme-bg px-3 py-2 text-[10px] font-black text-theme-text transition-all cursor-pointer focus-ring';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* LEFT: Scenario Management */}
      <div className="xl:col-span-3 space-y-6">
        <SectionCard
          isClassic={isClassic}
          title="MODEL STACK"
          action={(
            <AnimatedButton
              onClick={handleAddScenario}
              isClassic={isClassic}
              variant="primary"
              size="sm"
              className="px-4"
            >
              + NEW
            </AnimatedButton>
          )}
          panelStyle="solid"
          headerClassName={isClassic ? 'sc-titlebar--red px-5 py-4' : ''}
          titleClassName={scenarioCardTitleClass}
          bodyClassName={isClassic ? '' : 'space-y-3'}
        >
          <div className={isClassic ? 'sc-insetDark rounded-inner p-3 space-y-3' : 'space-y-3'}>
            {scenarios.map(s => {
              const isActive = s.id === activeScenarioId;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveScenarioId(s.id);
                    setEditingScenario(true);
                  }}
                  aria-pressed={isActive}
                  aria-label={`Edit scenario ${s.name}`}
                  className={`group focus-ring w-full rounded-inner border p-3 text-left transition-all motion-reduce:transition-none ${
                    isClassic
                      ? isActive
                        ? 'border-theme-warning bg-black/25'
                        : 'border-black/25 bg-black/10 hover:bg-black/20'
                      : isActive
                        ? 'border-theme-magenta bg-theme-surface2 shadow-glow-magenta'
                        : 'border-theme-border bg-theme-bg hover:border-theme-cyan hover:-translate-y-0.5 motion-reduce:hover:translate-y-0'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}66` }} />
                      <span className={`truncate text-[11px] font-black uppercase tracking-[0.1em] ${isClassic ? 'text-white' : 'text-theme-text'} ${scenarioCardTitleClass}`}>
                        {s.name}
                      </span>
                    </div>
                    <div
                      className={`h-1.5 w-1.5 rounded-full motion-safe:animate-pulse ${
                        isClassic ? 'bg-black/20 group-hover:bg-black/40' : 'bg-theme-cyan/20 group-hover:bg-theme-cyan'
                      }`}
                    />
                  </div>
                  <div className={`flex justify-between text-[10px] font-mono tracking-tight ${isClassic ? 'text-white/75' : 'text-theme-muted'}`}>
                    <span>OIL: ${s.pricing.oilPrice}</span>
                    <span className={`font-black uppercase ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>
                      {Math.max(...s.schedule.annualRigs)} RIGS
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {activeScenario && editingScenario && (
          <div className="theme-transition">
            <SectionCard
              isClassic={isClassic}
              title="EDIT SELECTED MODEL"
              panelStyle="solid"
              className="rounded-b-none"
              headerClassName={isClassic ? 'sc-titlebar--red px-5 py-4' : ''}
              titleClassName={scenarioCardTitleClass}
            >
              <div className={isClassic ? 'sc-insetDark rounded-inner p-4' : ''}>
                <div className="mb-4">
                  <label className={labelClass}>MODEL NAME</label>
                  <input
                    type="text"
                    value={activeScenario.name}
                    onChange={e => updateScenario(activeScenario.id, { name: e.target.value.toUpperCase() })}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>INDICATOR</label>
                    <input
                      type="color"
                      value={activeScenario.color}
                      onChange={e => updateScenario(activeScenario.id, { color: e.target.value })}
                      className={colorInputClass}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              isClassic={isClassic}
              panelStyle="outline"
              className="rounded-t-none"
              noBodyPadding
              bodyClassName={isClassic ? 'space-y-1 p-2' : 'space-y-1 bg-theme-bg p-2'}
            >
                       <AccordionItem title="Pricing" isOpen={openSection === 'PRICING'} onClick={() => setOpenSection('PRICING')} useBrandFont={theme.features.brandFont}>
                           <div className="grid grid-cols-2 gap-4">
                               <div><label className={labelClass}>OIL PRICE</label><input type="number" value={activeScenario.pricing.oilPrice} onChange={e => updatePricing(activeScenario.id, 'oilPrice', parseFloat(e.target.value))} className={inputClass} /></div>
                               <div><label className={labelClass}>GAS PRICE</label><input type="number" value={activeScenario.pricing.gasPrice} onChange={e => updatePricing(activeScenario.id, 'gasPrice', parseFloat(e.target.value))} className={inputClass} /></div>
                               <div><label className={labelClass}>OIL DIFF</label><input type="number" value={activeScenario.pricing.oilDifferential} onChange={e => updatePricing(activeScenario.id, 'oilDifferential', parseFloat(e.target.value))} className={inputClass} /></div>
                               <div><label className={labelClass}>GAS DIFF</label><input type="number" value={activeScenario.pricing.gasDifferential} onChange={e => updatePricing(activeScenario.id, 'gasDifferential', parseFloat(e.target.value))} className={inputClass} /></div>
                           </div>
                       </AccordionItem>

                       <AccordionItem title="Fleet Scheduling" isOpen={openSection === 'SCHEDULE'} onClick={() => setOpenSection('SCHEDULE')} useBrandFont={theme.features.brandFont}>
                           <div className="space-y-6">
                               <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClass}>DRILL DAYS</label><input type="number" value={activeScenario.schedule.drillDurationDays} onChange={e => updateScheduleParam(activeScenario.id, 'drillDurationDays', parseFloat(e.target.value))} className={inputClass} /></div>
                                    <div><label className={labelClass}>STIM DAYS</label><input type="number" value={activeScenario.schedule.stimDurationDays} onChange={e => updateScheduleParam(activeScenario.id, 'stimDurationDays', parseFloat(e.target.value))} className={inputClass} /></div>
                               </div>
                               <div>
                                   <label className={labelClass}>ANNUAL ALLOCATION (Y1-Y5)</label>
                                   <div className="grid grid-cols-5 gap-2">
                                       {activeScenario.schedule.annualRigs.slice(0,5).map((count, idx) => (
                                           <div key={idx} className="text-center">
                                               <span className={`mb-1 block text-[9px] font-black ${isClassic ? 'text-theme-warning' : 'text-theme-muted'}`}>Y{idx + 1}</span>
                                               <input
                                                 type="number"
                                                 min="0"
                                                 value={count}
                                                 onChange={e => updateAnnualRig(activeScenario.id, idx, parseFloat(e.target.value))}
                                                 className={compactNumberInputClass}
                                               />
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>
                       </AccordionItem>

                       <AccordionItem title="Risk Scalars" isOpen={openSection === 'SCALARS'} onClick={() => setOpenSection('SCALARS')} useBrandFont={theme.features.brandFont}>
                           <div className="space-y-6">
                               <div>
                                   <div className="flex justify-between mb-2"><label className={labelClass}>CAPEX MULTIPLIER</label><span className="text-[10px] font-black text-theme-cyan">{(activeScenario.capexScalar * 100).toFixed(0)}%</span></div>
                                   <input
                                     type="range"
                                     min="0.5"
                                     max="2.0"
                                     step="0.05"
                                     value={activeScenario.capexScalar}
                                     onChange={e => updateScenario(activeScenario.id, { capexScalar: parseFloat(e.target.value) })}
                                     className={
                                       isClassic
                                         ? 'w-full h-1.5 sc-rangeNavy appearance-none cursor-pointer focus-ring'
                                         : 'w-full h-1.5 appearance-none cursor-pointer rounded-full border border-theme-border bg-theme-surface1 accent-theme-cyan focus-ring'
                                     }
                                   />
                               </div>
                               <div>
                                   <div className="flex justify-between mb-2"><label className={labelClass}>RECOVERY MULTIPLIER</label><span className="text-[10px] font-black text-theme-magenta">{(activeScenario.productionScalar * 100).toFixed(0)}%</span></div>
                                   <input
                                     type="range"
                                     min="0.5"
                                     max="1.5"
                                     step="0.05"
                                     value={activeScenario.productionScalar}
                                     onChange={e => updateScenario(activeScenario.id, { productionScalar: parseFloat(e.target.value) })}
                                     className={
                                       isClassic
                                         ? 'w-full h-1.5 sc-rangeNavy appearance-none cursor-pointer focus-ring'
                                         : 'w-full h-1.5 appearance-none cursor-pointer rounded-full border border-theme-border bg-theme-surface1 accent-theme-magenta focus-ring'
                                     }
                                   />
                               </div>
                           </div>
                       </AccordionItem>
            </SectionCard>
          </div>
        )}
      </div>

      <div className="xl:col-span-9 space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {scenarioResults.map(res => (
            <div
              key={res.scenario.id}
              className={`group relative overflow-hidden theme-transition ${
                isClassic
                  ? 'sc-panel overflow-hidden'
                  : 'rounded-panel border border-theme-border bg-theme-surface1/80 p-6 shadow-card hover:border-theme-cyan'
              }`}
            >
              <div className="absolute left-0 top-0 h-full w-1.5 opacity-60" style={{ backgroundColor: res.scenario.color }} />
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 blur-[50px] opacity-10" style={{ backgroundColor: res.scenario.color }} />

              {isClassic ? (
                <>
                  <div className="sc-panelTitlebar sc-titlebar--red flex min-w-0 items-center px-5 py-3">
                    <h4 className={`truncate text-[10px] font-black uppercase tracking-[0.3em] text-white ${scenarioCardTitleClass}`}>
                      {res.scenario.name}
                    </h4>
                  </div>
                  <div className="p-5">
                    <div className="text-3xl font-black tracking-tight text-theme-text theme-transition">
                      ${(res.metrics.npv10 / 1e6).toFixed(1)}M <span className="ml-1 text-[10px] font-black tracking-[0.1em] text-theme-muted">NPV10</span>
                    </div>
                    <div className="mt-6 flex justify-between border-t border-white/5 pt-3 text-[10px] font-bold tracking-widest text-theme-muted">
                      <span>ROI: {res.metrics.roi.toFixed(2)}X</span>
                      <span>FLEET: {Math.max(...res.scenario.schedule.annualRigs)} RIGS</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h4 className={`mb-4 ml-2 truncate typo-section transition-colors group-hover:text-theme-magenta ${scenarioCardTitleClass}`}>
                    {res.scenario.name}
                  </h4>
                  <div className="ml-2">
                    <div className="text-3xl font-black tracking-tight text-theme-text theme-transition">
                      ${(res.metrics.npv10 / 1e6).toFixed(1)}M <span className="ml-1 text-[10px] font-black tracking-[0.1em] text-theme-muted">NPV10</span>
                    </div>
                    <div className="mt-6 flex justify-between border-t border-white/5 pt-3 text-[10px] font-bold tracking-widest text-theme-muted">
                      <span>ROI: {res.metrics.roi.toFixed(2)}X</span>
                      <span>FLEET: {Math.max(...res.scenario.schedule.annualRigs)} RIGS</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <SectionCard
            isClassic={isClassic}
            title="PORTFOLIO OVERLAY"
            panelStyle="glass"
            headerClassName={isClassic ? 'sc-titlebar--red px-5 py-4' : ''}
            titleClassName={isClassic ? scenarioCardTitleClass : `${scenarioCardTitleClass} text-theme-lavender`}
            bodyClassName={isClassic ? 'p-5' : 'p-8'}
          >
            {groups.length === 0 || groups.every(g => g.wellIds.size === 0) ? (
              <div className="space-y-3 py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-theme-border/40">
                  <svg className="h-8 w-8 text-theme-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-theme-text">Portfolio Overlay</p>
                <p className="mx-auto max-w-xs text-xs text-theme-muted">
                  Create multiple well groups with economics to compare portfolio-level metrics across scenarios.
                </p>
              </div>
            ) : (
              <div className="h-[320px] w-full" ref={overlayChart.containerRef}>
                {overlayChart.ready ? (
                  <ResponsiveContainer width={overlayChart.width} height={overlayChart.height}>
                    <LineChart data={cfChartData}>
                      <CartesianGrid strokeDasharray="6 6" stroke={chartPalette.grid} vertical={false} />
                      <XAxis dataKey="month" stroke={chartPalette.text} fontSize={9} tickFormatter={(v) => v % 12 === 0 ? `Y${v / 12}` : ''} axisLine={false} tickLine={false} />
                      <YAxis stroke={chartPalette.text} fontSize={9} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: chartPalette.surface, borderRadius: 'var(--radius-inner)', borderColor: chartPalette.border, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                        formatter={(val: number) => [`$${(val / 1e6).toFixed(2)}MM`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} iconType="circle" />
                      {scenarios.map(s => <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={4} dot={false} animationDuration={2000} />)}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-full w-full rounded-inner ${isClassic ? 'bg-black/20' : 'animate-pulse bg-theme-bg/40'}`} />
                )}
              </div>
            )}
          </SectionCard>

          <div className="space-y-6">
            <div className={isClassic ? 'sc-insetDark rounded-inner p-3 flex items-center justify-end gap-4' : 'flex items-center justify-end gap-4 pr-2'}>
              <span className={`heading-font text-[9px] font-black uppercase tracking-[0.2em] ${isClassic ? 'text-theme-warning' : 'text-theme-muted'}`}>Primary Variable</span>
              <select value={sensY} onChange={(e) => setSensY(e.target.value as SensitivityVariable)} className={`${selectClass} ${isClassic ? '' : 'text-theme-cyan focus:border-theme-magenta'}`}>
                <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                <option value="OIL_PRICE">OIL BENCHMARK</option>
                <option value="RIG_COUNT">FLEET SIZE</option>
              </select>
              <span className={`text-[10px] font-black ${isClassic ? 'text-white/60 opacity-60' : 'text-theme-lavender opacity-40'}`}>VS</span>
              <select value={sensX} onChange={(e) => setSensX(e.target.value as SensitivityVariable)} className={`${selectClass} ${isClassic ? '' : 'text-theme-magenta focus:border-theme-cyan'}`}>
                <option value="OIL_PRICE">OIL BENCHMARK</option>
                <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                <option value="RIG_COUNT">FLEET SIZE</option>
              </select>
            </div>
            <SensitivityMatrix data={sensitivityData} xVar={sensX} yVar={sensY} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioDashboard;
