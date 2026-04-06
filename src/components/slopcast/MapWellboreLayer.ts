/**
 * MapWellboreLayer — Custom WebGL layer for Mapbox GL that renders 3D
 * wellbore curves descending below the map surface. Each wellbore is
 * drawn as a smooth curve from surface hole through heel to toe, with
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
// This multiplier makes wellbores visible. Tune in WP-7 (polish).
const DEPTH_EXAGGERATION = 100;

// ── Points per wellbore curve segment ───────────────────────────────────
const CURVE_POINTS = 10;

// ── Wellbore data fed to the layer ──────────────────────────────────────
export interface WellboreData {
  id: string;
  surface: { lng: number; lat: number; depthFt: number };
  heel: { lng: number; lat: number; depthFt: number };
  toe: { lng: number; lat: number; depthFt: number };
  color: string; // hex group color
  selected: boolean;
}

// ── Curve interpolation ─────────────────────────────────────────────────
/**
 * Generate smooth curve points between three control points using
 * quadratic Bezier interpolation. Returns an array of [x, y, z] tuples.
 */
function generateCurvePoints(
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  numPoints: number,
): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const omt = 1 - t;
    // Quadratic Bezier: B(t) = (1-t)^2*P0 + 2*(1-t)*t*P1 + t^2*P2
    const x = omt * omt * p0[0] + 2 * omt * t * p1[0] + t * t * p2[0];
    const y = omt * omt * p0[1] + 2 * omt * t * p1[1] + t * t * p2[1];
    const z = omt * omt * p0[2] + 2 * omt * t * p1[2] + t * t * p2[2];
    points.push([x, y, z]);
  }
  return points;
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

  // ── Internal: build vertex data from wellbore curves ──────────────
  private uploadVertexData(gl: WebGLRenderingContext): void {
    const wellbores = this.wellbores;
    if (wellbores.length === 0) {
      this.vertexCount = 0;
      return;
    }

    // Each wellbore produces CURVE_POINTS*2 curve points (surface→heel + heel→toe).
    // For gl.LINES, each segment needs 2 vertices. N points = (N-1) segments = (N-1)*2 vertices.
    // Total curve points per wellbore = (CURVE_POINTS + 1) * 2, but shared heel point.
    // Actually: surface→heel has CURVE_POINTS+1 points, heel→toe has CURVE_POINTS+1 points.
    // Combined with shared heel: 2*CURVE_POINTS+1 unique points.
    // Segments = 2*CURVE_POINTS, line vertices = 2*CURVE_POINTS*2.
    const pointsPerWellbore = 2 * CURVE_POINTS + 1;
    const segmentsPerWellbore = pointsPerWellbore - 1;
    const lineVertsPerWellbore = segmentsPerWellbore * 2;

    // 8 floats per vertex
    const floatsPerVertex = 8;
    const totalFloats = wellbores.length * lineVertsPerWellbore * floatsPerVertex;
    const data = new Float32Array(totalFloats);

    let writeOffset = 0;

    for (const wb of wellbores) {
      const [r, g, b] = hexToRgb(wb.color);
      const alpha = wb.selected ? 1.0 : 0.6;

      // Find max depth across all three points for normalization
      const maxDepth = Math.max(
        wb.surface.depthFt,
        wb.heel.depthFt,
        wb.toe.depthFt,
        1, // avoid division by zero
      );

      // Convert control points to mercator coordinates
      const avgLat =
        (wb.surface.lat + wb.heel.lat + wb.toe.lat) / 3;

      const surfaceMerc: [number, number, number] = [
        lngToMercatorX(wb.surface.lng),
        latToMercatorY(wb.surface.lat),
        depthFtToMercatorZ(wb.surface.depthFt, avgLat) * DEPTH_EXAGGERATION,
      ];
      const heelMerc: [number, number, number] = [
        lngToMercatorX(wb.heel.lng),
        latToMercatorY(wb.heel.lat),
        depthFtToMercatorZ(wb.heel.depthFt, avgLat) * DEPTH_EXAGGERATION,
      ];
      const toeMerc: [number, number, number] = [
        lngToMercatorX(wb.toe.lng),
        latToMercatorY(wb.toe.lat),
        depthFtToMercatorZ(wb.toe.depthFt, avgLat) * DEPTH_EXAGGERATION,
      ];

      // Generate curve: surface → heel (vertical kick section)
      const upperCurve = generateCurvePoints(
        surfaceMerc,
        heelMerc,
        heelMerc,
        CURVE_POINTS,
      );

      // Generate curve: heel → toe (horizontal lateral section)
      const lowerCurve = generateCurvePoints(
        heelMerc,
        toeMerc,
        toeMerc,
        CURVE_POINTS,
      );

      // Combine into one polyline (skip duplicate heel point from lowerCurve)
      const allPoints = [...upperCurve, ...lowerCurve.slice(1)];

      // Write line segment pairs
      for (let i = 0; i < allPoints.length - 1; i++) {
        const pA = allPoints[i];
        const pB = allPoints[i + 1];

        // Normalized depth (0=surface, 1=deepest) based on position in curve
        const depthNormA = i / (allPoints.length - 1);
        const depthNormB = (i + 1) / (allPoints.length - 1);

        // Vertex A
        data[writeOffset++] = pA[0]; // mercX
        data[writeOffset++] = pA[1]; // mercY
        data[writeOffset++] = pA[2]; // mercZ
        data[writeOffset++] = r;
        data[writeOffset++] = g;
        data[writeOffset++] = b;
        data[writeOffset++] = alpha;
        data[writeOffset++] = depthNormA;

        // Vertex B
        data[writeOffset++] = pB[0];
        data[writeOffset++] = pB[1];
        data[writeOffset++] = pB[2];
        data[writeOffset++] = r;
        data[writeOffset++] = g;
        data[writeOffset++] = b;
        data[writeOffset++] = alpha;
        data[writeOffset++] = depthNormB;
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
