import React from 'react';
import { JvAgreement, OwnershipAssumptions } from '../types/economics';
import { useTheme } from '../theme/ThemeProvider';
import { InlineEditableValue } from './inline/InlineEditableValue';
import { createLocalId } from '../utils/id';
import { EditableItemTable } from './slopcast/economics/EditableItemTable';
import { useControlsStyles } from './slopcast/economics/useControlsStyles';

interface OwnershipControlsProps {
  ownership: OwnershipAssumptions;
  onChange: (updated: OwnershipAssumptions) => void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const pctValidate = (raw: string): string | null => {
  const n = parseFloat(raw);
  if (isNaN(n)) return 'Must be a number';
  if (n < 0 || n > 100) return '0-100%';
  return null;
};
const pctToDec = (pct: number) => clamp01((Number.isFinite(pct) ? pct : 0) / 100);
const decToPct = (dec: number) => (clamp01(dec) * 100);

const OwnershipControls: React.FC<OwnershipControlsProps> = ({ ownership, onChange }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;

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
      id: createLocalId('jv'),
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

  const labelClass = isClassic
    ? 'text-[9px] font-black uppercase tracking-[0.2em] mb-2 block text-theme-warning'
    : 'text-[9px] font-black uppercase tracking-[0.2em] mb-2 block text-theme-muted';

  const baseValueClass = isClassic ? 'text-[11px] font-black text-white' : 'text-[11px] font-black text-theme-text';
  const baseInputClass = 'text-[11px] w-20';

  const { inlineValueClass: gridInlineClass, inlineInputClass: gridInputClass } = useControlsStyles(isClassic);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ownership-base-nri" className={labelClass}>Base NRI (%)</label>
          <InlineEditableValue
            id="ownership-base-nri"
            value={decToPct(ownership.baseNri).toFixed(1)}
            onCommit={(v) => updateOwnership({ baseNri: pctToDec(parseFloat(v) || 0) })}
            format={(v) => `${Number(v).toFixed(1)}%`}
            parse={(raw) => raw}
            type="number"
            validate={pctValidate}
            className={baseValueClass}
            inputClassName={baseInputClass}
          />
        </div>
        <div>
          <label htmlFor="ownership-base-cost-interest" className={labelClass}>Base Cost Interest (%)</label>
          <InlineEditableValue
            id="ownership-base-cost-interest"
            value={decToPct(ownership.baseCostInterest).toFixed(1)}
            onCommit={(v) => updateOwnership({ baseCostInterest: pctToDec(parseFloat(v) || 0) })}
            format={(v) => `${Number(v).toFixed(1)}%`}
            parse={(raw) => raw}
            type="number"
            validate={pctValidate}
            className={baseValueClass}
            inputClassName={baseInputClass}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-theme-text">JV Agreements (Payout-Based Reversion)</h4>
        <div className="text-[10px] text-theme-muted">
          Inputs are <span className="text-theme-text font-mono">%</span> conveyed of base interests.
        </div>
      </div>

      <EditableItemTable
        items={ownership.agreements || []}
        getKey={(a) => a.id}
        columns={[
          { label: 'AGREEMENT', className: 'col-span-3' },
          { label: 'START', className: 'col-span-1 text-center' },
          { label: 'PRE REV %', className: 'col-span-2 text-right' },
          { label: 'PRE COST %', className: 'col-span-2 text-right' },
          { label: 'POST REV %', className: 'col-span-2 text-right' },
          { label: 'POST C%', className: 'col-span-1 text-right' },
          { label: '', className: 'col-span-1 text-center' },
        ]}
        onAdd={addAgreement}
        addLabel="+ Add Agreement"
        onDelete={(a) => deleteAgreement(a.id)}
        deleteAriaLabel={() => 'Delete agreement'}
        emptyState="No JV agreements defined."
        footerRight={
          <>Model: <span className="text-theme-text font-mono font-medium">payout-based</span></>
        }
        renderCells={(a) => (
          <>
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
          </>
        )}
      />
    </div>
  );
};

export default OwnershipControls;
