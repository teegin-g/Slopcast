# Map Workbench Layout — Design Spec

- **Date:** 2026-06-09
- **Status:** Approved (brainstorm complete)
- **Supersedes:** the layout/chrome decisions in `2026-06-09-map-workspace-redesign-design.md` (Tasks 1.3, 1.4, 1.5). That spec's Phase 2 (dock) and Phase 3 (layers) feature intent still stands; this spec re-homes them into a resolved layout.
- **Predecessor work:** Phase 1 polish (surfaces, accent discipline, Permian basemap, sidebar tokens, connection warnings) already merged to `main`. The built-but-unplaced `GroupInspector` is reused as-is.

## Problem

The map workspace is **full-bleed Mapbox canvas with every panel `position: absolute` floating on top** (`MapCommandCenter.tsx:546` → `relative w-full h-[calc(100vh-64px)]`, canvas at `absolute inset-0`, all panels in an `absolute inset-0 z-10` overlay). There is no layout grid.

Three consequences blocked the remaining redesign work:

1. **Inspector ↔ tool-rail collision.** The right-side `GroupInspector` (built, Storybook-verified, never placed) wants the right edge, but `OverlayToolbar` already sits there (`absolute right-3 top-1/2`). They overlap the same x-range.
2. **Navigation is split and duplicated.** Primary nav exists both as an app sidebar (`AppShell` `<aside>`) and as header pills (`PageHeader`). Group switching exists in the sidebar *and* in a floating `OverlayGroupsPanel`. Groups are the universal entity (switched on every screen) yet have no single persistent home.
3. **No structural space for the bottom dock** (Phase 2) — the map height is hard-pinned with no reserved region.

## Decision

Adopt a **framed-center workbench** (Linear / VS Code two-tier pattern): solid chrome **frames** the map as real flex regions; ephemeral UI **floats** over the canvas.

### Locked decisions (do not relitigate)

- **Hybrid layout model:** structured panels (groups, inspector) are real flex columns; ephemeral UI (tool rail, bottom dock, legend, selection pill, ambient glow) stays `absolute` floating on the canvas.
- **Two-tier left navigation:**
  - **Tier 1 — Activity rail** (~42–46px, always visible, all screens): brand mark + primary nav (Wells / Economics / Scenarios). Replaces the oversized header brand block and the header nav pills.
  - **Tier 2 — Contextual panel** (collapsible): adapts to active screen. On **Wells** = the rich Groups panel (absorbs and retires `OverlayGroupsPanel`). On **Economics/Scenarios** = a slim group selector (switch only).
- **Map area** = flex row: `[groups panel] — [map canvas flex-1] — [inspector]`. Groups panel and inspector are **collapsible to slivers** (Linear-style toggle) to widen the map. Activity rail stays fixed.
- **Slim top bar** (reduced Task 1.3): header becomes an action/context bar — scenario + price-deck chips (left), connection chip, then right-aligned Compare · Run economics · theme selector. No primary nav, no brand (both moved to the rail).
- **Global actions** (Compare, Run economics): top bar, right-aligned.
- **Tool rail** stays right-edge floating and becomes the home for Phase 3 layer toggles.
- **Bottom dock** floats centered along the map bottom, **dismissible** (not a reserved flex row) — full-height map when dismissed.
- **Marker-render bug** is a **Phase 0** fix, before layout work.

## Architecture

### Region ownership

| Region | Component / owner | Positioning | Collapsible |
|---|---|---|---|
| Activity rail (tier 1) | `AppShell` `<aside>`, slimmed | flex column, far left, fixed ~42–46px | no |
| Contextual panel (tier 2) | screen-routed; Wells → Groups panel | flex column | yes (→ sliver) |
| Map canvas | `MapCommandCenter` center cell | `flex-1` in a flex row | n/a |
| Inspector | `GroupInspector` in right flex column | flex column ~280–300px | yes (→ sliver) |
| Slim top bar | `PageHeader`, reduced | flow, top of main column | no |
| Context/filter strip | `OverlayFiltersBar` (consolidated) | `absolute top-3`, spans groups↔rail | no |
| Tool rail | `OverlayToolbar` | `absolute right-3 top-1/2` | (existing) |
| Bottom dock | `InsightsDock` (new) | `absolute bottom-x inset-x`, dismissible | dismiss |
| Legend / selection pill / glow | existing overlays | `absolute`, unchanged | n/a |

### Layout responsibility split

- **`AppShell`** owns the activity rail (tier 1) and the contextual panel (tier 2) as flex siblings, plus the slim header and main content column. The contextual panel's *content* is screen-routed.
- **`MapCommandCenter`** owns the inner flex row: groups-panel slot (when on Wells, the tier-2 panel renders here or is the same region — see open question), map canvas (`flex-1`), inspector column. Floating overlays remain children of the map cell.

> **Boundary note:** the tier-2 Groups panel and the map area's left column are conceptually the same region. Implementation decides whether the Groups panel lives in `AppShell` (tier 2) and the map row starts at the canvas, OR the map row includes the groups column. Either is acceptable; the plan picks one. The user-facing result is identical: `rail | groups | map | inspector`.

### Two-tier nav behavior

- Activity rail is theme-native (CSS custom properties + `ThemeFeatures`), never theme conditionals except the preserved `isClassic`/Mario fork.
- Tier-2 content is determined by active screen (`section` route param): `wells` → rich Groups panel; `economics`/`scenarios` → slim group selector.
- Group switching from tier 2 updates the shared active-group state consumed by all screens.

