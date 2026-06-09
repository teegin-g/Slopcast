# Map Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Spec: `docs/superpowers/specs/2026-06-09-map-workspace-redesign-design.md`.

**Goal:** Turn the WELLS/map workspace from amateur into a professional, cinematic-but-legible command center: unified surfaces + accent discipline, per-theme atmosphere taming, slim chrome + status strip, connection warnings, a right-side group inspector, a context-aware bottom dock (group economics ↔ selection analytics), and economics-heat + type-curve/formation map layers.

**Architecture:** Token-driven theming (components consume CSS custom properties + `ThemeFeatures`, never theme conditionals except the preserved `isClassic` fork). New data behind deterministic mock services in `src/services/` matching the existing adapter pattern, swappable to Databricks later. New UI composed into `MapCommandCenter.tsx`; the floating `OverlayGroupsPanel` is retired into the right inspector.

**Tech Stack:** React + Vite + TypeScript, Mapbox GL, recharts + d3 (already installed), Vitest, Storybook, Playwright.

**Execution order = priority:** Phase 1 (polish/chrome) must land first. Phase 2 (dock). Phase 3 (layers). Commit atomically; run `npm run typecheck` + `npm test` per task; screenshot WELLS across slate/permian/mario after visual changes; open a draft PR after Phase 1's first green commit.

---

## File Structure

**New:**
- `src/types/production.ts` — `MonthlyProduction`, `WellProductionSeries`, normalization input types (exported via `src/types/index.ts`).
- `src/utils/probit.ts` (+ `.test.ts`) — percentile→probit-position math, color/shape scale helpers.
- `src/utils/productionNormalize.ts` (+ `.test.ts`) — normalize series to first producing month (t=0).
- `src/services/productionService.ts` — deterministic mock monthly production per well; adapter shape for future Databricks.
- `src/services/geologyService.ts` — mock formation/type-curve polygons (GeoJSON) + labels.
- `src/services/heatService.ts` — per-well NPV/acre values + legend domain (mock).
- `src/components/slopcast/map/GroupInspector.tsx` (+ `.stories.tsx`) — right sidebar.
- `src/components/slopcast/map/StatusDonut.tsx` — well-status donut (recharts Pie).
- `src/components/slopcast/map/ConnectionStatusChip.tsx` — header live/degraded/down chip.
- `src/components/slopcast/map/ConnectionWarningBanner.tsx` — persistent inline warning.
- `src/components/slopcast/map/MapLayersControl.tsx` — consolidated layers toggle.
- `src/components/slopcast/map/insightsDock/InsightsDock.tsx` (+ `.stories.tsx`) — dock shell + mode switch.
- `src/components/slopcast/map/insightsDock/useDockMode.ts` — derive mode from selection + remember last tab.
- `src/components/slopcast/map/insightsDock/ForecastTab.tsx`, `EconomicsTab.tsx`, `AssumptionsTab.tsx`, `WellListTab.tsx` (group mode).
- `src/components/slopcast/map/insightsDock/SummaryTab.tsx`, `ProductionChart.tsx`, `ProbitChart.tsx` (selection mode).

**Modified:**
- `src/theme/types.ts` — add `mapAtmosphereOpacity` to `ThemeFeatures`.
- `src/theme/definitions/*/index.ts` — set per-theme atmosphere opacity (tame permian).
- `src/theme/registry.ts` — unify `overlayPanelClass` (remove glass white-outline artifact).
- `src/styles/theme.css` — `--map-atmosphere-opacity` token + unified overlay-surface tokens.
- `src/components/slopcast/MapCommandCenter.tsx` — compose inspector + dock + layers; drop floating groups panel; apply atmosphere token; wire connection warning.
- `src/components/slopcast/map/useMapTheme.ts` — apply atmosphere opacity; surface Mapbox load failure.
- `src/components/slopcast/PageHeader.tsx` + `DesignWorkspaceTabs.tsx` — slim top bar, scenario/price chips, connection chip, status strip.
- `src/components/layout/AppShell.tsx` — left sidebar groups list polish; right inspector slot.
- `src/components/slopcast/map/OverlayGroupsPanel.tsx` — retire (delete usage; remove file once inspector covers it).
- `src/components/slopcast/WaterfallChart.tsx` — reuse in EconomicsTab.

