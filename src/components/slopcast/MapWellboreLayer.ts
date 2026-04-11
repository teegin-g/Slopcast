/**
 * MapWellboreLayer — Custom WebGL layer for Mapbox GL that renders 3D
 * wellbore paths descending below the map surface. Each wellbore is
 * drawn as a polyline following the full directional survey path, with
 * depth-based color fading and glow at the surface.
 *
 * Implements Mapbox's CustomLayerInterface with renderingMode='3d' to
 * enable depth testing against Mapbox terrain. Manages its own shader
 * program, buffers, and GL state.
 */

import {
  lngToMercatorX,
  latToMercatorY,
  depthFtToMercatorZ,
  hexToRgb,
} from '../../utils/mapUtils';
import { compileShader, linkProgram } from '../../utils/webglUtils';

// ── Shader sources ──────────────────────────────────────────────────────
const VERTEX_SOURCE = `
  precision highp float;

  attribute vec3 a_position;   // mercX, mercY, mercZ
  attribute vec4 a_color;      // rgba
  attribute float a_depthNorm; // 0=surface, 1=deepest

  uniform mat4 u_matrix;      // Mapbox's projection-view matrix

  varying vec4 v_color;
  varying float v_depth;

  void main() {
    v_color = a_color;
    v_depth = a_depthNorm;
    gl_Position = u_matrix * vec4(a_position, 1.0);
  }
`;

const FRAGMENT_SOURCE = `
  precision highp float;

  uniform float u_reducedMotion; // 1.0 = reduced motion, no glow

  varying vec4 v_color;
  varying float v_depth;

  void main() {
    // Gentle depth gradient: laterals stay bright, only the vertical
    // kick section fades slightly. v_depth 0=surface, 1=deepest.
    float depthFade = 1.0 - v_depth * 0.25;
    vec3 color = v_color.rgb * depthFade;

    // Surface glow: bright spot where wellbore meets the surface
    float glow = (1.0 - v_depth) * 0.12 * (1.0 - u_reducedMotion);
    gl_FragColor = vec4(color + glow, v_color.a * max(depthFade, 0.5));
  }
`;

// ── Depth mapping ───────────────────────────────────────────────────────
// Instead of linearly exaggerating absolute depth (which buries laterals
// far below the surface), we compress the vertical section and expand
// bench separation near the landing zone. This keeps laterals visible
// as a thin subsurface layer while preserving ~200-500ft formation offsets.
//
// Strategy: map depth through a log-like curve that compresses the
// vertical section (0-7000ft) into a small Z range but preserves
// relative separation between benches (7000-9000ft range).

/** Base Z offset — how far below surface the shallowest lateral appears */
const LATERAL_Z_OFFSET = 3;

/** Bench separation multiplier — controls vertical spacing between formations.
 *  Higher = more visible separation between Wolfcamp A/B/Bone Spring.
 *  At 80, a 500ft bench separation ≈ 40,000ft of visual Z separation
 *  in mercator units, which is clearly visible when tilted. */
const BENCH_EXAGGERATION = 80;

/** Depth at which the landing zone begins (typical Permian KOP). Wells
 *  shallower than this get compressed; deeper wells get bench exaggeration. */
const LANDING_ZONE_FT = 6000;

/**
 * Map real depth to visual Z. Compresses the vertical section (surface to
 * landing zone) into a small offset, then exaggerates bench separation
 * for the lateral section.
 */
function mapDepthToVisualZ(depthFt: number, lat: number): number {
  const baseZ = depthFtToMercatorZ(1, lat); // 1-foot in mercator Z

  if (depthFt <= 0) return 0;

  if (depthFt < LANDING_ZONE_FT) {
    // Vertical section: compress into LATERAL_Z_OFFSET range using sqrt curve
    const t = depthFt / LANDING_ZONE_FT; // 0 to 1
    return baseZ * LATERAL_Z_OFFSET * Math.sqrt(t) * LANDING_ZONE_FT;
  }

  // Lateral section: base offset + exaggerated bench separation
  const baseOffset = baseZ * LATERAL_Z_OFFSET * LANDING_ZONE_FT;
  const benchDepth = depthFt - LANDING_ZONE_FT;
  return baseOffset + baseZ * benchDepth * BENCH_EXAGGERATION;
}

// ── Wellbore data fed to the layer ──────────────────────────────────────
export interface WellboreData {
  id: string;
  /** Full survey path — array of points from surface to TD */
  path: Array<{ lng: number; lat: number; depthFt: number }>;
  color: string; // hex group color
  selected: boolean;
}

