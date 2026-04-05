/**
 * MapSelectionTrail — Custom WebGL layer for Mapbox GL that renders a
 * particle trail following the lasso selection cursor. Particles fade
 * and shrink over their lifetime, creating a glowing trail effect.
 *
 * On selection complete, an optional flash burst radiates from the
 * centroid of the selected wells.
 *
 * Implements Mapbox's CustomLayerInterface. Uses GL_POINTS with a
 * radial gradient fragment shader.
 */

// ── Mercator helpers (duplicated from MapWellPulseLayer to keep modules self-contained)
const DEG2RAD = Math.PI / 180;

function lngToMercatorX(lng: number): number {
  return (lng + 180) / 360;
}

function latToMercatorY(lat: number): number {
  const latRad = lat * DEG2RAD;
  return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
}

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

  attribute vec2 a_position;   // mercator x, y
  attribute float a_age;       // 0..1 normalized age (0=new, 1=expired)
  attribute float a_isFlash;   // 1.0 = flash particle, 0.0 = trail particle

  uniform mat4 u_matrix;
  uniform float u_pointSize;

  varying float v_age;
  varying float v_isFlash;

  void main() {
    v_age = a_age;
    v_isFlash = a_isFlash;

    vec4 pos = u_matrix * vec4(a_position, 0.0, 1.0);
    gl_Position = pos;

    // Trail particles shrink as they age; flash particles start big and shrink fast
    if (a_isFlash > 0.5) {
      gl_PointSize = u_pointSize * 3.0 * (1.0 - a_age);
    } else {
      gl_PointSize = u_pointSize * (1.0 - a_age * 0.6);
    }
  }
`;

const FRAGMENT_SOURCE = `
  precision highp float;

  uniform vec3 u_color;

  varying float v_age;
  varying float v_isFlash;

  void main() {
    // Radial gradient: soft circle with falloff
    float dist = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (dist > 1.0) discard;

    float alpha;
    if (v_isFlash > 0.5) {
      // Flash: ring that expands and fades
      float ring = smoothstep(0.3, 0.5, dist) * (1.0 - smoothstep(0.7, 1.0, dist));
      alpha = ring * (1.0 - v_age) * 0.8;
    } else {
      // Trail: soft radial glow fading with age
      float glow = 1.0 - dist;
      alpha = glow * (1.0 - v_age) * 0.6;
    }

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(u_color * alpha, alpha);
  }
