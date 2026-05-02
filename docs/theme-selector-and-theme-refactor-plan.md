# Slopcast Theme Selector And Theme System Refactor Plan

## Document Status

- Status: planning draft.
- Audience: implementers, reviewers, and future theme authors.
- Scope: Slopcast header theme selector, theme registry, theme renderer architecture, and targeted fixes for Hyperborea, Classic/Mario, Nocturne, and Synthwave.
- Source context: current code in `src/theme`, `src/components/slopcast/PageHeader.tsx`, `src/hooks/useSlopcastWorkspace.ts`, and the current background implementations.
- Design lens: Impeccable `critique` skill plus `frontend-design` guidance.
- Primary user goal: make the theme system feel intentional, centralized, expressive, and maintainable.
- Primary product goal: keep Slopcast cinematic and opinionated without letting each theme become a one-off implementation island.
- Non-goal: rewrite the whole Slopcast workspace UI.
- Non-goal: replace the existing data/economics product structure.
- Non-goal: introduce a second UI framework.
- Non-goal: make every theme use WebGL immediately.
- Non-goal: make Mario less visually distinct.
- Non-goal: flatten the themes into skins with no unique art direction.

## Executive Summary

- The root cause is not one bad theme.
- The root cause is a weak theme contract.
- Theme definitions contain useful metadata, but too much theme behavior still leaks into component branches, CSS selectors, and renderer-specific implementations.
- The current system is halfway between a token-driven theme registry and hand-built per-theme scenic art.
- That halfway state creates friction every time a theme needs a unique feature.
- The header exposes that problem through a separate theme icon bar that competes with primary navigation.
- Mario exposes it through `isClassicTheme`, `sc-*` branches, and large CSS blocks that bypass the normal token vocabulary.
- Hyperborea exposes it through a canvas renderer whose art primitives are not reusable, inspectable, or easy to tune.
- Nocturne exposes it through older visual direction and weaker foreground/background drama compared with newer themes.
- Synthwave exposes it through CSS-driven SVG animation that cannot easily express wave-like beam motion or richer light behavior.
- The fix is to formalize the theme contract into three layers: identity tokens, chrome tokens, and scene renderer capabilities.
- The selector should move into the brand area as a proper menu with theme name, SVG icon, description, active state, and keyboard support.
- Backgrounds should become registry-driven renderers with shared lifecycle utilities for motion, device tier, visibility pause, FX mode, and reduced-motion behavior.
- WebGL/R3F should be available as the high-control renderer path, but Canvas 2D and SVG should remain valid fallback or simpler renderer paths.
- The Permian R3F architecture is the best existing reference for the high-control direction.
- The new plan should migrate the riskiest contract issues first, then redesign each theme one at a time.

## Root Cause Diagnosis

- Root cause 001: theme identity is centralized, but theme execution is distributed.
- Root cause 002: `src/theme/registry.ts` knows the theme list, but not enough about how a theme should render, select, preview, or validate.
- Root cause 003: `ThemeDefinition` includes `BackgroundComponent`, but does not describe renderer type, capabilities, preview icon, quality levels, or fallback behavior.
- Root cause 004: `ThemeDefinition.features` is too coarse for the visual complexity now present in the app.
- Root cause 005: `isClassicTheme` is a hard branch rather than a set of explicit chrome capabilities.
- Root cause 006: page chrome, header atmosphere, app background, map palette, chart palette, and typography do not share a single theme QA contract.
- Root cause 007: the theme selector is implemented as a row of anonymous icons, so it does not express theme identity clearly.
- Root cause 008: the selector consumes scarce header space while the brand area remains underused.
- Root cause 009: current theme icons are emoji strings, which are fast but visually inconsistent and not brand-ownable.
- Root cause 010: backgrounds use multiple render strategies without a shared abstraction.
- Root cause 011: Synthwave uses inline SVG plus CSS animations.
- Root cause 012: Hyperborea uses imperative Canvas 2D.
- Root cause 013: Permian uses R3F with thoughtful fallbacks and lifecycle controls.
- Root cause 014: Mario uses Canvas 2D but is styled through Classic-specific CSS and branches.
- Root cause 015: Nocturne uses Canvas 2D but lacks the later theme craft and control strategy.
- Root cause 016: FX mode is class-based and theme-aware, but the supported controls are minimal.
- Root cause 017: `pageOverlayClasses` are rendered in `SlopcastPage.tsx`, but not in `AppShell.tsx`.
- Root cause 018: `AppShell.tsx` and `SlopcastPage.tsx` both know how to render `PageHeader` and background atmosphere.
- Root cause 019: the shell migration introduced two layout paths that can drift.
- Root cause 020: the theme system has docs saying "add one theme folder", but CSS and renderer ownership is still split.
- Root cause 021: new themes have no required visual spec format.
- Root cause 022: theme visuals can be added without a story, screenshot case, or renderer contract test.
- Root cause 023: performance constraints are documented for Permian but not generalized.
- Root cause 024: reduced-motion behavior is inconsistent across backgrounds.
- Root cause 025: device tier fallback is implemented for Permian but not available to Hyperborea, Nocturne, Mario, or Synthwave.
- Root cause 026: each background owns its own random generation and timing logic.
- Root cause 027: there is no common `useSceneClock`.
- Root cause 028: there is no common pause-on-hidden lifecycle hook for all scenic backgrounds.
- Root cause 029: there is no common low-end fallback decision tree.
- Root cause 030: there is no common visual acceptance baseline for "theme-native".
- Root cause 031: the UI currently confuses "theme" with "background".
- Root cause 032: theme identity should include colors, fonts, chrome, background, effects, icon, preview, and tone.
- Root cause 033: the registry should answer "how does this theme want to behave" rather than only "what label and palettes does it have".
- Root cause 034: HTML/CSS atmosphere overlays are not discoverable enough from the theme definition.
- Root cause 035: header overlays are defined as class strings, which are hard to validate and easy to orphan.
- Root cause 036: CSS blocks in `src/styles/theme.css` are long enough that theme behavior is difficult to audit.
- Root cause 037: Mario is not detached because it has a different aesthetic.
- Root cause 038: Mario is detached because it uses a hard-coded chrome fork instead of a formalized theme chrome variant.
- Root cause 039: Hyperborea's mammoths look wrong because the renderer is drawing symbolic shapes rather than a designed animal rig.
- Root cause 040: Synthwave beams feel weak because CSS opacity pulses do not model spatial wave movement.
- Root cause 041: Nocturne lacks pop because its focal elements are smaller, quieter, and less connected to the foreground UI.
- Root cause 042: the app has strong visual ambition, but the implementation lacks a theme art-direction pipeline.
- Root cause 043: the current system optimizes for adding a theme quickly, not refining one deeply.
- Root cause 044: theme art is not decomposed into reusable primitives.
- Root cause 045: theme QA is mostly file-level tests and broad UI scripts rather than per-theme visual contracts.
- Root cause 046: theme selector accessibility is weak because icon-only buttons rely on `title`.
- Root cause 047: the selector does not expose theme descriptions.
- Root cause 048: the selector does not preview the theme's background style.
- Root cause 049: the selector does not reveal FX capability or light-mode capability.
- Root cause 050: the selector does not scale elegantly as the theme count grows.

## Design Critique Verdict

- Anti-pattern verdict: partially failing the AI-slop test.
- The app's themes are much more distinctive than generic SaaS UI, so the failure is not aesthetic blandness.
- The failure is architectural inconsistency that makes some surfaces feel designed and others feel bolted on.
- The current theme selector feels like a prototype control, not an authored part of the brand.
- The icon-only pill row reads as a settings toolbar.
- The requested logo-area dropdown is directionally correct because theme is part of Slopcast identity.
- The selector should feel like changing the "world" of the app, not clicking a color swatch.
- The header currently has too many equal-weight controls.
- The brand lockup, navigation, workspace tabs, and theme selector all compete inside one row.
- A menu anchored to the logo reduces visual competition.
- A menu anchored to the logo also makes theme switching feel branded.
- The Mario theme has memorable personality.
- The Mario theme loses design maturity when its specialness requires bypasses.
- Hyperborea has a good concept, but the mammoth implementation undermines the premium feel.
- A mammoth that reads as an elephant in shoes breaks emotional trust.
- Nocturne has coherent colors, but not enough silhouette drama or foreground effect.
- Synthwave has the right concept, but beam motion is too mechanical and too backgrounded.
- The app should avoid generic neon-on-dark defaults by making each theme's motion and composition concept-specific.
- WebGL should be introduced as an art-control tool, not as tech spectacle.
- The best target is "theme-native renderer" rather than "all themes are 3D".

## What Is Working

- Working 001: `src/theme/registry.ts` already centralizes theme order and lookup.
- Working 002: `ThemeDefinition` already carries chart palette, map palette, feature flags, background component, overlays, and FX support.
- Working 003: `ThemeProvider` already sets `data-theme` and `data-mode`.
- Working 004: `tokenRuntime.ts` already supports runtime token application.
- Working 005: `docs/theme-system.md` already defines the "add one theme folder" direction.
- Working 006: Permian proves the project can support R3F, device tier checks, fallback branches, reduced motion, and visual stories.
- Working 007: the package already includes `three`, `@react-three/fiber`, `@react-three/drei`, and postprocessing libraries.
- Working 008: `useSlopcastWorkspace.ts` already resolves theme, FX mode, atmosphere classes, and background components in one place.
- Working 009: existing theme IDs and screenshot cases are stable.
- Working 010: the project has UI audit scripts and Storybook infrastructure.
- Working 011: theme-specific map palettes keep domain UI aligned with visual theme.
- Working 012: chart palettes are not hard-coded inside chart components.
- Working 013: the app already has a cinematic design mandate in project docs.
- Working 014: backgrounds are lazy-loaded, limiting initial bundle damage.
- Working 015: most themes use the same high-level background mount point.
- Working 016: the theme system already tolerates light variants.
- Working 017: CSS custom properties allow gradual migration from CSS blocks into registry tokens.
- Working 018: FX mode has a storage/query mechanism.
- Working 019: the themes already have app subtitles that can be reused in the selector menu.
- Working 020: page and header atmosphere classes already give a bridge between component chrome and background art.

