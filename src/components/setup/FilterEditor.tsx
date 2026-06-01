import React, { useEffect, useMemo, useState } from 'react';
import type { FilterClause, NumericOp, WellSummaryField } from '../../types';
import { fetchFieldStats } from '../../services/wellUniverseService';
import DateRangeSlider from './DateRangeSlider';

interface FilterEditorProps {
  field: WellSummaryField;
  basin: string | null;
  filters: FilterClause[];
  initial?: FilterClause;
  onApply: (clause: FilterClause) => void;
  onCancel: () => void;
}

const NUMERIC_OPS: { value: NumericOp; label: string }[] = [
  { value: 'gte', label: 'At least (\u2265)' },
  { value: 'gt', label: 'Greater than (>)' },
  { value: 'lte', label: 'At most (\u2264)' },
  { value: 'lt', label: 'Less than (<)' },
  { value: 'eq', label: 'Equals (=)' },
  { value: 'between', label: 'Between' },
];

const FilterEditor: React.FC<FilterEditorProps> = ({ field, basin, filters, initial, onApply, onCancel }) => {
  return (
    <div className="lp-editor">
      <header className="lp-editor__head">
        <div>
          <p className="lp-editor__field">{field.label}</p>
          <p className="lp-editor__meta">
            {field.category}
            {field.unit ? ` \u00b7 ${field.unit}` : ''}
          </p>
        </div>
      </header>
      <div className="lp-editor__body">
        {field.data_type === 'numeric' && (
          <NumericEditor field={field} initial={initial} onApply={onApply} onCancel={onCancel} />
        )}
        {field.data_type === 'date' && (
          <DateEditor field={field} basin={basin} filters={filters} initial={initial} onApply={onApply} onCancel={onCancel} />
        )}
        {(field.data_type === 'string' || field.data_type === 'boolean') && (
          <StringEditor field={field} initial={initial} onApply={onApply} onCancel={onCancel} />
        )}
      </div>
    </div>
  );
};

// --- Numeric ----------------------------------------------------------------

const NumericEditor: React.FC<Omit<FilterEditorProps, 'basin' | 'filters'>> = ({ field, initial, onApply, onCancel }) => {
  const [op, setOp] = useState<NumericOp>(initial?.op ?? 'gte');
  const [value, setValue] = useState<string>(initial?.value !== undefined ? String(initial.value) : '');
  const [value2, setValue2] = useState<string>(initial?.value2 !== undefined ? String(initial.value2) : '');

  const valid = useMemo(() => {
    const v = parseFloat(value);
    if (Number.isNaN(v)) return false;
    if (op === 'between') {
      const v2 = parseFloat(value2);
      return !Number.isNaN(v2);
    }
    return true;
  }, [op, value, value2]);

  const apply = () => {
    if (!valid) return;
    const v = parseFloat(value);
    onApply({
      field: field.name,
      kind: 'numeric',
      op,
      value: v,
      value2: op === 'between' ? parseFloat(value2) : undefined,
    });
  };

  return (
    <div className="lp-numeric">
      <label className="lp-editor__rowLabel">Condition</label>
      <div className="lp-segment">
        <select value={op} onChange={(e) => setOp(e.target.value as NumericOp)} className="lp-numeric__op focus-ring">
          {NUMERIC_OPS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="lp-numeric__values">
        <div className="lp-numeric__inputWrap">
          <input
            autoFocus
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder={field.min !== undefined && field.min !== null ? String(field.min) : 'value'}
            className="lp-numeric__input focus-ring"
          />
          {field.unit && <span className="lp-numeric__unit">{field.unit}</span>}
        </div>
        {op === 'between' && (
          <>
            <span className="lp-numeric__and">and</span>
            <div className="lp-numeric__inputWrap">
              <input
                type="number"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && apply()}
                placeholder={field.max !== undefined && field.max !== null ? String(field.max) : 'value'}
                className="lp-numeric__input focus-ring"
              />
              {field.unit && <span className="lp-numeric__unit">{field.unit}</span>}
            </div>
          </>
        )}
      </div>
      <EditorActions onApply={apply} onCancel={onCancel} disabled={!valid} />
    </div>
  );
};

// --- String -----------------------------------------------------------------

const StringEditor: React.FC<Omit<FilterEditorProps, 'basin' | 'filters'>> = ({ field, initial, onApply, onCancel }) => {
  const [text, setText] = useState(initial?.text ?? '');
  const [match, setMatch] = useState<'strict' | 'fuzzy'>(initial?.match ?? 'fuzzy');

  const apply = () => {
    if (!text.trim()) return;
    onApply({ field: field.name, kind: 'string', text: text.trim(), match });
  };

  return (
    <div className="lp-string">
      <label className="lp-editor__rowLabel">Match</label>
      <div className="lp-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={match === 'fuzzy'}
          className={`lp-toggle__btn ${match === 'fuzzy' ? 'lp-toggle__btn--on' : ''}`}
          onClick={() => setMatch('fuzzy')}
        >
          Contains
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={match === 'strict'}
          className={`lp-toggle__btn ${match === 'strict' ? 'lp-toggle__btn--on' : ''}`}
          onClick={() => setMatch('strict')}
        >
          Exact
        </button>
      </div>
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        placeholder={match === 'fuzzy' ? 'Contains text\u2026' : 'Exact value\u2026'}
        className="lp-string__input focus-ring"
      />
      <EditorActions onApply={apply} onCancel={onCancel} disabled={!text.trim()} />
    </div>
  );
};

// --- Date -------------------------------------------------------------------

const DateEditor: React.FC<Omit<FilterEditorProps, never>> = ({ field, basin, filters, initial, onApply, onCancel }) => {
  const [domain, setDomain] = useState<{ min: string; max: string } | null>(null);
  const [start, setStart] = useState<string | undefined>(initial?.start);
  const [end, setEnd] = useState<string | undefined>(initial?.end);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    fetchFieldStats(field.name, basin, filters, controller.signal)
      .then((stats) => {
        if (cancelled) return;
        const min = stats.min_date ?? '2008-01-01';
        const max = stats.max_date ?? new Date().toISOString().slice(0, 10);
        setDomain({ min, max });
        setStart((s) => s ?? min);
        setEnd((e) => e ?? max);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      controller.abort();
    };
    // basin/filters intentionally captured at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.name]);

  const apply = () => {
    if (!start || !end) return;
    onApply({ field: field.name, kind: 'date', start, end });
  };

  return (
    <div className="lp-date">
      {domain ? (
        <DateRangeSlider
          minDate={domain.min}
          maxDate={domain.max}
          start={start}
          end={end}
          loading={loading}
          onChange={(s, e) => {
            setStart(s);
            setEnd(e);
          }}
        />
      ) : (
        <div className="lp-date__loading">Loading date range…</div>
      )}
      <EditorActions onApply={apply} onCancel={onCancel} disabled={!start || !end} />
    </div>
  );
};

// --- Shared actions ---------------------------------------------------------

const EditorActions: React.FC<{ onApply: () => void; onCancel: () => void; disabled?: boolean }> = ({
  onApply,
  onCancel,
  disabled,
}) => (
  <div className="lp-editor__actions">
    <button type="button" className="lp-btn lp-btn--ghost" onClick={onCancel}>
      Cancel
    </button>
    <button type="button" className="lp-btn lp-btn--primary" onClick={onApply} disabled={disabled}>
      Apply filter
    </button>
  </div>
);

export default FilterEditor;
