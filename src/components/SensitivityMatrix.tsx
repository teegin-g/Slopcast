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
  const isClassic = theme.id === 'mario';

  const allNpvs = useMemo(() => data.flat().map(d => d.npv), [data]);
  const maxNpv = Math.max(...allNpvs);
  const minNpv = Math.min(...allNpvs);

  // Colors are theme-token-aware: we read the CSS variables via computed style
  // for the positive/negative heatmap shading.
  const readCssRgb = useMemo(() => {
    const read = (varName: string, fallback: [number, number, number]) => {
      if (typeof window === 'undefined') return fallback;
      const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      const parts = raw.split(/\s+/).map(Number);
      if (parts.length === 3 && parts.every(n => Number.isFinite(n))) {
        return [parts[0], parts[1], parts[2]] as [number, number, number];
      }
      return fallback;
    };

    return {
      success: read('--success', [16, 185, 129]),
      danger: read('--danger', [239, 68, 68]),
    };
  }, [theme.id]);

  const getColor = (val: number) => {
      if (val === 0) return 'rgba(255,255,255,0.05)';
      
      if (val > 0) {
          const range = maxNpv - 0;
          const pct = Math.min(1, val / (range || 1));
          const [r, g, b] = readCssRgb.success;
          return `rgba(${r}, ${g}, ${b}, ${0.1 + (pct * 0.5)})`;
      } else {
          const range = 0 - minNpv;
          const pct = Math.min(1, Math.abs(val) / (range || 1));
          const [r, g, b] = readCssRgb.danger;
          return `rgba(${r}, ${g}, ${b}, ${0.1 + (pct * 0.5)})`;
      }
  };

  const xLabels = data[0].map(d => d.xValue);
  const yLabels = data.map(d => d[0].yValue);

  return (
    <div className={isClassic ? 'sc-panel theme-transition' : 'overflow-hidden rounded-panel border theme-transition bg-theme-surface1/60 border-theme-border shadow-card'}>
        <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--red p-4 flex justify-between items-center' : 'p-4 border-b flex justify-between items-center transition-all bg-theme-surface1 border-theme-border'}>
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isClassic ? 'text-white' : 'text-theme-magenta'} ${theme.features.brandFont ? 'brand-font' : ''}`}>
                Portfolio NPV Sensitivity <span className={`${isClassic ? 'text-theme-warning/90' : 'text-theme-muted'} ml-2`}>(MM)</span>
            </h3>
        </div>
        
        <div className={isClassic ? 'p-4' : 'p-6 overflow-x-auto flex flex-col items-center'}>
          {isClassic && (
            <div className="rounded-inner p-4 overflow-x-auto flex flex-col items-center bg-black/10 border border-black/25">
              <div className="relative">
                  <div className={`absolute -left-10 sm:-left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap text-center w-28 sm:w-32 text-theme-warning ${theme.features.brandFont ? 'brand-font' : ''}`}>
                      {formatAxisLabel(yVar)}
                  </div>
  
                  <table className="border-collapse">
                      <thead>
                          <tr>
                              <th className="p-2"></th>
                              {xLabels.map((x, i) => (
                                  <th key={i} className="p-2 text-[10px] font-mono font-black border-b text-white" style={{ borderColor: 'rgb(var(--border) / 0.45)' }}>
                                      {formatValue(xVar, x)}
                                  </th>
                              ))}
                          </tr>
                      </thead>
                      <tbody>
                          {data.map((row, rowIdx) => (
                              <tr key={rowIdx}>
                                  <th className="p-2 text-[10px] font-mono font-black border-r text-right text-white" style={{ borderColor: 'rgb(var(--border) / 0.45)' }}>
                                      {formatValue(yVar, yLabels[rowIdx])}
                                  </th>
                                  {row.map((cell, colIdx) => (
                                      <td 
                                          key={colIdx} 
                                          className="p-3 text-[11px] font-mono text-center border transition-all cursor-default hover:brightness-110 hover:relative hover:z-10"
                                          style={{ backgroundColor: getColor(cell.npv), borderColor: 'rgb(var(--border) / 0.25)' }}
                                      >
                                          <span className="text-white">
                                              {(cell.npv / 1e6).toFixed(1)}
                                          </span>
                                      </td>
                                  ))}
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  
                  <div className={`text-center mt-4 text-[10px] font-black uppercase tracking-widest text-theme-warning ${theme.features.brandFont ? 'brand-font' : ''}`}>
                      {formatAxisLabel(xVar)}
                  </div>
              </div>
            </div>
          )}

          {!isClassic && (
            <div className="relative">
                <div className={`absolute -left-10 sm:-left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-center w-28 sm:w-32 transition-all text-theme-lavender ${theme.features.brandFont ? 'brand-font' : ''}`}>
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
                                        className="p-3 text-[11px] font-mono text-center border transition-all cursor-default border-theme-border/20 hover:brightness-110 hover:relative hover:z-10"
                                        style={{ backgroundColor: getColor(cell.npv) }}
                                    >
                                        <span className="text-theme-text">
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
          )}
        </div>
    </div>
  );
};

export default SensitivityMatrix;
