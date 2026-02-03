import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area } from 'recharts';
import { MonthlyCashFlow } from '../types';

interface ChartsProps {
  data: MonthlyCashFlow[];
  theme?: 'slate' | 'synthwave';
}

/**
 * SLOPCAST 8-Color Palette (Series Order)
 * 1. #9ED3F0 (cyan)
 * 2. #E566DA (magenta)
 * 3. #DBA1DD (lavender)
 * 4. #952A99 (violet)
 * 5. #6053A0 (indigo border tone)
 * 6. #EBE9EE (white highlight)
 * 7. #FFB86B (warning series)
 * 8. #2DFFB1 (success series)
 */

const Charts: React.FC<ChartsProps> = ({ data, theme = 'slate' }) => {
  const isSynthwave = theme === 'synthwave';

  const palette = {
    oil: isSynthwave ? "#9ED3F0" : "#3b82f6",
    cash: isSynthwave ? "#E566DA" : "#10b981",
    lav: isSynthwave ? "#DBA1DD" : "#8b5cf6",
    grid: isSynthwave ? "rgba(96, 83, 160, 0.25)" : "#1e293b",
    text: isSynthwave ? "#A8A3A8" : "#475569",
    surface: isSynthwave ? "#0E061A" : "#0f172a",
    border: isSynthwave ? "rgba(96, 83, 160, 0.4)" : "#334155"
  };

  return (
    <div className="space-y-6 h-full flex flex-col justify-between p-2">
      {/* Production Forecast */}
      <div className={`rounded-xl border p-5 flex-1 transition-all ${isSynthwave ? 'bg-transparent border-theme-border/40' : 'bg-slate-900/30 border-slate-800/50'}`}>
        <h4 className={`font-black text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center transition-all ${isSynthwave ? 'text-theme-cyan' : 'text-slate-500'}`}>
          <span className="w-1 h-1 rounded-full bg-theme-cyan mr-2"></span>
          Production Forecast (BBL/D)
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={palette.grid} vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke={palette.text} 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => value % 12 === 0 ? `Y${value/12}` : ''} 
              />
              <YAxis 
                stroke={palette.text} 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: palette.surface, borderRadius: '8px', border: `1px solid ${palette.border}`, color: '#fff', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                itemStyle={{ padding: 0 }}
                formatter={(value: number) => [Math.round(value).toLocaleString(), 'BBLs']}
                cursor={{ stroke: palette.lav, strokeWidth: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="oilProduction" 
                stroke={palette.oil} 
                strokeWidth={3} 
                dot={false} 
                activeDot={{ r: 4, strokeWidth: 0, fill: palette.oil }} 
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Flow */}
      <div className={`rounded-xl border p-5 flex-1 transition-all ${isSynthwave ? 'bg-transparent border-theme-border/40' : 'bg-slate-900/30 border-slate-800/50'}`}>
        <h4 className={`font-black text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center transition-all ${isSynthwave ? 'text-theme-magenta' : 'text-slate-500'}`}>
          <span className="w-1 h-1 rounded-full bg-theme-magenta mr-2"></span>
          Cumulative Recovery (USD)
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={palette.grid} vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke={palette.text} 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => value % 12 === 0 ? `Y${value/12}` : ''}
              />
              <YAxis 
                stroke={palette.text} 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${(value/1e6).toFixed(0)}M`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: palette.surface, borderRadius: '8px', border: `1px solid ${palette.border}`, color: '#fff', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                formatter={(value: number) => [`$${(value/1e6).toFixed(2)}MM`, '']}
                cursor={{ fill: palette.grid, opacity: 0.3 }}
              />
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette.cash} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={palette.cash} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="cumulativeCashFlow" 
                stroke={palette.cash} 
                fill="url(#colorCash)" 
                strokeWidth={3} 
                animationDuration={2000}
              />
              <Bar dataKey="netCashFlow" fill={palette.lav} opacity={0.3} barSize={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Charts;