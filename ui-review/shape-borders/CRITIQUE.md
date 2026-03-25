# Shape Language & Border Treatments -- Design Critique

## 1. Does Shape Language Tell a Story?

Slopcast has the bones of a deliberate shape vocabulary, but the execution is
uneven. The `--radius-panel` token system is the right foundation: each theme
declares a panel radius that cascades into `rounded-panel` (outer containers)
and `rounded-inner` (nested elements at `panel - 6px`). That two-tier system
implies a considered parent-child relationship.

**Where it works:** The range of radius values across themes communicates
real personality differences. Stormwatch at 4px reads as military-utilitarian;
Tropical at 22px reads as soft and relaxed; Synthwave inherits the default 18px
which keeps neon edges slightly pillowed without going bubbly. This is exactly
the kind of structural differentiation the CLAUDE.md design principles call for.

**Where it breaks down:** Outside the panel/inner pair, shape language fractures
into at least 5 competing radius vocabularies that don't participate in the
token system:

1. `rounded-full` (9999px) -- filter chips, status dots, progress bars, badges
2. `rounded-md` (6px) -- Classic mode CAPEX tiles, some legacy buttons
3. `rounded-lg` (8px) -- TaxControls/DebtControls select inputs
4. `rounded` (4px) -- ProfileSelector inputs, save buttons, scrollbar thumbs
5. `rounded-panel` / `rounded-inner` -- the token-driven pair

The result: on a single Economics view, the user's eye encounters at least four
different curvature families. That is too many. Shape language should operate
like a type scale -- a limited, intentional set of sizes that create rhythm.

## 2. Per-Theme Radius Personality Assessment

| Theme       | `--radius-panel` | Personality Target         | Radius Fit?  |
|-------------|------------------|---------------------------|--------------|
| Slate       | 18px             | Corporate blue-gray       | Too round. 18px is lounge-y for a corporate default. 12-14px would land closer to "polished professional." |
| Synthwave   | 18px (inherited) | Neon retro vibes          | Acceptable. Synthwave can be soft (vaporwave) or sharp (Tron). 18px leans vaporwave; 14-16px would sharpen the retro-tech feel. |
| Tropical    | 22px             | Tommy Bahama resort       | Good fit. Generous radius communicates approachability and warmth. Most thematically coherent. |
| Nocturne    | 14px             | Moonlit alpine            | Strong fit. Subtle rounding suggests elegance and restraint. Paired with Cormorant Garamond headings, this feels refined. |
| Stormwatch  | 4px              | Moody dusk storm          | Excellent fit. Near-square corners + JetBrains Mono headings + dense spacing = command-center austerity. The sharpest theme, and it earns that identity. |
| Classic     | 8px              | Beveled retro dashboard   | Good fit. Modest rounding aligns with the skeuomorphic beveled-panel aesthetic. |
| Hyperborea  | 12px             | Winter village frost      | Solid fit. Medium radius is neither too soft nor too hard -- works for the "clean arctic operations" mood. |

**Key insight:** Slate and Synthwave both inherit or use 18px, which makes
them feel more similar than they should. Slate is described as "corporate" but
its panels are rounder than Nocturne's alpine elegance. This inverts the
expected personality gradient.

## 3. Visual Noise from Too Many Radius Values

Across all components reviewed, the following distinct radius values appear in
the Tailwind utility layer (ignoring theme tokens):

- `rounded-panel` -- `var(--radius-panel)` (4-22px depending on theme)
- `rounded-inner` -- `calc(var(--radius-panel) - 6px)` (0-16px)
- `rounded-full` -- 9999px (pills, dots, bars)
- `rounded-md` -- 6px (Classic mode CAPEX tiles)
- `rounded-lg` -- 8px (Tax/Debt selects)
- `rounded` -- 4px (ProfileSelector inputs, inline error tooltips)
- `border-radius: 4px` -- scrollbar thumb (theme.css:2398)

**The problem:** `rounded-md`, `rounded-lg`, and `rounded` are Tailwind
defaults that do not participate in the theme token system. When Stormwatch
uses `--radius-panel: 4px`, its panels have 4px corners -- but a `rounded-lg`
select inside them has 8px corners, making children rounder than parents. This
violates the nesting invariant that the `panel > inner` system was built to
enforce.

**Recommendation:** Collapse to three radius tiers: `panel`, `inner`, `pill`.
Everything else should map to one of those three.

## 4. Nested Container Radius Relationships

The core math: `--radius-inner = --radius-panel - 6px` (src/app.css:39).

This is a sound principle -- inner elements should have smaller radii to
maintain consistent visual weight when nested. But it has edge cases:

- **Stormwatch** (panel=4px): inner = -2px, clamped to 0. Inner elements
  become sharp rectangles while the outer panel still has 4px corners. This
  actually looks fine -- squared inner tiles inside near-square panels.
