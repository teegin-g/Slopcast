import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Area } from 'recharts';
import { MonthlyCashFlow } from '../types';

interface ChartsProps {
  data: MonthlyCashFlow[];
}

const Charts: React.FC<ChartsProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      
      {/* Production Forecast */}
      <div className="bg-slate-900/30 rounded-lg border border-slate-800/50 p-4">
        <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-4 ml-2">Production Profile</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => value % 12 === 0 ? `${value/12}yr` : ''} 
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1', fontSize: '12px' }} 
                itemStyle={{ padding: 0 }}
                formatter={(value: number) => [Math.round(value).toLocaleString(), 'BBLs']}
                cursor={{ stroke: '#334155' }}
              />
              <Line 
                type="monotone" 
                dataKey="oilProduction" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="bg-slate-900/30 rounded-lg border border-slate-800/50 p-4">
        <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-4 ml-2">Cumulative Cash Flow</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => value % 12 === 0 ? `${value/12}yr` : ''}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${(value/1e6).toFixed(0)}M`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1', fontSize: '12px' }}
                formatter={(value: number) => [`$${(value/1e6).toFixed(2)}MM`, '']}
                cursor={{ fill: '#1e293b', opacity: 0.4 }}
              />
              <defs>
                <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="cumulativeCashFlow" stroke="#10b981" fill="url(#colorCum)" strokeWidth={2} />
              <Bar dataKey="netCashFlow" fill="#6366f1" opacity={0.3} barSize={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;
