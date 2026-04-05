/**
 * Shared WebGL shader compilation utilities.
 * Used by both WebGL2 shader overlays and Mapbox custom WebGL layers.
 */

export function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  label?: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      `[${label ?? 'WebGL'}] Shader compile error (${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'}):`,
      gl.getShaderInfoLog(shader),
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string,
  label?: string,
): WebGLProgram | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc, label);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc, label);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`[${label ?? 'WebGL'}] Program link error:`, gl.getProgramInfoLog(program));
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

/** Link a program from pre-compiled shaders (used by Mapbox custom layers). */
export function linkProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
  label?: string,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(`[${label ?? 'WebGL'}] Program link error:`, gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}
