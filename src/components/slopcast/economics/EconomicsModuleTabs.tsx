import React from 'react';
import { ECONOMICS_MODULES, EconomicsModule } from './types';
import { accentClass } from './EconomicsPrimitives';
import type { Phase1WorkflowId } from '../workflowModel';

interface EconomicsModuleTabsProps {
  module: EconomicsModule;
  onChange: (module: EconomicsModule) => void;
  activeWorkflow?: Phase1WorkflowId;
}

const EconomicsModuleTabs: React.FC<EconomicsModuleTabsProps> = ({ module, onChange, activeWorkflow }) => {
  return (
    <nav className="rounded-panel border border-theme-border bg-theme-surface1/55 shadow-card p-2 theme-transition" aria-label="Economics modules">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {ECONOMICS_MODULES.map((item) => {
          const pdpLabel = activeWorkflow === 'PDP' && item.id === 'PRODUCTION' ? 'PDP Forecast' : item.shortLabel;
          const pdpEyebrow = activeWorkflow === 'PDP' && item.id === 'PRODUCTION'
            ? 'History-driven decline'
            : activeWorkflow === 'PDP' && item.id === 'CAPEX'
              ? 'Maintenance capital'
              : item.eyebrow;
          const active = item.id === module;
          const tone = accentClass(item.accent);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-pressed={active}
              data-testid={`economics-module-tab-${item.id.toLowerCase()}`}
              className={`rounded-inner border px-3 py-2 text-left transition-colors min-h-[56px] ${
                active
                  ? `${tone.border} ${tone.bg} text-theme-text`
                  : 'border-theme-border bg-theme-bg/80 text-theme-muted hover:text-theme-text hover:bg-theme-surface2/55'
              }`}
            >
              <span className={`block text-[9px] font-black uppercase tracking-[0.15em] ${active ? tone.text : ''}`}>
                {pdpLabel}
              </span>
              <span className="mt-1 block text-[9px] leading-snug text-theme-muted">{pdpEyebrow}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default EconomicsModuleTabs;
