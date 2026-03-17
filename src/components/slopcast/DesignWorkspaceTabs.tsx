import React from 'react';
import { motion } from 'motion/react';

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
    if (isClassic) {
      return `${compact ? 'px-2 sm:px-3 py-1 text-[7px] md:text-[8px]' : 'px-4 py-2 text-[10px]'} rounded-inner font-bold uppercase tracking-[0.15em] border-2 transition-all whitespace-nowrap overflow-hidden ${
        workspace === target
          ? 'text-black border-black/20'
          : 'bg-black/10 text-white/70 border-black/20'
      }`;
    }

    return `${compact ? 'px-2 sm:px-3 py-1 text-[7px] md:text-[8px]' : 'px-4 py-2 text-[10px]'} rounded-inner font-bold uppercase tracking-[0.15em] border transition-all whitespace-nowrap overflow-hidden ${
      workspace === target
        ? 'text-theme-bg border-theme-cyan/60 shadow-sm'
        : 'bg-theme-bg/50 text-theme-muted/70 border-theme-border/60 hover:text-theme-muted'
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
      data-testid="design-workspace-tabs"
      className={`border ${compact ? 'p-1' : 'p-2'} theme-transition ${
        isClassic ? 'sc-panel' : 'rounded-inner bg-theme-surface1/40 border-theme-border/50 shadow-sm backdrop-blur-sm'
      }`}
    >
      <div className={`grid grid-cols-2 ${compact ? 'gap-1' : 'gap-2'}`}>
        {(['WELLS', 'ECONOMICS'] as const).map((target) => (
          <button
            key={target}
            data-testid={`design-workspace-${target.toLowerCase()}`}
            onClick={() => onChange(target)}
            className={`relative ${buttonClass(target)}`}
          >
            {workspace === target && (
              <motion.div
                layoutId="designWorkspaceActiveTab"
                className={`absolute inset-0 rounded-inner ${
                  isClassic ? 'bg-theme-warning' : 'bg-theme-cyan/80'
                }`}
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {target === 'WELLS' ? 'Wells' : 'Economics'}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-black ${badgeClass(target === 'WELLS' ? wellsNeedsAttention : economicsNeedsAttention)}`}>
                {target === 'WELLS'
                  ? (wellsNeedsAttention ? 'Needs setup' : 'Ready')
                  : (economicsNeedsAttention ? 'Rerun' : 'Current')
                }
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DesignWorkspaceTabs;
