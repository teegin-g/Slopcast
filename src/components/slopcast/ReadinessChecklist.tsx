import React from 'react';
import { motion } from 'motion/react';

interface CheckItem {
  label: string;
  done: boolean;
  hint?: string;
}

export const ReadinessChecklist: React.FC<{ items: CheckItem[]; className?: string }> = ({ items, className = '' }) => {
  const doneCount = items.filter(i => i.done).length;
  const progress = doneCount / items.length;

  return (
    <div className={`rounded-inner border border-theme-border bg-theme-surface1/60 p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-theme-text/70">Setup Progress</p>
        <span className="text-xs font-bold text-theme-cyan">{Math.round(progress * 100)}%</span>
      </div>
      <div className="h-1 bg-theme-surface2 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-theme-cyan rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs" title={item.hint}>
            <span className={item.done ? 'text-green-400' : 'text-theme-muted/40'}>{item.done ? '✓' : '○'}</span>
            <span className={item.done ? 'text-theme-text/60 line-through' : 'text-theme-text'}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
