/**
 * DebugOverlay Component
 *
 * A floating, draggable debug panel for development use.
 * Toggle visibility with Ctrl+Shift+D.
 *
 * @example
 * ```tsx
 * import { DebugOverlay } from '@/components/debug/DebugOverlay';
 * import { useOverlapDetector } from '@/utils/overlapDetector';
 * import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
 *
 * function App() {
 *   const overlaps = useOverlapDetector();
 *   const performance = usePerformanceMonitor();
 *   const viewport = {
 *     width: window.innerWidth,
 *     height: window.innerHeight,
 *     breakpoint: 'desktop',
 *     isMobile: false,
 *     devicePixelRatio: window.devicePixelRatio,
 *   };
 *
 *   return (
 *     <>
 *       <YourApp />
 *       {import.meta.env.DEV && (
 *         <DebugOverlay
 *           overlaps={overlaps}
 *           performance={performance}
 *           viewport={viewport}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */

import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// Types
// ============================================================================

interface OverlapViolation {
  elementA: { selector: string; rect: DOMRect };
  elementB: { selector: string; rect: DOMRect };
  overlapArea: number;
}

interface PerformanceEntry {
  component: string;
  renderTime: number;
  timestamp: number;
}

interface DebugOverlayProps {
  overlaps: OverlapViolation[];
  performance: {
    fps: number;
    entries: PerformanceEntry[];
    slowRenders: PerformanceEntry[];
  };
  viewport: {
    width: number;
    height: number;
    breakpoint: string;
    isMobile: boolean;
    devicePixelRatio: number;
  };
  /** Controlled visibility — owned by DebugProvider. */
  visible: boolean;
  /** Called when the user clicks the close button. */
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

// ============================================================================
// Module-scope static styles
// ============================================================================

const headerStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
  cursor: 'grab',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: 'bold',
};

const contentStyle: React.CSSProperties = {
  padding: '8px',
  overflowY: 'auto',
  flexGrow: 1,
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: '6px 8px',
  backgroundColor: 'rgba(0, 255, 0, 0.1)',
  marginTop: '8px',
  marginBottom: '4px',
  cursor: 'pointer',
  borderRadius: '2px',
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: 'bold',
};

const sectionContentStyle: React.CSSProperties = {
  padding: '4px 8px',
  marginBottom: '8px',
};

const itemStyle: React.CSSProperties = {
  padding: '3px 0',
  borderBottom: '1px solid rgba(0, 255, 0, 0.1)',
};

const labelStyle: React.CSSProperties = {
  color: '#00cc00',
  fontWeight: 'bold',
};

const valueStyle: React.CSSProperties = {
  color: '#00ff00',
  marginLeft: '8px',
};

const buttonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#00ff00',
  cursor: 'pointer',
  fontSize: '14px',
  padding: '0 4px',
};

// ============================================================================
// Module-scope pure helpers
// ============================================================================

function buildHighlightStyle(rect: DOMRect): React.CSSProperties {
  return {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: '2px solid rgba(255, 0, 0, 0.6)',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    pointerEvents: 'none',
    zIndex: 999998,
    boxSizing: 'border-box',
  };
}

// ============================================================================
// Drag state reducer
// ============================================================================

interface DragState {
  dragging: boolean;
  position: Position;
  dragOffset: Position;
}

type DragAction =
  | { type: 'start'; clientX: number; clientY: number }
  | { type: 'move'; clientX: number; clientY: number }
  | { type: 'end' };

function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        dragging: true,
        dragOffset: {
          x: action.clientX - state.position.x,
          y: action.clientY - state.position.y,
        },
      };
    case 'move':
      if (!state.dragging) return state;
      return {
        ...state,
        position: {
          x: action.clientX - state.dragOffset.x,
          y: action.clientY - state.dragOffset.y,
        },
      };
    case 'end':
      return { ...state, dragging: false };
    default:
      return state;
  }
}

const INITIAL_DRAG_STATE: DragState = {
  dragging: false,
  position: { x: 20, y: 20 },
  dragOffset: { x: 0, y: 0 },
};

// ============================================================================
// Component
// ============================================================================

