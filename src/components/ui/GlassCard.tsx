import React from 'react';

interface GlassCardProps {
  isClassic: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Inner card component for nested content tiles.
 * Uses theme surface-2 token at 50% opacity for per-theme tinting.
 * When isClassic is true (Mario theme), renders a solid retro card.
 * No backdrop-filter blur — pure theme color at reduced opacity.
 */
export function GlassCard({ isClassic, children, className = '' }: GlassCardProps) {
  if (isClassic) {
    return (
      <div className={`rounded-inner theme-transition ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`rounded-inner theme-transition bg-theme-surface2/50 border border-theme-border/20 hover:bg-theme-surface2/65 ${className}`}
    >
      {children}
    </div>
  );
}
