import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock WebGL utilities used by the layer
// ---------------------------------------------------------------------------

vi.mock('../../utils/mapUtils', () => ({
  lngToMercatorX: (lng: number) => lng,
  latToMercatorY: (lat: number) => lat,
  depthFtToMercatorZ: () => 0.00001,
  hexToRgb: () => [1, 0, 0] as [number, number, number],
}));

vi.mock('../../utils/webglUtils', () => ({
  compileShader: (_gl: any, _type: any, _src: any) => ({ __shader: true }),
  linkProgram: (_gl: any, _vs: any, _fs: any) => ({ __program: true }),
}));

import { MapWellboreLayer, type WellboreData } from './MapWellboreLayer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWellbore(id: string, pathLen = 5): WellboreData {
  const path = Array.from({ length: pathLen }, (_, i) => ({
    lng: -102.3 + i * 0.001,
    lat: 31.9,
    depthFt: i * 2000,
  }));
  return { id, path, color: '#ff0000', selected: false };
}

function createMockGL(): Record<string, any> {
  const bufferStore = new Map<number, ArrayBuffer>();
  return {
    ARRAY_BUFFER: 0x8892,
    FLOAT: 0x1406,
    DYNAMIC_DRAW: 0x88E8,
    LINES: 0x0001,
    BLEND: 0x0BE2,
    DEPTH_TEST: 0x0B71,
    CULL_FACE: 0x0B44,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    BLEND_SRC_RGB: 0x80C8,
    BLEND_DST_RGB: 0x80C9,
    BLEND_SRC_ALPHA: 0x80CA,
    BLEND_DST_ALPHA: 0x80CB,
    CURRENT_PROGRAM: 0x8B8D,
    ARRAY_BUFFER_BINDING: 0x8894,
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({ __uniform: true })),
    createBuffer: vi.fn(() => ({ __buffer: true })),
    bindBuffer: vi.fn(),
    bufferData: vi.fn((_target: number, dataOrSize: any, _usage: number) => {
      const size = typeof dataOrSize === 'number' ? dataOrSize : dataOrSize.byteLength;
      bufferStore.set(0x8892, new ArrayBuffer(size));
    }),
    bufferSubData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    disableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    useProgram: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    uniform1f: vi.fn(),
    drawArrays: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    blendFunc: vi.fn(),
    blendFuncSeparate: vi.fn(),
    isEnabled: vi.fn(() => false),
    getParameter: vi.fn(() => null),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteShader: vi.fn(),
  };
}

