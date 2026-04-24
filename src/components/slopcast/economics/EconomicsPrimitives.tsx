import React from 'react';
import { useStableChartContainer } from '../hooks/useStableChartContainer';
import type { EconomicsAccent } from './types';

const accentText: Record<EconomicsAccent, string> = {
  cyan: 'text-theme-cyan',
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  red: 'text-red-300',
  mint: 'text-teal-300',
  violet: 'text-violet-300',
};

const accentBorder: Record<EconomicsAccent, string> = {
  cyan: 'border-theme-cyan/45',
  green: 'border-emerald-400/45',
  amber: 'border-amber-400/45',
  red: 'border-red-400/45',
  mint: 'border-teal-400/45',
  violet: 'border-violet-400/45',
};

const accentBg: Record<EconomicsAccent, string> = {
  cyan: 'bg-theme-cyan/10',
  green: 'bg-emerald-400/10',
  amber: 'bg-amber-400/10',
  red: 'bg-red-400/10',
  mint: 'bg-teal-400/10',
  violet: 'bg-violet-400/10',
};

export const accentClass = (accent: EconomicsAccent) => ({
  text: accentText[accent],
  border: accentBorder[accent],
  bg: accentBg[accent],
});

export const ModulePanel: React.FC<{
  title?: string;
  accent: EconomicsAccent;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, accent, action, className = '', bodyClassName = '', children }) => {
  const tone = accentClass(accent);
  return (
    <section className={`rounded-panel border bg-theme-surface1/55 border-theme-border shadow-card theme-transition overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-theme-border/55 px-4 py-3">
          {title && <h3 className={`text-[10px] font-black uppercase tracking-[0.22em] ${tone.text}`}>{title}</h3>}
          {action}
        </div>
      )}
      <div className={bodyClassName || 'p-4'}>{children}</div>
    </section>
  );
};

export const MetricTile: React.FC<{
  label: string;
  value: string;
  detail?: string;
  accent: EconomicsAccent;
  compact?: boolean;
}> = ({ label, value, detail, accent, compact = false }) => {
  const tone = accentClass(accent);
  return (
    <div className={`rounded-inner border ${tone.border} ${tone.bg} px-3 ${compact ? 'py-2' : 'py-3'} theme-transition`}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-theme-muted">{label}</p>
      <p className={`${compact ? 'text-lg' : 'text-2xl'} font-black leading-tight text-theme-text tabular-nums mt-1`}>{value}</p>
      {detail && <p className={`mt-1 text-[10px] font-semibold ${tone.text}`}>{detail}</p>}
    </div>
  );
};

export const InsightBanner: React.FC<{
  accent: EconomicsAccent;
  label?: string;
  children: React.ReactNode;
}> = ({ accent, label = 'Insight', children }) => {
  const tone = accentClass(accent);
  return (
    <div className={`rounded-panel border ${tone.border} ${tone.bg} px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2`}>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${tone.text}`}>{label}</span>
      <p className="text-xs text-theme-muted leading-relaxed">{children}</p>
    </div>
  );
};

export const AssumptionTable: React.FC<{
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  accent: EconomicsAccent;
  emptyText?: string;
}> = ({ columns, rows, accent, emptyText = 'No assumptions defined.' }) => {
  const tone = accentClass(accent);
  return (
    <div className="rounded-inner border border-theme-border bg-theme-bg overflow-hidden">
      <div className="grid text-[9px] font-black uppercase tracking-[0.14em] text-theme-muted bg-theme-surface1/70 border-b border-theme-border" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <div key={column} className="px-3 py-2 truncate">{column}</div>
        ))}
      </div>
      {rows.length > 0 ? (
        <div className="divide-y divide-theme-border/35">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid text-[11px] text-theme-muted hover:bg-theme-surface1/45 transition-colors"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
            >
              {row.map((cell, cellIndex) => (
                <div key={cellIndex} className={cellIndex === 0 ? `px-3 py-2 font-semibold ${tone.text}` : 'px-3 py-2 tabular-nums'}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-6 text-center text-xs text-theme-muted">{emptyText}</div>
      )}
    </div>
  );
};

export const StableChart: React.FC<{
  className: string;
  deps: unknown[];
  children: (size: { width: number; height: number }) => React.ReactNode;
}> = ({ className, deps, children }) => {
  const chart = useStableChartContainer(deps);
  return (
    <div ref={chart.containerRef} className={className}>
      {chart.ready ? (
        children({ width: chart.width, height: chart.height })
      ) : (
        <div className="h-full w-full rounded-inner bg-theme-bg/45 animate-pulse" />
      )}
    </div>
  );
};
