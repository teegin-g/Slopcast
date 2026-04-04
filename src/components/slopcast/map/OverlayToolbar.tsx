import React from 'react';
import type { SpatialDataSourceId } from '../../../types';
import { setStoredSpatialSourceId } from '../../../services/spatialService';
import { useTheme } from '../../../theme/ThemeProvider';
import { overlayPanelClass } from '../../../theme/themes';

const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg) } }`;

type SelectionTool = 'lasso' | 'rectangle';
type SpatialSource = 'databricks' | 'mock';
type ToolbarLayerKey = 'grid' | 'heatmap' | 'satellite';
type ToolbarDataLayerKey = 'producing' | 'duc' | 'permit' | 'laterals';

interface OverlayToolbarProps {
  isClassic: boolean;
  activeTool: SelectionTool | null;
  onSetTool: (tool: SelectionTool | null) => void;
  layers: Record<string, boolean>;
  onToggleLayer: (layer: string) => void;
  dataLayers: Record<string, boolean>;
  onToggleDataLayer: (layer: string) => void;
  isLoading?: boolean;
  source?: SpatialSource | null;
  totalCount?: number;
  truncated?: boolean;
  dataSourceId?: SpatialDataSourceId;
  onSourceChange?: (sourceId: SpatialDataSourceId) => void;
  fallbackActive?: boolean;
}

const iconButtonClass =
  'w-11 h-11 rounded-lg flex shrink-0 items-center justify-center touch-manipulation transition-colors';

const layerButtons: ReadonlyArray<{ key: ToolbarLayerKey; title: string; icon: React.ReactNode }> = [
  {
    key: 'grid',
    title: 'Section Grid',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 4H15M1 8H15M1 12H15M4 1V15M8 1V15M12 1V15" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
      </svg>
    ),
  },
  {
    key: 'heatmap',
    title: 'Heatmap',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="8" r="3" fill="currentColor" fillOpacity="0.4" />
      </svg>
    ),
  },
  {
    key: 'satellite',
    title: 'Satellite',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M2 8H14M8 2C6 4 5.5 6 5.5 8S6 12 8 14M8 2C10 4 10.5 6 10.5 8S10 12 8 14" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
];

const dataLayerButtons: ReadonlyArray<{ key: ToolbarDataLayerKey; title: string; icon: React.ReactNode }> = [
  {
    key: 'producing',
    title: 'Producing Wells',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: 'duc',
    title: 'DUCs',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2L12 11H2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    key: 'permit',
    title: 'Permits',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M5 5H9M5 7.5H8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'laterals',
    title: 'Laterals',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

function resolveSelectedSourceId(
  dataSourceId?: SpatialDataSourceId,
  source?: SpatialSource | null,
): SpatialDataSourceId {
  if (dataSourceId) return dataSourceId;
  return source === 'databricks' ? 'live' : 'mock';
}

function resolveRenderedSource(
  source: SpatialSource | null | undefined,
  selectedSourceId: SpatialDataSourceId,
): SpatialSource {
  if (source) return source;
  return selectedSourceId === 'live' ? 'databricks' : 'mock';
}

function getSourceButtonTitle(
  selectedSourceId: SpatialDataSourceId,
  renderedSource: SpatialSource,
  fallbackActive?: boolean,
): string {
  if (fallbackActive && selectedSourceId === 'live' && renderedSource === 'mock') {
    return 'Using mock fallback while Live is selected. Click to switch to Mock.';
  }

  return `Data source: ${renderedSource === 'databricks' ? 'Databricks' : 'Mock'}. Click to switch to ${selectedSourceId === 'live' ? 'Mock' : 'Databricks'}.`;
}

function getSourceButtonClass(isClassic: boolean, renderedSource: SpatialSource): string {
  if (renderedSource === 'databricks') {
    return isClassic
      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
      : 'bg-[var(--cyan)]/20 text-[var(--cyan)] hover:bg-[var(--cyan)]/30';
  }

  return isClassic
    ? 'bg-white/10 hover:bg-white/20'
    : 'bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80';
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
    aria-label={title}
    aria-pressed={active}
    className={`${iconButtonClass} ${
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
  const { theme } = useTheme();
  const panelClass = isClassic
    ? 'sc-panel theme-transition'
    : `rounded-panel ${overlayPanelClass(theme.features.panelStyle)} theme-transition`;
  const selectedSourceId = resolveSelectedSourceId(dataSourceId, source);
  const renderedSource = resolveRenderedSource(source, selectedSourceId);
  const nextSourceId: SpatialDataSourceId = selectedSourceId === 'live' ? 'mock' : 'live';
  const sourceButtonTitle = getSourceButtonTitle(selectedSourceId, renderedSource, fallbackActive);
  const footerTextClass = isClassic ? 'text-white/40' : 'text-[var(--text-muted)]';

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
      <style>{spinKeyframes}</style>
      <div className={`${panelClass} p-1.5 flex flex-col gap-1`}>
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

        <div className={`h-px my-0.5 ${isClassic ? 'bg-white/20' : 'bg-[var(--border)]'}`} />

        {layerButtons.map(({ key, title, icon }) => (
          <ToolButton
            key={key}
            isClassic={isClassic}
            active={!!layers[key]}
            onClick={() => onToggleLayer(key)}
            title={title}
          >
            {icon}
          </ToolButton>
        ))}

        <div className={`h-px my-0.5 ${isClassic ? 'bg-white/20' : 'bg-[var(--border)]'}`} />

        <div className={`text-[10px] md:text-[9px] font-bold uppercase tracking-widest px-1 py-0.5 ${footerTextClass}`}>
          Data
        </div>

        {dataLayerButtons.map(({ key, title, icon }) => (
          <ToolButton
            key={key}
            isClassic={isClassic}
            active={!!dataLayers[key]}
            onClick={() => onToggleDataLayer(key)}
            title={title}
          >
            {icon}
          </ToolButton>
        ))}

        <div className={`flex flex-col items-center gap-1 pt-1 ${footerTextClass} text-[9px] md:text-[8px]`}>
          {isLoading ? (
            <div
              className={`w-4 h-4 md:w-3 md:h-3 border-[1.5px] border-t-transparent rounded-full ${
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
                  setStoredSpatialSourceId(nextSourceId);
                  onSourceChange?.(nextSourceId);
                }}
                title={sourceButtonTitle}
                aria-label={sourceButtonTitle}
                className={`min-w-11 min-h-11 px-1.5 rounded-md text-[8px] leading-tight touch-manipulation cursor-pointer transition-colors ${getSourceButtonClass(
                  isClassic,
                  renderedSource,
                )}`}
              >
                {renderedSource === 'databricks' ? 'DB' : 'Mock'}
              </button>
              {fallbackActive && (
                <span
                  className={`px-1.5 rounded text-[8px] md:text-[7px] leading-tight ${
                    isClassic ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                  title="Live source failed — showing mock data"
                >
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
