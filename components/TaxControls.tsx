import React from 'react';
import { TaxAssumptions, TAX_PRESETS, DEFAULT_TAX_ASSUMPTIONS } from '../types';

interface TaxControlsProps {
  isClassic: boolean;
  tax: TaxAssumptions;
  onChange: (tax: TaxAssumptions) => void;
}

const PRESET_NAMES = Object.keys(TAX_PRESETS);

const TaxControls: React.FC<TaxControlsProps> = ({ isClassic, tax, onChange }) => {
  const labelClass = isClassic
    ? 'text-[9px] font-black block mb-2 uppercase tracking-[0.2em] text-theme-warning'
    : 'text-[9px] font-black block mb-2 uppercase tracking-[0.2em] text-theme-muted';

  const inputClass = isClassic
    ? 'w-full rounded-md px-2 py-1 text-[10px] font-black sc-inputNavy'
    : 'w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-cyan theme-transition';

  const selectClass = isClassic
    ? 'w-full rounded-md px-2 py-1 text-[10px] font-black sc-inputNavy'
    : 'w-full bg-theme-bg border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-cyan theme-transition';

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    if (TAX_PRESETS[name]) {
      onChange({ ...TAX_PRESETS[name] });
    }
  };

  const handleFieldChange = (field: keyof TaxAssumptions, value: string) => {
    onChange({ ...tax, [field]: parseFloat(value) || 0 });
  };

  // Determine which preset is currently active (if any)
  const activePreset = PRESET_NAMES.find(name => {
    const p = TAX_PRESETS[name];
    return (
      p.severanceTaxPct === tax.severanceTaxPct &&
      p.adValoremTaxPct === tax.adValoremTaxPct &&
      p.federalTaxRate === tax.federalTaxRate &&
      p.depletionAllowancePct === tax.depletionAllowancePct &&
      p.stateTaxRate === tax.stateTaxRate
    );
  }) || '';

  return (
    <div className="space-y-4">
      {/* State Preset Dropdown */}
      <div>
        <label className={labelClass}>State Preset</label>
        <select
          value={activePreset}
          onChange={handlePresetChange}
          className={selectClass}
        >
          <option value="">Custom</option>
          {PRESET_NAMES.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Editable Tax Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Severance Tax %</label>
          <input
            type="number"
            step="0.1"
            value={tax.severanceTaxPct}
            onChange={e => handleFieldChange('severanceTaxPct', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Ad Valorem %</label>
          <input
            type="number"
            step="0.1"
            value={tax.adValoremTaxPct}
            onChange={e => handleFieldChange('adValoremTaxPct', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Federal Tax Rate %</label>
          <input
            type="number"
            step="0.1"
            value={tax.federalTaxRate}
            onChange={e => handleFieldChange('federalTaxRate', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Depletion Allowance %</label>
          <input
            type="number"
            step="0.1"
            value={tax.depletionAllowancePct}
            onChange={e => handleFieldChange('depletionAllowancePct', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>State Tax Rate %</label>
          <input
            type="number"
            step="0.1"
            value={tax.stateTaxRate}
            onChange={e => handleFieldChange('stateTaxRate', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
};

export default TaxControls;
