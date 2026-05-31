import React from 'react';
import type { TaxAssumptions } from '../types';
import { TAX_PRESETS } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { InlineEditableValue } from './inline/InlineEditableValue';
import { useControlsStyles } from './slopcast/economics/useControlsStyles';

interface TaxControlsProps {
  tax: TaxAssumptions;
  onChange: (tax: TaxAssumptions) => void;
}

const PRESET_NAMES = Object.keys(TAX_PRESETS);

const TaxControls: React.FC<TaxControlsProps> = ({ tax, onChange }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;

  const labelClass = isClassic
    ? 'text-[9px] font-black block mb-2 uppercase tracking-[0.2em] text-theme-warning'
    : 'text-[9px] font-black block mb-2 uppercase tracking-[0.2em] text-theme-muted';

  const selectClass = isClassic
    ? 'w-full rounded-inner px-2 py-1 text-[10px] font-black sc-inputNavy'
    : 'w-full bg-theme-bg border border-theme-border rounded-inner px-3 py-2 text-xs text-theme-text outline-none focus:border-theme-cyan theme-transition';

  const { inlineValueClass, inlineInputClass } = useControlsStyles(isClassic);

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
        <label htmlFor="tax-state-preset" className={labelClass}>State Preset</label>
        <select
          id="tax-state-preset"
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
          <label htmlFor="tax-severance" className={labelClass}>Severance Tax %</label>
          <InlineEditableValue
            id="tax-severance"
            value={tax.severanceTaxPct}
            onCommit={(v) => handleFieldChange('severanceTaxPct', v)}
            format={(v) => `${Number(v).toFixed(2)}%`}
            type="number"
            validate={(raw) => {
              const n = parseFloat(raw);
              if (isNaN(n) || n < 0) return 'Must be >= 0';
              return null;
            }}
            className={`${inlineValueClass}`}
            inputClassName={`${inlineInputClass} w-full`}
          />
        </div>
        <div>
          <label htmlFor="tax-advalorem" className={labelClass}>Ad Valorem %</label>
          <InlineEditableValue
            id="tax-advalorem"
            value={tax.adValoremTaxPct}
            onCommit={(v) => handleFieldChange('adValoremTaxPct', v)}
            format={(v) => `${Number(v).toFixed(2)}%`}
            type="number"
            validate={(raw) => {
              const n = parseFloat(raw);
              if (isNaN(n) || n < 0) return 'Must be >= 0';
              return null;
            }}
            className={`${inlineValueClass}`}
            inputClassName={`${inlineInputClass} w-full`}
          />
        </div>
        <div>
          <label htmlFor="tax-federal" className={labelClass}>Federal Tax Rate %</label>
          <InlineEditableValue
            id="tax-federal"
            value={tax.federalTaxRate}
            onCommit={(v) => handleFieldChange('federalTaxRate', v)}
            format={(v) => `${Number(v).toFixed(2)}%`}
            type="number"
            validate={(raw) => {
              const n = parseFloat(raw);
              if (isNaN(n) || n < 0) return 'Must be >= 0';
              return null;
            }}
            className={`${inlineValueClass}`}
            inputClassName={`${inlineInputClass} w-full`}
          />
        </div>
        <div>
          <label htmlFor="tax-depletion" className={labelClass}>Depletion Allowance %</label>
          <InlineEditableValue
            id="tax-depletion"
            value={tax.depletionAllowancePct}
            onCommit={(v) => handleFieldChange('depletionAllowancePct', v)}
            format={(v) => `${Number(v).toFixed(2)}%`}
            type="number"
            validate={(raw) => {
              const n = parseFloat(raw);
              if (isNaN(n) || n < 0) return 'Must be >= 0';
              return null;
            }}
            className={`${inlineValueClass}`}
            inputClassName={`${inlineInputClass} w-full`}
          />
        </div>
        <div>
          <label htmlFor="tax-state" className={labelClass}>State Tax Rate %</label>
          <InlineEditableValue
            id="tax-state"
            value={tax.stateTaxRate}
            onCommit={(v) => handleFieldChange('stateTaxRate', v)}
            format={(v) => `${Number(v).toFixed(2)}%`}
            type="number"
            validate={(raw) => {
              const n = parseFloat(raw);
              if (isNaN(n) || n < 0) return 'Must be >= 0';
              return null;
            }}
            className={`${inlineValueClass}`}
            inputClassName={`${inlineInputClass} w-full`}
          />
        </div>
      </div>
    </div>
  );
};

export default TaxControls;
