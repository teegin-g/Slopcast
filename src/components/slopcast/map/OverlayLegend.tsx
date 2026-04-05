import React, { useState, useEffect } from 'react';
import type { Well, WellGroup } from '../../../types';
import { useTheme } from '../../../theme/ThemeProvider';
import { overlayPanelClass } from '../../../theme/themes';

interface OverlayLegendProps {
  isClassic: boolean;
  groups: WellGroup[];
  wells: Well[];
  viewportLayout: 'mobile' | 'mid' | 'desktop' | 'wide';
}

/** Status shape descriptors shown in the legend. */
const STATUS_ENTRIES: ReadonlyArray<{ status: Well['status']; label: string }> = [
  { status: 'PRODUCING', label: 'Producing' },
  { status: 'DUC', label: 'DUC' },
  { status: 'PERMIT', label: 'Permit' },
];

/** Tiny SVG icons matching the map layer rendering for each status. */
function StatusIcon({ status }: { status: Well['status'] }) {
  switch (status) {
    case 'PRODUCING':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" fill="currentColor" />
        </svg>
      );
    case 'DUC':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'PERMIT':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="2.5" fill="currentColor" opacity="0.5" />
        </svg>
      );
  }
}

export const OverlayLegend: React.FC<OverlayLegendProps> = ({
  isClassic,
  groups,
  wells,
  viewportLayout,
}) => {
  const { theme } = useTheme();
  const mp = theme.mapPalette;

  // Default collapsed on mobile/mid, expanded on desktop/wide
  const [expanded, setExpanded] = useState(
    viewportLayout === 'desktop' || viewportLayout === 'wide',
  );

  // Sync default state when layout changes
  useEffect(() => {
    setExpanded(viewportLayout === 'desktop' || viewportLayout === 'wide');
  }, [viewportLayout]);

  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : `rounded-panel ${overlayPanelClass(theme.features.panelStyle)} theme-transition`;

  const labelClass = isClassic
    ? 'text-white/80'
    : 'text-[var(--text-secondary)]';

  const mutedClass = isClassic
    ? 'text-white/40'
    : 'text-[var(--text-muted)]';

  const headingClass = isClassic
    ? 'text-white/60'
    : 'text-[var(--text-muted)]';

  const dividerClass = isClassic
    ? 'bg-white/20'
    : 'bg-[var(--border)]';

  // Count wells per group
  const groupCounts = groups.map(g => ({
    id: g.id,
    name: g.name,
    color: g.color,
    count: wells.filter(w => g.wellIds.has(w.id)).length,
  }));

  const assignedIds = new Set<string>();
  groups.forEach(g => g.wellIds.forEach(id => assignedIds.add(id)));
  const unassignedCount = wells.filter(w => !assignedIds.has(w.id)).length;

  if (!expanded) {
    return (
      <div className="absolute bottom-8 left-3 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title="Show Legend"
          aria-label="Show Legend"
          className={`${panelClass} w-9 h-9 flex items-center justify-center transition-colors ${
            isClassic
              ? 'text-white/60 hover:text-white'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2" width="4" height="3" rx="0.5" fill="currentColor" />
            <path d="M7 3.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <rect x="1" y="7" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
            <path d="M7 8.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-8 left-3 z-20 pointer-events-auto">
      <div className={`${panelClass} px-3 py-2 min-w-[140px] max-w-[200px]`}>
        {/* Header with collapse button */}
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${headingClass}`}>
            Legend
          </span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            title="Collapse Legend"
            aria-label="Collapse Legend"
            className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
              isClassic
                ? 'text-white/40 hover:text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 3L4 6L7 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Group entries */}
        <div className="flex flex-col gap-1">
          {groupCounts.map(g => (
            <div key={g.id} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: g.color }}
              />
              <span className={`text-[10px] font-semibold truncate flex-1 ${labelClass}`}>
                {g.name}
              </span>
              <span className={`text-[10px] tabular-nums ${mutedClass}`}>
                ({g.count})
              </span>
            </div>
          ))}

          {/* Unassigned */}
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: mp.unassignedFill }}
            />
            <span className={`text-[10px] font-semibold truncate flex-1 ${labelClass}`}>
              Unassigned
            </span>
            <span className={`text-[10px] tabular-nums ${mutedClass}`}>
              ({unassignedCount})
            </span>
          </div>
        </div>

        {/* Status section */}
        <div className={`h-px my-1.5 ${dividerClass}`} />

        <div className="flex flex-col gap-1">
          <span className={`text-[9px] font-black uppercase tracking-[0.15em] mb-0.5 ${headingClass}`}>
            Status
          </span>
          {STATUS_ENTRIES.map(({ status, label }) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`w-2.5 flex items-center justify-center shrink-0 ${labelClass}`}>
                <StatusIcon status={status} />
              </span>
              <span className={`text-[10px] font-semibold ${labelClass}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
