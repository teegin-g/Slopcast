# Slopcast Refactor Catalog

> Generated 2026-05-31 on branch `react-doctor/2026-05-30/full-triage` by a 6-agent fan-out audit of the whole repo (frontend, theme system, hooks/services/utils, app shell, `rig-scheduler` sub-app, backend, scripts, repo root). **Analysis only — no source files were modified.**
>
> Goal: a menu of *independent, simplification-focused* refactors to de-clutter the codebase. Each item carries Impact / Effort / Risk / Dependencies / Evidence so you can cherry-pick. IDs are stable (`R1-xx` … `R6-xx`) so they can be referenced in commits/PRs.

## How to read this

- **Part 1 — Cross-cutting epics**: related items that are best done together (the highest-leverage work).
- **Part 2 — Quick wins**: high-ROI items that are independent, low-risk, and small. Do these first.
- **Part 3 — Bugs surfaced**: correctness issues the audit found while looking for clutter. Triage separately from cosmetics.
- **Part 4 — Full catalog by domain**: every item with full detail.
- **Part 5 — Priority matrix**: one-table view of all 79 items.

Effort: **S** ≈ <1h–½day · **M** ≈ ½–2 days · **L** ≈ multi-day.

> **Scope corrections (2026-05-31, post-audit):** Two of the audit's original "remove" recommendations are overridden by design intent:
> 1. **The Python economics engine is retained** — it's the user's reference implementation, kept to compare against the TS engine. Epic A is reframed from *delete* to *wire up a dev-only engine toggle* (R4-01) **plus an automated TS↔Python parity test as a drift backstop** (R4-11). (R4-01, R6-13, R6-14, R4-11 updated.)
> 2. **The Classic theme is retained** — Epic B *centralizes* the `isClassic` fork into theme-native primitives so Classic conforms to the theme system; it does **not** remove classic rendering.

---

## Part 1 — Cross-cutting epics

These bundle items that share a theme. Each epic is shippable as a sequence of small PRs.

### Epic A — Wire up a dev-only TS↔Python engine toggle *(retain both engines)*
**The Python engine stays** — it's the user's reference implementation, kept for comparison against the TS engine. The dual-engine adapter (`economicsEngine.ts`, `pyEngine`) and backend `/api/economics/*` routes already exist, but the comparison UI (`EngineToggle` / `EngineComparisonPanel`) was deleted, so the Python path is currently **unreachable**. The work is to make it reachable via a **dev-only toggle** — not to delete anything.
- **R4-01** Keep `economicsEngine.ts`; re-expose `getEngine`/`setEngineId` and add a dev-only engine switch (e.g. in `DebugOverlay`) that flips `ENGINE_ID_KEY` so `pyEngine` becomes reachable
- **R6-13** Keep `backend/economics.py` + `/api/economics/*` routes wired so the toggle can hit them
- **R6-14** Document which routes are always-live (`/api/spatial/*`) vs dev-comparison (`/api/economics/*`)
- **R4-11** Extend the `economics.parity.*` test to run **both** engines on the shared fixture and assert TS≈Python within tolerance — an automated backstop against drift (complements the manual toggle)

### Epic B — Make Classic theme-native: centralize `isClassic` into primitives *(largest clarity win)*
**The Classic theme is retained** — this epic does NOT remove classic rendering; it makes Classic *conform* to the theme system. Today `isClassic` is threaded through the tree and branched inline **100s of times** (EconomicsGroupBar 28, IntegrationsPage 50, HubPage 35, MapCommandCenter 23, DesignWellsView 19, OperationsConsole 18, AuthPage 17…), violating design principle #3 ("theme-native, not theme-aware — the `isClassic` branch is the *only* hard fork"). Push the classic fork into a few shared primitives (`<ThemePanel>`, `<ThemeButton>`, `<ScenarioCard>`) + CSS tokens / `ThemeFeatures`, so leaf components stop knowing about themes **while Classic still renders exactly as it does today**.
- **R3-02** Stop prop-drilling `isClassic`; derive via `useTheme()` locally (TaxControls, ConnectionForm, SchemaMapper)
- **R3-04** Collapse `GroupList`'s classic/modern tree into one tree (classic look via tokens/root-level classes)
- **R3-06** Collapse `SensitivityMatrix`'s duplicated classic/modern table
- **R3-07** Extract `<ScenarioCard>` to fold ScenarioDashboard's 4 classic/modern forks into one
- **R5-13** Introduce `<ThemeButton>`/`<ThemePanel>` page primitives (HubPage, IntegrationsPage, AuthPage)
- **R2-13** Move `isClassic` out of slopcast leaf-component interfaces into primitives (classic retained)

### Epic C — Decompose the god files
Five files concentrate most of the complexity. Each decomposition is independent of the others.
- **R6-10** `rig-scheduler/src/App.tsx` (1445 LOC) → ~9 files
- **R2-01** `MapCommandCenter.tsx` (849) → 4 hooks + 2 sub-components *(do R2-02 first)*
- **R3-05** `MapVisualizer.tsx` (584) → `useMapboxGL` / `useD3WellMap` / `useMapboxHeatmap`
- **R5-01** `IntegrationsPage.tsx` (554) → `useIntegrationWizard` + `useIntegrationsList` *(also fixes a bug)*
- **R3-03 + R3-07** `ScenarioDashboard.tsx` (538) → `useScenarioResults` hook + `<ScenarioCard>`

