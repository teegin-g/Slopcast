import React from 'react';

export type EconomicsResultsTab = 'SUMMARY' | 'CHARTS' | 'DRIVERS';

export interface EconomicsResultsTabsProps {
  isClassic: boolean;
  tab: EconomicsResultsTab;
  onChange: (tab: EconomicsResultsTab) => void;
}

const tabs: Array<{ id: EconomicsResultsTab; label: string }> = [
  { id: 'SUMMARY', label: 'Summary' },
  { id: 'CHARTS', label: 'Charts' },
  { id: 'DRIVERS', label: 'Drivers' },
];

const EconomicsResultsTabs: React.FC<EconomicsResultsTabsProps> = ({
  isClassic,
  tab,
  onChange,
}) => {
  return (
    <div
      className={`border p-2 theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 border-theme-border shadow-card'
      }`}
    >
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              data-testid={`economics-results-tab-${item.id.toLowerCase()}`}
              className={
                isClassic
                  ? `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                      active ? 'bg-theme-warning text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                    }`
                  : `px-3 py-2 rounded-inner text-[9px] font-black uppercase tracking-widest border transition-colors ${
                      active
                        ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
                        : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text'
                    }`
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EconomicsResultsTabs;
