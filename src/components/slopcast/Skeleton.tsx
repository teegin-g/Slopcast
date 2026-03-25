import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const shimmerVariants = {
  initial: { opacity: 0.4 },
  animate: { opacity: 1 },
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height,
  lines = 1
}) => {
  const baseClass = 'bg-theme-surface2/50 rounded-inner';

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            className={`${baseClass} h-3`}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClass} ${className}`}
      style={{ width, height }}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
    />
  );
};

/** KPI Grid skeleton matching the hero + 4-tile layout */
export const KpiGridSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="rounded-panel h-40" />
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="rounded-inner h-20" />
      ))}
    </div>
  </div>
);

/** Table skeleton with header + rows */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <div className="rounded-panel border border-theme-border overflow-hidden">
    <div className="grid gap-4 p-4 border-b border-theme-border bg-theme-surface2/30">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 inline-block" width={`${60 + Math.random() * 40}%`} />
      ))}
    </div>
    <div className="divide-y divide-theme-border/50">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} className="h-3" width={`${50 + Math.random() * 50}%`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/** Chart area skeleton */
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={`rounded-panel border border-theme-border p-4 ${height} flex items-end gap-1`}>
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="flex-1 bg-theme-surface2/40 rounded-t"
        style={{ height: `${20 + Math.random() * 70}%` }}
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: i * 0.05 }}
      />
    ))}
  </div>
);

/** Group comparison strip skeleton */
export const GroupComparisonSkeleton: React.FC = () => (
  <div className="rounded-panel border shadow-card bg-theme-surface1/70 border-theme-border">
    <div className="px-4 py-2 border-b border-theme-border/60">
      <Skeleton className="h-3" width="40%" />
    </div>
    <div className="p-3 space-y-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-inner border border-theme-border/50 px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3 flex-1" width="60%" />
          </div>
          <Skeleton className="h-1.5 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

/** Fade-in wrapper for loaded content */
export const FadeIn: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className,
  delay = 0
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay }}
  >
    {children}
  </motion.div>
);
