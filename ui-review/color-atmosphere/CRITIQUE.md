# Color & Atmosphere Critique

> "Atmosphere is architecture." — Slopcast Design Principles

This review evaluates the color systems, atmospheric treatments, and surface
layering across all seven Slopcast themes as implemented in the animated
backgrounds, CSS token system, and UI component layer.

---

## 1. Emotional Signature Per Theme

### Slate (default)
Corporate blue-gray with no animated background. The `--grad-space` radial
gradients (`theme.css:54-57`) provide a subtle indigo/blue wash that feels
professional but unremarkable. Emotional register: **competent, neutral**.
This is correct — Slate is the baseline, not a personality.

### Synthwave
The strongest emotional signature in the system. The SVG background
(`SynthwaveBackground.tsx:28-34`) builds a five-stop sky from `#010008` to
`#080620`, layered with nebula washes at 8-12% opacity (lines 37-48). The
sun gradient walks from warm yellow through pink to deep violet
(lines 51-58). The horizon glow, wireframe mountains, and perspective grid
create genuine retro-futurist atmosphere. **Verdict: fully realized identity.**

### Tropical
Rich and distinct. The COLORS palette (`TropicalBackground.tsx:22-41`)
centers on muted teal `#2c8f7b` instead of saturated tropical cliche,
paired with warm `#ff6b35`. The island-with-palms composition, synthwave
ocean grid, bioluminescent wave crests, and parrot silhouettes produce a
unique "resort noir" mood. The foreground silhouette palms at 85% opacity
(line 910-913) are a smart depth-framing technique. **Verdict: the most
narratively complete scene.**

### Nocturne (League)
Moonlit alpine palette achieves quiet grandeur. The aurora bands
(`MoonlightBackground.tsx:66-79`) in green/amber/red/cyan with low
opacities (0.22-0.55) create subtle northern-lights movement without
overwhelming. Three mountain layers with contour lines in gold and blue
(lines 316-362) provide genuine depth. **Verdict: understated and
confident, befitting "Night Operations."**

### Stormwatch
The most atmospheric of the set. Cloud deck with four procedural layers
(`StormDuskBackground.tsx:236-241`), dual-temperature horizon glow (warm
left, cool right at lines 332-344), building silhouettes with flickering
window lights, rain drizzle, and traffic headlights produce a full urban
dusk narrative. The foreground branches with sway (lines 662-700) add
human scale. **Verdict: exceptional mood density; closest to cinematic.**

### Classic (Mario)
A deliberate outlier. Bright sky blues (`#8fd6ff` to `#68afe9` at
`MarioOverworldBackground.tsx:4-6`) with green rolling hills, game motifs
(pipes, blocks, coins), and warm sparkles. The vignette uses a darker
`rgba(10, 20, 36, 0.50)` (line 23) that successfully grounds the bright
palette into the dark-panel UI. **Verdict: playful and distinct, but the
bright background against dark panels creates the largest tonal gap in the
system.**

### Hyperborea
Winter village with spinning sun asset, Nordic houses, woolly mammoths, UFOs,
and falling snow. The COLORS palette (`HyperboreaBackground.tsx:36-49`) is
the coldest in the system — grey-blues from `#0b1320` to `#2c4365` with
amber window glow as sole warm accent. The mammoth walk cycle (lines 781-919)
is ambitious but adds genuine personality. **Verdict: strong identity, though
the UFOs feel tonally disconnected from the "Arctic Operations" subtitle.**

---

## 2. Surface Layering & Depth Hierarchy

The system defines four depth planes via CSS tokens (`theme.css:12-21`):

| Layer       | Token        | Role                    |
|-------------|-------------|-------------------------|
| Page base   | `--bg-deep`  | Deepest void            |
| Ambient     | `--bg-space` | Grad-space washes       |
| Panels      | `--surface-1`| Primary card surface    |
| Lifted      | `--surface-2`| Hover / secondary tiles |

The `SectionCard.tsx:17-21` maps panel styles to opacity tiers:
- `glass`: `bg-theme-surface1/70` — 70% surface over background
- `solid`: `bg-theme-surface1` — 100%, fully opaque
- `outline`: `bg-theme-surface1/20` — 20%, near-transparent

This three-tier system is architecturally sound. However, the glass
treatment at 70% asks the animated background to carry more visual weight.
For Synthwave (panelStyle: `outline` at `themes.ts:157`), panels at 20%
opacity create a near-transparent layer where the neon SVG bleeds through
strongly. For Tropical (panelStyle: `glass` at `themes.ts:198`), 70% lets
the ocean scene provide depth without competing with text.

**Gap identified:** `KpiGrid.tsx:219-229` defines `heroBgMap` and
`tileBgMap` independently from `SectionCard`, creating two parallel
opacity hierarchies. The hero NPV card uses `bg-theme-surface1/90` for
glass while tiles use `bg-theme-surface1/60`. This inconsistency means
depth perception shifts between card types.

---

## 3. Animated Backgrounds: Mood Enhancement vs. Distraction

Each background uses a different rendering approach:

