import React, { useState } from 'react';
import { MonthlyCashFlow, DealMetrics } from '../../types';

interface EngineComparisonPanelProps {
  isClassic: boolean;
  tsResult: { flow: MonthlyCashFlow[]; metrics: DealMetrics } | null;
  pyResult: { flow: MonthlyCashFlow[]; metrics: DealMetrics } | null;
  isLoading?: boolean;
}

/* ── Formatting helpers ─────────────────────────────────────── */

const fmtCurrency = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1e6) return `$${(v / 1e6).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}MM`;
  if (abs >= 1e3) return `$${(v / 1e3).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPct = (v: number): string => `${(v * 100).toFixed(2)}%`;

const fmtInt = (v: number): string => String(Math.round(v));

const fmtNumber = (v: number, decimals = 1): string =>
  v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/* ── Metric definitions for DealMetrics comparison ──────────── */

interface MetricDef {
  key: string;
  label: string;
  extract: (m: DealMetrics) => number;
  format: (v: number) => string;
}

const METRIC_DEFS: MetricDef[] = [
  { key: 'npv10', label: 'NPV (10%)', extract: m => m.npv10, format: fmtCurrency },
  { key: 'irr', label: 'IRR', extract: m => m.irr, format: fmtPct },
  { key: 'payoutMonths', label: 'Payout', extract: m => m.payoutMonths, format: v => `${fmtInt(v)} mo` },
  { key: 'totalCapex', label: 'Total CAPEX', extract: m => m.totalCapex, format: fmtCurrency },
  { key: 'eur', label: 'EUR', extract: m => m.eur, format: v => `${fmtNumber(v / 1e3, 1)} MBOE` },
  { key: 'wellCount', label: 'Well Count', extract: m => m.wellCount, format: fmtInt },
  { key: 'afterTaxNpv10', label: 'After-Tax NPV', extract: m => m.afterTaxNpv10 ?? 0, format: fmtCurrency },
  { key: 'leveredNpv10', label: 'Levered NPV', extract: m => m.leveredNpv10 ?? 0, format: fmtCurrency },
  { key: 'dscr', label: 'DSCR', extract: m => m.dscr ?? 0, format: v => `${fmtNumber(v, 2)}x` },
];

/* ── Delta color logic ──────────────────────────────────────── */

type DeltaColor = 'green' | 'yellow' | 'red';

const getDeltaColor = (deltaPct: number): DeltaColor => {
  const abs = Math.abs(deltaPct);
  if (abs < 0.1) return 'green';
  if (abs <= 1) return 'yellow';
  return 'red';
};

const deltaColorClass: Record<DeltaColor, string> = {
  green: 'text-emerald-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
};

const deltaRowBg: Record<DeltaColor, string> = {
  green: '',
  yellow: 'bg-yellow-500/5',
  red: 'bg-red-500/8',
};

/* ── Component ──────────────────────────────────────────────── */

const EngineComparisonPanel: React.FC<EngineComparisonPanelProps> = ({
  isClassic,
  tsResult,
  pyResult,
  isLoading,
}) => {
  const [expanded, setExpanded] = useState(false);

  /* ── Theme-aware class fragments ────────────────────────── */
  const panelCls = isClassic
    ? 'bg-black/20 text-white border border-black/30 rounded-inner'
    : 'bg-theme-surface1 text-theme-text border border-theme-border rounded-panel';

  const headerCls = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.14em] text-white/80'
    : 'text-[9px] font-black uppercase tracking-[0.14em] text-theme-cyan';

  const mutedCls = isClassic ? 'text-white/50' : 'text-theme-muted';

  const borderCls = isClassic ? 'border-black/20' : 'border-theme-border/40';

  const surfaceCls = isClassic ? 'bg-black/10' : 'bg-theme-bg/40';

  const accentCls = isClassic ? 'text-white' : 'text-theme-text';

  /* ── Compute delta between two values ───────────────────── */
  const computeDelta = (a: number, b: number) => {
    const abs = a - b;
    const base = Math.abs(b) > 0.0001 ? b : (Math.abs(a) > 0.0001 ? a : 1);
    const pct = (abs / Math.abs(base)) * 100;
    return { abs, pct };
  };

  /* ── Chevron icon ───────────────────────────────────────── */
  const ChevronIcon = (
    <svg
      className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className={`${panelCls} theme-transition overflow-hidden`}>
      {/* ── Header ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className={`w-full flex items-center justify-between px-4 py-3 ${
          isClassic ? 'hover:bg-black/15' : 'hover:bg-theme-surface2/40'
        } transition-colors`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : tsResult && pyResult ? 'bg-emerald-400' : 'bg-theme-muted/40'}`} />
          <span className={headerCls}>ENGINE COMPARISON</span>
          {isLoading && (
            <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${isClassic ? 'text-yellow-300/80' : 'text-yellow-400/80'}`}>
              Calculating...
            </span>
          )}
        </div>
        <span className={mutedCls}>{ChevronIcon}</span>
      </button>

      {/* ── Expanded body ───────────────────────────────────── */}
      {expanded && (
        <div className={`border-t ${borderCls} px-4 py-4 space-y-5`}>
          {/* Awaiting messages */}
          {(!tsResult || !pyResult) && !isLoading && (
            <div className={`text-[11px] ${mutedCls} space-y-1`}>
              {!tsResult && <p>Awaiting TypeScript engine results...</p>}
              {!pyResult && <p>Awaiting Python engine results...</p>}
            </div>
          )}

          {/* ── Metrics Comparison Table ──────────────────────── */}
          {tsResult && pyResult && (
            <>
              <div className="space-y-2">
                <p className={headerCls}>METRICS COMPARISON</p>
                <div className={`${surfaceCls} rounded-inner border ${borderCls} overflow-hidden`}>
                  {/* Table header */}
                  <div className={`grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.7fr] gap-1 px-3 py-2 border-b ${borderCls}`}>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls}`}>Metric</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls} text-right`}>TS</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls} text-right`}>Python</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls} text-right`}>Delta</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls} text-right`}>Delta %</span>
                  </div>

                  {/* Rows */}
                  {METRIC_DEFS.map(def => {
                    const tsVal = def.extract(tsResult.metrics);
                    const pyVal = def.extract(pyResult.metrics);
                    const { abs: deltaAbs, pct: deltaPct } = computeDelta(tsVal, pyVal);
                    const color = getDeltaColor(deltaPct);

                    return (
                      <div
                        key={def.key}
                        className={`grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.7fr] gap-1 px-3 py-1.5 border-b last:border-b-0 ${borderCls} ${deltaRowBg[color]}`}
                      >
                        <span className={`text-[11px] font-semibold ${accentCls} truncate`}>{def.label}</span>
                        <span className={`text-[11px] tabular-nums ${mutedCls} text-right`}>{def.format(tsVal)}</span>
                        <span className={`text-[11px] tabular-nums ${mutedCls} text-right`}>{def.format(pyVal)}</span>
                        <span className={`text-[11px] tabular-nums font-bold ${deltaColorClass[color]} text-right`}>
                          {def.format(deltaAbs)}
                        </span>
                        <span className={`text-[11px] tabular-nums font-bold ${deltaColorClass[color]} text-right`}>
                          {Math.abs(deltaPct).toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Flow Summary (first 12 months) ──────────────── */}
              <div className="space-y-2">
                <p className={headerCls}>FLOW SUMMARY (FIRST 12 MONTHS)</p>
                <div className={`${surfaceCls} rounded-inner border ${borderCls} overflow-hidden`}>
                  {/* Table header */}
                  <div className={`grid grid-cols-[0.5fr_1fr_1fr_0.8fr_0.7fr] gap-1 px-3 py-2 border-b ${borderCls}`}>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls}`}>Mo</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls} text-right`}>TS Net CF</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls} text-right`}>Py Net CF</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls} text-right`}>Delta</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${mutedCls} text-right`}>Delta %</span>
                  </div>

                  {/* Rows - up to 12 months */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const tsFlow = tsResult.flow[i];
                    const pyFlow = pyResult.flow[i];
                    if (!tsFlow && !pyFlow) return null;

                    const tsNCF = tsFlow?.netCashFlow ?? 0;
                    const pyNCF = pyFlow?.netCashFlow ?? 0;
                    const { abs: deltaAbs, pct: deltaPct } = computeDelta(tsNCF, pyNCF);
                    const color = getDeltaColor(deltaPct);

                    return (
                      <div
                        key={i}
                        className={`grid grid-cols-[0.5fr_1fr_1fr_0.8fr_0.7fr] gap-1 px-3 py-1 border-b last:border-b-0 ${borderCls} ${deltaRowBg[color]}`}
                      >
                        <span className={`text-[11px] font-bold tabular-nums ${accentCls}`}>{i + 1}</span>
                        <span className={`text-[11px] tabular-nums ${mutedCls} text-right`}>{fmtCurrency(tsNCF)}</span>
                        <span className={`text-[11px] tabular-nums ${mutedCls} text-right`}>{fmtCurrency(pyNCF)}</span>
                        <span className={`text-[11px] tabular-nums font-bold ${deltaColorClass[color]} text-right`}>
                          {fmtCurrency(deltaAbs)}
                        </span>
                        <span className={`text-[11px] tabular-nums font-bold ${deltaColorClass[color]} text-right`}>
                          {Math.abs(deltaPct).toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EngineComparisonPanel;
