import React from 'react';
import { motion } from 'motion/react';
import { KbdBadge } from './KbdBadge';

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
  const railClass = isClassic
    ? 'sc-panel'
    : 'rounded-full bg-theme-surface1/25 border-theme-border/35 shadow-[inset_0_1px_0_rgb(var(--text)/0.05)]';

  const buttonClass = (target: DesignWorkspace) => {
    if (isClassic) {
      return `${compact ? 'min-h-[27px] px-2.5 sm:px-3.5 text-[7px] md:text-[9px]' : 'min-h-[38px] px-4 text-xs'} rounded-full font-bold uppercase tracking-[0.14em] transition-all whitespace-nowrap overflow-hidden ${
        workspace === target
          ? 'text-black'
          : 'bg-black/10 text-white/70 border-black/20'
      }`;
    }

    return `${compact ? 'min-h-[27px] px-2.5 sm:px-3.5 text-[7px] md:text-[9px]' : 'min-h-[38px] px-4 text-xs'} rounded-full font-bold uppercase tracking-[0.14em] transition-all whitespace-nowrap overflow-hidden ${
      workspace === target
        ? 'text-theme-bg'
        : 'text-theme-muted/75 hover:text-theme-text'
    }`;
  };

  const badgeClass = (warning: boolean) => {
    if (isClassic) {
      return warning ? 'bg-theme-magenta/90 text-white' : 'bg-black/15 text-black/75';
    }
    return warning
      ? 'bg-theme-warning/90 text-theme-bg shadow-[0_0_0_1px_rgb(var(--warning)/0.18)]'
      : 'bg-theme-surface2/70 text-theme-muted/90 shadow-[inset_0_1px_0_rgb(var(--text)/0.05)]';
  };

  return (
    <div
      data-testid="design-workspace-tabs"
      className={`border ${compact ? 'p-1' : 'p-1.5'} theme-transition ${
        railClass
      }`}
    >
      <div className={`grid grid-cols-2 items-stretch ${compact ? 'gap-1' : 'gap-1.5'}`}>
        {(['WELLS', 'ECONOMICS'] as const).map((target) => (
          <button
            key={target}
            data-testid={`design-workspace-${target.toLowerCase()}`}
            onClick={() => onChange(target)}
            className={`relative focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none ${buttonClass(target)}`}
          >
            {workspace === target && (
              <motion.div
                layoutId="designWorkspaceActiveTab"
                className={`absolute inset-0 rounded-full ${
                  isClassic
                    ? 'bg-theme-warning shadow-[0_10px_24px_rgba(0,0,0,0.18)]'
                    : 'bg-theme-cyan shadow-[0_8px_20px_rgb(var(--cyan)/0.22),inset_0_1px_0_rgb(255_255_255/0.18)]'
                }`}
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-between gap-2 ${compact ? 'px-0.5' : ''}`}>
              <span className="flex min-w-0 items-center gap-1.5">
                <span>{target === 'WELLS' ? 'Wells' : 'Economics'}</span>
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[6.5px] md:text-[8px] font-black uppercase tracking-[0.11em] ${badgeClass(target === 'WELLS' ? wellsNeedsAttention : economicsNeedsAttention)}`}
                >
                  {target === 'WELLS'
                    ? (wellsNeedsAttention ? 'Needs setup' : 'Ready')
                    : (economicsNeedsAttention ? 'Rerun' : 'Current')
                  }
                </span>
              </span>
              {!compact && <KbdBadge keys={target === 'WELLS' ? '⌘1' : '⌘2'} />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DesignWorkspaceTabs;