## Priority Issues

- Issue 001: the theme selector is visually and semantically misplaced.
- Issue 002: the theme registry is missing a complete UI identity contract.
- Issue 003: `isClassicTheme` is too blunt and keeps Mario outside the normal system.
- Issue 004: backgrounds lack a shared renderer lifecycle and capability API.
- Issue 005: per-theme art direction is not captured in implementable specs.
- Issue 006: CSS selectors remain the real source of truth for many theme details.
- Issue 007: the old and new shell paths can drift.
- Issue 008: visual QA is not theme-specific enough.
- Issue 009: icons are emoji rather than theme-owned SVG marks.
- Issue 010: theme FX intensity does not map to renderer-level feature controls consistently.

## Target Architecture

- Target 001: `ThemeDefinition` remains the top-level theme object.
- Target 002: each theme folder owns metadata, tokens, chrome behavior, background renderer registration, and selector icon.
- Target 003: renderer implementations stay in `src/components` or move under `src/theme/definitions/<theme>/scene` if ownership becomes clearer.
- Target 004: the shell should render a single `ThemeSceneLayer`.
- Target 005: the header should render a `ThemeSelectorMenu` inside the brand section.
- Target 006: each theme should define a `ThemeIdentity` block.
- Target 007: each theme should define a `ThemeChrome` block.
- Target 008: each theme should define a `ThemeScene` block.
- Target 009: each theme should define a `ThemeQuality` block.
- Target 010: `ThemeDefinition.icon` should migrate from `string` emoji to an SVG icon component or serializable icon key.
- Target 011: keep backwards compatibility with string icons during migration.
- Target 012: expose a selector-facing `preview` object for gradient, accent, and description.
- Target 013: expose `capabilities` such as `supportsFx`, `supportsLightMode`, `renderer`, `requiresWebGL`, and `hasFallback`.
- Target 014: replace `isClassicTheme` with explicit chrome traits over time.
- Target 015: preserve `isClassicTheme` temporarily as a derived compatibility field if needed.
- Target 016: formalize renderer types: `none`, `css`, `svg`, `canvas2d`, `r3f`.
- Target 017: formalize renderer quality tiers: `static`, `cinematic`, `max`.
- Target 018: standardize `reducedMotion` behavior across all renderer types.
- Target 019: standardize `paused` behavior across all renderer types.
- Target 020: standardize low-end fallback behavior for renderer types that need it.
- Target 021: make `fxClass` an implementation detail, not the main renderer API.
- Target 022: renderer components should receive a scene runtime prop instead of reading DOM classes directly where practical.
- Target 023: the theme selector should consume only registry data.
- Target 024: no theme selector data should live in `PageHeader.tsx`.
- Target 025: no selector should rely on `title` as the only accessible label.
- Target 026: no theme should require editing `PageHeader.tsx`.
- Target 027: no theme should require editing shell code unless the theme system itself changes.
- Target 028: every theme should have a Storybook or visual inspection story for its scene.
- Target 029: every theme should have at least one screenshot case.
- Target 030: every theme renderer should have a reduced-motion acceptance check.

## Proposed Type Additions

- Add `ThemeIcon` support without breaking current emoji usage.
- Add `ThemePreview` for selector and docs.
- Add `ThemeChrome` for header/sidebar/panel behavior.
- Add `ThemeSceneConfig` for renderer behavior.
- Add `ThemeCapabilitySet` for feature discovery.
- Add `ThemeFxConfig` for cinematic/max tuning.
- Add `ThemeA11yConfig` for contrast and motion intent.

```ts
type ThemeRendererKind = 'none' | 'css' | 'svg' | 'canvas2d' | 'r3f';
```

```ts
type ThemeIconDefinition =
  | { kind: 'emoji'; value: string }
  | { kind: 'svg'; component: React.ComponentType<React.SVGProps<SVGSVGElement>> };
```

```ts
interface ThemePreview {
  swatch: string;
  accent: string;
  surface: string;
  shortLabel: string;
  tagline: string;
}
```

```ts
interface ThemeChrome {
  density: 'comfortable' | 'compact' | 'dense';
  panelStyle: PanelStyle;
  radius: 'sharp' | 'soft' | 'round' | 'custom';
  brandTreatment: 'wordmark' | 'badge' | 'classic-cartridge' | 'cinematic';
  navTreatment: 'tabs' | 'pills' | 'classic-buttons';
}
```

```ts
interface ThemeSceneConfig {
  renderer: ThemeRendererKind;
  component?: React.ComponentType<ThemeSceneRuntimeProps>;
  fallbackComponent?: React.ComponentType<ThemeSceneRuntimeProps>;
  supportsFx: boolean;
  requiresWebGL: boolean;
  pauseWhenHidden: boolean;
  respectsReducedMotion: boolean;
}
```

```ts
interface ThemeSceneRuntimeProps {
  themeId: ThemeId;
  effectiveMode: ThemeVariant;
  fxMode: FxMode;
  reducedMotion: boolean;
  paused: boolean;
  deviceTier: 'low' | 'standard' | 'high';
}
```

```ts
interface ThemeDefinition {
  identity?: ThemeIdentity;
  preview?: ThemePreview;
  chrome?: ThemeChrome;
  scene?: ThemeSceneConfig;
}
```

## Implementation Principle: Contract First, Art Second

- Do not start by rebuilding Hyperborea in 3D.
- Start by making a renderer contract that Hyperborea can move into.
- Do not start by deleting Mario branches.
- Start by expressing Mario's classic chrome as formal chrome traits.
- Do not start by pushing every token into TypeScript.
- Start with the tokens needed by selector, shell, panel chrome, and renderer preview.
- Do not start by making the selector visually elaborate.
- Start by making it semantically correct, accessible, and registry-driven.
- Do not use WebGL as a universal fix.
- Use WebGL where shape, lighting, parallax, or procedural control justify it.
- Keep SVG where the art is vector, flat, and easy to animate.
- Keep Canvas 2D where scenes are painterly and low-cost.
- Add R3F where character rigging, beams, god rays, shader motion, or real depth matter.

## Theme Selector Redesign

- Selector goal 001: move theme selection into the logo/brand cluster.
- Selector goal 002: replace icon-only buttons with a dropdown trigger.
- Selector goal 003: show current theme name in the trigger.
- Selector goal 004: show current theme SVG icon in the trigger.
- Selector goal 005: keep app name visible and dominant.
- Selector goal 006: make the theme switch feel like choosing a world.
- Selector goal 007: keep header navigation focused on workflow.
- Selector goal 008: support keyboard navigation.
- Selector goal 009: support screen readers.
- Selector goal 010: support mobile without hiding theme access.

## Theme Selector UX Model

- Trigger location: upper-left brand section.
- Trigger label: current theme label.
- Trigger visual: theme icon, theme label, small chevron.
- Trigger secondary line: current `appSubtitle` can remain under the wordmark.
- Menu item primary text: theme label.
- Menu item secondary text: theme description or tagline.
- Menu item icon: theme-owned SVG icon.
- Menu item preview: miniature color strip or radial swatch.
- Active state: checkmark plus stronger surface.
- Disabled state: not expected for current themes.
- Grouping: optional future grouping by "Core", "Cinematic", "Classic".
- FX indicator: small "FX" chip for `fxTheme` themes.
- Light indicator: small "Light" chip for `hasLightVariant` themes.
- Description tone: short, flavorful, not technical.
- Mobile behavior: full-width popover or sheet anchored below header.
- Desktop behavior: compact popover below brand lockup.
- Escape behavior: closes menu and returns focus to trigger.
- Click outside behavior: closes menu.
- Theme selection behavior: apply immediately and close menu.
- Persistence behavior: existing `setThemeId` storage remains.
- Analytics behavior: optional future event `theme_changed`.

## Theme Selector Component Plan

- Create `src/components/slopcast/ThemeSelectorMenu.tsx`.
- Keep it headless enough to use in Auth page later.
- Props should accept `theme`, `themes`, `themeId`, `setThemeId`, and `isClassic`.
- Prefer `ThemeId` types over `string`.
- Avoid importing `useTheme()` in the component unless it becomes globally reusable.
- Render a native button as trigger.
- Render a semantic menu list or listbox.
- Use `aria-haspopup="listbox"` if selection behavior is listbox-like.
- Use `aria-expanded`.
- Use `aria-controls`.
- Use `role="listbox"` and `role="option"` if arrow-key navigation is implemented.
- Use roving index for keyboard navigation.
- Support Enter and Space to select.
- Support ArrowDown and ArrowUp to move.
- Support Home and End.
- Support Escape to close.
- Keep focus ring visible.
- Keep minimum touch target `44px`.
- Keep trigger compact on desktop.
- Let the label truncate on narrow widths.
- Use `rounded-inner` inside non-classic theme.
- Use classic button treatment for Classic theme through chrome traits.
- Avoid tooltip-only labels.
- Avoid emoji rendering as the final icon system.
- Temporarily support emoji fallback.
- Add tests for opening, closing, selecting, and keyboard navigation.
- Add one Storybook story with all themes.
- Add one story forcing narrow width.
- Add one story forcing Classic.
- Add one story forcing reduced motion if animations are added.

## Theme Selector Visual Direction

- The trigger should look like part of the Slopcast wordmark, not a settings chip.
- The icon should be small but authored.
- The menu should feel like a "world selector".
- Each row should have enough surface contrast to scan quickly.
- The active row should be immediately obvious without relying only on color.
- The selector should avoid generic glassmorphism if the theme already uses glass heavily.
- The selector should use the theme's own accent color sparingly.
- The menu surface should not become another competing dashboard card.
- On Synthwave, let the selected row glow slightly.
- On Hyperborea, use frosted surface and icy edge.
- On Nocturne, use warm moon accent against blue-black.
- On Classic/Mario, use a cartridge-like beveled menu.
- On Slate, keep it crisp and utilitarian.
- On Permian, use industrial amber/teal cues.
- On Tropical, use softer lagoon/coral cues.
- On Stormwatch, use ember/cold rain cues.

