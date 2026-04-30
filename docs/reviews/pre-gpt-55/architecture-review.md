# Architecture Review

## Snapshot Shape

The pre-April-23 codebase is a React 19/Vite application with:

- Client-side portfolio/economics modeling in `src/utils/economics.ts`.
- Optional FastAPI backend economics endpoints in `backend/economics.py`.
- A spatial stack split across React hooks, a Mapbox command center, TypeScript spatial service adapters, and FastAPI/Databricks endpoints.
- Supabase-backed auth, project persistence, collaboration, comments, and audit-log repositories.
- Storybook, Vitest, Playwright, backend pytest, and several prior planning/review docs.

The direction is sound: domain types exist, the UI has testable component slices, and several responsibilities have already started moving into hooks/services. The remaining architecture issue is that some modules are still acting as orchestration hubs for too many independent domains.

## Strengths

- The project already has a workable boundary between `src/services`, `src/hooks`, `src/components`, `src/theme`, and `backend`.
- The spatial code has a clear mock/live source concept, progressive detail levels (`points`, `summary`, `full`), and non-fatal trajectory failure handling.
- The test suite protects many recent extractions: workspace navigation, viewport data, map wellbore rendering, layout shell behavior, and economics calculations.
- Theme registration and token runtime are centralized enough to support multiple visual systems without every component hardcoding theme branches.
- Supabase persistence is behind explicit repository and hook surfaces rather than being scattered directly through page components.

## Major Architectural Risks

### 1. Workspace State Has Become a God Hook

`src/hooks/useSlopcastWorkspace.ts` owns routing, theme/fx state, page mode, wells, source persistence, group/scenario domain state, selection, filtering, economics calculation, persistence, validation, snapshotting, CSV/PDF export, keyboard shortcuts, workflow state, and operations props.

This creates three problems:

- Every meaningful product feature needs to touch the same hook.
- Unit testing feature-specific behavior requires mocking unrelated domains.
- UI components receive a broad returned object rather than smaller capability contracts.

Suggested direction:

- Move domain mutations into reducers: `groupsReducer`, `scenariosReducer`, `workspaceUiReducer`.
- Move derived economics/selectors to `src/domain/economics/selectors.ts`.
- Move export/snapshot actions to a `useWorkspaceActions` hook.
- Keep `useSlopcastWorkspace` only as a composition hook while migration is in progress.

### 2. Map Command Center Owns Too Much Policy

`src/components/slopcast/MapCommandCenter.tsx` owns:

- Map readiness fallbacks.
- Mapbox terrain and style switching.
- Spatial source auto-detection.
- Live/mock fallback toasts.
- Spatial filters.
- Layer construction and event registration.
- Cluster behavior.
- Well hover/popup behavior.
- WebGL wellbore diagnostics.
- Overlay layout.

The layer construction is also duplicated between initial load and satellite style reload paths.

Suggested direction:

- Extract `useSpatialSourcePolicy` for connection polling, auto-switching, fallback state, and toasts.
- Extract `useWellLayers` or a `WellLayerController` for Mapbox source/layer lifecycle.
- Extract style reload handling so initial load and `style.load` rehydration share the same path.
- Keep `MapCommandCenter` focused on composing map shell + overlays.

### 3. Economics Has Competing Sources of Truth

`src/utils/economics.ts` is the richer implementation. `backend/economics.py` is described as a parity port, but it only handles a simpler model. `src/services/economicsEngine.ts` adapts richer frontend assumptions into flatter backend assumptions, dropping information such as OPEX segments, ownership agreements, gas production economics, and multi-segment forecast behavior.

This is a strategic architecture decision, not just a bug:

- If TypeScript is authoritative, remove or demote Python economics from end-user selection until parity exists.
- If Python is authoritative, port the full domain model and make the frontend engine a cache/offline adapter.
- If both must remain, add golden parity fixtures and fail CI when they diverge.

### 4. Domain Types Are Partly Split, Partly Centralized

The snapshot has both `src/types.ts` and `src/types/*` re-exports. The root file still contains many core types, including wells, trajectories, forecasts, economics, scenarios, persistence records, and integrations.

Suggested direction:

- Move all domain types into submodules (`wells`, `forecast`, `economics`, `project`, `spatial`, `integrations`).
- Keep `src/types/index.ts` as the only barrel.
- Retire `src/types.ts` once import churn is handled.

### 5. Repositories Mix Data Access With Record Mapping

`projectRepository`, `dealRepository`, and related services do a lot of manual row mapping with `any`. This is pragmatic, but it weakens the Supabase contract and makes migrations risky.

Suggested direction:

- Introduce per-table mapper functions with typed input aliases from generated Supabase types.
- Add runtime validation only at external boundaries where JSONB contracts are loaded.
- Keep repository methods thin: query, map, return.

## Boundary Recommendations

Preferred long-term module boundaries:

- `src/domain/economics`: pure calculation, schedule, ownership, tax/debt/reserve logic, golden fixtures.
- `src/domain/workspace`: reducers, selectors, import/export transforms.
- `src/domain/spatial`: source interfaces, cache keys, filter normalization, geometry helpers.
- `src/components/slopcast/map`: pure overlay components and Mapbox layer controllers.
- `src/services`: IO only: Supabase, backend fetches, auth adapters.
- `backend/spatial`: connection manager, query builder, row mapper, cache.

The goal is not a big rewrite. The goal is to move each volatile policy out of rendering code and put calculation/data code behind testable seams.