### Context-aware bottom dock (Phase 2)

- New `InsightsDock` shell + `useDockMode` (derives mode from selection, remembers last tab).
- **Group mode** (default — active group, no selection): Forecast / Economics / Assumptions tabs (reuse `WaterfallChart`).
- **Selection mode** (lasso/box active): Summary / Production / Probit tabs.
- Floating, dismissible; never reserves map height.

### Map layers (Phase 3)

- Economics-heat overlay (NPV/acre) + type-curve/formation polygons (mock GeoJSON), toggled from the tool rail.
- New `MapLayersControl` consolidates toggles into the rail.

### Data (mock-behind-adapter)

Deterministic mock generators behind the existing `services/` adapter pattern, swappable to Databricks (`eds.well.tbl_well_summary_all`) later:
- `productionService` — deterministic monthly production per well (from type curve).
- `geologyService` — mock formation / type-curve polygons (GeoJSON) + labels.
- `heatService` — per-well NPV/acre + legend domain.

## Phase 0 — marker-render bugfix (precedes layout work)

`wellLayerController.ts:158` sets:
```js
'circle-radius': ['case', selectedState, ['*', defaultRadius, 1.25], defaultRadius]
```
`defaultRadius` is a zoom `interpolate` expression; Mapbox forbids nesting a `zoom` expression inside `case`/`*`, so `addLayer` rejects `wells-producing` (line 152) and `wells-permit` (line ~160). **Producing and permit markers do not render.** `wells-duc` (line 169) is valid because it uses `defaultRadius` directly.

**Fix approach:** make `circle-radius` a single top-level `interpolate` and express the selected-state enlargement via the *stop output values* (e.g. multiply each stop output by a `selectedState` `case`), or apply the multiplier only to constant outputs — never wrap the whole zoom expression in `case`/`*`. Verify both layers add cleanly (no console errors) and selected markers visibly enlarge.

## Components

**New:**
- `src/components/.../insightsDock/InsightsDock.tsx` (+ `useDockMode.ts`, tab components: `ForecastTab`, `EconomicsTab`, `AssumptionsTab` (group mode); `SummaryTab`, `ProductionChart`, `ProbitChart` (selection mode)).
- `src/components/slopcast/map/MapLayersControl.tsx`.
- `src/services/{productionService,geologyService,heatService}.ts`.
- `src/types/production.ts`; `src/utils/{probit,productionNormalize}.ts` (+ tests).
- A contextual-panel container/router for tier 2 (Groups panel vs slim selector).

**Modified:**
- `src/components/layout/AppShell.tsx` — activity rail (tier 1) + contextual panel (tier 2) as flex siblings; collapse state.
- `src/components/slopcast/MapCommandCenter.tsx` — inner flex row (groups | map | inspector); floating overlays remain.
- `src/components/slopcast/PageHeader.tsx` — reduce to slim action/context bar.
- `src/components/slopcast/map/OverlayFiltersBar.tsx` — consolidate context strip; drop dynamic offset math.
- `src/components/slopcast/map/OverlayToolbar.tsx` — host layer toggles (Phase 3).
- `src/components/slopcast/map/wellLayerController.ts` — Phase 0 radius fix.
- Retire `src/components/slopcast/map/OverlayGroupsPanel.tsx` once tier-2 Groups panel is live.
- Reuse `src/components/slopcast/map/GroupInspector.tsx` as-is in the right column.

## Execution order

0. **Phase 0** — marker-render bugfix (independent, ship first).
1. **Shell reflow** — activity rail (tier 1) + contextual panel (tier 2) + map flex row (groups | map | inspector). Place `GroupInspector`. Retire `OverlayGroupsPanel`. **Keystone — unblocks everything below.**
2. **Slim top bar** (1.3) + **consolidated context strip** (1.4) — built into the reflowed shell.
3. **Phase 2** — context-aware bottom dock + `productionService`.
4. **Phase 3** — map layers (heat + polygons) + rail toggles + `geologyService`/`heatService`.

## Testing

- **Unit (Vitest):** `productionNormalize`, `probit`, `useDockMode`, service mock determinism; existing `connectionState`/`groupInspectorStats` stay green.
- **Component (Storybook):** `InsightsDock` (both modes), reuse `GroupInspector` stories.
- **UI (Playwright):** WELLS across slate + permian + mario; `npm run ui:audit` after visual changes; verify collapse toggles and dock dismiss. Verify Phase 0: no map console errors, producing/permit markers render.
- Reuse `DEFAULT_*` constants with small well sets.

## Constraints (carried forward)

- Scope: map workspace + global chrome only — **not** the Economics/Scenarios deep views.
- Preserve the `isClassic`/Mario fork — make it theme-native, don't remove it.
- Keep the Python economics engine (TS↔Python parity).
- Components consume CSS custom properties + `ThemeFeatures`, never theme conditionals (except the `isClassic` fork).
- Atmosphere is per-theme tuned (Permian tamed, Slate left); ambient layers stay floating.

## Open questions (for the plan, not blocking)

- Tier-2 Groups panel: live in `AppShell` (tier 2) with the map row starting at the canvas, vs. the map row owning the groups column. Pick one in the plan; user-facing result is identical.
- Collapse persistence: remember collapse state across sessions (localStorage) or reset per load? Default to in-session only unless trivial.
