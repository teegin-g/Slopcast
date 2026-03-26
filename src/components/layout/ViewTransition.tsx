import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from '../../theme/motion';

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
    <AnimatePresence mode="popLayout">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, x: 20, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.98 }}
        transition={SPRING.entrance}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
