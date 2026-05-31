/**
 * Shared WebGL state utilities for Mapbox custom layers.
 *
 * Both MapWellboreLayer and MapSelectionTrail need to snapshot Mapbox's GL
 * state before their custom draw calls and restore it afterwards. They also
 * both wire up a prefers-reduced-motion listener.
 *
 * GL state captured (superset of both layers):
 *   CURRENT_PROGRAM, ARRAY_BUFFER_BINDING,
 *   BLEND (enabled flag + BLEND_SRC_RGB/DST_RGB/SRC_ALPHA/DST_ALPHA),
 *   DEPTH_TEST, CULL_FACE
 *
 * Note: WellboreLayer saves CULL_FACE; SelectionTrail did not — but
 * restoring CULL_FACE to its pre-draw value is safe for both because
 * neither layer's draw path mutates it in a way that Mapbox depends on
 * being un-restored. The superset is therefore correct for both callers.
 */

// ── GL state snapshot / restore ─────────────────────────────────────────────

export interface GlStateSnapshot {
  program: WebGLProgram | null;
  arrayBuffer: WebGLBuffer | null;
  blend: boolean;
  blendSrcRgb: number;
  blendDstRgb: number;
  blendSrcAlpha: number;
  blendDstAlpha: number;
  depthTest: boolean;
  cullFace: boolean;
}

/**
 * Capture the current WebGL state that Mapbox may rely on. Call before any
 * custom draw operations and pass the result to `restoreGlState` afterwards.
 */
export function saveGlState(gl: WebGLRenderingContext): GlStateSnapshot {
  return {
    program: gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null,
    arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING) as WebGLBuffer | null,
    blend: gl.isEnabled(gl.BLEND),
    blendSrcRgb: gl.getParameter(gl.BLEND_SRC_RGB) as number,
    blendDstRgb: gl.getParameter(gl.BLEND_DST_RGB) as number,
    blendSrcAlpha: gl.getParameter(gl.BLEND_SRC_ALPHA) as number,
    blendDstAlpha: gl.getParameter(gl.BLEND_DST_ALPHA) as number,
    depthTest: gl.isEnabled(gl.DEPTH_TEST),
    cullFace: gl.isEnabled(gl.CULL_FACE),
  };
}

/**
 * Restore WebGL state from a snapshot produced by `saveGlState`. Call in the
 * `finally` block of a custom layer's render method so state is always
 * restored even if an exception occurs mid-draw.
 *
 * Also disables any vertex attrib arrays that were enabled during the draw
 * pass (pass the array that was populated via `enabledAttribs.push(loc)`).
 */
export function restoreGlState(
  gl: WebGLRenderingContext,
  saved: GlStateSnapshot,
  enabledAttribs: number[],
): void {
  for (const attr of enabledAttribs) {
    gl.disableVertexAttribArray(attr);
  }
  gl.useProgram(saved.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, saved.arrayBuffer);
  if (saved.blend) {
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      saved.blendSrcRgb,
      saved.blendDstRgb,
      saved.blendSrcAlpha,
      saved.blendDstAlpha,
    );
  } else {
    gl.disable(gl.BLEND);
  }
  if (saved.depthTest) gl.enable(gl.DEPTH_TEST);
  else gl.disable(gl.DEPTH_TEST);
  if (saved.cullFace) gl.enable(gl.CULL_FACE);
  else gl.disable(gl.CULL_FACE);
}

// ── Reduced-motion listener ──────────────────────────────────────────────────

export interface ReducedMotionListener {
  /** Current value at the time the listener was created. */
  initialValue: boolean;
  /** Remove the event listener and release the MediaQueryList. */
  dispose: () => void;
}

/**
 * Create a prefers-reduced-motion listener. Reads the initial value and
 * subscribes to runtime changes.
 *
 * @param onChange - Called whenever the preference changes. Receives the new
 *   boolean value (true = reduce motion).
 * @returns An object with the initial value and a `dispose()` method to
 *   clean up the listener (call from `onRemove`).
 *
 * @example
 * // In onAdd():
 * const listener = createReducedMotionListener(matches => {
 *   this.reducedMotion = matches;
 *   if (this.mapRef) this.mapRef.triggerRepaint();
 * });
 * this.reducedMotion = listener.initialValue;
 * this._motionListener = listener;
 *
 * // In onRemove():
 * this._motionListener?.dispose();
 */
export function createReducedMotionListener(
  onChange: (reducedMotion: boolean) => void,
): ReducedMotionListener {
  if (typeof window === 'undefined') {
    return { initialValue: false, dispose: () => undefined };
  }

  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = () => onChange(mql.matches);
  mql.addEventListener('change', handler);

  return {
    initialValue: mql.matches,
    dispose: () => mql.removeEventListener('change', handler),
  };
}
