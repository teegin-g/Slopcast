import React, { useState } from 'react';

interface ProjectMember {
  userId: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
}

interface ProjectSharePanelProps {
  isClassic: boolean;
  open: boolean;
  onClose: () => void;
  members: ProjectMember[];
  onInvite: (email: string, role: 'editor' | 'viewer') => void;
  onRemoveMember: (userId: string) => void;
  onUpdateRole: (userId: string, role: 'editor' | 'viewer') => void;
}

const roleBadgeClass: Record<string, string> = {
  owner: 'bg-theme-cyan/20 text-theme-cyan border-theme-cyan/30',
  editor: 'bg-theme-magenta/20 text-theme-magenta border-theme-magenta/30',
  viewer: 'bg-theme-lavender/20 text-theme-lavender border-theme-lavender/30',
};

const ProjectSharePanel: React.FC<ProjectSharePanelProps> = ({
  isClassic,
  open,
  onClose,
  members,
  onInvite,
  onRemoveMember,
  onUpdateRole,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');

  if (!open) return null;

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    onInvite(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative z-10 w-full max-w-md mx-4 ${
          isClassic
            ? 'sc-panel overflow-hidden'
            : 'rounded-panel border shadow-card bg-theme-surface1 border-theme-border'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-5 py-3' : 'px-5 py-3 border-b border-theme-border'}>
          <div className="flex items-center justify-between">
            <h2 className={`text-[10px] font-black uppercase tracking-[0.24em] ${isClassic ? 'text-white' : 'text-theme-cyan'}`}>
              Share Project
            </h2>
            <button onClick={onClose} className={`text-xs font-black ${isClassic ? 'text-white/60 hover:text-white' : 'text-theme-muted hover:text-theme-text'}`}>
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Invite form */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-inner text-xs outline-none transition-colors ${
                isClassic
                  ? 'sc-inputNavy'
                  : 'bg-theme-bg border border-theme-border text-theme-text focus:border-theme-cyan'
              }`}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')}
              className={`px-2 py-2 rounded-inner text-[10px] font-bold uppercase ${
                isClassic
                  ? 'sc-selectNavy'
                  : 'bg-theme-bg border border-theme-border text-theme-text'
              }`}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={handleInvite}
              className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-wide transition-colors ${
                isClassic
                  ? 'sc-btnPrimary'
                  : 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan'
              }`}
            >
              Invite
            </button>
          </div>

          {/* Members list */}
          <div className="space-y-1.5">
            <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${isClassic ? 'text-white/60' : 'text-theme-muted'}`}>
              Members ({members.length})
            </p>
            <div className={`rounded-inner border max-h-48 overflow-y-auto divide-y ${
              isClassic ? 'border-black/25 divide-black/15' : 'border-theme-border/60 divide-theme-border/30'
            }`}>
              {members.map(m => (
                <div key={m.userId} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${
                      isClassic ? 'bg-black/30 text-white/80' : 'bg-theme-surface2 text-theme-text'
                    }`}>
                      {m.email.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-[11px] truncate ${isClassic ? 'text-white/80' : 'text-theme-text'}`}>{m.email}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${roleBadgeClass[m.role]}`}>
                      {m.role}
                    </span>
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => onRemoveMember(m.userId)}
                        className={`text-[10px] ${isClassic ? 'text-white/40 hover:text-white/80' : 'text-theme-muted hover:text-theme-magenta'}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSharePanel;
