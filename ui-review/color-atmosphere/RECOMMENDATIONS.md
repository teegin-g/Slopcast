# Color & Atmosphere Recommendations

Per-theme refinements, atmosphere strengthening proposals, and readability
improvements. Each recommendation references specific file:line locations.

---

## 1. Per-Theme Color Refinements

### Synthwave — Readability Over Neon

**Problem:** panelStyle `outline` (`themes.ts:157`) at 20% surface opacity
lets the neon SVG background bleed through panels, reducing text contrast.

**Recommendation:** Override panelStyle to `glass` for Synthwave, or
introduce a floor opacity for outline panels:

```
// SectionCard.tsx:17-21 — add minimum floor
const sectionBgMap = {
  glass: 'bg-theme-surface1/70',
  solid: 'bg-theme-surface1',
  outline: 'bg-theme-surface1/30',  // raise from /20 to /30
};
```

Alternatively, in `themes.ts:157`, change `panelStyle: 'outline'` to
`panelStyle: 'glass'` for synthwave specifically. The neon atmosphere is
rich enough to show through glass; outline is too permissive.

### Synthwave — Surface Color Warmth

**Current:** `--surface-1: 35 37 88` (`theme.css:183`) is a cool indigo.
The SVG background uses warm magenta/violet. The surface feels disconnected.

**Recommendation:** Shift `--surface-1` slightly warmer:
```css
--surface-1: 38 30 72;   /* #261E48 — purple-shifted */
```
This would tie the panel glass tint to the background palette.

### Tropical — Border Token Conflict

**Current:** `--border: 45 212 191` (`theme.css:241`) is the same as
`--cyan: 45 212 191` (line 243). Borders and primary accent are identical.

**Recommendation:** Give borders a desaturated variant:
```css
--border: 38 160 148;   /* #26A094 — 25% desaturated teal */
```
This preserves the teal family while creating separation between structural
borders and active accent color.

### Nocturne — Strengthen Moon Presence in Header

**Current:** The atmospheric overlay shows a small moon glow at
`theme.css:1097` (44x44px radial gradient at 53% 7%). On taller headers,
this is barely perceptible.

**Recommendation:** Increase moon glow radius to `62px 62px` and raise
opacity from 0.82 to 0.88 in the base `::before`. The moon is the
thematic anchor — it should register even at a glance.

### Stormwatch — Differentiate from Nocturne

**Problem:** Stormwatch and Nocturne share similar blue-gray palettes.
`--bg-deep` differs by only 4 lightness points (Nocturne: `3 8 16`,
Stormwatch: `7 11 22`). At a glance, the surface tokens blend together.

**Recommendation:** Push Stormwatch surfaces slightly warmer to reflect
the "dusk" identity:
```css
--surface-1: 22 31 50;   /* current: 20 33 56 — warmer, less blue */
--surface-2: 36 48 72;   /* current: 33 52 82 — warmer shift */
```
The animated background does the heavy lifting for differentiation, but
the panel chrome should reinforce it.

### Classic (Mario) — Tonal Bridge

**Problem:** `--bg-deep: 243 239 233` (light cream, `theme.css:467`) is
the only light-background theme, but `--surface-1: 15 29 48` (dark navy)
creates the largest luminance jump in the system. Panels feel pasted onto
the background rather than emerging from it.

**Recommendation:** Introduce a mid-tone transition surface:
```css
--bg-space: 230 224 214;  /* current: 251 249 246 — darken slightly */
```
And consider adding a subtle `rgba(15, 29, 48, 0.08)` tint to the
`--grad-space` background to soften the navy/cream boundary.

### Hyperborea — Accent Temperature

**Current:** `--magenta: 125 211 252` (`theme.css:673`) is ice-blue,
making both primary and secondary accents cold. The only warm color is
`--warning: 251 191 36` (amber), used for window glow in the background
but rarely in UI chrome.

**Recommendation:** Redefine `--magenta` with a warmer accent to create
temperature contrast:
```css
--magenta: 251 191 36;   /* #FBBF24 — promote amber to secondary */
```
Or introduce a distinct warm accent that complements the cold palette
without fighting it. Aurora green (`#4ade80`) could work as a secondary.

