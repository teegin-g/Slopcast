import React, { useState } from 'react';
import type { WellGroup } from '../../types';

interface SidebarGroupTreeProps {
  groups: WellGroup[];
  activeGroupId: string | null;
  onActivateGroup: (id: string) => void;
  collapsed: boolean;
  isClassic: boolean;
}

const ChevronIcon: React.FC<{ open: boolean; className?: string }> = ({ open, className }) => (
  <svg
    className={`${className} transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export function SidebarGroupTree({
  groups,
  activeGroupId,
  onActivateGroup,
  collapsed,
  isClassic,
}: SidebarGroupTreeProps) {
  const [open, setOpen] = useState(true);

  if (collapsed) return null;

  return (
    <div className="px-2 py-1">
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-1.5 w-full px-2 py-1 text-[10px] uppercase font-bold tracking-widest theme-transition ${
          isClassic ? 'text-white/50 hover:text-white/70' : 'text-theme-muted hover:text-theme-text'
        }`}
      >
        <ChevronIcon open={open} />
        <span>Well Groups</span>
      </button>

      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {groups.map(group => {
            const isActive = group.id === activeGroupId;
            const activeStyles = isClassic
              ? 'bg-theme-warning/15 text-theme-warning'
              : 'bg-theme-cyan/10 text-theme-cyan';
            const inactiveStyles = isClassic
              ? 'text-white/60 hover:bg-white/5 hover:text-white/80'
              : 'text-theme-muted hover:bg-theme-surface2/40 hover:text-theme-text';

            return (
              <button
                key={group.id}
                onClick={() => onActivateGroup(group.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-inner text-xs theme-transition ${
                  isActive ? activeStyles : inactiveStyles
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span className="truncate flex-1 text-left">{group.name}</span>
                <span
                  className={`text-[10px] tabular-nums ${
                    isClassic ? 'text-white/40' : 'text-theme-muted'
                  }`}
                >
                  {group.wellIds.size}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
