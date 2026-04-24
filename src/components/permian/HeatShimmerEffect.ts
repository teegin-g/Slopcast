import { Effect } from 'postprocessing';
import { Uniform, type WebGLRenderer, type WebGLRenderTarget } from 'three';

/**
 * HeatShimmerEffect — custom postprocessing pass that distorts the lower third
 * of the screen with procedural sin-noise UV offsets, imitating hot-asphalt
 * shimmer over the Permian flats at midday. Amplitude fades to 0 at the
 * horizon cutoff so the sky stays crisp.
 *
 * Wire-up: register this as an <EffectComposer> child via the `wrapEffect`
 * helper from `@react-three/postprocessing` (see PermianBackground.tsx).
 *
 * Tuning:
 *   amplitude  — 0..1, 0 turns the effect off entirely (used during Dusk).
 *   cutoff     — uv.y above this value passes through untouched (0.42 ≈ mid).
 *   speed      — temporal frequency (radians / second).
 */
const fragmentShader = /* glsl */ `
  uniform float uAmplitude;
  uniform float uCutoff;
  uniform float uSpeed;
  uniform float uTime;

  void mainUv(inout vec2 uv) {
    if (uAmplitude <= 0.0001) return;

    // Only distort below the horizon cutoff; ease-in over the top 20% so the
    // effect fades smoothly instead of clipping at a hard line.
    float below = step(uv.y, uCutoff);
    float easeBand = smoothstep(uCutoff, uCutoff - 0.22, uv.y);
    float mask = below * easeBand;
    if (mask <= 0.0001) return;

    // Cheap sum-of-sines noise (no texture lookups). Two octaves scaled to
    // fat horizontal bands, stronger closer to the ground.
    float t = uTime * uSpeed;
    float depth = clamp((uCutoff - uv.y) / uCutoff, 0.0, 1.0);
    float shimmer =
        sin(uv.x * 42.0 + t * 3.0 + uv.y * 16.0) * 0.6
      + sin(uv.x * 78.0 - t * 4.2 + uv.y * 32.0) * 0.35
      + sin(uv.x * 14.0 + t * 1.2) * 0.25;

    float offset = shimmer * uAmplitude * mask * (0.0025 + depth * 0.0055);
    uv.x += offset;
    // Slight vertical drift so edges break up vertically as well.
    uv.y += offset * 0.35;
  }
`;

export interface HeatShimmerOptions {
  amplitude?: number;
  cutoff?: number;
  speed?: number;
}

/**
 * Custom postprocessing Effect. Targets the UV of downstream passes via
 * `mainUv()`, meaning the effect composites into the composer's chain without
 * owning its own render target.
 */
export class HeatShimmerEffect extends Effect {
  constructor({ amplitude = 0, cutoff = 0.42, speed = 1.0 }: HeatShimmerOptions = {}) {
    const uniforms = new Map<string, Uniform>([
      ['uAmplitude', new Uniform(amplitude)],
      ['uCutoff', new Uniform(cutoff)],
      ['uSpeed', new Uniform(speed)],
      ['uTime', new Uniform(0)],
    ]);

    super('HeatShimmerEffect', fragmentShader, { uniforms });
  }

  /** Amplitude in 0..1. 0 disables the effect cheaply via the shader guard. */
  get amplitude(): number {
    return this.uniforms.get('uAmplitude')!.value as number;
  }

  set amplitude(v: number) {
    this.uniforms.get('uAmplitude')!.value = v;
  }

  /** Horizon cutoff in uv.y; values above keep the sky undistorted. */
  set cutoff(v: number) {
    this.uniforms.get('uCutoff')!.value = v;
  }

  set speed(v: number) {
    this.uniforms.get('uSpeed')!.value = v;
  }

  /** Called automatically by the EffectPass/EffectComposer each frame. */
  override update(
    _renderer: WebGLRenderer,
    _inputBuffer: WebGLRenderTarget,
    deltaTime?: number,
  ): void {
    const u = this.uniforms.get('uTime')!;
    u.value = (u.value as number) + (deltaTime ?? 0);
  }
}