### Epic D — Delete dead code (~700+ LOC, all independent, all low-risk)
Confirmed-unused (grep-verified zero call sites): **R4-06** projectRepository collaboration block (324 LOC), **R4-09** `useGridKeyboardShortcuts` (104), **R2-04** dead Skeletons (70), **R4-10** `markRender`/`useRenderTime` (40), **R1-04** `THEME_BACKGROUNDS`, **R1-11** `.sc-titlebar--brown`, **R2-03** zombie `showShortcutsHelp`/`pageMode`, **R2-05** `buildWellColorMatchExpression`, **R5-08** dead `GEMINI_API_KEY` vite inject, **R5-12** dead `/home` route, **R6-12** unused `packages/component-playground-shared`, **R6-15/R6-16** orphaned scripts.

### Epic E — Repo hygiene (root de-clutter)
The repo root is full of tracked scratch/binary artifacts. **R6-01** is the big one (~189 tracked PNGs in `output/`). Also **R6-02** root JPEGs, **R6-03** scratch HTML/notebook, **R6-04** `problem hue/`, **R6-05** archived AI reports, **R6-06** `branch-comparison/`, **R6-07** untracked-but-unignored dirs, **R6-08** `metadata.json`, **R6-09** stray fixtures/codex, **R6-17/R6-18** playground + duplicate snapshot scripts. *(Deleting tracked files is higher-blast-radius — confirm with the team first.)*

### Epic F — Extract shared utilities/primitives (DRY)
- **R1-01** `useCanvasBackground` hook (collapses ~250 LOC across 6 background files)
- **R1-02** shared `seededRandom` (4 divergent copies — a real bug source)
- **R1-03** shared `getScanlinePattern` / `drawVignette`
- **R3-01** `EditableItemTable` primitive (4 controls/tables share ~260 LOC of shell)
- **R2-07 / R2-12** shared table formatters + `<SortableHeader>`/`<ResizeHandle>`
- **R2-06** dedup `DriverInsight`/`ShockSummary`/`ScenarioRanking` types
- **R4-02** `supabaseGuards.ts` (`requireSupabase`/`requireUserId`)
- **R4-03** unify JSONB unwrap helpers
- **R5-10** shared `formatDateTime`

---

## Part 2 — Quick wins (do first)

Independent · low risk · small effort · high ROI. Roughly in priority order:

| ID | One-liner | LOC / effect |
|----|-----------|--------------|
| R4-06 | Delete dead collaboration code in projectRepository | −324 LOC |
| R4-09 | Delete unused `useGridKeyboardShortcuts` | −104 LOC |
| R2-04 | Delete dead Skeleton components | −70 LOC |
| R4-10 | Delete dead perf-monitor helpers | −40 LOC |
| R2-02 | Remove phantom props on MapCommandCenter (**bug**) | correctness |
| R6-01 | `git rm -r --cached output/` + gitignore | −189 blobs |
| R1-02 | Shared `seededRandom` util | fixes silent divergence |
| R1-04 | Delete `THEME_BACKGROUNDS` dead const | −9 LOC |
| R1-11 | Delete `.sc-titlebar--brown` dead CSS | −10 LOC |
| R2-03 | Remove zombie `showShortcutsHelp`/`pageMode` state | clarity |
| R2-05 | Delete `buildWellColorMatchExpression` stub | −6 LOC |
| R5-08 | Remove dead `GEMINI_API_KEY` vite inject | config |
| R5-12 | Remove dead `/home` route | route table |
| R4-02 | `supabaseGuards.ts` extraction | −32 LOC |
| R4-03 | Unify JSONB unwrap | −11 LOC |
| R4-04 | Promote economics magic constants | de-risk 5 sites |
| R5-10 | Shared `formatDateTime` | −15 LOC |
| R6-02/03 | Remove root JPEGs / scratch HTML+notebook | −724 KB |

---

## Part 3 — Bugs surfaced (triage separately)

The audit was hunting clutter, but found real defects worth fixing regardless of the refactors:

- **R2-02** — `MapCommandCenter` declares & receives `theme`, `themeId`, `mobilePanel`, `onSetMobilePanel` but silently discards all four (component uses `useTheme()` internally). Callers re-pass stale values expecting effect; there is none.
- **R4-07** — `useDerivedMetrics` hardcodes `MOCK_WELLS` for driver shocks & breakeven instead of taking `wells`. In live-data mode (`spatialSourceId === 'live'`) the analytics run against the **wrong dataset**.
- **R5-01** — `IntegrationsPage` stores wizard connection params in a `useRef`, so Step 3 "review" can show **stale params** if `ConnectionForm` fires `onSave` with updated values.
- **R3-10** — `ConnectionForm` re-implements `getDerivedStateFromProps` mid-render (`if (prev !== config) setState(...)`), breaking StrictMode double-invocation.
- **R3-08** — `DebugOverlay` and `DebugProvider` register **two** independent `Ctrl+Shift+D` handlers toggling **unsynchronized** state; provider can scan while overlay is hidden.
- **R1-06** — `StormDuskBackground` is the only animated canvas with **no `prefers-reduced-motion`** check (WCAG 2.3.3).

---

## Part 4 — Full catalog by domain

### Domain 1 — Backgrounds & theme system
`src/components/*Background*.tsx`, `src/components/permian/`, `src/theme/`, `src/styles/`

#### R1-01 — Extract `useCanvasBackground` hook · Impact High · Effort M · Risk Low · Independent
**Files:** Hyperborea/Tropical/Moonlight/MarioOverworld/StormDusk/OilRigBackground2D; `permian/backgroundLifecycle.ts`
**Problem:** RAF lifecycle (canvasRef, rafRef, DPR resize, motionQuery, listener wiring, teardown) is copy-pasted ~35–50 LOC across all six canvas backgrounds. `backgroundLifecycle.ts` already has the right hooks (`useReducedMotionPreference`, `usePageVisibilityPaused`, `useAtmosphereFxLevel`) but only Permian uses them.
**Fix:** Add `src/hooks/useCanvasBackground.ts` composing those hooks + ResizeObserver + RAF; each background shrinks to geometry init + a `draw` callback. Once it lands, R1-05/R1-06/R1-08 collapse to near-zero changes.
**Evidence:** Hyperborea 350–1026, Tropical 153–958, Moonlight 320–489, Mario 335–403, StormDusk 679–771, OilRig 252–304.

