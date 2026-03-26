# Shape Language & Border Treatments Executive Summary

## Executive Summary

The shape system is close to being disciplined, but not yet disciplined enough
to act as a reliable design token layer. The app already has strong theme-aware
radius primitives, especially at the panel level. The issue is drift: a handful
of default Tailwind radius utilities and secondary border treatments are still
bypassing the intended system.

This is a classic "small details, big trust" category. Users may not describe
the problem as border-radius inconsistency, but they will feel the difference
between a tightly governed component language and one with quiet exceptions.

## What The Reports Say

- Multiple non-token radius utilities are still in active use.
- Similar controls use different radius classes without a semantic reason.
- `--radius-kpi` duplicates `--radius-panel` behavior without clear value.
- Synthwave inherits Slate's panel radius instead of declaring its own.
- Toast accent borders still use hardcoded colors rather than theme tokens.

## Business Interpretation

This stream is a relatively inexpensive way to strengthen theme identity and
reduce polish drift. It also helps future implementation work by removing some
of the most common visual escape hatches from everyday component code.

## Top Recommendations To Act On

### 1. Enforce a three-tier radius system

- `rounded-panel` for outer shells.
- `rounded-inner` for nested controls and tiles.
- `rounded-full` for chips, badges, and progress shapes.

Replace `rounded-md`, `rounded-lg`, and bare `rounded` wherever they are acting
as untracked substitutes for `rounded-inner`.

### 2. Clarify per-theme radius identity

- Reduce Slate to a crisper 12px panel radius.
- Declare Synthwave explicitly at 14px.
- Keep the existing radii for Tropical, Nocturne, Stormwatch, Classic, and
  Hyperborea.

This sharpens the differences between themes without introducing more
component-level branching.

### 3. Remove redundant or drifting tokens

- Unify `--radius-kpi` with `--radius-panel`.
- Document the two different radius offset calculations so future contributors
  understand why they exist.
- Move toast border accents onto theme tokens.

### 4. Add light governance

- Extend `ui:audit` to flag disallowed radius utilities.
- Consider a capped table radius later if soft themes make data wrappers feel
  too rounded.

## Suggested Priority

### P0

- Replace non-token radii on inputs, selects, and similar controls.

### P1

- Adjust Slate and Synthwave panel radii.
- Move toast accent borders to theme tokens.

### P2

- Unify `--radius-kpi`.
- Add audit enforcement.

### P3

- Explore a `--radius-table` cap for dense data views.

## Success Criteria

This work is successful if every rounded element in the app clearly belongs to
one of the intended shape tiers and theme personality comes through without
component-specific exceptions.
