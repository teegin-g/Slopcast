import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SPRING } from '../../theme/motion';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const toastStyles: Record<ToastType, string> = {
  success: 'border-l-2 border-l-theme-cyan',
  info: 'border-l-2 border-l-theme-cyan',
  warning: 'border-l-2 border-l-theme-warning',
  error: 'border-l-2 border-l-theme-danger',
};

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={SPRING.snappy}
      className={`flex items-center gap-3 px-4 py-3 rounded-inner bg-theme-surface1 border border-theme-border shadow-lg backdrop-blur-sm min-w-[280px] max-w-[400px] ${toastStyles[toast.type]}`}
    >
      <span className="text-sm shrink-0">{toastIcons[toast.type]}</span>
      <p className="text-xs text-theme-text flex-1">{toast.message}</p>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-xs font-bold text-theme-cyan hover:text-theme-text transition-colors shrink-0"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={onDismiss} className="text-theme-muted hover:text-theme-text text-xs ml-1 shrink-0 focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none rounded-sm">✕</button>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={() => removeToast(toast.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