#### R1-02 — Shared `seededRandom` util · Impact High · Effort S · Risk Low · Independent
**Problem:** `seededRandom()` copy-pasted in 4 files with **two divergent multipliers** (16807 vs 48271), so reusing a seed across scenes silently changes geometry.
**Fix:** `src/utils/seededRandom.ts`; canonicalize the multiplier; replace 5 inlined copies.
**Evidence:** Hyperborea:52, Tropical:44, StormDusk:96, Mario:53, Moonlight:50 (inline).

#### R1-03 — Shared `getScanlinePattern` / `drawVignette` · Impact Med-High · Effort S · Risk Very Low · Independent
**Problem:** `getScanlinePattern()` byte-identical in Hyperborea:404–415 & Tropical:188–199; `drawVignette()` repeated (with drift) in 5 files.
**Fix:** `src/utils/canvasPatterns.ts` with parameterized opacity/radius.

#### R1-04 — Delete dead `THEME_BACKGROUNDS` const · Impact Low · Effort Trivial · Risk None · Independent
**Problem:** `backgrounds.ts:11–19` defines an unexported, never-imported registry. Grep: 0 external refs.
**Fix:** Delete lines 11–19 (the 7 lazy exports below it are the real API).

#### R1-05 — Port `OilRigBackground2D` to lifecycle hooks · Impact Med · Effort S · Risk Low · After R1-01 (optional)
**Problem:** The 2D fallback manually reimplements visibility/motion/RAF that its sibling `backgroundLifecycle.ts` already provides (252–304).

#### R1-06 — Add `prefers-reduced-motion` to StormDusk · Impact Med (a11y) · Effort S · Risk None · Independent
**Problem:** Only animated background with no motion check — runs RAF unconditionally. Also standardize its good DPR cap (`min(dpr,2)`) elsewhere.

#### R1-07 — Wrap StormDusk canvas in positioning div · Impact Low · Effort Trivial · Risk Very Low · Independent
**Problem:** Returns a bare `<canvas>`; every peer returns `<div style="position:absolute;inset:0">`. Fragile implicit contract.

#### R1-08 — Extend FX-intensity detection to all canvas backgrounds · Impact Med · Effort S-M · Risk Low · After R1-01
**Problem:** `fx-max` MutationObserver only exists in Hyperborea:392–402; other canvases ignore the user's FX level while CSS overlays intensify — visible inconsistency.

#### R1-09 — Fix per-frame grain allocation in Moonlight · Impact Med (perf) · Effort S · Risk Very Low · Independent
**Problem:** `drawGrain()` (391–418) allocates an offscreen canvas + ImageData + pattern **every frame**; peers build once. GC pressure at 60fps.

#### R1-10 — Document/expand `TOKEN_VAR_NAMES` boundary · Impact Low-Med · Effort S · Risk Very Low · Independent
**Problem:** `tokenRuntime.ts` manages only 8 color tokens for runtime override; semantic colors (`--text`,`--muted`,`--success`,`--warning`,`--danger`,`--violet`) live only in static CSS and can't be runtime-switched. Inconsistent; undocumented boundary.

#### R1-11 — Delete dead `.sc-titlebar--brown` CSS · Impact Low · Effort Trivial · Risk Very Low · Independent
**Problem:** `theme.css:2136–2145` class + `--bar-brown-*` back-compat aliases have 0 JSX usages (already aliased to neutral).

---

### Domain 2 — Slopcast workspace components
`src/components/slopcast/**`

#### R2-01 — Decompose `MapCommandCenter` (849 LOC) · Impact High · Effort L · Risk High · After R2-02
**Problem:** One file owns map init, WebGL layers, batch upload, lasso/rect selection, GeoJSON, feature-state, theme overrides, satellite toggle, nav, tooltip, overlays. 16 `useEffect`, 23 `isClassic`, 34 props.
**Fix:** Extract `useMapInit`, `useMapLayers`, `useMapSelection`, `useMapTheme` + `<MapOverlayUI>` / `<MapNavControls>`; component becomes a thin orchestrator.

#### R2-02 — Remove phantom props on MapCommandCenter (**bug**) · Impact High · Effort S · Risk Low · Independent
**Problem:** `theme`,`themeId`,`mobilePanel`,`onSetMobilePanel` declared+passed but never read (component uses `useTheme()`). Silently dropped.
**Fix:** Delete from interface + SlopcastPage call site.

#### R2-03 — Remove zombie `showShortcutsHelp` / `pageMode` · Impact Med · Effort S · Risk Low · Independent
**Problem:** State toggled & re-exported from `useSlopcastWorkspace`/`useWorkspaceUiState` but never read (KeyboardShortcutsHelp & LandingPage were deleted). `'landing'` branch unreachable.

#### R2-04 — Delete dead Skeleton components · Impact Med · Effort S · Risk Low · Independent
**Problem:** `KpiGridSkeleton`/`ChartSkeleton`/`GroupComparisonSkeleton` (Skeleton.tsx 61–130) unexported, unused (~70 LOC). Only `TableSkeleton`/`FadeIn` are used.