## Theme Icons Plan

- Replace emoji icons over time with inline SVG components.
- Use a `ThemeIcon` registry next to theme definitions.
- Each icon should be 20x20 or 24x24 viewBox.
- Each icon should be monochrome-capable.
- Each icon should accept `className`.
- Each icon should use `currentColor` unless multi-color is intentional.
- Each icon should have no embedded text.
- Each icon should avoid raster images.
- Each icon should be distinct at 16px.
- Slate icon: angular office tower or ledger slab.
- Synthwave icon: striped sun with horizon beam.
- Tropical icon: palm arc plus lagoon sun.
- Nocturne icon: crescent over ridge.
- Stormwatch icon: storm cloud with oilfield lamp.
- Classic/Mario icon: beveled block, not copyrighted Mario imagery.
- Hyperborea icon: mammoth head or tusk arc with snowflake.
- Permian icon: pumpjack silhouette or derrick.
- Do not use protected Nintendo asset shapes.
- Keep Classic inspired by platformer visual language, not a direct Mario mark.
- Store icons in `src/theme/icons.tsx` or per-theme `Icon.tsx`.
- Prefer per-theme ownership if icons become detailed.
- Add snapshot tests only if icon rendering is stable enough.
- Add visual review in Storybook.

## Header Layout Plan

- Current issue: `PageHeader.tsx` ends with a separate `themes.map()` icon pill row.
- Remove that row after `ThemeSelectorMenu` is in place.
- Move selector into the brand cluster near the app logo.
- Keep app name as the largest text in the brand cluster.
- Make the theme selector a secondary control below or beside the wordmark.
- Avoid pushing primary navigation to the right on medium screens.
- Ensure `DesignWorkspaceTabs` remains visible when in dashboard mode.
- Ensure mobile header does not become three stacked control rows.
- Use container-aware wrapping if needed.
- Preserve existing HUB, DESIGN, SCENARIOS actions.
- Consider renaming UI text later, but do not mix that into this refactor.
- Keep `onNavigateHub` behavior unchanged.
- Keep `viewMode` behavior unchanged.
- Keep `designWorkspace` behavior unchanged.
- Keep current header atmosphere overlays working.
- Add tests around the absence of the old icon bar.
- Add tests for selector placement within brand region.

## App Shell Consolidation Plan

- Current issue: `SlopcastPage.tsx` renders background and page overlays.
- Current issue: `AppShell.tsx` renders background but not `pageOverlayClasses`.
- Current issue: both render `PageHeader`.
- Choose one shell path as the long-term owner.
- Long-term owner should be `AppShell.tsx`.
- `SlopcastPage.tsx` should provide content and workspace state.
- `ThemeSceneLayer` should render the background and page overlays.
- `ThemeSceneLayer` should know about `BackgroundComponent`, `pageOverlayClasses`, `fxClass`, and scene runtime.
- `AppShell.tsx` should render `ThemeSceneLayer`.
- `SlopcastPage.tsx` should stop rendering background directly once migration is complete.
- Add an `AppShell` prop for `pageOverlayClasses`.
- Update `AppShell.test.tsx` to include `pageOverlayClasses`.
- Add a test that Hyperborea page overlay renders through `AppShell`.
- Remove duplicated background mounting.
- Verify no background is mounted twice in workspace routes.
- Keep z-index layering stable.
- Keep background at fixed `z-0`.
- Keep vignette behavior intentional.
- Avoid stacking vignette on themes whose renderer already draws one.

## Theme Renderer Abstraction Plan

- Create `src/theme/scene/types.ts`.
- Create `src/theme/scene/ThemeSceneLayer.tsx`.
- Create `src/theme/scene/useThemeSceneRuntime.ts`.
- Create `src/theme/scene/useReducedMotionPreference.ts` or reuse Permian utility.
- Create `src/theme/scene/usePageVisibilityPaused.ts` or reuse Permian utility.
- Create `src/theme/scene/useDeviceTier.ts` or move Permian utility to shared theme scene.
- Keep imports acyclic.
- `ThemeSceneLayer` should accept the active `ThemeDefinition`.
- `ThemeSceneLayer` should accept `fxMode`.
- `ThemeSceneLayer` should derive runtime props.
- `ThemeSceneLayer` should render the chosen component or fallback.
- `ThemeSceneLayer` should render `pageOverlayClasses`.
- `ThemeSceneLayer` should render global `Vignette` only when appropriate.
- `ThemeSceneConfig` should declare whether the scene owns its vignette.
- `ThemeSceneConfig` should declare whether the scene owns grain.
- `ThemeSceneConfig` should declare whether the scene owns atmospheric overlays.
- Avoid every background checking DOM classes.
- Prefer explicit `fxMode` prop.
- Keep DOM class fallback during migration.
- Migrate Permian first because it already has the shape.
- Migrate Synthwave second because it needs more dynamic beams.
- Migrate Hyperborea third because it needs animal rig improvements.
- Migrate Nocturne fourth because it is an aesthetic redesign.
- Migrate Mario fifth because it has the most chrome coupling.

## Renderer Technology Decision Matrix

- Use CSS only for simple color/token atmosphere.
- Use SVG when crisp vector composition and path-level animation are enough.
- Use Canvas 2D when painterly procedural scenes are enough and performance must be low.
- Use R3F/WebGL when depth, lighting, shaders, rigging, particles, or controllable beams matter.
- Use Remotion only for authored video generation or timeline-export workflows.
- Do not use Remotion for live app backgrounds unless there is a specific reason.
- Use Three.js directly only when R3F abstractions become limiting.
- Prefer R3F for React integration.
- Prefer shader materials for wave-like beams and atmospheric distortion.
- Prefer instanced meshes for repeated background objects.
- Prefer sprites/billboards for distant art where geometry is wasteful.
- Use 2D fallback for low-end devices.
- Cap DPR for WebGL scenes.
- Pause animation when tab hidden.
- Freeze or greatly simplify animation under reduced motion.
- Avoid CPU-heavy procedural paths every frame.
- Precompute static geometry and paths.
- Keep all animations driven by a single clock.
- Avoid nested `requestAnimationFrame` loops inside subcomponents.

## Shared Scene Runtime Requirements

- Runtime 001: active theme ID.
- Runtime 002: effective mode.
- Runtime 003: FX mode.
- Runtime 004: reduced motion.
- Runtime 005: paused.
- Runtime 006: device tier.
- Runtime 007: viewport size if needed.
- Runtime 008: DPR cap.
- Runtime 009: visibility state.
- Runtime 010: renderer fallback status.
- Runtime 011: debug override hooks for Storybook.
- Runtime 012: deterministic seeds for stable screenshots.
- Runtime 013: no random values generated on every render unless intentionally animated.
- Runtime 014: no layout-affecting animation.
- Runtime 015: no blocking image/font loads.
- Runtime 016: no unbounded particles.
- Runtime 017: no unmanaged global event listeners.
- Runtime 018: cleanup all RAF loops.
- Runtime 019: cleanup resize listeners.
- Runtime 020: cleanup media query listeners.

## Theme Registry Refactor Steps

- Step 001: add new optional fields to `ThemeDefinition`.
- Step 002: keep existing fields to avoid broad breakage.
- Step 003: define default adapters from old fields to new fields.
- Step 004: add tests for adapter behavior.
- Step 005: add `getThemeScene(theme)` helper.
- Step 006: add `getThemeChrome(theme)` helper.
- Step 007: add `getThemePreview(theme)` helper.
- Step 008: add `getThemeIcon(theme)` helper.
- Step 009: update existing themes with preview metadata.
- Step 010: add SVG icons incrementally.
- Step 011: update theme system docs.
- Step 012: migrate `BackgroundComponent` usage to `theme.scene.component`.
- Step 013: leave `BackgroundComponent` populated during migration.
- Step 014: add a test that all registered themes have selector preview metadata.
- Step 015: add a test that all registered themes have accessible labels.
- Step 016: add a test that `fxTheme` and `scene.supportsFx` stay in sync.
- Step 017: add a test that WebGL scenes have fallback declared.
- Step 018: add a test that renderer kind is one of the allowed values.
- Step 019: add a test that `isClassicTheme` only appears in compatibility checks.
- Step 020: update docs to say theme authors must add icon, preview, chrome, and scene metadata.

## Mario Classic Refactor

- Diagnosis 001: Mario is visually special, but implementation treats it as an exception.
- Diagnosis 002: `isClassicTheme` branches in components encode Classic as a separate UI mode.
- Diagnosis 003: `sc-*` classes are valuable but disconnected from token contract.
- Diagnosis 004: Mario should remain classic, tactile, and playful.
- Diagnosis 005: Mario should not depend on one-off branches in every component.
- Plan 001: rename user-facing label from `Classic` only if desired, but keep theme ID `mario` for compatibility.
- Plan 002: keep ID `mario` unless a migration strategy is explicitly accepted.
- Plan 003: introduce `theme.chrome.brandTreatment = 'classic-cartridge'`.
- Plan 004: introduce `theme.chrome.navTreatment = 'classic-buttons'`.
- Plan 005: introduce `theme.chrome.panelStyle = 'solid'` or `glass` based on actual desired classic feel.
- Plan 006: map `isClassicTheme` to `chrome` in helper functions.
- Plan 007: replace direct `isClassic` branches in new code with chrome trait decisions.
- Plan 008: gradually update shared components to use token/chrome helpers.
- Plan 009: keep `sc-*` CSS as a named chrome recipe.
- Plan 010: document `sc-*` as Classic chrome primitives.
- Plan 011: move Mario-specific CSS variables from `theme.css` into `mario` tokens where possible.
- Plan 012: leave complex CSS selectors in CSS until token migration is safe.
- Plan 013: ensure Mario chart and map palettes remain explicit.
- Plan 014: create a Classic SVG icon.
- Plan 015: create a Classic selector preview.
- Plan 016: make the Classic background render through the same `ThemeSceneLayer`.
- Plan 017: route Mario FX through shared scene runtime.
- Plan 018: add reduced-motion controls to `MarioOverworldBackground`.
- Plan 019: add page visibility pause to `MarioOverworldBackground`.
- Plan 020: add Storybook for Classic background with cinematic/max modes.
- Plan 021: add tests that Classic no longer needs selector-specific header code.
- Plan 022: preserve the visual punch of the theme during architecture migration.
- Plan 023: do not flatten Classic into Slate with bright colors.
- Plan 024: treat Classic as a first-class theme with unique chrome.
- Plan 025: avoid Nintendo-specific copyrighted imagery in icons or backgrounds.

