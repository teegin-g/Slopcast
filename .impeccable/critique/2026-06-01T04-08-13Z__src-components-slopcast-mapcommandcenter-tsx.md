---
target: wells/map screen (desktop MapCommandCenter + mobile DesignWellsView)
total_score: 31
p0_count: 0
p1_count: 1
timestamp: 2026-06-01T04-08-13Z
slug: src-components-slopcast-mapcommandcenter-tsx
---
## Scope correction

The WELLS tab is viewport-split: **mobile → `DesignWellsView`**, **desktop/wide → `MapCommandCenter`** (lazy). The desktop component is the one most users see. An earlier snapshot (score 23/40) over-anchored on `DesignWellsView` and on a non-representative local render (no backend running; Mapbox dark-v11 basemap reads near-black with demo data). This snapshot supersedes it.

## What the desktop screen actually has

- **Persistent data-source badge** in the toolbar rail: green "Live" / yellow "Demo (fallback)" / gray "Demo", color-coded, flashes on transition, click-to-toggle, tooltips explaining state (`OverlayToolbar.tsx:174-227`).
- **Map-unavailable message** when Mapbox can't init ("Set VITE_MAPBOX_TOKEN…", `MapCommandCenter.tsx:573`).
- **Loading indicator** ("Loading wells… / laterals…", line 626) and a spinner in the toolbar.
- **Persistent spatial-error overlay** with Retry / Use mock data / Dismiss (line 690-752).
- Real Mapbox basemap (`dark-v11`) confirmed loading (tiles 200) with a token present in `.env`.

So the original "no connection warnings / silent Mapbox / empty broken map" findings do **not** hold for desktop.

## The findings that DO hold

- **[P1] Panel-style fragmentation (user-confirmed).** At least four panel-styling mechanisms coexist: `SectionCard.sectionStyleMap` (glass/solid/outline), `overlayPanelClass` (groups panel + error overlay), the `.map-overlay-panel` CSS family (toolbar/bars), and ad-hoc hardcoded recipes in `DesignWellsView` (`bg-theme-bg/60 backdrop-blur-sm`), `GroupList`, and `WellSelectionActions` (`bg-theme-surface1`). The grouping panel's bespoke look — `.map-overlay-panel` has `inset 0 1px 0 rgb(255 255 255/0.08)` plus a cyan border on synthwave/hyperborea/stormwatch (theme.css:2504) — is the "weird glass theme with a white outline" the user flagged. It doesn't match the `SectionCard` panels used on other screens. **Fix**: converge on one theme-driven panel primitive (extend `SectionCard` to default `panelStyle` from `theme.features.panelStyle`); make the map overlays and the grouping panel consume it so all surfaces share one material vocabulary.

- **[P2] Mobile/desktop parity gap.** The mobile path (`DesignWellsView` + `MapVisualizer`) lacks the desktop's data-source badge, map-unavailable message, and error overlay; `MapVisualizer`'s offline SVG basemap is silent. On a narrow viewport the user gets none of the connection feedback desktop provides.

## Minor

- The desktop error overlay uses a side-stripe accent (`border-l-2 border-l-red-500`, `MapCommandCenter.tsx:697`) and tropical's `.map-overlay-panel::after` is a 3px left stripe (theme.css:2481) — both are soft "side-stripe border" anti-patterns per the design guidance; prefer a full border, tint, or leading icon.
- Detector (`detect.mjs`) over both `DesignWellsView` and the desktop `MapCommandCenter` + `Overlay*` set returned **0 findings** in all runs.

## Revised read

On desktop this is a "Good"-band screen (~30-32/40), not "Acceptable/23". The one clearly-valid, user-confirmed problem is **panel-material consistency**. "Connection warnings" and "empty map" were largely artifacts of the local env (no backend, automation render), not design gaps — though mobile genuinely lacks the desktop's connection UI.
