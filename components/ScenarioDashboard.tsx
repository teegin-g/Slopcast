import React, { useState, useMemo } from 'react';
import { WellGroup, Well, Scenario, SensitivityVariable, ScheduleParams } from '../types';
import { calculateEconomics } from '../utils/economics';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import SensitivityMatrix from './SensitivityMatrix';
import { generateSensitivityMatrix } from '../utils/economics';
import { useTheme } from '../theme/ThemeProvider';
import { DEFAULT_COMMODITY_PRICING } from '../constants';
import { useStableChartContainer } from './slopcast/hooks/useStableChartContainer';

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
  const isClassic = theme.id === 'mario';

  if (isClassic) {
    return (
      <div className="sc-panel theme-transition mb-3">
        <button
          onClick={onClick}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-all sc-panelTitlebar sc-titlebar--red"
        >
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-white ${useBrandFont ? 'brand-font' : ''}`}>{title}</span>
          <span className={`transform transition-transform opacity-30 text-white ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isOpen && (
          <div className="p-4">
            <div className="sc-insetDark rounded-lg p-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-panel overflow-hidden transition-all duration-300 mb-3 ${isOpen ? 'bg-theme-surface1 border-theme-magenta shadow-glow-magenta' : 'bg-theme-surface1/40 border-theme-border'}`}>
      <button onClick={onClick} className={`w-full flex items-center justify-between px-5 py-4 text-left transition-all ${isOpen ? 'text-theme-cyan' : 'text-theme-muted'}`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${useBrandFont ? 'brand-font' : ''}`}>{title}</span>
        <span className={`transform transition-transform opacity-30 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="p-5 border-t border-theme-border/20">{children}</div>}
    </div>
  );
};

const ScenarioDashboard: React.FC<ScenarioDashboardProps> = ({ groups, wells, scenarios, setScenarios }) => {
  const { theme } = useTheme();
  const { chartPalette } = theme;
  const isClassic = theme.id === 'mario';

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
    ? 'w-full rounded-lg px-3 py-2 text-xs font-black sc-inputNavy'
    : 'w-full bg-theme-bg border rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-cyan theme-transition border-theme-border';
  const labelClass = isClassic
    ? `text-[9px] font-black block mb-2 uppercase tracking-[0.2em] text-theme-warning ${theme.features.brandFont ? 'brand-font' : ''}`
    : `text-[9px] font-black text-theme-muted block mb-2 uppercase tracking-[0.2em] ${theme.features.brandFont ? 'brand-font' : ''}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* LEFT: Scenario Management */}
      <div className="xl:col-span-3 space-y-6">
          <div className={isClassic ? 'sc-panel theme-transition overflow-hidden' : 'rounded-panel border p-6 shadow-card transition-all bg-theme-surface1 border-theme-border'}>
              {isClassic ? (
                <>
                  <div className="sc-panelTitlebar sc-titlebar--red px-5 py-4 flex justify-between items-center">
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] text-white ${theme.features.brandFont ? 'brand-font' : ''}`}>MODEL STACK</h3>
                    <button onClick={handleAddScenario} className="sc-btnPrimary text-[9px] px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all">
                      + NEW
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="sc-insetDark rounded-lg p-3 space-y-3">
                      {scenarios.map(s => (
                        <div
                          key={s.id}
                          onClick={() => { setActiveScenarioId(s.id); setEditingScenario(true); }}
                          className={`group p-3 rounded-lg border cursor-pointer transition-all ${
                            s.id === activeScenarioId ? 'border-theme-warning bg-black/25' : 'border-black/25 bg-black/10 hover:bg-black/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}66` }}></div>
                              <span className={`font-black text-[11px] uppercase tracking-[0.1em] truncate text-white ${theme.features.brandFont ? 'brand-font' : ''}`}>{s.name}</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-black/20 group-hover:bg-black/40 animate-pulse"></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono tracking-tight text-white/75">
                            <span>OIL: ${s.pricing.oilPrice}</span>
                            <span className="font-black uppercase text-theme-warning">
                              {Math.max(...s.schedule.annualRigs)} RIGS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xs font-black uppercase tracking-[0.3em] text-theme-cyan ${theme.features.brandFont ? 'brand-font' : ''}`}>MODEL STACK</h3>
                      <button onClick={handleAddScenario} className="text-[9px] px-4 py-2 rounded-lg text-theme-bg font-black uppercase tracking-widest hover:shadow-glow-cyan transition-all bg-theme-cyan">
                          + NEW
                      </button>
                  </div>
                  <div className="space-y-3">
                      {scenarios.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => { setActiveScenarioId(s.id); setEditingScenario(true); }}
	                            className={`group p-4 rounded-inner border cursor-pointer transition-all ${s.id === activeScenarioId ? 'bg-theme-surface2 border-theme-magenta shadow-glow-magenta' : 'bg-theme-bg border-theme-border hover:border-theme-cyan hover:scale-[1.02]'}`}
                          >
                              <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}66` }}></div>
                                      <span className={`font-black text-[11px] uppercase tracking-[0.1em] text-theme-text ${theme.features.brandFont ? 'brand-font' : ''}`}>{s.name}</span>
                                  </div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-theme-cyan/20 group-hover:bg-theme-cyan animate-pulse"></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-theme-muted font-mono tracking-tight">
                                  <span>OIL: ${s.pricing.oilPrice}</span>
                                  <span className="font-bold uppercase text-theme-cyan">
                                      {Math.max(...s.schedule.annualRigs)} RIGS
                                  </span>
                              </div>
                          </div>
                      ))}
                  </div>
                </>
              )}
          </div>

          {activeScenario && editingScenario && (
	              <div className="theme-transition">
	                   <div className={isClassic ? 'sc-panel theme-transition overflow-hidden rounded-b-none' : 'rounded-t-panel border border-b-0 p-6 theme-transition bg-theme-surface1 border-theme-border'}>
                       {isClassic ? (
                         <>
                           <div className="sc-panelTitlebar sc-titlebar--red px-5 py-4 flex justify-between items-center">
                             <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] text-white ${theme.features.brandFont ? 'brand-font' : ''}`}>EDIT SELECTED MODEL</h3>
                           </div>
                           <div className="p-4">
                             <div className="sc-insetDark rounded-lg p-4">
                               <div className="mb-4">
                                   <label className={labelClass}>MODEL NAME</label>
                                   <input type="text" value={activeScenario.name} onChange={e => updateScenario(activeScenario.id, { name: e.target.value.toUpperCase() })} className={inputClass} />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>INDICATOR</label>
                                        <input type="color" value={activeScenario.color} onChange={e => updateScenario(activeScenario.id, { color: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer sc-inputNavy" />
                                    </div>
                               </div>
                             </div>
                           </div>
                         </>
                       ) : (
                         <>
                           <h3 className={labelClass}>Edit Selected Model</h3>
                           <div className="mb-4">
                               <label className={labelClass}>MODEL NAME</label>
                               <input type="text" value={activeScenario.name} onChange={e => updateScenario(activeScenario.id, { name: e.target.value.toUpperCase() })} className={inputClass} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>INDICATOR</label>
                                    <input type="color" value={activeScenario.color} onChange={e => updateScenario(activeScenario.id, { color: e.target.value })} className="w-full h-10 bg-theme-bg border border-theme-border rounded-lg cursor-pointer" />
                                </div>
                           </div>
                         </>
                       )}
                   </div>

	                   <div className={isClassic ? 'sc-panel theme-transition p-2 space-y-1 rounded-t-none' : 'rounded-b-panel border p-2 space-y-1 theme-transition shadow-card bg-theme-bg border-theme-border'}>
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
                                               <span className="text-[9px] text-theme-muted font-black block mb-1">Y{idx+1}</span>
                                               <input
                                                 type="number"
                                                 min="0"
                                                 value={count}
                                                 onChange={e => updateAnnualRig(activeScenario.id, idx, parseFloat(e.target.value))}
                                                 className={
                                                   isClassic
                                                     ? 'w-full sc-inputNavy text-center text-[11px] font-black rounded-lg py-1.5'
                                                     : 'w-full bg-theme-surface1 border border-theme-border text-center text-[11px] font-black rounded-lg py-1.5 text-theme-cyan focus:border-theme-magenta outline-none transition-colors'
                                                 }
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
                                         ? 'w-full h-1.5 sc-rangeNavy appearance-none cursor-pointer'
                                         : 'w-full h-1.5 bg-theme-surface1 border border-theme-border rounded-lg appearance-none cursor-pointer accent-theme-cyan'
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
                                         ? 'w-full h-1.5 sc-rangeNavy appearance-none cursor-pointer'
                                         : 'w-full h-1.5 bg-theme-surface1 border border-theme-border rounded-lg appearance-none cursor-pointer accent-theme-magenta'
                                     }
                                   />
                               </div>
                           </div>
                       </AccordionItem>
                   </div>
              </div>
          )}
      </div>

      <div className="xl:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {scenarioResults.map((res) => (
	                  <div key={res.scenario.id} className={isClassic ? 'sc-panel theme-transition overflow-hidden group' : 'rounded-panel border p-6 relative overflow-hidden theme-transition shadow-card group bg-theme-surface1/80 border-theme-border hover:border-theme-cyan'}>
                      <div className="absolute top-0 left-0 w-1.5 h-full opacity-60" style={{ backgroundColor: res.scenario.color }}></div>
                      <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-10 pointer-events-none" style={{ backgroundColor: res.scenario.color }}></div>
                      
                      {isClassic ? (
                        <>
                          <div className="sc-panelTitlebar sc-titlebar--red px-5 py-3 flex items-center min-w-0">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] text-white truncate ${theme.features.brandFont ? 'brand-font' : ''}`}>{res.scenario.name}</h4>
                          </div>
                          <div className="p-5">
                            <div className="text-3xl font-black tracking-tight theme-transition text-theme-text">
                              ${(res.metrics.npv10 / 1e6).toFixed(1)}M <span className="text-[10px] text-theme-muted font-black tracking-[0.1em] ml-1">NPV10</span>
                            </div>
                            <div className="flex justify-between mt-6 text-[10px] text-theme-muted font-bold tracking-widest border-t border-white/5 pt-3">
                              <span>ROI: {res.metrics.roi.toFixed(2)}X</span>
                              <span>FLEET: {Math.max(...res.scenario.schedule.annualRigs)} RIGS</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ml-2 transition-all text-theme-cyan group-hover:text-theme-magenta truncate ${theme.features.brandFont ? 'brand-font' : ''}`}>{res.scenario.name}</h4>
                          <div className="ml-2">
                              <div className="text-3xl font-black tracking-tight theme-transition text-theme-text">${(res.metrics.npv10 / 1e6).toFixed(1)}M <span className="text-[10px] text-theme-muted font-black tracking-[0.1em] ml-1">NPV10</span></div>
                              <div className="flex justify-between mt-6 text-[10px] text-theme-muted font-bold tracking-widest border-t border-white/5 pt-3">
                                  <span>ROI: {res.metrics.roi.toFixed(2)}X</span>
                                  <span>FLEET: {Math.max(...res.scenario.schedule.annualRigs)} RIGS</span>
                              </div>
                          </div>
                        </>
                      )}
                  </div>
              ))}
          </div>

	          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
	                <div className={isClassic ? 'sc-panel theme-transition overflow-hidden' : 'rounded-panel border p-8 shadow-card theme-transition bg-theme-surface1/60 border-theme-border'}>
                    {isClassic ? (
                      <div className="sc-panelTitlebar sc-titlebar--red px-5 py-4">
                        <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] text-white ${theme.features.brandFont ? 'brand-font' : ''}`}>
                          PORTFOLIO OVERLAY
                        </h3>
                      </div>
                    ) : (
                      <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 text-theme-lavender ${theme.features.brandFont ? 'brand-font' : ''}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-theme-magenta shadow-glow-magenta"></span>
                        PORTFOLIO OVERLAY
                      </h3>
                    )}

                    <div className={isClassic ? 'p-5' : ''}>
                      <div className="h-[320px] w-full" ref={overlayChart.containerRef}>
                        {overlayChart.ready ? (
                          <ResponsiveContainer width={overlayChart.width} height={overlayChart.height}>
                              <LineChart data={cfChartData}>
                                  <CartesianGrid strokeDasharray="6 6" stroke={chartPalette.grid} vertical={false} />
                                  <XAxis dataKey="month" stroke={chartPalette.text} fontSize={9} tickFormatter={(v) => v % 12 === 0 ? `Y${v/12}` : ''} axisLine={false} tickLine={false} />
                                  <YAxis stroke={chartPalette.text} fontSize={9} tickFormatter={(v) => `$${(v/1e6).toFixed(0)}M`} axisLine={false} tickLine={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: chartPalette.surface, borderRadius: '12px', borderColor: chartPalette.border, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} 
                                    formatter={(val: number) => [`$${(val/1e6).toFixed(2)}MM`, '']} 
                                  />
                                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} iconType="circle" />
                                  {scenarios.map(s => <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={4} dot={false} animationDuration={2000} />)}
                              </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className={`h-full w-full rounded-inner ${isClassic ? 'bg-black/20' : 'bg-theme-bg/40 animate-pulse'}`} />
                        )}
                      </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {isClassic ? (
                      <div className="sc-insetDark rounded-lg p-3 flex items-center space-x-4 justify-end">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-warning">Primary Variable</span>
                        <select value={sensY} onChange={(e) => setSensY(e.target.value as SensitivityVariable)} className="sc-selectNavy text-[10px] font-black rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer">
                            <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                            <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                            <option value="OIL_PRICE">OIL BENCHMARK</option>
                            <option value="RIG_COUNT">FLEET SIZE</option>
                        </select>
                        <span className="text-[10px] font-black text-white/60 opacity-60">VS</span>
                        <select value={sensX} onChange={(e) => setSensX(e.target.value as SensitivityVariable)} className="sc-selectNavy text-[10px] font-black rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer">
                            <option value="OIL_PRICE">OIL BENCHMARK</option>
                            <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                            <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                            <option value="RIG_COUNT">FLEET SIZE</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4 justify-end pr-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] theme-transition text-theme-muted">Primary Variable</span>
                          <select value={sensY} onChange={(e) => setSensY(e.target.value as SensitivityVariable)} className="text-[10px] font-black rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer bg-theme-bg border border-theme-border text-theme-cyan focus:border-theme-magenta">
                              <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                              <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                              <option value="OIL_PRICE">OIL BENCHMARK</option>
                              <option value="RIG_COUNT">FLEET SIZE</option>
                          </select>
                          <span className="text-[10px] font-black theme-transition text-theme-lavender opacity-40">VS</span>
                          <select value={sensX} onChange={(e) => setSensX(e.target.value as SensitivityVariable)} className="text-[10px] font-black rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer bg-theme-bg border border-theme-border text-theme-magenta focus:border-theme-cyan">
                              <option value="OIL_PRICE">OIL BENCHMARK</option>
                              <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                              <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                              <option value="RIG_COUNT">FLEET SIZE</option>
                          </select>
                      </div>
                    )}
                    <SensitivityMatrix data={sensitivityData} xVar={sensX} yVar={sensY} />
                </div>
          </div>
      </div>
    </div>
  );
};

export default ScenarioDashboard;
