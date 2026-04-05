/**
 * MapWellPulseLayer — Custom WebGL layer for Mapbox GL that renders animated
 * sonar-ping pulse rings radiating from well positions. Each well emits
 * multiple staggered rings that expand and fade. Group-colored wells use
 * their group color; unassigned wells glow dim white.
 *
 * Implements Mapbox's CustomLayerInterface and manages its own shader
 * program, buffers, and instanced draw calls.
 */

// ── Mercator helpers ────────────────────────────────────────────────────
const DEG2RAD = Math.PI / 180;

function lngToMercatorX(lng: number): number {
  return (lng + 180) / 360;
}

function latToMercatorY(lat: number): number {
  const latRad = lat * DEG2RAD;
  return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
}

// ── Hex color → [r, g, b] 0-1 ──────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

// ── Shader sources ──────────────────────────────────────────────────────
const VERTEX_SOURCE = `
  precision highp float;

  // Per-vertex quad coords (-1..+1)
  attribute vec2 a_quadPos;

  // Per-instance data
  attribute vec2 a_mercatorPos;  // mercator x, y
  attribute vec3 a_color;        // rgb 0..1
  attribute float a_phase;       // time phase offset
  attribute float a_scale;       // size multiplier based on EUR

  uniform mat4 u_matrix;
  uniform float u_pulseRadius;   // base radius in mercator units

  varying vec2 v_uv;
  varying vec3 v_color;
  varying float v_phase;

  void main() {
    v_uv = a_quadPos * 0.5 + 0.5;  // 0..1
    v_color = a_color;
    v_phase = a_phase;

    float r = u_pulseRadius * a_scale;
    vec2 offset = a_quadPos * r;
    vec4 worldPos = u_matrix * vec4(a_mercatorPos + offset, 0.0, 1.0);
    gl_Position = worldPos;
  }
`;

const FRAGMENT_SOURCE = `
  precision highp float;

  uniform float u_time;
  uniform float u_reducedMotion; // 1.0 = reduced motion, show static circles

  varying vec2 v_uv;
  varying vec3 v_color;
  varying float v_phase;

  void main() {
    float dist = length(v_uv - vec2(0.5)) * 2.0; // 0 at center, 1 at edge

    if (u_reducedMotion > 0.5) {
      // Static concentric ring at fixed radius
      float ring = 0.6;
      float ringWidth = 0.06;
      float alpha = smoothstep(ring - ringWidth, ring, dist)
                   * (1.0 - smoothstep(ring, ring + ringWidth, dist));
      alpha *= 0.4;
      if (alpha < 0.01) discard;
      gl_FragColor = vec4(v_color, alpha);
      return;
    }

    // Animated multi-ring sonar ping
    float speed = 1.8;
    float numRings = 3.0;
    float totalAlpha = 0.0;

    for (float i = 0.0; i < 3.0; i++) {
      float ringPhase = v_phase + i * (6.2832 / numRings);
      float t = fract((u_time * speed + ringPhase) / 6.2832);
      float ringRadius = t; // 0..1 expanding outward

      float ringWidth = 0.04 + t * 0.02; // slightly thicker as it expands
      float ringAlpha = smoothstep(ringRadius - ringWidth, ringRadius, dist)
                      * (1.0 - smoothstep(ringRadius, ringRadius + ringWidth, dist));

      // Fade out as ring expands
      ringAlpha *= 1.0 - t;
      totalAlpha += ringAlpha;
    }

    totalAlpha = min(totalAlpha, 0.7);
    if (totalAlpha < 0.01) discard;
    gl_FragColor = vec4(v_color * totalAlpha, totalAlpha);
  }
`;

// ── Shader compilation helpers ──────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[MapWellPulseLayer] Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[MapWellPulseLayer] Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// ── Well data fed to the layer ──────────────────────────────────────────
export interface PulseWellData {
  lng: number;
  lat: number;
  color: string;    // hex, e.g. '#3b82f6'
  /** 0..1 phase offset for stagger */
  phase: number;
  /** Scale multiplier (1.0 = default, >1 for higher EUR) */
  scale: number;
}

// ── Custom layer class ──────────────────────────────────────────────────
export class MapWellPulseLayer {
  readonly id = 'well-pulse-layer';
  readonly type = 'custom' as const;
  readonly renderingMode = '2d' as const;

