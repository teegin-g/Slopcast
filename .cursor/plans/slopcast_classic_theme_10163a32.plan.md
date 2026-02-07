---
name: Slopcast classic theme
overview: Replace the existing `mario` theme with a new “Slopcast Classic” look matching the provided screenshot, while preserving theme switching by driving a distinct UI chrome (header/panels/KPIs/bevels) from shared CSS variables and reusable classes.
todos:
  - id: define-chrome-tokens
    content: Add chrome CSS variables + shared `.sc-*` classes in `styles/theme.css` with sensible defaults for existing themes.
    status: completed
  - id: replace-mario-theme
    content: Update `theme/themes.ts` and the `[data-theme='mario']` block in `styles/theme.css` to match the provided classic design (incl. chart/map palettes).
    status: completed
  - id: apply-chrome-classes
    content: Update `App.tsx` and key components to use the new semantic chrome classes for headers/panels/KPIs/buttons so the theme is structurally distinct.
    status: completed
  - id: verify-switching
    content: Run the app and verify theme switching + readability across all themes; fix any regressions and lints in edited files.
    status: completed
isProject: false
---

## Current theming (what we’ll build on)

- Theme switching already works by setting `document.documentElement.dataset.theme` in `[theme/ThemeProvider.tsx](/Users/teegingroves/Programming/Slopcast/theme/ThemeProvider.tsx)` (see `applyThemeToDOM`).
- Visual styling is mostly driven by CSS variables in `[styles/theme.css](/Users/teegingroves/Programming/Slopcast/styles/theme.css)`, consumed via Tailwind tokens configured in `[index.html](/Users/teegingroves/Programming/Slopcast/index.html)`.
- Charts/maps read per-theme palettes from `[theme/themes.ts](/Users/teegingroves/Programming/Slopcast/theme/themes.ts)`.

## Approach: “chrome tokens” + shared classes (keeps switchability, enables a genuinely different look)

To make the new theme structurally different (bevels, title bars, KPI tiles) without hardcoding per-theme component CSS, we’ll:

- Add a small set of **semantic UI chrome tokens** (CSS variables) that describe *UI parts*, not raw colors.
- Add a set of **shared CSS classes** that render those parts using the tokens.
- Update React components to use these shared classes for their main containers/headers/buttons.
- For existing themes, map the new chrome tokens to their current look so nothing regresses.

## Theme replacement

- Keep the theme id `**mario**` for backward compatibility (existing localStorage values still work).
- Update `mario` meta in `[theme/themes.ts](/Users/teegingroves/Programming/Slopcast/theme/themes.ts)` to reflect the new design (label/icon/description + chart/map palette).
- Replace the `[data-theme='mario']` block in `[styles/theme.css](/Users/teegingroves/Programming/Slopcast/styles/theme.css)` with the screenshot-matching token values.
- Make sure the theme matches the UI in `/Users/teegingroves/Programming/Slopcast/playground/slopcast mario theme.png` VERY THOROUGHLY MAKE SURE IT MATCHES

## Chrome tokens (additions to `styles/theme.css`)

Add new variables (defaults in `:root`, then per-theme overrides) such as:

- **Header**: `--header-bg-1`, `--header-bg-2`, `--header-border`, `--header-text` (rendered as a gradient)
- **Panel**: `--panel-bg`, `--panel-border`, `--panel-inset-hi`, `--panel-inset-lo`, `--panel-title-bg-1`, `--panel-title-bg-2`, `--panel-title-text`
- **KPI**: `--kpi-bg`, `--kpi-border`, `--kpi-title-bg-1`, `--kpi-title-bg-2`, `--kpi-value-text`
- **Buttons**: `--btn-primary-bg-1/2`, `--btn-primary-text`, `--btn-secondary-bg-1/2`, `--btn-secondary-text`
- **Radii**: `--radius-panel`, `--radius-kpi` (non-color vars; used only by CSS classes)

Then add shared classes that use those tokens:

- `.sc-header` (blue gradient bar like screenshot)
- `.sc-panel`, `.sc-panelTitlebar` (brown/orange framed modules with bevel/inset)
- `.sc-kpi`, `.sc-kpiTitlebar` and `.sc-kpiTile` (green/yellow KPI blocks)
- `.sc-btnPrimary`, `.sc-btnSecondary` (embossed buttons)

## Component updates (swap generic Tailwind “cards” for semantic chrome classes)

Update the main repeated UI surfaces to use the new classes:

- `[App.tsx](/Users/teegingroves/Programming/Slopcast/App.tsx)`
  - Header: replace current translucent surface header with `.sc-header`.
  - Major columns: swap key containers (`aside`, map frame, AI memo, KPI cards/tiles, charts frame) to `.sc-panel` / `.sc-kpi*` where appropriate.
- Sidebar modules:
  - `[components/GroupList.tsx](/Users/teegingroves/Programming/Slopcast/components/GroupList.tsx)`
  - `[components/Controls.tsx](/Users/teegingroves/Programming/Slopcast/components/Controls.tsx)`
- Center modules:
  - `[components/MapVisualizer.tsx](/Users/teegingroves/Programming/Slopcast/components/MapVisualizer.tsx)` (HUD badge + lasso button classes)
  - `[components/Charts.tsx](/Users/teegingroves/Programming/Slopcast/components/Charts.tsx)` (panel framing)
- Scenario/analysis modules:
  - `[components/ScenarioDashboard.tsx](/Users/teegingroves/Programming/Slopcast/components/ScenarioDashboard.tsx)`
  - `[components/SensitivityMatrix.tsx](/Users/teegingroves/Programming/Slopcast/components/SensitivityMatrix.tsx)`
  - `[components/ScenarioComparison.tsx](/Users/teegingroves/Programming/Slopcast/components/ScenarioComparison.tsx)`
  - `[components/CapexControls.tsx](/Users/teegingroves/Programming/Slopcast/components/CapexControls.tsx)`

The goal is **not** to restyle every nested element—just the shared surfaces/headers/buttons so the new theme reads like a different UI system.

## Palettes for charts and map (in `theme/themes.ts`)

Update the `mario` theme’s:

- **Chart palette**: red production curve + darker grid on black panel surface (to match the screenshot’s red chart).
- **Map palette**: darker grid on near-black map background, blue well dots, yellow/red selection accents.

## Test plan

- Run the app, switch themes using the header theme picker, and verify:
  - `mario` now renders the classic screenshot look (blue header, brown modules, green/yellow KPI blocks, black chart panels).
  - Other themes still look correct (their new chrome tokens map to their existing visuals).
  - Charts/tooltips remain readable across themes.

## Rollback safety

- Changes are isolated to `mario` tokens + additive chrome variables/classes; if needed, we can revert component class swaps incrementally without breaking theme switching.

