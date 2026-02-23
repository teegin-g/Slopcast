import React, { useState } from 'react';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}

interface CommentsPanelProps {
  isClassic: boolean;
  entityType: 'well' | 'group' | 'scenario';
  entityName: string;
  comments: Comment[];
  onAddComment: (body: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUserId?: string;
}

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  isClassic,
  entityType,
  entityName,
  comments,
  onAddComment,
  onDeleteComment,
  currentUserId,
}) => {
  const [body, setBody] = useState('');

  const handlePost = () => {
    if (!body.trim()) return;
    onAddComment(body.trim());
    setBody('');
  };

  return (
    <div
      className={
        isClassic
          ? 'sc-panel theme-transition overflow-hidden'
          : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
      }
    >
      <div className={isClassic ? 'sc-panelTitlebar sc-titlebar--neutral px-4 py-2' : 'px-4 py-2 border-b border-theme-border/60'}>
        <div>
          <h2 className={`text-[10px] font-black uppercase tracking-[0.24em] ${isClassic ? 'text-white' : 'text-theme-cyan'}`}>
            Comments
          </h2>
          <p className={`text-[9px] mt-0.5 ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>
            on {entityType}: {entityName}
          </p>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-4">
            <p className={`text-[11px] ${isClassic ? 'text-white/50' : 'text-theme-muted'}`}>No comments yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-theme-border/20">
            {comments.map(c => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                      isClassic ? 'bg-black/30 text-white/80' : 'bg-theme-surface2 text-theme-text'
                    }`}>
                      {c.userName.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-[10px] font-bold ${isClassic ? 'text-white/90' : 'text-theme-text'}`}>{c.userName}</span>
                    <span className={`text-[9px] ${isClassic ? 'text-white/40' : 'text-theme-muted/60'}`}>{formatTimestamp(c.createdAt)}</span>
                  </div>
                  {currentUserId === c.userId && (
                    <button
                      onClick={() => onDeleteComment(c.id)}
                      className={`text-[9px] ${isClassic ? 'text-white/30 hover:text-white/60' : 'text-theme-muted/50 hover:text-theme-magenta'}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className={`text-[11px] leading-relaxed ml-7 ${isClassic ? 'text-white/70' : 'text-theme-muted'}`}>{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`p-3 border-t ${isClassic ? 'border-black/20' : 'border-theme-border/40'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePost()}
            className={`flex-1 px-3 py-2 rounded-inner text-xs outline-none transition-colors ${
              isClassic
                ? 'sc-inputNavy'
                : 'bg-theme-bg border border-theme-border text-theme-text focus:border-theme-cyan'
            }`}
          />
          <button
            onClick={handlePost}
            disabled={!body.trim()}
            className={`px-3 py-2 rounded-inner text-[10px] font-black uppercase tracking-wide transition-colors ${
              isClassic
                ? 'sc-btnPrimary disabled:opacity-40'
                : 'bg-theme-cyan text-theme-bg hover:shadow-glow-cyan disabled:opacity-40'
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;