export function DebugOverlay({ overlaps, performance, viewport, visible, onClose }: DebugOverlayProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    overlaps: false,
    performance: false,
    viewport: false,
  });
  const [dragState, dispatchDrag] = useReducer(dragReducer, INITIAL_DRAG_STATE);
  const { dragging, position } = dragState;
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dispatchDrag({ type: 'start', clientX: e.clientX, clientY: e.clientY });
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      dispatchDrag({ type: 'move', clientX: e.clientX, clientY: e.clientY });
    };

    const handleMouseUp = () => {
      dispatchDrag({ type: 'end' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  const toggleSection = useCallback((section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  if (!visible) return null;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: '350px',
    maxHeight: '400px',
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: '12px',
    border: '1px solid rgba(0, 255, 0, 0.3)',
    borderRadius: '4px',
    zIndex: 999999,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    cursor: dragging ? 'grabbing' : 'default',
    userSelect: 'none',
  };

  // ============================================================================
  // Render Panel
  // ============================================================================

  return (
    <>
      {/* Main Debug Panel */}
      <div ref={panelRef} style={panelStyle}>
        <div role="none" style={headerStyle} onMouseDown={handleMouseDown}>
          <span>DEBUG OVERLAY</span>
          <button
            type="button"
            style={buttonStyle}
            onClick={onClose}
            title="Close (Ctrl+Shift+D)"
          >
            ✕
          </button>
        </div>

        <div style={contentStyle}>
          {/* Overlaps Section */}
          <div>
            <button
              type="button"
              style={sectionHeaderStyle}
              onClick={() => toggleSection('overlaps')}
            >
              <span>OVERLAPS ({overlaps.length})</span>
              <span>{collapsed.overlaps ? '▼' : '▲'}</span>
            </button>
            {!collapsed.overlaps && (
              <div style={sectionContentStyle}>
                {overlaps.length === 0 ? (
                  <div style={{ color: '#666' }}>No overlaps detected</div>
                ) : (
                  overlaps.slice(0, 10).map((overlap) => (
                    <div key={`${overlap.elementA.selector}-${overlap.elementB.selector}`} style={itemStyle}>
                      <div>
                        <span style={labelStyle}>A:</span>
                        <span style={valueStyle}>{overlap.elementA.selector}</span>
                      </div>
                      <div>
                        <span style={labelStyle}>B:</span>
                        <span style={valueStyle}>{overlap.elementB.selector}</span>
                      </div>
                      <div>
                        <span style={labelStyle}>Area:</span>
                        <span style={valueStyle}>{overlap.overlapArea.toFixed(0)}px²</span>
                      </div>
                    </div>
                  ))
                )}
                {overlaps.length > 10 && (
                  <div style={{ color: '#666', marginTop: '4px' }}>
                    ...and {overlaps.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Performance Section */}
          <div>
            <button
              type="button"
              style={sectionHeaderStyle}
              onClick={() => toggleSection('performance')}
            >
              <span>PERFORMANCE</span>
              <span>{collapsed.performance ? '▼' : '▲'}</span>
            </button>
            {!collapsed.performance && (
              <div style={sectionContentStyle}>
                <div style={itemStyle}>
                  <span style={labelStyle}>FPS:</span>
                  <span style={valueStyle}>{performance.fps.toFixed(1)}</span>
                </div>
                <div style={itemStyle}>
                  <span style={labelStyle}>Total Renders:</span>
                  <span style={valueStyle}>{performance.entries.length}</span>
                </div>
                {performance.slowRenders.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ ...labelStyle, marginBottom: '4px' }}>
                      Slow Renders ({'>'} 16ms):
                    </div>
                    {performance.slowRenders.slice(0, 5).map((entry) => (
                      <div key={`${entry.component}-${entry.timestamp}`} style={{ padding: '2px 0', color: '#ff6600' }}>
                        <div>{entry.component}</div>
                        <div style={{ fontSize: '12px', color: '#cc5500' }}>
                          {entry.renderTime.toFixed(2)}ms @ {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                    {performance.slowRenders.length > 5 && (
                      <div style={{ color: '#666', marginTop: '4px' }}>
                        ...and {performance.slowRenders.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Viewport Section */}
          <div>
            <button
              type="button"
              style={sectionHeaderStyle}
              onClick={() => toggleSection('viewport')}
            >
              <span>VIEWPORT</span>
              <span>{collapsed.viewport ? '▼' : '▲'}</span>
            </button>
            {!collapsed.viewport && (
              <div style={sectionContentStyle}>
                <div style={itemStyle}>
                  <span style={labelStyle}>Dimensions:</span>
                  <span style={valueStyle}>
                    {viewport.width} × {viewport.height}
                  </span>
                </div>
                <div style={itemStyle}>
                  <span style={labelStyle}>Breakpoint:</span>
                  <span style={valueStyle}>{viewport.breakpoint}</span>
                </div>
                <div style={itemStyle}>
                  <span style={labelStyle}>Mode:</span>
                  <span style={valueStyle}>{viewport.isMobile ? 'Mobile' : 'Desktop'}</span>
                </div>
                <div style={itemStyle}>
                  <span style={labelStyle}>Device Pixel Ratio:</span>
                  <span style={valueStyle}>{viewport.devicePixelRatio}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlap Highlights */}
      {createPortal(
        <OverlapHighlights overlaps={overlaps} />,
        document.body
      )}
    </>
  );
}

// ============================================================================
// Overlap Highlights Component
// ============================================================================

interface OverlapHighlightsProps {
  overlaps: OverlapViolation[];
}

function OverlapHighlights({ overlaps }: OverlapHighlightsProps) {
  if (overlaps.length === 0) return null;

  return (
    <>
      {overlaps.map((overlap) => (
        <div key={`${overlap.elementA.selector}-${overlap.elementB.selector}`}>
          <div style={buildHighlightStyle(overlap.elementA.rect)} />
          <div style={buildHighlightStyle(overlap.elementB.rect)} />
        </div>
      ))}
    </>
  );
}