---

## Phase 1 — Polish & Chrome (PRIORITY)

### Task 1.1: Per-theme atmosphere opacity token

**Files:** Modify `src/theme/types.ts`, `src/theme/definitions/*/index.ts`, `src/styles/theme.css`, `src/components/slopcast/map/useMapTheme.ts`

- [ ] **Step 1 — Test:** add `src/theme/themeAtmosphere.test.ts` asserting every theme in `THEMES` defines a numeric `features.mapAtmosphereOpacity` in `[0,1]`, and that `permian` < `slate`.
- [ ] **Step 2 — Run:** `npm test -- themeAtmosphere` → FAIL (property missing).
- [ ] **Step 3 — Implement:** add `mapAtmosphereOpacity: number` to `ThemeFeatures` in `theme/types.ts`; set per theme (slate ~0.9 baseline pass-through, permian ~0.35, others tuned). In `useMapTheme.ts` set `--map-atmosphere-opacity` on the map container from the active theme; the atmosphere/background layer over the map multiplies its opacity by this var.
- [ ] **Step 4 — Run:** `npm test -- themeAtmosphere` → PASS; `npm run typecheck`.
- [ ] **Step 5 — Verify UI:** screenshot WELLS in permian → wells/labels legible; slate unchanged.
- [ ] **Step 6 — Commit:** `feat(theme): add per-theme map atmosphere opacity; tame Permian wash`

### Task 1.2: Unify overlay panel surface + accent discipline

**Files:** Modify `src/theme/registry.ts`, `src/styles/theme.css`

- [ ] **Step 1 — Test:** `src/theme/registry.test.ts` — `overlayPanelClass('glass')` no longer contains the bright-border artifact; all three styles return a class string using `--surface`/`--border` consistent with sidebar.
- [ ] **Step 2 — Run:** FAIL.
- [ ] **Step 3 — Implement:** rewrite `overlayPanelClass` so glass/solid/outline all read as intentional over the map (no `border-[var(--border)]` full-opacity glow on dark); align radius/border with sidebar+toolbar. Replace the magenta/orange "New Group" accent usage with the theme primary/neutral.
- [ ] **Step 4 — Run:** PASS; `npm run typecheck`.
- [ ] **Step 5 — Verify:** `npm run ui:audit`; screenshot WELLS slate + permian.
- [ ] **Step 6 — Commit:** `refactor(theme): unify overlay panel surfaces and accent usage`

### Task 1.3: Slim top bar + scenario/price chips + connection chip

**Files:** Modify `src/components/slopcast/PageHeader.tsx`, `DesignWorkspaceTabs.tsx`; Create `ConnectionStatusChip.tsx`

- [ ] Test `ConnectionStatusChip.test.tsx`: renders `Live` (green) when connected, `Degraded`/`Unreachable` (amber/red) with message otherwise; never color-only (has icon + label).
- [ ] Run → FAIL. Implement chip consuming `useConnectionStatus` + a Mapbox-status prop. Run → PASS.
- [ ] Replace the oversized WELLS/ECONOMICS segmented pill with: nav pills + `Scenario ▾` + `Price deck ▾` chips + connection chip + theme chip + `Compare` ghost + `Run economics` primary. Keep wiring to existing handlers.
- [ ] `npm run typecheck`; screenshot header across slate/permian/mario.
- [ ] Commit: `feat(chrome): slim top bar, add scenario/price + connection chips`

### Task 1.4: Group context strip

**Files:** Create `src/components/slopcast/map/GroupContextStrip.tsx` (+ story); compose in `MapCommandCenter.tsx` (replaces part of OverlayFiltersBar)

- [ ] Test: given a group + status counts, renders name, well-count pill, Producing/DUC/Permit counts, "N of M in view", Filters[n], Clear.
- [ ] Run → FAIL → implement (consume existing filter/selection state; reuse status colors). Run → PASS.
- [ ] `npm run typecheck`; screenshot. Commit: `feat(map): add group context strip`

