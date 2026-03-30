import React from 'react';

type SelectionTool = 'lasso' | 'rectangle';

interface OverlayToolbarProps {
  isClassic: boolean;
  activeTool: SelectionTool | null;
  onSetTool: (tool: SelectionTool | null) => void;
  layers: Record<string, boolean>;
  onToggleLayer: (layer: string) => void;
}

const ToolButton: React.FC<{
  isClassic: boolean;
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isClassic, active, onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
      active
        ? isClassic
          ? 'sc-btnPrimary'
          : 'bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40'
        : isClassic
          ? 'text-white/60 hover:text-white hover:bg-white/10'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
    }`}
  >
    {children}
  </button>
);

export const OverlayToolbar: React.FC<OverlayToolbarProps> = ({
  isClassic,
  activeTool,
  onSetTool,
  layers,
  onToggleLayer,
}) => {
  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : 'rounded-panel backdrop-blur-sm bg-[var(--surface-1)]/80 border border-[var(--border)] theme-transition';

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
      <div className={`${panelClass} p-1.5 flex flex-col gap-1`}>
        {/* Selection tools */}
        <ToolButton
          isClassic={isClassic}
          active={activeTool === 'lasso'}
          onClick={() => onSetTool(activeTool === 'lasso' ? null : 'lasso')}
          title="Lasso Select"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 14L3 3L8 1L13 4L14 10L10 14L5 13L2 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
          </svg>
        </ToolButton>

        <ToolButton
          isClassic={isClassic}
          active={activeTool === 'rectangle'}
          onClick={() => onSetTool(activeTool === 'rectangle' ? null : 'rectangle')}
          title="Rectangle Select"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
          </svg>
        </ToolButton>

        {/* Divider */}
        <div className={`h-px my-0.5 ${isClassic ? 'bg-white/20' : 'bg-[var(--border)]'}`} />

        {/* Layer toggles */}
        <ToolButton
          isClassic={isClassic}
          active={!!layers.grid}
          onClick={() => onToggleLayer('grid')}
          title="Section Grid"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 4H15M1 8H15M1 12H15M4 1V15M8 1V15M12 1V15" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
          </svg>
        </ToolButton>

        <ToolButton
          isClassic={isClassic}
          active={!!layers.heatmap}
          onClick={() => onToggleLayer('heatmap')}
          title="Heatmap"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="8" cy="8" r="3" fill="currentColor" fillOpacity="0.4" />
          </svg>
        </ToolButton>

        <ToolButton
          isClassic={isClassic}
          active={!!layers.satellite}
          onClick={() => onToggleLayer('satellite')}
          title="Satellite"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M2 8H14M8 2C6 4 5.5 6 5.5 8S6 12 8 14M8 2C10 4 10.5 6 10.5 8S10 12 8 14" stroke="currentColor" strokeWidth="1" />
          </svg>
        </ToolButton>
      </div>
    </div>
  );
};
