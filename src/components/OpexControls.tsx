import React, { useMemo, useState } from 'react';
import { OpexAssumptions, OpexSegment } from '../types';
import { useTheme } from '../theme/ThemeProvider';

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
  const isClassic = theme.id === 'mario';

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
      id: `o-${Date.now()}`,
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

  const inputClass = isClassic
    ? 'w-full rounded-md px-2 py-1 text-[10px] font-black sc-inputNavy'
    : 'w-full bg-transparent text-theme-text px-1 rounded outline-none text-[10px] font-mono focus:bg-theme-surface1/50';

  const headerClass = isClassic
    ? 'bg-black/10 border-black/30'
    : 'bg-theme-bg border-theme-border';

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

      <div className={`border rounded-inner overflow-hidden ${isClassic ? 'border-black/30 bg-black/10' : 'border-theme-border bg-theme-bg'}`}>
        <div className={`grid grid-cols-12 gap-0 text-[10px] font-bold text-theme-muted p-2 border-b ${headerClass}`}>
          <div className="col-span-3">SEGMENT</div>
          <div className="col-span-1 text-center">START</div>
          <div className="col-span-1 text-center">END</div>
          <div className="col-span-2 text-right">FIXED ($/W/MO)</div>
          <div className="col-span-2 text-right">OIL ($/BBL)</div>
          <div className="col-span-2 text-right">GAS ($/MCF)</div>
          <div className="col-span-1 text-center"></div>
        </div>

        <div className="max-h-64 overflow-y-auto scrollbar-hide">
          {segments.map(seg => (
            <div key={seg.id} className="grid grid-cols-12 gap-0 border-b border-theme-border text-[10px] items-center hover:bg-theme-surface1/30 group transition-colors">
              <div className="col-span-3 p-1">
                <input
                  type="text"
                  value={seg.label}
                  onChange={e => handleUpdateSegment(seg.id, { label: e.target.value })}
                  className={isClassic ? 'w-full bg-transparent text-white/80 focus:text-white px-1 rounded outline-none' : 'w-full bg-transparent text-theme-muted focus:text-theme-text focus:bg-theme-surface1/50 px-1 rounded outline-none'}
                />
              </div>

              <div className="col-span-1 p-1">
                <input
                  type="number"
                  min={1}
                  value={seg.startMonth}
                  onChange={e => handleUpdateSegment(seg.id, { startMonth: parseInt(e.target.value, 10) || 1 })}
                  className={`${inputClass} text-center`}
                />
              </div>

              <div className="col-span-1 p-1">
                <input
                  type="number"
                  min={1}
                  value={seg.endMonth}
                  onChange={e => handleUpdateSegment(seg.id, { endMonth: parseInt(e.target.value, 10) || seg.startMonth })}
                  className={`${inputClass} text-center`}
                />
              </div>

              <div className="col-span-2 p-1">
                <input
                  type="number"
                  value={seg.fixedPerWellPerMonth}
                  onChange={e => handleUpdateSegment(seg.id, { fixedPerWellPerMonth: parseFloat(e.target.value) || 0 })}
                  className={`${inputClass} text-right`}
                />
              </div>

              <div className="col-span-2 p-1">
                <input
                  type="number"
                  step="0.01"
                  value={seg.variableOilPerBbl}
                  onChange={e => handleUpdateSegment(seg.id, { variableOilPerBbl: parseFloat(e.target.value) || 0 })}
                  className={`${inputClass} text-right`}
                />
              </div>

              <div className="col-span-2 p-1">
                <input
                  type="number"
                  step="0.01"
                  value={seg.variableGasPerMcf}
                  onChange={e => handleUpdateSegment(seg.id, { variableGasPerMcf: parseFloat(e.target.value) || 0 })}
                  className={`${inputClass} text-right`}
                />
              </div>

              <div className="col-span-1 text-center">
                <button
                  onClick={() => handleDeleteSegment(seg.id)}
                  className="text-theme-border hover:text-theme-danger w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}

          {segments.length === 0 && (
            <div className="p-4 text-center text-theme-muted text-[10px] italic">
              No OPEX segments defined.
            </div>
          )}
        </div>

        <div className={`p-2 flex justify-between items-center border-t ${headerClass}`}>
          <button onClick={handleAddSegment} className="text-[10px] text-theme-cyan hover:opacity-80 font-medium transition-colors">
            + Add Segment
          </button>
          <div className="text-[10px] text-theme-muted">
            Fixed basis: <span className="text-theme-text font-mono font-medium">$/well/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpexControls;

