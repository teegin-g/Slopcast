import React from 'react';
import { LazyMotion, m, domAnimation } from 'motion/react';

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

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  width,
  height,
  lines = 1
}) => {
  const baseClass = 'bg-theme-surface2/50 rounded-inner';

  if (variant === 'text' && lines > 1) {
    return (
      <LazyMotion features={domAnimation}>
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <m.div
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
      </LazyMotion>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={`${baseClass} ${className}`}
        style={{ width, height }}
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
      />
    </LazyMotion>
  );
};

/** Table skeleton with header + rows */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => (
  <div className="rounded-panel border border-theme-border overflow-hidden">
    <div className="grid gap-4 p-4 border-b border-theme-border bg-theme-surface2/30">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 inline-block" width={`${60 + ((i * 17) % 35)}%`} />
      ))}
    </div>
    <div className="divide-y divide-theme-border/50">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} className="h-3" width={`${50 + ((row + col * 11) % 45)}%`} />
          ))}
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
  <LazyMotion features={domAnimation}>
    <m.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay }}
    >
      {children}
    </m.div>
  </LazyMotion>
);