| Theme       | Renderer | Element Count | Post-Processing        |
|-------------|----------|---------------|------------------------|
| Synthwave   | SVG      | ~100 elements | SVG grain + vignette   |
| Tropical    | Canvas   | ~350 objects  | Scanlines + vignette   |
| Nocturne    | Canvas   | ~170 objects  | Grain + vignette       |
| Stormwatch  | Canvas   | ~440 objects  | Grain + scan + vignette|
| Classic     | Canvas   | ~75 objects   | Vignette only          |
| Hyperborea  | Canvas   | ~250 objects  | Scanlines + vignette   |

**Enhancement assessment:**
- Synthwave SVG is the lightest on GPU but most visually dense due to
  CSS-animated classes. The static nature of SVG means no per-frame
  allocation — excellent performance profile.
- Tropical creates new gradient objects per frame in `drawSky`
  (`TropicalBackground.tsx:200-206`), `drawOcean` (lines 409-413), and
  `drawAtmosphericHaze` (lines 358-363). With 10+ gradient allocations
  per frame, this is the heaviest renderer.
- Stormwatch is the most complex scene (buildings, traffic, drizzle,
  branches) but manages per-frame allocations carefully with pre-built
  grain/scan patterns (`StormDuskBackground.tsx:275-311`).

**Distraction risk:** The Tropical parrots (`TropicalBackground.tsx:742-815`)
draw attention with their flapping wings and colored bodies. On a dashboard
where NPV figures demand focus, animated fauna in the upper viewport could
pull the eye. The parrots sit at y=0.14-0.22 of viewport height — directly
behind the header and KPI zone.

---

## 4. Glass Panel Treatment: Readability Impact

The header uses `backdrop-blur-md` (`PageHeader.tsx:263`) with 80% surface
opacity (`bg-theme-surface1/80`). This provides readable text on all themes.

**Problem areas:**
- Synthwave's `outline` panel style at 20% opacity (`themes.ts:157`)
  combined with the neon SVG background creates low contrast for body text.
  The `--text` value `235 233 238` against a semi-transparent panel over a
  magenta/violet gradient yields unpredictable effective contrast.
- The `KpiStripTile` component (`KpiGrid.tsx:162`) uses `bg-theme-surface1/60`
  as default, but this is overridden by `tileBgMap[panelStyle]` which can
  drop to 20% for outline themes. Small KPI labels at `text-[11px]`
  (`KpiGrid.tsx:163`) with `text-theme-text/70` (70% alpha text) over a
  20% alpha surface over an animated background could fail WCAG AA.
- The Vignette component (`Vignette.tsx:21`) applies `rgba(0, 0, 0, 0.3)`
  at edges, which slightly improves peripheral contrast but does not help
  the center where most content lives.

---

## 5. Vignette Quality Assessment

The system uses two vignette approaches:

**A) CSS Vignette (`Vignette.tsx`)**
Fixed `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)`
— a single, theme-agnostic overlay. This is the React component applied
over the page. The 40% transparent center / 0.3 edge is restrained.

**B) Per-background canvas vignettes:**
- Synthwave SVG: centered at `cy="42%"`, transparent to 0% at center,
  0.75 at edges (`SynthwaveBackground.tsx:147-152`). The strongest
  vignette — edges go nearly black.
- Tropical: `rgba(0,0,0,0.4)` at edges (`TropicalBackground.tsx:856-861`).
- Nocturne: centered at `H*0.38`, four stops up to `0.70`
  (`MoonlightBackground.tsx:378-384`). Offset center creates asymmetric
  darkness (more at bottom), which works for the mountain-heavy scene.
- Stormwatch: centered at `H*0.45` with `rgba(0,0,0,0.58)` max
  (`StormDuskBackground.tsx:722-728`). The heaviest canvas vignette.
- Classic: `rgba(10, 20, 36, 0.50)` at edges
  (`MarioOverworldBackground.tsx:332-339`). Uses dark blue instead of
  pure black — a smart choice that keeps the bright scene feeling warm.
- Hyperborea: `rgba(0,0,0,0.5)` at edges
  (`HyperboreaBackground.tsx:950-955`).

**Quality verdict:** The vignettes are genuinely cinematic — they frame
without suffocating. The Nocturne offset-center technique is the most
sophisticated. However, **double vignetting** occurs when both the canvas
vignette AND the CSS Vignette component render simultaneously. This could
darken corners to near-black, losing any background payoff at the edges.

---

## Summary Grades

| Theme      | Emotional Clarity | Depth Layering | BG/UI Harmony | Readability |
|------------|:-:|:-:|:-:|:-:|
| Slate      | B | A | A | A |
| Synthwave  | A | B | B | C |
| Tropical   | A | A | A | B |
| Nocturne   | A | A | A | A |
| Stormwatch | A | A | A | B |
| Classic    | B | B | C | B |
| Hyperborea | B | A | B | B |

The atmospheric treatments are not decoration — they are architecture.
The system largely delivers on that promise, with Synthwave readability
and the Tropical parrot distraction zone as the primary concerns.
