import React from 'react';

export const KbdBadge: React.FC<{ keys: string; className?: string }> = ({ keys, className = '' }) => (
  <kbd className={`hidden md:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 text-[10px] font-mono text-theme-muted/60 bg-theme-surface2/40 border border-theme-border/30 rounded ${className}`}>
    {keys}
  </kbd>
);
