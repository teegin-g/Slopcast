import React, { useState } from 'react';
import type { ThemeMeta } from '../../../theme/themes';
import type { Well } from '../../../types';
import FilterChips, { type FilterChip } from '../FilterChips';

interface WellsFiltersPanelProps {
  isClassic: boolean;
  theme: ThemeMeta;
  operatorFilter: Set<string>;
  formationFilter: Set<string>;
  statusFilter: Set<string>;
  operatorOptions: string[];
  formationOptions: string[];
  statusOptions: Well['status'][];
  onToggleOperator: (value: string) => void;
  onToggleFormation: (value: string) => void;
  onToggleStatus: (value: string) => void;
  onResetFilters: () => void;
  filteredWellsCount: number;
  totalWellCount: number;
}

export const WellsFiltersPanel: React.FC<WellsFiltersPanelProps> = ({
  isClassic,
  theme,
  operatorFilter,
  formationFilter,
  statusFilter,
  operatorOptions,
  formationOptions,
  statusOptions,
  onToggleOperator,
  onToggleFormation,
  onToggleStatus,
  onResetFilters,
  filteredWellsCount,
  totalWellCount,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasActiveFilters = operatorFilter.size > 0 || formationFilter.size > 0 || statusFilter.size > 0;
  const showSelects = expanded || hasActiveFilters;

  const activeChips: FilterChip[] = [
    ...[...operatorFilter].map((operator) => ({ id: `operator:${operator}`, value: operator, label: `Operator: ${operator}` })),
    ...[...formationFilter].map((formation) => ({ id: `formation:${formation}`, value: formation, label: `Formation: ${formation}` })),
    ...[...statusFilter].map((status) => ({ id: `status:${status}`, value: status, label: `Status: ${status}` })),
  ];

  const handleRemoveChip = (id: string) => {
    const [category, value] = id.split(':');
    if (category === 'operator') onToggleOperator(value);
    if (category === 'formation') onToggleFormation(value);
    if (category === 'status') onToggleStatus(value);
  };

  const checkboxClass = isClassic
    ? 'text-[11px] font-bold text-white/80 hover:bg-white/10'
    : 'text-[11px] font-bold text-theme-text hover:bg-theme-surface2';

  return (
    <div className={isClassic ? 'sc-panel theme-transition' : 'rounded-panel border bg-theme-surface1/80 border-theme-border theme-transition'}>
      <div className={`px-3 py-2 flex items-center justify-between ${isClassic ? 'sc-panelTitlebar sc-titlebar--neutral' : 'border-b border-theme-border/60'}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            data-testid="wells-filters-toggle"
            className={`focus-ring rounded-inner px-1 text-[11px] font-black uppercase tracking-[0.2em] ${isClassic ? 'text-white' : 'text-theme-cyan'}`}
          >
            Filters
          </button>
          <span className={`text-[10px] font-black tabular-nums ${isClassic ? 'text-white/60' : 'text-theme-muted'}`}>
            {filteredWellsCount}/{totalWellCount}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className={`text-[10px] font-black uppercase tracking-widest ${isClassic ? 'text-white/70 hover:text-white' : 'text-theme-muted hover:text-theme-text'} transition-colors`}
          >
            Reset
          </button>
        )}
      </div>

      {activeChips.length > 0 && <FilterChips filters={activeChips} onRemove={handleRemoveChip} />}

      {showSelects && (
        <div className="px-3 py-2 grid grid-cols-3 gap-2">
          <div>
            <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>Operators</div>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {operatorOptions.map((operator) => (
                <label key={operator} className={`flex items-center gap-1.5 px-1 py-0.5 rounded cursor-pointer ${checkboxClass}`}>
                  <input type="checkbox" checked={operatorFilter.has(operator)} onChange={() => onToggleOperator(operator)} className="accent-[var(--cyan)]" />
                  {operator}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>Formations</div>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {formationOptions.map((formation) => (
                <label key={formation} className={`flex items-center gap-1.5 px-1 py-0.5 rounded cursor-pointer ${checkboxClass}`}>
                  <input type="checkbox" checked={formationFilter.has(formation)} onChange={() => onToggleFormation(formation)} className="accent-[var(--cyan)]" />
                  {formation}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>Statuses</div>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {statusOptions.map((status) => (
                <label key={status} className={`flex items-center gap-1.5 px-1 py-0.5 rounded cursor-pointer ${checkboxClass}`}>
                  <input type="checkbox" checked={statusFilter.has(status)} onChange={() => onToggleStatus(status)} className="accent-[var(--cyan)]" />
                  {status}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
