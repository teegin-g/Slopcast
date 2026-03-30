import React from 'react';
import type { Well } from '../../../types';

interface OverlayFiltersBarProps {
  isClassic: boolean;
  visibleCount: number;
  selectedCount: number;
  totalCount: number;
  groupsPanelOpen: boolean;
  operatorFilter: string;
  formationFilter: string;
  statusFilter: Well['status'] | 'ALL';
  operatorOptions: string[];
  formationOptions: string[];
  statusOptions: Well['status'][];
  onSetOperatorFilter: (v: string) => void;
  onSetFormationFilter: (v: string) => void;
  onSetStatusFilter: (v: Well['status'] | 'ALL') => void;
  onResetFilters: () => void;
}

export const OverlayFiltersBar: React.FC<OverlayFiltersBarProps> = ({
  isClassic,
  visibleCount,
  selectedCount,
  totalCount,
  groupsPanelOpen,
  operatorFilter,
  formationFilter,
  statusFilter,
  operatorOptions,
  formationOptions,
  statusOptions,
  onSetOperatorFilter,
  onSetFormationFilter,
  onSetStatusFilter,
  onResetFilters,
}) => {
  const hasActiveFilters = operatorFilter !== 'ALL' || formationFilter !== 'ALL' || statusFilter !== 'ALL';

  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : 'rounded-panel backdrop-blur-sm bg-[var(--surface-1)]/80 border border-[var(--border)] theme-transition';

  const selectClass = isClassic
    ? 'rounded-inner px-2 py-1 text-[10px] font-black sc-inputNavy focus-ring'
    : 'rounded-inner border border-[var(--border)] bg-[var(--bg-deep)] px-2 py-1 text-[10px] text-[var(--text-primary)] focus-ring';

  return (
    <div
      className={`absolute top-3 z-20 pointer-events-auto transition-all duration-200 ${
        groupsPanelOpen ? 'left-[300px]' : 'left-3'
      } right-[56px]`}
    >
      <div className={`${panelClass} px-3 py-2`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Well counts */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-black tabular-nums ${isClassic ? 'text-white' : 'text-[var(--cyan)]'}`}>
              {visibleCount} Visible
            </span>
            <span className={`text-[10px] font-black tabular-nums ${isClassic ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
              / {selectedCount} Selected
            </span>
            <span className={`text-[10px] font-black tabular-nums ${isClassic ? 'text-white/40' : 'text-[var(--text-muted)]'}`}>
              / {totalCount} Total
            </span>
          </div>

          {/* Divider */}
          <div className={`w-px h-4 ${isClassic ? 'bg-white/20' : 'bg-[var(--border)]'}`} />

          {/* Compact filter selects */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <select value={operatorFilter} onChange={e => onSetOperatorFilter(e.target.value)} className={selectClass}>
              <option value="ALL">All Operators</option>
              {operatorOptions.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <select value={formationFilter} onChange={e => onSetFormationFilter(e.target.value)} className={selectClass}>
              <option value="ALL">All Formations</option>
              {formationOptions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={statusFilter} onChange={e => onSetStatusFilter(e.target.value as Well['status'] | 'ALL')} className={selectClass}>
              <option value="ALL">All Statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${
                isClassic ? 'text-white/70 hover:text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              } transition-colors`}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
