import React from 'react';
import { ECONOMICS_MODULES, EconomicsModule } from './types';
import { accentClass } from './accentUtils';

interface EconomicsModuleTabsProps {
  module: EconomicsModule;
  onChange: (module: EconomicsModule) => void;
  variant?: 'panel' | 'compact';
}

const EconomicsModuleTabs: React.FC<EconomicsModuleTabsProps> = ({ module, onChange, variant = 'panel' }) => {
  const isCompact = variant === 'compact';

  return (
    <nav
      className={
        isCompact
          ? 'min-w-0 overflow-x-auto'
          : 'rounded-panel border border-theme-border bg-theme-surface1/55 shadow-card p-2 theme-transition'
      }
      aria-label="Economics modules"
    >
      <div className={isCompact ? 'flex min-w-max items-center gap-1 rounded-inner border border-theme-border bg-theme-bg/70 p-1' : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2'}>
        {ECONOMICS_MODULES.map((item) => {
          const active = item.id === module;
          const tone = accentClass(item.accent);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-pressed={active}
              data-testid={`economics-module-tab-${item.id.toLowerCase()}`}
              title={item.eyebrow}
              className={
                isCompact
                  ? `rounded-inner border px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition-colors whitespace-nowrap ${
                      active
                        ? `${tone.border} ${tone.bg} ${tone.text}`
                        : 'border-transparent text-theme-muted hover:text-theme-text hover:bg-theme-surface2/55'
                    }`
                  : `rounded-inner border px-3 py-2 text-left transition-colors min-h-[56px] ${
                      active
                        ? `${tone.border} ${tone.bg} text-theme-text`
                        : 'border-theme-border bg-theme-bg/80 text-theme-muted hover:text-theme-text hover:bg-theme-surface2/55'
                    }`
              }
            >
              <span className={isCompact ? 'block' : `block text-[9px] font-black uppercase tracking-[0.15em] ${active ? tone.text : ''}`}>
                {item.shortLabel}
              </span>
              {!isCompact && <span className="mt-1 block text-[9px] leading-snug text-theme-muted">{item.eyebrow}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default EconomicsModuleTabs;
