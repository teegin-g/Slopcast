# Theme System

This project keeps theme ownership in `src/theme`. UI shells, e2e helpers, and screenshot scripts should consume theme metadata from that layer instead of maintaining local maps.

The target architecture is "add one theme folder": a theme's definition, runtime tokens, metadata, and optional background registration live together under `src/theme/definitions/<theme-id>/`.

## Adding A Theme

1. Add the theme id to `KnownThemeId` in `src/theme/types.ts`.
2. Create `src/theme/definitions/<theme-id>/index.ts`.
3. Export a `ThemeDefinition` from that folder. Keep the export name stable and descriptive, usually the theme id in camel case.
4. Fill the required palettes and feature flags:
  - `chartPalette` for charts.
  - `mapPalette` for map wells, selection, and Mapbox overrides.
  - `features` for panel style, typography, spacing, glow, and classic-theme behavior.
5. Add runtime tokens in the same definition when the theme owns CSS variables:
  - `tokens` can be a single `ThemeTokenMap` or a mode-aware map such as `{ dark, light }`.
  - Prefer channel values for color tokens, e.g. `bgDeep: '10 31 24'`, because existing CSS uses `rgb(var(--bg-deep) / <alpha-value>)`.
  - Populate core tokens first: `bgDeep`, `bgSpace`, `surface1`, `surface2`, `border`, `cyan`, `magenta`, `lav`, `radius.panel`, `radius.inner`, and typography tokens.
6. Add optional visuals on the theme definition:
  - `BackgroundComponent` for animated or canvas backgrounds.
  - `atmosphereClass`, `headerAtmosphereClass`, and `atmosphericOverlays` for header/page atmosphere layers.
  - `pageOverlayClasses` for shell-level overlays such as `theme-aurora`.
  - `fxTheme` when cinematic/max FX controls apply.
7. Import the theme definition in `src/theme/registry.ts` and append it to `THEMES` in the intended UI order.
8. Set `hasLightVariant` when the theme supports light mode. `getUiThemeCases()` automatically adds a light case with a stable alias (`<id>-light`, except known preserved aliases such as `permian-noon`).
9. Add or update registry tests in `src/theme/registry.test.ts` for new metadata, variants, overlays, or aliases.
10. Add background-specific tests near the component when the theme introduces a non-trivial renderer.
11. Run screenshots through `npm run ui:shots` when visual coverage needs to be refreshed.

## Tokens And CSS

`src/theme/tokenRuntime.ts` applies runtime CSS variables from `ThemeDefinition.tokens` through `ThemeProvider`. The provider still sets `data-theme` and `data-mode`, so existing CSS selectors remain the full styling source of truth while tokens are populated theme by theme.

When switching themes or modes, the runtime clears token-managed inline variables before applying the next token set. This prevents stale values when moving from a tokenized theme to a CSS-only theme.

For now, `src/styles/theme.css` still contains the existing per-theme CSS blocks. Slate and Permian define representative runtime tokens; other themes can be migrated by adding tokens to their own definition folders. Do not duplicate new behavior in shell-local maps; add new metadata to `src/theme` first, then migrate CSS blocks to tokens in focused follow-up work.

## Verification

Use these checks for theme-system changes:

```bash
npm test -- src/theme src/components/permian
npm run typecheck
node -e "import('./scripts/theme-cases.mjs').then(async ({ loadUiThemeCases }) => { const cases = await loadUiThemeCases(); console.log(cases.map(c => c.alias || c.id).join(',')); })"
UI_FX_MODE=cinematic node --check scripts/ui-snapshots.mjs
```

Do not start dev servers for metadata-only verification.
