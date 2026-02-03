import React, { useMemo } from 'react';
import { SensitivityMatrixResult, SensitivityVariable } from '../types';

interface SensitivityMatrixProps {
  data: SensitivityMatrixResult[][];
  xVar: SensitivityVariable;
  yVar: SensitivityVariable;
}

const formatAxisLabel = (v: SensitivityVariable) => {
    switch(v) {
        case 'OIL_PRICE': return 'Oil Price ($/bbl)';
        case 'CAPEX_SCALAR': return 'Capex Scalar (%)';
        case 'EUR_SCALAR': return 'EUR Scalar (%)';
        case 'RIG_COUNT': return 'Rig Count';
        default: return v;
    }
};

const formatValue = (v: SensitivityVariable, val: number) => {
    if (v === 'OIL_PRICE') return `$${val}`;
    if (v.includes('SCALAR')) return `${(val * 100).toFixed(0)}%`;
    return val;
};

const SensitivityMatrix: React.FC<SensitivityMatrixProps> = ({ data, xVar, yVar }) => {
  const theme = document.documentElement.getAttribute('data-theme') || 'slate';
  const isSynthwave = theme === 'synthwave';

  const allNpvs = useMemo(() => data.flat().map(d => d.npv), [data]);
  const maxNpv = Math.max(...allNpvs);
  const minNpv = Math.min(...allNpvs);

  const getColor = (val: number) => {
      if (val === 0) return 'rgba(255,255,255,0.05)';
      
      if (val > 0) {
          const range = maxNpv - 0;
          const pct = Math.min(1, val / (range || 1));
          return isSynthwave 
            ? `rgba(45, 255, 177, ${0.1 + (pct * 0.5)})` // Synthwave Success (Cyan-ish Green)
            : `rgba(16, 185, 129, ${0.1 + (pct * 0.6)})`; // Emerald
      } else {
          const range = 0 - minNpv;
          const pct = Math.min(1, Math.abs(val) / (range || 1));
          return isSynthwave
            ? `rgba(255, 79, 163, ${0.1 + (pct * 0.5)})` // Synthwave Danger (Magenta-Red)
            : `rgba(239, 68, 68, ${0.1 + (pct * 0.6)})`; // Red
      }
  };

  const xLabels = data[0].map(d => d.xValue);
  const yLabels = data.map(d => d[0].yValue);

  return (
    <div className={`overflow-hidden rounded-lg border transition-all ${isSynthwave ? 'bg-theme-bg border-theme-border shadow-xl glow-cyan' : 'bg-slate-900/50 border-slate-800'}`}>
        <div className={`p-4 border-b flex justify-between items-center transition-all ${isSynthwave ? 'bg-theme-surface1 border-theme-border' : 'bg-slate-950/30 border-slate-800'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isSynthwave ? 'brand-font text-theme-magenta' : 'text-slate-300'}`}>
                Portfolio NPV Sensitivity <span className="text-theme-muted ml-2">(MM)</span>
            </h3>
        </div>
        
        <div className="p-6 overflow-x-auto flex flex-col items-center">
            <div className="relative">
                <div className={`absolute -left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-center w-32 transition-all ${isSynthwave ? 'brand-font text-theme-lavender' : 'text-slate-500'}`}>
                    {formatAxisLabel(yVar)}
                </div>

                <table className="border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {xLabels.map((x, i) => (
                                <th key={i} className={`p-2 text-[10px] font-mono font-medium border-b transition-all ${isSynthwave ? 'text-theme-cyan border-theme-border' : 'text-slate-400 border-slate-800'}`}>
                                    {formatValue(xVar, x)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                <th className={`p-2 text-[10px] font-mono font-medium border-r text-right transition-all ${isSynthwave ? 'text-theme-cyan border-theme-border' : 'text-slate-400 border-slate-800'}`}>
                                    {formatValue(yVar, yLabels[rowIdx])}
                                </th>
                                {row.map((cell, colIdx) => (
                                    <td 
                                        key={colIdx} 
                                        className={`p-3 text-[11px] font-mono text-center border transition-all hover:scale-110 cursor-default ${isSynthwave ? 'border-theme-border/20' : 'border-slate-800/50 hover:border-slate-500'}`}
                                        style={{ backgroundColor: getColor(cell.npv) }}
                                    >
                                        <span className={cell.npv > 0 ? (isSynthwave ? "text-theme-text" : "text-white") : "text-red-100"}>
                                            {(cell.npv / 1e6).toFixed(1)}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className={`text-center mt-4 text-[10px] font-bold uppercase tracking-widest transition-all ${isSynthwave ? 'brand-font text-theme-lavender' : 'text-slate-500'}`}>
                    {formatAxisLabel(xVar)}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SensitivityMatrix;