## Hyperborea Mammoth Fix

- Diagnosis 001: current mammoth is built from simple ellipses, quadratic paths, and procedural legs.
- Diagnosis 002: the long-stick-feet issue comes from leg geometry and foot plant logic producing thin vertical strokes at awkward scales.
- Diagnosis 003: the body silhouette is not woolly enough.
- Diagnosis 004: the head/trunk/tusk silhouette reads more elephant than mammoth.
- Diagnosis 005: mammoths need a domed shoulder, sloping back, shaggy belly, short heavy legs, and curved tusks.
- Diagnosis 006: feet should be broad but integrated, not shoe-like.
- Diagnosis 007: current foreground animals are too symbolic for the premium theme ambition.
- Short-term fix 001: adjust Canvas 2D mammoth drawing before full renderer migration.
- Short-term fix 002: reduce leg length.
- Short-term fix 003: increase leg thickness.
- Short-term fix 004: draw legs as tapered filled shapes instead of strokes.
- Short-term fix 005: add shaggy fur fringe along belly.
- Short-term fix 006: add shoulder hump larger than rear.
- Short-term fix 007: lower and shorten trunk.
- Short-term fix 008: curve tusks upward and forward.
- Short-term fix 009: add small ear and head mass distinct from trunk.
- Short-term fix 010: keep feet rounded and partially hidden by snow.
- Short-term fix 011: add snow occlusion band over foot bases.
- Short-term fix 012: reduce stride amplitude.
- Short-term fix 013: slow walk cycle.
- Short-term fix 014: keep foot plant but clamp max foot-body distance.
- Short-term fix 015: ensure wrapped animals reset leg contacts cleanly.
- Medium-term fix 001: extract mammoth into `src/components/hyperborea/Mammoth2D.ts`.
- Medium-term fix 002: make mammoth path data declarative.
- Medium-term fix 003: add story for mammoth silhouette at multiple sizes.
- Medium-term fix 004: add a reduced-motion static mammoth pose.
- Medium-term fix 005: add deterministic pose controls for visual QA.
- Long-term fix 001: consider R3F billboard/mesh mammoth if richer animation is needed.
- Long-term fix 002: build mammoth from layered sprite parts or low-poly meshes.
- Long-term fix 003: use simple skeletal rig only if it improves control.
- Long-term fix 004: avoid over-engineering animal anatomy for a background element.
- Long-term fix 005: use WebGL for parallax, snow, aurora, and lighting if Hyperborea becomes a hero theme.

## Hyperborea R3F Direction

- Scene goal 001: arctic village with mammoth procession, aurora, snow, and distant cold light.
- Scene goal 002: mammoths should read correctly even through UI glass.
- Scene goal 003: keep foreground silhouettes slow and dignified.
- Scene goal 004: avoid cartoony elephant proportions.
- Scene goal 005: keep cold palette with warm window contrast.
- R3F element 001: SkyDome gradient.
- R3F element 002: aurora ribbon shader.
- R3F element 003: instanced snow particles.
- R3F element 004: parallax mountain planes.
- R3F element 005: village silhouette billboards.
- R3F element 006: warm window emissive quads.
- R3F element 007: mammoth sprite rigs or low-poly silhouettes.
- R3F element 008: foreground snow drift mesh.
- R3F element 009: vignette and cold bloom.
- R3F element 010: optional moon/sun source.
- Fallback 001: existing Canvas 2D scene after mammoth fixes.
- Fallback 002: static SVG/Canvas frame under reduced motion.
- Fallback 003: reduce snow particle count on low-end devices.
- Acceptance 001: mammoth silhouette identifiable at desktop and laptop sizes.
- Acceptance 002: no stick-like legs.
- Acceptance 003: no shoe-like feet.
- Acceptance 004: tusks visible but not cartoonishly large.
- Acceptance 005: snow does not obscure UI text.
- Acceptance 006: background remains atmospheric, not distracting.

## Nocturne Theme Redesign

- Diagnosis 001: Nocturne is older and less visually assertive than Permian or Hyperborea.
- Diagnosis 002: the moon is small relative to the emotional role it should play.
- Diagnosis 003: aurora bands are present but too decorative.
- Diagnosis 004: foreground silhouettes do not produce enough depth.
- Diagnosis 005: the theme lacks a memorable "one thing".
- Diagnosis 006: compared to newer themes, it lacks a cinematic foreground event.
- Direction 001: make Nocturne "moonlit alpine war room".
- Direction 002: build around a large off-center moon.
- Direction 003: make the moonlight visibly rake across ridge planes.
- Direction 004: add slow aurora curtains with stronger color separation.
- Direction 005: introduce foreground pine or ridge silhouettes.
- Direction 006: add drifting fog at the horizon.
- Direction 007: add occasional meteor or aircraft beacon only in max FX.
- Direction 008: add warm camp/rig lights in the lower third.
- Direction 009: tie warm amber accents to UI highlights.
- Direction 010: keep the body UI readable by placing drama behind the top and side voids.
- Direction 011: avoid turning Nocturne into Synthwave.
- Direction 012: use painterly moonlight rather than neon grid energy.
- Direction 013: give the theme a stronger heading type personality.
- Direction 014: use Cormorant or another existing heading font deliberately.
- Direction 015: use the app subtitle "Night Operations" in selector copy.
- Short-term fix 001: enlarge moon glow.
- Short-term fix 002: increase horizon haze contrast.
- Short-term fix 003: add stronger ridge parallax.
- Short-term fix 004: add foreground silhouettes.
- Short-term fix 005: tune header atmosphere to be less faint.
- Medium-term fix 001: extract Nocturne scene primitives.
- Medium-term fix 002: add Storybook controls for moon size, aurora intensity, and fog.
- Long-term fix 001: migrate to R3F if moon rays, volumetric fog, or parallax depth justify it.

## Synthwave Beam Fix

- Diagnosis 001: current foreground beams are vertical SVG rectangles.
- Diagnosis 002: current motion is opacity-only via `swBeamSweep`.
- Diagnosis 003: opacity-only animation cannot feel like beams moving as waves.
- Diagnosis 004: beams need phase-shifted geometry, not just flicker.
- Diagnosis 005: sun rays are rotating as a group, which can feel mechanical.
- Diagnosis 006: foreground beams are not prominent enough relative to grid and sun.
- Short-term SVG fix 001: replace vertical rect beams with tapered polygon or path beams.
- Short-term SVG fix 002: define multiple beam groups emanating from sun center.
- Short-term SVG fix 003: animate each path using `transform: skewX`, `scaleX`, and opacity.
- Short-term SVG fix 004: add CSS variables per beam for phase and intensity.
- Short-term SVG fix 005: increase gradient stop opacity.
- Short-term SVG fix 006: use blur filter carefully to make beams luminous.
- Short-term SVG fix 007: add `mix-blend-mode: screen` if it does not harm browser consistency.
- Short-term SVG fix 008: add max FX mode with wider beams.
- Short-term SVG fix 009: respect reduced motion by freezing beam paths.
- Medium-term fix 001: move Synthwave from pure SVG/CSS to R3F or Canvas shader for beam motion.
- Medium-term fix 002: represent beams as triangle meshes from sun to foreground.
- Medium-term fix 003: apply vertex shader sine displacement.
- Medium-term fix 004: apply fragment shader flicker/noise.
- Medium-term fix 005: use additive blending.
- Medium-term fix 006: keep the existing SVG as fallback.
- Medium-term fix 007: use R3F only if performance is acceptable.
- Long-term fix 001: build a Synthwave scene renderer with procedural sun, grid, mountains, and beams.
- Long-term fix 002: use shader-based horizon glow.
- Long-term fix 003: use one scene clock for all effects.
- Long-term fix 004: expose beam intensity via FX mode.
- Acceptance 001: beams visibly emanate from the sun.
- Acceptance 002: beams travel toward foreground as waves.
- Acceptance 003: flicker feels dynamic but not chaotic.
- Acceptance 004: reduced motion keeps beams static.
- Acceptance 005: UI remains readable over beams.
- Acceptance 006: max FX is dramatic but not exhausting.

## Synthwave R3F Beam Design

- Geometry 001: create 10-16 beam meshes.
- Geometry 002: each beam is a long tapered plane.
- Geometry 003: source point aligns around sun center.
- Geometry 004: destination spreads across foreground grid.
- Geometry 005: each beam has width, phase, color, and speed.
- Shader 001: vertex shader displaces beam vertices perpendicular to beam axis.
- Shader 002: displacement uses sine plus low-frequency noise.
- Shader 003: amplitude grows toward foreground.
- Shader 004: fragment shader fades beam from source to foreground.
- Shader 005: fragment shader applies flicker with smoothed noise.
- Shader 006: fragment shader adds scanline interference.
- Shader 007: max FX increases opacity and amplitude.
- Shader 008: cinematic FX keeps beams restrained.
- Shader 009: reduced motion sets time to zero.
- Shader 010: low-end fallback uses static SVG gradients.
- Composition 001: keep sun as focal anchor.
- Composition 002: let beams cross the grid but not cover data panels.
- Composition 003: use mask or layout-aware opacity if needed.
- Composition 004: avoid beam contrast under text-heavy economics panels.

