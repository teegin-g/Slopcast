import React, { useState, useMemo } from 'react';
import { WellGroup, Well, Scenario, SensitivityVariable, ScheduleParams } from '../types';
import { calculateEconomics } from '../utils/economics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
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

// Reusable Accordion Component
interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, isOpen, onClick, children }) => (
    <div className={`border rounded-lg overflow-hidden transition-all duration-300 mb-3 ${isOpen ? 'bg-slate-900 border-blue-500/30' : 'bg-slate-900/40 border-slate-800'}`}>
        <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 text-left ${isOpen ? 'text-blue-400' : 'text-slate-400'}`}>
            <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
            <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isOpen && <div className="p-4 border-t border-slate-800/50">{children}</div>}
    </div>
);

const ScenarioDashboard: React.FC<ScenarioDashboardProps> = ({ groups, wells }) => {
  
  // --- State ---
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
        id: 's-base',
        name: 'Base Case',
        color: '#3b82f6',
        isBaseCase: true,
        pricing: { ...DEFAULT_PRICING },
        schedule: { ...DEFAULT_SCHEDULE },
        capexScalar: 1.0,
        productionScalar: 1.0
    },
    {
        id: 's-upside',
        name: 'High Price ($85)',
        color: '#10b981',
        isBaseCase: false,
        pricing: { ...DEFAULT_PRICING, oilPrice: 85 },
        schedule: { ...DEFAULT_SCHEDULE },
        capexScalar: 1.0,
        productionScalar: 1.0
    },
    {
        id: 's-fast',
        name: 'Ramp Up (4 Rigs)',
        color: '#f59e0b',
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

  // Sensitivity State
  const [sensX, setSensX] = useState<SensitivityVariable>('OIL_PRICE');
  const [sensY, setSensY] = useState<SensitivityVariable>('RIG_COUNT');

  // --- Calculations ---
  const scenarioResults = useMemo(() => {
    return scenarios.map(scenario => {
        let scenarioNpv = 0;
        let scenarioCapex = 0;
        let scenarioEur = 0;
        const cumulativeFlows = new Array(120).fill(0);

        groups.forEach(group => {
            const groupWells = wells.filter(w => group.wellIds.has(w.id));
            const runPricing = scenario.isBaseCase ? group.pricing : scenario.pricing;
            
            const { flow, metrics } = calculateEconomics(
                groupWells, 
                group.typeCurve, 
                group.capex, 
                runPricing, 
                { capex: scenario.capexScalar, production: scenario.productionScalar },
                scenario.schedule 
            );

            scenarioNpv += metrics.npv10;
            scenarioCapex += metrics.totalCapex;
            scenarioEur += metrics.eur;

            flow.forEach((f, i) => {
                if(i < 120) cumulativeFlows[i] += f.netCashFlow;
            });
        });

        let runningCum = 0;
        const finalCumFlow = cumulativeFlows.map(cf => {
            runningCum += cf;
            return runningCum;
        });

        return {
            scenario,
            metrics: {
                npv10: scenarioNpv,
                totalCapex: scenarioCapex,
                eur: scenarioEur,
                roi: scenarioCapex > 0 ? (scenarioEur * scenario.pricing.oilPrice * scenario.pricing.nri) / scenarioCapex : 0 // approx
            },
            flow: finalCumFlow
        };
    }).sort((a,b) => b.metrics.npv10 - a.metrics.npv10);
  }, [groups, wells, scenarios]);

  const cfChartData = useMemo(() => {
      const data = [];
      for(let i=0; i<120; i++) {
          const pt: any = { month: i+1 };
          scenarioResults.forEach(res => {
              pt[res.scenario.id] = res.flow[i];
          });
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
      const xSteps = getSteps(sensX);
      const ySteps = getSteps(sensY).reverse();
      return generateSensitivityMatrix(groups, wells, sensX, xSteps, sensY, ySteps);
  }, [groups, wells, sensX, sensY]);

  // --- Handlers ---
  const handleAddScenario = () => {
      const newScen: Scenario = {
          id: `s-${Date.now()}`,
          name: 'New Scenario',
          color: '#94a3b8',
          isBaseCase: false,
          pricing: { ...DEFAULT_PRICING },
          schedule: { ...DEFAULT_SCHEDULE },
          capexScalar: 1.0,
          productionScalar: 1.0
      };
      setScenarios([...scenarios, newScen]);
      setActiveScenarioId(newScen.id);
      setEditingScenario(true);
  };

  const updateScenario = (id: string, updates: Partial<Scenario>) => {
      setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  
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
  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500";
  const labelClass = "text-[10px] font-bold text-slate-500 block mb-1 uppercase";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      
      {/* LEFT: Scenario Management */}
      <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Scenarios</h3>
                  <button onClick={handleAddScenario} className="text-[10px] bg-blue-600 px-2 py-1 rounded text-white font-bold hover:bg-blue-500">
                      + Add
                  </button>
              </div>
              <div className="space-y-2">
                  {scenarios.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { setActiveScenarioId(s.id); setEditingScenario(true); }}
                        className={`p-3 rounded border cursor-pointer transition-all ${s.id === activeScenarioId ? 'bg-slate-800 border-blue-500 shadow-md' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                      >
                          <div className="flex items-center space-x-2 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                              <span className="font-bold text-xs text-slate-200">{s.name}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Oil: ${s.pricing.oilPrice}</span>
                              <span className="font-bold text-blue-400">
                                  {Math.min(...s.schedule.annualRigs)}-{Math.max(...s.schedule.annualRigs)} Rigs
                              </span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Scenario Editor Accordions */}
          {activeScenario && editingScenario && (
              <div className="animate-in slide-in-from-left-4">
                   <div className="bg-slate-900/80 rounded-t-xl border border-b-0 border-slate-800 p-4">
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Edit Scenario</h3>
                       <div className="mb-4">
                           <label className={labelClass}>Name</label>
                           <input 
                            type="text" 
                            value={activeScenario.name} 
                            onChange={e => updateScenario(activeScenario.id, { name: e.target.value })}
                            className={inputClass}
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Color</label>
                                <input 
                                    type="color" 
                                    value={activeScenario.color} 
                                    onChange={e => updateScenario(activeScenario.id, { color: e.target.value })}
                                    className="w-full h-8 bg-slate-950 border border-slate-700 rounded cursor-pointer"
                                />
                            </div>
                       </div>
                   </div>

                   <div className="bg-slate-900/30 rounded-b-xl border border-slate-800 p-2 space-y-1">
                       {/* 1. PRICING */}
                       <AccordionItem title="Pricing & Differentials" isOpen={openSection === 'PRICING'} onClick={() => setOpenSection('PRICING')}>
                           <div className="grid grid-cols-2 gap-3">
                               <div>
                                   <label className={labelClass}>Oil Price ($)</label>
                                   <input type="number" value={activeScenario.pricing.oilPrice} onChange={e => updatePricing(activeScenario.id, 'oilPrice', parseFloat(e.target.value))} className={inputClass} />
                               </div>
                               <div>
                                   <label className={labelClass}>Gas Price ($)</label>
                                   <input type="number" value={activeScenario.pricing.gasPrice} onChange={e => updatePricing(activeScenario.id, 'gasPrice', parseFloat(e.target.value))} className={inputClass} />
                               </div>
                               <div>
                                   <label className={labelClass}>Oil Diff ($)</label>
                                   <input type="number" value={activeScenario.pricing.oilDifferential} onChange={e => updatePricing(activeScenario.id, 'oilDifferential', parseFloat(e.target.value))} className={inputClass} />
                               </div>
                               <div>
                                   <label className={labelClass}>Gas Diff ($)</label>
                                   <input type="number" value={activeScenario.pricing.gasDifferential} onChange={e => updatePricing(activeScenario.id, 'gasDifferential', parseFloat(e.target.value))} className={inputClass} />
                               </div>
                               <div>
                                   <label className={labelClass}>NRI (%)</label>
                                   <input type="number" step="0.01" value={activeScenario.pricing.nri} onChange={e => updatePricing(activeScenario.id, 'nri', parseFloat(e.target.value))} className={inputClass} />
                               </div>
                               <div>
                                   <label className={labelClass}>LOE ($/mo)</label>
                                   <input type="number" value={activeScenario.pricing.loePerMonth} onChange={e => updatePricing(activeScenario.id, 'loePerMonth', parseFloat(e.target.value))} className={inputClass} />
                               </div>
                           </div>
                       </AccordionItem>

                       {/* 2. SCHEDULE */}
                       <AccordionItem title="Rig Schedule & Timing" isOpen={openSection === 'SCHEDULE'} onClick={() => setOpenSection('SCHEDULE')}>
                           <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Drill Days</label>
                                        <input type="number" value={activeScenario.schedule.drillDurationDays} onChange={e => updateScheduleParam(activeScenario.id, 'drillDurationDays', parseFloat(e.target.value))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Stim Days</label>
                                        <input type="number" value={activeScenario.schedule.stimDurationDays} onChange={e => updateScheduleParam(activeScenario.id, 'stimDurationDays', parseFloat(e.target.value))} className={inputClass} />
                                    </div>
                               </div>
                               
                               <div>
                                   <label className={labelClass}>Annual Rig Allocation</label>
                                   <div className="grid grid-cols-5 gap-1">
                                       {activeScenario.schedule.annualRigs.slice(0,5).map((count, idx) => (
                                           <div key={idx} className="text-center">
                                               <span className="text-[9px] text-slate-500 block mb-0.5">Y{idx+1}</span>
                                               <input 
                                                type="number" 
                                                min="0" max="20"
                                                value={count}
                                                onChange={e => updateAnnualRig(activeScenario.id, idx, parseFloat(e.target.value))}
                                                className="w-full bg-slate-800 border border-slate-700 text-center text-xs rounded py-1"
                                               />
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           </div>
                       </AccordionItem>

                       {/* 3. SCALARS */}
                       <AccordionItem title="Scalars & Sensitivities" isOpen={openSection === 'SCALARS'} onClick={() => setOpenSection('SCALARS')}>
                           <div className="space-y-4">
                               <div>
                                   <div className="flex justify-between mb-1">
                                       <label className={labelClass}>Capex Scalar</label>
                                       <span className="text-[10px] font-mono text-blue-400">{(activeScenario.capexScalar * 100).toFixed(0)}%</span>
                                   </div>
                                   <input 
                                    type="range" min="0.5" max="2.0" step="0.05"
                                    value={activeScenario.capexScalar}
                                    onChange={e => updateScenario(activeScenario.id, { capexScalar: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                   />
                               </div>
                               <div>
                                   <div className="flex justify-between mb-1">
                                       <label className={labelClass}>Production (EUR) Scalar</label>
                                       <span className="text-[10px] font-mono text-emerald-400">{(activeScenario.productionScalar * 100).toFixed(0)}%</span>
                                   </div>
                                   <input 
                                    type="range" min="0.5" max="1.5" step="0.05"
                                    value={activeScenario.productionScalar}
                                    onChange={e => updateScenario(activeScenario.id, { productionScalar: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                   />
                               </div>
                           </div>
                       </AccordionItem>
                   </div>
              </div>
          )}
      </div>

      {/* RIGHT: Analysis & Matrix */}
      <div className="lg:col-span-9 space-y-6">
          
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarioResults.map((res, idx) => (
                  <div key={res.scenario.id} className="bg-slate-900/40 rounded-lg border border-slate-800 p-4 relative overflow-hidden group">
                      <div className={`absolute top-0 left-0 w-1 h-full`} style={{ backgroundColor: res.scenario.color }}></div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2">{res.scenario.name}</h4>
                      <div className="ml-2">
                          <div className="text-2xl font-black text-slate-200">${(res.metrics.npv10 / 1e6).toFixed(1)}MM <span className="text-[10px] text-slate-500 font-normal">NPV10</span></div>
                          <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                              <span>ROI: {res.metrics.roi.toFixed(2)}x</span>
                              <span>Capex: ${(res.metrics.totalCapex/1e6).toFixed(1)}MM</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comparison Chart */}
                <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-5 shadow-lg">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Scenario Cash Flow Overlay</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cfChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickFormatter={(v) => v % 12 === 0 ? `${v/12}yr` : ''}/>
                                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${(v/1e6).toFixed(0)}M`}/>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1' }} formatter={(val: number) => [`$${(val/1e6).toFixed(2)}MM`, '']} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                {scenarios.map(s => (
                                    <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={2} dot={false} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sensitivity Matrix */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 justify-end">
                        <select 
                            value={sensY} 
                            onChange={(e) => setSensY(e.target.value as SensitivityVariable)}
                            className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-1 outline-none"
                        >
                            <option value="CAPEX_SCALAR">Capex Scalar</option>
                            <option value="EUR_SCALAR">EUR Scalar</option>
                            <option value="OIL_PRICE">Oil Price</option>
                            <option value="RIG_COUNT">Rig Count</option>
                        </select>
                        <span className="text-[10px] text-slate-500 font-bold">VS</span>
                        <select 
                            value={sensX} 
                            onChange={(e) => setSensX(e.target.value as SensitivityVariable)}
                            className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-1 outline-none"
                        >
                            <option value="OIL_PRICE">Oil Price</option>
                            <option value="CAPEX_SCALAR">Capex Scalar</option>
                            <option value="EUR_SCALAR">EUR Scalar</option>
                            <option value="RIG_COUNT">Rig Count</option>
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