// ── Custom layer class ──────────────────────────────────────────────────
export class MapWellboreLayer {
  readonly id = 'wellbore-3d-layer';
  readonly type = 'custom' as const;
  readonly renderingMode = '3d' as const;

  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private vertexCount = 0;
  private totalAllocatedVerts = 0;
  private mapRef: mapboxgl.Map | null = null;
  private reducedMotion = false;
  private _motionQuery: MediaQueryList | null = null;
  private _handleMotionChange: (() => void) | null = null;

  // Attribute locations
  private aPosition = -1;
  private aColor = -1;
  private aDepthNorm = -1;

  // Uniform locations
  private uMatrix: WebGLUniformLocation | null = null;
  private uReducedMotion: WebGLUniformLocation | null = null;

  // External wellbore data
  private wellbores: WellboreData[] = [];
  private dirty = true;

  // Incremental upload state
  private static readonly BATCH_SIZE = 100;
  private batchRafId: number | null = null;
  private batchQueue: WellboreData[][] | null = null;
  private batchByteOffset = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
    }
  }

  /** Update wellbore data. Call when groups or well trajectories change. */
  setWellbores(wellbores: WellboreData[]): void {
    // Cancel any in-progress batch sequence
    this.cancelBatch();
    this.wellbores = wellbores;
    this.dirty = true;
    if (this.mapRef) {
      this.mapRef.triggerRepaint();
    }
  }

  private cancelBatch(): void {
    if (this.batchRafId !== null) {
      cancelAnimationFrame(this.batchRafId);
      this.batchRafId = null;
    }
    this.batchQueue = null;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────
  onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext): void {
    this.mapRef = map;

    // Compile shaders
    const vs = compileShader(
      gl,
      gl.VERTEX_SHADER,
      VERTEX_SOURCE,
      'MapWellboreLayer',
    );
    const fs = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SOURCE,
      'MapWellboreLayer',
    );
    if (!vs || !fs) {
      console.warn(
        '[MapWellboreLayer] Shader compilation failed — layer disabled',
      );
      return;
    }

    this.program = linkProgram(gl, vs, fs, 'MapWellboreLayer');
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!this.program) return;

    // Attribute locations
    this.aPosition = gl.getAttribLocation(this.program, 'a_position');
    this.aColor = gl.getAttribLocation(this.program, 'a_color');
    this.aDepthNorm = gl.getAttribLocation(this.program, 'a_depthNorm');

    // Uniform locations
    this.uMatrix = gl.getUniformLocation(this.program, 'u_matrix');
    this.uReducedMotion = gl.getUniformLocation(
      this.program,
      'u_reducedMotion',
    );

    // Vertex buffer (populated in render when dirty)
    this.vertexBuffer = gl.createBuffer();

    // Listen for runtime reduced-motion changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => {
      this.reducedMotion = motionQuery.matches;
      if (this.mapRef) this.mapRef.triggerRepaint();
    };
    motionQuery.addEventListener('change', handleMotionChange);
    this._motionQuery = motionQuery;
    this._handleMotionChange = handleMotionChange;
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
      // ── Upload vertex data if dirty ────────────────────────────────
      if (this.dirty) {
        this.uploadVertexData(gl);
        this.dirty = false;
      }

      if (this.vertexCount === 0) return;

      // ── Configure GL state ─────────────────────────────────────────
      gl.useProgram(this.program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      // ── Uniforms ───────────────────────────────────────────────────
      gl.uniformMatrix4fv(this.uMatrix, false, matrix);
      gl.uniform1f(this.uReducedMotion, this.reducedMotion ? 1.0 : 0.0);

      // ── Bind vertex data ───────────────────────────────────────────
      // Layout per vertex: [mercX, mercY, mercZ, r, g, b, a, depthNorm] = 8 floats
      const stride = 8 * 4; // 32 bytes
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

      gl.enableVertexAttribArray(this.aPosition);
      enabledAttribs.push(this.aPosition);
      gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, stride, 0);

      gl.enableVertexAttribArray(this.aColor);
      enabledAttribs.push(this.aColor);
      gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, stride, 12);

      gl.enableVertexAttribArray(this.aDepthNorm);
      enabledAttribs.push(this.aDepthNorm);
      gl.vertexAttribPointer(
        this.aDepthNorm,
        1,
        gl.FLOAT,
        false,
        stride,
        28,
      );

      // ── Draw ───────────────────────────────────────────────────────
      gl.drawArrays(gl.LINES, 0, this.vertexCount);
    } finally {
      // ── Restore Mapbox WebGL state ─────────────────────────────────
      for (const attr of enabledAttribs) {
        gl.disableVertexAttribArray(attr);
      }
      gl.useProgram(prevProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, prevArrayBuffer);
      if (prevBlend) {
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(
          prevBlendSrcRgb,
          prevBlendDstRgb,
          prevBlendSrcAlpha,
          prevBlendDstAlpha,
        );
      } else {
        gl.disable(gl.BLEND);
      }
      if (prevDepthTest) gl.enable(gl.DEPTH_TEST);
      else gl.disable(gl.DEPTH_TEST);
      if (prevCullFace) gl.enable(gl.CULL_FACE);
      else gl.disable(gl.CULL_FACE);
    }
  }

  onRemove(_map: mapboxgl.Map, gl: WebGLRenderingContext): void {
    this.cancelBatch();
    if (this._motionQuery && this._handleMotionChange) {
      this._motionQuery.removeEventListener('change', this._handleMotionChange);
    }
    if (this.program) gl.deleteProgram(this.program);
    if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
    this.program = null;
    this.vertexBuffer = null;
    this.mapRef = null;
  }

  // ── Internal: pack vertex data for a batch of wellbores ─────────────
  private static readonly FLOATS_PER_VERTEX = 8;

  private packBatch(batch: WellboreData[]): Float32Array {
    const fpv = MapWellboreLayer.FLOATS_PER_VERTEX;
    let totalVerts = 0;
    for (const wb of batch) {
      if (wb.path.length >= 2) totalVerts += (wb.path.length - 1) * 2;
    }

    const data = new Float32Array(totalVerts * fpv);
    let off = 0;

    for (const wb of batch) {
      if (wb.path.length < 2) continue;
      const [r, g, b] = hexToRgb(wb.color);
      const alpha = wb.selected ? 1.0 : 0.6;
      const maxDepth = Math.max(...wb.path.map(p => p.depthFt), 1);

      for (let i = 0; i < wb.path.length - 1; i++) {
        const p0 = wb.path[i];
        const p1 = wb.path[i + 1];

        data[off++] = lngToMercatorX(p0.lng);
        data[off++] = latToMercatorY(p0.lat);
        data[off++] = mapDepthToVisualZ(p0.depthFt, p0.lat);
        data[off++] = r; data[off++] = g; data[off++] = b; data[off++] = alpha;
        data[off++] = p0.depthFt / maxDepth;

        data[off++] = lngToMercatorX(p1.lng);
        data[off++] = latToMercatorY(p1.lat);
        data[off++] = mapDepthToVisualZ(p1.depthFt, p1.lat);
        data[off++] = r; data[off++] = g; data[off++] = b; data[off++] = alpha;
        data[off++] = p1.depthFt / maxDepth;
      }
    }

    return data.subarray(0, off);
  }

  // ── Internal: build vertex data from survey paths ──────────────────
  private uploadVertexData(gl: WebGLRenderingContext): void {
    const wellbores = this.wellbores;
    if (wellbores.length === 0) {
      this.vertexCount = 0;
      this.totalAllocatedVerts = 0;
      return;
    }

    const fpv = MapWellboreLayer.FLOATS_PER_VERTEX;
    const batchSize = MapWellboreLayer.BATCH_SIZE;

    // Small dataset — upload in one pass (no rAF overhead)
    if (wellbores.length <= batchSize) {
      const data = this.packBatch(wellbores);
      this.vertexCount = data.length / fpv;
      this.totalAllocatedVerts = this.vertexCount;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      return;
    }

    // Large dataset — pre-allocate buffer, then batch upload via rAF
    let totalLineVerts = 0;
    for (const wb of wellbores) {
      if (wb.path.length >= 2) totalLineVerts += (wb.path.length - 1) * 2;
    }

    // Pre-allocate empty GPU buffer
    this.totalAllocatedVerts = totalLineVerts;
    this.vertexCount = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, totalLineVerts * fpv * 4, gl.DYNAMIC_DRAW);

    // Split into batches
    const batches: WellboreData[][] = [];
    for (let i = 0; i < wellbores.length; i += batchSize) {
      batches.push(wellbores.slice(i, i + batchSize));
    }

    this.batchQueue = batches;
    this.batchByteOffset = 0;
    this.scheduleBatchUpload(gl);
  }

  private scheduleBatchUpload(gl: WebGLRenderingContext): void {
    this.batchRafId = requestAnimationFrame(() => {
      this.batchRafId = null;
      if (!this.batchQueue || this.batchQueue.length === 0) {
        this.batchQueue = null;
        return;
      }

      const batch = this.batchQueue.shift()!;
      const data = this.packBatch(batch);
      const fpv = MapWellboreLayer.FLOATS_PER_VERTEX;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, this.batchByteOffset, data);

      this.batchByteOffset += data.byteLength;
      this.vertexCount += data.length / fpv;

      // Trigger repaint to render the partial buffer
      if (this.mapRef) this.mapRef.triggerRepaint();

      // Schedule next batch if more remain
      if (this.batchQueue.length > 0) {
        this.scheduleBatchUpload(gl);
      } else {
        this.batchQueue = null;
      }
    });
  }
}
