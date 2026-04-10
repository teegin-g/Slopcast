import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

// ── Point-in-polygon (ray casting) ──────────────────────────────────────
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Types ───────────────────────────────────────────────────────────────
interface UseMapSelectionParams {
  map: any;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  activeTool: 'lasso' | 'rectangle' | null;
  wellLayerIds: string[];
  theme: { lassoFill: string; lassoStroke: string; lassoDash: string };
  onSelectWells: (ids: string[]) => void;
}

interface UseMapSelectionReturn {
  selectionOverlay: React.ReactNode;
}

// ── Hook ────────────────────────────────────────────────────────────────
export function useMapSelection({
  map,
  mapContainerRef,
  activeTool,
  wellLayerIds,
  theme,
  onSelectWells,
}: UseMapSelectionParams): UseMapSelectionReturn {
  // Render state — drives the SVG overlay
  const [rectStart, setRectStart] = useState<[number, number] | null>(null);
  const [rectEnd, setRectEnd] = useState<[number, number] | null>(null);
  const [lassoPoints, setLassoPoints] = useState<[number, number][]>([]);

  // Refs for event handlers (avoid stale closures)
  const isDrawing = useRef(false);
  const lassoRef = useRef<[number, number][]>([]);
  const rectStartRef = useRef<[number, number] | null>(null);
  const rectEndRef = useRef<[number, number] | null>(null);

  const onSelectWellsRef = useRef(onSelectWells);
  onSelectWellsRef.current = onSelectWells;
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const wellLayerIdsRef = useRef(wellLayerIds);
  wellLayerIdsRef.current = wellLayerIds;

  // ── Disable/enable map drag based on tool ───────────────────────────
  useEffect(() => {
    if (!map) return;
    if (activeTool) {
      map.dragPan.disable();
      map.getCanvas().style.cursor = 'crosshair';
    } else {
      map.dragPan.enable();
      map.getCanvas().style.cursor = '';
    }
    return () => {
      try {
        map.dragPan.enable();
        map.getCanvas().style.cursor = '';
      } catch { /* map already torn down */ }
    };
  }, [map, activeTool]);

  // ── Reset helper ────────────────────────────────────────────────────
  const clearState = useCallback(() => {
    setRectStart(null);
    setRectEnd(null);
    setLassoPoints([]);
    lassoRef.current = [];
    rectStartRef.current = null;
    rectEndRef.current = null;
    isDrawing.current = false;
  }, []);

  // ── Mouse event handlers ────────────────────────────────────────────
  useEffect(() => {
    if (!map || !activeTool) return;

    const canvas = map.getCanvas() as HTMLCanvasElement;

    function getOffset(e: MouseEvent): [number, number] {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      isDrawing.current = true;
      const pt = getOffset(e);

      if (activeToolRef.current === 'rectangle') {
        rectStartRef.current = pt;
        rectEndRef.current = pt;
        setRectStart(pt);
        setRectEnd(pt);
      } else if (activeToolRef.current === 'lasso') {
        lassoRef.current = [pt];
        setLassoPoints([pt]);
      }
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDrawing.current) return;
      const pt = getOffset(e);

      if (activeToolRef.current === 'rectangle') {
        rectEndRef.current = pt;
        setRectEnd(pt);
      } else if (activeToolRef.current === 'lasso') {
        lassoRef.current.push(pt);
        setLassoPoints([...lassoRef.current]);
      }
    }

    function onMouseUp() {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const tool = activeToolRef.current;
      const layers = wellLayerIdsRef.current;

      if (tool === 'rectangle') {
        const start = rectStartRef.current;
        const end = rectEndRef.current;
        if (start && end && map) {
          const minX = Math.min(start[0], end[0]);
          const minY = Math.min(start[1], end[1]);
          const maxX = Math.max(start[0], end[0]);
          const maxY = Math.max(start[1], end[1]);

          if (maxX - minX > 4 || maxY - minY > 4) {
            const bbox: [[number, number], [number, number]] = [[minX, minY], [maxX, maxY]];
            try {
              const features = map.queryRenderedFeatures(bbox, { layers });
              const ids = features
                .map((f: any) => f.properties?.id)
                .filter(Boolean) as string[];
              const unique = [...new Set(ids)];
              if (unique.length > 0) onSelectWellsRef.current(unique);
            } catch {
              // Layer may not exist yet
            }
          }
        }
        clearState();
      } else if (tool === 'lasso') {
        const pts = lassoRef.current;
        if (pts.length > 2 && map) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const [x, y] of pts) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }

          try {
            const bbox: [[number, number], [number, number]] = [[minX, minY], [maxX, maxY]];
            const features = map.queryRenderedFeatures(bbox, { layers });
            const ids: string[] = [];
            const seen = new Set<string>();

            for (const f of features) {
              const id = f.properties?.id;
              if (!id || seen.has(id)) continue;
              seen.add(id);

              const coords = f.geometry?.coordinates;
              if (coords) {
                const projected = map.project(coords);
                if (pointInPolygon([projected.x, projected.y], pts)) {
                  ids.push(id);
                }
              }
            }
            if (ids.length > 0) onSelectWellsRef.current(ids);
          } catch {
            // Layer may not exist yet
          }
        }
        clearState();
      }
    }

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      clearState();
    };
  }, [map, activeTool, clearState]);

  // ── Build SVG overlay ───────────────────────────────────────────────
  let overlay: React.ReactNode = null;

  if (activeTool === 'rectangle' && rectStart && rectEnd) {
    const x = Math.min(rectStart[0], rectEnd[0]);
    const y = Math.min(rectStart[1], rectEnd[1]);
    const w = Math.abs(rectEnd[0] - rectStart[0]);
    const h = Math.abs(rectEnd[1] - rectStart[1]);
    overlay = (
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      >
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={theme.lassoFill}
          stroke={theme.lassoStroke}
          strokeWidth={1.5}
          strokeDasharray={theme.lassoDash}
        />
      </svg>
    );
  } else if (activeTool === 'lasso' && lassoPoints.length > 1) {
    const pointsStr = lassoPoints.map(p => p.join(',')).join(' ');
    overlay = (
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      >
        <polygon
          points={pointsStr}
          fill={theme.lassoFill}
          stroke={theme.lassoStroke}
          strokeWidth={1.5}
          strokeDasharray={theme.lassoDash}
        />
      </svg>
    );
  }

  return { selectionOverlay: overlay };
}
