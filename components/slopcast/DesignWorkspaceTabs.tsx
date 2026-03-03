import React from 'react';

export type DesignWorkspace = 'WELLS' | 'ECONOMICS';

export interface DesignWorkspaceTabsProps {
  isClassic: boolean;
  workspace: DesignWorkspace;
  onChange: (workspace: DesignWorkspace) => void;
  economicsNeedsAttention: boolean;
  wellsNeedsAttention: boolean;
  compact?: boolean;
}

const DesignWorkspaceTabs: React.FC<DesignWorkspaceTabsProps> = ({
  isClassic,
  workspace,
  onChange,
  economicsNeedsAttention,
  wellsNeedsAttention,
  compact = false,
}) => {
  const buttonClass = (target: DesignWorkspace) => {
    const active = workspace === target;
    if (isClassic) {
      return `${compact ? 'px-2 sm:px-3 py-1.5 text-[8px] md:text-[9px]' : 'px-4 py-2 text-[10px]'} rounded-inner font-bold uppercase tracking-[0.2em] border-2 transition-all whitespace-nowrap ${
        active
          ? 'bg-theme-warning text-black border-black/20'
          : 'bg-black/15 text-white/60 border-black/25 hover:text-white/90'
      }`;
    }

    return `relative ${compact ? 'px-2 sm:px-3 py-1.5 text-[8px] md:text-[9px]' : 'px-4 py-2 text-[10px]'} rounded-inner font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
      active
        ? 'bg-theme-cyan/15 text-theme-cyan border border-theme-cyan/50'
        : 'bg-transparent text-theme-muted border border-transparent hover:text-theme-text hover:bg-theme-surface2/50'
    }`;
  };

  const dotClass = (warning: boolean) => {
    if (warning) return 'w-1.5 h-1.5 rounded-full bg-theme-warning animate-pulse';
    return 'w-1.5 h-1.5 rounded-full bg-theme-success';
  };

  return (
    <div
      data-testid="design-workspace-tabs"
      className={`border ${compact ? 'p-1.5' : 'p-2'} theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 border-theme-border shadow-card backdrop-blur-sm'
      }`}
    >
      <div className={`grid grid-cols-2 ${compact ? 'gap-1' : 'gap-2'}`}>
        <button data-testid="design-workspace-wells" onClick={() => onChange('WELLS')} className={buttonClass('WELLS')}>
          <span className="flex items-center gap-1.5 justify-center">
            Wells
            {wellsNeedsAttention && <span className={dotClass(true)} title="Needs setup" />}
          </span>
        </button>
        <button data-testid="design-workspace-economics" onClick={() => onChange('ECONOMICS')} className={buttonClass('ECONOMICS')}>
          <span className="flex items-center gap-1.5 justify-center">
            Economics
            {economicsNeedsAttention && <span className={dotClass(true)} title="Needs rerun" />}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DesignWorkspaceTabs;