  private program: WebGLProgram | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private instanceBuffer: WebGLBuffer | null = null;
  private instanceCount = 0;
  private startTime = 0;
  private ext: ANGLE_instanced_arrays | null = null;
  private mapRef: mapboxgl.Map | null = null;
  private reducedMotion = false;

  // Attribute locations
  private aQuadPos = -1;
  private aMercatorPos = -1;
  private aColor = -1;
  private aPhase = -1;
  private aScale = -1;

  // Uniform locations
  private uMatrix: WebGLUniformLocation | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private uPulseRadius: WebGLUniformLocation | null = null;
  private uReducedMotion: WebGLUniformLocation | null = null;

  // External well data (set before adding layer, or updated via setWells)
  private wells: PulseWellData[] = [];
  private dirty = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /** Update well positions/colors. Call this whenever groups or wells change. */
  setWells(wells: PulseWellData[]): void {
    this.wells = wells;
    this.dirty = true;
    // Trigger repaint
    if (this.mapRef) {
      this.mapRef.triggerRepaint();
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────
  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext): void {
    this.mapRef = map;
    this.startTime = performance.now();

    // Compile shaders
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    if (!vs || !fs) {
      console.warn('[MapWellPulseLayer] Shader compilation failed — layer disabled');
      return;
    }

    this.program = createProgram(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!this.program) return;

    // Attribute locations
    this.aQuadPos = gl.getAttribLocation(this.program, 'a_quadPos');
    this.aMercatorPos = gl.getAttribLocation(this.program, 'a_mercatorPos');
    this.aColor = gl.getAttribLocation(this.program, 'a_color');
    this.aPhase = gl.getAttribLocation(this.program, 'a_phase');
    this.aScale = gl.getAttribLocation(this.program, 'a_scale');

    // Uniform locations
    this.uMatrix = gl.getUniformLocation(this.program, 'u_matrix');
    this.uTime = gl.getUniformLocation(this.program, 'u_time');
    this.uPulseRadius = gl.getUniformLocation(this.program, 'u_pulseRadius');
    this.uReducedMotion = gl.getUniformLocation(this.program, 'u_reducedMotion');

    // Instanced arrays extension
    this.ext = gl.getExtension('ANGLE_instanced_arrays');

    // Quad geometry: two triangles covering -1..+1
    const quadVerts = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    // Instance buffer (will be populated in render when dirty)
    this.instanceBuffer = gl.createBuffer();
  }

  render(gl: WebGLRenderingContext, matrix: number[]): void {
    if (!this.program) return;

    // ── Save Mapbox WebGL state ──────────────────────────────────────
    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevBlendSrcRgb = gl.getParameter(gl.BLEND_SRC_RGB);
    const prevBlendDstRgb = gl.getParameter(gl.BLEND_DST_RGB);
    const prevBlendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
    const prevBlendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);
    const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const prevCullFace = gl.isEnabled(gl.CULL_FACE);

    // Track which vertex attrib arrays we enable so we can disable them
    const enabledAttribs: number[] = [];

    try {
      // ── Upload instance data if dirty ────────────────────────────
      if (this.dirty) {
        this.uploadInstanceData(gl);
        this.dirty = false;
      }

      if (this.instanceCount === 0) return;

      // ── Configure GL state ───────────────────────────────────────
      gl.useProgram(this.program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blend for glow
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      // ── Uniforms ─────────────────────────────────────────────────
      gl.uniformMatrix4fv(this.uMatrix, false, matrix);
      const elapsed = (performance.now() - this.startTime) / 1000;
      gl.uniform1f(this.uTime, elapsed);
      // Base radius in mercator units — roughly 200m at equator
      gl.uniform1f(this.uPulseRadius, 0.00015);
      gl.uniform1f(this.uReducedMotion, this.reducedMotion ? 1.0 : 0.0);

      // ── Bind quad geometry ───────────────────────────────────────
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
      gl.enableVertexAttribArray(this.aQuadPos);
      enabledAttribs.push(this.aQuadPos);
      gl.vertexAttribPointer(this.aQuadPos, 2, gl.FLOAT, false, 0, 0);

      // ── Bind instance data ───────────────────────────────────────
      // Layout per instance: [mercX, mercY, r, g, b, phase, scale] = 7 floats
      const stride = 7 * 4; // 28 bytes
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);

      if (this.ext) {
        // Instanced rendering path
        gl.enableVertexAttribArray(this.aMercatorPos);
        enabledAttribs.push(this.aMercatorPos);
        gl.vertexAttribPointer(this.aMercatorPos, 2, gl.FLOAT, false, stride, 0);
        this.ext.vertexAttribDivisorANGLE(this.aMercatorPos, 1);

        gl.enableVertexAttribArray(this.aColor);
        enabledAttribs.push(this.aColor);
        gl.vertexAttribPointer(this.aColor, 3, gl.FLOAT, false, stride, 8);
        this.ext.vertexAttribDivisorANGLE(this.aColor, 1);

        gl.enableVertexAttribArray(this.aPhase);
        enabledAttribs.push(this.aPhase);
        gl.vertexAttribPointer(this.aPhase, 1, gl.FLOAT, false, stride, 20);
        this.ext.vertexAttribDivisorANGLE(this.aPhase, 1);

        gl.enableVertexAttribArray(this.aScale);
        enabledAttribs.push(this.aScale);
        gl.vertexAttribPointer(this.aScale, 1, gl.FLOAT, false, stride, 24);
        this.ext.vertexAttribDivisorANGLE(this.aScale, 1);

        // Draw 6 vertices (quad) * N instances
        this.ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, this.instanceCount);

        // Reset divisors
        this.ext.vertexAttribDivisorANGLE(this.aMercatorPos, 0);
        this.ext.vertexAttribDivisorANGLE(this.aColor, 0);
        this.ext.vertexAttribDivisorANGLE(this.aPhase, 0);
        this.ext.vertexAttribDivisorANGLE(this.aScale, 0);
      } else {
        // Fallback: draw each well separately
        for (let i = 0; i < this.instanceCount; i++) {
          const offset = i * stride;
          gl.vertexAttrib2f(this.aMercatorPos, 0, 0); // will override below
          gl.vertexAttrib3f(this.aColor, 0, 0, 0);
          gl.vertexAttrib1f(this.aPhase, 0);
          gl.vertexAttrib1f(this.aScale, 1);

          // Read from the buffer — we need to re-upload per-instance uniforms
          // For the fallback path, just use the pre-built array
          const well = this.wells[i];
          if (!well) continue;
          const mx = lngToMercatorX(well.lng);
          const my = latToMercatorY(well.lat);
          const [r, g, b] = hexToRgb(well.color);
          gl.vertexAttrib2f(this.aMercatorPos, mx, my);
          gl.vertexAttrib3f(this.aColor, r, g, b);
          gl.vertexAttrib1f(this.aPhase, well.phase);
          gl.vertexAttrib1f(this.aScale, well.scale);

          gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
          gl.vertexAttribPointer(this.aQuadPos, 2, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }

      // Request continuous repaint for animation (unless reduced motion)
      if (!this.reducedMotion && this.mapRef) {
        this.mapRef.triggerRepaint();
      }
    } finally {
      // ── Restore Mapbox WebGL state ─────────────────────────────────
      for (const attr of enabledAttribs) {
        gl.disableVertexAttribArray(attr);
      }
      gl.useProgram(prevProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, prevArrayBuffer);
      if (prevBlend) {
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(prevBlendSrcRgb, prevBlendDstRgb, prevBlendSrcAlpha, prevBlendDstAlpha);
      } else {
        gl.disable(gl.BLEND);
      }
      if (prevDepthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
      if (prevCullFace) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
    }
  }

  onRemove(_map: mapboxgl.Map, gl: WebGLRenderingContext): void {
    if (this.program) gl.deleteProgram(this.program);
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
    if (this.instanceBuffer) gl.deleteBuffer(this.instanceBuffer);
    this.program = null;
    this.quadBuffer = null;
    this.instanceBuffer = null;
    this.mapRef = null;
  }

  // ── Internal: pack well data into Float32Array ────────────────────
  private uploadInstanceData(gl: WebGLRenderingContext): void {
    const wells = this.wells;
    this.instanceCount = wells.length;
    if (wells.length === 0) return;

    // 7 floats per well: mercX, mercY, r, g, b, phase, scale
    const data = new Float32Array(wells.length * 7);
    for (let i = 0; i < wells.length; i++) {
      const w = wells[i];
      const off = i * 7;
      data[off] = lngToMercatorX(w.lng);
      data[off + 1] = latToMercatorY(w.lat);
      const [r, g, b] = hexToRgb(w.color);
      data[off + 2] = r;
      data[off + 3] = g;
      data[off + 4] = b;
      data[off + 5] = w.phase;
      data[off + 6] = w.scale;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  }
}
