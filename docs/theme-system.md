# Theme System

This project keeps theme ownership in `src/theme`. UI shells, e2e helpers, and screenshot scripts should consume theme metadata from that layer instead of maintaining local maps.

## Adding A Theme

1. Add the theme id to `KnownThemeId` in `src/theme/types.ts`.
2. Add a `ThemeDefinition` in `src/theme/registry.ts` and include it in `THEMES`.
3. Fill the required palettes and feature flags:
  - `chartPalette` for charts.
  - `mapPalette` for map wells, selection, and Mapbox overrides.
  - `features` for panel style, typography, spacing, glow, and classic-theme behavior.
4. Add optional visuals on the theme definition:
  - `BackgroundComponent` for animated or canvas backgrounds.
  - `atmosphereClass`, `headerAtmosphereClass`, and `atmosphericOverlays` for header/page atmosphere layers.
  - `pageOverlayClasses` for shell-level overlays such as `theme-aurora`.
  - `fxTheme` when cinematic/max FX controls apply.
5. Set `hasLightVariant` when the theme supports light mode. `getUiThemeCases()` automatically adds a light case with a stable alias (`<id>-light`, except known preserved aliases such as `permian-noon`).
6. Add or update registry tests in `src/theme/registry.test.ts` for new metadata, variants, overlays, or aliases.
7. Add background-specific tests near the component when the theme introduces a non-trivial renderer.
8. Run screenshots through `npm run ui:shots` when visual coverage needs to be refreshed.

## Tokens And CSS

`src/theme/tokenRuntime.ts` is the migration path for applying runtime CSS variables from `ThemeDefinition.tokens`.

For now, `src/styles/theme.css` still contains the existing per-theme CSS blocks. Do not duplicate new behavior in shell-local maps; add new metadata to `src/theme` first, then migrate CSS blocks to tokens in focused follow-up work.

## Verification

Use these checks for theme-system changes:

```bash
npm test -- src/theme src/components/permian
npm run typecheck
node -e "import('./scripts/theme-cases.mjs').then(async ({ loadUiThemeCases }) => { const cases = await loadUiThemeCases(); console.log(cases.map(c => c.alias || c.id).join(',')); })"
```

Do not start dev servers for metadata-only verification.