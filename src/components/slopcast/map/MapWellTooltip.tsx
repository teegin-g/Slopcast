import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from '../../../theme/motion';
import { useTheme } from '../../../theme/ThemeProvider';
import { overlayPanelClass } from '../../../theme/themes';
import type { Well, WellGroup } from '../../../types';

interface MapWellTooltipProps {
  well: Well | null;
  groups: WellGroup[];
  position: { x: number; y: number } | null;
  isClassic: boolean;
}

function formatLateral(ft: number): string {
  return ft.toLocaleString() + ' ft';
}

function findGroup(wellId: string, groups: WellGroup[]): WellGroup | undefined {
  return groups.find(g => g.wellIds.has(wellId));
}

export const MapWellTooltip: React.FC<MapWellTooltipProps> = ({
  well,
  groups,
  position,
  isClassic,
}) => {
  const { theme } = useTheme();

  const panelClass = isClassic
    ? 'sc-panel'
    : `rounded-panel ${overlayPanelClass(theme.features.panelStyle)}`;

  const group = well ? findGroup(well.id, groups) : undefined;

  return (
    <AnimatePresence>
      {well && position && (
        <motion.div
          className={`absolute z-30 pointer-events-none ${panelClass} px-3 py-2 shadow-lg min-w-[180px] max-w-[260px]`}
          style={{ left: position.x + 14, top: position.y - 10 }}
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={SPRING.snappy}
        >
          {/* Well name */}
          <div
            className={`text-[11px] font-bold leading-tight truncate ${
              isClassic ? 'text-white' : 'text-[var(--text-primary)]'
            }`}
          >
            {well.name}
          </div>

          {/* Operator */}
          <div
            className={`text-[10px] mt-0.5 truncate ${
              isClassic ? 'text-white/60' : 'text-[var(--text-secondary)]'
            }`}
          >
            {well.operator}
          </div>

          {/* Formation | Status */}
          <div
            className={`text-[9px] mt-1 uppercase tracking-wider font-semibold ${
              isClassic ? 'text-white/40' : 'text-[var(--text-muted)]'
            }`}
          >
            {well.formation} &middot; {well.status}
          </div>

          {/* Lateral length */}
          <div
            className={`text-[10px] mt-1 tabular-nums ${
              isClassic ? 'text-white/50' : 'text-[var(--text-secondary)]'
            }`}
          >
            {formatLateral(well.lateralLength)}
          </div>

          {/* Group assignment */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {group ? (
              <>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span
                  className={`text-[9px] font-semibold truncate ${
                    isClassic ? 'text-white/60' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {group.name}
                </span>
              </>
            ) : (
              <span
                className={`text-[9px] italic ${
                  isClassic ? 'text-white/30' : 'text-[var(--text-muted)]'
                }`}
              >
                Unassigned
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
