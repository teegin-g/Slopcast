import React from 'react';
import type { ForecastSegment, CutoffKind } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { InlineEditableValue } from './inline/InlineEditableValue';
import { createLocalId } from '../utils/id';
import { EditableItemTable } from './slopcast/economics/EditableItemTable';
import { useControlsStyles } from './slopcast/economics/useControlsStyles';

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
  const isClassic = theme.features.isClassicTheme;

  const handleUpdateSegment = (id: string, field: keyof ForecastSegment, value: any) => {
    const updated = segments.map(s => s.id === id ? { ...s, [field]: value } : s);
    onChange(updated, gorMcfPerBbl);
  };

  const handleAddSegment = () => {
    const newSeg: ForecastSegment = {
      id: createLocalId('s'),
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

  const { inlineValueClass, inlineInputClass } = useControlsStyles(isClassic);

  return (
    <div className="space-y-3">
      <EditableItemTable
        items={segments}
        getKey={(seg) => seg.id}
        headerTextClass="text-[9px]"
        scrollMaxHeightClass="max-h-48"
        columns={[
          { label: 'NAME', className: 'col-span-2' },
          { label: 'Qi (BOPD)', className: 'col-span-2 text-right' },
          { label: 'Di (%/yr)', className: 'col-span-2 text-right' },
          { label: 'b', className: 'col-span-1 text-right' },
          { label: 'CUTOFF', className: 'col-span-2 text-center' },
          { label: 'VALUE', className: 'col-span-2 text-right' },
          { label: '', className: 'col-span-1 text-center' },
        ]}
        onAdd={handleAddSegment}
        addLabel="+ Add Segment"
        onDelete={(seg) => handleDeleteSegment(seg.id)}
        deleteDisabled={() => segments.length <= 1}
        footerRightClass="text-[9px] text-theme-muted"
        footerRight={
          <>{segments.length} segment{segments.length !== 1 ? 's' : ''}</>
        }
        renderCells={(seg) => (
          <>
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
                <button
                  type="button"
                  className={`text-[9px] italic cursor-pointer text-right block bg-transparent border-0 p-0 w-full ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}
                  onClick={() => handleUpdateSegment(seg.id, 'qi', 200)}
                  title="Click to set explicit qi (inherits from previous segment end rate)"
                >
                  inherit
                </button>
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
          </>
        )}
      />

      {/* GOR field below table */}
      <div className="flex items-center justify-between">
        <label htmlFor="dst-gor" className={`text-[9px] font-black uppercase tracking-[0.2em] ${isClassic ? 'text-theme-warning' : 'text-theme-muted'}`}>
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
