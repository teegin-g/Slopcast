import React from 'react';

interface SectionCardProps {
  isClassic: boolean;
  title?: string;
  action?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  noBodyPadding?: boolean;
  children: React.ReactNode;
  panelStyle?: 'glass' | 'solid' | 'outline';
}

const sectionStyleMap: Record<'glass' | 'solid' | 'outline', string> = {
  glass: 'bg-theme-surface1/72 border-theme-border shadow-card',
  solid: 'bg-theme-surface1 border-theme-border shadow-card',
  outline: 'bg-theme-surface1/35 border-theme-border/60',
};

const SectionCard: React.FC<SectionCardProps> = ({
  isClassic,
  title,
  action,
  className = '',
  headerClassName = '',
  titleClassName = '',
  bodyClassName = '',
  noBodyPadding = false,
  children,
  panelStyle = 'glass',
}) => {
  return (
    <div
      className={
        isClassic
          ? `sc-panel theme-transition overflow-hidden ${className}`
          : `rounded-panel border theme-transition overflow-hidden ${sectionStyleMap[panelStyle]} ${className}`
      }
    >
      {(title || action) && (
        <div
          className={
            isClassic
              ? `sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex items-center justify-between gap-3 ${headerClassName}`
              : `px-5 py-4 border-b border-theme-border/60 flex items-center justify-between gap-3 ${headerClassName}`
          }
        >
          <h3
            className={
              isClassic
                ? `text-[10px] font-black uppercase tracking-[0.24em] text-white ${titleClassName}`
                : `typo-section heading-font ${titleClassName}`
            }
          >
            {title}
          </h3>
          {action}
        </div>
      )}
      <div
        className={
          isClassic
            ? `${noBodyPadding ? '' : 'p-4'} ${bodyClassName}`
            : `${noBodyPadding ? '' : 'p-5'} ${bodyClassName}`
        }
      >
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
