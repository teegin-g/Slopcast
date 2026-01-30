
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
        default: return v;
    }
};

const formatValue = (v: SensitivityVariable, val: number) => {
    if (v === 'OIL_PRICE') return `$${val}`;
    if (v.includes('SCALAR')) return `${(val * 100).toFixed(0)}%`;
    return val;
};

const SensitivityMatrix: React.FC<SensitivityMatrixProps> = ({ data, xVar, yVar }) => {
  
  // Flatten to find Min/Max for coloring
  const allNpvs = useMemo(() => data.flat().map(d => d.npv), [data]);
  const maxNpv = Math.max(...allNpvs);
  const minNpv = Math.min(...allNpvs);
  const zeroPoint = 0;

  // Color Interpolation (Red -> White -> Green)
  const getColor = (val: number) => {
      if (val === 0) return 'rgba(255,255,255,0.1)';
      
      if (val > 0) {
          // Green Scale
          const range = maxNpv - 0;
          const pct = Math.min(1, val / (range || 1));
          return `rgba(16, 185, 129, ${0.1 + (pct * 0.6)})`; // Emerald
      } else {
          // Red Scale
          const range = 0 - minNpv;
          const pct = Math.min(1, Math.abs(val) / (range || 1));
          return `rgba(239, 68, 68, ${0.1 + (pct * 0.6)})`; // Red
      }
  };

  const xLabels = data[0].map(d => d.xValue);
  const yLabels = data.map(d => d[0].yValue);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Sensitivity Matrix <span className="text-slate-500 ml-2">(NPV10)</span>
            </h3>
        </div>
        
        <div className="p-6 overflow-x-auto flex flex-col items-center">
            <div className="relative">
                
                {/* Y Axis Label (Rotated) */}
                <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap text-center w-32">
                    {formatAxisLabel(yVar)}
                </div>

                <table className="border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2"></th> {/* Empty Corner */}
                            {xLabels.map((x, i) => (
                                <th key={i} className="p-2 text-[10px] text-slate-400 font-mono font-medium border-b border-slate-800">
                                    {formatValue(xVar, x)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                <th className="p-2 text-[10px] text-slate-400 font-mono font-medium border-r border-slate-800 text-right">
                                    {formatValue(yVar, yLabels[rowIdx])}
                                </th>
                                {row.map((cell, colIdx) => (
                                    <td 
                                        key={colIdx} 
                                        className="p-3 text-[11px] font-mono text-center border border-slate-800/50 transition-all hover:border-slate-500 cursor-default"
                                        style={{ backgroundColor: getColor(cell.npv) }}
                                        title={`NPV: $${(cell.npv/1e6).toFixed(2)}MM`}
                                    >
                                        <span className={cell.npv > 0 ? "text-slate-100" : "text-red-100"}>
                                            {(cell.npv / 1e6).toFixed(1)}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* X Axis Label */}
                <div className="text-center mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {formatAxisLabel(xVar)}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SensitivityMatrix;
