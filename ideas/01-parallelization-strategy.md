# Parallelization Strategy: Agent Team Execution Plan

> Work stream decomposition, dependency graph, and wave-based execution for parallel agent teams

---

## Design Principles

1. **No file collisions.** Each stream owns specific files. No two concurrent agents edit the same file.
2. **Interface-first.** Streams that produce types/APIs define their interfaces in Wave 0. Consuming streams code against those interfaces.
3. **Wave gates.** All streams in a wave must pass verification before the next wave begins.
4. **Incremental value.** Each wave produces a shippable increment, not just scaffolding.

---

## Work Streams

### Stream 1: Types & Data Model Foundation
**Owner:** 1 agent
**Files owned:** `src/types.ts`, `src/types/integrations.ts`
**Produces:** All new types consumed by every other stream

- Clean up `types/integrations.ts` (broken imports, deduplication)
- Extend `Well` with TVD, bench, completionDate, vintage, productionMetrics
- Add `TrackKind = 'PDP' | 'UNDEV'`
- Add `AcreageFilter` interface
- Add `DsuDefinition` interface
- Add `WellsViewMode = 'MAP' | 'TABLE' | 'WINE_RACK'`
- Add `ProjectStage` enum
- Extend `Scenario` with `ScenarioVariable` wrapper type
- Add `AnalogBackedAssumption` type (provenance-backed assumptions)
- Add `ForecastSource`, `ForecastAssignment` types for PDP
- Add `CoherenceScore`, `FitMetadata` types for Wine Rack builder
- Extend `WellGroup` with optional `track` field
- Add `PdpGroupExtensions` and `UndevProgramExtensions` interfaces

### Stream 2: Workspace Hook Decomposition
**Owner:** 1 agent
**Files owned:** `src/hooks/useSlopcastWorkspace.ts`, new files in `src/hooks/`
**Depends on:** Stream 1 (types)

- Remove dead code: `pageMode`, `handleSelectDeal`, `handleCreateDeal`, `handleAcreageSearch`
- Extract domain hooks:
  - `useWellGroups.ts` — group CRUD, well assignment, track management
  - `useEconomicsComputation.ts` — memoized economics calculation
  - `useWorkspaceUI.ts` — viewMode, designWorkspace, wellsViewMode, viewportLayout
  - `useStageNavigation.ts` — stage state machine, completion tracking
- Reduce `useSlopcastWorkspace` to a thin composition hook
- Wire the existing `economicsEngine.ts` adapter into computation hook

### Stream 3: Navigation & Stage System
**Owner:** 1 agent
**Files owned:** `src/App.tsx`, `src/pages/SlopcastPage.tsx`, `src/components/slopcast/PageHeader.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/slopcast/DesignWorkspaceTabs.tsx`
**Depends on:** Streams 1 + 2 (types + stage hook)

- Wire `Sidebar` into `SlopcastPage` layout
- Redesign `SidebarNav` as stage pipeline with completion indicators
- Add stage-driven conditional rendering in `SlopcastPage`
- Replace `DesignWorkspaceTabs` (WELLS/ECONOMICS) with track-aware sub-navigation
- Add view mode switcher (MAP/TABLE/WINE_RACK) within WELLS screens
- Optionally: convert to URL-based sub-routes under `/slopcast/*`

### Stream 4: Map Enhancement & Mode System
**Owner:** 1 agent
**Files owned:** `src/components/slopcast/MapCommandCenter.tsx`, `src/components/slopcast/map/OverlayFiltersBar.tsx`, `src/components/slopcast/map/OverlayToolbar.tsx`, `src/hooks/useViewportData.ts`
**Depends on:** Stream 1 (types)

- Add `mode: 'PDP' | 'UNDEV'` prop to `MapCommandCenter`
- Mode-aware data layers (PDP: producing/shut-in; Undev: acreage/constraints)
- Mode-aware primary CTA ("Add to PDP group" vs "Create DSU")
- Anti-clutter refactor: collapse filters by default, layer toggles in popover
- Extract layer management and style switching into sub-hooks
- PDP overlays: forecast availability indicator, ownership view, status differentiation
- Stub DSU creation interface (polygon draw deferred to Stream 6)

### Stream 5: PDP Track Screens
**Owner:** 1-2 agents
**Files owned:** New files: `src/components/slopcast/pdp/PdpWellsView.tsx`, `src/components/slopcast/pdp/PdpForecastView.tsx`, `src/components/slopcast/pdp/ForecastSourcePicker.tsx`, `src/components/slopcast/pdp/ForecastReconciliation.tsx`, `src/components/slopcast/pdp/EconomicLimitControls.tsx`
**Depends on:** Streams 1 + 2 + 3 (types + hooks + navigation)

