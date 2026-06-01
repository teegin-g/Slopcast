# Theme System

This project keeps theme ownership in `src/theme`. UI shells, e2e helpers, and screenshot scripts should consume theme metadata from that layer instead of maintaining local maps.

The target architecture is "add one theme folder": a theme's definition, runtime tokens, metadata, and optional background registration live together under `src/theme/definitions/<theme-id>/`.

## Adding A Theme

1. Add the theme id to `KnownThemeId` in `src/theme/types.ts`.
2. Create `src/theme/definitions/<theme-id>/index.ts`.
3. Export a `ThemeDefinition` from that folder. Keep the export name stable and descriptive, usually the theme id in camel case.
4. Fill the required palettes, selector metadata, chrome traits, scene metadata, and feature flags:
  - `chartPalette` for charts.
  - `mapPalette` for map wells, selection, and Mapbox overrides.
  - `preview` for theme selector swatches, short labels, and a short theme tagline.
  - `iconDefinition` for the authored selector icon. Prefer inline SVG icons that use `currentColor`; keep the legacy `icon` emoji as the fallback.
  - `chrome` for density, panel style, radius, brand treatment, and navigation treatment. Classic-style themes should express their behavior here instead of adding new selector branches.
  - `scene` for renderer kind, FX support, fallback availability, WebGL requirements, pause behavior, and reduced-motion support.
  - `features` for current compatibility with panel style, typography, spacing, glow, and classic-theme behavior.
5. Add runtime tokens in the same definition when the theme owns CSS variables:
  - `tokens` can be a single `ThemeTokenMap` or a mode-aware map such as `{ dark, light }`.
  - Prefer channel values for color tokens, e.g. `bgDeep: '10 31 24'`, because existing CSS uses `rgb(var(--bg-deep) / <alpha-value>)`.
  - Populate core tokens first: `bgDeep`, `bgSpace`, `surface1`, `surface2`, `border`, `cyan`, `magenta`, `lav`, `radius.panel`, `radius.inner`, and typography tokens.
6. Add optional visuals on the theme definition:
  - `BackgroundComponent` for animated or canvas backgrounds.
  - `scene` for renderer metadata (`renderer`, FX support, WebGL requirements, reduced-motion behavior, pause-on-hidden behavior, and ownership of vignette/grain/overlays).
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

## Selector Metadata

The brand-area theme selector is registry-driven. Every registered theme should provide:

- `preview.swatch`, `preview.accent`, and `preview.surface` so the selector can show a compact visual read of the theme.
- `preview.shortLabel` and `preview.tagline` so rows can stay flavorful without becoming technical.
- `iconDefinition` with an SVG component when possible. The old `icon` emoji remains required as a fallback for compatibility.
- `chrome` traits instead of component-local theme conditionals.
- `scene` traits that match the existing background implementation. Use `renderer: 'none'` for themes without a scene, `svg` for SVG art, `canvas2d` for Canvas scenes, and `r3f` for React Three Fiber scenes. Remotion is not a live background renderer unless a future video-export workflow explicitly needs it.

## Renderer Lifecycle

`AppShell` owns background rendering through `ThemeSceneLayer`. Workspace pages should provide content and workspace state, not mount theme backgrounds or page overlays directly. This keeps scene layers, page overlays, FX classes, and fallback vignette behavior in one place and prevents duplicated Canvas/WebGL/SVG mounts on workspace routes.

Scene runtime hooks live in `src/theme/scene`:

- `useReducedMotionPreference()` centralizes `prefers-reduced-motion`.
- `usePageVisibilityPaused()` centralizes tab-hidden pause state.
- `useDeviceTier()` centralizes low/standard/high device checks, including WebGL probing when a renderer requires it.
- `useThemeSceneRuntime()` passes `{ themeId, effectiveMode, fxMode, reducedMotion, paused, deviceTier }` to scene components.

During migration, `getThemeScene()` adapts legacy `BackgroundComponent`, `fxTheme`, and overlay fields into a formal scene contract. Keep `BackgroundComponent` populated until all scenes have moved to explicit `scene.component` metadata.

Renderer components should clean up all `requestAnimationFrame`, media-query, resize, visibility, and observer listeners. Animated scenes should pause when `runtime.paused` is true and freeze or simplify motion when `runtime.reducedMotion` is true. Canvas/WebGL scenes that draw their own vignette or grain should set `ownsVignette` or `ownsGrain` so the shell does not stack extra effects over the art.

## Verification

Use these checks for theme-system changes:

```bash
npm test -- src/theme src/components/permian
npm run typecheck
node -e "import('./scripts/theme-cases.mjs').then(async ({ loadUiThemeCases }) => { const cases = await loadUiThemeCases(); console.log(cases.map(c => c.alias || c.id).join(',')); })"
UI_FX_MODE=cinematic node --check scripts/ui-snapshots.mjs
```

Do not start dev servers for metadata-only verification.