import React, { useMemo } from 'react';
import { SensitivityMatrixResult, SensitivityVariable } from '../types';
import { useTheme } from '../theme/ThemeProvider';

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
  const { theme } = useTheme();

  const allNpvs = useMemo(() => data.flat().map(d => d.npv), [data]);
  const maxNpv = Math.max(...allNpvs);
  const minNpv = Math.min(...allNpvs);

  // Colors are theme-token-aware: we read the CSS variables via computed style
  // for the positive/negative heatmap shading.
  const getColor = (val: number) => {
      if (val === 0) return 'rgba(255,255,255,0.05)';
      
      // Use success / danger from the current theme's computed CSS vars
      if (val > 0) {
          const range = maxNpv - 0;
          const pct = Math.min(1, val / (range || 1));
          // Pull from the theme registry for consistent colour references
          const [r, g, b] = theme.id === 'synthwave' ? [45,255,177] : theme.id === 'tropical' ? [52,211,153] : [16,185,129];
          return `rgba(${r}, ${g}, ${b}, ${0.1 + (pct * 0.5)})`;
      } else {
          const range = 0 - minNpv;
          const pct = Math.min(1, Math.abs(val) / (range || 1));
          const [r, g, b] = theme.id === 'synthwave' ? [255,79,163] : theme.id === 'tropical' ? [248,113,113] : [239,68,68];
          return `rgba(${r}, ${g}, ${b}, ${0.1 + (pct * 0.5)})`;
      }
  };

  const xLabels = data[0].map(d => d.xValue);
  const yLabels = data.map(d => d[0].yValue);

  return (
    <div className="overflow-hidden rounded-lg border transition-all bg-theme-bg border-theme-border shadow-xl">
        <div className="p-4 border-b flex justify-between items-center transition-all bg-theme-surface1 border-theme-border">
            <h3 className={`text-xs font-bold uppercase tracking-widest text-theme-magenta ${theme.features.brandFont ? 'brand-font' : ''}`}>
                Portfolio NPV Sensitivity <span className="text-theme-muted ml-2">(MM)</span>
            </h3>
        </div>
        
        <div className="p-6 overflow-x-auto flex flex-col items-center">
            <div className="relative">
                <div className={`absolute -left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-center w-32 transition-all text-theme-lavender ${theme.features.brandFont ? 'brand-font' : ''}`}>
                    {formatAxisLabel(yVar)}
                </div>

                <table className="border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2"></th>
                            {xLabels.map((x, i) => (
                                <th key={i} className="p-2 text-[10px] font-mono font-medium border-b transition-all text-theme-cyan border-theme-border">
                                    {formatValue(xVar, x)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                <th className="p-2 text-[10px] font-mono font-medium border-r text-right transition-all text-theme-cyan border-theme-border">
                                    {formatValue(yVar, yLabels[rowIdx])}
                                </th>
                                {row.map((cell, colIdx) => (
                                    <td 
                                        key={colIdx} 
                                        className="p-3 text-[11px] font-mono text-center border transition-all hover:scale-110 cursor-default border-theme-border/20"
                                        style={{ backgroundColor: getColor(cell.npv) }}
                                    >
                                        <span className={cell.npv > 0 ? "text-theme-text" : "text-red-100"}>
                                            {(cell.npv / 1e6).toFixed(1)}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className={`text-center mt-4 text-[10px] font-bold uppercase tracking-widest transition-all text-theme-lavender ${theme.features.brandFont ? 'brand-font' : ''}`}>
                    {formatAxisLabel(xVar)}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SensitivityMatrix;