### Task 1.5: Right inspector + status donut

**Files:** Create `StatusDonut.tsx`, `GroupInspector.tsx` (+ stories); compose into `MapCommandCenter.tsx`; remove `OverlayGroupsPanel` usage

- [ ] Test `StatusDonut.test.tsx`: aggregates wells into Producing/DUC/Permit/Other counts + percentages summing to 100.
- [ ] Run → FAIL → implement donut (recharts `PieChart`, theme `chartPalette`). Run → PASS.
- [ ] Test `GroupInspector.test.tsx`: renders 6-stat grid from `DealMetrics`, donut, assumptions summary (qi/b/Di, CAPEX, OPEX, NRI), "View details".
- [ ] Run → FAIL → implement inspector (collapsible right sidebar; consume active group + derived metrics via existing `useDerivedMetrics`). Run → PASS.
- [ ] Remove `<OverlayGroupsPanel>` from `MapCommandCenter.tsx`; delete the component + story once green.
- [ ] `npm run typecheck`; `npm run ui:audit`; screenshot WELLS slate/permian/mario (inspector open).
- [ ] Commit: `feat(map): add right group inspector with status donut; retire floating groups panel`

### Task 1.6: Well legibility + connection warning banner

**Files:** Modify `src/components/slopcast/map/wellLayerController.ts`, `useMapTheme.ts`, `MapCommandCenter.tsx`; Create `ConnectionWarningBanner.tsx`

- [ ] Brighter status-colored markers; selected wells ringed in theme accent; verify ≥3:1 contrast on tamed backdrops (manual screenshot check across themes).
- [ ] Test `ConnectionWarningBanner.test.tsx`: shows persistent dismissible warning with impact text when Databricks OR Mapbox unreachable; hidden when both live.
- [ ] Run → FAIL → implement; wire Mapbox load/`error` event + token-missing + `useConnectionStatus` into a combined status. Run → PASS.
- [ ] `npm run typecheck`; screenshots (force a failure by unsetting token in a story/manual). Commit: `feat(map): boost well legibility and surface connection warnings`

### Task 1.7: Left sidebar groups list polish

**Files:** Modify `src/components/layout/AppShell.tsx`, `src/components/GroupList.tsx`

- [ ] Richer group rows (color dot, name, muted NPV, well count); `+ New` in header; `Compare groups` pinned bottom. No new behavior — restyle + reuse handlers.
- [ ] `npm run typecheck`; `npm run ui:audit`; screenshot. Commit: `feat(chrome): polish left sidebar groups list`

### Phase 1 close-out
- [ ] Run `.agents/validation/gate.sh` (or the subset: typecheck → test → build → ui:audit → ui:shots). Fix failures.
- [ ] Push branch; open **draft PR** with summary. Commit any fixups.

---

## Phase 2 — Context-aware Dock

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
- [ ] Stories + light tests (render with `DEFAULT_*`). Commit per tab or grouped: `feat(dock): group-mode forecast/economics/assumptions/well-list`

### Task 2.4: Selection-mode tabs
- [ ] `SummaryTab.tsx` (selected wells table).
- [ ] `ProductionChart.tsx` (normalized multi-line, color-by selector, hover tooltip).
- [ ] `probit.ts` (+ test): percentile rank → probit position; `ProbitChart.tsx` (scatter by P-rank, color-by + shape-by encodings).
- [ ] Stories + tests. Commit: `feat(dock): selection-mode summary/production/probit`

### Phase 2 close-out: gate, screenshots (group + selection modes, 3 themes), push.

---

## Phase 3 — Map Layers

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
- **Type consistency:** `MonthlyProduction`/`WellProductionSeries` defined once (2.1) and consumed by `productionNormalize`, `ProductionChart`; `mapAtmosphereOpacity` defined once (1.1). Dock mode strings `'group'|'selection'` consistent across `useDockMode`/`InsightsDock`.
