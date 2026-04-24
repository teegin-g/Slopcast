/**
 * Shared hill-height function for the Permian scene.
 *
 * Ported from the original 2D reference scene so the 3D terrain meshes and the
 * pumpjack placement code evaluate exactly the same ridgeline. If these ever
 * drift, pumpjacks float in mid-air.
 *
 * The CPU version is used for placement (JS side) and for the 2D Canvas
 * fallback. The GLSL snippet below is embedded in terrain / skydome shaders
 * via a template-literal include to keep parity.
 */

export interface RidgeParams {
  seed: number;
  /** Amplitude — matches the `amp` parameter from the reference HTML. */
  amp: number;
}

/**
 * Shared hill height in normalized units.
 * @param seed  Per-layer seed (matches `seed` in the reference HTML)
 * @param xNorm  Horizontal fraction 0..1 across the viewport
 * @param amp    Wave magnitude
 * @returns Vertical offset in normalized units (negative = up)
 */
export function hillY(seed: number, xNorm: number, amp: number): number {
  const i = xNorm * 160;
  return (
    -Math.sin(i * 0.04 + seed) * amp -
    Math.sin(i * 0.08 + seed * 1.6) * amp * 0.55 -
    Math.sin(i * 0.15 + seed * 0.6) * amp * 0.3
  );
}

/**
 * GLSL version of hillY, embeddable in any fragment/vertex shader via template
 * literal. Must stay in lockstep with the CPU version above.
 */
export const HILL_NOISE_GLSL = /* glsl */ `
float hillY(float seed, float xNorm, float amp) {
  float i = xNorm * 160.0;
  return
    -sin(i * 0.04 + seed) * amp
    -sin(i * 0.08 + seed * 1.6) * amp * 0.55
    -sin(i * 0.15 + seed * 0.6) * amp * 0.3;
}
`;

/**
 * Canonical ridge layers from the reference scene. Pumpjacks snap to the `y`
 * base and use `amp` + `seed` to compute their flush ground Y.
 */
export const RIDGE_LAYERS = [
  { seed: 1.0, y: 0.53, amp: 0.022, name: 'far' as const },
  { seed: 2.4, y: 0.56, amp: 0.028, name: 'mid' as const },
  { seed: 3.8, y: 0.59, amp: 0.024, name: 'near' as const },
  { seed: 5.5, y: 0.62, amp: 0.018, name: 'close' as const },
];

export type RidgeLayerName = (typeof RIDGE_LAYERS)[number]['name'];

/** Pumpjack placement metadata — x positions + which ridge they sit on. */
export interface PumpjackSlot {
  xNorm: number;
  ridge: RidgeLayerName;
  scale: number;
  phase: number;
}

export const PUMPJACK_SLOTS: PumpjackSlot[] = [
  { xNorm: 0.12, ridge: 'far', scale: 0.3, phase: 0 },
  { xNorm: 0.85, ridge: 'far', scale: 0.25, phase: 1.5 },
  { xNorm: 0.22, ridge: 'mid', scale: 0.4, phase: 0.8 },
  { xNorm: 0.72, ridge: 'mid', scale: 0.38, phase: 2.5 },
  { xNorm: 0.92, ridge: 'mid', scale: 0.35, phase: 4.0 },
  { xNorm: 0.08, ridge: 'near', scale: 0.5, phase: 1.2 },
  { xNorm: 0.65, ridge: 'near', scale: 0.45, phase: 3.3 },
  { xNorm: 0.88, ridge: 'near', scale: 0.48, phase: 5.0 },
];

/** Look up a ridge by name, throwing on unknown (should be unreachable in typed code). */
export function getRidge(name: RidgeLayerName) {
  const r = RIDGE_LAYERS.find(r => r.name === name);
  if (!r) throw new Error(`Unknown ridge: ${name}`);
  return r;
}

/**
 * Resolve a pumpjack slot into world-space ground Y (normalized vertical).
 * Returns a value in 0..1 where 0 is top of viewport and 1 is bottom, matching
 * the 2D scene's coordinate system. World-space converters live in the 3D
 * components that consume this.
 */
export function pumpjackGroundY(slot: PumpjackSlot): number {
  const ridge = getRidge(slot.ridge);
  return ridge.y + hillY(ridge.seed, slot.xNorm, ridge.amp);
}
