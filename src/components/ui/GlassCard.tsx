import React from 'react';

interface GlassCardProps {
  isClassic: boolean;
  children: React.ReactNode;
  className?: string;
  /** Panel surface treatment: glass (default), solid, or outline */
  panelStyle?: 'glass' | 'solid' | 'outline';
}

const cardBgMap: Record<'glass' | 'solid' | 'outline', string> = {
  glass: 'bg-theme-surface2/50',
  solid: 'bg-theme-surface2',
  outline: 'bg-theme-surface2/15',
};

/**
 * Inner card component for nested content tiles.
 * Uses theme surface-2 token at an opacity determined by panelStyle.
 * When isClassic is true (Mario theme), renders a solid retro card.
 */
export function GlassCard({ isClassic, children, className = '', panelStyle = 'glass' }: GlassCardProps) {
  if (isClassic) {
    return (
      <div className={`rounded-inner theme-transition ${className}`}>
        {children}
      </div>
    );
  }

  const bgClass = cardBgMap[panelStyle];

  return (
    <div
      className={`rounded-inner theme-transition ${bgClass} border border-theme-border/20 hover:bg-theme-surface2/65 ${className}`}
    >
      {children}
    </div>
  );
}
