/**
 * useCanvasBackground — shared lifecycle for the animated full-viewport canvas backgrounds.
 *
 * Composes the pieces every canvas background needs:
 *   - a canvas ref + 2D context
 *   - DPR-aware sizing on mount and `window` resize
 *   - a requestAnimationFrame loop
 *   - prefers-reduced-motion handling (matching backgroundLifecycle's peers): when reduced,
 *     the loop is not started and a single static frame is drawn instead.
 *
 * The hook intentionally mirrors the EXACT lifecycle shape the peer backgrounds already used
 * (Mario/Tropical/Hyperborea): resize via `window` 'resize', a `reduceMotion` flag captured at
 * setup with a matchMedia 'change' listener, and a draw callback that the caller reschedules
 * by returning normally (the hook reschedules unless reduced motion). This is a pure
 * de-duplication of lifecycle wiring — it does not change draw math, geometry, colors, or timing.
 *
 * Backgrounds whose lifecycle diverges materially (per-frame dt accumulation, page-visibility
 * pausing, FX MutationObserver, mode observers, custom DPR formulas) should NOT use this hook
 * unless those concerns are threaded in explicitly, to avoid any visual change.
 */
import { useEffect, useRef, type RefObject } from 'react';

export interface CanvasBackgroundContext {
  ctx: CanvasRenderingContext2D;
  /** Backing-store width (CSS pixels * DPR). */
  width: number;
  /** Backing-store height (CSS pixels * DPR). */
  height: number;
  /** The device pixel ratio used for the current sizing. */
  dpr: number;
}

export interface UseCanvasBackgroundOptions {
  /**
   * Per-frame draw callback. Receives the timestamp from requestAnimationFrame (ms) and the
   * current canvas context/size. The hook handles clearing? No — the caller clears, exactly as
   * the original per-file code did, to preserve identical output.
   */
  draw: (timeMs: number, c: CanvasBackgroundContext) => void;
  /**
   * Optional one-time init run after the context is acquired and before the first frame.
   * Returns an optional cleanup invoked on unmount.
   */
  init?: (c: Pick<CanvasBackgroundContext, 'ctx'>) => void | (() => void);
  /**
   * DPR resolver. Defaults to `window.devicePixelRatio || 1` (uncapped) to match the
   * Hyperborea/Tropical/Moonlight peers. Pass `(dpr) => Math.min(dpr, 2)` for the
   * Mario/StormDusk peers.
   */
  resolveDpr?: (rawDpr: number) => number;
  /**
   * How backing-store dimensions are computed from CSS size * dpr. Defaults to plain
   * multiplication (Hyperborea/Tropical/Moonlight). Pass `Math.floor` for Mario/StormDusk.
   */
  roundSize?: (value: number) => number;
  /** Called on every resize after the canvas is resized (e.g. to invalidate cached patterns). */
  onResize?: (c: CanvasBackgroundContext) => void;
}

export function useCanvasBackground(
  options: UseCanvasBackgroundOptions,
): { canvasRef: RefObject<HTMLCanvasElement | null> } {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  // Keep the latest callbacks without re-running the effect (the effect runs once, like the
  // original per-file useEffect([], ...)).
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let DPR = 1;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionQuery?.matches ?? false;

    const resolveDpr = optsRef.current.resolveDpr ?? ((d: number) => d);
    const roundSize = optsRef.current.roundSize ?? ((v: number) => v);

    const initCleanup = optsRef.current.init?.({ ctx });

    function snapshot(): CanvasBackgroundContext {
      return { ctx: ctx!, width: W, height: H, dpr: DPR };
    }

    function resize() {
      DPR = resolveDpr(window.devicePixelRatio || 1);
      W = roundSize(window.innerWidth * DPR);
      H = roundSize(window.innerHeight * DPR);
      canvas!.width = W;
      canvas!.height = H;
      optsRef.current.onResize?.(snapshot());
      if (reduceMotion) draw(0);
    }

    function draw(t: number) {
      optsRef.current.draw(t, snapshot());
      if (reduceMotion) return;
      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);

    const handleMotionChange = () => {
      reduceMotion = motionQuery?.matches ?? false;
      cancelAnimationFrame(rafRef.current);
      if (reduceMotion) {
        draw(0);
      } else {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    if (motionQuery) {
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', handleMotionChange);
      else motionQuery.addListener(handleMotionChange);
    }

    if (reduceMotion) {
      draw(0);
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      if (motionQuery) {
        if (motionQuery.removeEventListener) motionQuery.removeEventListener('change', handleMotionChange);
        else motionQuery.removeListener(handleMotionChange);
      }
      if (typeof initCleanup === 'function') initCleanup();
    };
  }, []);

  return { canvasRef };
}