#### R2-05 — Delete `buildWellColorMatchExpression` stub · Impact Low · Effort S · Risk Low · Independent
**Problem:** Private, never called, just delegates; params `_`-prefixed (wellLayerController.ts:36–42).

#### R2-06 — Dedup `DriverInsight`/`ShockSummary`/`ScenarioRanking` types · Impact Med · Effort S · Risk Low · Independent
**Problem:** Re-declared in EconomicsDriversPanel:7–28 & OperationsConsole:6–22; canonical `ScenarioRanking` already in `domain/workspace/selectors.ts`, `KeyDriverInsights` in `useDerivedMetrics`. Silent divergence across 4 files.

#### R2-07 — Shared `formatFeet` / feet formatter · Impact Low · Effort S · Risk Low · Independent
**Problem:** Identical `Intl.NumberFormat` + `formatFeet` in WellsTable:25–29 & GroupWellsTable:16–20.

#### R2-08 — Extract `<WellSelectionActions>` (triplicated in DesignWellsView) · Impact Med · Effort S-M · Risk Low · Independent
**Problem:** Assign/Create/Select-All/Clear button group duplicated in 3 layout slots; 19 `isClassic` branches compound it. Also duplicate `data-testid`s shared with MapCommandCenter.

#### R2-09 — Extract GL state save/restore + reduced-motion in WebGL layers · Impact Med · Effort M · Risk Med · Independent
**Problem:** `MapWellboreLayer.ts` & `MapSelectionTrail.ts` duplicate ~40 LOC of GL state snapshot/restore + MediaQueryList wiring. A fix in one doesn't fix the other.
**Fix:** `map/glUtils.ts` (`saveGlState`/`restoreGlState`) + `createReducedMotionListener`.

#### R2-10 — Move `CompactRunBar` out of OperationsConsole · Impact Low-Med · Effort S · Risk Low · Independent
**Problem:** 130-LOC file-scoped component used once; bloats a 461-LOC file, blocks isolated Storybook.

#### R2-11 — Extract `<KpiTile>` from DesignEconomicsView one-offs · Impact Low · Effort S · Risk Low · Independent
**Problem:** `BottomKpiStrip` & `GroupPulse` (45–98) are two inline instances of the same tile grid.

#### R2-12 — Shared table primitives (Wells/CashFlow) · Impact Low-Med · Effort M · Risk Low · After R2-07
**Problem:** Both TanStack tables duplicate ~50 LOC of sort button, resize handle, sticky thead, row classes.
**Fix:** `<SortableHeader>`, `<ResizeHandle>`, `tableRowClass()` in `slopcast/table/`.

#### R2-13 — Move `isClassic` out of leaf interfaces (classic retained) · Impact High · Effort L · Risk Med · See Epic B
**Problem:** `isClassic` branched 23/28/18/19× in MapCommandCenter/EconomicsGroupBar/OperationsConsole/DesignWellsView. Leaky abstraction bypassing `ThemeFeatures`/tokens.
**Goal:** Classic still renders identically; the fork moves into shared primitives/tokens so leaf components no longer take or branch on `isClassic`. Not a removal of the classic theme.

---

### Domain 3 — Shared / top-level components
controls, tables, charts, `ui/`, `inline/`, `integrations/`, `layout/`, `auth/`, `debug/`

#### R3-01 — Extract `EditableItemTable` primitive · Impact High · Effort M · Risk Low · Independent
**Problem:** Capex/Opex/Ownership/DeclineSegment controls each re-implement the same table shell (wrapper, 12-col header, scroll region, delete button, empty state, add footer) + duplicated `inlineValueClass`/`inlineInputClass`/`headerClass`. ~260 LOC of structural dup.
**Fix:** `slopcast/economics/EditableItemTable.tsx` + `useControlsStyles(isClassic)`.
**Evidence:** Capex 185–297, Opex 94–218, Ownership 106–235, DeclineSegment 53–213.

#### R3-02 — Stop prop-drilling `isClassic` to leaves · Impact Med · Effort S · Risk Low · Independent
**Problem:** TaxControls, ConnectionForm, SchemaMapper take `isClassic` as a prop while peers derive it via `useTheme()`.

#### R3-03 — Extract `useScenarioResults` from ScenarioDashboard · Impact Med · Effort M · Risk Low · Independent
**Problem:** 538-LOC component does economics calc (83–122) + chart prep + layout; also embeds a never-reused local `AccordionItem` (34–69).

#### R3-04 — Collapse `GroupList` classic/modern fork · Impact Med · Effort M · Risk Med · Independent
**Problem:** Two full render trees (21–110 / 111–187), semantically identical. Hard fork that violates design principle #3.

#### R3-05 — Extract D3/Mapbox hooks from MapVisualizer (584) · Impact High · Effort L · Risk Med · Independent
**Problem:** 13 useState, 4 useRef, 5 useEffect; a 165-LOC D3 effect with a 17-item dep array; owns init+satellite+heatmap+filter+resize+selection.
**Fix:** `useMapboxGL` / `useD3WellMap` / `useMapboxHeatmap`.

#### R3-06 — Collapse `SensitivityMatrix` table fork · Impact Med · Effort S · Risk Low · Independent
**Problem:** Classic/modern tables (106–149 / 152–195) differ only by 3 class strings; use tokens (`text-theme-text`) instead.

#### R3-07 — Extract `<ScenarioCard>` (4 forks) · Impact Med · Effort M · Risk Low · After R3-03
**Problem:** Scenario list (207–267), summary card (397–438), portfolio overlay (444–491) each fork classic/modern.

