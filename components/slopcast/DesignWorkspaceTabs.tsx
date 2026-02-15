import React from 'react';

export type DesignWorkspace = 'WELLS' | 'ECONOMICS';

export interface DesignWorkspaceTabsProps {
  isClassic: boolean;
  workspace: DesignWorkspace;
  onChange: (workspace: DesignWorkspace) => void;
  economicsNeedsAttention: boolean;
  wellsNeedsAttention: boolean;
}

const DesignWorkspaceTabs: React.FC<DesignWorkspaceTabsProps> = ({
  isClassic,
  workspace,
  onChange,
  economicsNeedsAttention,
  wellsNeedsAttention,
}) => {
  const buttonClass = (target: DesignWorkspace) => {
    if (isClassic) {
      return `px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all ${
        workspace === target
          ? 'bg-theme-warning text-black border-black/20'
          : 'bg-black/15 text-white/90 border-black/25'
      }`;
    }

    return `px-4 py-2 rounded-inner text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
      workspace === target
        ? 'bg-theme-cyan text-theme-bg border-theme-cyan shadow-glow-cyan'
        : 'bg-theme-bg text-theme-muted border-theme-border hover:text-theme-text'
    }`;
  };

  const badgeClass = (warning: boolean) => {
    if (isClassic) {
      return warning ? 'bg-theme-magenta text-white' : 'bg-theme-cyan text-white';
    }
    return warning ? 'bg-theme-warning text-theme-bg' : 'bg-theme-surface2 text-theme-cyan';
  };

  return (
    <div
      className={`mb-4 border p-2 theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 border-theme-border shadow-card backdrop-blur-sm'
      }`}
    >
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onChange('WELLS')} className={buttonClass('WELLS')}>
          Wells
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-black ${badgeClass(wellsNeedsAttention)}`}>
            {wellsNeedsAttention ? 'Needs setup' : 'Ready'}
          </span>
        </button>
        <button onClick={() => onChange('ECONOMICS')} className={buttonClass('ECONOMICS')}>
          Economics
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[8px] font-black ${badgeClass(economicsNeedsAttention)}`}>
            {economicsNeedsAttention ? 'Rerun' : 'Current'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DesignWorkspaceTabs;
