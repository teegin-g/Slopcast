import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from '../../../theme/motion';
import { useTheme } from '../../../theme/ThemeProvider';
import { overlayPanelClass } from '../../../theme/themes';
import type { Well, WellGroup } from '../../../types';

interface WellPopupCardProps {
  well: Well | null;
  groups: WellGroup[];
  /** Screen-space pixel position anchored to the well's map coordinates */
  position: { x: number; y: number } | null;
  isClassic: boolean;
  onClose: () => void;
}

function formatCoord(value: number, isLat: boolean): string {
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  return `${Math.abs(value).toFixed(4)}° ${dir}`;
}

function formatLateral(ft: number): string {
  return ft.toLocaleString() + ' ft';
}

function findGroup(wellId: string, groups: WellGroup[]): WellGroup | undefined {
  return groups.find(g => g.wellIds.has(wellId));
}

const CARD_WIDTH = 260;
const CARD_OFFSET_Y = -16; // above the dot

export const WellPopupCard: React.FC<WellPopupCardProps> = ({
  well,
  groups,
  position,
  isClassic,
  onClose,
}) => {
  const { theme } = useTheme();

  const panelClass = isClassic
    ? 'sc-panel'
    : `rounded-panel ${overlayPanelClass(theme.features.panelStyle)}`;

  const group = well ? findGroup(well.id, groups) : undefined;

  const labelClass = `text-[9px] uppercase tracking-wider font-semibold ${
    isClassic ? 'text-white/35' : 'text-[var(--text-muted)]'
  }`;

  const valueClass = `text-[11px] tabular-nums ${
    isClassic ? 'text-white/80' : 'text-[var(--text-secondary)]'
  }`;

  return (
    <AnimatePresence>
      {well && position && (
        <motion.div
          className={`absolute z-40 pointer-events-auto ${panelClass} shadow-xl`}
          style={{
            left: position.x - CARD_WIDTH / 2,
            top: position.y + CARD_OFFSET_Y,
            width: CARD_WIDTH,
            transform: 'translateY(-100%)',
          }}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 8 }}
          transition={SPRING.entrance}
          key={well.id}
        >
          {/* Header with name + close */}
          <div className="flex items-start justify-between px-3 pt-2.5 pb-1">
            <div className="flex-1 min-w-0 mr-2">
              <div
                className={`text-[12px] font-bold leading-tight truncate ${
                  isClassic ? 'text-white' : 'text-[var(--text-primary)]'
                }`}
              >
                {well.name}
              </div>
              <div
                className={`text-[10px] mt-0.5 truncate ${
                  isClassic ? 'text-white/60' : 'text-[var(--text-secondary)]'
                }`}
              >
                {well.operator}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-sm transition-colors ${
                isClassic
                  ? 'text-white/40 hover:text-white/70 hover:bg-white/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
              }`}
              aria-label="Close popup"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className={`mx-3 border-t ${isClassic ? 'border-white/10' : 'border-[var(--border)]'}`} />

          {/* Detail rows */}
          <div className="px-3 py-2 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className={labelClass}>Formation</span>
              <span className={valueClass}>{well.formation}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className={labelClass}>Status</span>
              <span className={valueClass}>{well.status}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className={labelClass}>Lateral</span>
              <span className={valueClass}>{formatLateral(well.lateralLength)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className={labelClass}>Lat</span>
              <span className={valueClass}>{formatCoord(well.lat, true)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className={labelClass}>Lng</span>
              <span className={valueClass}>{formatCoord(well.lng, false)}</span>
            </div>
          </div>

          {/* Group assignment */}
          <div className={`mx-3 border-t ${isClassic ? 'border-white/10' : 'border-[var(--border)]'}`} />
          <div className="flex items-center gap-1.5 px-3 py-2">
            {group ? (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span
                  className={`text-[10px] font-semibold truncate ${
                    isClassic ? 'text-white/60' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {group.name}
                </span>
              </>
            ) : (
              <span
                className={`text-[10px] italic ${
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