## Nocturne Pop Ideas

- Idea 001: moon as a large off-center disc partially hidden by ridge.
- Idea 002: aurora as vertical curtain rather than only horizontal lines.
- Idea 003: cold-to-warm color split from top sky to horizon lamps.
- Idea 004: foreground pine silhouettes framing left and right.
- Idea 005: low fog bands crossing behind panels.
- Idea 006: distant rig lights or cabin windows in the valley.
- Idea 007: subtle moon rays crossing the page diagonally.
- Idea 008: meteor streak only in max FX.
- Idea 009: star twinkle grouped by depth.
- Idea 010: mountain contours catching moonlight.
- Idea 011: header atmosphere with visible moon sliver.
- Idea 012: selector icon as crescent over ridge.
- Idea 013: stronger warm accent for active navigation.
- Idea 014: slightly more editorial type hierarchy.
- Idea 015: reduce generic cyan glow.
- Idea 016: let amber and moon-pale colors own the theme.
- Idea 017: keep panels darker and quieter so the moon reads.
- Idea 018: add parallax on scroll only if it does not distract.
- Idea 019: add snow or mist sparingly, not as Hyperborea duplicate.
- Idea 020: make the background memorable in screenshots.

## Hyperborea Mammoth Anatomy Checklist

- Anatomy 001: shoulder hump higher than hips.
- Anatomy 002: back slopes downward from shoulder.
- Anatomy 003: head lower than shoulder.
- Anatomy 004: skull large and rounded.
- Anatomy 005: trunk shorter and heavier than elephant trunk.
- Anatomy 006: tusks curve outward and upward.
- Anatomy 007: ear small.
- Anatomy 008: neck visually buried in fur.
- Anatomy 009: body shaggy along belly.
- Anatomy 010: fur overhang hides top of legs.
- Anatomy 011: legs short relative to body.
- Anatomy 012: legs thick and columnar.
- Anatomy 013: knees not overly articulated.
- Anatomy 014: feet wide but partially covered.
- Anatomy 015: feet not separated like shoes.
- Anatomy 016: tail small or hidden.
- Anatomy 017: silhouette must read at thumbnail size.
- Anatomy 018: gait slow and weighty.
- Anatomy 019: body bob minimal.
- Anatomy 020: foot lift low.
- Anatomy 021: stride short.
- Anatomy 022: leg contact clamped near body.
- Anatomy 023: snow mask covers foot plant artifacts.
- Anatomy 024: foreground mammoth should be largest and clearest.
- Anatomy 025: distant mammoths can be simpler silhouettes.

## Mario Centralization Checklist

- Checklist 001: theme appears in `THEMES`.
- Checklist 002: theme has preview metadata.
- Checklist 003: theme has SVG icon.
- Checklist 004: theme has chrome traits.
- Checklist 005: theme has scene config.
- Checklist 006: theme has tokens for core colors.
- Checklist 007: theme has tokens for radius.
- Checklist 008: theme has typography tokens.
- Checklist 009: theme uses shared `ThemeSceneLayer`.
- Checklist 010: theme uses shared FX runtime.
- Checklist 011: theme selector does not branch on `mario`.
- Checklist 012: header does not hard-code Mario-only selector behavior.
- Checklist 013: map overlay tone still works.
- Checklist 014: charts remain legible.
- Checklist 015: UI audit accepts Classic-specific primitives.
- Checklist 016: `sc-*` classes are documented.
- Checklist 017: forbidden generic classes are not reintroduced.
- Checklist 018: screenshot coverage includes Classic.
- Checklist 019: reduced motion freezes background.
- Checklist 020: mobile header works in Classic.

## Phase 0: Planning And Baseline

- Task 0001: capture current screenshots for Slate, Classic, Hyperborea, Nocturne, and Synthwave.
- Task 0002: capture desktop screenshots in WELLS.
- Task 0003: capture desktop screenshots in ECONOMICS.
- Task 0004: capture desktop screenshots in SCENARIOS.
- Task 0005: capture mobile screenshots for header and selector.
- Task 0006: record current header dimensions.
- Task 0007: record current background FPS qualitatively.
- Task 0008: record current bundle size.
- Task 0009: record current `npm run typecheck` status.
- Task 0010: record current `npm test` status.
- Task 0011: record current `npm run ui:audit` status.
- Task 0012: inspect open user changes before editing.
- Task 0013: identify which current dirty files are user work.
- Task 0014: avoid unrelated changes.
- Task 0015: decide whether to implement in current branch or worktree.
- Task 0016: define exact acceptance criteria for selector.
- Task 0017: define exact acceptance criteria for each theme fix.
- Task 0018: confirm whether Nocturne ID should remain `league`.
- Task 0019: confirm whether "Classic" should remain label for `mario`.
- Task 0020: confirm whether Remotion is in or out for live backgrounds.

## Phase 1: Theme Contract

- Task 0101: extend `ThemeDefinition` with optional `preview`.
- Task 0102: extend `ThemeDefinition` with optional `iconDefinition`.
- Task 0103: extend `ThemeDefinition` with optional `chrome`.
- Task 0104: extend `ThemeDefinition` with optional `scene`.
- Task 0105: add `ThemeRendererKind`.
- Task 0106: add `ThemeSceneConfig`.
- Task 0107: add `ThemeSceneRuntimeProps`.
- Task 0108: add helper `getThemePreview`.
- Task 0109: add helper `getThemeIcon`.
- Task 0110: add helper `getThemeChrome`.
- Task 0111: add helper `getThemeScene`.
- Task 0112: preserve old `icon` field.
- Task 0113: preserve old `BackgroundComponent` field.
- Task 0114: preserve old `fxTheme` field.
- Task 0115: write registry tests for default helpers.
- Task 0116: write registry tests for all themes having previews.
- Task 0117: write registry tests for renderer metadata.
- Task 0118: write registry tests for SVG/emoji fallback.
- Task 0119: update `docs/theme-system.md`.
- Task 0120: do not change visuals in this phase except metadata-dependent selector work.

## Phase 2: Theme Icons And Preview Metadata

- Task 0201: create theme icon components.
- Task 0202: add Slate icon.
- Task 0203: add Synthwave icon.
- Task 0204: add Tropical icon.
- Task 0205: add Nocturne icon.
- Task 0206: add Stormwatch icon.
- Task 0207: add Classic icon.
- Task 0208: add Hyperborea icon.
- Task 0209: add Permian icon.
- Task 0210: add `preview` metadata for Slate.
- Task 0211: add `preview` metadata for Synthwave.
- Task 0212: add `preview` metadata for Tropical.
- Task 0213: add `preview` metadata for Nocturne.
- Task 0214: add `preview` metadata for Stormwatch.
- Task 0215: add `preview` metadata for Classic.
- Task 0216: add `preview` metadata for Hyperborea.
- Task 0217: add `preview` metadata for Permian.
- Task 0218: ensure icon color follows currentColor where possible.
- Task 0219: ensure active menu row has non-color cue.
- Task 0220: update tests.

## Phase 3: Theme Selector Menu

- Task 0301: create `ThemeSelectorMenu.tsx`.
- Task 0302: build trigger UI.
- Task 0303: build popover/menu panel.
- Task 0304: render icon, label, and chevron.
- Task 0305: render menu row icon.
- Task 0306: render menu row label.
- Task 0307: render menu row description.
- Task 0308: render active checkmark.
- Task 0309: render FX chip.
- Task 0310: render light-mode chip.
- Task 0311: implement open/close state.
- Task 0312: implement outside click close.
- Task 0313: implement Escape close.
- Task 0314: implement ArrowDown.
- Task 0315: implement ArrowUp.
- Task 0316: implement Home.
- Task 0317: implement End.
- Task 0318: implement Enter select.
- Task 0319: implement Space select.
- Task 0320: return focus to trigger on close.
- Task 0321: preserve `data-testid` values or add new stable tests.
- Task 0322: add tests with React Testing Library.
- Task 0323: add Storybook story.
- Task 0324: add narrow/mobile story.
- Task 0325: add Classic story.
- Task 0326: integrate into `PageHeader.tsx`.
- Task 0327: remove old icon-only theme bar.
- Task 0328: verify header wrapping.
- Task 0329: verify keyboard accessibility.
- Task 0330: verify screen reader labels.

## Phase 4: Shell And Scene Layer

- Task 0401: create shared `ThemeSceneLayer`.
- Task 0402: move page overlay rendering into scene layer.
- Task 0403: update `AppShell` workspace prop with `pageOverlayClasses`.
- Task 0404: update `AppShell` tests.
- Task 0405: update workspace return shape if needed.
- Task 0406: use scene layer in `AppShell`.
- Task 0407: ensure `SlopcastPage` does not double render backgrounds when shell is active.
- Task 0408: remove duplicate background mounting from final route path.
- Task 0409: preserve `Vignette` behavior.
- Task 0410: add scene config flag `ownsVignette`.
- Task 0411: add scene config flag `ownsGrain`.
- Task 0412: add scene config flag `supportsFx`.
- Task 0413: pass explicit `fxMode`.
- Task 0414: keep `fxClass` for CSS selectors.
- Task 0415: add tests for Hyperborea page overlay in shell.
- Task 0416: add tests for no background theme fallback vignette.
- Task 0417: add tests for background scene component render.
- Task 0418: verify z-index layering.
- Task 0419: verify mobile drawer layering.
- Task 0420: verify sidebar glass still shows backgrounds.

## Phase 5: Shared Scene Runtime

