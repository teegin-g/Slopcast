# Layout Architecture Executive Summary

## Executive Summary

The layout concept is strong, but the current spacing system is under-serving
the product's ambition. The app wants to feel cinematic and premium on large
monitors, yet several key shells and panels are padded more like a compact
utility dashboard. The result is a workspace that is functional and dense, but
not always as deliberate or breathable as it could be.

This review area has unusually high upside because many of the best fixes are
simple spacing corrections rather than major structural rewrites.

## What The Reports Say

- The workspace frame, page grids, panel internals, and chart shells use
  inconsistent padding and gap values.
- Header and sidebar spacing are tighter than their strategic importance
  suggests.
- Max-width, min-height, and z-index decisions are partly standardized in
  concept but still hardcoded in implementation.
- The app lacks a meaningful large-desktop breakpoint beyond the current
  desktop mode.

## Business Interpretation

This is the workstream most likely to change how "expensive" the product feels
without altering any core functionality. Better spatial hierarchy will make the
same UI feel calmer, more intentional, and more credible on the large displays
where users review deals.

## Top Recommendations To Act On

### 1. Take the easy spacing wins immediately

- Expand main content frame padding on larger screens.
- Harmonize page-grid gaps between Wells and Economics.
- Normalize collapsible panel padding.
- Fix the under-padded chart container.

These changes should be treated as the first batch because they are low risk
and globally visible.

### 2. Improve shell breathing room

- Give the header more vertical and horizontal space.
- Open up sidebar nav spacing and tap targets.
- Add a subtle sidebar-to-content separation on desktop.

### 3. Clean up the structural tokens

- Align max-width rules between workspace and marketing surfaces.
- Normalize or remove the mismatched min-height calculations.
- Start using the existing z-index token vocabulary.
- Add a `wide` viewport breakpoint for future large-screen enhancements.

## Suggested Priority

### P0 to P1

- Frame padding.
- Grid gap harmonization.
- Collapsible-panel padding normalization.
- Chart panel padding fix.

### P1 to P2

- Header spacing.
- Sidebar spacing.
- Sidebar animation timing refinement.

### P2 to P3

- Max-width unification.
- Min-height cleanup.
- Z-index token adoption.
- Wide-screen breakpoint work.

## Success Criteria

This work is successful if the app keeps its information density but stops
feeling compressed, especially in desktop workflows where the atmospheric
design deserves more room to register.
