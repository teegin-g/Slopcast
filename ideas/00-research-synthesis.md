# Research Synthesis: PDP/Undev Split + Wine Rack Integration

> Compiled from parallel agent analysis of the Slopcast codebase (2026-04-06)

---

## Executive Summary

Two major features are proposed: (1) splitting the app into PDP and Undev workflow tracks, and (2) adding a Wine Rack cross-section visualization with an analog-driven assumption builder. Three research agents independently analyzed the codebase across architecture, types, state management, map, economics, backend, and persistence layers.

**Key Finding:** The current architecture is a single-workspace monolith optimized for one workflow. Both features require foundational restructuring before screen-level work can begin. The good news: significant scaffolding already exists (unused Sidebar, Landing page prototype, D3 library, mock DSU layer, reserves category types) that can be promoted from dead/prototype code to production infrastructure.

---

## 1. Current Architecture State

### Routing & Navigation
- **Single route:** `/slopcast` renders `SlopcastPage` — all navigation is state-driven tab switching, not URL-based
- **Two-axis nav:** `viewMode` (DASHBOARD/ANALYSIS) × `designWorkspace` (WELLS/ECONOMICS) = 3 effective screens
- **Unused Sidebar:** A `Sidebar` component exists at `src/components/layout/Sidebar.tsx` with collapse state, group tree, and section nav — but is never rendered by `SlopcastPage`
- **Dead Landing page:** `LandingPage.tsx` with `AcreageSearchBar` and `parseSearchQuery()` exists but `pageMode: 'landing'` is never activated
- **Inline stepper:** `WorkflowStepper` renders a 3-step horizontal bar (SETUP/SELECT/REVIEW) inside economics only

### State Management
- **God hook:** `useSlopcastWorkspace` is 760 lines managing 80+ return properties via `useState`
- **No external state manager** — no Redux, Zustand, Jotai, or domain Context
- **Economics computed inline** via `useMemo` calling `cachedCalculateEconomics` per group
- **Hardcoded project name** `'Slopcast Project'` — only one project per user

### Map
- **Two separate map components:** `MapCommandCenter` (905 lines, Mapbox GL, desktop) and `DesignWellsView` (554 lines, SVG fallback, mobile)
- **No mode concept** — the map always operates the same way regardless of PDP/Undev context
- **Selection tools:** Lasso + rectangle via `useMapSelection` hook
- **Data source:** `useViewportData` fetches from mock or live Databricks spatial service with zoom-dependent detail levels

### Types & Data Model
- **`Well` is a map pin model** — has id, name, lat/lng, lateralLength, status, operator, formation, optional trajectory
- **Missing from `Well`:** TVD (only via optional trajectory), completion date, bench/zone, production metrics (IP, EUR, cum, GOR), frac intensity, DSU/section identifiers
- **`WellGroup` conflates PDP and Undev** — has typeCurve (Undev) + rigStartDate (Undev) but no forecastSource (PDP) or DSU geometry (Undev)
- **`ReserveCategory`** = `'PDP' | 'PUD' | 'PROBABLE' | 'POSSIBLE'` exists as optional tag on WellGroup, not a structural track discriminator
- **`DealWellType`** = `'developed' | 'undeveloped'` exists in the Deal model, hinting at eventual PDP/Undev split
- **`src/types/integrations.ts`** has broken imports and duplicates types from `src/types.ts` — needs reconciliation
- **No DSU type** in the domain model (only mock `DsuPolygon` in `mockDsuLayer.ts`)

### Economics Engine
- **Engine adapter pattern exists but is unused** — `economicsEngine.ts` defines TS and Python engines, but the workspace hook calls `cachedCalculateEconomics` directly
- **All calculations are synchronous main-thread** with an LRU cache (100 entries)
- **No type curve fitting** — only forward projection from given parameters
- **No production data** — the app only has forecasted production, not actual historical data

