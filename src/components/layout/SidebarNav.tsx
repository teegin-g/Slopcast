import React from 'react';
import type { Section } from '../../hooks/useSidebarNav';

interface SidebarNavProps {
  section: Section;
  onSetSection: (s: Section) => void;
  collapsed: boolean;
  isClassic: boolean;
  economicsNeedsAttention?: boolean;
  wellsNeedsAttention?: boolean;
}

const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M7 16l4-8 4 4 5-9" />
  </svg>
);

const LayersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

interface NavItem {
  id: Section;
  label: string;
  Icon: React.FC<{ className?: string }>;
  needsAttention?: boolean;
}

export function SidebarNav({
  section,
  onSetSection,
  collapsed,
  isClassic,
  economicsNeedsAttention,
  wellsNeedsAttention,
}: SidebarNavProps) {
  const items: NavItem[] = [
    { id: 'wells', label: 'Wells', Icon: MapPinIcon, needsAttention: wellsNeedsAttention },
    { id: 'economics', label: 'Economics', Icon: ChartIcon, needsAttention: economicsNeedsAttention },
    { id: 'scenarios', label: 'Scenarios', Icon: LayersIcon },
  ];

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-1">
      {items.map(({ id, label, Icon, needsAttention }) => {
        const isActive = section === id;
        const activeStyles = isClassic
          ? 'bg-theme-warning/20 text-theme-warning border-l-2 border-theme-warning'
          : 'bg-theme-cyan/15 text-theme-cyan border-l-2 border-theme-cyan';
        const inactiveStyles = isClassic
          ? 'text-white/70 hover:bg-white/5 hover:text-white/90 border-l-2 border-transparent'
          : 'text-theme-muted hover:bg-theme-surface2/50 hover:text-theme-text border-l-2 border-transparent';

        return (
          <button
            key={id}
            onClick={() => onSetSection(id)}
            title={collapsed ? label : undefined}
            className={`relative flex items-center gap-2.5 py-2 rounded-inner theme-transition text-sm font-medium ${
              collapsed ? 'justify-center px-2' : 'px-3'
            } ${isActive ? activeStyles : inactiveStyles}`}
          >
            <Icon className="shrink-0" />
            {!collapsed && <span>{label}</span>}
            {needsAttention && (
              <span
                className={`absolute top-1.5 ${collapsed ? 'right-1.5' : 'right-2'} w-1.5 h-1.5 rounded-full ${
                  isClassic ? 'bg-theme-warning' : 'bg-theme-magenta'
                }`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