- PDP Wells View: wrap MapCommandCenter in PDP mode with PDP-specific toolbar
- PDP Forecast View: new screen with:
  - Forecast source picker (per-well or bulk)
  - Forecast reconciliation overlay (multi-vendor comparison)
  - Forecast adjustment controls (miss factor, rate floors)
  - LOE/Ownership/Differentials sections (reuse existing Controls sections)
  - Economic limit controls (rate/cashflow/date-based)
  - Progressive disclosure (5 fields default, rest in "Advanced")
- Output: parameterized PDP group ready for Scenarios

### Stream 6: Undev Track Screens
**Owner:** 1-2 agents
**Files owned:** New files: `src/components/slopcast/undev/UndevWellsView.tsx`, `src/components/slopcast/undev/UndevEconomicsView.tsx`, `src/components/slopcast/undev/DsuCreationTools.tsx`, `src/components/slopcast/undev/TypeCurveLibrary.tsx`, `src/components/slopcast/undev/SpacingDegradation.tsx`, `src/components/slopcast/undev/ScheduleEditor.tsx`
**Depends on:** Streams 1 + 2 + 3 + 4 (types + hooks + navigation + map mode)

- Undev Wells View: MapCommandCenter in Undev mode with DSU creation tools:
  - Manual polygon draw (via Mapbox GL Draw)
  - Auto-generate from section grid
  - Bench/zone stacking per DSU
  - Spacing template application
  - Inventory summary panel (DSU count, locations, lateral footage)
  - Conflict detection (overlap with existing wells, other DSUs)
- Undev Economics View: new screen with:
  - Type curve library browser + assignment per DSU/bench
  - Lateral length scaling controls
  - Spacing/parent-child degradation
  - CAPEX structure + per-foot scaling
  - Schedule editor (rig count, drill order, cycle time)
  - LOE/Ownership (reuse sections with Undev defaults)

### Stream 7: Scenario Enhancement
**Owner:** 1 agent
**Files owned:** `src/components/ScenarioDashboard.tsx`, `src/hooks/useScenarioAnalysis.ts`, `src/components/slopcast/ScenarioEditForm.tsx`
**Depends on:** Streams 1 + 2 (types + hooks)

- Extend `ScenarioEditForm` with `ScenarioVariable` wrapper (global + per-track split)
- Add "unlock toggle" UI for splitting variables by track
- Add price deck model: strip (monthly curve) vs flat vs custom
- Add discount rate as a sensitizable variable
- Side-by-side results view: PDP column | Undev column | Totals column
- Cashflow waterfall chart (revenue, CAPEX, LOE, taxes, NCF breakdown)

### Stream 8: Wine Rack Renderer
**Owner:** 1-2 agents
**Files owned:** New files: `src/components/slopcast/wine-rack/WineRackView.tsx`, `src/components/slopcast/wine-rack/WineRackRenderer.tsx`, `src/components/slopcast/wine-rack/WineRackControls.tsx`, `src/components/slopcast/wine-rack/ProjectionEngine.ts`, `src/components/slopcast/wine-rack/VariableEncodingPanel.tsx`, `src/components/slopcast/wine-rack/BenchBands.tsx`, `src/components/slopcast/wine-rack/WellBar.tsx`
**Depends on:** Stream 1 (types only — can use mock data)

- SVG cross-section renderer using D3 scales + React SVG
- Y-axis: TVD (increasing downward), X-axis: projected position
- Well bars: horizontal bars with length = lateral length, position = subsurface depth
- Bench bands: faint horizontal bands from formation top data
- Depth ruler (left margin), direction indicator (toe/heel taper)
- Projection engine: average azimuth, user-drawn line, surface X sort
- Variable encoding panel: 5-channel mapper (color, thickness, opacity, outline, label)
- D3 color scales (sequential, divergent, categorical)
- Zoom/pan via d3.zoom on data coordinate system
- Hover tooltips, click-to-pin, shift-click multi-select
- Inset mini-map (adapt MiniMapPreview)
- Canvas rendering path for >500 wells
- Toggles: parent/child connectors, vintage gradient, spacing annotations

### Stream 9: Assumption Builder
**Owner:** 1-2 agents
**Files owned:** New files: `src/components/slopcast/wine-rack/AssumptionBuilder.tsx`, `src/components/slopcast/wine-rack/BuildModeOverlay.tsx`, `src/components/slopcast/wine-rack/CoherenceIndicator.tsx`, `src/components/slopcast/wine-rack/TypeCurveFitTab.tsx`, `src/components/slopcast/wine-rack/LoeFitTab.tsx`, `src/components/slopcast/wine-rack/SpacingDegradationTab.tsx`, `src/components/slopcast/wine-rack/AssumptionLibrary.tsx`
**Depends on:** Streams 1 + 8 + 10 + 11 (types + renderer + production data + fit endpoints)

