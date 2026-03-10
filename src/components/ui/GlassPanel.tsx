import React from 'react';

type AccentColor = 'cyan' | 'warning' | 'magenta' | 'none';

interface GlassPanelProps {
  isClassic: boolean;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  /** Colored accent border: cyan, warning, magenta, or none (default border) */
  accent?: AccentColor;
  /** Panel surface treatment: glass (default), solid, or outline */
  panelStyle?: 'glass' | 'solid' | 'outline';
}

const accentBorderMap: Record<AccentColor, string> = {
  cyan: 'border-theme-cyan/40',
  warning: 'border-theme-warning/40',
  magenta: 'border-theme-magenta/40',
  none: 'border-theme-border/30',
};

const panelBgMap: Record<'glass' | 'solid' | 'outline', string> = {
  glass: 'bg-theme-surface1/60',
  solid: 'bg-theme-surface1',
  outline: 'bg-theme-surface1/20',
};

/**
 * Outer card component using theme surface tokens for per-theme color personality.
 * When isClassic is true (Mario theme), renders a solid retro panel with no transparency.
 * When false, renders a panel tinted with the theme's surface-1 color at an opacity
 * determined by panelStyle so each theme has a distinct visual identity.
 */
export function GlassPanel({
  isClassic,
  children,
  className = '',
  hover = false,
  accent = 'none',
  panelStyle = 'glass',
}: GlassPanelProps) {
  if (isClassic) {
    return (
      <div className={`rounded-panel theme-transition ${className}`}>
        {children}
      </div>
    );
  }

  const bgClass = panelBgMap[panelStyle];
  const borderClass = `border ${accentBorderMap[accent]}`;
  const hoverClasses = hover
    ? 'hover:bg-theme-surface1/70 hover:scale-[1.005] focus-visible:outline-2 focus-visible:outline-theme-cyan transition-all duration-200'
    : '';

  return (
    <div
      className={`rounded-panel theme-transition ${bgClass} ${borderClass} shadow-[var(--shadow-card)] ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
}
