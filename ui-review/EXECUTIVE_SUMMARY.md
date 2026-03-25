# UI Review Executive Summary

## Portfolio Readout

The `ui-review` work shows a product with a strong visual point of view and a
real theme system, but the reports agree on one core pattern: the app's
highest-value surfaces are stronger than the supporting system underneath them.
The KPI hero, atmospheric themes, and major layout concepts are already
compelling. The main risks are inconsistency, readability drift, and missing
system primitives that make future polish expensive to maintain.

This is not a redesign situation. It is a systems-hardening and presentation
refinement effort. Most recommendations are about tightening the design system
so the app feels intentional everywhere, not just in the standout screens.

## Cross-Cutting Priorities

### 1. Fix accessibility and legibility first

The clearest P0 issues are in `interaction-motion` and `color-atmosphere`:

- Global reduced-motion support is incomplete.
- Keyboard focus states are missing on important interactive controls.
- Small text over transparent panels can lose contrast.
- Synthwave readability and double-vignette stacking reduce the payoff of the
  atmospheric background work.

These are high-impact, low-effort fixes that improve quality without changing
the product's personality.

### 2. Consolidate the UI primitives

The strongest structural opportunity is in `component-consistency` and
`shape-borders`:

- Create a real shared button component.
- Extract a reusable theme-aware panel primitive.
- Collapse border-radius usage into a three-tier token system.
- Push more styling decisions into theme tokens instead of inline classes.

This reduces duplication, lowers regression risk, and makes the classic/modern
dual-mode architecture easier to extend.

### 3. Improve scan speed on decision-making surfaces

The `visual-hierarchy` and `layout-architecture` reports point to the same
business problem: users can find the key numbers, but the surrounding chrome is
too visually loud and the layout is tighter than it should be on desktop.

The most valuable adjustments are:

- Give the main content frame and header more breathing room.
- Separate KPI labels from section headings more clearly.
- Increase secondary KPI value presence.
- Reduce button typographic weight so controls do not compete with data.

These changes should make the app feel faster to read without reducing density.

### 4. Preserve theme personality while tightening execution

The theme system is already a differentiator. The recommendation sets do not
argue for flattening the themes; they argue for making each theme clearer and
more coherent:

- Improve Synthwave readability.
- Warm or rebalance specific themes where palette and surface treatment drift
  apart.
- Make heading-font and panel-style tokens more consistently visible.
- Align atmospheric effects with UI chrome instead of letting them fight.

## Recommended Execution Sequence

### Phase 1: Low-risk, high-return fixes

- Add the global reduced-motion gate.
- Add visible focus rings.
- Fix Synthwave panel readability and remove double vignetting.
- Expand workspace padding and normalize the obvious panel spacing issues.
- Replace non-token border radii on inputs/selects with `rounded-inner`.
- Adjust KPI labels/value hierarchy in `KpiGrid`.

### Phase 2: System primitives

- Build the shared button component.
- Extract the panel primitive.
- Standardize typography utilities and tracking tiers.
- Centralize panel opacity rules.
- Unify `--radius-kpi` into `--radius-panel`.

### Phase 3: Theme and motion polish

- Animate modals, drawer, AI assistant, and onboarding more coherently.
- Expand heading-font coverage.
- Apply theme-specific palette refinements.
- Introduce any wide-screen layout enhancements.

## Expected Outcome

If executed in that order, Slopcast should keep its cinematic identity while
becoming easier to scan, more accessible, more maintainable, and more obviously
premium on the screens where users do the most serious analysis.