- Build mode toggle (diagnostic ↔ assumption builder)
- Lasso/click-to-add/quick-action selection in rack coordinates
- Selection summary (well count, avg lateral, vintages, bench breakdown)
- Coherence indicator (lateral variance, vintage spread, bench mix)
- Type Curve tab: fit overlay chart, manual parameter knobs, normalization toggle, segment editor, fit quality indicators
- LOE tab: pull from data, fixed/variable decomposition, distribution view, percentile picker
- Spacing Degradation tab: co-development detection, production ratio, degradation curve fitting
- Save with provenance: name, analog well IDs, filter snapshot, fit metadata
- Assumption library UI: list, search, staleness indicators, refresh, promote to global
- Cross-assumption analog overlap visualization
- Round-trip from economics screen ("view analogs" link)

### Stream 10: Backend — Production Data Pipeline
**Owner:** 1 agent
**Files owned:** `backend/spatial_service.py` (new functions), `backend/spatial_routes.py` (new endpoints), `backend/spatial_models.py` (new models)
**Depends on:** None (can start immediately)

- Identify Databricks production history table(s) — likely `eds.well.tbl_monthly_production` or similar
- Add Pydantic models for production history response
- `GET /api/production/{well_ids}` — monthly oil/gas/water production
- `GET /api/wells/enriched` — well header data with completion date, IP, EUR, GOR, bench
- Add bench/formation tops lookup (if available in Databricks or as reference data)
- Well data enrichment: compute TVD from trajectory, extract bench from formation string

### Stream 11: Backend — Fit & Analysis Endpoints
**Owner:** 1 agent
**Files owned:** New files: `backend/fit_service.py`, `backend/fit_routes.py`, `backend/fit_models.py`, `backend/analysis_service.py`
**Depends on:** Stream 10 (production data)

- Move `playground/decline_multiseg.py` functions to production `backend/`
- `POST /api/fit/type-curve` — Arps fit via scipy.optimize (input: well IDs + options, output: params + R² + P10/P50/P90)
- `POST /api/fit/loe` — LOE decomposition via regression (input: well IDs, output: fixed/variable split + distribution)
- `POST /api/analysis/spacing` — co-development detection + degradation curve fitting
- `POST /api/assumptions` — CRUD for AnalogBackedAssumption
- `GET /api/assumptions/library` — list with staleness, overlap analysis
- `POST /api/assumptions/{id}/refresh` — re-fit with latest production data

### Stream 12: Persistence Layer Extension
**Owner:** 1 agent
**Files owned:** `src/components/slopcast/hooks/useProjectPersistence.ts`, `src/services/projectRepository.ts`, new Supabase migration file
**Depends on:** Stream 1 (types)

- Schema migration:
  - Add `acreage_filter_jsonb` to `projects`
  - Add `track` column to `project_groups`
  - Create `dsu_definitions` table (geometry, benches, spacing, lateral length)
  - Extend `project_scenarios.scalar_jsonb` for per-track variable splits
  - Create `assumption_library` table (AnalogBackedAssumption schema)
  - Create `forecast_assignments` table (per-well forecast source + vendor metadata)
- Extend `useProjectPersistence` serialization for new fields
- Extend `save_project_bundle` RPC for DSU data, track classification, acreage filter

---

## Dependency Graph

```
Wave 0 (Foundation — no dependencies)
├── Stream 1:  Types & Data Model
├── Stream 10: Backend Production Data Pipeline
└── Stream 12: Persistence Schema Design (migration file only)

Wave 1 (Infrastructure — depends on Wave 0)
├── Stream 2:  Workspace Hook Decomposition ──────── needs Stream 1
├── Stream 3:  Navigation & Stage System ──────────── needs Streams 1, 2
├── Stream 8:  Wine Rack Renderer ─────────────────── needs Stream 1 (uses mock data)
└── Stream 11: Backend Fit Endpoints ──────────────── needs Stream 10

Wave 2 (Screens — depends on Waves 0 + 1)
├── Stream 4:  Map Enhancement ────────────────────── needs Streams 1, 2
├── Stream 5:  PDP Track Screens ──────────────────── needs Streams 1, 2, 3
├── Stream 6:  Undev Track Screens ────────────────── needs Streams 1, 2, 3, 4
├── Stream 7:  Scenario Enhancement ───────────────── needs Streams 1, 2
└── Stream 9:  Assumption Builder ─────────────────── needs Streams 1, 8, 10, 11

Wave 3 (Integration — depends on all)
└── Stream 12: Persistence Full Implementation ────── needs all type-producing streams
    + Cross-stream integration testing
    + E2E flow verification
```