function createMockMap() {
  return {
    triggerRepaint: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MapWellboreLayer', () => {
  let rafCallbacks: Array<(time: number) => void>;
  let rafId: number;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      // Remove callback at index id-1 if it exists
      if (id > 0 && id <= rafCallbacks.length) {
        rafCallbacks[id - 1] = () => {}; // neutralize
      }
    });
    vi.stubGlobal('window', {
      ...window,
      matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Drain all queued rAF callbacks. */
  function flushRAF(maxIterations = 20) {
    let iters = 0;
    while (rafCallbacks.length > 0 && iters < maxIterations) {
      const cbs = [...rafCallbacks];
      rafCallbacks = [];
      for (const cb of cbs) cb(performance.now());
      iters++;
    }
  }

  it('has correct layer metadata', () => {
    const layer = new MapWellboreLayer();
    expect(layer.id).toBe('wellbore-3d-layer');
    expect(layer.type).toBe('custom');
    expect(layer.renderingMode).toBe('3d');
  });

  it('uploads small datasets in one pass (no rAF)', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);

    // 50 wellbores — under BATCH_SIZE of 100
    const wellbores = Array.from({ length: 50 }, (_, i) => makeWellbore(`w-${i}`, 3));
    layer.setWellbores(wellbores);

    // Render triggers uploadVertexData
    const matrix = new Array(16).fill(0);
    layer.render(gl as any, matrix);

    // Should use bufferData (single pass), not bufferSubData
    expect(gl.bufferData).toHaveBeenCalled();
    expect(gl.bufferSubData).not.toHaveBeenCalled();

    // drawArrays should be called with vertex count > 0
    expect(gl.drawArrays).toHaveBeenCalled();
    const vertCount = gl.drawArrays.mock.calls[0][2];
    expect(vertCount).toBeGreaterThan(0);
  });

  it('uses rAF batch upload for large datasets (> 100 wellbores)', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);

    // 250 wellbores — exceeds BATCH_SIZE of 100, triggers rAF path
    const wellbores = Array.from({ length: 250 }, (_, i) => makeWellbore(`w-${i}`, 3));
    layer.setWellbores(wellbores);

    // First render triggers uploadVertexData which pre-allocates and schedules rAF
    const matrix = new Array(16).fill(0);
    layer.render(gl as any, matrix);

    // bufferData called once for pre-allocation (with size, not data)
    expect(gl.bufferData).toHaveBeenCalledTimes(1);
    // The pre-allocation call should have a number (byte size), not a Float32Array
    const preAllocArg = gl.bufferData.mock.calls[0][1];
    expect(typeof preAllocArg).toBe('number');

    // rAF should have been scheduled
    expect(rafCallbacks.length).toBeGreaterThan(0);
  });

  it('incremental batches call bufferSubData and triggerRepaint', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);

    const wellbores = Array.from({ length: 250 }, (_, i) => makeWellbore(`w-${i}`, 3));
    layer.setWellbores(wellbores);

    const matrix = new Array(16).fill(0);
    layer.render(gl as any, matrix);

    // Flush one rAF frame
    expect(rafCallbacks.length).toBeGreaterThan(0);
    const cb = rafCallbacks.shift()!;
    cb(performance.now());

    // bufferSubData should have been called for the first batch
    expect(gl.bufferSubData).toHaveBeenCalled();
    // triggerRepaint should have been called
    expect(map.triggerRepaint).toHaveBeenCalled();
  });

  it('all batches eventually upload all vertex data', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);

    const wellbores = Array.from({ length: 250 }, (_, i) => makeWellbore(`w-${i}`, 3));
    layer.setWellbores(wellbores);

    const matrix = new Array(16).fill(0);
    layer.render(gl as any, matrix);

    // Flush all rAF frames
    flushRAF();

    // 250 wellbores / 100 per batch = 3 batches
    expect(gl.bufferSubData.mock.calls.length).toBe(3);

    // Each batch should upload at increasing byte offsets
    const offsets = gl.bufferSubData.mock.calls.map((c: any[]) => c[1]);
    for (let i = 1; i < offsets.length; i++) {
      expect(offsets[i]).toBeGreaterThan(offsets[i - 1]);
    }
  });

  it('cancels in-progress batch when setWellbores is called again', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);

    // Start a large upload
    const wellbores1 = Array.from({ length: 300 }, (_, i) => makeWellbore(`old-${i}`, 3));
    layer.setWellbores(wellbores1);

    const matrix = new Array(16).fill(0);
    layer.render(gl as any, matrix);

    // Flush just one batch (should be 3 total for 300 wellbores)
    const cb = rafCallbacks.shift()!;
    cb(performance.now());
    const subDataCallsAfterOneBatch = gl.bufferSubData.mock.calls.length;

    // Now set new wellbores — this should cancel remaining batches
    const wellbores2 = Array.from({ length: 50 }, (_, i) => makeWellbore(`new-${i}`, 3));
    layer.setWellbores(wellbores2);

    // Flush remaining rAF — old callbacks should be neutralized
    flushRAF();

    // Render again with new data — small dataset, single pass
    gl.bufferSubData.mockClear();
    gl.bufferData.mockClear();
    layer.render(gl as any, matrix);

    // New upload should be single-pass (bufferData, not bufferSubData)
    expect(gl.bufferData).toHaveBeenCalled();
  });

  it('packBatch produces correct vertex count for line segments', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);

    // 1 wellbore with 4 path points = 3 line segments = 6 vertices
    const wellbores = [makeWellbore('w-1', 4)];
    layer.setWellbores(wellbores);

    const matrix = new Array(16).fill(0);
    layer.render(gl as any, matrix);

    // drawArrays should draw 6 vertices (3 segments * 2 verts each)
    expect(gl.drawArrays).toHaveBeenCalled();
    const vertCount = gl.drawArrays.mock.calls[0][2];
    expect(vertCount).toBe(6);
  });

  it('skips wellbores with fewer than 2 path points', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);

    const wellbores = [
      makeWellbore('w-good', 3),  // 2 segments = 4 verts
      { id: 'w-empty', path: [], color: '#ff0000', selected: false },
      { id: 'w-single', path: [{ lng: -102, lat: 31, depthFt: 0 }], color: '#ff0000', selected: false },
    ];
    layer.setWellbores(wellbores);

    const matrix = new Array(16).fill(0);
    layer.render(gl as any, matrix);

    // Only w-good contributes vertices: 2 segments * 2 = 4
    const vertCount = gl.drawArrays.mock.calls[0][2];
    expect(vertCount).toBe(4);
  });

  it('onRemove cleans up GL resources', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);
    layer.onRemove(map as any, gl as any);

    expect(gl.deleteProgram).toHaveBeenCalled();
    expect(gl.deleteBuffer).toHaveBeenCalled();
  });

  it('empty wellbores array results in zero vertex count', () => {
    const layer = new MapWellboreLayer();
    const gl = createMockGL();
    const map = createMockMap();

    layer.onAdd(map as any, gl as any);
    layer.setWellbores([]);

    const matrix = new Array(16).fill(0);
    layer.render(gl as any, matrix);

    // drawArrays should NOT be called when vertexCount is 0
    expect(gl.drawArrays).not.toHaveBeenCalled();
  });
});
