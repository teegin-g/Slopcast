import React from 'react';
import { WellGroup } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTheme } from '../theme/ThemeProvider';

interface ScenarioComparisonProps {
  groups: WellGroup[];
}

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({ groups }) => {
  const { theme } = useTheme();
  const { chartPalette } = theme;
  const isClassic = theme.id === 'mario';

  // Prepare data for table
  const tableData = groups.map(g => {
    const m = g.metrics || { npv10: 0, totalCapex: 0, eur: 0, payoutMonths: 0, wellCount: 0 };
    const totalRevenue = g.flow?.reduce((sum, f) => sum + f.revenue, 0) || 0;
    const totalOpex = g.flow?.reduce((sum, f) => sum + f.opex, 0) || 0;
    const roi = m.totalCapex > 0 ? (totalRevenue - totalOpex) / m.totalCapex : 0;
    
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
      baseNri: g.ownership.baseNri,
      baseCostInterest: g.ownership.baseCostInterest,
    };
  }).sort((a, b) => b.npv - a.npv);

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

  const barChartData = groups.map(g => ({
      name: g.name,
      NPV10: g.metrics?.npv10 || 0,
      CAPEX: g.metrics?.totalCapex || 0,
      amt: g.metrics?.npv10 || 0
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-2xl font-bold text-theme-text tracking-tight">Scenario Comparison</h2>
            <p className="text-theme-muted text-sm mt-1">Evaluate economic sensitivities across defined cases.</p>
        </div>
      </div>

      {/* 1. Comparison League Table */}
      <div className={isClassic ? 'sc-panel theme-transition overflow-hidden' : 'bg-theme-surface1/60 rounded-panel border border-theme-border overflow-hidden shadow-card'}>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-theme-muted">
                  <thead className="bg-theme-surface1 text-xs uppercase font-bold text-theme-muted tracking-wider">
                      <tr>
                          <th className="px-6 py-4">Scenario Name</th>
                          <th className="px-6 py-4 text-center">Wells</th>
                          <th className="px-6 py-4 text-right text-theme-cyan">Total Capex</th>
                          <th className="px-6 py-4 text-right text-theme-success">NPV (10%)</th>
                          <th className="px-6 py-4 text-right">ROI (Cash)</th>
                          <th className="px-6 py-4 text-right">Payout</th>
                          <th className="px-6 py-4 text-right">Ownership</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/30">
                      {tableData.map((row) => (
                          <tr key={row.id} className="hover:bg-theme-surface1/30 transition-colors group">
                              <td className="px-6 py-4 font-medium text-theme-text flex items-center space-x-3">
                                  <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: row.color }}></div>
                                  <span>{row.name}</span>
                              </td>
                              <td className="px-6 py-4 text-center font-mono">{row.wellCount}</td>
                              <td className="px-6 py-4 text-right font-mono text-theme-text">
                                  ${(row.capex / 1e6).toFixed(1)}MM
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-theme-success">
                                  ${(row.npv / 1e6).toFixed(1)}MM
                              </td>
                              <td className="px-6 py-4 text-right font-mono">
                                  {row.roi.toFixed(2)}x
                              </td>
                              <td className="px-6 py-4 text-right font-mono">
                                  {row.payout > 0 ? `${row.payout} mo` : '-'}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-xs">
                                  <span className="bg-theme-surface1 px-2 py-1 rounded text-theme-muted border border-theme-border">
                                    NRI: {(row.baseNri * 100).toFixed(1)}% • CI: {(row.baseCostInterest * 100).toFixed(1)}%
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
          <div className={isClassic ? 'sc-panel theme-transition p-6' : 'bg-theme-surface1/60 rounded-panel border border-theme-border p-6 shadow-card'}>
              <h3 className="text-theme-muted text-xs font-bold uppercase tracking-widest mb-6">Cumulative Cash Flow Overlay</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cfChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            stroke={chartPalette.text} 
                            fontSize={10} 
                            tickFormatter={(v) => v % 12 === 0 ? `${v/12}yr` : ''}
                        />
                        <YAxis 
                            stroke={chartPalette.text} 
                            fontSize={10} 
                            tickFormatter={(v) => `$${(v/1e6).toFixed(0)}M`}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: chartPalette.surface, borderColor: chartPalette.border, color: 'rgb(var(--text))', fontSize: '12px' }}
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
          <div className={isClassic ? 'sc-panel theme-transition p-6' : 'bg-theme-surface1/60 rounded-panel border border-theme-border p-6 shadow-card'}>
              <h3 className="text-theme-muted text-xs font-bold uppercase tracking-widest mb-6">Capital Efficiency (NPV vs Capex)</h3>
              <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} horizontal={false} />
                          <XAxis type="number" stroke={chartPalette.text} fontSize={10} tickFormatter={(v) => `$${(v/1e6).toFixed(0)}M`} />
                          <YAxis dataKey="name" type="category" stroke={chartPalette.text} fontSize={11} width={100} />
                          <Tooltip 
                              cursor={{fill: chartPalette.grid, opacity: 0.5}}
                              contentStyle={{ backgroundColor: chartPalette.surface, borderColor: chartPalette.border, color: 'rgb(var(--text))' }}
                              formatter={(val: number) => [`$${(val/1e6).toFixed(1)}MM`, '']}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Bar dataKey="NPV10" fill={chartPalette.cash} radius={[0, 4, 4, 0]} barSize={12} name="NPV (10%)" />
                          <Bar dataKey="CAPEX" fill={chartPalette.oil} radius={[0, 4, 4, 0]} barSize={12} name="Total CAPEX" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

    </div>
  );
};

export default ScenarioComparison;