---

## Wave Execution Plan

### Wave 0: Foundation (3 agents, ~1 day)

| Agent | Stream | Deliverable | Verification |
|-------|--------|-------------|-------------|
| **types-agent** | Stream 1 | Updated `types.ts` + cleaned `integrations.ts` | `npx tsc --noEmit` passes |
| **backend-data-agent** | Stream 10 | Production data endpoint + well enrichment | `pytest` + curl test |
| **schema-agent** | Stream 12 (partial) | Migration SQL file | SQL syntax valid, FK references correct |

**Gate:** All new types compile. Backend production endpoint returns data for mock well IDs. Migration file reviewed.

### Wave 1: Infrastructure (4 agents, ~2 days)

| Agent | Stream | Deliverable | Verification |
|-------|--------|-------------|-------------|
| **hooks-agent** | Stream 2 | Decomposed workspace hooks | `npx tsc --noEmit` + `npm test` pass |
| **nav-agent** | Stream 3 | Sidebar + stage navigation + view mode switching | Visual verification at localhost:3000 |
| **renderer-agent** | Stream 8 | Wine Rack SVG renderer with mock data | Storybook story renders correctly |
| **fit-agent** | Stream 11 | Fit + analysis endpoints | `pytest` + curl test with sample data |

**Gate:** App renders with new navigation. Wine Rack renders mock wells in Storybook. Fit endpoints return valid parameters for test well sets.

### Wave 2: Screens (5-6 agents, ~3 days)

| Agent | Stream | Deliverable | Verification |
|-------|--------|-------------|-------------|
| **map-agent** | Stream 4 | Map with PDP/Undev mode | Mode switching works, layers change |
| **pdp-agent** | Stream 5 | PDP Wells + Forecast screens | Full PDP flow: select → forecast → ready for scenarios |
| **undev-agent** | Stream 6 | Undev Wells + Economics screens | DSU creation → TC assignment → schedule → ready for scenarios |
| **scenario-agent** | Stream 7 | Enhanced ScenarioDashboard | Per-track splits work, side-by-side view renders |
| **builder-agent** | Stream 9 | Assumption Builder on Wine Rack | Lasso → fit → save with provenance |

**Gate:** Full PDP flow works end-to-end. Full Undev flow works end-to-end. Wine Rack assumption builder produces saved assumptions. Scenarios consume both tracks.

### Wave 3: Integration (2-3 agents, ~1 day)

| Agent | Stream | Deliverable | Verification |
|-------|--------|-------------|-------------|
| **persist-agent** | Stream 12 (full) | Full persistence for new fields | Save/load round-trip preserves all new state |
| **integration-agent** | Cross-stream | E2E flow testing, cross-view selection sync | Full project lifecycle: acreage filter → PDP + Undev → scenarios → results |
| **polish-agent** | Cross-stream | Anti-clutter pass, progressive disclosure audit | `npm run ui:audit` clean |

**Gate:** Full project lifecycle works. Save/load preserves everything. No style drift.

---

## Conflict Avoidance Rules

### File Ownership

Each stream's "Files owned" section is exclusive. If an agent needs to read (not write) a file owned by another stream, that's fine. But writes to shared files must be coordinated:

- **`src/types.ts`** — owned by Stream 1. All other streams consume but do not modify.
- **`src/hooks/useSlopcastWorkspace.ts`** — owned by Stream 2. Navigation (Stream 3) consumes the exported hooks.
- **`src/pages/SlopcastPage.tsx`** — owned by Stream 3. Screen streams (5, 6) provide components that Stream 3 renders.
- **`backend/spatial_service.py`** — owned by Stream 10. Stream 11 creates separate service files.

### Interface Contracts

Stream 1 defines all type interfaces. Other streams implement those interfaces. If a consuming stream discovers a missing field, it raises it to the Stream 1 agent (or in Wave 2+, extends the type with a focused edit).

### Branch Strategy

Each wave works on a single feature branch. Within a wave, agents work on separate files so merge conflicts are minimal. Wave gate = passing CI on the wave branch before merging to the next wave's base.

---

## Agent Team Sizing

| Wave | Agents | Parallelism | Calendar Time |
|------|--------|-------------|---------------|
| Wave 0 | 3 | Full parallel | ~4 hours |
| Wave 1 | 4 | Full parallel | ~8 hours |
| Wave 2 | 5-6 | Mostly parallel (Stream 6 waits on 4) | ~12 hours |
| Wave 3 | 2-3 | Sequential integration | ~4 hours |
| **Total** | **~15 agent-slots** | | **~28 hours** |

Maximum concurrent agents at any point: **6** (Wave 2).
