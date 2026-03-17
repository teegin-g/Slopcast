import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface ViewTransitionProps {
  /** Key that triggers the crossfade when it changes */
  transitionKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Directional slide+fade view transition using Motion AnimatePresence.
 * Entering content slides in from right, exiting slides out to left.
 * Includes subtle y-axis shift for depth.
 */
export function ViewTransition({ transitionKey, children, className }: ViewTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, x: 16, y: 4 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -16, y: 4 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
