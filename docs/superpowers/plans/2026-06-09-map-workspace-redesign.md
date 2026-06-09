# Map Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Spec: `docs/superpowers/specs/2026-06-09-map-workspace-redesign-design.md`. Orientation: `docs/superpowers/HANDOFF.md`.

**Goal:** Turn the WELLS/map workspace from amateur into a professional, cinematic-but-legible command center: unified surfaces + accent discipline, per-theme atmosphere taming, slim chrome + status strip, connection warnings, a right-side group inspector, a context-aware bottom dock (group economics ↔ selection analytics), and economics-heat + type-curve/formation map layers.

**Architecture:** Token-driven theming (components consume CSS custom properties + `ThemeFeatures`, never theme conditionals except the preserved `isClassic` fork). New data behind deterministic mock services in `src/services/` matching the existing adapter pattern, swappable to Databricks later. New UI composed into `MapCommandCenter.tsx`; the floating `OverlayGroupsPanel` is retired into the right inspector.

**Tech Stack:** React + Vite + TypeScript, Mapbox GL, recharts + d3 (already installed), Vitest, Storybook, Playwright.

**Execution order = priority:** Phase 1 (polish/chrome) must land first. Phase 2 (dock). Phase 3 (layers). Commit atomically; run `npm run typecheck` + `npm test` per task; screenshot WELLS across slate/permian/mario after visual changes; open a draft PR after Phase 1's first green commit.

---

## Execution status — updated 2026-06-09

