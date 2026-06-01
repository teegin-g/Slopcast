import React, { useMemo, useRef, useState } from 'react';
import type { FilterClause, WellSummaryField } from '../../types';
import Popover from './Popover';
import FilterEditor from './FilterEditor';

interface FieldSearchProps {
  fields: WellSummaryField[];
  basin: string | null;
  filters: FilterClause[];
  activeFieldNames: Set<string>;
  onApply: (clause: FilterClause) => void;
}

const TYPE_BADGE: Record<string, string> = { numeric: '123', date: 'cal', string: 'abc', boolean: 'y/n' };
const SUGGESTED = ['lateral_length', 'cum_boe_12mo', 'spud_date', 'eur_boe', 'stage_total', 'first_prod_date'];

const FieldSearch: React.FC<FieldSearchProps> = ({ fields, basin, filters, activeFieldNames, onApply }) => {
  const [query, setQuery] = useState('');
  const [activeField, setActiveField] = useState<WellSummaryField | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fields.filter((f) => SUGGESTED.includes(f.name)).slice(0, 6);
    return fields
      .filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          (f.description ?? '').toLowerCase().includes(q),
      )
      .slice(0, 14);
  }, [fields, query]);

  const openEditor = (field: WellSummaryField, el: HTMLElement) => {
    anchorRef.current = el;
    setActiveField(field);
  };

  return (
    <div className="lp-fieldsearch">
      <div className="lp-fieldsearch__inputRow">
        <svg className="lp-fieldsearch__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any field: lateral length, EUR, porosity, spud date…"
          className="lp-fieldsearch__input focus-ring"
          aria-label="Search well attributes to filter"
        />
        <span className="lp-fieldsearch__hint">{query ? `${matches.length} matches` : 'Suggested'}</span>
      </div>

      <div className="lp-fieldsearch__pills">
        {matches.length === 0 && <p className="lp-fieldsearch__empty">No fields match “{query}”.</p>}
        {matches.map((field) => {
          const isActive = activeFieldNames.has(field.name);
          return (
            <button
              key={field.name}
              type="button"
              onClick={(e) => openEditor(field, e.currentTarget)}
              className={`lp-pill ${isActive ? 'lp-pill--active' : ''}`}
              title={field.description || field.label}
            >
              <span className="lp-pill__type">{TYPE_BADGE[field.data_type] ?? '?'}</span>
              <span className="lp-pill__label">{field.label}</span>
              {field.unit && <span className="lp-pill__unit">{field.unit}</span>}
            </button>
          );
        })}
      </div>

      <Popover anchorRef={anchorRef} open={activeField !== null} onClose={() => setActiveField(null)} width={340} align="start">
        {activeField && (
          <FilterEditor
            field={activeField}
            basin={basin}
            filters={filters}
            onApply={(clause) => {
              onApply(clause);
              setActiveField(null);
            }}
            onCancel={() => setActiveField(null)}
          />
        )}
      </Popover>
    </div>
  );
};

export default FieldSearch;
