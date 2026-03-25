# Theme Critique: Tropical & Nocturne

**Reviewer:** Design Director (Claude)
**Date:** 2026-03-23
**Target users:** O&G professionals making capital allocation decisions worth millions
**Brand mandate:** "Bold, cinematic, opinionated" — dark-mode native, atmospheric, energizing deal-making

---

## Tropical Theme

### Identity & Emotional Resonance

**Target vibe:** "Tommy Bahama resort" — relaxed luxury, island synthwave
**Actual vibe delivered:** Atmospheric island scene with teal/lime neon palette

**What's working:**
- The TropicalBackground.tsx delivers a fully realized scene: synthwave sun, palm-framed island, bioluminescent ocean, animated parrots, firefly particles
- The synthwave aesthetic (sun slices, ocean grid, neon colors) creates a distinct visual hook that feels premium and intentional
- The background is sophisticated — layered depth, organic motion, performance-optimized

**Identity gaps:**
- **The neon lime (#b9ff3b) is too aggressive.** It dominates as `--magenta` (secondary accent) and `--warning`, creating a high-contrast acid-green punch that reads "cyberpunk rave" more than "island resort". Tommy Bahama is relaxed confidence — this lime is anxious and loud.
- **Teal + neon lime is not a beach palette.** Real tropical luxury uses warm coral/peach, sandy gold, sunset orange. The current palette feels synthetic (which is fine for synthwave themes) but misses the "resort" warmth.
- **The theme name/description mismatch.** If the intent is "island synthwave", lean in — rename to "Miami Vice" or "Retrograde". If the intent is resort luxury, soften the lime to coral/peach and add warmth to surfaces.

**Emotional landing:** Users will feel **energized and intrigued** by the visual craft, but not **relaxed**. The lime creates tension rather than ease. For deal-making, this could work ("electric energy") but it doesn't match the Tommy Bahama brief.

### Color & Palette Analysis

**Current palette:**
- Primary accent (cyan): `#2dd4bf` (teal-400) ✓ Strong, readable
- Secondary accent (magenta/lime): `#b9ff3b` ✗ Too bright, poor hierarchy
- Tertiary (lav): `#c3ff8c` (soft lime) — follows magenta, adds to lime overload
- Warning: `#b9ff3b` (neon lime) — same as magenta, creates confusion
- Surfaces: `#1e323c` (surface-1), `#2a4852` (surface-2) — teal-tinted, cohesive with cyan but murky

**Issues:**
1. **Lime dominance destroys visual hierarchy.** When `--magenta`, `--warning`, and `--lav` all lean lime, there's no clear accent ladder. Every highlight screams equally.
2. **Poor legibility for financial data.** Neon lime on dark teal surfaces creates harsh contrast that fatigues the eye. For a data-heavy app showing NPV/IRR/EUR, this is a blocker.
3. **Insufficient warm tones.** The palette is 90% cool (teal, lime). No coral, amber, or sandy gold to balance or ground the scene. The background sun is warm, but the UI doesn't echo it.

**Recommendations:**
- **Replace neon lime (`--magenta`) with warm coral** `#ff8a65` or sunset peach `#ffb088`. This ties to the background sun and creates a teal/coral complementary pair (classic tropical).
- **Reserve lime for rare "sparkle" moments** — maybe firefly particles or a single glow effect, not structural accents.
- **Add a sandy/gold neutral** to `--lav` (e.g., `#f4d2a4`) for softer highlights that don't compete with cyan.
- **Warm up surface tones slightly** — add 5% amber to surface-1/surface-2 to reduce the cold murk.

### Chart Readability

**Chart palette:**
- oil: `#2dd4bf` (teal) — good
- cash: `#b9ff3b` (neon lime) — harsh, will dominate line charts
- lav: `#c084fc` (purple-400) — decent, but doesn't fit the tropical palette (feels borrowed from another theme)
- grid: `rgba(45, 212, 191, 0.15)` (teal) — subtle, good
- text: `#94a3b8` (muted) — readable but cool-toned

**Issues:**
1. **Neon lime cash line will overpower oil production.** In a cumulative cash flow chart, the lime will visually dominate even if oil is the larger dataset.
2. **Purple tertiary is off-brand.** Tropical should use coral/peach/sandy tones, not purple. This feels like a default fallback.
3. **No warm accent for "good news" moments.** All chart colors are cool except the harsh lime.

**Recommendations:**
- **cash: coral `#ff8a65`** or warm peach `#ffb088` — creates clear differentiation from teal and feels "profitable warmth"
- **lav: sandy gold `#f4d2a4`** for tertiary bars/accents
- **Add a subtle orange grid option** for "warm mode" charts (sunset horizon)

### Panel & Surface Treatment

**Current setup:**
- panelStyle: `glass` (60% opacity surfaces)
- radius: `22px` (generous, friendly)
- Atmospheric overlays: canopy, horizon, ridges, palms — all present

**What's working:**
- The glass panels over the tropical background create genuine depth. You feel like you're looking through frosted glass at an island scene.
- The 22px radius is softer than other themes (synthwave 4px, league 14px) — this supports the "resort" vibe.
- The palm frond overlays (`.theme-atmo-palms`) frame the viewport with silhouette foreground elements — cinematic and intentional.

**Issues:**
1. **Surface tones are too dark/murky.** `--surface-1: 30 50 60` and `--surface-2: 42 72 82` feel like midnight ocean rather than sunny lagoon. This kills the "resort daylight" vibe.
2. **Glass opacity at 60% makes text harder to read** against the busy background (ocean grid, firefly particles, palm canopy). For a data app, this is risky.
3. **The palm canopy overlay is too subtle at default opacity (0.3).** On mobile, it's nearly invisible. Either commit (0.5+) or remove it.

**Recommendations:**
- **Lighten surface-1 to `40 65 75`** (brighter teal) and surface-2 to `52 82 92` — this reads "sunny lagoon" instead of "deep ocean night".
- **Increase glass panel opacity to 70%** for the Tropical theme specifically, or add a subtle backdrop-blur increase to compensate.
- **Boost palm canopy opacity to 0.48** (desktop) so it registers as intentional framing.

### Atmospheric Effects

**Background component (TropicalBackground.tsx):**
- Fully realized scene: stars, shooting stars, clouds, sun, ocean, island, palms, parrots, particles, surf foam
- 950 lines of hand-crafted Canvas drawing code
- Animated: swaying palms, bobbing parrots, drifting clouds, wave crests, shimmering sun reflections

**CSS atmospheric overlays:**
- `.theme-atmo::before` — radial sun glow at top, horizontal sun slice bands, teal/lime ambient gradients
- `.theme-atmo-bands` — subtle horizontal scan lines (opacity 0.2)
- `.theme-atmo-canopy` — palm frond silhouettes overlaid on panels (opacity 0.3)
- `.theme-atmo-horizon` — warm glow band at 56–68% height
- `.theme-atmo-ridges` — dark island silhouette gradient at bottom
- `.theme-atmo-palms` — foreground palm silhouettes (left/right framing)

**What's working:**
- **The Canvas background is a masterpiece.** It's not a lazy gradient — it's a complete illustrated scene with depth, motion, and craft. Users will notice and appreciate this.
- **The palm frond framing is bold.** Not every app would dare to occlude the viewport edges with decorative foliage. This is "opinionated design" in action.
- **The sun slice effect ties Canvas to CSS.** The Canvas sun has horizontal slices, and the CSS overlay echoes this with scan lines. Cohesion.

**Issues:**
1. **Too many competing layers.** Canvas background + CSS overlays + glass panels + data/charts = visual cacophony. On a 1080p screen, it's immersive; on a 13" laptop, it's overwhelming.
2. **The palm canopy (CSS) duplicates Canvas palm trees.** The Canvas already has foreground silhouette palms. The CSS palm overlay feels redundant and muddies the composition.
3. **Performance concern:** 950 lines of Canvas animation + CSS overlays + React component tree. On older devices, frame drops are likely. The Canvas animation is smooth at 60fps on a 2023 MacBook but may struggle on a 2019 Windows laptop.
4. **The atmospheric layers don't respect focus mode.** When users click "focus mode" (hiding the left sidebar), the palm fronds still frame the viewport. This reduces effective data space for no benefit.

**Recommendations:**
- **Remove `.theme-atmo-canopy` entirely.** The Canvas already has palm silhouettes. Let the Canvas do the heavy lifting and reduce CSS layer complexity.
- **Dim all atmospheric effects in focus mode.** Reduce Canvas opacity to 0.5 and CSS overlays to 0.15 when focus mode is active.
- **Add a "minimal FX" user preference** that disables Canvas animation (static image) and removes CSS overlays. Power users who run 20 tabs will want this.
- **Consider a lighter daytime variant.** The current background is dusk/night. A sunny midday version with brighter sky and turquoise water would better match "Tommy Bahama resort".

### What's Working

1. **The Canvas background is world-class.** Professional, hand-crafted, performant. This alone makes the theme memorable.
2. **Teal (`--cyan`) is a strong primary accent.** Readable, distinctive, cohesive with the ocean/lagoon theme.
3. **Glass panel style at 22px radius feels premium.** The generous curve and transparency create depth and sophistication.
4. **The synthwave grid on the ocean is inspired.** It bridges retro/digital with natural/organic — a smart creative choice.
5. **Animated parrots and fireflies add life.** These aren't static decorations; they move and breathe. It's delightful.

### Priority Issues

1. **Neon lime (`--magenta`, `--warning`) is too aggressive and destroys visual hierarchy.** Replace with warm coral/peach. This is the #1 blocker to "resort" identity.
2. **Chart palette uses harsh lime and off-brand purple.** Replace lime with coral, purple with sandy gold. Data readability is critical.
3. **Surface tones are too dark/murky.** Lighten by 15–20% to read "sunny lagoon" instead of "midnight ocean".
4. **Too many overlapping atmospheric layers.** Remove CSS palm canopy (redundant with Canvas), reduce opacity in focus mode.
5. **No warm tones in the UI palette.** Add coral, peach, or gold to balance the cool teal/lime dominance.

### Recommendations

**Immediate (blocking):**
1. Replace `--magenta` (neon lime `#b9ff3b`) with coral `#ff8a65` or sunset peach `#ffb088`
2. Replace chart `cash` color from lime to coral
3. Replace chart `lav` color from purple to sandy gold `#f4d2a4`
4. Lighten `--surface-1` to `40 65 75` and `--surface-2` to `52 82 92`

**High priority:**
5. Remove `.theme-atmo-canopy` CSS overlay (redundant with Canvas palms)
6. Increase glass panel opacity to 70% or add stronger backdrop-blur for text legibility
7. Dim atmospheric effects (Canvas + CSS) in focus mode

**Enhancement:**
8. Add a "minimal FX" toggle to disable Canvas animation and CSS overlays for performance-constrained users
9. Create a daytime variant of TropicalBackground (brighter sky, turquoise water, golden sun)
10. Add a warm sandy/gold neutral to `--lav` for softer tertiary highlights

---

## Nocturne (League) Theme

### Identity & Emotional Resonance

**Target vibe:** "Moonlit alpine palette" — serene, cinematic, contemplative night operations
**Actual vibe delivered:** Deep blue twilight with warm gold moon and aurora bands

**What's working:**
- The MoonlightBackground.tsx nails the alpine moonlit scene: layered mountains with contour lines, golden moon with glow rings, aurora wave bands, twinkling stars, drifting mist
- The warm gold (`#e9b067`) vs cool cyan (`#67c3ee`) color split creates depth and temperature contrast — this is sophisticated color theory
- The Cormorant Garamond heading font adds elegance and gravitas (vs Inter everywhere)
- The theme feels **premium and contemplative** — it invites focus rather than demanding attention

**Identity delivery:**
- ✓ Moonlit: The golden moon and warm horizon amber deliver this perfectly
- ✓ Alpine: The layered mountain silhouettes with ridge contours evoke high-altitude landscapes
- ✓ Night operations: The deep blue palette and subtle lighting create a "war room at 2am" focus mode

**Emotional landing:** Users will feel **focused, serious, and immersed**. This is the theme for late-night deal analysis when millions are on the line. The cool blue + warm gold balance prevents fatigue while maintaining gravitas. This is **the strongest thematic execution in the entire system**.

### Color & Palette Analysis

**Current palette:**
- Primary accent (cyan): `#67c3ee` (cool blue) ✓ Distinct, readable, evokes moonlight reflection
- Secondary accent (magenta): `#dc8160` (warm terracotta) ✓ Complements cyan, ties to moon glow
- Tertiary (lav): `#a8bfe1` (soft periwinkle) ✓ Harmonizes with blue palette, elegant
- Warning: `#e9b067` (golden amber) ✓ Perfectly matches moon, creates hierarchy
- Surfaces: `#0e1a30` (surface-1), `#182642` (surface-2) — deep midnight blue, cohesive

**Strengths:**
1. **Warm/cool balance is exceptional.** Cyan (cool) vs amber/terracotta (warm) creates natural visual hierarchy and prevents monotony.
2. **Every color has a narrative purpose.** Cyan = moonlight, amber = moon glow, terracotta = horizon ember, periwinkle = night sky. Nothing feels arbitrary.
3. **Muted saturation matches the "night operations" brief.** No neon, no aggression — just confident restraint.
4. **Surface tones are dark but not muddy.** The blue tint keeps them feeling atmospheric rather than flat black.

**Minor concerns:**
1. **Terracotta magenta (`#dc8160`) is underutilized in the UI.** It's a beautiful accent but only appears sparingly. Could be pushed further in KPI cards or chart highlights.
2. **Periwinkle lav (`#a8bfe1`) is subtle to the point of invisibility** on dark blue surfaces. It works for tertiary text but would fail as a chart accent.

**Recommendations:**
- **Increase magenta (terracotta) presence** in chart legends, secondary KPI cards, or hover states
- **Consider a slightly brighter lav variant** (`#c0d4f0`) for chart tertiary lines so they register better

### Chart Readability

**Chart palette:**
- oil: `#e9b067` (golden amber) — excellent, ties to moon
- cash: `#67c3ee` (cool cyan) — excellent, clear contrast with oil
- lav: `#8ba6d3` (muted periwinkle) — readable, harmonizes
- grid: `rgba(89, 115, 157, 0.28)` — subtle, doesn't compete
- text: `#9aaecf` — readable, appropriately muted

**Strengths:**
1. **Oil vs cash contrast is perfect.** Warm gold vs cool cyan creates instant visual separation in line charts. Users can glance and parse.
2. **All colors are muted enough to not compete with data.** This is a data-first palette — the colors serve legibility, not decoration.
3. **The golden oil line echoes the moon.** This subtle narrative connection (moon = value, light, success) reinforces the theme identity.

**No major issues.** This is the strongest chart palette across all themes. The only enhancement would be to slightly brighten `lav` for tertiary bars.

### Panel & Surface Treatment

**Current setup:**
- panelStyle: `glass` (60% opacity surfaces)
- radius: `14px` (tighter than Tropical, more technical)
- Atmospheric overlays: moon glow, aurora bands, horizon amber, mountain ridges

**What's working:**
- The 14px radius feels **precise and technical** — appropriate for "operations" framing
- Glass panels over the moonlit mountain scene create **cinematic depth** without sacrificing legibility
- The dark blue surface tones (`#0e1a30`, `#182642`) are **cohesive with the background** — this feels like a unified scene, not UI layered over wallpaper

**Issues:**
1. **Glass at 60% opacity struggles against the aurora bands.** The repeating horizontal scan lines in `.theme-atmo-bands` can create visual interference with table row stripes or chart grid lines.
2. **The mountain ridges overlay is subtle to the point of being forgettable.** At 0.72 opacity (mobile), the gradient barely registers. Either commit (0.85+) or simplify.
3. **The accent strip (pseudo-element on panels)** is a cyan→amber→green gradient at 0.62 opacity. This is beautiful but **only visible if you're looking for it**. Consider boosting to 0.75 or adding a subtle animation.

**Recommendations:**
- **Reduce aurora band opacity to 0.24** (from 0.36) to minimize interference with data rows/grids
- **Boost mountain ridges overlay to 0.82** so it reads as intentional foreground framing
- **Increase panel accent strip opacity to 0.72** so the cyan→amber→green gradient pops as a signature detail

### Atmospheric Effects

**Background component (MoonlightBackground.tsx):**
- Moonlit alpine scene: layered mountains, golden moon, aurora wave bands, twinkling stars, horizon haze, mist particles
- 462 lines of Canvas drawing code
- Animated: aurora waves, star twinkle, drifting mist, moon glow pulse

**CSS atmospheric overlays:**
- `.theme-atmo::before` — radial moon glow, aurora cyan fade, horizon amber band
- `.theme-atmo-bands` — horizontal scan lines + aurora cyan/amber gradients (opacity 0.36)
- `.theme-atmo-ridges` — dark mountain silhouette gradients at bottom (opacity 0.86)
- `.theme-atmo-header` — amber underline + shadow for header depth

**What's working:**
1. **The aurora bands are a standout signature detail.** The horizontal neon wave lines at the top feel **purposeful and thematic** — they evoke "Northern Lights over alpine peaks" without being literal.
2. **The moon glow is layered and pulsing.** Multiple radial gradients at different scales create realistic atmospheric haze. This is **not a flat graphic** — it breathes.
3. **The mountain contour lines are inspired.** Gold and blue ridge lines on the silhouettes add **topographic map** detail — a subtle nod to the technical/operational framing.
4. **The warm amber horizon glow at 61% height** creates a **visual anchor** — your eye naturally rests there, which is where key data (KPI hero cards) tends to sit.

**Issues:**
1. **The aurora bands can interfere with table rows.** The horizontal scan lines at ~12px intervals can align with or "beat" against 40px table row heights, creating a moiré effect.
2. **The mist particles are barely visible.** At 0.01–0.05 opacity, they're more concept than execution. Either push them to 0.08–0.12 or remove them.
3. **The Canvas grain effect is heavy.** `drawGrain()` at 0.04 alpha with 64x64 tiled noise adds grit but also **muddies chart backgrounds**. For data-heavy views, this is a liability.

**Recommendations:**
- **Reduce aurora band scan line frequency** from 12px to 18px intervals to avoid moiré with table rows
- **Boost mist particle opacity** to 0.08–0.12 so they register as intentional atmosphere
- **Reduce grain alpha to 0.02** or disable grain in "focus mode" / data-heavy tabs (CHARTS, CASH_FLOW)
- **Add a "midnight mode" toggle** that disables aurora bands and grain for maximum data clarity

### What's Working

1. **The warm/cool color split (gold vs cyan) is world-class.** This is sophisticated color theory that creates hierarchy, depth, and emotional balance.
2. **The MoonlightBackground is cinematic and thematically cohesive.** Every element (moon, aurora, mountains, stars) reinforces "moonlit alpine night operations".
3. **The chart palette is the best in the system.** Golden oil vs cool cyan cash creates instant legibility with thematic narrative.
4. **Cormorant Garamond heading font adds elegance.** This breaks away from the "all Inter" monotony and signals premium craftsmanship.
5. **The mountain ridge contour lines are a brilliant detail.** They add topographic/technical flavor without being heavy-handed.
6. **The theme feels **focused and serious** — perfect for late-night deal analysis.**

### Priority Issues

1. **Aurora band scan lines can create moiré with table rows.** Reduce frequency from 12px to 18px intervals.
2. **Canvas grain effect muddies chart backgrounds.** Reduce alpha to 0.02 or disable in data-heavy views.
3. **Mist particles are too subtle to register.** Boost opacity to 0.08–0.12 or remove entirely.
4. **Panel accent strip gradient is barely visible.** Increase opacity from 0.62 to 0.75 so it reads as a signature detail.
5. **Terracotta magenta is underutilized.** Push this warm accent into more KPI cards and chart elements.

### Recommendations

**Immediate (quality boost):**
1. Reduce aurora band scan line interval from 12px to 18px to avoid moiré
2. Reduce Canvas grain alpha from 0.04 to 0.02
3. Boost panel accent strip (pseudo-element) opacity from 0.62 to 0.75
4. Boost mist particle opacity from 0.01–0.05 to 0.08–0.12

**High priority:**
5. Add "midnight mode" toggle: disables aurora bands, grain, and mist for maximum data clarity
6. Increase mountain ridges overlay opacity from 0.72 to 0.82 (mobile)
7. Push terracotta magenta into more UI elements (KPI card borders, chart legend highlights)

**Enhancement:**
8. Slightly brighten lav chart color from `#8ba6d3` to `#a0b8e0` for better tertiary line visibility
9. Add a subtle animation to the panel accent strip (slow gradient shift) to make it feel alive
10. Consider a "dawn" variant with warm pink/orange horizon for morning work sessions

---

## Cross-Theme Observations

### Shared Strengths

1. **Both themes commit to full-scene Canvas backgrounds.** This is ambitious and differentiating. Most SaaS apps use static gradients; Slopcast has **animated illustrated worlds**. This is the app's signature move.
2. **Both themes layer CSS overlays + Canvas for depth.** The multi-layer approach (Canvas backdrop → CSS gradients → glass panels → data) creates genuine cinematic atmosphere.
3. **Both themes use `glass` panel style effectively.** The 60% opacity surfaces over complex backgrounds feel **premium and intentional**, not cheap or gimmicky.

### Shared Weaknesses

1. **Atmospheric complexity risks overwhelming data.** When you have animated Canvas + CSS overlays + glass panels + charts/tables, the **data fights for attention**. For a financial modeling tool, data must always win.
2. **No "minimal mode" toggle.** Power users who run the app in a 13" laptop side-by-side with Excel will want to **disable atmospheric effects entirely**. Currently, there's no escape hatch.
3. **Performance is unvalidated on low-end hardware.** Both Canvas backgrounds are optimized for 60fps on modern laptops, but **no testing on 2019 Windows laptops or underpowered Chromebooks**. For a B2B SaaS targeting enterprise users, this is a risk.
4. **Atmospheric effects don't respect focus mode.** When users hide the sidebar to maximize data space, the backgrounds and overlays remain at full intensity. **Focus mode should dim or simplify atmosphere.**

### Tropical vs Nocturne: Which is Stronger?

**Nocturne wins decisively.**

| Criterion | Tropical | Nocturne |
|-----------|----------|----------|
| **Identity delivery** | Partial — neon lime breaks "resort" vibe | ✓ Excellent — every element reinforces "moonlit alpine" |
| **Color palette cohesion** | Weak — lime dominates, no warm balance | ✓ Excellent — warm/cool split is world-class |
| **Chart readability** | Weak — harsh lime, off-brand purple | ✓ Excellent — best chart palette in system |
| **Data legibility** | Weak — murky surfaces, harsh accents | ✓ Strong — muted tones serve data-first |
| **Atmospheric craft** | ✓ Excellent — 950 lines of Canvas art | ✓ Excellent — 462 lines, more restrained |
| **Emotional resonance** | Mixed — energizing but tense | ✓ Strong — focused, serious, immersive |

**Why Nocturne wins:**
- Every color choice has a **narrative purpose** (cyan = moonlight, amber = moon glow)
- The **warm/cool balance** prevents fatigue and creates natural hierarchy
- The **muted saturation** respects the "data-first" mandate — atmosphere enhances rather than competes
- The **alpine/operations framing** aligns with the user's mental model (late-night war room deal analysis)

**Where Tropical fails:**
- The **neon lime is off-brief** for "Tommy Bahama resort" — it's aggressive and synthetic
- The **lack of warm tones** in the UI palette (despite the warm background sun) creates dissonance
- The **murky surface tones** kill the "sunny lagoon" vibe the background promises

### Actionable Hierarchy: What to Fix First

**Blocking (must fix before shipping):**
1. **Tropical: Replace neon lime with coral/peach** in `--magenta`, `--warning`, chart `cash` color
2. **Tropical: Lighten surface tones** by 15–20% to read "sunny lagoon" vs "midnight ocean"

**High priority (quality blockers):**
3. **Tropical: Fix chart palette** — replace lime with coral, purple with sandy gold
4. **Nocturne: Reduce aurora band moiré** — increase scan line interval from 12px to 18px
5. **Both: Add "minimal FX" toggle** — disable Canvas and CSS overlays for power users

**Enhancement (polish):**
6. **Nocturne: Boost panel accent strip** opacity from 0.62 to 0.75
7. **Tropical: Remove redundant palm canopy** CSS overlay
8. **Both: Dim atmosphere in focus mode** — reduce Canvas + CSS opacity by 50–70%
9. **Nocturne: Reduce grain alpha** from 0.04 to 0.02 in data-heavy views
10. **Tropical: Create daytime variant** — brighter sky, turquoise water, midday sun

---

## Final Verdict

**Nocturne is production-ready with minor polish.** It's the strongest theme in the system — cohesive, cinematic, data-first, emotionally resonant. The warm/cool color split and mountain/moon imagery create a **signature visual identity** that's both beautiful and functional.

**Tropical needs a palette overhaul before shipping.** The Canvas background is world-class, but the neon lime accent and murky surfaces break the "Tommy Bahama resort" promise. With coral/peach replacing lime and warmer surface tones, this theme could be a strong contender. As-is, it's visually impressive but thematically confused.

**Both themes would benefit from a "minimal mode" toggle** for power users and performance-constrained environments.

---

**End of critique.**
