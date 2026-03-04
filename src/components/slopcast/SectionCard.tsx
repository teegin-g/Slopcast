import React from 'react';

interface SectionCardProps {
  isClassic: boolean;
  title?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  isClassic,
  title,
  action,
  className = '',
  bodyClassName = '',
  children,
}) => {
  return (
    <div
      className={
        isClassic
          ? `sc-panel theme-transition overflow-hidden ${className}`
          : `rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border ${className}`
      }
    >
      {(title || action) && (
        <div
          className={
            isClassic
              ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex items-center justify-between'
              : 'px-4 py-3 border-b border-theme-border/60 flex items-center justify-between'
          }
        >
          <h3
            className={
              isClassic
                ? 'text-[11px] font-black uppercase tracking-[0.24em] text-white'
                : 'text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan'
            }
          >
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={isClassic ? `p-4 ${bodyClassName}` : `p-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default SectionCard;
