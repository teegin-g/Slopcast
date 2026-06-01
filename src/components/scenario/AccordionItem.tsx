import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
  useBrandFont?: boolean;
}

/**
 * Collapsible section used by the ScenarioDashboard model editor.
 * Forks classic / modern presentation; extracted verbatim from ScenarioDashboard.
 */
const AccordionItem: React.FC<AccordionItemProps> = ({ title, isOpen, onClick, children, useBrandFont }) => {
  const { theme } = useTheme();
  const isClassic = theme.features.isClassicTheme;

  if (isClassic) {
    return (
      <div className="sc-panel theme-transition mb-3">
        <button
          type="button"
          onClick={onClick}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition-all sc-panelTitlebar sc-titlebar--red"
        >
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-white ${useBrandFont ? 'brand-font' : ''}`}>{title}</span>
          <span className={`transform transition-transform opacity-30 text-white ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isOpen && (
          <div className="p-4">
            <div className="sc-insetDark rounded-lg p-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-panel overflow-hidden transition-all duration-300 mb-3 ${isOpen ? 'bg-theme-surface1 border-theme-magenta shadow-glow-magenta' : 'bg-theme-surface1/40 border-theme-border'}`}>
      <button type="button" onClick={onClick} className={`w-full flex items-center justify-between px-5 py-4 text-left transition-all ${isOpen ? 'text-theme-cyan' : 'text-theme-muted'}`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${useBrandFont ? 'brand-font' : ''}`}>{title}</span>
        <span className={`transform transition-transform opacity-30 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="p-5 border-t border-theme-border/20">{children}</div>}
    </div>
  );
};

export default AccordionItem;
