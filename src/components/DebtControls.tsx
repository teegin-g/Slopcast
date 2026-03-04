import React from 'react';
import { DebtAssumptions, DEFAULT_DEBT_ASSUMPTIONS } from '../types';

interface DebtControlsProps {
  isClassic: boolean;
  debt: DebtAssumptions;
  onChange: (debt: DebtAssumptions) => void;
}

const DebtControls: React.FC<DebtControlsProps> = ({ isClassic, debt, onChange }) => {
  const labelClass = isClassic
    ? 'text-[9px] font-black block mb-2 uppercase tracking-[0.2em] text-theme-warning'
    : 'text-[9px] font-black block mb-2 uppercase tracking-[0.2em] text-theme-muted';

  const inputClass = isClassic
    ? 'w-full rounded-md px-2 py-1 text-[10px] font-black sc-inputNavy'
    : 'w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-cyan theme-transition';

  const sectionTitleClass = isClassic
    ? 'text-[10px] font-black uppercase tracking-[0.15em] text-theme-warning mb-2'
    : 'text-[10px] font-black uppercase tracking-[0.15em] text-theme-muted mb-2';

  const handleToggle = () => {
    onChange({ ...debt, enabled: !debt.enabled });
  };

  const handleFieldChange = (field: keyof DebtAssumptions, value: string) => {
    onChange({ ...debt, [field]: parseFloat(value) || 0 });
  };

  return (
    <div className="space-y-4">
      {/* Enable Leverage Toggle */}
      <div className="flex items-center justify-between">
        <label className={`${labelClass} mb-0`}>Enable Leverage</label>
        <button
          onClick={handleToggle}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
            debt.enabled
              ? isClassic
                ? 'bg-theme-warning'
                : 'bg-theme-cyan'
              : isClassic
                ? 'bg-black/30'
                : 'bg-theme-border'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
              debt.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {!debt.enabled && (
        <div className={`text-center py-4 text-[10px] italic ${isClassic ? 'text-white/40' : 'text-theme-muted'}`}>
          Leverage module disabled
        </div>
      )}

      {debt.enabled && (
        <div className="space-y-4">
          {/* Revolver Section */}
          <div>
            <div className={sectionTitleClass}>Revolver</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Max Draw ($)</label>
                <input
                  type="number"
                  step="1000000"
                  value={debt.revolverSize}
                  onChange={e => handleFieldChange('revolverSize', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={debt.revolverRate}
                  onChange={e => handleFieldChange('revolverRate', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Term Loan Section */}
          <div>
            <div className={sectionTitleClass}>Term Loan</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amount ($)</label>
                <input
                  type="number"
                  step="1000000"
                  value={debt.termLoanAmount}
                  onChange={e => handleFieldChange('termLoanAmount', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={debt.termLoanRate}
                  onChange={e => handleFieldChange('termLoanRate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Amort Period (months)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={debt.termLoanAmortMonths}
                  onChange={e => handleFieldChange('termLoanAmortMonths', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Cash Sweep */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Cash Sweep %</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={debt.cashSweepPct}
                  onChange={e => handleFieldChange('cashSweepPct', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtControls;
