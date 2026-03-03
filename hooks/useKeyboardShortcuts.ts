import { useEffect, type RefObject } from 'react';

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

interface GridShortcutHandlers {
  gridRef: RefObject<HTMLElement | null>;
  onFillDown?: () => void;
  onSelectAll?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right', extend: boolean) => void;
  onTab?: (reverse: boolean) => void;
  onEnter?: () => void;
  onEscape?: () => void;
}

export function useGridKeyboardShortcuts(handlers: GridShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const grid = handlers.gridRef.current;
      if (!grid || !grid.contains(document.activeElement)) return;

      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + D: Fill down
      if (mod && e.key === 'd') {
        e.preventDefault();
        handlers.onFillDown?.();
        return;
      }

      // Ctrl/Cmd + A: Select all within grid
      if (mod && e.key === 'a') {
        e.preventDefault();
        handlers.onSelectAll?.();
        return;
      }

      // Ctrl/Cmd + C: Copy
      if (mod && e.key === 'c') {
        e.preventDefault();
        handlers.onCopy?.();
        return;
      }

      // Ctrl/Cmd + V: Paste
      if (mod && e.key === 'v') {
        e.preventDefault();
        handlers.onPaste?.();
        return;
      }

      // Delete / Backspace: Clear cell
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handlers.onDelete?.();
        return;
      }

      // Arrow keys: Navigate, Shift extends selection
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlers.onNavigate?.('up', e.shiftKey);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handlers.onNavigate?.('down', e.shiftKey);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlers.onNavigate?.('left', e.shiftKey);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlers.onNavigate?.('right', e.shiftKey);
        return;
      }

      // Tab / Shift+Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        handlers.onTab?.(e.shiftKey);
        return;
      }

      // Enter: Start editing
      if (e.key === 'Enter') {
        e.preventDefault();
        handlers.onEnter?.();
        return;
      }

      // Escape: Cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.onEscape?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
