import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface SectionCardProps {
  isClassic: boolean;
  title?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  /** Panel surface treatment: glass (default), solid, or outline */
  panelStyle?: 'glass' | 'solid' | 'outline';
  /** Stagger delay index for entrance animation (multiply by 0.06s) */
  staggerIndex?: number;
}

const sectionBgMap: Record<'glass' | 'solid' | 'outline', string> = {
  glass: 'bg-theme-surface1/70',
  solid: 'bg-theme-surface1',
  outline: 'bg-theme-surface1/20',
};

const SectionCard: React.FC<SectionCardProps> = ({
  isClassic,
  title,
  action,
  className = '',
  bodyClassName = '',
  children,
  panelStyle = 'glass',
  staggerIndex = 0,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25,
        delay: staggerIndex * 0.06,
      }}
      className={
        isClassic
          ? `sc-panel theme-transition overflow-hidden ${className}`
          : `rounded-panel border shadow-card theme-transition ${sectionBgMap[panelStyle]} border-theme-border ${className}`
      }
    >
      {(title || action) && (
        <div
          className={
            isClassic
              ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-3 flex items-center justify-between'
              : 'px-4 py-3 border-b border-theme-border/60 flex items-center justify-between'
          }
        >
          <h3
            className={
              isClassic
                ? 'text-[11px] font-black uppercase tracking-[0.24em] text-white'
                : 'text-xs font-black uppercase tracking-[0.24em] text-theme-cyan heading-font'
            }
          >
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={isClassic ? `p-4 ${bodyClassName}` : `p-4 ${bodyClassName}`}>{children}</div>
    </motion.div>
  );
};

export default SectionCard;
