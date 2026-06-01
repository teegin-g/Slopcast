import React from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';
import type { FilterClause } from '../../types';
import { summarizeClause } from '../../services/wellUniverseService';

interface ActiveFilterBarProps {
  basin: string | null;
  filters: FilterClause[];
  onRemoveClause: (id: string) => void;
  onClearBasin: () => void;
  onClearAll: () => void;
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const ActiveFilterBar: React.FC<ActiveFilterBarProps> = ({ basin, filters, onRemoveClause, onClearBasin, onClearAll }) => {
  const hasAny = Boolean(basin) || filters.length > 0;

  return (
    <div className="lp-active">
      <div className="lp-active__head">
        <span className="lp-active__label">Active filters</span>
        {hasAny && (
          <button type="button" className="lp-active__clear" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </div>

      <LazyMotion features={domAnimation}>
        <div className="lp-active__chips">
          <AnimatePresence mode="popLayout" initial={false}>
            {basin && (
              <m.span
                key="chip-basin"
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="lp-chip lp-chip--basin"
              >
                <span className="lp-chip__key">Basin</span>
                <span className="lp-chip__val">{titleCase(basin)}</span>
                <button type="button" className="lp-chip__x" onClick={onClearBasin} aria-label="Remove basin filter">
                  ×
                </button>
              </m.span>
            )}

            {filters.map((clause) => (
              <m.span
                key={clause.id ?? `${clause.field}-${clause.kind}`}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="lp-chip"
              >
                <span className="lp-chip__val">{summarizeClause(clause)}</span>
                <button
                  type="button"
                  className="lp-chip__x"
                  onClick={() => clause.id && onRemoveClause(clause.id)}
                  aria-label={`Remove ${clause.field} filter`}
                >
                  ×
                </button>
              </m.span>
            ))}

            {!hasAny && (
              <m.span
                key="chip-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lp-active__empty"
              >
                No filters yet — the full universe is selected.
              </m.span>
            )}
          </AnimatePresence>
        </div>
      </LazyMotion>
    </div>
  );
};

export default ActiveFilterBar;
