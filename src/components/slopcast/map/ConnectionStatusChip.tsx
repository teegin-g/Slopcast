import React from 'react';
import type { ConnectionLevel } from './connectionState';

interface ConnectionStatusChipProps {
  /** Derived connection level (see deriveConnectionState). */
  level: ConnectionLevel;
  /** User-facing title for the current level (e.g. "Live", "Showing fallback data"). */
  title: string;
  isClassic: boolean;
}

/**
 * Pure presentational pill for the slim header. The parent derives the
 * connection state (via `deriveConnectionState`) and passes the level + title;
 * this component just renders a colored status dot + a text label. It is never
 * color-only — the title text is always shown alongside the dot.
 */
const LEVEL_DOT: Record<ConnectionLevel, string> = {
  ok: 'bg-theme-success',
  degraded: 'bg-theme-warning',
  down: 'bg-red-400',
};

const ConnectionStatusChip: React.FC<ConnectionStatusChipProps> = ({ level, title, isClassic }) => {
  return (
    <span
      data-testid="connection-status-chip"
      title={title}
      className={`inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-inner text-[10px] font-bold uppercase tracking-[0.14em] theme-transition whitespace-nowrap ${
        isClassic
          ? 'border-2 border-black/25 bg-black/15 text-white/90 shadow-card'
          : 'border border-theme-border bg-theme-surface2/60 text-theme-muted'
      }`}
    >
      <span
        data-status-dot
        aria-hidden="true"
        className={`inline-block w-2 h-2 rounded-full shrink-0 ${LEVEL_DOT[level]}`}
      />
      <span className="truncate">{title}</span>
    </span>
  );
};

export default ConnectionStatusChip;