#### R3-08 — Fix duplicate `Ctrl+Shift+D` handler (**bug**) · Impact Med · Effort S · Risk Low · Independent
**Problem:** DebugOverlay (224–235) & DebugProvider (17–22) register separate handlers toggling unsynchronized state.
**Fix:** Let DebugProvider own visibility; DebugOverlay becomes pure display.

#### R3-09 — `TaxControls` should use `InlineEditableValue` · Impact Med · Effort S · Risk Low · After R3-02
**Problem:** Only controls panel using raw `<input type=number>` (70–122) — no click-to-edit/validation/commit UX; duplicated input class strings.

#### R3-10 — Fix `ConnectionForm` derived-state anti-pattern (**bug**) · Impact Med · Effort S · Risk Low · Independent
**Problem:** Manual `getDerivedStateFromProps` mid-render (24–36); breaks StrictMode. Replace with `useEffect` or `key` reset.

#### R3-11 — Narrow `AppShell` 18-field prop bag · Impact Med · Effort M · Risk Med · Independent
**Problem:** Single opaque `workspace` prop with 18 fields drilled to PageHeader/Sidebar; adding a field touches interface+call site+consumers.
**Fix:** Split into `layout`/`nav` sub-objects, or expose a `WorkspaceContext`.

---

### Domain 4 — Hooks / services / utils / engine
`src/hooks/`, `src/services/`, `src/utils/`, `src/domain/`

#### R4-01 — Make the dual-engine toggle reachable (dev-only) · Impact Med · Effort M · Risk Low · Independent · See Epic A
**Keep** `economicsEngine.ts` — it's the comparison adapter for the user's Python reference engine. Today `getEngine`/`getAllEngines`/`pyEngine` are unexported & uncalled and `setEngineId()` has no callsite, so the Python path is unreachable (the EngineToggle UI was deleted).
**Fix:** Re-export `getEngine`/`getAllEngines`; add a **dev-only** engine switch (e.g. a control in `DebugOverlay`) that calls `setEngineId('python'|'typescript')`, persists via `ENGINE_ID_KEY`, and surfaces the active engine + `ECONOMICS_ENGINE_VERSION`. Leave `parityStatus`/`p_run_kind` in place (they record which engine produced a run). Do **not** delete the adapter or the Python path.

#### R4-02 — `supabaseGuards.ts` extraction · Impact Med · Effort S · Risk Low · Independent
**Problem:** `requireSupabase()`/`requireUserId()` byte-identical in projectRepository:163–179 & integrationService:38–54.

#### R4-03 — Unify JSONB unwrap helpers · Impact Med · Effort S · Risk Low · Independent
**Problem:** `integrationService.unwrapContract` duplicates `projectContracts.unwrapJsonbContract` (only diff: a `label` param).

#### R4-04 — Promote economics magic constants · Impact Med · Effort S · Risk Low · Independent
**Problem:** `monthsToProject=120` (×2) and `monthlyDiscountRate=0.10/12` (×3) inlined across economics.ts:282,352,456,515,610. Changing horizon/rate = 5 edits.
**Fix:** `export const MONTHS_TO_PROJECT` / `MONTHLY_DISCOUNT_RATE`.

#### R4-05 — Type segment array as `ForecastSegment` · Impact Low · Effort S · Risk Low · Independent
**Problem:** `evaluateMultiSegmentProduction` (224–227) uses an inline anon type duplicating `ForecastSegment` (note `initialDecline` vs `di` mismatch to reconcile).

#### R4-06 — Delete dead collaboration code in projectRepository · Impact High · Effort S · Risk Low · Independent
**Problem:** Bottom 324 LOC (384–708) = 12 module-private invite/member/audit/comment functions; UIs deleted; 0 call sites. File drops 708→~383.

#### R4-07 — `useDerivedMetrics` must take `wells` (**bug**) · Impact Med · Effort S · Risk Low · Independent
**Problem:** Hardcodes `MOCK_WELLS.filter(...)` (102,167); in live mode shocks/breakeven run on the wrong dataset.

#### R4-08 — Route well-filter localStorage through `workspacePreferences` · Impact Med · Effort S · Risk Low · Independent
**Problem:** `useWellFiltering` (5–24) hits raw `localStorage` (own prefix), bypassing the `safeGet/safeSet` facade; quota errors throw uncaught. (6 other raw calls to audit.)

#### R4-09 — Delete unused `useGridKeyboardShortcuts` · Impact Med · Effort S · Risk Low · Independent
**Problem:** 104 LOC (63–166), unexported, 0 callers. File drops 166→62.

#### R4-10 — Delete dead `markRender`/`useRenderTime` · Impact Low · Effort S · Risk Low · Independent
**Problem:** usePerformanceMonitor.ts:183–222 unexported, 0 callers.

#### R4-11 — Extend `economics.parity.*` to a real TS↔Python parity check · Impact Med · Effort S-M · Risk Low · After R4-01
**Problem:** `economics.parity.test.ts` + the `dual-parity-rich.json` fixture exist, but the test only exercises the **TS** calculator against hard-coded expected values — it never compares against the **Python** engine. With both engines retained and the dev-only toggle (R4-01) offering only manual, eyeball comparison, TS/Python drift can go undetected.
**Fix:** Make the fixture's golden outputs the **Python engine's** results (regenerate via a small script that runs `backend/economics.py` or hits `/api/economics/*` on the shared inputs), then have the vitest parity test assert the TS calculator matches within a numeric tolerance (e.g. relative error < 1e-6 on NPV10 / IRR / EUR / payout / after-tax / levered). Keep it self-contained for CI (check in the Python-derived golden values; no live backend needed at test time). Regenerate the golden whenever either engine's formulas change. This is the automated safety net behind the manual toggle.

---

