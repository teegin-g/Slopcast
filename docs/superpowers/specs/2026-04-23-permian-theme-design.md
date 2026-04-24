# Permian Theme — Design Spec

**Date:** 2026-04-23
**Status:** Approved, ready for implementation
**Scope:** New Slopcast theme `permian` with 3D react-three-fiber animated background and two modal variants (Dusk / Noon).

---

## 1. Why

Slopcast is an oil & gas economics modeling app. Every other Slopcast theme is a
genre (synthwave, tropical, storm, etc.) — evocative but abstract. **Permian** is
the first theme that *is* the subject matter. Users evaluating Permian Basin
deals should occasionally look up at their screen and see their own world
rendered back at them: a drilling rig on a ridge, a frac spread running,
pumpjacks rocking in the distance, the sun moving across the day.

This is theme-as-identity, not theme-as-skin.

## 2. Theme identity

| Field | Value |
|---|---|
| `id` | `permian` |
| `label` | `Permian` |
| `icon` | 🛢️ |
| `appName` | `SLOPCAST` |
| `appSubtitle` | `Patch Economics` |
| `variant` | `dark` (Dusk) |
| `hasLightVariant` | `true` (Noon) |
| `fxTheme` | `true` |

### ThemeFeatures

```ts
{
  retroGrid: false,
  brandFont: true,
  glowEffects: true,
  panelStyle: 'glass',     // dusk; noon overrides to 'solid' via CSS
  headingFont: true,
  denseSpacing: false,
  isClassicTheme: false,
}
```

### Fonts

- **Heading** (`--font-heading`): `Barlow Condensed` — industrial signage without mono cliché.
- **Brand display** (`--font-brand`): `Syne` — geometric, cinematic.

Load via the existing Google Fonts pattern in `theme.css`.

## 3. Palette

### Accent anchors (shared by tokens, charts, and map)

| Slot | Hex | Role |
|---|---|---|
| `--cyan` | `#00E890` | Rig teal-glow (primary accent; reused in existing `--cyan` slot) |
| `--magenta` | `#E87030` | Safety orange (secondary) |
| `--lav` | `#F0C020` | Hard-hat yellow (tertiary / highlights) |
| `--warning` | `#F0C020` | Same as `--lav` for coherence |
| `--danger` | `#D83020` | Kill-switch red |
| `--success` | `#00E890` | Same as `--cyan` for coherence |

### Dusk (default, dark)

| Token | Hex |
|---|---|
| `--bg-deep` | `#0A1F18` |
| `--bg-space` | `#102A20` |
| `--surface-1` | `#1A3A2A` |
| `--surface-2` | `#23503A` |
| `--border` | `#2D6B4A` |
| `--text` | `#EFE8D8` |
| `--muted` | `#9AA99A` |

Sun position: 5° above horizon, amber `#FFA050`.
Sky gradient: `#0A1F18 → #2A4A5A → #E87030` (horizon).

### Noon (light variant)

| Token | Hex |
|---|---|
| `--bg-deep` | `#C8DCCA` (washed sage) |
| `--bg-space` | `#D8E8D2` |
| `--surface-1` | `#F0F4E8` |
| `--surface-2` | `#FFFFFFE0` |
| `--border` | `#6B8870` |
| `--text` | `#1A2A1F` |
| `--muted` | `#4A6050` |

