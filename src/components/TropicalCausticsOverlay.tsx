/**
 * TropicalCausticsOverlay – WebGL2 water caustics simulation.
 *
 * Renders a full-viewport fragment shader composited ON TOP of the existing
 * Tropical canvas background. Simulates the animated rippling light patterns
 * seen on a seafloor through shallow water:
 *   - Domain-warped fBm noise (two octaves, mutually warped)
 *   - Voronoi cells with caustic rings at edges
 *   - Teal/cyan coloring matching --cyan theme token
 *   - Flowing animation (noise-advected, non-looping)
 *
 * Raw WebGL2 — no Three.js or external dependencies.
 * Falls back to a static CSS overlay if WebGL2 is unavailable.
 */
import { useEffect, useRef } from 'react';

// ── Vertex shader (fullscreen quad) ──────────────────────────────────────────
const VERT_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// ── Fragment shader (water caustics) ─────────────────────────────────────────
const FRAG_SOURCE = `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

// Hash function for pseudo-random values
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// 2D gradient noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Fractional Brownian motion (2 octaves)
float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 2; i++) {
    val += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

// Voronoi distance (returns distance to nearest cell edge)
float voronoi(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);

  float md = 8.0;
  float md2 = 8.0;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g) * 0.5 + 0.5;
      // Animate cell seeds with noise displacement
      o += 0.3 * sin(u_time * 0.4 + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md) {
        md2 = md;
        md = d;
      } else if (d < md2) {
        md2 = d;
      }
    }
  }

  // Edge distance: difference between second-nearest and nearest
  return md2 - md;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 4.0;

  float time = u_time * 0.3;

  // Domain warping: warp p using fBm of p, then fBm of warped p
  vec2 warp1 = vec2(
    fbm(p + vec2(time * 0.7, time * 0.3)),
    fbm(p + vec2(time * -0.4, time * 0.6))
  );
  vec2 warp2 = vec2(
    fbm(p + warp1 * 1.5 + vec2(1.7, 9.2)),
    fbm(p + warp1 * 1.5 + vec2(8.3, 2.8))
  );

  // Combine warped noise fields
  float n = fbm(p + warp2 * 0.8);

  // Voronoi caustic cells (animated, displaced by noise)
  vec2 voronoiP = p * 0.8 + warp1 * 0.5 + vec2(time * 0.2, time * 0.15);
  float v = voronoi(voronoiP);

  // Caustic ring intensity: bright at cell edges
  float caustic = smoothstep(0.0, 0.3, v) * smoothstep(0.8, 0.3, v);
  caustic = pow(caustic, 0.8);

  // Combine noise and Voronoi for final caustic pattern
  float pattern = caustic * 0.7 + (n * 0.5 + 0.5) * 0.3;
  pattern = smoothstep(0.15, 0.65, pattern);

  // Color: teal/cyan matching --cyan theme token
  // rgba(0, 200, 255, 0.25) range
  vec3 teal = vec3(0.0, 0.78, 1.0);
  vec3 deepTeal = vec3(0.0, 0.55, 0.75);
  vec3 color = mix(deepTeal, teal, pattern);

  // Alpha: subtle overlay, brighter at caustic peaks
  float alpha = pattern * 0.18 + 0.02;

  // Fade at screen edges for seamless compositing
  float edgeFade = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x)
                 * smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
  alpha *= edgeFade;

  fragColor = vec4(color * alpha, alpha);
}`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      `Shader compile error (${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'}):`,
      gl.getShaderInfoLog(shader),
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
): WebGLProgram | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.detachShader(program, vert);
  gl.detachShader(program, frag);
  gl.deleteShader(vert);
  gl.deleteShader(frag);

  return program;
}

export default function TropicalCausticsOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      // Static CSS fallback: subtle teal wash
      container.style.background =
        'radial-gradient(ellipse at 50% 60%, rgba(0, 200, 255, 0.04) 0%, transparent 70%)';
      return;
    }

    const program = createProgram(gl, VERT_SOURCE, FRAG_SOURCE);
    if (!program) return;

    gl.useProgram(program);

    // Fullscreen quad
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionQuery?.matches ?? false;

    let animId = 0;
    const startTime = performance.now();

    function render() {
      const elapsed = (performance.now() - startTime) / 1000;
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(timeLoc, elapsed);
      gl!.uniform2f(resLoc, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);

      if (!reduceMotion) {
        animId = requestAnimationFrame(render);
      }
    }

    function handleMotionChange() {
      reduceMotion = motionQuery?.matches ?? false;
      cancelAnimationFrame(animId);
      if (reduceMotion) {
        render();
      } else {
        animId = requestAnimationFrame(render);
      }
    }

    if (motionQuery) {
      motionQuery.addEventListener('change', handleMotionChange);
    }

    if (reduceMotion) {
      render();
    } else {
      animId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (motionQuery) {
        motionQuery.removeEventListener('change', handleMotionChange);
      }
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
