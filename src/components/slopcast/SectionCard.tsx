import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

interface SectionCardProps {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  panelStyle?: 'glass' | 'solid' | 'outline';
}

const sectionStyleMap: Record<'glass' | 'solid' | 'outline', string> = {
  glass: 'bg-theme-surface1/70 border-theme-border shadow-card',
  solid: 'bg-theme-surface1 border-theme-border shadow-card',
  outline: 'bg-theme-surface1/30 border-theme-border/60',
};

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  action,
  className = '',
  bodyClassName = '',
  children,
  panelStyle = 'glass',
}) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;

  return (
    <div
      className={
        isClassic
          ? `sc-panel theme-transition overflow-hidden ${className}`
          : `rounded-panel border theme-transition ${sectionStyleMap[panelStyle]} ${className}`
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
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default SectionCard;
