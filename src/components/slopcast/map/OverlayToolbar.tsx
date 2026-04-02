import React from 'react';
import type { SpatialDataSourceId } from '../../../types';
import { setStoredSpatialSourceId } from '../../../services/spatialService';

const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg) } }`;

type SelectionTool = 'lasso' | 'rectangle';

interface OverlayToolbarProps {
  isClassic: boolean;
  activeTool: SelectionTool | null;
  onSetTool: (tool: SelectionTool | null) => void;
  layers: Record<string, boolean>;
  onToggleLayer: (layer: string) => void;
  dataLayers: Record<string, boolean>;
  onToggleDataLayer: (layer: string) => void;
  isLoading?: boolean;
  source?: 'databricks' | 'mock' | null;
  totalCount?: number;
  truncated?: boolean;
  dataSourceId?: SpatialDataSourceId;
  onSourceChange?: (sourceId: SpatialDataSourceId) => void;
  fallbackActive?: boolean;
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
  dataLayers,
  onToggleDataLayer,
  isLoading,
  source,
  totalCount,
  truncated,
  dataSourceId,
  onSourceChange,
  fallbackActive,
}) => {
  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : 'rounded-panel backdrop-blur-sm bg-[var(--surface-1)]/80 border border-[var(--border)] theme-transition';

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
      <style>{spinKeyframes}</style>
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

        {/* Divider */}
        <div className={`h-px my-0.5 ${isClassic ? 'bg-white/20' : 'bg-[var(--border)]'}`} />

        {/* Data layers header */}
        <div className={`text-[9px] font-bold uppercase tracking-widest px-1 py-0.5 ${
          isClassic ? 'text-white/40' : 'text-[var(--text-muted)]'
        }`}>
          Data
        </div>

        {/* Data layer toggles */}
        <ToolButton
          isClassic={isClassic}
          active={!!dataLayers.producing}
          onClick={() => onToggleDataLayer('producing')}
          title="Producing Wells"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="4" fill="currentColor" />
          </svg>
        </ToolButton>

        <ToolButton
          isClassic={isClassic}
          active={!!dataLayers.duc}
          onClick={() => onToggleDataLayer('duc')}
          title="DUCs"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2L12 11H2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
          </svg>
        </ToolButton>

        <ToolButton
          isClassic={isClassic}
          active={!!dataLayers.permit}
          onClick={() => onToggleDataLayer('permit')}
          title="Permits"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M5 5H9M5 7.5H8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </ToolButton>

        <ToolButton
          isClassic={isClassic}
          active={!!dataLayers.laterals}
          onClick={() => onToggleDataLayer('laterals')}
          title="Laterals"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </ToolButton>

        {/* Footer: count + source toggle */}
        <div className={`flex flex-col items-center gap-0.5 pt-1 ${
          isClassic ? 'text-white/40' : 'text-[var(--text-muted)]'
        } text-[8px]`}>
          {isLoading ? (
            <div
              className={`w-3 h-3 border-[1.5px] border-t-transparent rounded-full ${
                isClassic ? 'border-white/40' : 'border-[var(--text-muted)]'
              }`}
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
          ) : (
            <>
              <span className="font-bold tabular-nums">
                {totalCount != null ? totalCount.toLocaleString() : '—'}
                {truncated && '+'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next: SpatialDataSourceId = dataSourceId === 'live' ? 'mock' : 'live';
                  setStoredSpatialSourceId(next);
                  onSourceChange?.(next);
                }}
                title={`Data: ${dataSourceId === 'live' ? 'Live (click for Mock)' : 'Mock (click for Live)'}`}
                className={`px-1 rounded text-[7px] leading-tight cursor-pointer transition-colors ${
                  dataSourceId === 'live'
                    ? isClassic
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      : 'bg-[var(--cyan)]/20 text-[var(--cyan)] hover:bg-[var(--cyan)]/30'
                    : isClassic
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80'
                }`}
              >
                {dataSourceId === 'live' ? 'DB' : 'Mock'}
              </button>
              {fallbackActive && (
                <span className={`px-1 rounded text-[7px] leading-tight ${
                  isClassic ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-500/20 text-yellow-400'
                }`} title="Live source failed — showing mock data">
                  Fallback
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
