import React from 'react';

interface GlassCardProps {
  isClassic: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Inner card component for nested content tiles.
 * When isClassic is true (Mario theme), renders a solid retro card.
 * When false, renders a subtle glass card with no backdrop-filter (performance).
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
      className={`rounded-inner theme-transition ${className}`}
      style={{
        background: 'var(--glass-card-bg)',
        border: '1px solid var(--glass-card-border)',
      }}
    >
      {children}
    </div>
  );
}
