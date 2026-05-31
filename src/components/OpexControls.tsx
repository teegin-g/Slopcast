import React, { useMemo, useState } from 'react';
import { OpexAssumptions, OpexSegment } from '../types/economics';
import { useTheme } from '../theme/ThemeProvider';
import { InlineEditableValue } from './inline/InlineEditableValue';
import { createLocalId } from '../utils/id';
import { EditableItemTable } from './slopcast/economics/EditableItemTable';
import { useControlsStyles } from './slopcast/economics/useControlsStyles';

interface OpexControlsProps {
  opex: OpexAssumptions;
  onChange: (updated: OpexAssumptions) => void;
}

const clampInt = (value: number, min: number, max: number) => {
  const v = Math.round(Number.isFinite(value) ? value : min);
  return Math.min(max, Math.max(min, v));
};

const OpexControls: React.FC<OpexControlsProps> = ({ opex, onChange }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;

  const [chainSegments, setChainSegments] = useState(true);

  const segments = useMemo(() => (opex.segments || []), [opex.segments]);

  const handleUpdateSegment = (id: string, updates: Partial<OpexSegment>) => {
    const idx = segments.findIndex(seg => seg.id === id);
    if (idx < 0) return;

    const next = segments.map(seg => ({ ...seg }));
    next[idx] = { ...next[idx], ...updates };

    if (updates.startMonth != null) {
      next[idx].startMonth = clampInt(next[idx].startMonth, 1, 600);
    }
    if (updates.endMonth != null) {
      next[idx].endMonth = clampInt(next[idx].endMonth, 1, 600);
    }

    if (next[idx].endMonth < next[idx].startMonth) {
      next[idx].endMonth = next[idx].startMonth;
    }

    if (chainSegments && updates.endMonth != null && idx + 1 < next.length) {
      next[idx + 1].startMonth = next[idx].endMonth + 1;
      if (next[idx + 1].endMonth < next[idx + 1].startMonth) {
        next[idx + 1].endMonth = next[idx + 1].startMonth;
      }
    }

    onChange({ ...opex, segments: next });
  };

  const handleAddSegment = () => {
    const lastEnd = segments.reduce((maxEnd, seg) => Math.max(maxEnd, seg.endMonth), 0);
    const startMonth = lastEnd + 1 || 1;
    const newSeg: OpexSegment = {
      id: createLocalId('o'),
      label: `Segment ${segments.length + 1}`,
      startMonth,
      endMonth: Math.max(startMonth, startMonth + 11),
      fixedPerWellPerMonth: 0,
      variableOilPerBbl: 0,
      variableGasPerMcf: 0,
    };
    onChange({ ...opex, segments: [...segments, newSeg] });
  };

  const handleDeleteSegment = (id: string) => {
    onChange({ ...opex, segments: segments.filter(seg => seg.id !== id) });
  };

  const { inlineValueClass, inlineInputClass } = useControlsStyles(isClassic);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-theme-text">OPEX Schedule (Well-Age)</h4>
        <label className="flex items-center gap-2 text-[10px] text-theme-muted select-none">
          <input
            type="checkbox"
            checked={chainSegments}
            onChange={e => setChainSegments(e.target.checked)}
            className="accent-theme-cyan"
          />
          Chain segments
        </label>
      </div>

      <EditableItemTable
        items={segments}
        getKey={(seg) => seg.id}
        columns={[
          { label: 'SEGMENT', className: 'col-span-3' },
          { label: 'START', className: 'col-span-1 text-center' },
          { label: 'END', className: 'col-span-1 text-center' },
          { label: 'FIXED ($/W/MO)', className: 'col-span-2 text-right' },
          { label: 'OIL ($/BBL)', className: 'col-span-2 text-right' },
          { label: 'GAS ($/MCF)', className: 'col-span-2 text-right' },
          { label: '', className: 'col-span-1 text-center' },
        ]}
        onAdd={handleAddSegment}
        addLabel="+ Add Segment"
        onDelete={(seg) => handleDeleteSegment(seg.id)}
        emptyState="No OPEX segments defined."
        footerRight={
          <>Fixed basis: <span className="text-theme-text font-mono font-medium">$/well/mo</span></>
        }
        renderCells={(seg) => (
          <>
            <div className="col-span-3 p-1">
              <InlineEditableValue
                value={seg.label}
                onCommit={(v) => handleUpdateSegment(seg.id, { label: v })}
                type="text"
                className={isClassic ? 'text-[10px] text-white/80' : 'text-[10px] text-theme-muted'}
                inputClassName={inlineInputClass}
              />
            </div>

            <div className="col-span-1 p-1">
              <InlineEditableValue
                value={seg.startMonth}
                onCommit={(v) => handleUpdateSegment(seg.id, { startMonth: parseInt(v, 10) || 1 })}
                type="number"
                validate={(raw) => {
                  const n = parseInt(raw, 10);
                  if (isNaN(n) || n < 1) return 'Min 1';
                  return null;
                }}
                className={`${inlineValueClass} text-center`}
                inputClassName={`${inlineInputClass} text-center`}
              />
            </div>

            <div className="col-span-1 p-1">
              <InlineEditableValue
                value={seg.endMonth}
                onCommit={(v) => handleUpdateSegment(seg.id, { endMonth: parseInt(v, 10) || seg.startMonth })}
                type="number"
                validate={(raw) => {
                  const n = parseInt(raw, 10);
                  if (isNaN(n) || n < 1) return 'Min 1';
                  return null;
                }}
                className={`${inlineValueClass} text-center`}
                inputClassName={`${inlineInputClass} text-center`}
              />
            </div>

            <div className="col-span-2 p-1">
              <InlineEditableValue
                value={seg.fixedPerWellPerMonth}
                onCommit={(v) => handleUpdateSegment(seg.id, { fixedPerWellPerMonth: parseFloat(v) || 0 })}
                format={(v) => `$${Number(v).toLocaleString()}`}
                type="number"
                className={`${inlineValueClass} text-right`}
                inputClassName={`${inlineInputClass} text-right`}
              />
            </div>

            <div className="col-span-2 p-1">
              <InlineEditableValue
                value={seg.variableOilPerBbl}
                onCommit={(v) => handleUpdateSegment(seg.id, { variableOilPerBbl: parseFloat(v) || 0 })}
                format={(v) => Number(v).toFixed(2)}
                type="number"
                className={`${inlineValueClass} text-right`}
                inputClassName={`${inlineInputClass} text-right`}
              />
            </div>

            <div className="col-span-2 p-1">
              <InlineEditableValue
                value={seg.variableGasPerMcf}
                onCommit={(v) => handleUpdateSegment(seg.id, { variableGasPerMcf: parseFloat(v) || 0 })}
                format={(v) => Number(v).toFixed(2)}
                type="number"
                className={`${inlineValueClass} text-right`}
                inputClassName={`${inlineInputClass} text-right`}
              />
            </div>
          </>
        )}
      />
    </div>
  );
};

export default OpexControls;