- Task 0501: extract `useReducedMotionPreference` from Permian utilities.
- Task 0502: extract `usePageVisibilityPaused` from Permian utilities.
- Task 0503: extract or generalize `useDeviceTier`.
- Task 0504: add `useThemeSceneRuntime`.
- Task 0505: provide runtime to `ThemeSceneLayer`.
- Task 0506: update Permian to use shared hooks.
- Task 0507: update Mario to pause on hidden.
- Task 0508: update Nocturne to pause on hidden.
- Task 0509: update Hyperborea to pause on hidden.
- Task 0510: update Canvas 2D backgrounds to observe reduced motion consistently.
- Task 0511: add cleanup tests where practical.
- Task 0512: add Storybook controls for runtime overrides.
- Task 0513: add low-end fallback helpers.
- Task 0514: avoid duplicating hardware checks.
- Task 0515: keep fallback decisions deterministic in tests.
- Task 0516: document renderer lifecycle contract.
- Task 0517: update `docs/theme-system.md`.
- Task 0518: verify existing Permian stories still work.
- Task 0519: verify no browser console errors.
- Task 0520: verify screenshots remain stable enough.

## Phase 6: Hyperborea Short-Term Fix

- Task 0601: extract mammoth drawing helpers.
- Task 0602: add deterministic mammoth story or test harness.
- Task 0603: redraw body silhouette with shoulder hump.
- Task 0604: redraw head silhouette.
- Task 0605: redraw trunk.
- Task 0606: redraw tusks.
- Task 0607: redraw legs as filled tapered shapes.
- Task 0608: add fur fringe.
- Task 0609: add snow occlusion at feet.
- Task 0610: clamp stride.
- Task 0611: reduce foot lift.
- Task 0612: slow gait.
- Task 0613: adjust foreground mammoth scale.
- Task 0614: adjust mammoth color contrast.
- Task 0615: add reduced-motion static pose.
- Task 0616: test no runaway RAF.
- Task 0617: take before/after screenshots.
- Task 0618: compare at desktop and mobile.
- Task 0619: run `npm test` for touched tests.
- Task 0620: run `npm run ui:audit`.

## Phase 7: Synthwave Beam Upgrade

- Task 0701: decide SVG upgrade vs R3F migration for first pass.
- Task 0702: if SVG, replace rect beams with path/polygon beams.
- Task 0703: if SVG, create center-origin beam geometry.
- Task 0704: if SVG, add phase-shifted CSS transforms.
- Task 0705: if SVG, increase gradient opacity.
- Task 0706: if SVG, add stronger glow filter.
- Task 0707: if SVG, tune `fx-max`.
- Task 0708: if R3F, create fallback component.
- Task 0709: if R3F, create beam shader.
- Task 0710: if R3F, add additive blending.
- Task 0711: if R3F, keep existing SVG as low-end fallback.
- Task 0712: add reduced-motion behavior.
- Task 0713: add Storybook variant.
- Task 0714: update CSS only if selector names remain stable.
- Task 0715: test beam prominence under panels.
- Task 0716: test WELLS screen readability.
- Task 0717: test ECONOMICS screen readability.
- Task 0718: test mobile header readability.
- Task 0719: run `npm run ui:audit`.
- Task 0720: run screenshots.

## Phase 8: Nocturne Redesign

- Task 0801: keep theme ID `league` unless migration is approved.
- Task 0802: update label only if desired.
- Task 0803: write a small Nocturne design spec.
- Task 0804: define moon size and placement.
- Task 0805: define aurora style.
- Task 0806: define ridge composition.
- Task 0807: define fog composition.
- Task 0808: define warm light accents.
- Task 0809: define max FX behavior.
- Task 0810: update `MoonlightBackground`.
- Task 0811: add stronger moon glow.
- Task 0812: add diagonal moon rays.
- Task 0813: add foreground ridges.
- Task 0814: add fog bands.
- Task 0815: add aurora intensity tuning.
- Task 0816: add reduced-motion stable frame.
- Task 0817: add Storybook story.
- Task 0818: update selector preview.
- Task 0819: take before/after screenshots.
- Task 0820: run visual audit.

## Phase 9: Mario Centralization

- Task 0901: add Classic chrome traits.
- Task 0902: update helper to derive `isClassicTheme` from chrome if desired.
- Task 0903: migrate selector off direct Classic branching where possible.
- Task 0904: update `PageHeader` to use chrome helpers.
- Task 0905: document `sc-*` chrome primitives.
- Task 0906: migrate core Mario tokens into definition.
- Task 0907: keep complex CSS selectors for now.
- Task 0908: route background through `ThemeSceneLayer`.
- Task 0909: add reduced-motion behavior.
- Task 0910: add pause-on-hidden behavior.
- Task 0911: add Classic story for selector.
- Task 0912: add Classic background story.
- Task 0913: run Classic screenshot.
- Task 0914: run WELLS Classic check.
- Task 0915: run ECONOMICS Classic check.
- Task 0916: run SCENARIOS Classic check.
- Task 0917: run mobile Classic check.
- Task 0918: verify no selector regression.
- Task 0919: update tests.
- Task 0920: update docs.

## Phase 10: Token Migration

- Task 1001: list all CSS variables by theme.
- Task 1002: identify core tokens used across components.
- Task 1003: identify theme-only art tokens.
- Task 1004: migrate Nocturne core tokens into theme definition.
- Task 1005: migrate Synthwave core tokens into theme definition.
- Task 1006: migrate Hyperborea core tokens into theme definition.
- Task 1007: migrate Classic core tokens into theme definition.
- Task 1008: migrate Tropical core tokens if missing.
- Task 1009: migrate Stormwatch core tokens if missing.
- Task 1010: leave large art CSS in theme CSS until renderer migration.
- Task 1011: add tests for token resolution.
- Task 1012: add tests for no stale token leakage.
- Task 1013: verify `data-theme` CSS still works.
- Task 1014: verify `data-mode` CSS still works.
- Task 1015: update docs.
- Task 1016: avoid changing every component at once.
- Task 1017: migrate shared surfaces first.
- Task 1018: migrate map overlays later.
- Task 1019: migrate chart style later.
- Task 1020: run full typecheck.

## Phase 11: Visual QA

- Task 1101: start dev server.
- Task 1102: start Storybook if reusable components changed.
- Task 1103: capture Slate desktop WELLS.
- Task 1104: capture Slate desktop ECONOMICS.
- Task 1105: capture Slate desktop SCENARIOS.
- Task 1106: capture Classic desktop WELLS.
- Task 1107: capture Classic desktop ECONOMICS.
- Task 1108: capture Classic desktop SCENARIOS.
- Task 1109: capture Hyperborea desktop WELLS.
- Task 1110: capture Hyperborea desktop ECONOMICS.
- Task 1111: capture Synthwave desktop WELLS.
- Task 1112: capture Synthwave desktop ECONOMICS.
- Task 1113: capture Nocturne desktop WELLS.
- Task 1114: capture Nocturne desktop ECONOMICS.
- Task 1115: capture mobile header in Slate.
- Task 1116: capture mobile header in Classic.
- Task 1117: capture mobile header in Hyperborea.
- Task 1118: capture mobile header in Synthwave.
- Task 1119: capture mobile header in Nocturne.
- Task 1120: compare before/after with critique checklist.

## Verification Plan

- Verification 001: run `npm run typecheck`.
- Verification 002: run `npm test`.
- Verification 003: run targeted registry tests.
- Verification 004: run targeted selector tests.
- Verification 005: run `npm run ui:audit`.
- Verification 006: run `npm run ui:components` when Storybook stories change.
- Verification 007: run `npm run ui:shots` after visual changes.
- Verification 008: run `npm run ui:verify` before merging large UI refactor.
- Verification 009: manually test keyboard selector navigation.
- Verification 010: manually test reduced motion.
- Verification 011: manually test low-end fallback if possible.
- Verification 012: manually inspect browser console.
- Verification 013: manually inspect background layering.
- Verification 014: manually inspect header at mobile width.
- Verification 015: manually inspect theme switch persistence.
- Verification 016: manually inspect all theme icons.
- Verification 017: manually inspect app with `?fx=max`.
- Verification 018: manually inspect app with `?fx=cinematic`.
- Verification 019: manually inspect app with `?fx=clear`.
- Verification 020: manually inspect theme switch after page reload.

## Acceptance Criteria: Theme Selector

- Criteria 001: old icon-only bar is removed from the right side of `PageHeader`.
- Criteria 002: current theme appears in the upper-left brand region.
- Criteria 003: trigger includes theme icon.
- Criteria 004: trigger includes theme label.
- Criteria 005: trigger has accessible name.
- Criteria 006: menu opens by mouse.
- Criteria 007: menu opens by keyboard.
- Criteria 008: menu closes on Escape.
- Criteria 009: menu closes on outside click.
- Criteria 010: menu selection updates theme.
- Criteria 011: menu selection persists via existing storage.
- Criteria 012: active theme row has checkmark.
- Criteria 013: active theme row does not rely on color alone.
- Criteria 014: rows include descriptions.
- Criteria 015: rows include SVG icons or fallback icons.
- Criteria 016: menu is usable on mobile.
- Criteria 017: menu does not cover critical navigation permanently.
- Criteria 018: focus is managed correctly.
- Criteria 019: no console errors.
- Criteria 020: tests cover core behavior.

## Acceptance Criteria: Theme System

- Criteria 0101: all registered themes have preview metadata.
- Criteria 0102: all registered themes have icon metadata.
- Criteria 0103: all registered themes have scene metadata.
- Criteria 0104: all FX themes declare scene FX support.
- Criteria 0105: WebGL scenes declare fallbacks.
- Criteria 0106: scene layer handles page overlays.
- Criteria 0107: shell renders background once.
- Criteria 0108: reduced motion behavior is defined for each renderer.
- Criteria 0109: pause-on-hidden behavior is defined for animated scenes.
- Criteria 0110: docs explain how to add a theme.
- Criteria 0111: `ThemeProvider` still sets `data-theme`.
- Criteria 0112: `ThemeProvider` still sets `data-mode`.
- Criteria 0113: token runtime continues clearing stale tokens.
- Criteria 0114: unknown theme fallback still works.
- Criteria 0115: existing theme order is preserved unless intentionally changed.
- Criteria 0116: theme light variants still generate UI cases.
- Criteria 0117: screenshot script can still load theme cases.
- Criteria 0118: map palettes remain available.
- Criteria 0119: chart palettes remain available.
- Criteria 0120: public route behavior remains unchanged.

