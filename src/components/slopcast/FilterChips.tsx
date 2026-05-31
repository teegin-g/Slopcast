import React from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';

export interface FilterChip {
  id: string;
  value: string;
  label: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove: (id: string) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({ filters, onRemove }) => {
  if (filters.length === 0) return null;

  return (
    <LazyMotion features={domAnimation}>
    <div className="flex flex-wrap gap-1.5 px-4 py-2">
      <AnimatePresence mode="popLayout">
        {filters.map(filter => (
          <m.span
            key={filter.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-theme-surface2/60 text-theme-text border border-theme-border/40"
          >
            {filter.label}
            <button
              type="button"
              onClick={() => onRemove(filter.id)}
              className="ml-0.5 text-theme-muted hover:text-theme-text transition-colors"
              aria-label={`Remove ${filter.label} filter`}
            >
              x
            </button>
          </m.span>
        ))}
      </AnimatePresence>
    </div>
    </LazyMotion>
  );
};

export default FilterChips;
