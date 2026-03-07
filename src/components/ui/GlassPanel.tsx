import React from 'react';

interface GlassPanelProps {
  isClassic: boolean;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * Outer card component with glassmorphism styling.
 * When isClassic is true (Mario theme), renders a solid retro panel with no glass/blur.
 * When false, renders a semi-transparent glass panel that lets animated backgrounds show through.
 */
export function GlassPanel({ isClassic, children, className = '', hover = false }: GlassPanelProps) {
  if (isClassic) {
    return (
      <div className={`rounded-panel theme-transition ${className}`}>
        {children}
      </div>
    );
  }

  const hoverClasses = hover
    ? 'hover:brightness-110 hover:scale-[1.005] focus-visible:outline-2 focus-visible:outline-theme-cyan transition-all duration-200'
    : '';

  return (
    <div
      className={`rounded-panel theme-transition ${hoverClasses} ${className}`}
      style={{
        background: 'var(--glass-panel-bg)',
        backdropFilter: 'blur(var(--glass-panel-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-panel-blur))',
        border: '1px solid var(--glass-panel-border)',
        boxShadow: 'var(--glass-panel-shadow)',
      }}
    >
      {children}
    </div>
  );
}
