import React from 'react';

interface VignetteProps {
  className?: string;
}

/**
 * Fixed viewport vignette overlay.
 * Renders a radial gradient from transparent center to dark edges,
 * framing the workspace with subtle depth.
 */
export function Vignette({ className = '' }: VignetteProps) {
  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.3) 100%)',
      }}
    />
  );
}
