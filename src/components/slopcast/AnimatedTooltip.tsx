import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface AnimatedTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  delay?: number;
}

export const AnimatedTooltip: React.FC<AnimatedTooltipProps> = ({ content, children, side = 'top', delay = 300 }) => {
  const [show, setShow] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    const t = setTimeout(() => setShow(true), delay);
    setTimer(t);
  };
  const handleLeave = () => {
    if (timer) clearTimeout(timer);
    setShow(false);
  };

  const yOffset = side === 'top' ? -8 : 8;

  return (
    <div className="relative inline-flex" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            className={`absolute ${side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-inner bg-theme-surface1 border border-theme-border text-xs text-theme-text whitespace-nowrap shadow-lg`}
            initial={{ opacity: 0, y: yOffset, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: yOffset / 2, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
