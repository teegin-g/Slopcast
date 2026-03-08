---
status: diagnosed
trigger: "panel borders and text colors are still white/hardcoded across all themes instead of following theme tokens"
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - @theme inline block uses invalid <alpha-value> syntax causing all theme token utilities to output invalid CSS
test: Built app and inspected compiled CSS output
expecting: Valid CSS color values in utility classes
next_action: Fix the @theme inline block in app.css

## Symptoms

expected: Borders follow theme tokens (e.g., slate=blue-gray, synthwave=purple) and text uses per-theme colors
actual: Borders and text appear white across all themes
errors: No console errors - silently invalid CSS
reproduction: Switch between any non-mario theme; borders and text stay white
started: Since @theme inline block was introduced

## Eliminated

(none needed - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-03-07
  checked: src/app.css @theme inline block
  found: All color definitions use `rgb(var(--border) / <alpha-value>)` syntax
  implication: This is Tailwind v3 config syntax, not valid Tailwind v4 CSS @theme syntax

- timestamp: 2026-03-07
  checked: Compiled CSS output (dist/assets/index-C76DTo41.css)
  found: Utility classes contain literal `<alpha-value>` string in output, e.g. `.border-theme-border{border-color:rgb(var(--border) / <alpha-value>)}`
  implication: `<alpha-value>` is NOT a valid CSS value - browser discards the entire declaration

- timestamp: 2026-03-07
  checked: theme.css custom property definitions
  found: All tokens correctly defined as space-separated RGB channels (e.g., `--border: 96 83 160;` for synthwave)
  implication: The theme token VALUES are correct; the problem is purely in how @theme inline references them

- timestamp: 2026-03-07
  checked: Components (EconomicsGroupBar, PageHeader)
  found: Components correctly use `border-theme-border`, `text-theme-text`, `bg-theme-surface1` classes
  implication: Component-side code is correct; the CSS layer is broken

## Resolution

root_cause: |
  The `@theme inline` block in `src/app.css` uses `<alpha-value>` placeholder syntax
  (a Tailwind v3 config feature) that is NOT processed by Tailwind v4's CSS-based theming.

  In v4, `@theme` values are treated as raw CSS custom property values. The literal string
  `<alpha-value>` passes through unprocessed into the compiled CSS, producing invalid
  color values like `rgb(var(--border) / <alpha-value>)` that browsers silently discard.

  Since ALL theme token utilities (border-theme-*, text-theme-*, bg-theme-*) are broken,
  the browser falls back to inherited/default colors (white text from the dark body,
  currentColor for borders which inherits white).

fix: |
  Replace the @theme inline definitions to NOT use the <alpha-value> placeholder.
  In Tailwind v4, for colors that need opacity modifier support with CSS variables
  containing space-separated RGB channels, use one of these approaches:

  Option A (recommended): Use `var()` with raw channels, no alpha template:
    --color-theme-border: var(--border);
  Then in utilities, Tailwind v4 will use color-mix() for opacity modifiers automatically.

  Option B: Define as `oklch()` or `rgb()` with actual values (not templates):
    --color-theme-border: rgb(var(--border));

verification: pending
files_changed:
  - src/app.css (the @theme inline block)