---

## 2. Atmosphere Strengthening

### Unify Atmospheric Overlay Architecture

**Current state:** Six themes define `theme-atmo::before` with different
gradient compositions. The `fx-max` variant amplifies opacity and adds
saturation/contrast filters for some themes but not others.

**Recommendation:** Ensure every FX theme gets both `fx-cinematic` and
`fx-max` variants with consistent amplification:

| Theme       | Has fx-max | Has saturation filter |
|-------------|:----------:|:---------------------:|
| Synthwave   | Yes        | Yes (`theme.css:777`) |
| Tropical    | Yes        | Yes (`theme.css:924`) |
| Nocturne    | No         | No                    |
| Stormwatch  | Yes        | No                    |
| Classic     | Yes        | No                    |
| Hyperborea  | Yes        | No                    |

Nocturne (`fxTheme: false` at `themes.ts:248` — note the missing property)
should support fx modes. Add `fxTheme: true` and create
`[data-theme='league'] .theme-atmo.fx-max::before` with increased opacity
and subtle saturation boost.

### Improve Header-to-Background Continuity

**Current:** The header at `bg-theme-surface1/80` creates a hard
horizontal bar that severs the animated background from the page content.

**Recommendation for atmospheric themes:** Reduce header opacity from
`/80` to `/60` and increase `backdrop-blur-md` to `backdrop-blur-lg`.
This lets more background color through while maintaining text readability
via stronger blur. Implementation in `PageHeader.tsx:263`:

```
// Current:
'backdrop-blur-md border-b shadow-sm bg-theme-surface1/80 border-theme-border'

// Proposed (for themes with BackgroundComponent):
'backdrop-blur-lg border-b shadow-sm bg-theme-surface1/60 border-theme-border'
```

### Eliminate Double Vignetting

**Current:** The `Vignette.tsx` component renders at `z-index: 10` with
`rgba(0,0,0,0.3)` edges, while every canvas background also draws its own
vignette (ranging from 0.4 to 0.75 edge opacity). These stack additively.

**Recommendation:** For themes with animated backgrounds, skip the CSS
Vignette component entirely. The canvas vignette is already tuned to the
scene. Conditional logic should check `theme.BackgroundComponent` and
omit `<Vignette />` when present. This prevents edge-zone darkness from
exceeding 0.8+ effective opacity, which wastes the background art.

### Stormwatch — Lightning Flash Event

The Stormwatch scene has cloud layers, rain, and a "tension" flash
(`StormDuskBackground.tsx:346-350`) that briefly whitens the sky. This is
good but could be enhanced:

**Recommendation:** Add a brief `box-shadow` pulse to the header during
lightning flashes by exposing a CSS variable `--storm-flash` from the
canvas (via a small DOM attribute toggle), then in CSS:

```css
[data-theme='stormwatch'][data-lightning] .theme-atmo-header {
  box-shadow: inset 0 0 40px rgba(180, 206, 255, 0.15);
  transition: box-shadow 0.08s ease-out;
}
```

This would make the UI chrome respond to the background, turning the
atmosphere into true architecture.

---

## 3. Readability Improvements

### Small Text Over Transparent Panels

**Problem:** `KpiGrid.tsx:163` renders KPI titles at `text-[11px]` with
`text-theme-text/70`. Over outline panels (20% opacity), effective contrast
can drop below 4.5:1 for themes with bright animated backgrounds.

**Recommendation:** Remove the `/70` alpha modifier from small uppercase
labels. At 11px with heavy tracking, these labels are already visually
recessive. Let the font weight and case carry the hierarchy instead of
reducing alpha:

```
// KpiGrid.tsx:163 — change:
'text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5 text-theme-text/70'
// to:
'text-[11px] font-bold uppercase tracking-[0.18em] mb-1.5 text-theme-muted'
```

Using `text-theme-muted` (which is pre-designed for reduced emphasis)
provides consistent contrast across all themes without relying on alpha
compositing over unknown backgrounds.