> **▶ Resume at Task 1.3.** Phase 1 *polish* is committed on `feat/map-workspace-redesign` (draft PR #7) and validated (typecheck/build/ui:audit/unit tests green; 2 failures pre-exist on `main`). This table is authoritative; some tasks were adapted from the original steps (noted inline + in commits).

| Task | Status | Notes |
|---|---|---|
| 1.1 Atmosphere | ✅ done (adapted) | No opacity token — the wash was Mapbox paint + light-mode panels, not one layer; tuned Permian map palette instead. Screenshot-verified. |
| 1.2 Surfaces + accent | ✅ done | Soft (alpha) border + shadow; secondary magenta/orange → primary cyan. Tests updated. |
| 1.3 Top bar | ⬜ not started | **← resume here** |
| 1.4 Context strip | ⬜ not started | Consolidate with `OverlayFiltersBar`, don't duplicate. |
| 1.5 Right inspector | ⚠️ component done, NOT integrated | Built + Storybook-verified. In-app placement blocked on tool-rail collision (needs layout reflow). |
| 1.6 Legibility + connection | ✅ done | Markers + 3px selection ring; tested `deriveConnectionState` + `ConnectionWarningBanner`. |
| 1.7 Sidebar | ✅ theming fixed | Added missing Permian sidebar tokens. Cosmetic "richer rows" deferred. |
| Phase 2 — dock | ⬜ not started | Context-aware hybrid + mock `productionService`. |
| Phase 3 — layers | ⬜ not started | Economics heat + type-curve/formation polygons. |

---

## File Structure

**New:**
- `src/types/production.ts` — `MonthlyProduction`, `WellProductionSeries`, normalization input types (exported via `src/types/index.ts`).
- `src/utils/probit.ts` (+ `.test.ts`) — percentile→probit-position math, color/shape scale helpers.
- `src/utils/productionNormalize.ts` (+ `.test.ts`) — normalize series to first producing month (t=0).
- `src/services/productionService.ts` — deterministic mock monthly production per well; adapter shape for future Databricks.
- `src/services/geologyService.ts` — mock formation/type-curve polygons (GeoJSON) + labels.
- `src/services/heatService.ts` — per-well NPV/acre values + legend domain (mock).
- ✅ `src/components/slopcast/map/GroupInspector.tsx` (+ `.stories.tsx`) — right sidebar. **DONE (component).**
- ✅ `src/components/slopcast/map/StatusDonut.tsx` — well-status donut (CSS conic-gradient). **DONE.**
- `src/components/slopcast/map/ConnectionStatusChip.tsx` — header live/degraded/down chip. *(Header version pending; logic exists in `connectionState.ts`.)*
- ✅ `src/components/slopcast/map/ConnectionWarningBanner.tsx` — persistent inline warning. **DONE.**
- `src/components/slopcast/map/MapLayersControl.tsx` — consolidated layers toggle.
- `src/components/slopcast/map/insightsDock/InsightsDock.tsx` (+ `.stories.tsx`) — dock shell + mode switch.
- `src/components/slopcast/map/insightsDock/useDockMode.ts` — derive mode from selection + remember last tab.
- `src/components/slopcast/map/insightsDock/ForecastTab.tsx`, `EconomicsTab.tsx`, `AssumptionsTab.tsx`, `WellListTab.tsx` (group mode).
- `src/components/slopcast/map/insightsDock/SummaryTab.tsx`, `ProductionChart.tsx`, `ProbitChart.tsx` (selection mode).
- ✅ *(added)* `src/components/slopcast/map/connectionState.ts` + `groupInspectorStats.ts` (+ tests) — tested pure helpers.

**Modified:**
- `src/theme/types.ts` — add `mapAtmosphereOpacity` to `ThemeFeatures`. *(Skipped — adapted, see 1.1.)*
- ✅ `src/theme/definitions/permian/index.ts` — Permian map palette tuned for legibility.
- ✅ `src/theme/registry.ts` — unified `overlayPanelClass` (soft border + shadow).
- ✅ `src/styles/glass.css` — added Permian sidebar tokens (dusk + Noon).
- ✅ `src/components/slopcast/MapCommandCenter.tsx` — wired connection banner; narrowed bottom error card; clarified Mapbox fallback. *(Inspector/dock/layers wiring pending.)*
- `src/components/slopcast/map/useMapTheme.ts` — (atmosphere applied via palette, not a token).
- `src/components/slopcast/PageHeader.tsx` + `DesignWorkspaceTabs.tsx` — slim top bar, scenario/price chips, connection chip, status strip. **(Task 1.3 — pending.)**
- `src/components/layout/AppShell.tsx` — left sidebar groups list polish; right inspector slot. **(Pending.)**
- `src/components/slopcast/map/OverlayGroupsPanel.tsx` — retire once inspector is integrated. **(Pending.)**
- ✅ `src/components/GroupList.tsx` — accent discipline (magenta/orange → cyan); hoisted static icon.
- ✅ `src/components/slopcast/map/wellLayerController.ts` — marker legibility + selection ring.
- `src/components/slopcast/WaterfallChart.tsx` — reuse in EconomicsTab. **(Phase 2.)**

---

## Phase 1 — Polish & Chrome (PRIORITY)

### ✅ Task 1.1: Per-theme atmosphere (ADAPTED → Permian basemap legibility)

**Adaptation:** the green wash was the Mapbox paint overrides + light-mode panel surfaces, not a single atmosphere layer, so no `--map-atmosphere-opacity` token was added. Instead the Permian map palette (land/water/label) was receded/brightened. Verified by screenshot.

- [x] Receded Permian `mapboxOverrides` land/water + brighter label color (`src/theme/definitions/permian/index.ts`).
- [x] Screenshot WELLS in Permian → city labels + wells legible; Slate unchanged.
- [x] Commit: `feat(theme): improve Permian basemap legibility`

### ✅ Task 1.2: Unify overlay panel surface + accent discipline

- [x] Test `src/theme/overlayPanelClass.test.ts` — soft (alpha) border + shadow; glass keeps blur.
- [x] Rewrite `overlayPanelClass` (`src/theme/registry.ts`) so glass/solid/outline read as grounded cards (no full-strength outline on the dark map).
- [x] Replace the magenta/orange "New Group" + active-group accent with the primary `--cyan` (`src/components/GroupList.tsx`).
- [x] Update `src/theme/registry.test.ts` exact-string assertion; `npm run typecheck`; `npm run ui:audit`; screenshot Slate.
- [x] Commit: surfaces/accent + (follow-up) hoist static clone icon.

### ⬜ Task 1.3: Slim top bar + scenario/price chips + connection chip  ◀ RESUME HERE

**Files:** Modify `src/components/slopcast/PageHeader.tsx`, `DesignWorkspaceTabs.tsx`; Create `ConnectionStatusChip.tsx` (can wrap the existing `deriveConnectionState` helper).

- [ ] Test `ConnectionStatusChip.test.tsx`: renders `Live` (green) when connected, `Degraded`/`Unreachable` (amber/red) with message otherwise; never color-only (icon + label).
- [ ] Run → FAIL. Implement chip consuming `useConnectionStatus` + a Mapbox-status prop. Run → PASS.
- [ ] Replace the oversized WELLS/ECONOMICS segmented pill with: nav pills + `Scenario ▾` + `Price deck ▾` chips + connection chip + theme chip + `Compare` ghost + `Run economics` primary. Keep wiring to existing handlers.
- [ ] `npm run typecheck`; screenshot header across slate/permian/mario.
- [ ] Commit: `feat(chrome): slim top bar, add scenario/price + connection chips`

### ⬜ Task 1.4: Group context strip

**Files:** Create `src/components/slopcast/map/GroupContextStrip.tsx` (+ story); compose in `MapCommandCenter.tsx` (consolidate with `OverlayFiltersBar`).

- [ ] Test: given a group + status counts, renders name, well-count pill, Producing/DUC/Permit counts, "N of M in view", Filters[n], Clear.
- [ ] Run → FAIL → implement (consume existing filter/selection state; reuse status colors). Run → PASS.
- [ ] `npm run typecheck`; screenshot. Commit: `feat(map): add group context strip`

### ⚠️ Task 1.5: Right inspector + status donut — COMPONENT DONE, INTEGRATION PENDING

**Done:** `StatusDonut.tsx`, `GroupInspector.tsx` (+ story), tested `summarizeGroupWells`. Verified in Storybook.

- [x] Test `groupInspectorStats.test.ts`: status breakdown (counts + %) and avg lateral; empty-safe.
- [x] Implement `StatusDonut` (CSS conic-gradient, theme-token hole).
- [x] Implement `GroupInspector` (6-stat grid via `KpiTile`, donut, assumptions, View details).
- [x] Storybook story (Default / NoEconomicsYet / Permian); screenshot-verified.
- [ ] **INTEGRATION (blocked on layout):** place the inspector as a right column in `MapCommandCenter.tsx`. ⚠️ The tool rail (`OverlayToolbar`) sits at the map's right edge — needs a reflow / rail move. Then remove `<OverlayGroupsPanel>` (metrics now live in the inspector) and delete the component + story.
- [ ] `npm run ui:audit`; screenshot WELLS slate/permian/mario (inspector open).
- [ ] Commit: `feat(map): integrate right group inspector; retire floating groups panel`

### ✅ Task 1.6: Well legibility + connection warning banner

- [x] Brighter status-colored markers; 3px accent selection ring (+radius bump); more visible permits/DUCs (`wellLayerController.ts`).
- [x] Test `connectionState.test.ts` (`deriveConnectionState`): ok/degraded/down, retry/use-mock, dismissibility, map-outage priority.
- [x] Implement `ConnectionWarningBanner` + wire into `MapCommandCenter` (data unreachable / fallback); narrow bottom card to trajectory-only; clarify Mapbox fallback copy.
- [x] `npm run typecheck`; screenshot (healthy = banner hidden). Commit: connection warnings.

### ✅ Task 1.7: Left sidebar groups list (theming bug)

- [x] Added the missing Permian sidebar glass tokens (was falling back to slate-blue): dusk + Noon (`src/styles/glass.css`).
- [x] Screenshot Permian (sidebar now theme-toned). Commit: `fix(theme): add missing Permian sidebar glass tokens`.
- [ ] *(Deferred, cosmetic)* Richer group rows (color dot, NPV, count), `Compare groups` pinned — `AppShell.tsx`/`GroupList.tsx`.

### Phase 1 close-out
- [x] Run validation subset (typecheck → test → build → ui:audit). 2 failing tests confirmed pre-existing on `main`.
- [x] Push branch; open **draft PR #7** with summary + status comment.

---

## Phase 2 — Context-aware Dock  ⬜ not started

### Task 2.1: Production types + mock service + normalization
- [ ] `src/types/production.ts`: `MonthlyProduction { month: number; oil: number; gas: number; boe: number }`, `WellProductionSeries { wellId: string; months: MonthlyProduction[] }`. Export via barrel.
- [ ] `productionNormalize.ts` (+ test): shift each series so first producing month = 0; test deterministic output.
- [ ] `productionService.ts`: deterministic generator from a well's type-curve (qi,b,Di) + seeded jitter; `getProductionForWells(ids): WellProductionSeries[]` with `mock` impl + adapter seam. Vitest: determinism + shape.
- [ ] Commit: `feat(data): mock production service + t=0 normalization`

### Task 2.2: Dock shell + mode switching
- [ ] `useDockMode.ts` (+ test): `selectedWellIds.size>0 ? 'selection' : 'group'`; remembers last tab per mode.
- [ ] `InsightsDock.tsx`: collapsible docked panel; header context label (blue/group vs green/selection + Clear selection); renders mode tabs. Story with both modes.
- [ ] Compose into `MapCommandCenter.tsx` (bottom of map column; opens on selection). Commit: `feat(map): context-aware insights dock shell`

### Task 2.3: Group-mode tabs
- [ ] `ForecastTab.tsx` (recharts ComposedChart: rate vs time, P10–P90 band, type curve, actuals; oil/gas/boe selector).
- [ ] `EconomicsTab.tsx` (reuse `WaterfallChart`).
- [ ] `AssumptionsTab.tsx` (param table) + `WellListTab.tsx` (group wells table; reuse `WellsTable`/`GroupWellsTable`).
- [ ] Stories + light tests (render with `DEFAULT_*`). Commit per tab or grouped.

### Task 2.4: Selection-mode tabs
- [ ] `SummaryTab.tsx` (selected wells table).
- [ ] `ProductionChart.tsx` (normalized multi-line, color-by selector, hover tooltip).
- [ ] `probit.ts` (+ test): percentile rank → probit position; `ProbitChart.tsx` (scatter by P-rank, color-by + shape-by encodings).
- [ ] Stories + tests. Commit: `feat(dock): selection-mode summary/production/probit`

### Phase 2 close-out: gate, screenshots (group + selection modes, 3 themes), push.

---

## Phase 3 — Map Layers  ⬜ not started

### Task 3.1: Layers control + economics heat
- [ ] `MapLayersControl.tsx` (Wells/Laterals/Economics heat/Type-curve areas/Satellite) consolidating existing toggles.
- [ ] `heatService.ts`: per-well NPV/acre (mock) + legend domain. Heat overlay layer + Low→High legend.
- [ ] Tests for heat domain; screenshots. Commit: `feat(map): layers control + economics-heat overlay`

### Task 3.2: Type-curve / formation polygons + furniture
- [ ] `geologyService.ts`: mock GeoJSON polygons + labels (Wolfcamp A/B/D, type-curve areas).
- [ ] Render polygon layer + labels; add minimap inset, scale bar, compass consistent with theme surfaces.
- [ ] Screenshots; commit: `feat(map): type-curve/formation polygons + map furniture`

### Phase 3 close-out: full gate; update PR description; final screenshots across slate/permian/mario.

---

## Self-Review

- **Spec coverage:** chrome (1.3/1.4/1.7), atmosphere (1.1), surfaces/accent (1.2), inspector (1.5), well legibility (1.6), connection (1.3 chip + 1.6 banner), dock hybrid (2.x), production/probit (2.4), layers heat+polygons (3.x), mock adapters (2.1/3.1/3.2). All spec sections map to a task.
- **Placeholders:** none — each task names exact files, test focus, command, and commit. (Phase 2–3 steps are task-level by design for inline execution by the same author who holds the spec; flesh code per-task during execution.)
- **Type consistency:** `MonthlyProduction`/`WellProductionSeries` defined once (2.1) and consumed by `productionNormalize`, `ProductionChart`; dock mode strings `'group'|'selection'` consistent across `useDockMode`/`InsightsDock`.
