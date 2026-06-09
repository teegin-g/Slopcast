import React, { useEffect, useState } from 'react';
import type { ConnectionState } from './connectionState';

interface ConnectionWarningBannerProps {
  state: ConnectionState;
  onRetry?: () => void;
  onUseMock?: () => void;
}

const WarnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
    <path d="M8 1.5 15 14H1L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 6.5V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="11.6" r="0.75" fill="currentColor" />
  </svg>
);

/**
 * Persistent, always-visible warning when the basemap or the live data source
 * can't be reached. "Down" states stay until resolved; "degraded" (fallback)
 * states can be dismissed. Color is paired with an icon + label so the meaning
 * never relies on color alone.
 */
export const ConnectionWarningBanner: React.FC<ConnectionWarningBannerProps> = ({ state, onRetry, onUseMock }) => {
  const [dismissed, setDismissed] = useState(false);

  // A new problem (changed level/title/detail) re-shows a previously dismissed banner.
  useEffect(() => {
    setDismissed(false);
  }, [state.level, state.title, state.detail]);

  if (state.level === 'ok') return null;
  if (state.dismissible && dismissed) return null;

  const down = state.level === 'down';
  const tone = down
    ? 'border-red-400/45 bg-red-500/12 text-red-100'
    : 'border-amber-400/45 bg-amber-500/12 text-amber-100';
  const actionClass =
    'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-current/30 hover:bg-current/10 transition-colors';

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-md w-[min(92vw,28rem)]"
      data-testid="map-connection-warning"
    >
      <div className={`rounded-panel border ${tone} backdrop-blur-md shadow-lg shadow-black/25 px-3.5 py-2.5`}>
        <div className="flex items-start gap-2.5">
          <WarnIcon />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-black uppercase tracking-widest leading-tight">{state.title}</div>
            {state.detail && <div className="text-[10.5px] mt-1 leading-snug opacity-85 break-words">{state.detail}</div>}
            {(state.showRetry || state.showUseMock || state.dismissible) && (
              <div className="flex items-center gap-2 mt-2">
                {state.showRetry && onRetry && (
                  <button type="button" onClick={onRetry} className={actionClass}>Retry</button>
                )}
                {state.showUseMock && onUseMock && (
                  <button type="button" onClick={onUseMock} className={actionClass}>Use mock data</button>
                )}
                {state.dismissible && (
                  <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-1 rounded opacity-70 hover:opacity-100 transition-opacity"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
