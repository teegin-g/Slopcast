# Handoff — Map Workspace Redesign

- **Status:** Phase 1 (polish) done & validated; larger features deferred for a live session.
- **Updated:** 2026-06-09
- **Branch:** `feat/map-workspace-redesign` · **Draft PR:** #7 (https://github.com/teegin-g/Slopcast/pull/7)
- **Canonical docs:** spec → `docs/superpowers/specs/2026-06-09-map-workspace-redesign-design.md` · plan (has a status block + checkboxes) → `docs/superpowers/plans/2026-06-09-map-workspace-redesign.md`

This is a [superpowers](https://github.com/obra/superpowers) flow: **brainstorm → spec → plan → execute**. The plan is the source of truth for remaining work; this file is the orientation layer on top of it.

---

## How to resume (do this first)

1. `git checkout feat/map-workspace-redesign`
2. Read the **spec** (decisions + design), then the **plan** (task breakdown + status block).
3. **Dev server:** port **3000 is occupied by an unrelated app** (a personal portfolio). Run Slopcast on another port:
   `npm run dev -- --port 3100 --host 127.0.0.1`. The Mapbox token is already in `.env` (`VITE_MAPBOX_TOKEN`).
   Note: background dev servers started in a previous agent session do **not** survive that session — start your own.
4. **Verify the baseline is green** before changing anything:
   `npm run typecheck` · `npm test` · `npm run build` · `npm run ui:audit`.
   Expect **2 pre-existing failures** (see Gotchas) — they fail on `main` too and are not from this branch.
5. Pick up at **Task 1.3** (or any remaining task — they're largely independent; see priority order below).

## Visual verification (how this work was checked)

- App: drive Playwright against `http://127.0.0.1:3100/slopcast`. Theme switch via `[data-testid="theme-selector-trigger"]` then `[data-testid="theme-selector-option-<id>"]` (ids: `slate`, `permian`, `mario`, …).
- Components in isolation: `npm run storybook` (port 6006), then screenshot a story iframe, e.g.
  `http://localhost:6006/iframe.html?id=slopcast-map-groupinspector--default&viewMode=story`.
- Per CLAUDE.md: check WELLS tab across **slate + permian + mario**; run `npm run ui:audit` after visual changes; use `rounded-panel` outer / `rounded-inner` nested.

---

## Done (committed on this branch)

| Area | What | Verified |
|---|---|---|
| Permian basemap | Receded land/water + brighter labels so cities/wells read | screenshot |
| Surfaces + accent | `overlayPanelClass` → soft (alpha) border + shadow (no "white-outline glass"); active-group/"New Group" moved off secondary magenta/orange onto **primary cyan** | unit test + screenshot |
| Sidebar theming | Added the **missing Permian** sidebar glass tokens (was falling back to slate-blue); dusk + Noon | screenshot |
| Well legibility | Bigger markers, 3px accent **selection ring**, more visible permits/DUCs | unit test + manual |
| Connection warnings | Tested `deriveConnectionState` + persistent `ConnectionWarningBanner` (data unreachable → Retry/Use-mock; fallback → dismissible); Mapbox-down via centered panel | unit test + screenshot (healthy = hidden) |
| GroupInspector | 6-metric grid + CSS conic status donut + assumptions + tested `summarizeGroupWells` | **Storybook** (not yet in-app) |

## Remaining (priority order — "polish first" was the directive)

1. **Task 1.3 — Slim top bar.** Replace the oversized `WELLS/ECONOMICS` segmented pill with nav pills + `Scenario`/`Price deck` chips + a header connection chip + `Compare` + `Run economics`. Files: `src/components/slopcast/PageHeader.tsx`, `DesignWorkspaceTabs.tsx`. (A reusable connection chip can wrap the same `deriveConnectionState` helper already built.)
2. **Task 1.4 — Group context strip.** Slim row: active group + status counts + in-view + Filters/Clear. Overlaps `OverlayFiltersBar` — consolidate, don't duplicate.
3. **Task 1.5 integration — place `GroupInspector` in-app.** ⚠️ **Constraint:** the map's right edge currently holds the tool rail (`OverlayToolbar`), so adding the inspector as a right column needs a **layout reflow** (move/!restructure the rail) — this is why it was left at component+Storybook stage. Component is ready: `src/components/slopcast/map/GroupInspector.tsx`. Design intent: also retire the floating `OverlayGroupsPanel` (its metrics now live in the inspector), keeping group-switching in the left sidebar.
4. **Phase 2 — context-aware dock.** Bottom dock that shows the active group's economics by default and flips to selection analytics (Summary/Production/Probit) on lasso. Needs a mock `productionService` (deterministic monthly series from type-curve) behind the existing service/adapter pattern. See spec §5 + plan Phase 2.
5. **Phase 3 — map layers.** Economics-heat overlay (NPV/acre) + type-curve/formation polygons (mock GeoJSON), behind layer toggles. See spec §6 + plan Phase 3.

---

## Hard constraints & locked decisions (do not relitigate)

- **Scope:** map workspace **+ global chrome** (top bar, sidebars). Not the Economics/Scenarios deep views.
- **Atmosphere:** **per-theme tuning** — tame Permian, leave Slate. (Permian "wash" root cause: light-mode panel surfaces + a sidebar-token bug, **not** the basemap.)
- **Bottom dock:** **context-aware hybrid** (group economics ↔ selection analytics).
- **Pulled-in layers:** economics heat **+** type-curve/formation polygons. (Top Changes / Top Risks / review workflow stay **deferred**.)
- **Data:** deterministic **mock generators behind the existing `services/` adapter pattern** — a clean swap to Databricks later (table: `eds.well.tbl_well_summary_all`).
- **Priority:** polish first.
- **Preserve:** the Classic (Mario) `isClassic` fork — make it theme-native, don't remove it. Keep the **Python economics engine** (TS↔Python parity).
- **Theming rule:** components consume CSS custom properties + `ThemeFeatures`, not theme conditionals (except the `isClassic` fork).

## Gotchas

- **Pre-existing failing tests (NOT from this branch — confirmed on `main`):** `src/components/slopcast/PageHeader.test.tsx` (clicks a removed `theme-dropdown-toggle`; header now uses `ThemeSelectorMenu`) and `src/components/slopcast/ThemeSelectorMenu.stories.tsx` Interactive (can't find the `listbox`; menu works live). Don't mistake these for your own breakage; a small separate cleanup PR would fix them.
- The visual-companion brainstorm mockups live at `.superpowers/brainstorm/<session>/content/*.html` (gitignored) — useful reference for the target look (scope map, v2/v3 layouts, dock modes).
- IRR is **not** produced by the TS engine (`DealMetrics.irr` is often undefined); the inspector formats it defensively. `di`/`nri` may be stored as fraction or percent — `GroupInspector` handles both.

## Key paths

- **New:** `src/components/slopcast/map/{GroupInspector,StatusDonut,ConnectionWarningBanner}.tsx`, `{groupInspectorStats,connectionState}.ts` (+ `.test.ts`), `GroupInspector.stories.tsx`.
- **Modified:** `src/theme/registry.ts` (`overlayPanelClass`), `src/theme/definitions/permian/index.ts`, `src/styles/glass.css`, `src/components/GroupList.tsx`, `src/components/slopcast/map/wellLayerController.ts`, `src/components/slopcast/MapCommandCenter.tsx`.
