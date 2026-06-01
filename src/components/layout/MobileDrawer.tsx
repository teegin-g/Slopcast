import React, { useEffect, useEffectEvent } from 'react';
import { AnimatePresence, LazyMotion, m, domAnimation } from 'motion/react';
import { SPRING } from '../../theme/motion';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  const onCloseEvent = useEffectEvent(onClose);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseEvent();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {open && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <m.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={SPRING.entrance}
              className="fixed left-0 top-0 bottom-0 w-64 z-50"
              style={{
                background: 'var(--glass-sidebar-bg)',
                borderRight: '1px solid var(--glass-sidebar-border)',
              }}
            >
              {children}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
