import React, { useCallback, useEffect, useRef, useState } from 'react';

interface DateRangeSliderProps {
  minDate: string; // ISO yyyy-mm-dd (domain start)
  maxDate: string; // ISO yyyy-mm-dd (domain end)
  start?: string;
  end?: string;
  onChange: (start: string, end: string) => void;
  loading?: boolean;
}

const DAY_MS = 86_400_000;

function toMs(iso: string): number {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function snapDay(ms: number): number {
  return Math.round(ms / DAY_MS) * DAY_MS;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Dual-handle date range slider spanning the domain [minDate, maxDate] (the
 * first/last date in the current selection). Drag the handles to set the window;
 * double-click a handle's date to type an exact value (no native date picker).
 */
const DateRangeSlider: React.FC<DateRangeSliderProps> = ({ minDate, maxDate, start, end, onChange, loading }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const domainMin = toMs(minDate);
  const domainMax = Math.max(toMs(maxDate), domainMin + DAY_MS);
  const span = domainMax - domainMin;

  const startMs = clamp(start ? toMs(start) : domainMin, domainMin, domainMax);
  const endMs = clamp(end ? toMs(end) : domainMax, domainMin, domainMax);

  const [editing, setEditing] = useState<null | 'start' | 'end'>(null);
  const [draft, setDraft] = useState('');
  const dragging = useRef<null | 'start' | 'end'>(null);

  const pct = (ms: number) => ((ms - domainMin) / span) * 100;

  const commit = useCallback(
    (which: 'start' | 'end', ms: number) => {
      const snapped = snapDay(clamp(ms, domainMin, domainMax));
      if (which === 'start') {
        onChange(toIso(Math.min(snapped, endMs)), toIso(endMs));
      } else {
        onChange(toIso(startMs), toIso(Math.max(snapped, startMs)));
      }
    },
    [domainMin, domainMax, startMs, endMs, onChange],
  );

  const msFromClientX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return domainMin;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return domainMin + ratio * span;
    },
    [domainMin, span],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      commit(dragging.current, msFromClientX(e.clientX));
    };
    const onUp = () => {
      dragging.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [commit, msFromClientX]);

  const onThumbKey = (which: 'start' | 'end') => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? DAY_MS * 30 : DAY_MS;
    const current = which === 'start' ? startMs : endMs;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      commit(which, current - step);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      commit(which, current + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      commit(which, domainMin);
    } else if (e.key === 'End') {
      e.preventDefault();
      commit(which, domainMax);
    }
  };

  const beginEdit = (which: 'start' | 'end') => {
    setEditing(which);
    setDraft(toIso(which === 'start' ? startMs : endMs));
  };

  const submitEdit = () => {
    if (editing && ISO_RE.test(draft)) {
      commit(editing, toMs(draft));
    }
    setEditing(null);
  };

  const lo = pct(startMs);
  const hi = pct(endMs);

  return (
    <div className="lp-dateslider" aria-busy={loading}>
      <div className="lp-dateslider__readout">
        <DateField
          role="start"
          editing={editing === 'start'}
          value={toIso(startMs)}
          draft={draft}
          onDraft={setDraft}
          onBeginEdit={() => beginEdit('start')}
          onSubmit={submitEdit}
        />
        <span className="lp-dateslider__arrow" aria-hidden="true">→</span>
        <DateField
          role="end"
          editing={editing === 'end'}
          value={toIso(endMs)}
          draft={draft}
          onDraft={setDraft}
          onBeginEdit={() => beginEdit('end')}
          onSubmit={submitEdit}
          alignEnd
        />
      </div>

      <div ref={trackRef} className="lp-dateslider__track">
        <div className="lp-dateslider__rail" />
        <div className="lp-dateslider__fill" style={{ left: `${lo}%`, right: `${100 - hi}%` }} />
        <button
          type="button"
          className="lp-dateslider__thumb"
          style={{ left: `${lo}%` }}
          role="slider"
          aria-label="Range start"
          aria-valuemin={domainMin}
          aria-valuemax={domainMax}
          aria-valuenow={startMs}
          aria-valuetext={toIso(startMs)}
          tabIndex={0}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            dragging.current = 'start';
          }}
          onKeyDown={onThumbKey('start')}
          onDoubleClick={() => beginEdit('start')}
        />
        <button
          type="button"
          className="lp-dateslider__thumb"
          style={{ left: `${hi}%` }}
          role="slider"
          aria-label="Range end"
          aria-valuemin={domainMin}
          aria-valuemax={domainMax}
          aria-valuenow={endMs}
          aria-valuetext={toIso(endMs)}
          tabIndex={0}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            dragging.current = 'end';
          }}
          onKeyDown={onThumbKey('end')}
          onDoubleClick={() => beginEdit('end')}
        />
      </div>

      <div className="lp-dateslider__domain">
        <span>{minDate}</span>
        <span>{maxDate}</span>
      </div>
    </div>
  );
};

interface DateFieldProps {
  role: 'start' | 'end';
  editing: boolean;
  value: string;
  draft: string;
  onDraft: (v: string) => void;
  onBeginEdit: () => void;
  onSubmit: () => void;
  alignEnd?: boolean;
}

const DateField: React.FC<DateFieldProps> = ({ role, editing, value, draft, onDraft, onBeginEdit, onSubmit, alignEnd }) => {
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onBlur={onSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onSubmit();
        }}
        placeholder="yyyy-mm-dd"
        inputMode="numeric"
        className={`lp-dateslider__input focus-ring ${alignEnd ? 'lp-dateslider__input--end' : ''}`}
        aria-label={`${role} date`}
      />
    );
  }
  return (
    <button
      type="button"
      className={`lp-dateslider__date ${alignEnd ? 'lp-dateslider__date--end' : ''}`}
      onDoubleClick={onBeginEdit}
      onClick={onBeginEdit}
      title="Double-click to type a date"
    >
      <span className="lp-dateslider__dateCap">{role === 'start' ? 'From' : 'To'}</span>
      <span className="lp-dateslider__dateVal">{value}</span>
    </button>
  );
};

export default DateRangeSlider;
