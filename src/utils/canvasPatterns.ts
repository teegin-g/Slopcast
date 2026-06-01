/**
 * canvasPatterns — shared post-processing helpers for the animated canvas backgrounds.
 *
 * These were copy-pasted (with drift) across several background components. They are
 * extracted here verbatim/parameterized so every call site can reproduce its CURRENT
 * output exactly — no visual change is intended. When using these, pass the same
 * radii / opacities / stops the original inline code used.
 */

/**
 * Builds the CRT scanline pattern: a 4x4 tile with a semi-transparent black bar across
 * the top 4x2 region, tiled `repeat`. This was byte-identical in Hyperborea & Tropical.
 *
 * @param ctx       The destination 2D context (used only to create the pattern).
 * @param fillStyle The bar color. Defaults to the shared 'rgba(0, 0, 0, 0.06)'.
 */
export function getScanlinePattern(
  ctx: CanvasRenderingContext2D,
  fillStyle = 'rgba(0, 0, 0, 0.06)',
): CanvasPattern | null {
  const pc = document.createElement('canvas');
  pc.width = 4;
  pc.height = 4;
  const pctx = pc.getContext('2d')!;
  pctx.fillStyle = fillStyle;
  pctx.fillRect(0, 0, 4, 2);
  return ctx.createPattern(pc, 'repeat');
}

export interface VignetteStop {
  /** Gradient stop offset in [0, 1]. */
  offset: number;
  /** CSS color string for the stop. */
  color: string;
}

export interface VignetteOptions {
  /** Inner circle center X (default W * 0.5). */
  cx0?: number;
  /** Inner circle center Y (default H * 0.5). */
  cy0?: number;
  /** Inner circle radius. */
  r0: number;
  /** Outer circle center X (default W * 0.5). */
  cx1?: number;
  /** Outer circle center Y (default H * 0.5). */
  cy1?: number;
  /** Outer circle radius. */
  r1: number;
  /** Color stops applied to the radial gradient, in order. */
  stops: VignetteStop[];
}

/**
 * Draws a radial vignette over the full canvas. The center/radii/stops differ per
 * background, so every parameter is explicit — pass the same values the original inline
 * `drawVignette` used to keep output identical.
 */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  opts: VignetteOptions,
): void {
  const cx0 = opts.cx0 ?? W * 0.5;
  const cy0 = opts.cy0 ?? H * 0.5;
  const cx1 = opts.cx1 ?? W * 0.5;
  const cy1 = opts.cy1 ?? H * 0.5;
  const vg = ctx.createRadialGradient(cx0, cy0, opts.r0, cx1, cy1, opts.r1);
  for (const stop of opts.stops) vg.addColorStop(stop.offset, stop.color);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}