### Domain 5 — App shell / pages / types / constants / config
`src/App.tsx`, `src/index.tsx`, `src/pages/`, `src/types/`, `src/constants.ts`, `src/auth/`, build config, `package.json`

#### R5-01 — Decompose `IntegrationsPage` (554) + fix stale-params bug · Impact High · Effort M · Risk Low · Independent
**Problem:** Mixes CRUD fetching, a wizard state machine, and full render; wizard params live in a `useRef` so Step 3 can show stale data.
**Fix:** `useIntegrationWizard` (ref→`useState`) + `useIntegrationsList` + `<IntegrationWizard>`/`<IntegrationsTable>`.

#### R5-02 — One type-import convention (barrel only) · Impact Med · Effort M · Risk Low · Independent
**Problem:** ~27 direct-submodule imports vs ~41 barrel imports, no rule; barrel also re-exports runtime constants (TAX_PRESETS etc.) causing tree-shaking surprises.
**Fix:** Barrel-only; move runtime constants out of `types/economics.ts` into `constants.ts`.

#### R5-03 — Reconcile `ScheduleParams` vs `CapexAssumptions` overlap · Impact Med · Effort M · Risk Med · Independent
**Problem:** `drillDurationDays`/`stimDurationDays`/`rigStartDate` (+`rigCount` "Legacy") duplicated across both types, manually kept in sync → silent schedule drift. Touches serialized Supabase shapes.

#### R5-04 — Rename misnamed `types/integrations.ts` · Impact Med · Effort S · Risk Low · After R5-02
**Problem:** Contains project/org **persistence records**, not integration types; real integration types live in a *service* file (`integrationService.ts`).
**Fix:** Rename to `types/persistence.ts`; move `IntegrationConfig`/`ConnectionType`/`IntegrationStatus` into a real `types/integrations.ts`.

#### R5-05 — Unify `DealScenarioRecord` / `ProjectScenarioRecord` · Impact Low · Effort S · Risk Low · After R5-04
**Problem:** Near-identical shapes differing only by `dealId` vs `projectId`. Extract `BaseScenarioRecord`.

#### R5-06 — Enable `tsconfig "strict": true` · Impact High · Effort L · Risk Low(enable)/Med(fix) · Independent
**Problem:** No strict flags → 69+ `any`/`@ts-ignore` invisible to the compiler. Prerequisite for confident large refactors. Replace `catch (err: any)` → `unknown` + guards.

#### R5-07 — Extract shared Vite base config · Impact Med · Effort S · Risk Low · Independent
**Problem:** `vite.config.ts` & `vitest.config.ts` both re-declare `tailwindcss()`/`react()`/`@`-alias; drift risk on upgrades.

#### R5-08 — Remove dead `GEMINI_API_KEY` inject · Impact Med · Effort S · Risk Low · Independent
**Problem:** `vite.config.ts` injects `process.env.API_KEY`/`GEMINI_API_KEY` via `define`; 0 consumers in `src/`.

#### R5-09 — Right-place `express` dependency · Impact Low · Effort S · Risk Low · Independent
**Problem:** `express` in `dependencies` but used only by `server.js`; clarify deploy model or move to devDeps / delete with `server.js`.

#### R5-10 — Shared `formatDateTime` util · Impact Low · Effort S · Risk Low · Independent
**Problem:** Identical `Intl.DateTimeFormat` wrapper in HubPage:45–57 & IntegrationsPage:44–57.

#### R5-11 — Fix CLAUDE.md ghost `constants/templates.ts` · Impact Low · Effort S · Risk Low · Independent
**Problem:** Documented file doesn't exist (`src/constants/` empty). Create it or update docs.

#### R5-12 — Remove dead `/home` route · Impact Low · Effort S · Risk Low · Independent
**Problem:** `App.tsx:41` redirect; 0 references in src/e2e.

#### R5-13 — Page theme primitives (`<ThemeButton>`/`<ThemePanel>`) · Impact High · Effort L · Risk Med · See Epic B
**Problem:** IntegrationsPage 50 / HubPage 35 / AuthPage 17 inline `isClassic` ternaries.

#### R5-14 — Named d3 imports in MapVisualizer · Impact Med · Effort S · Risk Low · Independent
**Problem:** `import * as d3` pulls the whole bundle; only ~7 fns used. Use `d3-selection`/`d3-array`/`d3-scale`/`d3-drag`/`d3-polygon`.

#### R5-15 — Decide on `@/` alias (adopt or remove) · Impact Low · Effort S(remove)/L(adopt) · Risk Low · After R5-07
**Problem:** Alias defined in 3 config files but used in only 3 source files; everything else uses relative imports.

---

### Domain 6 — Repo hygiene / rig-scheduler / backend / scripts

**Repo hygiene** *(deleting tracked files = higher blast radius; confirm with team)*

#### R6-01 — Deindex `output/` (~189 tracked PNGs) · Impact High · Effort S · Risk Low · Independent
**Problem:** Historical before/after screenshots committed (~15–25 MB); `.gitignore` only matches `*.png` patterns, not already-tracked files.
**Fix:** Add `output/` to `.gitignore`; `git rm -r --cached output/`; commit.

