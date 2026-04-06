# Theme Differentiation Plan

## Problem Statement

4 of 7 themes (Slate, Nocturne, Stormwatch, Hyperborea) are visually indistinguishable at a glance on the map view. They all read as "dark navy app with blue dots." The theme system has powerful structural levers (`ThemeFeatures`) but most are underused or completely unwired.

### Current Differentiation Spectrum

| Tier | Themes | Issue |
|------|--------|-------|
| Instantly distinct | Classic, Synthwave | No work needed on identity — these are clearly unique |
| Distinct if you squint | Tropical | Teal/coral shift is real but subtle; key colors hidden |
| Blur together | Slate, Nocturne, Stormwatch, Hyperborea | All navy-blue with blue accents; structural diffs invisible at map scale |

### Feature Wiring Audit

| Feature | Wired? | Consumers | Status |
|---------|--------|-----------|--------|
| `denseSpacing` | **No** | 0 components | Dead flag — Stormwatch's key differentiator does nothing |
| `headingFont` | **Dead boolean** | 0 conditional checks | `.heading-font` class is applied unconditionally; the boolean is never read |
| `brandFont` | Yes | ~10 components | Best-wired feature (Synthwave only) |
| `panelStyle` | Partial | 8 map overlays + SectionCard (manual prop) | SectionCard not auto-wired to theme |
| `glowEffects` | Yes | 3 consumers | Narrow scope: color swatch, D3 wells, toolbar button |

---

## Guiding Principle

Each theme needs a **signature move** — one structural trait identifiable in a 2-second peripheral glance without reading any text. Color alone isn't enough; the signature must combine color temperature + typography + spatial density + material treatment.

| Theme | Target Identity | Signature Move |
|-------|----------------|----------------|
| Slate | The Institutional | Gray-slate tones (not navy), maximum contrast, restrained |
| Synthwave | The Arcade | Purple + Orbitron + retro grid (already works) |
| Tropical | The Resort | Warm coral/lime header + lush teal glass |
| Nocturne | The Observatory | Serif headings + amber-gold accents |
| Stormwatch | The Ops Center | Square corners + monospace numbers + dense spacing |
| Classic | The Console | Color-coded blocks + beveled chrome (already works) |
| Hyperborea | The Ice Station | Frosted glass + cold blue-white + aurora shimmer |

---

## Implementation Phases

### Phase 1: CSS Token Shifts (Slate, Nocturne, Hyperborea)
> **Scope:** `theme.css` only — zero component changes
> **Files:** 1 (`src/styles/theme.css`)
> **Risk:** Low — only changes CSS custom property values

These three themes can be differentiated purely through token value changes. No component logic needed.

#### 1A. Slate — Navy to Gunmetal-Gray

**Rationale:** Every other theme lives in the blue spectrum. Shifting Slate to neutral gray immediately separates it and reinforces its "corporate/institutional" identity. Slate is the only theme with a light variant — its dark variant should feel like the companion to that light mode, not another navy theme.

**Changes to `:root` block in theme.css:**

```
BEFORE                          AFTER
--bg-deep:    15 23 42          --bg-deep:    18 20 27       (#12141b — charcoal)
--bg-space:   27 41 62          --bg-space:   28 31 38       (#1c1f26 — warm gray)
--surface-1:  30 41 59          --surface-1:  35 38 47       (#23262f — steel)
--surface-2:  51 65 85          --surface-2:  55 59 68       (#373b44 — medium gray)
--border:     71 85 105         --border:     82 86 95       (#52565f — neutral border)
--muted:      148 163 184       --muted:      156 160 170    (#9ca0aa — neutral muted)
```

Also update:
- `--grad-space` — shift the radial gradient blues to neutral grays
- `--ambient-left` / `--ambient-right` — desaturate to gray
- Mapbox overrides in `themes.ts`: bgColor, waterColor, landColor to match gray tones
- Chart palette `grid`, `text`, `surface`, `border` to gray equivalents

**Keep unchanged:** `--cyan: 59 130 246` as the primary accent — blue pops harder against gray than against navy, increasing contrast. `--text` stays bright. This makes Slate the **highest contrast** theme.

#### 1B. Nocturne — Blue Accent to Amber-Gold