### Consolidate Panel Opacity Maps

**Problem:** Three separate opacity maps exist:
- `SectionCard.tsx:17-21` — `sectionBgMap`
- `KpiGrid.tsx:219-223` — `heroBgMap`
- `KpiGrid.tsx:225-229` — `tileBgMap`

These diverge (glass: 70% vs 90% vs 60%) creating inconsistent depth cues.

**Recommendation:** Extract a single shared map in a theme utility:

```typescript
// Proposed: src/theme/panelOpacity.ts
export const panelBg = {
  glass:   { section: '/70', hero: '/85', tile: '/60' },
  solid:   { section: '',    hero: '',    tile: '' },
  outline: { section: '/25', hero: '/25', tile: '/25' },
};
```

This centralizes all opacity decisions and makes cross-component audits
trivial. The hero card glass value is lowered from `/90` to `/85` to
maintain the depth hierarchy (hero should not be more opaque than the
section container it sits inside).

### Heading Font Contrast in Stormwatch

**Problem:** `--font-heading: 'JetBrains Mono'` (`theme.css:418`) is a
monospace font. KPI and section titles use `heading-font`
(`SectionCard.tsx:65`, `KpiGrid.tsx:324`) which maps to JetBrains Mono.
At 11px uppercase with wide tracking, monospace glyphs appear wider and
lighter than proportional fonts, reducing perceived contrast.

**Recommendation:** Increase font-weight for heading elements in
Stormwatch, or switch heading font to a semi-condensed sans like
`'IBM Plex Sans Condensed'` that holds weight at small sizes.

### Tropical Parrot Positioning

**Problem:** Parrots (`TropicalBackground.tsx:118-122`) occupy y positions
0.14-0.22 of viewport — directly behind the KPI hero card zone.

**Recommendation:** Push parrot base Y positions lower (0.28-0.36) to
place them in the ocean/sky transition zone where they complement the
scene without competing with the content layer:

```typescript
// TropicalBackground.tsx:118-122 — shift parrots down
const defs = [
  { baseX: 0.18, baseY: 0.30, size: 5, delay: 0 },    // was 0.18
  { baseX: 0.25, baseY: 0.28, size: 4, delay: 2 },    // was 0.14
  { baseX: 0.78, baseY: 0.32, size: 4.5, delay: 4 },  // was 0.16
  { baseX: 0.85, baseY: 0.34, size: 3.5, delay: 1 },  // was 0.22
];
```

### Performance: Tropical Gradient Allocation

**Problem:** `TropicalBackground.tsx:200-206` creates a new
`LinearGradient` for the sky every frame. `drawOcean` creates 5+ gradients
per frame. `drawAtmosphericHaze` creates 4+ per frame.

**Recommendation:** Pre-allocate sky and ocean gradients in the `resize()`
function and reuse them in the draw loop. Only gradients that depend on
`time` (animated color stops) need per-frame creation. The static sky
gradient does not change and can be cached.

---

## Priority Matrix

| Recommendation                  | Impact  | Effort | Priority |
|---------------------------------|---------|--------|----------|
| Fix Synthwave panel opacity     | High    | Low    | P0       |
| Eliminate double vignetting     | Medium  | Low    | P0       |
| Small text alpha -> muted token | High    | Low    | P1       |
| Consolidate panel opacity maps  | Medium  | Medium | P1       |
| Tropical border != cyan         | Medium  | Low    | P1       |
| Move Tropical parrots down      | Medium  | Low    | P1       |
| Add Nocturne fxTheme support    | Low     | Medium | P2       |
| Warm Stormwatch surfaces        | Low     | Low    | P2       |
| Hyperborea warm accent          | Low     | Low    | P2       |
| Header backdrop-blur increase   | Low     | Low    | P2       |
| Classic tonal bridge            | Low     | Medium | P3       |
| Stormwatch lightning UI flash   | Low     | Medium | P3       |
| Tropical gradient caching       | Medium  | Medium | P3       |