Sun position: 60°, core `#FFF8E0`.
Sky gradient: `#1A5A7A → #48B0B8 → #78D0C0` (matches user's reference HTML).

### Chart palette

```ts
{
  oil:   '#E87030',  // the oil line IS oil-rig orange
  cash:  '#00E890',
  lav:   '#F0C020',
  grid:  'rgba(0, 232, 144, 0.14)',
  text:  '#9AA99A',       // dusk; swap to #4A6050 for noon via selector
  surface: '#0A1F18',     // dusk tooltip bg
  border:  'rgba(45, 107, 74, 0.42)',
}
```

### Map palette

```ts
{
  gridColor:      '#2D6B4A',
  gridOpacity:    0.32,
  selectedStroke: '#E87030',
  glowColor:      '#00E890',
  unassignedFill: '#556070',
  lassoFill:      'rgba(240, 192, 32, 0.14)',
  lassoStroke:    '#F0C020',
  lassoDash:      '6, 3',
  mapboxOverrides: {
    bgColor: '#0A1F18',
    waterColor: '#14654A',
    landColor: '#1A3A2A',
    labelColor: '#6B8870',
    roadOpacity: 0.14,
  },
}
```

## 4. Scene composition (3D)

```
Sun (DirectionalLight + emissive sphere) → GodRays source
├─ SkyDome (fragment shader, gradient matches variant)
├─ Terrain (4 parallax ridge planes, displacement shader sharing hillNoise)
├─ Pumpjacks × 8 (real 4-bar linkage; placed by hillNoise at matching ridge)
├─ Derrick × 1 (hero rig, instanced cross-bracing, animated traveling block)
├─ FracSpread (pump trucks, sand kings, blender, data van)
│    └─ Sparkles (GPU exhaust particles)
├─ Trees (instanced billboard quads with vertex-shader sway)
└─ Workers × 8 (sprite billboards, 2-frame walk cycle)
```

## 5. Post-processing stack

Via `@react-three/postprocessing` EffectComposer, in order:

1. **GodRays** — from sun mesh; radial blur; 20 samples; dusk density 0.92, noon 0.78.
2. **Bloom** — threshold 0.9; luminance-gated so only rig teal edges + sun core bloom.
3. **HeatShimmerEffect** (custom) — UV displacement using simplex noise; masked to `uv.y < 0.42` (lower ridge); amplitude scales with `noonAmount` (0 dusk → 1 noon).
4. **ChromaticAberration** — radial 0.5px; subtle depth cue.
5. **Noise** — film grain; opacity 0.05; `premultiply: true`.
6. **Vignette** — 0.35; offset 0.2 toward bottom.

## 6. Variants — what actually differs

| Dimension | Dusk | Noon |
|---|---|---|
| Sun altitude | 5° (low-right) | 60° (upper-right) |
| Sun color | `#FFA050` | `#FFF8E0` |
| Sky gradient | Deep teal → amber horizon | Sky blue → pale teal horizon |
| Pumpjack material | Silhouetted (flat-shaded, low fresnel) | Lit (normal fresnel, visible panel lines) |
| Teal rig glow emissive | 2.0× | 0.8× |
| Flare stack | Visible burning flame sprite on one truck | Faint, barely visible |
| GodRays density | 0.92 (dramatic rays) | 0.78 (tight, pale) |
| Heat shimmer | Off (0 amplitude) | On (1.0 amplitude) |
| Cloud style | Flat painted sprites, warm-tinted | Volumetric noise-shader puffs |
| Film grain | 0.05 | 0.03 |

Toggle source: `effectiveMode` from `useTheme()`, read via `document.documentElement.dataset.mode` so Storybook knobs can override it.

## 7. Architecture & file layout

```
src/components/
  PermianBackground.tsx          // Root component (default export, lazy-imported)
  OilRigBackground2D.tsx         // Low-end fallback (port of user's HTML scene)
  PermianBackground.stories.tsx  // Storybook with variant/fx/reduced-motion knobs
  permian/
    hillNoise.ts            // Shared CPU + GLSL noise (parity-tested)
    Terrain.tsx             // Parallax ridge planes + sky dome
    SkyDome.tsx             // Fragment-shader sky
    Pumpjack.tsx            // Articulated 4-bar linkage
    Derrick.tsx             // Hero rig (instanced trusses, traveling block)
    FracSpread.tsx          // Trucks, tanks, data van
    Sprites.tsx             // Worker + tree billboards (data URI textures)
    HeatShimmerEffect.ts    // Custom postprocessing Effect
    variants.ts             // Dusk/Noon tuning constants
    useDeviceTier.ts        // Low-end detection hook
```

## 8. Performance & accessibility guardrails

Non-negotiable:

- **`dpr={[1, 1.5]}`** on the R3F Canvas (retina ceiling).
- **`frameloop='always'`** while visible; **pause** via `document.hidden` listener.
- **`prefers-reduced-motion`** → freeze pumpjacks mid-stroke, no Sparkles, no heat shimmer, no GodRays movement (sun still rendered).
- **Low-end fallback:** If `navigator.hardwareConcurrency < 4` OR
  `navigator.deviceMemory && navigator.deviceMemory < 4`, serve
  `OilRigBackground2D` (the ported 2D Canvas scene) instead.
- **Single clock:** One `useFrame` delta drives all animations; no per-component
  `setInterval` or `rAF`.

### Fallback decision tree

```
mount PermianBackground
  ├─ prefers-reduced-motion? → render 3D frozen (static)
  ├─ low-end device?          → lazy-import OilRigBackground2D instead
  ├─ WebGL2 unavailable?      → lazy-import OilRigBackground2D instead
  └─ otherwise                → render full 3D with post-FX
```

## 9. Testing

- **Unit:** `hillNoise.test.ts` — CPU implementation matches reference values
  at several input points; GLSL version validated by a round-trip via a
  `THREE.BufferGeometry` readback (optional; can defer to manual check).
- **Storybook:** `PermianBackground.stories.tsx` with knobs
  `mode: 'dusk' | 'noon'`, `fxLevel: 'cinematic' | 'max'`,
  `reducedMotion: boolean`, `forceFallback: boolean`.
- **Playwright:** Extend `e2e/` to visit `/slopcast?theme=permian` in both
  modes; assert canvas exists and the theme tokens applied to the app shell.
- **Gates:** `npm run typecheck`, `npm run test`, `npm run ui:audit`,
  `npm run ui:components`.

## 10. Out of scope

- No GLTF model loading (everything procedural for bundle size).
- No HDR/IBL environment (single directional light + shader sky).
- No user-controllable camera (the scene is purely backdrop — no pointer events).
- No real-time scene editing UI (variants tuned via constants only).
