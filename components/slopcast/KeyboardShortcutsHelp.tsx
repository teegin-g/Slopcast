import React from 'react';

interface KeyboardShortcutsHelpProps {
  isClassic: boolean;
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['⌘', '1'], description: 'Switch to Wells workspace' },
  { keys: ['⌘', '2'], description: 'Switch to Economics workspace' },
  { keys: ['⌘', 'S'], description: 'Save snapshot' },
  { keys: ['⌘', 'E'], description: 'Export CSV' },
  { keys: ['A'], description: 'Select all visible wells' },
  { keys: ['Esc'], description: 'Clear selection' },
  { keys: ['?'], description: 'Toggle this help' },
];

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isClassic, open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative z-10 w-full max-w-sm mx-4 ${
          isClassic
            ? 'sc-panel overflow-hidden'
            : 'rounded-panel border shadow-card bg-theme-surface1 border-theme-border'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-5 py-3' : 'px-5 py-3 border-b border-theme-border'}>
          <div className="flex items-center justify-between">
            <h2 className={`text-[10px] font-black uppercase tracking-[0.24em] ${isClassic ? 'text-white' : 'text-theme-cyan'}`}>
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className={`text-xs font-black ${isClassic ? 'text-white/60 hover:text-white' : 'text-theme-muted hover:text-theme-text'}`}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className={`text-[11px] ${isClassic ? 'text-white/80' : 'text-theme-muted'}`}>{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className={`inline-block min-w-[24px] text-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isClassic
                        ? 'bg-black/30 text-white/90 border border-black/40'
                        : 'bg-theme-surface2 text-theme-text border border-theme-border'
                    }`}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
