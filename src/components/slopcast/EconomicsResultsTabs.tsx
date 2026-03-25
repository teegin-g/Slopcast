import React from 'react';
import { motion } from 'motion/react';

export type EconomicsResultsTab = 'SUMMARY' | 'CHARTS' | 'CASH_FLOW' | 'DRIVERS' | 'RESERVES';

export interface EconomicsResultsTabsProps {
  isClassic: boolean;
  tab: EconomicsResultsTab;
  onChange: (tab: EconomicsResultsTab) => void;
  hasFlowData?: boolean;
}

const tabs: Array<{ id: EconomicsResultsTab; label: string }> = [
  { id: 'SUMMARY', label: 'Summary' },
  { id: 'CHARTS', label: 'Charts' },
  { id: 'CASH_FLOW', label: 'Cash Flow' },
  { id: 'DRIVERS', label: 'Drivers' },
  { id: 'RESERVES', label: 'Reserves' },
];

const EconomicsResultsTabs: React.FC<EconomicsResultsTabsProps> = ({
  isClassic,
  tab,
  onChange,
  hasFlowData = true,
}) => {
  return (
    <div
      className={`border p-2 theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 border-theme-border shadow-card'
      }`}
    >
      <div className="grid grid-cols-5 gap-2">
        {tabs.map((item) => {
          const active = tab === item.id;
          const disabled = item.id === 'CASH_FLOW' && !hasFlowData;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => !disabled && onChange(item.id)}
              disabled={disabled}
              title={disabled ? 'Run economics to see cash flow' : undefined}
              data-testid={`economics-results-tab-${item.id.toLowerCase()}`}
              className={`relative isolate ${
                disabled ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                isClassic
                  ? `px-3 py-2 rounded-inner text-xs font-black uppercase tracking-widest border-2 shadow-card transition-colors ${
                      active ? 'text-black border-black/20' : 'bg-black/15 text-white/90 border-black/25'
                    }`
                  : `px-3 py-2 rounded-inner text-xs font-black uppercase tracking-widest border transition-colors ${
                      active
                        ? 'text-theme-bg border-theme-cyan shadow-glow-cyan'
                        : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text'
                    }`
              }`}
            >
              {active && !disabled && (
                <motion.div
                  layoutId="economicsResultsActiveTab"
                  className={`absolute inset-0 rounded-inner ${
                    isClassic ? 'bg-theme-warning' : 'bg-theme-cyan'
                  }`}
                  style={{ zIndex: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EconomicsResultsTabs;
