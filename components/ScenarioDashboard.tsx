import React, { useState, useMemo } from 'react';
import { WellGroup, Well, Scenario, SensitivityVariable, ScheduleParams } from '../types';
import { calculateEconomics } from '../utils/economics';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import SensitivityMatrix from './SensitivityMatrix';
import { generateSensitivityMatrix } from '../utils/economics';

interface ScenarioDashboardProps {
  groups: WellGroup[]; 
  wells: Well[];
}

const DEFAULT_PRICING = { oilPrice: 75, gasPrice: 3.25, oilDifferential: 2.50, gasDifferential: 0.35, nri: 0.75, loePerMonth: 8500 };
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
  theme?: string;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, isOpen, onClick, children, theme }) => {
    const isSynthwave = theme === 'synthwave';
    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-300 mb-3 ${isOpen ? (isSynthwave ? 'bg-theme-surface1 border-theme-magenta shadow-glow-magenta' : 'bg-slate-900 border-blue-500/30') : 'bg-theme-surface1/40 border-theme-border'}`}>
            <button onClick={onClick} className={`w-full flex items-center justify-between px-5 py-4 text-left transition-all ${isOpen ? (isSynthwave ? 'text-theme-cyan' : 'text-blue-400') : 'text-theme-muted'}`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSynthwave ? 'brand-font' : ''}`}>{title}</span>
                <span className={`transform transition-transform opacity-30 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && <div className="p-5 border-t border-theme-border/20">{children}</div>}
        </div>
    );
};

const ScenarioDashboard: React.FC<ScenarioDashboardProps> = ({ groups, wells }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
        id: 's-base',
        name: 'BASE CASE',
        color: '#9ED3F0',
        isBaseCase: true,
        pricing: { ...DEFAULT_PRICING },
        schedule: { ...DEFAULT_SCHEDULE },
        capexScalar: 1.0,
        productionScalar: 1.0
    },
    {
        id: 's-upside',
        name: 'BULL SCENARIO',
        color: '#E566DA',
        isBaseCase: false,
        pricing: { ...DEFAULT_PRICING, oilPrice: 85 },
        schedule: { ...DEFAULT_SCHEDULE },
        capexScalar: 1.0,
        productionScalar: 1.0
    },
    {
        id: 's-fast',
        name: 'RAMP PROGRAM',
        color: '#2DFFB1',
        isBaseCase: false,
        pricing: { ...DEFAULT_PRICING },
        schedule: { ...DEFAULT_SCHEDULE, annualRigs: [1, 2, 3, 4, 4, 4, 4, 4, 4, 4] },
        capexScalar: 1.0,
        productionScalar: 1.0
    }
  ]);

  const [activeScenarioId, setActiveScenarioId] = useState<string>('s-base');
  const [editingScenario, setEditingScenario] = useState<boolean>(false);
  const [openSection, setOpenSection] = useState<'PRICING' | 'SCHEDULE' | 'SCALARS'>('PRICING');

  const [sensX, setSensX] = useState<SensitivityVariable>('OIL_PRICE');
  const [sensY, setSensY] = useState<SensitivityVariable>('RIG_COUNT');

  const theme = document.documentElement.getAttribute('data-theme') || 'slate';
  const isSynthwave = theme === 'synthwave';

  const scenarioResults = useMemo(() => {
    return scenarios.map(scenario => {
        let scenarioNpv = 0;
        let scenarioCapex = 0;
        let scenarioEur = 0;
        const cumulativeFlows = new Array(120).fill(0);

        groups.forEach(group => {
            const groupWells = wells.filter(w => group.wellIds.has(w.id));
            const runPricing = scenario.isBaseCase ? group.pricing : scenario.pricing;
            const { flow, metrics } = calculateEconomics(groupWells, group.typeCurve, group.capex, runPricing, { capex: scenario.capexScalar, production: scenario.productionScalar }, scenario.schedule);
            scenarioNpv += metrics.npv10;
            scenarioCapex += metrics.totalCapex;
            scenarioEur += metrics.eur;
            flow.forEach((f, i) => { if(i < 120) cumulativeFlows[i] += f.netCashFlow; });
        });

        let runningCum = 0;
        return {
            scenario,
            metrics: { npv10: scenarioNpv, totalCapex: scenarioCapex, eur: scenarioEur, roi: scenarioCapex > 0 ? (scenarioEur * scenario.pricing.oilPrice * scenario.pricing.nri) / scenarioCapex : 0 },
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

  const sensitivityData = useMemo(() => {
      const getSteps = (v: SensitivityVariable) => {
        if(v === 'OIL_PRICE') return [50, 60, 70, 80, 90];
        if(v === 'CAPEX_SCALAR') return [0.8, 0.9, 1.0, 1.1, 1.2];
        if(v === 'EUR_SCALAR') return [0.8, 0.9, 1.0, 1.1, 1.2];
        if(v === 'RIG_COUNT') return [1, 2, 3, 4, 6];
        return [1,2,3,4,5];
      };
      return generateSensitivityMatrix(groups, wells, sensX, getSteps(sensX), sensY, getSteps(sensY).reverse());
  }, [groups, wells, sensX, sensY]);

  const handleAddScenario = () => {
      const newScen: Scenario = { id: `s-${Date.now()}`, name: 'NEW CASE', color: isSynthwave ? '#DBA1DD' : '#94a3b8', isBaseCase: false, pricing: { ...DEFAULT_PRICING }, schedule: { ...DEFAULT_SCHEDULE }, capexScalar: 1.0, productionScalar: 1.0 };
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
  const inputClass = `w-full bg-theme-bg border rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-cyan theme-transition ${isSynthwave ? 'border-theme-border' : 'border-slate-700'}`;
  const labelClass = `text-[9px] font-black text-theme-muted block mb-2 uppercase tracking-[0.2em] ${isSynthwave ? 'brand-font' : ''}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      
      {/* LEFT: Scenario Management */}
      <div className="lg:col-span-3 space-y-6">
          <div className={`rounded-2xl border p-6 shadow-card transition-all ${isSynthwave ? 'bg-theme-surface1 border-theme-border' : 'bg-slate-900/50 border-slate-800'}`}>
              <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xs font-black uppercase tracking-[0.3em] ${isSynthwave ? 'brand-font text-theme-cyan' : 'text-slate-300'}`}>MODEL STACK</h3>
                  <button onClick={handleAddScenario} className={`text-[9px] px-4 py-2 rounded-lg text-theme-bg font-black uppercase tracking-widest hover:shadow-glow-cyan transition-all ${isSynthwave ? 'bg-theme-cyan' : 'bg-blue-600'}`}>
                      + NEW
                  </button>
              </div>
              <div className="space-y-3">
                  {scenarios.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { setActiveScenarioId(s.id); setEditingScenario(true); }}
                        className={`group p-4 rounded-xl border cursor-pointer transition-all ${s.id === activeScenarioId ? (isSynthwave ? 'bg-theme-surface2 border-theme-magenta shadow-glow-magenta' : 'bg-slate-800 border-blue-500 shadow-md') : (isSynthwave ? 'bg-theme-bg border-theme-border hover:border-theme-cyan hover:scale-[1.02]' : 'bg-slate-900 border-slate-800 hover:border-slate-600')}`}
                      >
                          <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}66` }}></div>
                                  <span className={`font-black text-[11px] uppercase tracking-[0.1em] ${isSynthwave ? 'brand-font text-theme-text' : 'text-slate-200'}`}>{s.name}</span>
                              </div>
                              <div className="w-1.5 h-1.5 rounded-full bg-theme-cyan/20 group-hover:bg-theme-cyan animate-pulse"></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-theme-muted font-mono tracking-tight">
                              <span>OIL: ${s.pricing.oilPrice}</span>
                              <span className={`font-bold uppercase ${isSynthwave ? 'text-theme-cyan' : 'text-blue-400'}`}>
                                  {Math.max(...s.schedule.annualRigs)} RIGS
                              </span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {activeScenario && editingScenario && (
              <div className="animate-in slide-in-from-left-6 duration-500">
                   <div className={`rounded-t-2xl border border-b-0 p-6 theme-transition ${isSynthwave ? 'bg-theme-surface1 border-theme-border' : 'bg-slate-900/80 border-slate-800'}`}>
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
                   </div>

                   <div className={`rounded-b-2xl border p-2 space-y-1 theme-transition shadow-card ${isSynthwave ? 'bg-theme-bg border-theme-border' : 'bg-slate-900/30 border-slate-800'}`}>
                       <AccordionItem title="Economic Anchors" isOpen={openSection === 'PRICING'} onClick={() => setOpenSection('PRICING')} theme={theme}>
                           <div className="grid grid-cols-2 gap-4">
                               <div><label className={labelClass}>OIL PRICE</label><input type="number" value={activeScenario.pricing.oilPrice} onChange={e => updatePricing(activeScenario.id, 'oilPrice', parseFloat(e.target.value))} className={inputClass} /></div>
                               <div><label className={labelClass}>GAS PRICE</label><input type="number" value={activeScenario.pricing.gasPrice} onChange={e => updatePricing(activeScenario.id, 'gasPrice', parseFloat(e.target.value))} className={inputClass} /></div>
                               <div><label className={labelClass}>OIL DIFF</label><input type="number" value={activeScenario.pricing.oilDifferential} onChange={e => updatePricing(activeScenario.id, 'oilDifferential', parseFloat(e.target.value))} className={inputClass} /></div>
                               <div><label className={labelClass}>LOE ($/MO)</label><input type="number" value={activeScenario.pricing.loePerMonth} onChange={e => updatePricing(activeScenario.id, 'loePerMonth', parseFloat(e.target.value))} className={inputClass} /></div>
                           </div>
                       </AccordionItem>

                       <AccordionItem title="Fleet Scheduling" isOpen={openSection === 'SCHEDULE'} onClick={() => setOpenSection('SCHEDULE')} theme={theme}>
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
                                               <input type="number" min="0" value={count} onChange={e => updateAnnualRig(activeScenario.id, idx, parseFloat(e.target.value))} className="w-full bg-theme-surface1 border border-theme-border text-center text-[11px] font-black rounded-lg py-1.5 text-theme-cyan focus:border-theme-magenta outline-none transition-colors" />
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>
                       </AccordionItem>

                       <AccordionItem title="Risk Scalars" isOpen={openSection === 'SCALARS'} onClick={() => setOpenSection('SCALARS')} theme={theme}>
                           <div className="space-y-6">
                               <div>
                                   <div className="flex justify-between mb-2"><label className={labelClass}>CAPEX MULTIPLIER</label><span className={`text-[10px] font-black ${isSynthwave ? 'text-theme-cyan' : 'text-blue-400'}`}>{(activeScenario.capexScalar * 100).toFixed(0)}%</span></div>
                                   <input type="range" min="0.5" max="2.0" step="0.05" value={activeScenario.capexScalar} onChange={e => updateScenario(activeScenario.id, { capexScalar: parseFloat(e.target.value) })} className="w-full h-1.5 bg-theme-surface1 border border-theme-border rounded-lg appearance-none cursor-pointer accent-theme-cyan" />
                               </div>
                               <div>
                                   <div className="flex justify-between mb-2"><label className={labelClass}>RECOVERY MULTIPLIER</label><span className={`text-[10px] font-black ${isSynthwave ? 'text-theme-magenta' : 'text-emerald-400'}`}>{(activeScenario.productionScalar * 100).toFixed(0)}%</span></div>
                                   <input type="range" min="0.5" max="1.5" step="0.05" value={activeScenario.productionScalar} onChange={e => updateScenario(activeScenario.id, { productionScalar: parseFloat(e.target.value) })} className="w-full h-1.5 bg-theme-surface1 border border-theme-border rounded-lg appearance-none cursor-pointer accent-theme-magenta" />
                               </div>
                           </div>
                       </AccordionItem>
                   </div>
              </div>
          )}
      </div>

      <div className="lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scenarioResults.map((res) => (
                  <div key={res.scenario.id} className={`rounded-2xl border p-6 relative overflow-hidden theme-transition shadow-card group ${isSynthwave ? 'bg-theme-surface1/80 border-theme-border hover:border-theme-cyan' : 'bg-slate-900/40 border-slate-800'}`}>
                      <div className="absolute top-0 left-0 w-1.5 h-full opacity-60" style={{ backgroundColor: res.scenario.color }}></div>
                      <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-10 pointer-events-none" style={{ backgroundColor: res.scenario.color }}></div>
                      
                      <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ml-2 transition-all ${isSynthwave ? 'brand-font text-theme-cyan group-hover:text-theme-magenta' : 'text-slate-400'}`}>{res.scenario.name}</h4>
                      <div className="ml-2">
                          <div className={`text-3xl font-black tracking-tight theme-transition ${isSynthwave ? 'text-theme-text' : ''}`}>${(res.metrics.npv10 / 1e6).toFixed(1)}M <span className="text-[10px] text-theme-muted font-black tracking-[0.1em] ml-1">NPV10</span></div>
                          <div className="flex justify-between mt-6 text-[10px] text-theme-muted font-bold tracking-widest border-t border-white/5 pt-3">
                              <span>ROI: {res.metrics.roi.toFixed(2)}X</span>
                              <span>FLEET: {Math.max(...res.scenario.schedule.annualRigs)} RIGS</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`rounded-2xl border p-8 shadow-card theme-transition ${isSynthwave ? 'bg-theme-surface1/60 border-theme-border' : 'bg-slate-900/40 border-slate-800'}`}>
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 ${isSynthwave ? 'brand-font text-theme-lavender' : 'text-slate-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-theme-magenta shadow-glow-magenta"></span>
                      PORTFOLIO OVERLAY
                    </h3>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cfChartData}>
                                <CartesianGrid strokeDasharray="6 6" stroke={isSynthwave ? "rgba(96, 83, 160, 0.25)" : "#1e293b"} vertical={false} />
                                <XAxis dataKey="month" stroke={isSynthwave ? "#A8A3A8" : "#64748b"} fontSize={9} tickFormatter={(v) => v % 12 === 0 ? `Y${v/12}` : ''} axisLine={false} tickLine={false} />
                                <YAxis stroke={isSynthwave ? "#A8A3A8" : "#64748b"} fontSize={9} tickFormatter={(v) => `$${(v/1e6).toFixed(0)}M`} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: isSynthwave ? '#0E061A' : '#0f172a', borderRadius: '12px', borderColor: isSynthwave ? '#6053A0' : '#334155', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} 
                                  formatter={(val: number) => [`$${(val/1e6).toFixed(2)}MM`, '']} 
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} iconType="circle" />
                                {scenarios.map(s => <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={4} dot={false} animationDuration={2000} />)}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center space-x-4 justify-end pr-2">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] theme-transition ${isSynthwave ? 'text-theme-muted' : 'text-slate-500'}`}>Primary Variable</span>
                        <select value={sensY} onChange={(e) => setSensY(e.target.value as SensitivityVariable)} className={`text-[10px] font-black rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer ${isSynthwave ? 'bg-theme-bg border border-theme-border text-theme-cyan focus:border-theme-magenta' : 'bg-slate-900 border border-slate-700 text-slate-300'}`}>
                            <option value="CAPEX_SCALAR">CAPEX SCALAR</option>
                            <option value="EUR_SCALAR">RECOVERY SCALAR</option>
                            <option value="OIL_PRICE">OIL BENCHMARK</option>
                            <option value="RIG_COUNT">FLEET SIZE</option>
                        </select>
                        <span className={`text-[10px] font-black theme-transition ${isSynthwave ? 'text-theme-lavender opacity-40' : 'text-slate-500'}`}>VS</span>
                        <select value={sensX} onChange={(e) => setSensX(e.target.value as SensitivityVariable)} className={`text-[10px] font-black rounded-lg px-3 py-1.5 outline-none transition-all cursor-pointer ${isSynthwave ? 'bg-theme-bg border border-theme-border text-theme-magenta focus:border-theme-cyan' : 'bg-slate-900 border border-slate-700 text-slate-300'}`}>
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