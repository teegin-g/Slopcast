# Component Consistency Executive Summary

## Executive Summary

The design system is credible, but it is not yet fully operationalized. The
modern theme path is relatively cohesive, the classic path is directionally
solid, and the product clearly has reusable patterns. The problem is that too
many of those patterns still live as repeated local code instead of shared
primitives.

The reports identify two structural risks above all others:

- The button layer is fragmented.
- The classic/modern split is too manual to scale cleanly.

## What The Reports Say

- Modern theme cohesion scores well, but button consistency scores poorly.
- `AnimatedButton` exists as the obvious primitive but is effectively unused.
- Panel shells, headers, and titlebar patterns are duplicated across many
  files.
- Six components still have no meaningful `isClassic` path.
- Theme features like `denseSpacing`, `panelStyle`, and `headingFont` are
  defined, but not consumed broadly enough to shape the interface.

## Business Interpretation

This is a maintainability and velocity issue more than a purely visual one. The
interface can still look good today while becoming harder to evolve tomorrow.
Without stronger shared primitives, every new feature increases the odds of
style drift, dual-mode gaps, and higher QA cost.

## Top Recommendations To Act On

### 1. Establish a real shared button system

- Rehabilitate `AnimatedButton` as the default button primitive.
- Standardize button sizes, tracking, hover behavior, and glow behavior.
- Migrate raw button class strings out of page-level code.

This is the single highest-value refactor in the folder.

### 2. Extract a reusable theme-aware panel primitive

- Promote `SectionCard` or create a `ThemePanel` wrapper.
- Move modern/classic shell logic into the component instead of repeating it in
  each consumer.
- Use the primitive to standardize panel opacity, title treatment, and motion.

### 3. Close the `isClassic` gaps

- Add minimum viable classic styling to the components currently skipping it,
  especially `Toast` and `Skeleton`.
- Treat unsupported classic mode as a design-system bug, not an enhancement.

### 4. Standardize typography and token consumption

- Reduce header style variation.
- Ensure `headingFont`, `panelStyle`, `glowEffects`, and `denseSpacing` are
  visible in real component behavior.
- Consolidate Recharts tooltip styling into a reusable theme-aware pattern.

## Suggested Priority

### P0 to P1

- Shared button component.
- Theme-aware panel primitive.

### P1 to P2

- Add missing classic-mode coverage.
- Normalize section-header typography.
- Centralize token consumption.

### P3

- Small cleanup tasks like z-index classes, dismiss icons, and radius cleanup.

## Success Criteria

This work is successful if new UI can be assembled mostly from reusable
primitives, button behavior feels uniform across the product, and classic mode
stops depending on one-off manual accommodations.
