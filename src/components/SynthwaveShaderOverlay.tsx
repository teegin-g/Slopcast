/**
 * SynthwaveShaderOverlay – WebGL2 CRT post-processing pass.
 *
 * Renders a full-viewport fragment shader composited ON TOP of the existing
 * Synthwave SVG background. Implements:
 *   - Horizontal scanlines (animated downward scroll)
 *   - Chromatic aberration (RGB channel split)
 *   - Barrel distortion (screen edge curvature)
 *   - Phosphor glow bloom (bright-pixel Gaussian blur)
 *   - Vignette (smoothstep edge falloff)
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

// ── Fragment shader (CRT post-processing) ────────────────────────────────────
const FRAG_SOURCE = `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

// Barrel distortion
vec2 barrelDistort(vec2 uv) {
  vec2 centered = uv - 0.5;
  float r2 = dot(centered, centered);
  float k1 = 0.015;
  float k2 = 0.005;
  float distortion = 1.0 + k1 * r2 + k2 * r2 * r2;
  return centered * distortion + 0.5;
}

// Scanlines: dark bands at every other pixel row, scrolling downward
float scanline(vec2 uv, float time) {
  float scanY = uv.y * u_resolution.y;
  float scroll = time * 0.3 * u_resolution.y * 0.02;
  float line = sin((scanY + scroll) * 3.14159265) * 0.5 + 0.5;
  return 1.0 - line * 0.12;
}

// Simple 5-tap horizontal Gaussian for bloom
float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  // Apply barrel distortion
  vec2 uv = barrelDistort(v_uv);

  // Out-of-bounds after distortion: render black
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Chromatic aberration: offset R and B channels on X axis
  float caOffset = 1.5 / u_resolution.x;
  float r = 0.0;
  float g = 0.0;
  float b = 0.0;

  // We don't have the underlying scene as a texture — this is a pure
  // overlay effect. We generate a synthetic CRT color field from UV coords.
  // Red channel samples shifted right, blue shifted left.
  vec2 uvR = uv + vec2(caOffset, 0.0);
  vec2 uvB = uv - vec2(caOffset, 0.0);

  // Base color: dark transparent with subtle color noise
  float noiseR = fract(sin(dot(uvR * u_resolution, vec2(12.9898, 78.233)) + u_time * 0.1) * 43758.5453);
  float noiseG = fract(sin(dot(uv * u_resolution, vec2(12.9898, 78.233)) + u_time * 0.1) * 43758.5453);
  float noiseB = fract(sin(dot(uvB * u_resolution, vec2(12.9898, 78.233)) + u_time * 0.1) * 43758.5453);

  r = noiseR * 0.02;
  g = noiseG * 0.015;
  b = noiseB * 0.025;

  // Phosphor glow: simulate sub-pixel RGB structure
  float pixelX = uv.x * u_resolution.x;
  float subpixel = mod(pixelX, 3.0);
  if (subpixel < 1.0) r += 0.012;
  else if (subpixel < 2.0) g += 0.008;
  else b += 0.015;

  // Phosphor bloom: bright areas get a soft glow
  float lum = luminance(vec3(r, g, b));
  float bloomThreshold = 0.6;
  float bloom = max(0.0, lum - bloomThreshold) * 0.5;
  // 5-tap Gaussian approximation
  float texelW = 1.0 / u_resolution.x;
  float texelH = 1.0 / u_resolution.y;
  float weights[5];
  weights[0] = 0.0625;
  weights[1] = 0.25;
  weights[2] = 0.375;
  weights[3] = 0.25;
  weights[4] = 0.0625;

  float bloomAccum = 0.0;
  for (int i = -2; i <= 2; i++) {
    vec2 offset = vec2(float(i) * texelW * 2.0, 0.0);
    vec2 sampleUV = uv + offset;
    float sNoise = fract(sin(dot(sampleUV * u_resolution, vec2(12.9898, 78.233)) + u_time * 0.1) * 43758.5453);
    bloomAccum += sNoise * 0.02 * weights[i + 2];
  }
  bloom += bloomAccum * 0.3;

  vec3 color = vec3(r + bloom * 0.5, g + bloom * 0.3, b + bloom * 0.6);

  // Scanlines
  float sl = scanline(uv, u_time);
  color *= sl;

  // Vignette
  vec2 vigUV = uv - 0.5;
  float vigDist = length(vigUV);
  float vignette = smoothstep(0.4, 0.75, vigDist);
  color = mix(color, vec3(0.0), vignette * 0.6);

  // Final alpha — this is an overlay, so keep it translucent
  float alpha = 0.35 + bloom * 0.5 + (1.0 - sl) * 0.15;

  fragColor = vec4(color, alpha * 0.4);
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

  // Shaders can be detached after linking
  gl.detachShader(program, vert);
  gl.detachShader(program, frag);
  gl.deleteShader(vert);
  gl.deleteShader(frag);

  return program;
}

export default function SynthwaveShaderOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      // Static CSS fallback — the container div already has a subtle overlay style
      container.style.background =
        'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 2px)';
      return;
    }

    const program = createProgram(gl, VERT_SOURCE, FRAG_SOURCE);
    if (!program) return;

    gl.useProgram(program);

    // Fullscreen quad: two triangles covering clip space
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

    // Enable blending for overlay compositing
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Resize handling
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

    // Reduced motion
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
        // Render a single static frame
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
      // Clean up WebGL resources
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