- **Classic** (panel=8px): inner = 2px. So subtle it is almost invisible.
  Meanwhile, Classic-mode CAPEX tiles use `rounded-md` (6px), which is *more*
  round than the inner token. This is an inconsistency.
  (`src/components/Controls.tsx:209`)
- **Tropical** (panel=22px): inner = 16px. Both are generously round, which
  maintains the theme voice. Good.

The `.sc-panel::before` pseudo-element uses `calc(var(--radius-panel) - 2px)`
for the inset glow (theme.css:1764), which is different from the Tailwind
`rounded-inner` calculation of `panel - 6px`. Two different subtraction
constants for "inner radius" is confusing for anyone maintaining the code.

## 5. Buttons, Chips, and Inputs: Coherent Shape Family?

**Buttons** (AnimatedButton.tsx:32): All variants use `rounded-inner`. This
is correct -- buttons live inside panels and should follow the inner radius.

**Filter chips** (FilterChips.tsx:29): Use `rounded-full`. Pill shapes for
removable chips is a well-established pattern. No issue here.

**Inputs and selects**: This is where coherence breaks.
- WellsTable search + selects: `rounded-inner` (WellsTable.tsx:174, 179, 189)
- ProfileSelector inputs: bare `rounded` (ProfileSelector.tsx:123)
- TaxControls/DebtControls: `rounded-lg` (DebtControls.tsx:17, TaxControls.tsx:19)
- DesignEconomicsView reserve select: `rounded-lg` (DesignEconomicsView.tsx:504)

Three different radius classes for form inputs within the same application is
a clear inconsistency. All text inputs and selects should use `rounded-inner`
to participate in the theme-driven radius system.

**Status badges** (KpiGrid.tsx:187): The "active" badge uses `rounded-full`
with a pill shape. This is fine -- badges are semantically different from
interactive controls.

## 6. Where Would MORE Roundness Add Warmth?

- **Toast notifications** (Toast.tsx:54): Currently `rounded-inner`. Toasts
  are ephemeral, friendly UI. Bumping to `rounded-panel` or even a custom
  `rounded-xl` would make them feel more notification-like and less card-like,
  especially in Tropical and Hyperborea.

- **Empty state illustrations** (WellsTable.tsx:204-208): The "No wells to
  display" block has no explicit radius on its container. Wrapping it in a
  softly rounded container would make the empty state feel more intentional.

- **Workflow stepper tiles** (WorkflowStepper.tsx:71): Currently
  `rounded-inner`. The stepper is a progress indicator, not a data container.
  Slightly more rounding (or pill shapes for compact mode) would differentiate
  it from data tiles.

## 7. Where Would LESS Roundness Add Authority?

- **Slate panels** (default 18px): As discussed, Slate at 18px feels too
  casual for the "corporate" theme. Reducing to 12px would add gravitas
  without looking clinical.

- **KPI hero card** (KpiGrid.tsx:317): The NPV hero card uses `rounded-panel`
  like every other panel. For the single most important number in the app, this
  card should feel heavier and more grounded. A slightly reduced radius (or
  the same radius with a thicker border) would signal that this is The Number.

- **Table containers** (WellsTable.tsx:166): Data tables benefit from sharp
  corners that convey precision and density. The table uses `rounded-panel`,
  which at 22px in Tropical creates a very soft container around grid data.
  Tables could use a dedicated `--radius-table` token set to
  `min(var(--radius-panel), 12px)` to cap softness.

## 8. The Classic Theme Bypass

The `isClassic` branching pattern deserves mention. Classic mode uses the
`.sc-panel` CSS class (theme.css:1752-1757) which carries its own
`border-radius: var(--radius-panel)` and bevel pseudo-elements. This is a
parallel shape system that does not interact with the Tailwind utilities.

The result: Classic mode has more internally consistent shape language than the
themed modes, because all panels go through one CSS class with one radius
token. The themed modes scatter radius decisions across dozens of Tailwind
utility strings, making inconsistency easier to introduce.

**Takeaway:** The themed modes should aspire to the structural clarity that
Classic mode achieves through its `.sc-*` class system. A `rounded-panel` +
`rounded-inner` + `rounded-full` trichotomy, rigorously enforced, would get
them there.

## Summary Verdict

The *architecture* of the shape system is sound: per-theme `--radius-panel`
tokens with a derived `--radius-inner`. The *execution* leaks through Tailwind
escape hatches (`rounded-md`, `rounded-lg`, `rounded`) that bypass the token
system. The fix is not a redesign -- it is discipline. Lock every border-radius
to one of three tiers, audit the input/select inconsistencies, and adjust
Slate's default radius downward to better match its personality.