## Acceptance Criteria: Hyperborea

- Criteria 0201: mammoths read as mammoths at desktop size.
- Criteria 0202: mammoths read as mammoths at laptop size.
- Criteria 0203: mammoth legs are not stick-like.
- Criteria 0204: mammoth feet are not shoe-like.
- Criteria 0205: tusks are visible.
- Criteria 0206: shoulder hump is visible.
- Criteria 0207: shaggy body is visible.
- Criteria 0208: gait is slower and heavier.
- Criteria 0209: reduced motion shows a static composition.
- Criteria 0210: snow does not obscure data panels.
- Criteria 0211: aurora/page overlay still works.
- Criteria 0212: no performance regression is obvious.
- Criteria 0213: no runaway RAF after unmount.
- Criteria 0214: no console errors.
- Criteria 0215: screenshot comparison shows improvement.

## Acceptance Criteria: Synthwave

- Criteria 0301: beams visibly emanate from the sun.
- Criteria 0302: beams are more prominent.
- Criteria 0303: beams move in wave-like motion.
- Criteria 0304: flicker is dynamic.
- Criteria 0305: flicker is not chaotic.
- Criteria 0306: cinematic FX remains readable.
- Criteria 0307: max FX feels intentionally dramatic.
- Criteria 0308: reduced motion freezes beam movement.
- Criteria 0309: sun remains focal point.
- Criteria 0310: grid remains legible.
- Criteria 0311: data panels remain readable.
- Criteria 0312: mobile header remains readable.
- Criteria 0313: no console errors.
- Criteria 0314: no major performance regression.
- Criteria 0315: visual audit passes.

## Acceptance Criteria: Nocturne

- Criteria 0401: theme has stronger visual focal point.
- Criteria 0402: moon or moonlight reads immediately.
- Criteria 0403: aurora/fog adds depth.
- Criteria 0404: foreground silhouettes add cinematic framing.
- Criteria 0405: warm accents connect to UI active states.
- Criteria 0406: theme remains distinct from Synthwave.
- Criteria 0407: theme remains distinct from Hyperborea.
- Criteria 0408: selector preview reflects new identity.
- Criteria 0409: reduced motion remains calm.
- Criteria 0410: WELLS view remains readable.
- Criteria 0411: ECONOMICS view remains readable.
- Criteria 0412: SCENARIOS view remains readable.
- Criteria 0413: no console errors.
- Criteria 0414: screenshot improvement is visible.
- Criteria 0415: theme feels screenshot-ready.

## Acceptance Criteria: Classic/Mario

- Criteria 0501: Classic remains visually distinct.
- Criteria 0502: Classic is registered through the same scene layer.
- Criteria 0503: selector uses registry metadata.
- Criteria 0504: header selector does not special-case Classic beyond chrome helpers.
- Criteria 0505: `sc-*` primitives are documented.
- Criteria 0506: reduced motion behavior is defined.
- Criteria 0507: pause-on-hidden behavior is defined.
- Criteria 0508: map overlays remain legible.
- Criteria 0509: chart colors remain legible.
- Criteria 0510: mobile header remains usable.
- Criteria 0511: no copyrighted Mario-specific iconography is added.
- Criteria 0512: no console errors.
- Criteria 0513: UI audit passes.
- Criteria 0514: theme screenshot remains playful.
- Criteria 0515: implementation is less detached from theme system.

## Risk Register

- Risk 001: 100% WebGL migration may add performance cost.
- Mitigation 001: use R3F selectively and keep fallbacks.
- Risk 002: selector dropdown could hide discoverability.
- Mitigation 002: label it clearly in brand cluster and keep current theme visible.
- Risk 003: changing header layout can regress mobile.
- Mitigation 003: add narrow story and mobile screenshots.
- Risk 004: changing theme contract can create broad type churn.
- Mitigation 004: add optional fields first and adapters.
- Risk 005: Classic branch removal can break unique styling.
- Mitigation 005: migrate through chrome traits, not immediate deletion.
- Risk 006: background visual changes can reduce data readability.
- Mitigation 006: test WELLS, ECONOMICS, and SCENARIOS per theme.
- Risk 007: stronger Synthwave beams can distract.
- Mitigation 007: tune cinematic vs max FX.
- Risk 008: Nocturne redesign can duplicate Hyperborea.
- Mitigation 008: use moonlit alpine direction, not snow/village direction.
- Risk 009: Hyperborea mammoth refactor can overconsume time.
- Mitigation 009: short-term 2D silhouette fix before R3F migration.
- Risk 010: icon migration can create inconsistent styles.
- Mitigation 010: define icon style rules and review in Storybook.
- Risk 011: page overlay migration can change z-index.
- Mitigation 011: test scene layer z-index and overlays.
- Risk 012: token migration can create stale CSS variables.
- Mitigation 012: rely on existing `clearThemeTokens` and tests.
- Risk 013: Storybook MCP may be unavailable.
- Mitigation 013: read stories directly and run `npm run ui:components`.
- Risk 014: Playwright MCP may be unavailable.
- Mitigation 014: use existing screenshot scripts.
- Risk 015: theme ID rename could break persistence.
- Mitigation 015: do not rename IDs in this project unless migration is approved.

## Recommended Implementation Order

- Order 001: create theme contract additions.
- Order 002: add preview metadata and icons.
- Order 003: build `ThemeSelectorMenu`.
- Order 004: integrate selector into brand cluster.
- Order 005: remove icon-only bar.
- Order 006: add selector tests and stories.
- Order 007: create `ThemeSceneLayer`.
- Order 008: consolidate background and overlay rendering.
- Order 009: extract shared scene runtime hooks.
- Order 010: migrate Permian to shared runtime.
- Order 011: patch Hyperborea mammoths in Canvas 2D.
- Order 012: upgrade Synthwave beams.
- Order 013: redesign Nocturne.
- Order 014: centralize Classic/Mario chrome.
- Order 015: migrate tokens theme by theme.
- Order 016: run full visual QA.
- Order 017: update docs.
- Order 018: request code review.
- Order 019: fix review findings.
- Order 020: prepare PR.

## Suggested PR Split

- PR 001: theme metadata contract and docs.
- PR 002: selector menu and header integration.
- PR 003: scene layer and shared runtime hooks.
- PR 004: Hyperborea mammoth fix.
- PR 005: Synthwave beam upgrade.
- PR 006: Nocturne redesign.
- PR 007: Classic/Mario chrome centralization.
- PR 008: token migration and cleanup.
- PR 009: visual QA updates and screenshot baselines.

## File Map

- `src/theme/types.ts`: add contract types.
- `src/theme/registry.ts`: add helpers and validation-friendly accessors.
- `src/theme/definitions/*/index.ts`: add preview, icon, chrome, and scene metadata.
- `src/theme/icons.tsx`: optional shared icon file.
- `src/theme/scene/ThemeSceneLayer.tsx`: new shell scene renderer.
- `src/theme/scene/types.ts`: new scene runtime types.
- `src/theme/scene/runtime.ts`: shared runtime helpers if hooks are not colocated.
- `src/components/slopcast/ThemeSelectorMenu.tsx`: new selector.
- `src/components/slopcast/ThemeSelectorMenu.test.tsx`: selector behavior tests.
- `src/components/slopcast/ThemeSelectorMenu.stories.tsx`: visual states.
- `src/components/slopcast/PageHeader.tsx`: integrate selector and remove old bar.
- `src/components/layout/AppShell.tsx`: use scene layer and page overlays.
- `src/components/layout/AppShell.test.tsx`: update shell expectations.
- `src/pages/SlopcastPage.tsx`: remove duplicated background render when shell owns it.
- `src/components/HyperboreaBackground.tsx`: short-term mammoth fix.
- `src/components/hyperborea/*`: optional extracted mammoth/scene helpers.
- `src/components/SynthwaveBackground.tsx`: short-term SVG beam geometry or R3F entry.
- `src/styles/synthwave.css`: beam animation updates if SVG path retained.
- `src/components/MoonlightBackground.tsx`: Nocturne redesign.
- `src/components/MarioOverworldBackground.tsx`: shared runtime and reduced motion.
- `src/styles/theme.css`: token cleanup and theme atmosphere adjustments.
- `docs/theme-system.md`: update theme author guide.

## Testing Matrix

- Matrix 001: Slate, desktop, WELLS.
- Matrix 002: Slate, desktop, ECONOMICS.
- Matrix 003: Slate, desktop, SCENARIOS.
- Matrix 004: Slate, mobile, header selector.
- Matrix 005: Synthwave, desktop, WELLS, cinematic.
- Matrix 006: Synthwave, desktop, WELLS, max.
- Matrix 007: Synthwave, desktop, ECONOMICS, cinematic.
- Matrix 008: Synthwave, mobile, header selector.
- Matrix 009: Tropical, desktop, WELLS.
- Matrix 010: Tropical, desktop, ECONOMICS.
- Matrix 011: Nocturne, desktop, WELLS.
- Matrix 012: Nocturne, desktop, ECONOMICS.
- Matrix 013: Nocturne, desktop, SCENARIOS.
- Matrix 014: Nocturne, mobile, header selector.
- Matrix 015: Stormwatch, desktop, WELLS.
- Matrix 016: Stormwatch, desktop, ECONOMICS.
- Matrix 017: Classic, desktop, WELLS.
- Matrix 018: Classic, desktop, ECONOMICS.
- Matrix 019: Classic, desktop, SCENARIOS.
- Matrix 020: Classic, mobile, header selector.
- Matrix 021: Hyperborea, desktop, WELLS, cinematic.
- Matrix 022: Hyperborea, desktop, WELLS, max.
- Matrix 023: Hyperborea, desktop, ECONOMICS.
- Matrix 024: Hyperborea, mobile, header selector.
- Matrix 025: Permian, desktop, WELLS, dusk.
- Matrix 026: Permian, desktop, ECONOMICS, dusk.
- Matrix 027: Permian, desktop, WELLS, noon.
- Matrix 028: Permian, mobile, header selector.
- Matrix 029: reduced motion enabled, Synthwave.
- Matrix 030: reduced motion enabled, Hyperborea.
- Matrix 031: reduced motion enabled, Nocturne.
- Matrix 032: reduced motion enabled, Classic.
- Matrix 033: low-end fallback forced, Permian.
- Matrix 034: low-end fallback forced, future Hyperborea if R3F.
- Matrix 035: keyboard-only selector navigation.
- Matrix 036: screen reader name inspection.
- Matrix 037: `?fx=max`.
- Matrix 038: `?fx=cinematic`.
- Matrix 039: `?fx=clear`.
- Matrix 040: theme persistence after reload.