**Rationale:** Nocturne currently uses `--cyan: 103 195 238` (blue) as its dominant accent — identical in temperature to Slate/Hyperborea. Shifting the visual weight to amber/gold makes it instantly recognizable and reinforces the moonlit/observatory identity.

**Changes to `[data-theme='league']` block in theme.css:**

The key move is NOT to change `--cyan` (it's still used for cool accents), but to introduce amber dominance through the semantic tokens that drive visible UI:

```css
/* Override the accent strip gradient — amber-dominant */
[data-theme='league'] .panel-accent-strip {
  background: linear-gradient(90deg,
    rgba(233,176,103,0.7),    /* amber */
    rgba(103,195,238,0.4),    /* cyan — cooler, recessive */
    rgba(116,176,145,0.5)     /* sage */
  );
}
```

New/changed tokens:
```
--nocturne-accent-warm: 233 176 103;    /* #e9b067 — primary warm accent */
```

Additionally, introduce a new CSS utility specific to Nocturne that themed components can opt into:
```css
[data-theme='league'] .typo-hero-value {
  color: rgb(233 176 103);  /* amber hero metric */
}
[data-theme='league'] .typo-section {
  color: rgb(168 191 225);  /* lavender labels instead of cyan */
}
```

This makes:
- The hero NPV number render in **warm amber/gold** instead of cyan-blue
- Section labels render in **cool lavender** instead of cyan
- The accent strip on panels amber-dominant

**Also update in `themes.ts`:**
- `chartPalette.oil` → amber tone (already `#e9b067`, good)
- `mapPalette.glowColor` → `#e9b067` (amber glow on selected wells instead of blue)
- `mapPalette.selectedStroke` → keep `#f4d2a4` (warm gold, already good)

#### 1C. Hyperborea — Warm Navy to Cold Steel-Blue

**Rationale:** Hyperborea's identity is "ice station" but its color temperature is barely colder than Slate. Both cyan and magenta are blue, which is unique — but needs to be pushed harder. The text and muted colors should feel clinically cold.

**Changes to `[data-theme='hyperborea']` block in theme.css:**

```
BEFORE                          AFTER
--bg-deep:    10 21 37          --bg-deep:    8 16 28        (colder, darker)
--bg-space:   15 28 48          --bg-space:   12 22 38       (colder)
--surface-1:  25 38 58          --surface-1:  22 34 52       (cooler)
--surface-2:  42 58 82          --surface-2:  36 52 74       (cooler)
--text:       226 232 240       --text:       220 232 248    (bluer white — key change)
--muted:      148 163 184       --muted:      140 165 200    (distinctly blue-gray)
```

Add frost-specific tokens:
```css
[data-theme='hyperborea'] {
  --frost-overlay: rgba(56, 189, 248, 0.03);
  --frost-border: rgba(56, 189, 248, 0.15);
}
```

Add ambient aurora pulse (already has `--ambient-glow` and `--ambient-pulse` vars — wire them to a visible animation):
```css
[data-theme='hyperborea']::after {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 200px;
  background: linear-gradient(180deg,
    rgba(56,189,248,0.06) 0%,
    rgba(125,211,252,0.03) 40%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 0;
  animation: aurora-drift 12s ease-in-out infinite alternate;
}

@keyframes aurora-drift {
  0% { opacity: 0.4; transform: translateX(-5%); }
  100% { opacity: 0.8; transform: translateX(5%); }
}
```

---

### Phase 2: Typography Differentiation (Nocturne, Stormwatch)
> **Scope:** `app.css` + `theme.css` — minimal component changes
> **Files:** 2-3
> **Risk:** Low-Medium — affects text sizing, needs visual QA

#### 2A. Nocturne — Amplify Cormorant Garamond

**Rationale:** Nocturne is the ONLY serif-heading theme across all 7. This is a massive differentiator being wasted at small sizes where serif/sans differences disappear. Cormorant Garamond is stunning at large display sizes — delicate, high-contrast serifs that scream sophistication.

**Approach:** Add per-theme CSS overrides that scale up heading/hero text when Nocturne is active:

```css
/* theme.css — Nocturne typography overrides */
[data-theme='league'] .typo-hero-value {
  font-family: var(--font-heading);  /* Cormorant Garamond */
  font-weight: 700;
  letter-spacing: -0.02em;
  /* Scale up slightly — serif needs more room to breathe */
  font-size: clamp(3rem, 6vw, 5rem);
}

[data-theme='league'] .typo-section {
  font-family: var(--font-heading);
  letter-spacing: 0.08em;  /* slightly tighter than default 0.2em — serifs need less tracking */
  font-size: 0.8125rem;    /* 13px — bump from 12px to let serifs breathe */
}

[data-theme='league'] .typo-kpi-label {
  font-family: var(--font-heading);
  letter-spacing: 0.06em;  /* serifs look terrible with heavy tracking */
}
```

**Why CSS overrides instead of component logic:** The `headingFont` boolean is dead — no components check it. Rather than wiring a new conditional into 20+ components, theme-scoped CSS selectors achieve the same result with zero component changes. The `--font-heading` var is already set per-theme; we just need to apply it to more elements and adjust sizing/tracking for serif proportions.

#### 2B. Stormwatch — Monospace Metrics

**Rationale:** Stormwatch uses JetBrains Mono as `--font-brand` but almost nothing displays it because `brandFont: false`. The ops-center identity demands monospace numbers everywhere — metric values, KPI tiles, table cells.

**Approach:** Theme-scoped CSS overrides (same pattern as Nocturne):

```css
/* theme.css — Stormwatch monospace overrides */
[data-theme='stormwatch'] .typo-hero-value,
[data-theme='stormwatch'] .typo-value,
[data-theme='stormwatch'] .typo-kpi-value {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

[data-theme='stormwatch'] .typo-kpi-label {
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
```

This makes every number in Stormwatch render in monospace — the "terminal readout" feeling is immediate and unmistakable. No component changes needed.

---

### Phase 3: Dense Spacing Implementation (Stormwatch)
> **Scope:** Components + CSS
> **Files:** 3-5 component files + `theme.css`
> **Risk:** Medium — changes layout metrics, needs thorough visual QA across all themes

#### 3A. Define Dense Spacing Tokens

Add CSS custom properties that components can consume. Default (non-dense) values in `:root`, compressed values in `[data-theme='stormwatch']`:

```css
/* theme.css — spacing tokens */
:root {
  --space-panel-x: 1.5rem;    /* 24px — horizontal panel padding */
  --space-panel-y: 1.5rem;    /* 24px — vertical panel padding */
  --space-section-gap: 1rem;   /* 16px — gap between sections */
  --space-kpi-gap: 0.75rem;   /* 12px — gap between KPI tiles */
  --space-hero-pad: 2rem;     /* 32px — hero NPV panel padding */
}

[data-theme='stormwatch'] {
  --space-panel-x: 1rem;      /* 16px — 33% tighter */
  --space-panel-y: 0.875rem;  /* 14px */
  --space-section-gap: 0.625rem; /* 10px */
  --space-kpi-gap: 0.5rem;    /* 8px */
  --space-hero-pad: 1.25rem;  /* 20px */
}
```

#### 3B. Wire Spacing Tokens into Components

Replace hardcoded padding/gap values with CSS variable references. Target components (highest visual impact):

**`KpiGrid.tsx`** — Hero NPV panel and KPI strip tiles:
```
BEFORE: className="... p-8 ..."
AFTER:  style={{ padding: 'var(--space-hero-pad)' }}
// Or use a Tailwind arbitrary value: p-[var(--space-hero-pad)]
```

**`KpiGrid.tsx`** — KPI strip container gap:
```
BEFORE: className="grid ... gap-3 ..."
AFTER:  className="grid ..." style={{ gap: 'var(--space-kpi-gap)' }}
```

**`SectionCard.tsx`** — Panel padding:
```
BEFORE: className="... px-6 py-5 ..."
AFTER:  style={{ padding: 'var(--space-panel-y) var(--space-panel-x)' }}
```

**`DesignEconomicsView.tsx`** — Section gaps:
```
BEFORE: className="... gap-4 ..."
AFTER:  style={{ gap: 'var(--space-section-gap)' }}
```

#### 3C. Expected Visual Impact

Stormwatch should visibly fit **more data on screen** than any other theme. Side-by-side comparison with Slate on the Economics view should show:
- ~25% tighter panel padding
- Smaller gaps between KPI tiles
- More compact section headers
- The same information in less vertical space — "operator console" density

---

### Phase 4: Tropical Color Push (CSS + minor themes.ts)
> **Scope:** `theme.css` + `themes.ts`
> **Files:** 2
> **Risk:** Low — color value changes only

#### 4A. Warm Header Gradient

Tropical's header is currently dark teal. It should feel like golden hour — warm coral/sunset tones bleeding into the header gradient.

```css
[data-theme='tropical'] {
  --header-bg-1: 60 45 30;     /* warm brown-amber */
  --header-bg-2: 26 35 50;     /* existing dark teal */

  /* Override grad-space for warm atmospheric feel */
  --grad-space:
    radial-gradient(1200px circle at 10% -20%, rgba(255,127,107,0.18) 0%, transparent 58%),
    radial-gradient(980px circle at 92% -8%, rgba(185,255,59,0.10) 0%, transparent 54%),
    linear-gradient(160deg, #1a2e28 0%, #1a2332 58%, #0a1520 100%);
}
```

#### 4B. Neon Lime Visibility

The `--magenta` slot in Tropical is `185 255 59` (neon lime `#B9FF3B`) — the most unique color in the entire palette. But it barely appears anywhere because `--magenta` is typically used for secondary accents.

Add targeted CSS overrides to surface this color:

```css
[data-theme='tropical'] .typo-section {
  color: rgb(45 212 191);   /* teal — keep labels in the teal family */
}

/* Success states in lime */
[data-theme='tropical'] {
  --success: 185 255 59;   /* override green success → neon lime */
}
```

Update `themes.ts` chart palette:
```
cash: '#B9FF3B'   // neon lime for cash flow line (currently #FF7F6B)
```

This makes the production/cash flow chart line render in signature lime green — visible and unique.

#### 4C. Map Cluster Warmth

Currently the map cluster dot in Tropical uses the default cyan. Override in `themes.ts`:

```ts
mapPalette: {
  glowColor: '#FF7F6B',       // warm coral glow on selected wells
  unassignedFill: '#2dd4bf',   // keep teal for unassigned
}
```

The coral well clusters on teal water = tropical sunset palette visible at map scale.

---

### Phase 5: Hyperborea Frost Effect (CSS only)
> **Scope:** `theme.css` + `glass.css`
> **Files:** 2
> **Risk:** Low — additive CSS, no layout impact

#### 5A. Frosted Glass Panels

Hyperborea and Tropical both use `panelStyle: 'glass'` — but they should LOOK different. Tropical glass = clear tropical water. Hyperborea glass = frosted ice.

```css
/* Frost noise overlay on glass panels */
[data-theme='hyperborea'] .rounded-panel {
  position: relative;
}

[data-theme='hyperborea'] .rounded-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    /* Subtle noise texture via SVG data URI */
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"),
    linear-gradient(135deg, rgba(56,189,248,0.04) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
  opacity: 0.6;
}
```

This adds a barely-visible noise grain + cold blue tint to every panel, creating the "frosted glass" effect. Tropical's glass remains clean and clear by comparison.

#### 5B. Frost Border Treatment

Override the sidebar glass tokens for a colder, more visible frost edge:

```css
/* glass.css — Hyperborea frost override */
[data-theme='hyperborea'] {
  --sidebar-glass-bg: rgba(8, 16, 28, 0.92);
  --sidebar-glass-blur: 10px;  /* more blur = more frost */
  --sidebar-glass-border: rgba(56, 189, 248, 0.18);  /* brighter ice-blue edge */
}
```

#### 5C. Aurora Shimmer

Wire the existing `--ambient-glow` / `--ambient-pulse` vars to a visible top-of-page animation:

```css
[data-theme='hyperborea'] .theme-aurora {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 180px;
  background: linear-gradient(180deg,
    rgba(56, 189, 248, 0.05) 0%,
    rgba(125, 211, 252, 0.02) 50%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 0;
  animation: aurora-drift 14s ease-in-out infinite alternate;
}

@keyframes aurora-drift {
  0%   { opacity: 0.3; transform: translateX(-3%) scaleX(1.0); }
  50%  { opacity: 0.7; transform: translateX(2%) scaleX(1.05); }
  100% { opacity: 0.4; transform: translateX(-3%) scaleX(0.98); }
}
```

Requires adding a `<div className="theme-aurora" />` in the page layout — conditionally rendered when `themeId === 'hyperborea'`. This is the ONE component-level change in this phase.

---

### Phase 6: Polish Passes (Synthwave, Classic)
> **Scope:** `theme.css` only
> **Files:** 1
> **Risk:** Very low — additive visual polish

#### 6A. Synthwave — Reactive Glow on Hover

Add a subtle glow intensification on panel hover:

```css
[data-theme='synthwave'] .rounded-panel {
  transition: box-shadow 0.3s ease;
}
[data-theme='synthwave'] .rounded-panel:hover {
  box-shadow:
    0 0 12px rgba(229, 102, 218, 0.15),
    0 0 36px rgba(229, 102, 218, 0.08);
}
```

#### 6B. Classic — Inset Texture

Add a subtle paper grain to the cream inset surfaces:

```css
[data-theme='mario'] .sc-insetLight::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,...") /* noise SVG */;
  opacity: 0.03;
  pointer-events: none;
  border-radius: inherit;
}
```

---

## Phase Execution Order & Dependencies

```
Phase 1 ─── CSS Token Shifts (Slate gray, Nocturne amber, Hyperborea cold)
  │          theme.css + themes.ts mapPalette/chartPalette only
  │          No component changes. Safe to merge independently.
  │
Phase 2 ─── Typography (Nocturne serif sizing, Stormwatch monospace)
  │          theme.css + app.css only
  │          Depends on Phase 1 (Nocturne amber + serif = combined identity)
  │
Phase 3 ─── Dense Spacing (Stormwatch)
  │          theme.css + 3-5 component files
  │          Independent of Phases 1-2 but benefits from Phase 2 monospace
  │
Phase 4 ─── Tropical Color Push
  │          theme.css + themes.ts
  │          Fully independent — can run in parallel with any phase
  │
Phase 5 ─── Hyperborea Frost
  │          theme.css + glass.css + 1 component (aurora div)
  │          Depends on Phase 1C (cold color tokens first, then frost layer)
  │
Phase 6 ─── Polish (Synthwave hover, Classic texture)
             theme.css only
             Fully independent
```

**Recommended execution:** Phases 1 + 4 in parallel (both CSS-only, independent themes), then 2, then 3, then 5, then 6.

---

## Verification Protocol

After each phase:

1. `npx tsc --noEmit` — type-check
2. `npm run ui:audit` — style drift check
3. Visual QA checklist (both Wells map + Economics view):
   - [ ] Slate: Reads as gray/charcoal, NOT navy-blue
   - [ ] Synthwave: Unchanged (purple + glow + Orbitron)
   - [ ] Tropical: Warm coral header visible, lime-green in chart, teal glass panels
   - [ ] Nocturne: Serif headings visible at all sizes, amber/gold hero NPV, amber glow on map
   - [ ] Stormwatch: Monospace numbers, square corners, visibly denser layout
   - [ ] Classic: Unchanged (color-coded blocks + chrome)
   - [ ] Hyperborea: Cold blue-white text, frosted glass grain, aurora shimmer at top

4. Cross-theme regression: switching between all 7 themes should show no layout breaks, no missing elements, no flash of unstyled content.

---

## Success Criteria

The theme system succeeds when a user can identify ANY of the 7 themes from a **2-second glance at a 400px-wide thumbnail** of the Economics view. Currently only Synthwave and Classic pass this test. After implementation, all 7 should pass.

**The peripheral vision test:** If you blur your eyes, can you still tell which theme is active?

- Slate → gray (not blue)
- Synthwave → purple + round panels
- Tropical → teal-lime-coral warmth
- Nocturne → serif text + amber/gold numbers
- Stormwatch → square corners + dense layout + monospace
- Classic → primary color blocks
- Hyperborea → ice-blue frost + aurora glow

---

## Files Changed Per Phase

| Phase | Files | Type |
|-------|-------|------|
| 1 | `theme.css`, `themes.ts` | CSS tokens + palette values |
| 2 | `theme.css`, `app.css` | CSS overrides for typography |
| 3 | `theme.css`, `KpiGrid.tsx`, `SectionCard.tsx`, `DesignEconomicsView.tsx` | CSS vars + component wiring |
| 4 | `theme.css`, `themes.ts` | CSS tokens + palette values |
| 5 | `theme.css`, `glass.css`, 1 layout component | CSS + conditional div |
| 6 | `theme.css` | CSS only |

**Total:** ~8 files across all phases. Heaviest component work is Phase 3 (spacing tokens).
