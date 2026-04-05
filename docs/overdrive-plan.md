# ⚡ Overdrive Plan — Three Technical Enhancements

> **Goal**: Push the Slopcast interface past conventional web limits.
> All three directions are feasible in sequence and non-overlapping in scope.
> Together they cover the three primary interaction surfaces: Economics results, backgrounds, and the map.

---

## Direction 1 — The Live Economics Reveal

**"Bloomberg terminal meets war room"**

### What It Is

The core product moment — running economics and seeing results — currently has no drama. Numbers appear instantly. Charts swap in. The reveal should feel climactic: a live system processing data and surfacing a verdict.

### The Effect

1. **Hero NPV counter**: On economics run, the NPV10 number counts up from `$0` to the result value using a spring-eased motion curve. Fast at the start, settling into the final number. Uses Motion's `animate()` utility — no library needed.
2. **Production decline curve draws in**: The Recharts line chart is replaced (or augmented) with a custom SVG/Canvas path draw-on. A glowing cyan cursor dot leads the stroke, with the area fill fading in behind it as the path completes. The curve traces from left (month 0) to right (end of forecast) over ~1.2 seconds.
3. **KPI tile stagger**: The 5 KPI tiles (CAPEX, EUR, Payout, Wells) animate in with 0.08s stagger — each rising from `y: 8` with `opacity: 0 → 1`. This already partially exists but needs to trigger on every economics run, not just mount.
4. **Cash flow bar rise**: WaterfallChart bars animate up from the axis baseline with spring physics (`stiffness: 120, damping: 18`).
5. **Calculating shimmer**: While the economics engine runs, a subtle shimmer sweeps across the KPI tiles — a `linear-gradient` mask moving left-to-right (CSS `@keyframes`), snapping away the instant results are ready.

### Implementation Details

- **Number counter**: `motion.animate(0, finalValue, { duration: 1.2, ease: [0.22, 1, 0.36, 1] })` driving a `useState`. Format as currency on each tick. Triggers on `dealMetrics` change.
- **Path draw-on**: SVG `stroke-dasharray` + `stroke-dashoffset` animated from full path length to 0. Calculate path length via `path.getTotalLength()` on mount. CSS `transition` or Motion handles the animation. Glow achieved via SVG `filter: drop-shadow` in theme color.
- **Shimmer**: CSS custom property `@property --shimmer-x` (registered, animatable) driving a `background-position` on a transparent overlay div. Uses `@keyframes` so it runs off the main thread.
- **Stagger trigger**: Hook into the `onRunComplete` callback in `useDerivedMetrics` to reset and re-trigger all Motion `useAnimate` refs.

### Files Affected

| File | Change |
|------|--------|
| `src/components/slopcast/KpiGrid.tsx` | Add stagger trigger on data change, number counter on hero NPV |
| `src/components/Charts.tsx` | Replace or augment production chart with draw-on animation |
| `src/components/slopcast/WaterfallChart.tsx` | Spring-physics bar entrance |
| `src/hooks/useDerivedMetrics.ts` | Expose run-complete event for animation triggers |
| `src/styles/theme.css` | Add `@property --shimmer-x` + shimmer keyframes |

### No New Dependencies

Motion (v12) is already installed. SVG path techniques are native browser APIs. This is pure refinement of existing infrastructure.

### Risk

Low. All techniques degrade gracefully — if animation is skipped (reduced motion, low-end device), the numbers simply appear instantly as they do today. The `prefers-reduced-motion` check disables all counters and transitions.

---

## Direction 2 — WebGL Shader Layer

**"The backgrounds go to a different level"**

### What It Is

The five canvas-animated backgrounds are extraordinary — but they're at the Canvas 2D ceiling. WebGL fragment shaders unlock what Canvas 2D physically cannot achieve: real-time noise fields, volumetric light scattering, chromatic aberration, fluid caustics. Two themes are targeted.

### Effect A — Synthwave: CRT Shader

A full-viewport raw WebGL2 fragment shader rendered to a canvas behind the existing Synthwave background. The shader implements:

- **Horizontal scanlines**: Dark bands at every other pixel row, `intensity: 0.12`, animated slow scroll downward (`scanlineSpeed: 0.3`)
- **Chromatic aberration**: RGB channel split — red channel offset `+1.5px` on X, blue channel offset `-1.5px` on X. Subtle on flat areas, pronounced on bright/white elements.
- **Barrel distortion**: Screen edges bow slightly inward, as if rendered on a curved CRT phosphor surface. `k1: 0.015`, `k2: 0.005`.
- **Phosphor glow bloom**: Bright pixels (luminance > 0.6) bloom outward via a 5-tap Gaussian blur pass. Adds halation around the neon grid lines.
- **Vignette**: Already exists in CSS — the shader owns it more precisely, with a smooth `smoothstep` falloff.

