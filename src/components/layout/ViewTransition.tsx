import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface ViewTransitionProps {
  /** Key that triggers the crossfade when it changes */
  transitionKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Crossfade wrapper using Framer Motion AnimatePresence.
 * Changing transitionKey triggers exit (fade out) then enter (fade in).
 * Duration: 175ms with Material-style easeInOut.
 */
export function ViewTransition({ transitionKey, children, className }: ViewTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.175, ease: [0.4, 0, 0.2, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
