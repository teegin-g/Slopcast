import React from 'react';
import { ForecastSegment, CutoffKind } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { InlineEditableValue } from './inline/InlineEditableValue';

interface DeclineSegmentTableProps {
  segments: ForecastSegment[];
  gorMcfPerBbl: number;
  onChange: (segments: ForecastSegment[], gor: number) => void;
}

const CUTOFF_OPTIONS: { label: string; value: CutoffKind }[] = [
  { label: 'Rate (BOPD)', value: 'rate' },
  { label: 'Cum (BBL)', value: 'cum' },
  { label: 'Time (days)', value: 'time_days' },
  { label: 'Horizon', value: 'default' },
];

const DeclineSegmentTable: React.FC<DeclineSegmentTableProps> = ({ segments, gorMcfPerBbl, onChange }) => {
  const { theme } = useTheme();
  const isClassic = theme.id === 'mario';

  const handleUpdateSegment = (id: string, field: keyof ForecastSegment, value: any) => {
    const updated = segments.map(s => s.id === id ? { ...s, [field]: value } : s);
    onChange(updated, gorMcfPerBbl);
  };

  const handleAddSegment = () => {
    const newSeg: ForecastSegment = {
      id: `s-${Date.now()}`,
      name: `segment ${segments.length + 1}`,
      method: 'arps',
      qi: null,
      b: 0,
      initialDecline: 8,
      cutoffKind: 'default',
      cutoffValue: null,
    };
    onChange([...segments, newSeg], gorMcfPerBbl);
  };

  const handleDeleteSegment = (id: string) => {
    if (segments.length <= 1) return;
    onChange(segments.filter(s => s.id !== id), gorMcfPerBbl);
  };

  const inlineValueClass = isClassic ? 'text-[10px] font-black text-white' : 'text-[10px] font-mono text-theme-text';
  const inlineInputClass = 'text-[10px] w-full';

  return (
    <div className="space-y-3">
      <div className={`border rounded-inner overflow-hidden ${isClassic ? 'border-black/30 bg-black/10' : 'border-theme-border bg-theme-bg'}`}>
        {/* Header */}
        <div className={`grid grid-cols-12 gap-0 text-[9px] font-bold text-theme-muted p-2 border-b ${isClassic ? 'bg-black/10 border-black/30' : 'bg-theme-bg border-theme-border'}`}>
          <div className="col-span-2">NAME</div>
          <div className="col-span-2 text-right">Qi (BOPD)</div>
          <div className="col-span-2 text-right">Di (%/yr)</div>
          <div className="col-span-1 text-right">b</div>
          <div className="col-span-2 text-center">CUTOFF</div>
          <div className="col-span-2 text-right">VALUE</div>
          <div className="col-span-1 text-center"></div>
        </div>

        {/* Rows */}
        <div className="max-h-48 overflow-y-auto scrollbar-hide">
          {segments.map((seg, idx) => (
            <div key={seg.id} className="grid grid-cols-12 gap-0 border-b border-theme-border text-[10px] items-center hover:bg-theme-surface1/30 group transition-colors">
              <div className="col-span-2 p-1">
                <InlineEditableValue
                  value={seg.name}
                  onCommit={(v) => handleUpdateSegment(seg.id, 'name', v)}
                  type="text"
                  className={isClassic ? 'text-[10px] text-white/80' : 'text-[10px] text-theme-muted'}
                  inputClassName={inlineInputClass}
                />
              </div>

              <div className="col-span-2 p-1">
                {seg.qi != null ? (
                  <InlineEditableValue
                    value={seg.qi}
                    onCommit={(v) => handleUpdateSegment(seg.id, 'qi', parseFloat(v) || 0)}
                    format={(v) => String(Math.round(Number(v)))}
                    type="number"
                    validate={(raw) => {
                      const n = parseFloat(raw);
                      if (isNaN(n) || n <= 0) return 'Must be > 0';
                      return null;
                    }}
                    className={`${inlineValueClass} text-right`}
                    inputClassName={`${inlineInputClass} text-right`}
                  />
                ) : (
                  <span
                    className={`text-[9px] italic cursor-pointer text-right block ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}
                    onClick={() => handleUpdateSegment(seg.id, 'qi', 200)}
                    title="Click to set explicit qi (inherits from previous segment end rate)"
                  >
                    inherit
                  </span>
                )}
              </div>

              <div className="col-span-2 p-1">
                <InlineEditableValue
                  value={seg.initialDecline ?? 8}
                  onCommit={(v) => handleUpdateSegment(seg.id, 'initialDecline', parseFloat(v) || 0)}
                  format={(v) => `${Number(v).toFixed(1)}%`}
                  type="number"
                  validate={(raw) => {
                    const n = parseFloat(raw);
                    if (isNaN(n) || n < 0) return 'Must be >= 0';
                    if (n > 100) return 'Max 100%';
                    return null;
                  }}
                  className={`${inlineValueClass} text-right`}
                  inputClassName={`${inlineInputClass} text-right`}
                />
              </div>

              <div className="col-span-1 p-1">
                <InlineEditableValue
                  value={seg.b ?? 0}
                  onCommit={(v) => handleUpdateSegment(seg.id, 'b', parseFloat(v) || 0)}
                  format={(v) => Number(v).toFixed(2)}
                  type="number"
                  validate={(raw) => {
                    const n = parseFloat(raw);
                    if (isNaN(n) || n < 0) return 'Must be >= 0';
                    if (n > 2) return 'Max 2.0';
                    return null;
                  }}
                  className={`${inlineValueClass} text-right`}
                  inputClassName={`${inlineInputClass} text-right`}
                />
              </div>

              <div className="col-span-2 p-1">
                <select
                  value={seg.cutoffKind}
                  onChange={e => {
                    const newKind = e.target.value as CutoffKind;
                    const newValue = newKind === 'default' ? null : (seg.cutoffValue ?? 200);
                    const updated = segments.map(s =>
                      s.id === seg.id ? { ...s, cutoffKind: newKind, cutoffValue: newValue } : s
                    );
                    onChange(updated, gorMcfPerBbl);
                  }}
                  className="w-full bg-transparent text-theme-muted text-[9px] outline-none cursor-pointer hover:text-theme-text appearance-none text-center"
                >
                  {CUTOFF_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="col-span-2 p-1">
                {seg.cutoffKind === 'default' ? (
                  <span className={`text-[9px] italic text-right block ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}>
                    horizon
                  </span>
                ) : (
                  <InlineEditableValue
                    value={seg.cutoffValue ?? 0}
                    onCommit={(v) => handleUpdateSegment(seg.id, 'cutoffValue', parseFloat(v) || 0)}
                    format={(v) => String(Math.round(Number(v)))}
                    type="number"
                    validate={(raw) => {
                      const n = parseFloat(raw);
                      if (isNaN(n) || n < 0) return 'Must be >= 0';
                      return null;
                    }}
                    className={`${inlineValueClass} text-right`}
                    inputClassName={`${inlineInputClass} text-right`}
                  />
                )}
              </div>

              <div className="col-span-1 text-center">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDeleteSegment(seg.id);
                  }}
                  className={`text-theme-border hover:text-theme-danger w-4 h-4 rounded flex items-center justify-center transition-opacity ${
                    segments.length <= 1 ? 'invisible' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`p-2 flex justify-between items-center border-t ${isClassic ? 'bg-black/10 border-black/30' : 'bg-theme-bg border-theme-border'}`}>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleAddSegment();
            }}
            className="text-[10px] text-theme-cyan hover:opacity-80 font-medium transition-colors"
          >
            + Add Segment
          </button>
          <div className="text-[9px] text-theme-muted">
            {segments.length} segment{segments.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* GOR field below table */}
      <div className="flex items-center justify-between">
        <label className={`text-[9px] font-black uppercase tracking-[0.2em] ${isClassic ? 'text-theme-warning' : 'text-theme-muted'}`}>
          GOR (MCF/BBL)
        </label>
        <InlineEditableValue
          value={gorMcfPerBbl}
          onCommit={(v) => onChange(segments, parseFloat(v) || 0)}
          format={(v) => Number(v).toFixed(1)}
          type="number"
          validate={(raw) => {
            const n = parseFloat(raw);
            if (isNaN(n) || n < 0) return 'Must be >= 0';
            return null;
          }}
          className={isClassic ? 'text-[11px] font-black text-white' : 'text-[11px] font-black text-theme-text'}
          inputClassName="text-[11px] font-black w-20"
        />
      </div>
    </div>
  );
};

export default DeclineSegmentTable;
