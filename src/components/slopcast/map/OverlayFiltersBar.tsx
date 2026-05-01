import React, { useEffect, useRef, useState } from 'react';
import type { Well } from '../../../types';
import { useTheme } from '../../../theme/ThemeProvider';
import type { ThemeId } from '../../../theme/themes';
import {
  mapOverlayControlClass,
  mapOverlayDividerClass,
  mapOverlayMenuClass,
  mapOverlayPanelClass,
} from './mapOverlayChrome';

interface OverlayFiltersBarProps {
  isClassic: boolean;
  visibleCount: number;
  selectedCount: number;
  totalCount: number;
  groupsPanelOpen: boolean;
  operatorFilter: Set<string>;
  formationFilter: Set<string>;
  statusFilter: Set<string>;
  operatorOptions: string[];
  formationOptions: string[];
  statusOptions: Well['status'][];
  onToggleOperator: (v: string) => void;
  onToggleFormation: (v: string) => void;
  onToggleStatus: (v: string) => void;
  onResetFilters: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

// ─── Multi-select dropdown ─────────────────────────────────────────

interface FilterDropdownProps {
  label: string;
  selected: Set<string>;
  options: string[];
  onToggle: (value: string) => void;
  isClassic: boolean;
  themeId: ThemeId;
  selectClass: string;
  testId: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  selected,
  options,
  onToggle,
  isClassic,
  themeId,
  selectClass,
  testId,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const buttonLabel = selected.size === 0
    ? `All ${label}`
    : `${selected.size} ${label}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid={testId}
        className={selectClass}
        onClick={() => setOpen(prev => !prev)}
      >
        {buttonLabel}
        <span className="ml-1 opacity-50">{open ? '\u25B4' : '\u25BE'}</span>
      </button>
      {open && (
        <div
          className={`absolute top-full left-0 mt-1 min-w-[140px] max-h-48 overflow-y-auto z-30 ${mapOverlayMenuClass(isClassic, themeId)}`}
        >
          {options.map(opt => (
            <label
              key={opt}
              className={`flex items-center gap-2 px-2 py-1 text-[10px] font-bold cursor-pointer transition-colors ${
                isClassic
                  ? 'text-white/80 hover:bg-white/10'
                  : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => onToggle(opt)}
                className="accent-[var(--cyan)]"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Filters bar ───────────────────────────────────────────────────

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
  onToggleOperator,
  onToggleFormation,
  onToggleStatus,
  onResetFilters,
  onSelectAll,
  onClearSelection,
}) => {
  const hasActiveFilters = operatorFilter.size > 0 || formationFilter.size > 0 || statusFilter.size > 0;
  const { themeId } = useTheme();

  const panelClass = mapOverlayPanelClass(isClassic, themeId, 'bar');

  const selectClass = isClassic
    ? 'rounded-inner px-2 py-1 text-[10px] font-black sc-inputNavy focus-ring'
    : `rounded-inner px-2 py-1 text-[10px] font-bold focus-ring ${mapOverlayControlClass(false)}`;

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
          <div className={`w-px h-4 ${mapOverlayDividerClass(isClassic)}`} />

          {/* Multi-select filter dropdowns */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FilterDropdown
              label="Operators"
              selected={operatorFilter}
              options={operatorOptions}
              onToggle={onToggleOperator}
              isClassic={isClassic}
              themeId={themeId}
              selectClass={selectClass}
              testId="wells-filter-operator"
            />
            <FilterDropdown
              label="Formations"
              selected={formationFilter}
              options={formationOptions}
              onToggle={onToggleFormation}
              isClassic={isClassic}
              themeId={themeId}
              selectClass={selectClass}
              testId="wells-filter-formation"
            />
            <FilterDropdown
              label="Statuses"
              selected={statusFilter}
              options={statusOptions}
              onToggle={onToggleStatus}
              isClassic={isClassic}
              themeId={themeId}
              selectClass={selectClass}
              testId="wells-filter-status"
            />
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

          <div className={`w-px h-4 ${mapOverlayDividerClass(isClassic)}`} />

          <button
            onClick={onSelectAll}
            data-testid="wells-selection-actions-select-filtered"
            className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${
              isClassic ? 'text-white/70 hover:text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            } transition-colors`}
          >
            Select Filtered
          </button>
          {selectedCount > 0 && (
            <button
              onClick={onClearSelection}
              data-testid="wells-selection-actions-clear"
              className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${
                isClassic ? 'text-white/50 hover:text-white' : 'text-[var(--text-muted)]/70 hover:text-[var(--text-primary)]'
              } transition-colors`}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