### Backend
- **Three spatial endpoints:** `POST /api/spatial/wells`, `GET /api/spatial/layers`, `GET /api/spatial/status`
- **Databricks SQL connector** to `eds.well.tbl_well_summary_all` + `eds.well.tbl_directional_survey`
- **Mock fallback** with 40 Permian Basin wells when Databricks credentials absent
- **No economics endpoints** (the Python engine adapter targets `/api/economics/*` routes that don't exist)
- **No production history, fit, LOE, or spacing analysis endpoints**
- **Legacy PostGIS manager** still registered but unused

### Persistence
- **Supabase** via `useProjectPersistence` (auto-save with 1s debounce)
- **v2 schema** includes: organizations, projects, project_groups, group_well_memberships, project_scenarios, economics_runs, wells, well_laterals, well_monthly_production, acreage_assets
- **`save_project_bundle` RPC** for atomic project saves
- **localStorage** for UI preferences only (sidebar collapsed, engine choice, etc.)

---

## 2. Gap Analysis Summary

### PDP/Undev Workflow Split

| Layer | Status | Key Gap |
|-------|--------|---------|
| **Project Model** | Partial | No `AcreageFilter`, no `Track` discriminator, no `DSU` type |
| **Navigation** | Scaffolded | Sidebar exists but unused; no stage state machine |
| **Stage 0: Acreage Filter** | Prototype | LandingPage + AcreageSearchBar exist but aren't wired in |
| **Stage 1: Track Picker** | Missing | New component needed |
| **PDP Wells Screen** | Reusable | Current MapCommandCenter + filters, needs mode prop |
| **PDP Forecast Screen** | Split needed | Current DesignEconomicsView has PDP-irrelevant fields (TC, CAPEX schedule) |
| **Undev Wells Screen** | Mostly missing | mockDsuLayer.ts exists; need Mapbox Draw, snap tools, bench stacking |
| **Undev Economics Screen** | Split needed | Current DesignEconomicsView lacks TC library, lateral scaling, degradation |
| **Scenarios** | Extend | No per-track variable splits, no price deck model, no side-by-side view |
| **Persistence** | Extend | Schema needs track column, DSU table, forecast assignments, acreage filter JSONB |

### Wine Rack View & Assumption Builder

| Layer | Status | Key Gap |
|-------|--------|---------|
| **Well Data Enrichment** | Missing | Need TVD, bench, completion date, production metrics on `Well` type |
| **Production Data Pipeline** | Missing | **Critical blocker** — no production history anywhere in the app |
| **SVG Renderer** | Missing | D3 v7 available; need new cross-section component |
| **Projection Modes** | Missing | Need azimuth calculation, user-drawn line, surface X sort |
| **Variable Encoding** | Missing | No "map attribute to visual channel" UI pattern exists |
| **Build Mode / Assumption Builder** | Missing | No mode toggle, coherence scoring, fit UI, or lasso-to-assumption flow |
| **Curve Fitting** | Missing | No client or server-side Arps fitting |
| **LOE Decomposition** | Missing | No LOE history data or regression logic |
| **Spacing Degradation** | Missing | No co-development detection or degradation analysis |
| **Assumption Library** | Missing | DealTypeCurvePreset type exists but has no provenance, no library UI |
| **Backend Fit Endpoints** | Missing | No `/api/fit/*` routes; playground has decline math but no optimizer |

---

## 3. Reusable Assets

These existing components/types can be promoted or adapted rather than built from scratch:

| Asset | Location | Reuse Strategy |
|-------|----------|----------------|
| `Sidebar` component | `src/components/layout/Sidebar.tsx` | Wire into SlopcastPage, extend SidebarNav for stage pipeline |
| `LandingPage` + `AcreageSearchBar` | `src/components/slopcast/LandingPage.tsx` | Evolve into Stage 0 acreage filter |
| `WorkflowStepper` | `src/components/slopcast/WorkflowStepper.tsx` | Adapt step model for stage pipeline indicators |
| `ReserveCategory` type | `src/types.ts:114` | Basis for PDP/Undev track classification |
| `DealWellType` type | `src/types.ts:384` | Reference for developed/undeveloped concept |
| `mockDsuLayer.ts` types | `src/utils/mockDsuLayer.ts` | Promote `DsuPolygon` to domain model |
| D3 lasso pattern | `src/components/MapVisualizer.tsx` | Reuse for Wine Rack SVG lasso selection |
| `MiniMapPreview` | `src/components/slopcast/MiniMapPreview.tsx` | Adapt for Wine Rack inset map |
| `useMapSelection` hook | `src/hooks/useMapSelection.tsx` | Reference for selection interaction patterns |
| `useWellSelection` hook | `src/hooks/useWellSelection.ts` | Shared selection store — Wine Rack consumes directly |
| `OpexAssumptions` type | `src/types.ts:91` | Already supports LOE decomposition output format |
| `ForecastSegment` type | `src/types.ts:34` | Multi-segment decline already modeled |
| `DealTypeCurvePreset` type | `src/types.ts:549` | Extend with provenance fields for AnalogBackedAssumption |
| Backend decline functions | `playground/decline_multiseg.py` | Move to production `backend/` and add optimizer |
| `economicsEngine.ts` adapter | `src/services/economicsEngine.ts` | Wire into workspace hook (currently unused) |
| `acreage_assets` table | Supabase v2 migration | Foundation for acreage filter spatial component |
| WebGL layer pattern | `src/components/slopcast/MapSelectionTrail.ts` | Reference for Canvas rendering path if >500 wells in rack |

---

## 4. Technical Debt to Resolve First

Per the CLAUDE.md "Step 0 Rule" — before any structural refactor:

1. **`useSlopcastWorkspace.ts`** — Remove unused `pageMode` state, `handleSelectDeal`, `handleCreateDeal`, `handleAcreageSearch` no-ops. Clean up dead exports.
2. **`src/types/integrations.ts`** — Reconcile broken imports and type duplicates with `src/types.ts`.
3. **`economicsEngine.ts`** — Either wire the adapter into the workspace hook or remove it. Unused infrastructure confuses the dependency graph.
4. **`MapCommandCenter.tsx`** (905 lines) — Extract overlay panel orchestration, layer management, and style switching into sub-hooks before adding mode logic.
5. **Backend `SpatialDBManager`** — Remove legacy PostGIS manager that's registered but unused.

---

## 5. Data Dependencies (Critical Path)

```
Production History Table (Databricks)
  └─> Backend /api/production endpoint
       └─> Well Data Enrichment (IP, EUR, cum, GOR on Well type)
            ├─> Wine Rack Variable Encoding
            └─> Assumption Builder
                 ├─> Type Curve Fitting (needs scipy)
                 ├─> LOE Decomposition (needs LOE history)
                 └─> Spacing Degradation (needs geometry + production)
                      └─> Assumption Library + Provenance

Bench/Formation Tops Data
  └─> Wine Rack Bench Bands
       └─> Wine Rack Bench-based Selection
            └─> Coherence Scoring
```

The single biggest blocker is **production history data**. Without it, the assumption builder cannot function. The Wine Rack renderer itself can be built and demoed using existing mock well trajectories (which include TVD), but the assumption builder's value proposition depends entirely on having actual production data to fit against.
