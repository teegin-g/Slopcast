import React from 'react';

type AccentColor = 'cyan' | 'warning' | 'magenta' | 'none';

interface GlassPanelProps {
  isClassic: boolean;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  /** Colored accent border: cyan, warning, magenta, or none (default border) */
  accent?: AccentColor;
}

const accentBorderMap: Record<AccentColor, string> = {
  cyan: 'border-theme-cyan/40',
  warning: 'border-theme-warning/40',
  magenta: 'border-theme-magenta/40',
  none: 'border-theme-border/30',
};

/**
 * Outer card component using theme surface tokens for per-theme color personality.
 * When isClassic is true (Mario theme), renders a solid retro panel with no transparency.
 * When false, renders a semi-transparent panel tinted with the theme's surface-1 color
 * so each theme has a distinct visual identity. No backdrop-filter blur on content panels.
 */
export function GlassPanel({
  isClassic,
  children,
  className = '',
  hover = false,
  accent = 'none',
}: GlassPanelProps) {
  if (isClassic) {
    return (
      <div className={`rounded-panel theme-transition ${className}`}>
        {children}
      </div>
    );
  }

  const borderClass = `border ${accentBorderMap[accent]}`;
  const hoverClasses = hover
    ? 'hover:bg-theme-surface1/70 hover:scale-[1.005] focus-visible:outline-2 focus-visible:outline-theme-cyan transition-all duration-200'
    : '';

  return (
    <div
      className={`rounded-panel theme-transition bg-theme-surface1/60 ${borderClass} shadow-[var(--shadow-card)] ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}
