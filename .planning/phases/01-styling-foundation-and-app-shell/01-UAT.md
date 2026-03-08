---
status: complete
phase: 01-styling-foundation-and-app-shell
source: [01-04-SUMMARY.md, 01-05-SUMMARY.md, 01-06-SUMMARY.md]
started: 2026-03-07T23:58:00Z
updated: 2026-03-08T00:05:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Theme Selector Location
expected: The theme selector is ONLY in the PageHeader (top bar). The sidebar bottom area has NO theme selector dots/icons. Only one place to switch themes in the entire UI.
result: pass

### 2. Panel Borders Match Theme (Slate)
expected: Switch to Slate theme. Content panels (Economics view, Wells view) have borders that use Slate's blue-gray accent colors — NOT generic white/20 borders. Borders should feel cohesive with the Slate palette.
result: issue
reported: "Make sure borders follow the theme tokens for all themes, and make sure that the text and border color is not all white for every theme"
severity: major

### 3. Panel Borders Match Theme (Synthwave)
expected: Switch to Synthwave theme. Panel borders should reflect Synthwave's neon cyan/purple accents. The overall look should feel distinctly Synthwave, not the same as Slate.
result: skipped
reason: Same core issue as Test 2 — borders/text not following theme tokens

### 4. Text Colors Follow Theme
expected: In any non-Mario theme: labels, values, and headers should NOT be plain white. Text should use the theme's text token colors. Switch between Slate and Synthwave — text tinting should visibly change with the theme.
result: skipped
reason: Same core issue as Test 2 — text colors not following theme tokens

### 5. Chart Colors Theme-Aware
expected: Open the Economics tab and look at any charts (waterfall, reserves pie). Chart bar/slice colors should change when switching themes. They should NOT be hardcoded hex colors that stay the same regardless of theme.
result: pass

### 6. Mario Classic Mode Preserved
expected: Switch to Mario theme. Panels should be solid (no glass blur), with deliberate retro white text on dark backgrounds. The classic/retro look should be intentionally different from glass themes — white/black colors here are correct.
result: pass

### 7. Mini Map Theme Colors
expected: If the Wells view has a mini map preview, its background, grid lines, and well markers should use theme-appropriate colors — not hardcoded gray/white fills.
result: pass

## Summary

total: 7
passed: 4
issues: 1
pending: 0
skipped: 2
skipped: 0

## Gaps

- truth: "Content panels have borders using theme-specific accent colors, and text colors follow theme tokens — not hardcoded white across all themes"
  status: failed
  reason: "User reported: Make sure borders follow the theme tokens for all themes, and make sure that the text and border color is not all white for every theme"
  severity: major
  test: 2
  artifacts: []
  missing: []
