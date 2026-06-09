import React from 'react';
import type { Section } from '../../hooks/useSidebarNav';

interface ActivityRailProps {
  section: Section;
  onSetSection: (s: Section) => void;
  isClassic: boolean;
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

const NAV: { id: Section; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'wells', label: 'Wells', Icon: MapPinIcon },
  { id: 'economics', label: 'Economics', Icon: ChartIcon },
  { id: 'scenarios', label: 'Scenarios', Icon: LayersIcon },
];

export function ActivityRail({ section, onSetSection, isClassic }: ActivityRailProps) {
  return (
    <nav
      data-testid="activity-rail"
      className="flex flex-col items-center gap-1 w-[46px] flex-none h-full py-2 theme-transition"
      style={{
        background: 'var(--glass-sidebar-bg)',
        borderRight: '1px solid var(--glass-sidebar-border)',
      }}
      aria-label="Main sections"
    >
      <div aria-hidden="true" className={`typo-label font-bold mb-2 ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>SL</div>
      {NAV.map(({ id, label, Icon }) => {
        const active = section === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-current={active ? 'page' : undefined}
            data-testid={`activity-rail-${id}`}
            onClick={() => onSetSection(id)}
            className={`w-9 h-9 flex items-center justify-center rounded-inner theme-transition focus-visible:outline-2 focus-visible:outline-theme-cyan focus-visible:outline-offset-[-2px] ${
              active
                ? isClassic
                  ? 'bg-theme-warning/20 text-theme-warning'
                  : 'bg-theme-cyan/15 text-theme-cyan'
                : isClassic
                  ? 'text-white/70 hover:bg-white/5 hover:text-white/90'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface2/50'
            }`}
          >
            <Icon className="shrink-0" />
          </button>
        );
      })}
    </nav>
  );
}