## Commands

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run ui:audit
```

```bash
npm run ui:components
```

```bash
npm run ui:shots
```

```bash
npm run ui:verify
```

```bash
npm run theme:fx:max
```

```bash
npm run theme:fx:cinematic
```

```bash
npm run theme:fx:clear
```

## Design QA Checklist

- QA 001: does the theme selector feel like part of the brand?
- QA 002: can the user identify the active theme without reading small text?
- QA 003: can the user identify each theme in the menu quickly?
- QA 004: does the selector avoid generic settings-menu energy?
- QA 005: does the header have a clear hierarchy?
- QA 006: does the background support the page rather than fight it?
- QA 007: does each theme have a memorable visual idea?
- QA 008: does each theme avoid the same cyan/purple/glass recipe?
- QA 009: does each theme use color to communicate mood and hierarchy?
- QA 010: does each theme keep NPV/IRR/EUR data readable?
- QA 011: does each theme work in WELLS?
- QA 012: does each theme work in ECONOMICS?
- QA 013: does each theme work in SCENARIOS?
- QA 014: does each theme work on mobile?
- QA 015: does reduced motion still look intentional?
- QA 016: does max FX look deliberate rather than noisy?
- QA 017: does Classic feel intentionally classic, not outdated?
- QA 018: does Hyperborea feel arctic and mythic?
- QA 019: does Nocturne feel moonlit and premium?
- QA 020: does Synthwave feel energetic without becoming unreadable?

## Engineering QA Checklist

- QA 101: no duplicate background mounts.
- QA 102: no leaked RAF loops.
- QA 103: no leaked resize listeners.
- QA 104: no leaked media query listeners.
- QA 105: no unbounded particle counts.
- QA 106: no high-DPR WebGL defaults.
- QA 107: no renderer without reduced-motion behavior.
- QA 108: no WebGL renderer without fallback.
- QA 109: no selector row without accessible label.
- QA 110: no icon-only theme switcher.
- QA 111: no theme-specific selector maps outside `src/theme`.
- QA 112: no shell-local theme metadata maps.
- QA 113: no new broad component branches for one theme.
- QA 114: no new copyrighted Mario-like assets.
- QA 115: no direct random layout in render path.
- QA 116: no layout property animation for continuous effects.
- QA 117: no giant synchronous asset load.
- QA 118: no console errors.
- QA 119: tests updated with new props.
- QA 120: docs updated.

## Open Questions

- Question 001: should the user-facing `league` label become `Nocturne` everywhere?
- Question 002: should the `mario` ID remain forever or eventually become `classic`?
- Question 003: should all theme icons be monochrome or can some be multi-color?
- Question 004: should the selector menu show FX mode controls too, or only theme selection?
- Question 005: should light/dark mode live in the same brand dropdown?
- Question 006: should the brand dropdown include a shortcut to theme settings?
- Question 007: should Hyperborea be upgraded to R3F now or after the Canvas mammoth fix?
- Question 008: should Synthwave beam upgrade be SVG-first or R3F-first?
- Question 009: should Nocturne get a full new design spec before implementation?
- Question 010: should Remotion be explicitly rejected for live backgrounds in docs?
- Question 011: should theme screenshot baselines be updated in one PR or per-theme PR?
- Question 012: should `AppShell` fully replace the direct `SlopcastPage` shell now?
- Question 013: should `isClassicTheme` remain as a public feature field?
- Question 014: should `pageOverlayClasses` become structured overlay definitions?
- Question 015: should theme authors be required to add Storybook stories?

## Recommended Answers To Open Questions

- Answer 001: keep ID `league`, change label to `Nocturne` only if product copy agrees.
- Answer 002: keep ID `mario` for persistence compatibility; use label `Classic`.
- Answer 003: start monochrome SVG icons using `currentColor`.
- Answer 004: keep selector focused on theme selection; add FX controls elsewhere or later.
- Answer 005: do not combine color mode into the first selector pass.
- Answer 006: do not add theme settings until theme settings exist.
- Answer 007: fix Hyperborea mammoth in Canvas first; plan R3F after.
- Answer 008: use SVG-first if time is short; use R3F-first if beam movement is the main deliverable.
- Answer 009: write a short Nocturne spec before code.
- Answer 010: document Remotion as non-live-background unless future video export exists.
- Answer 011: update baselines per PR to keep reviewable diffs.
- Answer 012: consolidate shell when touching scene layer.
- Answer 013: keep `isClassicTheme` temporarily but stop adding new direct uses.
- Answer 014: keep class names now; structure overlays later.
- Answer 015: yes, require Storybook stories for reusable UI and complex backgrounds.

## First Implementation Slice

- Slice goal: prove the architecture with the smallest visible improvement.
- Slice scope: theme selector and metadata, not full background redesign.
- Slice task 001: add preview/icon/chrome optional fields.
- Slice task 002: add metadata for all themes.
- Slice task 003: add SVG icons.
- Slice task 004: build `ThemeSelectorMenu`.
- Slice task 005: integrate in brand cluster.
- Slice task 006: remove old icon bar.
- Slice task 007: add tests and story.
- Slice task 008: run typecheck and targeted tests.
- Slice task 009: capture before/after header screenshots.
- Slice task 010: stop before changing backgrounds.

## Second Implementation Slice

- Slice goal: make the renderer architecture coherent.
- Slice task 001: create `ThemeSceneLayer`.
- Slice task 002: add shared runtime hooks.
- Slice task 003: migrate scene rendering in shell.
- Slice task 004: preserve existing visuals.
- Slice task 005: update tests.
- Slice task 006: run UI audit.
- Slice task 007: confirm no double background.
- Slice task 008: confirm Hyperborea overlay still appears.
- Slice task 009: confirm Permian fallback still works.
- Slice task 010: stop before redesigning themes.

## Third Implementation Slice

- Slice goal: fix the most visible quality defect.
- Slice task 001: refactor Hyperborea mammoth drawing.
- Slice task 002: add anatomy-based silhouette.
- Slice task 003: add tests/story harness.
- Slice task 004: add reduced-motion pose.
- Slice task 005: capture before/after.
- Slice task 006: review against mammoth checklist.
- Slice task 007: tune for readability.
- Slice task 008: run tests.
- Slice task 009: run UI audit.
- Slice task 010: stop before R3F rewrite.

## Fourth Implementation Slice

- Slice goal: make Synthwave effects match the request.
- Slice task 001: decide SVG vs R3F path.
- Slice task 002: implement wave-like beam geometry.
- Slice task 003: increase beam prominence.
- Slice task 004: add dynamic flicker.
- Slice task 005: add reduced-motion freeze.
- Slice task 006: tune cinematic/max modes.
- Slice task 007: inspect readability.
- Slice task 008: run tests.
- Slice task 009: run UI audit.
- Slice task 010: capture screenshots.

## Fifth Implementation Slice

- Slice goal: make Nocturne worthy of the newer theme set.
- Slice task 001: write micro-spec.
- Slice task 002: increase moon/focal drama.
- Slice task 003: add depth layers.
- Slice task 004: add foreground silhouettes.
- Slice task 005: tune header atmosphere.
- Slice task 006: update selector preview.
- Slice task 007: inspect WELLS and ECONOMICS.
- Slice task 008: run tests.
- Slice task 009: run UI audit.
- Slice task 010: capture screenshots.

## Sixth Implementation Slice

- Slice goal: bring Classic into the system without losing its soul.
- Slice task 001: add chrome traits.
- Slice task 002: document `sc-*`.
- Slice task 003: update components touched by selector/shell to consume chrome helpers.
- Slice task 004: migrate background lifecycle.
- Slice task 005: add Classic stories.
- Slice task 006: inspect Classic WELLS.
- Slice task 007: inspect Classic ECONOMICS.
- Slice task 008: inspect mobile Classic.
- Slice task 009: run tests.
- Slice task 010: run UI audit.

## Why This Fixes The Root Cause

- It moves theme identity from scattered implementation detail to first-class product architecture.
- It lets theme selection become part of the brand experience.
- It gives each theme a documented place for unique traits.
- It reduces one-off component branches.
- It lets Mario remain unique without being detached.
- It gives Hyperborea a path from rough procedural art to controlled scene design.
- It gives Synthwave the renderer control needed for real beam motion.
- It gives Nocturne an art-direction pass rather than a few isolated CSS tweaks.
- It allows WebGL where it adds control.
- It keeps Canvas and SVG where they are still appropriate.
- It makes QA explicit.
- It makes future themes easier to add.
- It makes current themes easier to improve.

## Final Recommendation

- Do not treat this as four isolated theme bugs.
- Treat it as a theme contract refactor with four visible case studies.
- Start with the selector and registry because they define the product model.
- Then consolidate scene rendering because it defines the technical model.
- Then fix Hyperborea, Synthwave, Nocturne, and Classic using that model.
- Keep the implementation sliced into reviewable PRs.
- Require screenshots for every visual slice.
- Require reduced-motion behavior for every animated theme.
- Require theme metadata for every registered theme.
- Keep Slopcast bold, cinematic, and strange in the best way.

