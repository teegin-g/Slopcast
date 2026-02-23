import { useEffect } from 'react';

interface ShortcutHandlers {
  onSwitchToWells?: () => void;
  onSwitchToEconomics?: () => void;
  onSaveSnapshot?: () => void;
  onExportCsv?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === '1') {
        e.preventDefault();
        handlers.onSwitchToWells?.();
        return;
      }
      if (mod && e.key === '2') {
        e.preventDefault();
        handlers.onSwitchToEconomics?.();
        return;
      }
      if (mod && e.key === 's') {
        e.preventDefault();
        handlers.onSaveSnapshot?.();
        return;
      }
      if (mod && e.key === 'e') {
        e.preventDefault();
        handlers.onExportCsv?.();
        return;
      }

      // Non-modifier shortcuts - skip when in text inputs
      if (isInput) return;

      if (e.key === 'a' || e.key === 'A') {
        handlers.onSelectAll?.();
        return;
      }
      if (e.key === 'Escape') {
        handlers.onClearSelection?.();
        return;
      }
      if (e.key === '?') {
        handlers.onShowHelp?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