The shader does NOT replace the existing background — it composites on top as a post-processing pass using `globalCompositeOperation: 'multiply'` (or equivalent blend mode in WebGL).

### Effect B — Tropical: Water Caustics

A fluid light caustics simulation for the Tropical theme. Caustics are the animated rippling light patterns seen on the seafloor through shallow water — quintessentially tropical.

Implemented as a WebGL2 fragment shader:

- **Domain-warped noise field**: Two octaves of `fBm` (fractional Brownian motion) noise, each warped by the gradient of the other. Creates organic, non-repeating fluid motion.
- **Voronoi cells**: Caustic rings emerge at the edges of animated Voronoi cells — the bright lines between regions. Cells evolve slowly over time using noise-displaced seeds.
- **Color**: Teal/cyan palette matching `--cyan` theme token. High-luminance rings, low-luminance fill. Blended onto the ocean/water regions of the background at `opacity: 0.25`.
- **Animation**: The noise field advects over time using a 2D velocity field — flows, doesn't loop. Imperceptibly different every frame.

### Implementation Details

- **Architecture**: Each theme gets a `*ShaderOverlay.tsx` component (e.g., `SynthwaveShaderOverlay.tsx`) rendered as a sibling to the canvas background. Both sit in the themed background's container div.
- **WebGL setup**: Raw WebGL2, no Three.js. Boilerplate: create canvas → get WebGL2 context → compile vert/frag shaders → create fullscreen quad (two triangles, covers clip space) → RAF loop updating `u_time` uniform.
- **Vertex shader**: Dead simple — passthrough. `gl_Position = vec4(position, 0.0, 1.0)`. All work is in the fragment shader.
- **Fragment shader for CRT**: Implemented in GLSL 300 es. Inputs: `u_time` (float), `u_resolution` (vec2), `sampler2D u_screen` (texture of the current frame, captured via `drawImage`). Outputs the processed color at each fragment.
- **Fragment shader for caustics**: Inputs: `u_time`, `u_resolution`. Outputs a caustics color map. The background canvas composites this via Canvas 2D `drawImage` in multiply mode.
- **Performance**: Fragment shaders run entirely on GPU. Zero main-thread cost. Target: < 0.5ms GPU frame time. Both shaders are simple enough to run at 60fps on integrated graphics.
- **Resize handling**: `ResizeObserver` on the container — update canvas dimensions and `u_resolution` uniform.
- **Reduced motion**: Stop the RAF, render a single static frame.

### Files Affected

| File | Change |
|------|--------|
| `src/components/SynthwaveBackground.tsx` | Add `SynthwaveShaderOverlay` as sibling |
| `src/components/TropicalBackground.tsx` | Composite caustics output into draw loop |
| `src/components/SynthwaveShaderOverlay.tsx` | New: WebGL2 CRT post-processing shader |
| `src/components/TropicalCausticsOverlay.tsx` | New: WebGL2 caustics fragment shader |

### No New Dependencies

Raw WebGL2 is a browser API. No Three.js, no GLSL library, no build tooling changes needed. GLSL is written as template literal strings — Vite handles this without a plugin (just strings).

### Risk

Medium. GLSL is finitely debuggable — errors are silent (the canvas just goes black). Mitigation: validate shader compilation with `gl.getShaderInfoLog()` and log errors in dev. Always render a static CSS fallback if WebGL2 is unavailable (`canvas.getContext('webgl2') === null`). Visual iteration via browser dev tools + screenshot comparison is required to tune shader parameters.

---

## Direction 3 — Mapbox Custom WebGL Layer

**"The map becomes a data visualization"**

### What It Is

The Mapbox GL map currently renders well pins, lasso selection overlays, and group color coding. A custom Mapbox GL WebGL layer injects directly into Mapbox's render pipeline — drawing GPU-accelerated visuals that move with the map as it pans/zooms, at the same frame rate as the basemap.

### The Effect

**Well Activity Pulses**

Each well renders as an animated radial pulse — a ring that expands outward from the well center and fades to transparent. Multiple rings per well, offset in time, create a "sonar ping" effect. Wells assigned to a group use that group's color. Unassigned wells use dim white.

