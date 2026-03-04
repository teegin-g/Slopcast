import React from 'react';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  payload: Record<string, unknown>;
  userName: string;
  createdAt: string;
}

interface AuditLogPanelProps {
  isClassic: boolean;
  entries: AuditEntry[];
  onRevert?: (entryId: string) => void;
}

const actionIcons: Record<string, string> = {
  'group.created': '📁',
  'group.updated': '✏️',
  'group.deleted': '🗑️',
  'scenario.created': '📊',
  'scenario.updated': '📊',
  'wells.assigned': '📍',
  'economics.snapshot': '💾',
  'member.added': '👤',
  'member.removed': '👤',
};

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ isClassic, entries, onRevert }) => {
  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition overflow-hidden'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
      }
    >
      <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
        <h2 className={`text-[10px] font-black uppercase tracking-[0.24em] ${isClassic ? 'text-white' : 'text-theme-cyan'}`}>
          Activity Log
        </h2>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-4">
            <p className={`text-[11px] ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-theme-border/20">
            {entries.map(entry => (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                <span className="text-sm shrink-0 mt-0.5">{actionIcons[entry.action] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] ${isClassic ? 'text-white/90' : 'text-theme-text'}`}>
                    <span className="font-bold">{entry.userName}</span>
                    {' '}
                    <span className={isClassic ? 'text-white/60' : 'text-theme-muted'}>{entry.action.replace('.', ' ')}</span>
                    {entry.entityId && (
                      <span className={`ml-1 font-semibold ${isClassic ? 'text-theme-warning' : 'text-theme-lavender'}`}>
                        {entry.entityId}
                      </span>
                    )}
                  </p>
                  <p className={`text-[9px] mt-0.5 ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}>
                    {formatTimestamp(entry.createdAt)}
                  </p>
                </div>
                {entry.action === 'economics.snapshot' && onRevert && (
                  <button
                    onClick={() => onRevert(entry.id)}
                    className={`text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-inner transition-colors shrink-0 ${
                      isClassic
                        ? 'bg-black/20 text-white/60 hover:text-white border border-black/30'
                        : 'bg-theme-surface2 text-theme-muted hover:text-theme-cyan border border-theme-border'
                    }`}
                  >
                    Revert
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPanel;
