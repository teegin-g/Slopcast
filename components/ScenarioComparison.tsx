import React from 'react';
import { WellGroup } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ScenarioComparisonProps {
  groups: WellGroup[];
}

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ groups }) => {
  
  // Prepare data for table
  const tableData = groups.map(g => {
    const m = g.metrics || { npv10: 0, totalCapex: 0, eur: 0, payoutMonths: 0, wellCount: 0 };
    const roi = m.totalCapex > 0 ? (m.eur * g.pricing.oilPrice * g.pricing.nri) / m.totalCapex : 0;
    
    return {
      id: g.id,
      name: g.name,
      color: g.color,
      wellCount: m.wellCount,
      capex: m.totalCapex,
      npv: m.npv10,
      eur: m.eur,
      roi: roi,
      payout: m.payoutMonths,
      oilPrice: g.pricing.oilPrice
    };
  }).sort((a, b) => b.npv - a.npv); // Sort by NPV descending

  // Prepare data for Cash Flow Comparison Chart
  // We need to merge all groups' cumulative cash flows into a single array keyed by month
  const maxMonths = 120;
  const cfChartData = [];
  for (let i = 0; i < maxMonths; i++) {
    const point: any = { month: i + 1 };
    groups.forEach(g => {
        if (g.flow && g.flow[i]) {
            point[g.id] = g.flow[i].cumulativeCashFlow;
        } else {
            point[g.id] = 0;
        }
    });
    cfChartData.push(point);
  }

  // Prepare data for Bar Chart (NPV vs CAPEX)
  const barChartData = groups.map(g => ({
      name: g.name,
      NPV10: g.metrics?.npv10 || 0,
      CAPEX: g.metrics?.totalCapex || 0,
      amt: g.metrics?.npv10 || 0 // sorting key
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Scenario Comparison</h2>
            <p className="text-slate-400 text-sm mt-1">Evaluate economic sensitivities across defined cases.</p>
        </div>
      </div>

      {/* 1. Comparison League Table */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-xs uppercase font-bold text-slate-500 tracking-wider">
                      <tr>
                          <th className="px-6 py-4">Scenario Name</th>
                          <th className="px-6 py-4 text-center">Wells</th>
                          <th className="px-6 py-4 text-right text-blue-400">Total Capex</th>
                          <th className="px-6 py-4 text-right text-emerald-400">NPV (10%)</th>
                          <th className="px-6 py-4 text-right">ROI (Cash)</th>
                          <th className="px-6 py-4 text-right">Payout</th>
                          <th className="px-6 py-4 text-right">Pricing Assumption</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                      {tableData.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="px-6 py-4 font-medium text-slate-200 flex items-center space-x-3">
                                  <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: row.color }}></div>
                                  <span>{row.name}</span>
                              </td>
                              <td className="px-6 py-4 text-center font-mono">{row.wellCount}</td>
                              <td className="px-6 py-4 text-right font-mono text-slate-300">
                                  ${(row.capex / 1e6).toFixed(1)}MM
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-emerald-300">
                                  ${(row.npv / 1e6).toFixed(1)}MM
                              </td>
                              <td className="px-6 py-4 text-right font-mono">
                                  {row.roi.toFixed(2)}x
                              </td>
                              <td className="px-6 py-4 text-right font-mono">
                                  {row.payout > 0 ? `${row.payout} mo` : '-'}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-xs">
                                  <span className="bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                                    Oil: ${row.oilPrice}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 2. Cumulative Cash Flow Overlay */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6 shadow-lg">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Cumulative Cash Flow Overlay</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cfChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickFormatter={(v) => v % 12 === 0 ? `${v/12}yr` : ''}
                        />
                        <YAxis 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickFormatter={(v) => `$${(v/1e6).toFixed(0)}M`}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1', fontSize: '12px' }}
                            formatter={(val: number) => [`$${(val/1e6).toFixed(2)}MM`, 'Cum Cash']}
                            labelFormatter={(label) => `Month ${label}`}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                        {groups.map(g => (
                            <Line 
                                key={g.id}
                                type="monotone" 
                                dataKey={g.id} 
                                name={g.name}
                                stroke={g.color} 
                                strokeWidth={2} 
                                dot={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* 3. Efficiency Chart (NPV vs CAPEX) */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6 shadow-lg">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Capital Efficiency (NPV vs Capex)</h3>
              <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                          <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${(v/1e6).toFixed(0)}M`} />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} />
                          <Tooltip 
                              cursor={{fill: '#1e293b', opacity: 0.5}}
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1' }}
                              formatter={(val: number) => [`$${(val/1e6).toFixed(1)}MM`, '']}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Bar dataKey="NPV10" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} name="NPV (10%)" />
                          <Bar dataKey="CAPEX" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} name="Total CAPEX" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

    </div>
  );
};

export default ScenarioComparison;
