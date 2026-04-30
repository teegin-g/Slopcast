# Implementation Review

## High-Impact Findings

### Economics Engine Divergence

Files:

- `src/utils/economics.ts`
- `backend/economics.py`
- `src/services/economicsEngine.ts`

The TypeScript engine and Python engine do not model the same economics. The TypeScript path includes gas volumes/revenue, OPEX segments, ownership/JV factors, tax, debt, reserves risk, and multi-segment production. The Python path is much flatter: oil production, NRI, LOE per month, and simple decline. The adapter in `economicsEngine.ts` explicitly flattens assumptions for Python.

Risk:

- A user can see different NPV/payout/EUR behavior depending on selected engine.
- Snapshot/evaluation results are difficult to trust if engine choice is not part of every persisted run and comparison.

Recommended fix:

- Pick one authoritative engine for production calculations.
- Add golden fixtures covering gas, segmented OPEX, JV payout, tax/debt overlays, and multi-segment forecasts.
- Require TypeScript/Python parity only where parity is intended. Otherwise label the Python engine as experimental and keep it out of primary workflows.

### Cache Keys Miss Some Economic Inputs

File: `src/utils/economics.ts`

The cache key includes many inputs but omits some meaningful values. For example, `terminalDecline`, `CapexItem.offsetDays`, `OpexSegment.id/label`, `rigStartDate`, and reserve/tax/debt overlays are not part of the base key. Some omitted fields may currently be unused by calculation, but that turns the cache key into an implicit implementation detail.

Risk:

- Future use of omitted fields can silently serve stale economics.
- UI updates may appear ignored if a field is introduced before cache invalidation is updated.

Recommended fix:

- Build cache keys from a versioned normalized calculation input object.
- Include only calculation-effective fields, but define that normalization in one place and test it.
- Consider returning immutable copies from cache or documenting that callers must not mutate returned flow/metrics.

### Spatial SQL Is Not Fully Parameterized

File: `backend/spatial_service.py`

Bounds and limit are parameterized, but table identifiers and `IN` lists are interpolated into SQL. Operators/formations escape single quotes, but statuses and API IDs are interpolated directly. The comment says values come from internal filter state, but they cross HTTP boundaries via `/api/spatial/wells`.

Risk:

- SQL injection risk is bounded by Pydantic literals for statuses and current UI filter options, but the pattern is still fragile.
- Table/catalog/schema environment variables are not validated as identifiers.
- Future filters can easily copy this pattern with weaker validation.

Recommended fix:

- Validate catalog/schema/table names against a strict identifier regex before constructing `full_table`.
- Build `IN` clauses with generated placeholders and parameter dictionaries.
- Keep allowed statuses as enum/literal validation on the API model.
- Add tests that malicious operator/formation/status/API strings remain parameters, not SQL text.

### Map Layer Lifecycle Has Duplication and Listener Risk

File: `src/components/slopcast/MapCommandCenter.tsx`

The initial layer setup and style-reload setup duplicate source, cluster, status layer, label, and event registration logic. Event handlers are registered through `map.on(...)` inside layer setup functions without a symmetric cleanup path. Style changes can recreate layers and listeners.

Risk:

- Duplicate listeners after style changes or remount edge cases.
- Divergent behavior between initial style and satellite style reload.
- Hard-to-reproduce map bugs because listener ownership is implicit.

Recommended fix:

- Extract a layer controller with `mount`, `update`, and `unmount`.
- Store handler references and call `map.off` during cleanup.
- Use one `ensureWellLayers(map, options)` path for both initial load and style reload.

### Workspace Persistence Is Broad and Implicit

Files:

- `src/hooks/useSlopcastWorkspace.ts`
- `src/components/slopcast/hooks/useProjectPersistence.ts`
- `src/services/projectRepository.ts`

Persistence is coupled to live hook state and uses debounced full-bundle saves. It also auto-loads the newest project and auto-creates when no project exists. This is convenient but not explicit enough for multiple projects, collaboration, undo/redo, or conflict handling.

Risk:

- Users may not control which project is loaded.
- Auto-save errors are surfaced as transient action messages rather than durable state.
- Full-bundle saves make conflict resolution and partial failure handling harder.

Recommended fix:

- Introduce explicit project selection/open state.
- Separate local workspace draft state from remote persistence state.
- Persist smaller commands/patches or versioned snapshots with conflict metadata.
- Add tests for queued save behavior, ID reconciliation, failed save recovery, and project switching.

## Medium-Impact Findings

### Random/Time-Based IDs Are Scattered

Files include `useSlopcastWorkspace.ts`, controls, assistant, toasts, repositories, and local account utilities.

Risk:

- IDs are harder to test and can collide under fast batch operations.
- Persisted local IDs later need reconciliation to UUIDs.

Recommended fix:

- Add a small `createLocalId(prefix)` utility.
- Prefer `crypto.randomUUID()` where durable uniqueness matters.
- Inject ID factories into reducers for deterministic tests.

### AI Key Is Injected Into Client Build

Files:

- `vite.config.ts`
- `src/services/geminiService.ts`

`GEMINI_API_KEY` is read in Vite config and defined into browser code as `process.env.GEMINI_API_KEY`. If populated during a production build, it becomes client-readable.

Risk:

- API key exposure if this service is enabled outside local/dev contexts.

Recommended fix:

- Move AI generation behind a backend endpoint or serverless function.
- Only expose public client-safe configuration through `VITE_*` variables.
- Add a build-time guard that fails production builds when private AI keys are about to be embedded.

### Build Output Is Heavy

Production build succeeds, but the reviewed snapshot emits:

- `mapbox-gl`: 1,680.90 KB minified, 463.70 KB gzip.
- `vendor-charts`: 431.84 KB minified, 126.43 KB gzip.
- Main `index`: 326.61 KB minified, 105.29 KB gzip.

Recommended fix:

- Lazy-load Mapbox only on the map workspace.
- Lazy-load heavy charting surfaces by route/workspace tab.
- Consider splitting map overlays and background themes into route-level chunks.

### Backend Optional Dependencies Are Undeclared

`backend/spatial_service.py` optionally imports `dotenv`, `databricks.sql`, `pyproj`, and `psycopg2`, but `backend/requirements.txt` only lists FastAPI, Uvicorn, and pytest.

Risk:

- Local/live spatial functionality depends on undeclared packages.
- Tests can pass in mock mode while live deployment is under-specified.

Recommended fix:

- Add extras such as `requirements-live.txt` or dependency groups for `databricks`, `pyproj`, and `psycopg2`.
- Document mock-only versus live-Databricks setup explicitly.

### Type Safety Degrades at External Boundaries

Many repository and Mapbox paths use `any`. Some are unavoidable around Mapbox, but Supabase row mapping can be tightened.

Recommended fix:

- Keep `any` at Mapbox API edges but wrap it in typed adapter functions.
- Use generated Supabase table row types in repository mappers.
- Add parser/validator helpers for JSONB contract fields.

## Low-Impact Cleanup

- Remove unused landing/deal state until the deal selection path is implemented.
- Replace console logging in `handleAcreageSearch` with a real search action or feature flag.
- Register the `integration` pytest marker to remove the backend warning.
- Centralize localStorage access for remaining raw keys.
- Remove stale compatibility variables such as `_db_connection` references in tests once the connection manager transition is complete.
