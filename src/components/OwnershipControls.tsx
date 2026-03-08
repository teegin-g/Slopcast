import React from 'react';
import { JvAgreement, OwnershipAssumptions } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { InlineEditableValue } from './inline/InlineEditableValue';

interface OwnershipControlsProps {
  ownership: OwnershipAssumptions;
  onChange: (updated: OwnershipAssumptions) => void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const pctToDec = (pct: number) => clamp01((Number.isFinite(pct) ? pct : 0) / 100);
const decToPct = (dec: number) => (clamp01(dec) * 100);

const OwnershipControls: React.FC<OwnershipControlsProps> = ({ ownership, onChange }) => {
  const { theme } = useTheme();
  const isClassic = theme.id === 'mario';

  const headerClass = isClassic
    ? 'bg-black/10 border-black/30'
    : 'bg-theme-bg border-theme-border';

  const updateOwnership = (updates: Partial<OwnershipAssumptions>) => {
    onChange({ ...ownership, ...updates });
  };

  const updateAgreement = (id: string, updates: Partial<JvAgreement>) => {
    updateOwnership({
      agreements: (ownership.agreements || []).map(a => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const addAgreement = () => {
    const newAgreement: JvAgreement = {
      id: `jv-${Date.now()}`,
      name: `JV ${ownership.agreements.length + 1}`,
      startMonth: 1,
      prePayout: { conveyRevenuePctOfBase: 0, conveyCostPctOfBase: 0 },
      postPayout: { conveyRevenuePctOfBase: 0, conveyCostPctOfBase: 0 },
    };
    updateOwnership({ agreements: [...(ownership.agreements || []), newAgreement] });
  };

  const deleteAgreement = (id: string) => {
    updateOwnership({ agreements: (ownership.agreements || []).filter(a => a.id !== id) });
  };

  const pctValidate = (raw: string): string | null => {
    const n = parseFloat(raw);
    if (isNaN(n)) return 'Must be a number';
    if (n < 0 || n > 100) return '0-100%';
    return null;
  };

  const labelClass = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.2em] mb-2 block text-theme-warning'
    : 'text-[9px] font-black uppercase tracking-[0.2em] mb-2 block text-theme-muted';

  const inlineValueClass = isClassic ? 'text-[11px] font-black text-white' : 'text-[11px] font-black text-theme-text';
  const inlineInputClass = 'text-[11px] w-20';

  const gridInlineClass = isClassic ? 'text-[10px] font-black text-white' : 'text-[10px] font-mono text-theme-text';
  const gridInputClass = 'text-[10px] w-full';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Base NRI (%)</label>
          <InlineEditableValue
            value={decToPct(ownership.baseNri).toFixed(1)}
            onCommit={(v) => updateOwnership({ baseNri: pctToDec(parseFloat(v) || 0) })}
            format={(v) => `${Number(v).toFixed(1)}%`}
            parse={(raw) => raw}
            type="number"
            validate={pctValidate}
            className={inlineValueClass}
            inputClassName={inlineInputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Base Cost Interest (%)</label>
          <InlineEditableValue
            value={decToPct(ownership.baseCostInterest).toFixed(1)}
            onCommit={(v) => updateOwnership({ baseCostInterest: pctToDec(parseFloat(v) || 0) })}
            format={(v) => `${Number(v).toFixed(1)}%`}
            parse={(raw) => raw}
            type="number"
            validate={pctValidate}
            className={inlineValueClass}
            inputClassName={inlineInputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-theme-text">JV Agreements (Payout-Based Reversion)</h4>
        <div className="text-[10px] text-theme-muted">
          Inputs are <span className="text-theme-text font-mono">%</span> conveyed of base interests.
        </div>
      </div>

      <div className={`border rounded-inner overflow-hidden ${isClassic ? 'border-black/30 bg-black/10' : 'border-theme-border bg-theme-bg'}`}>
        <div className={`grid grid-cols-12 gap-0 text-[10px] font-bold text-theme-muted p-2 border-b ${headerClass}`}>
          <div className="col-span-3">AGREEMENT</div>
          <div className="col-span-1 text-center">START</div>
          <div className="col-span-2 text-right">PRE REV %</div>
          <div className="col-span-2 text-right">PRE COST %</div>
          <div className="col-span-2 text-right">POST REV %</div>
          <div className="col-span-1 text-right">POST C%</div>
          <div className="col-span-1 text-center"></div>
        </div>

        <div className="max-h-64 overflow-y-auto scrollbar-hide">
          {(ownership.agreements || []).map(a => (
            <div key={a.id} className="grid grid-cols-12 gap-0 border-b border-theme-border text-[10px] items-center hover:bg-theme-surface1/30 group transition-colors">
              <div className="col-span-3 p-1">
                <InlineEditableValue
                  value={a.name}
                  onCommit={(v) => updateAgreement(a.id, { name: v })}
                  type="text"
                  className={isClassic ? 'text-[10px] text-white/80' : 'text-[10px] text-theme-muted'}
                  inputClassName={gridInputClass}
                />
              </div>

              <div className="col-span-1 p-1">
                <InlineEditableValue
                  value={a.startMonth}
                  onCommit={(v) => updateAgreement(a.id, { startMonth: Math.max(1, parseInt(v, 10) || 1) })}
                  type="number"
                  validate={(raw) => {
                    const n = parseInt(raw, 10);
                    if (isNaN(n) || n < 1) return 'Min 1';
                    return null;
                  }}
                  className={`${gridInlineClass} text-center`}
                  inputClassName={`${gridInputClass} text-center`}
                />
              </div>

              <div className="col-span-2 p-1">
                <InlineEditableValue
                  value={decToPct(a.prePayout.conveyRevenuePctOfBase).toFixed(1)}
                  onCommit={(v) => updateAgreement(a.id, { prePayout: { ...a.prePayout, conveyRevenuePctOfBase: pctToDec(parseFloat(v) || 0) } })}
                  format={(v) => `${Number(v).toFixed(1)}%`}
                  parse={(raw) => raw}
                  type="number"
                  validate={pctValidate}
                  className={`${gridInlineClass} text-right`}
                  inputClassName={`${gridInputClass} text-right`}
                />
              </div>

              <div className="col-span-2 p-1">
                <InlineEditableValue
                  value={decToPct(a.prePayout.conveyCostPctOfBase).toFixed(1)}
                  onCommit={(v) => updateAgreement(a.id, { prePayout: { ...a.prePayout, conveyCostPctOfBase: pctToDec(parseFloat(v) || 0) } })}
                  format={(v) => `${Number(v).toFixed(1)}%`}
                  parse={(raw) => raw}
                  type="number"
                  validate={pctValidate}
                  className={`${gridInlineClass} text-right`}
                  inputClassName={`${gridInputClass} text-right`}
                />
              </div>

              <div className="col-span-2 p-1">
                <InlineEditableValue
                  value={decToPct(a.postPayout.conveyRevenuePctOfBase).toFixed(1)}
                  onCommit={(v) => updateAgreement(a.id, { postPayout: { ...a.postPayout, conveyRevenuePctOfBase: pctToDec(parseFloat(v) || 0) } })}
                  format={(v) => `${Number(v).toFixed(1)}%`}
                  parse={(raw) => raw}
                  type="number"
                  validate={pctValidate}
                  className={`${gridInlineClass} text-right`}
                  inputClassName={`${gridInputClass} text-right`}
                />
              </div>

              <div className="col-span-1 p-1">
                <InlineEditableValue
                  value={decToPct(a.postPayout.conveyCostPctOfBase).toFixed(1)}
                  onCommit={(v) => updateAgreement(a.id, { postPayout: { ...a.postPayout, conveyCostPctOfBase: pctToDec(parseFloat(v) || 0) } })}
                  format={(v) => `${Number(v).toFixed(1)}%`}
                  parse={(raw) => raw}
                  type="number"
                  validate={pctValidate}
                  className={`${gridInlineClass} text-right`}
                  inputClassName={`${gridInputClass} text-right`}
                />
              </div>

              <div className="col-span-1 text-center">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    deleteAgreement(a.id);
                  }}
                  className="text-theme-border hover:text-theme-danger w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}

          {(ownership.agreements || []).length === 0 && (
            <div className="p-4 text-center text-theme-muted text-[10px] italic">
              No JV agreements defined.
            </div>
          )}
        </div>

        <div className={`p-2 flex justify-between items-center border-t ${headerClass}`}>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              addAgreement();
            }}
            className="text-[10px] text-theme-cyan hover:opacity-80 font-medium transition-colors"
          >
            + Add Agreement
          </button>
          <div className="text-[10px] text-theme-muted">
            Model: <span className="text-theme-text font-mono font-medium">payout-based</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnershipControls;
