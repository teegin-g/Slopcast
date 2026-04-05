import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
  useBrandFont?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, isOpen, onClick, children, useBrandFont }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;
  const sectionId = `scenario-dashboard-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  if (isClassic) {
    return (
      <div className="sc-panel theme-transition mb-3">
        <button
          type="button"
          onClick={onClick}
          aria-expanded={isOpen}
          aria-controls={`${sectionId}-content`}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-all sc-panelTitlebar sc-titlebar--red focus-ring"
        >
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-white ${useBrandFont ? 'brand-font' : 'heading-font'}`}>{title}</span>
          <span className={`transform transition-transform opacity-30 text-white motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isOpen && (
          <div id={`${sectionId}-content`} className="p-4">
            <div className="sc-insetDark rounded-inner p-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`mb-3 overflow-hidden rounded-panel border transition-all duration-300 motion-reduce:transition-none ${isOpen ? 'border-theme-magenta bg-theme-surface1 shadow-glow-magenta' : 'border-theme-border bg-theme-surface1/40'}`}>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={`${sectionId}-content`}
        className={`focus-ring flex w-full items-center justify-between px-5 py-4 text-left transition-all motion-reduce:transition-none ${isOpen ? 'text-theme-cyan' : 'text-theme-muted hover:text-theme-text'}`}
      >
        <span className={`typo-section ${useBrandFont ? 'brand-font' : 'heading-font'}`}>{title}</span>
        <span className={`transform transition-transform opacity-30 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div id={`${sectionId}-content`} className="border-t border-theme-border/20 p-5">{children}</div>}
    </div>
  );
};

export default AccordionItem;