When group EUR/well increases (economics run), the pulse radius and brightness scale proportionally — high-production wells pulse larger and faster. This makes production potential spatially legible at a glance.

**Selection Trail**

When lasso-drawing a selection, a glowing particle trail follows the cursor path on the map canvas. Each particle has a lifetime of ~0.4s, fading from the lasso color to transparent. On selection complete, a brief flash radiates outward from the centroid of selected wells.

**Group Formation Animation**

When wells are assigned to a group, they visually "migrate" — a brief connecting arc animates from each well to a color beacon at the group centroid. The arcs are GPU-drawn Bézier curves with a moving dot along the path. Duration: ~0.6s.

### Implementation Details

- **Mapbox Custom Layer API**: Implement the `CustomLayerInterface` — an object with `id`, `type: 'custom'`, `onAdd(map, gl)`, `render(gl, matrix)`, and `onRemove()` methods. Added via `map.addLayer(customLayer)` after `map.on('load')`.
- **`onAdd`**: Initialize WebGL buffers, compile shaders, set up geometry. The `gl` provided is Mapbox's shared WebGL context — do not create a new one.
- **`render(gl, matrix)`**: Called every frame by Mapbox. Upload well positions as a typed array of `[lng, lat, groupColorR, groupColorG, groupColorB, pulsePhase]`. The vertex shader converts lng/lat to clip space using the `matrix` uniform Mapbox provides. The fragment shader draws the pulse ring using the fragment's distance from the center.
- **Vertex shader**: `vec4 worldPos = u_matrix * vec4(mercatorX, mercatorY, 0, 1)`. Mapbox provides the mercator projection matrix — multiply through it for correct map-relative positioning.
- **Fragment shader for pulse**: `float dist = length(v_uv - vec2(0.5))`. Ring drawn at `dist ≈ 0.35 + sin(u_time * speed + phase) * 0.1`. `alpha = smoothstep(ring - 0.02, ring, dist) * smoothstep(ring + 0.02, ring, dist)`. Multiply by `1.0 - (dist - minRing) / ringWidth` for fade.
- **Well position encoding**: Lng/lat converted to Mapbox mercator coordinates (0–1 range) on the CPU. Sent as a `Float32Array` buffer via `gl.bufferData`. Updated whenever `wellGroups` changes.
- **Performance**: 40 mock wells → trivially fast. Even at 10,000 wells, a single draw call with instanced rendering handles it. Use `ANGLE_instanced_arrays` extension for instancing.
- **Integration point**: `useMapboxMap.ts` already manages the map lifecycle. Add custom layer registration after the `map.on('load')` callback.
- **Lasso trail**: Accumulated as a `Float32Array` of `[x, y, birthTime]` tuples. On each frame, discard particles older than 0.4s. Draw as `gl.POINTS` with a radial gradient in the fragment shader.

### Files Affected

| File | Change |
|------|--------|
| `src/hooks/useMapboxMap.ts` | Register custom WebGL layer after map load |
| `src/components/slopcast/MapWellPulseLayer.ts` | New: Mapbox CustomLayerInterface implementation |
| `src/components/slopcast/MapSelectionTrail.ts` | New: Lasso particle trail layer |

### No New Dependencies

Mapbox GL's `CustomLayerInterface` is part of the existing `mapbox-gl` package already in use. The WebGL context is provided by Mapbox — no separate canvas or context initialization needed.

### Risk

Medium-high. Writing against Mapbox's shared GL context requires care — Mapbox expects its GL state to be intact after `render()` returns. Mitigation: save and restore all WebGL state touched (`gl.enable`/`gl.disable`, bound buffers, active program) at the start/end of every render call. The Mapbox docs provide a pattern for this. All effects degrade to the existing pin rendering if the custom layer fails to compile.

---

## Sequencing

Implement in this order — each direction is independent, but 1 delivers the most immediate UX impact, 3 is the most complex:

```
Phase 1 — Direction 1: Live Economics Reveal    (no new deps, highest UX leverage)
Phase 2 — Direction 2: WebGL Shader Layer       (isolated to background components)
Phase 3 — Direction 3: Mapbox Custom Layer      (most complex, most novel)
```

Each phase is self-contained and shippable independently.

---

## Shared Constraints

All three directions must:

- Respect `prefers-reduced-motion` — static fallback required for every animated element
- Degrade gracefully if WebGL2 is unavailable (Directions 2 and 3)
- Not affect TypeScript types or business logic — purely in render/animation layer
- Pass `npx tsc --noEmit` and `npx eslint . --quiet` with zero errors before marking complete
