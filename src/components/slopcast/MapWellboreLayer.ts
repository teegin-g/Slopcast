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
    // Depth gradient: bright at surface, dimmer at depth
    float depthFade = 1.0 - v_depth * 0.5;
    vec3 color = v_color.rgb * depthFade;

    // Slight glow at surface (suppressed in reduced-motion)
    float glow = (1.0 - v_depth) * 0.15 * (1.0 - u_reducedMotion);
    gl_FragColor = vec4(color + glow, v_color.a * max(depthFade, 0.3));
  }
`;

// ── Depth exaggeration factor ───────────────────────────────────────────
// Real depths (7000-8000ft) are tiny vs. horizontal extent (several km).
// This multiplier makes wellbores visible. Tunable.
const DEPTH_EXAGGERATION = 15;

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

  constructor() {
    if (typeof window !== 'undefined') {
      this.reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
    }
  }

  /** Update wellbore data. Call when groups or well trajectories change. */
  setWellbores(wellbores: WellboreData[]): void {
    this.wellbores = wellbores;
    this.dirty = true;
    if (this.mapRef) {
      this.mapRef.triggerRepaint();
    }
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
    if (this._motionQuery && this._handleMotionChange) {
      this._motionQuery.removeEventListener('change', this._handleMotionChange);
    }
    if (this.program) gl.deleteProgram(this.program);
    if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
    this.program = null;
    this.vertexBuffer = null;
    this.mapRef = null;
  }

  // ── Internal: build vertex data from survey paths ──────────────────
  private uploadVertexData(gl: WebGLRenderingContext): void {
    const wellbores = this.wellbores;
    if (wellbores.length === 0) {
      this.vertexCount = 0;
      return;
    }

    // Count total line vertices: each path with N points produces (N-1) segments,
    // each segment needs 2 vertices for gl.LINES.
    const floatsPerVertex = 8;
    let totalLineVerts = 0;
    for (const wb of wellbores) {
      if (wb.path.length >= 2) {
        totalLineVerts += (wb.path.length - 1) * 2;
      }
    }

    const data = new Float32Array(totalLineVerts * floatsPerVertex);
    let writeOffset = 0;

    for (const wb of wellbores) {
      if (wb.path.length < 2) continue;

      const [r, g, b] = hexToRgb(wb.color);
      const alpha = wb.selected ? 1.0 : 0.6;

      // Find max depth for normalization
      const maxDepth = Math.max(...wb.path.map(p => p.depthFt), 1);

      // Generate LINE pairs from consecutive path points
      for (let i = 0; i < wb.path.length - 1; i++) {
        const p0 = wb.path[i];
        const p1 = wb.path[i + 1];

        // Vertex for p0
        data[writeOffset++] = lngToMercatorX(p0.lng);
        data[writeOffset++] = latToMercatorY(p0.lat);
        data[writeOffset++] = depthFtToMercatorZ(p0.depthFt, p0.lat) * DEPTH_EXAGGERATION;
        data[writeOffset++] = r;
        data[writeOffset++] = g;
        data[writeOffset++] = b;
        data[writeOffset++] = alpha;
        data[writeOffset++] = p0.depthFt / maxDepth;

        // Vertex for p1
        data[writeOffset++] = lngToMercatorX(p1.lng);
        data[writeOffset++] = latToMercatorY(p1.lat);
        data[writeOffset++] = depthFtToMercatorZ(p1.depthFt, p1.lat) * DEPTH_EXAGGERATION;
        data[writeOffset++] = r;
        data[writeOffset++] = g;
        data[writeOffset++] = b;
        data[writeOffset++] = alpha;
        data[writeOffset++] = p1.depthFt / maxDepth;
      }
    }

    this.vertexCount = writeOffset / floatsPerVertex;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      data.subarray(0, writeOffset),
      gl.DYNAMIC_DRAW,
    );
  }
}