#### R6-02 — Remove root JPEGs (`IMG_1156.JPG`, `Sun.jpeg`, 695 KB) · S · Low · Independent — no code refs.
#### R6-03 — Remove scratch `tropical-background-v2.html` + `Untitled.ipynb` · S · Low · Independent — move HTML to `playground/` if useful.
#### R6-04 — Resolve space-named `problem hue/` (5 design assets) · S · Low · Independent — rename to `docs/design-refs/` or delete.
#### R6-05 — Archive `ui-review/`+`vibe-slop-stopper/`+`critique-reports/` (41 md) · S · Low · Independent — move to `docs/archive/`.
#### R6-06 — Remove `branch-comparison/` (6 PNGs) · S · Low · Independent.
#### R6-07 — Gitignore untracked-but-unignored `screenshots/`, `playwright-screens/` · S · Low · Independent (or curate into `docs/assets/`).
#### R6-08 — Gitignore `metadata.json` (camera/mic framework metadata, confusing) · S · Low · Independent.
#### R6-09 — Colocate `fixtures/` near tests; evaluate `codex/` · S · Low · Independent.

**rig-scheduler**

#### R6-10 — Decompose `rig-scheduler/src/App.tsx` (1445 LOC) · Impact High · Effort M · Risk Low · Independent
**Problem:** Entire app in one component: 12 useMemos (50–120-LOC column defs), 4 render-section fns, 6 updaters, embedded `WorkbookGrid`/`MetricTile`, utility drawer; deep closure chains over inventory/rigOptions.
**Fix:** Split into `components/{WorkbookGrid,MetricTile,UtilityDrawer}`, `components/sections/{Inventory,Constraints,Overrides,Results}`, `hooks/useWorkspaceUpdaters`; App.tsx → ~150-LOC shell. Standalone app, no main-app consumers.

#### R6-11 — Document rig-scheduler NPV scope vs main engine · Impact Low · Effort S · Risk Low · After R6-10
**Problem:** `scheduler.ts` has its own bucket-level discount math; both hardcode 10%. Partial overlap — document the boundary rather than share.

#### R6-12 — Remove unused `packages/component-playground-shared` · Impact Low · Effort S · Risk Low · Independent
**Problem:** Private workspace pkg, 8 files, 0 imports anywhere.

**Backend**

#### R6-13 — Keep the Python economics engine (reference for comparison) · Impact Med · Effort S · Risk Low · See Epic A
**Retain** `backend/economics.py` (~400 LOC mirroring `src/utils/economics.ts`: decline, ownership, OPEX, NPV10, tax, levered, risk) — it's the user's intentionally-built original engine, kept to compare against the TS version. It's reached via `pyEngine` → `/api/economics/*` + `/api/sensitivity/*`. Today it's unreachable from the UI (`setEngineId()` uncalled, no toggle).
**Fix:** Keep the engine and its routes wired; the activation work lives in **R4-01** (a dev-only toggle). Add a short comment in `backend/main.py` marking these as dev-comparison surfaces. Do **not** delete. *(The earlier audit recommended removal — overridden: the Python engine is wanted as a reference.)*

#### R6-14 — Document live vs dev-comparison backend routes · Impact Low · Effort S · Risk Low · After R6-13
**Problem:** `/api/spatial/*` is always-live (polled by `useConnectionStatus`); `/api/economics/*` + `/api/sensitivity/*` are the dev-comparison surfaces (reachable via the R4-01 toggle). Neither distinction is documented. Add comments in `backend/main.py` + a README/CLAUDE.md backend note.

**Scripts / tests**

#### R6-15 — Remove/repair `scripts/run-ui-review.sh` · S · Low · Independent — references a likely-gone `.planning/UI-REVIEW-IMPLEMENTATION-PLAN.md`; not in `package.json`; outdated worktree guidance.
#### R6-16 — Wire or remove `scripts/theme-fx-toggle.mjs` · S · Low · Independent — no npm hook, no test.
#### R6-17 — Triage `playground/` (14 tracked files) · M · Low · Independent — notebooks→`docs/`, py tests→`backend/tests/`, stray Playwright spec→`e2e/` or delete; none wired to CI.
#### R6-18 — Resolve duplicate snapshot scripts · S · Low · After R6-17 — `scripts/ui-snapshots.mjs` (wired to `ui:shots`) vs orphaned `playground/scripts/ui-snapshots.spec.ts`.

---

## Part 5 — Priority matrix (all 79)

Legend — Impact: H/M/L · Effort: S/M/L · Risk: L/M/H

