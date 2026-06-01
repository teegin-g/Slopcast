import React, { useMemo, useRef, useState } from 'react';
import Popover from './Popover';

interface SearchableSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  loading?: boolean;
  placeholder?: string;
  /** Title-cases displayed option labels (values stay upstream-uppercase). */
  prettify?: boolean;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  multiple = true,
  loading = false,
  placeholder = 'Any',
  prettify = true,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const display = (value: string) => (prettify ? titleCase(value) : value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value: string) => {
    if (multiple) {
      onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
    } else {
      onChange(selected.includes(value) ? [] : [value]);
      setOpen(false);
    }
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? display(selected[0])
        : `${selected.length} selected`;

  const openPanel = () => {
    setOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  return (
    <div className="lp-field">
      <span className="lp-field__label">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={`lp-select focus-ring ${selected.length ? 'lp-select--active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="lp-select__value">{summary}</span>
        <svg className="lp-select__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Popover anchorRef={triggerRef} open={open} onClose={() => setOpen(false)} width={Math.max(240, 260)}>
        <div className="lp-menu">
          <div className="lp-menu__search">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}\u2026`}
              className="lp-menu__searchInput focus-ring"
            />
            {selected.length > 0 && (
              <button type="button" className="lp-menu__clear" onClick={() => onChange([])}>
                Clear
              </button>
            )}
          </div>
          <ul className="lp-menu__list" role="listbox" aria-multiselectable={multiple}>
            {loading && <li className="lp-menu__empty">Loading values…</li>}
            {!loading && filtered.length === 0 && <li className="lp-menu__empty">No matches</li>}
            {!loading &&
              filtered.map((option) => {
                const checked = selected.includes(option);
                return (
                  <li key={option}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggle(option)}
                      className={`lp-menu__option ${checked ? 'lp-menu__option--checked' : ''}`}
                    >
                      <span className={`lp-check ${checked ? 'lp-check--on' : ''}`} aria-hidden="true">
                        {checked && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="lp-menu__optionLabel">{display(option)}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      </Popover>
    </div>
  );
};

export default SearchableSelect;