`;

// ── Shader helpers ──────────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[MapSelectionTrail] Shader compile error:', gl.getShaderInfoLog(shader));
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
    console.error('[MapSelectionTrail] Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// ── Particle data ───────────────────────────────────────────────────────
interface Particle {
  mercX: number;
  mercY: number;
  birthTime: number; // performance.now() ms
  isFlash: boolean;
}

const TRAIL_LIFETIME_MS = 400;
const FLASH_LIFETIME_MS = 600;
const MAX_PARTICLES = 2000;

// ── Custom layer class ──────────────────────────────────────────────────
export class MapSelectionTrail {
  readonly id = 'selection-trail-layer';
  readonly type = 'custom' as const;
  readonly renderingMode = '2d' as const;

  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private mapRef: mapboxgl.Map | null = null;

  // Attribute locations
  private aPosition = -1;
  private aAge = -1;
  private aIsFlash = -1;

  // Uniform locations
  private uMatrix: WebGLUniformLocation | null = null;
  private uColor: WebGLUniformLocation | null = null;
  private uPointSize: WebGLUniformLocation | null = null;

  // Particle pool
  private particles: Particle[] = [];
  private color: [number, number, number] = [0, 0.9, 1]; // default cyan
  private reducedMotion = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /** Set trail color (hex string). */
  setColor(hex: string): void {
    this.color = hexToRgb(hex);
  }

  /**
   * Add a trail point from lasso drawing. Expects pixel coordinates
   * from the map canvas plus the map instance to unproject.
   */
  addTrailPoint(map: mapboxgl.Map, canvasX: number, canvasY: number): void {
    if (this.reducedMotion) return;
    const lngLat = map.unproject([canvasX, canvasY]);
    this.particles.push({
      mercX: lngToMercatorX(lngLat.lng),
      mercY: latToMercatorY(lngLat.lat),
      birthTime: performance.now(),
      isFlash: false,
    });
    // Cap particle count
    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    }
    this.mapRef?.triggerRepaint();
  }

  /**
   * Trigger a selection-complete flash at the centroid of the given well
   * positions (lng/lat arrays).
   */
  flashAtCentroid(lngs: number[], lats: number[]): void {
    if (this.reducedMotion || lngs.length === 0) return;
    const avgLng = lngs.reduce((s, v) => s + v, 0) / lngs.length;
    const avgLat = lats.reduce((s, v) => s + v, 0) / lats.length;
    const now = performance.now();
    // Emit a ring of flash particles
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spread = 0.00005; // tiny spread in mercator
      this.particles.push({
        mercX: lngToMercatorX(avgLng) + Math.cos(angle) * spread,
        mercY: latToMercatorY(avgLat) + Math.sin(angle) * spread,
        birthTime: now,
        isFlash: true,
      });
    }
    this.mapRef?.triggerRepaint();
  }

  /** Clear all particles immediately. */
  clear(): void {
    this.particles.length = 0;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────
  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext): void {
    this.mapRef = map;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    if (!vs || !fs) {
      console.warn('[MapSelectionTrail] Shader compilation failed — layer disabled');
      return;
    }

    this.program = createProgram(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!this.program) return;

    this.aPosition = gl.getAttribLocation(this.program, 'a_position');
    this.aAge = gl.getAttribLocation(this.program, 'a_age');
    this.aIsFlash = gl.getAttribLocation(this.program, 'a_isFlash');

    this.uMatrix = gl.getUniformLocation(this.program, 'u_matrix');
    this.uColor = gl.getUniformLocation(this.program, 'u_color');
    this.uPointSize = gl.getUniformLocation(this.program, 'u_pointSize');

    this.buffer = gl.createBuffer();
  }

  render(gl: WebGLRenderingContext, matrix: number[]): void {
    if (!this.program || this.particles.length === 0) return;

    // ── Expire old particles ─────────────────────────────────────────
    const now = performance.now();
    this.particles = this.particles.filter(p => {
      const lifetime = p.isFlash ? FLASH_LIFETIME_MS : TRAIL_LIFETIME_MS;
      return (now - p.birthTime) < lifetime;
    });

    if (this.particles.length === 0) return;

    // ── Save Mapbox WebGL state ──────────────────────────────────────
    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevBlendSrcRgb = gl.getParameter(gl.BLEND_SRC_RGB);
    const prevBlendDstRgb = gl.getParameter(gl.BLEND_DST_RGB);
    const prevBlendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
    const prevBlendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);
    const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);

    const enabledAttribs: number[] = [];

    try {
      // ── Build vertex data ──────────────────────────────────────────
      // 4 floats per particle: mercX, mercY, age, isFlash
      const data = new Float32Array(this.particles.length * 4);
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const lifetime = p.isFlash ? FLASH_LIFETIME_MS : TRAIL_LIFETIME_MS;
        const age = Math.min((now - p.birthTime) / lifetime, 1.0);
        const off = i * 4;
        data[off] = p.mercX;
        data[off + 1] = p.mercY;
        data[off + 2] = age;
        data[off + 3] = p.isFlash ? 1.0 : 0.0;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

      // ── Configure GL state ─────────────────────────────────────────
      gl.useProgram(this.program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive for glow
      gl.disable(gl.DEPTH_TEST);

      // ── Uniforms ───────────────────────────────────────────────────
      gl.uniformMatrix4fv(this.uMatrix, false, matrix);
      gl.uniform3fv(this.uColor, this.color);
      gl.uniform1f(this.uPointSize, 12.0);

      // ── Attributes ─────────────────────────────────────────────────
      const stride = 4 * 4; // 16 bytes
      gl.enableVertexAttribArray(this.aPosition);
      enabledAttribs.push(this.aPosition);
      gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, stride, 0);

      gl.enableVertexAttribArray(this.aAge);
      enabledAttribs.push(this.aAge);
      gl.vertexAttribPointer(this.aAge, 1, gl.FLOAT, false, stride, 8);

      gl.enableVertexAttribArray(this.aIsFlash);
      enabledAttribs.push(this.aIsFlash);
      gl.vertexAttribPointer(this.aIsFlash, 1, gl.FLOAT, false, stride, 12);

      // ── Draw ───────────────────────────────────────────────────────
      gl.drawArrays(gl.POINTS, 0, this.particles.length);

      // Keep animating if particles are alive
      if (this.particles.length > 0 && this.mapRef) {
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
    }
  }

  onRemove(_map: mapboxgl.Map, gl: WebGLRenderingContext): void {
    if (this.program) gl.deleteProgram(this.program);
    if (this.buffer) gl.deleteBuffer(this.buffer);
    this.program = null;
    this.buffer = null;
    this.mapRef = null;
    this.particles.length = 0;
  }
}