| ID | Title | Imp | Eff | Risk | Indep | Epic |
|----|-------|:--:|:--:|:--:|:--:|:--:|
| R4-01 | Dev-only TS↔Python engine toggle | M | M | L | ✓ | A |
| R4-06 | Delete dead collaboration code (−324) | H | S | L | ✓ | D |
| R6-13 | Keep Python engine (reference) | M | S | L | ✓ | A |
| R6-01 | Deindex output/ (~189 PNGs) | H | S | L | ✓ | E |
| R6-10 | Decompose rig-scheduler App.tsx (1445) | H | M | L | ✓ | C |
| R2-01 | Decompose MapCommandCenter (849) | H | L | H | after R2-02 | C |
| R3-05 | Extract D3/Mapbox hooks from MapVisualizer | H | L | M | ✓ | C |
| R5-01 | Decompose IntegrationsPage (+bug) | H | M | L | ✓ | C |
| R3-01 | EditableItemTable primitive (−260) | H | M | L | ✓ | F |
| R1-01 | useCanvasBackground hook (−250) | H | M | L | ✓ | F |
| R1-02 | Shared seededRandom | H | S | L | ✓ | F |
| R5-06 | tsconfig strict:true | H | L | L/M | ✓ | — |
| R2-02 | Phantom props (**bug**) | H | S | L | ✓ | — |
| R2-13 | Move isClassic into primitives | H | L | M | Epic B | B |
| R5-13 | Page theme primitives | H | L | M | Epic B | B |
| R4-09 | Delete useGridKeyboardShortcuts (−104) | M | S | L | ✓ | D |
| R2-04 | Delete dead Skeletons (−70) | M | S | L | ✓ | D |
| R4-10 | Delete perf-monitor helpers (−40) | L | S | L | ✓ | D |
| R2-03 | Remove zombie state | M | S | L | ✓ | D |
| R2-05 | Delete color-match stub | L | S | L | ✓ | D |
| R1-04 | Delete THEME_BACKGROUNDS | L | S | — | ✓ | D |
| R1-11 | Delete .sc-titlebar--brown | L | S | L | ✓ | D |
| R5-08 | Remove GEMINI_API_KEY inject | M | S | L | ✓ | D |
| R5-12 | Remove /home route | L | S | L | ✓ | D |
| R6-12 | Remove unused package | L | S | L | ✓ | D |
| R6-15 | Remove/repair run-ui-review.sh | L | S | L | ✓ | D/E |
| R6-16 | Wire/remove theme-fx-toggle | L | S | L | ✓ | E |
| R4-02 | supabaseGuards extraction | M | S | L | ✓ | F |
| R4-03 | Unify JSONB unwrap | M | S | L | ✓ | F |
| R4-04 | Economics constants | M | S | L | ✓ | F |
| R4-05 | ForecastSegment type | L | S | L | ✓ | F |
| R2-06 | Dedup insight types | M | S | L | ✓ | F |
| R2-07 | Shared formatFeet | L | S | L | ✓ | F |
| R5-10 | Shared formatDateTime | L | S | L | ✓ | F |
| R4-07 | useDerivedMetrics wells (**bug**) | M | S | L | ✓ | — |
| R5-01-bug | (stale params, see R5-01) | — | — | — | — | — |
| R3-10 | ConnectionForm derived-state (**bug**) | M | S | L | ✓ | — |
| R3-08 | Debug double-handler (**bug**) | M | S | L | ✓ | — |
| R1-06 | StormDusk reduced-motion (**bug/a11y**) | M | S | — | ✓ | F |
| R4-08 | Filter localStorage via facade | M | S | L | ✓ | — |
| R4-11 | TS↔Python parity test (drift backstop) | M | S/M | L | after R4-01 | A |
| R6-14 | Document backend routes | L | S | L | after R6-13 | A |
| R3-02 | Stop drilling isClassic | M | S | L | ✓ | B |
| R3-04 | Collapse GroupList fork | M | M | M | ✓ | B |
| R3-06 | Collapse SensitivityMatrix fork | M | S | L | ✓ | B |
| R3-07 | Extract ScenarioCard | M | M | L | after R3-03 | B |
| R3-03 | useScenarioResults hook | M | M | L | ✓ | C |
| R3-09 | TaxControls → InlineEditableValue | M | S | L | after R3-02 | B |
| R3-11 | Narrow AppShell prop bag | M | M | M | ✓ | — |
| R2-08 | WellSelectionActions | M | S/M | L | ✓ | B/F |
| R2-09 | GL state utils | M | M | M | ✓ | F |
| R2-10 | Move CompactRunBar out | L | S | L | ✓ | — |
| R2-11 | Extract KpiTile | L | S | L | ✓ | F |
| R2-12 | Shared table primitives | M | M | L | after R2-07 | F |
| R1-03 | Shared canvas patterns | M | S | L | ✓ | F |
| R1-05 | OilRig → lifecycle hooks | M | S | L | after R1-01 | F |
| R1-07 | StormDusk wrapper div | L | S | L | ✓ | — |
| R1-08 | FX-intensity to all backgrounds | M | S/M | L | after R1-01 | F |
| R1-09 | Moonlight grain alloc (perf) | M | S | L | ✓ | — |
| R1-10 | Token boundary docs | L | S | L | ✓ | — |
| R5-02 | Barrel-only type imports | M | M | L | ✓ | — |
| R5-03 | Schedule/Capex type overlap | M | M | M | ✓ | — |
| R5-04 | Rename types/integrations.ts | M | S | L | after R5-02 | — |
| R5-05 | Unify scenario records | L | S | L | after R5-04 | — |
| R5-07 | Shared Vite base config | M | S | L | ✓ | — |
| R5-09 | Right-place express dep | L | S | L | ✓ | — |
| R5-11 | Fix CLAUDE.md ghost file | L | S | L | ✓ | — |
| R5-14 | Named d3 imports | M | S | L | ✓ | — |
| R5-15 | Decide @/ alias | L | S/L | L | after R5-07 | — |
| R6-02 | Remove root JPEGs | M | S | L | ✓ | E |
| R6-03 | Remove scratch HTML/notebook | L | S | L | ✓ | E |
| R6-04 | Resolve "problem hue/" | L | S | L | ✓ | E |
| R6-05 | Archive AI reports | L | S | L | ✓ | E |
| R6-06 | Remove branch-comparison/ | L | S | L | ✓ | E |
| R6-07 | Gitignore screenshot dirs | L | S | L | ✓ | E |
| R6-08 | Gitignore metadata.json | L | S | L | ✓ | E |
| R6-09 | Colocate fixtures/codex | L | S | L | ✓ | E |
| R6-11 | Document rig NPV scope | L | S | L | after R6-10 | A |
| R6-17 | Triage playground/ | M | M | L | ✓ | E |
| R6-18 | Dedup snapshot scripts | L | S | L | after R6-17 | E |

**Totals:** 79 catalogued (R4-01 & R6-13 reframed from "remove" to "retain + wire-up" per the scope corrections) · ~1,100+ LOC of dead/duplicated code removable (plus ~200 tracked binary artifacts) · 6 latent bugs · 6 cross-cutting epics. The **Python engine** and **Classic theme** are retained by design.
