# Investigation Report: Map Cannot Load Real Data

**Date:** 2026-04-01
**Branch:** `spike/vibe-slop-stopper`
**Investigator:** Claude Code (automated codebase analysis)

---

## Executive Summary

The map **is structurally incapable of displaying real (Databricks) data** due to 5 distinct bugs operating at different layers of the stack. Even if the backend Databricks connection works perfectly, the frontend hardcodes `'mock'` as the data source and the page-level state is permanently welded to the 40 mock wells from `constants.ts`. There is no user-facing mechanism to switch to live data, and even if one existed, the economics/filtering/grouping pipeline would still ignore it.

---

## Root Causes (Ordered by Severity)

### BUG 1 (Critical): `useViewportData` hardcodes `'mock'` source — live data path is dead code

**File:** `src/hooks/useViewportData.ts:111`

```typescript
const sourceId = dataSourceId ?? 'mock';
```

The `dataSourceId` prop is **never passed** by `MapCommandCenter` (the only consumer):

```typescript
// MapCommandCenter.tsx:128-138
const { wells: viewportWells, ... } = useViewportData({
  map,
  isLoaded,
  filters: spatialFilters,
  // dataSourceId is ABSENT — always falls back to 'mock'
});
```

**Impact:** The `live` source in `spatialService.ts` (which calls `POST /api/spatial/wells`) is unreachable. The spatial service's `getStoredSpatialSourceId()` function reads from localStorage but is also **never consulted** — the hook uses the explicit `dataSourceId` prop, not the stored preference.

**Fix:** Pass `dataSourceId` from props or read `getStoredSpatialSourceId()` as the default instead of hardcoding `'mock'`.

---

### BUG 2 (Critical): `SlopcastPage` passes `MOCK_WELLS` directly — bypasses viewport data entirely

**File:** `src/pages/SlopcastPage.tsx:806`

```typescript
wells={MOCK_WELLS}
```

The parent page passes the hardcoded 40 mock wells as the `wells` prop to `MapCommandCenter`. Inside `MapCommandCenter`, the merge logic at line 140-145:

```typescript
const effectiveWells = useMemo(() => {
  if (viewportWells.length > 0 && spatialSource !== null) {
    return viewportWells;
  }
  return wells; // falls back to MOCK_WELLS prop
}, [viewportWells, spatialSource, wells]);
```

Since `useViewportData` always uses the mock source (Bug 1), `viewportWells` will always contain the same 40 mock wells, and `spatialSource` will be `'mock'`. The merge condition `viewportWells.length > 0 && spatialSource !== null` evaluates to `true`, but both paths return mock data anyway.

**Impact:** Even if Bug 1 were fixed, the fallback path still returns mock data from the parent. The entire viewport-aware system is shadowed.

---

### BUG 3 (Critical): All page-level state is permanently coupled to `MOCK_WELLS`

**File:** `src/pages/SlopcastPage.tsx`

Multiple state systems are initialized from and operate exclusively against `MOCK_WELLS`:

| Location | Code | Impact |
|----------|------|--------|
| Line 172 | `wellIds: new Set(MOCK_WELLS.map(w => w.id))` | Default group contains only mock well IDs |
| Line 231 | `useWellFiltering(MOCK_WELLS)` | Filter options (operators, formations) derived from mock data only |
| Line 254 | `MOCK_WELLS.filter(w => group.wellIds.has(w.id))` | Economics calculations use mock wells only |
| Line 805 | `totalWellCount={MOCK_WELLS.length}` | Well count header shows 40 always |
| Line 822 | `wells={MOCK_WELLS}` | Economics view also receives mock only |

**Impact:** Even if the map rendered live wells, the filter dropdowns would show mock operators/formations, the well count would always read "40", group assignments would fail (live well IDs don't match mock IDs), and economics would calculate against mock data. The entire page is structurally coupled to the mock dataset.

---

### BUG 4 (Moderate): No UI toggle to switch data source

**Observation:** The `OverlayToolbar` component displays a passive `Mock` / `DB` badge showing the current source (line 202-207), but there is **no interactive control** to switch between sources. The `setStoredSpatialSourceId()` function exists but is never called from any UI component.

The `spatialService.ts` exports `getAllSpatialSources()` and `setStoredSpatialSourceId()` — the plumbing for a toggle exists but was never wired to the UI.

**Impact:** Even if Bugs 1-3 were fixed, users would have no way to activate live data. The only way to switch is via browser console: `localStorage.setItem('slopcast_spatial_source', 'live')`.

---

### BUG 5 (Moderate): Backend Databricks token is a short-lived OAuth JWT

**File:** `backend/.env`

The `DATABRICKS_TOKEN` is an OAuth JWT with an `exp` claim (expiration). This is not a long-lived personal access token — it expires and must be refreshed.

**Impact:** Even if the frontend were wired correctly, the backend would fail silently after token expiry. The backend catches the exception and falls back to mock data (line 261-263 of `spatial_service.py`), so the user would see wells — but they'd be mock wells with no error surfaced to the UI.

---

## Architecture Diagram: Current Data Flow

```
                    SlopcastPage
                    ├── MOCK_WELLS (hardcoded, 40 wells)
                    ├── useWellFiltering(MOCK_WELLS)     // mock only
                    ├── useWellSelection(...)             // operates on mock IDs
                    ├── processedGroups = groups.map(     // economics: mock only
                    │     MOCK_WELLS.filter(...)
                    │   )
                    │
                    ├── MapCommandCenter
                    │   ├── wells={MOCK_WELLS}            // prop from parent
                    │   ├── useViewportData({             // viewport hook
                    │   │     dataSourceId: undefined      // BUG 1: defaults to 'mock'
                    │   │   })
                    │   │   └── getSpatialSource('mock')   // always mock
                    │   │       └── filters MOCK_WELLS     // client-side only
                    │   │
                    │   ├── effectiveWells = viewportWells.length > 0
                    │   │     ? viewportWells              // mock viewport wells
                    │   │     : wells                      // mock prop wells
                    │   │
                    │   └── Mapbox GL renders effectiveWells as GeoJSON
                    │
                    └── DesignEconomicsView
                        └── wells={MOCK_WELLS}            // also hardcoded
```

```
  UNREACHABLE PATH (dead code):

  useViewportData({ dataSourceId: 'live' })
    └── getSpatialSource('live')
        └── POST /api/spatial/wells
            └── FastAPI spatial_routes.py
                └── spatial_service.get_wells_in_bounds()
                    ├── _query_databricks()    // tries Databricks SQL
                    │   └── eds.well.tbl_well_summary_all
                    └── _query_mock()          // fallback
```

---

## What Works

- **Map rendering**: Mapbox GL initializes correctly, renders well circles from GeoJSON, handles click/selection, applies theme palettes. The rendering pipeline is solid.
- **Viewport-aware fetching**: `useViewportData` hook correctly listens to `moveend`, debounces, caches, and supports abort. The implementation is well-structured — it just can't reach live data.
- **Backend spatial service**: The Databricks query is well-formed, handles null columns, maps status enums, and has proper fallback. It just isn't called.
- **Frontend spatial service**: Both `mock` and `live` sources are implemented and tested. The registry pattern works. Just nobody passes `'live'`.

---

## Verification Methods Used

| Method | What Was Checked |
|--------|-----------------|
| Static code analysis | Traced every `MOCK_WELLS` import and `dataSourceId` reference |
| Grep for `setStoredSpatialSourceId` | Confirmed no UI component calls the toggle function |
| Grep for `dataSourceId` prop usage | Confirmed `MapCommandCenter` never passes it |
| Read `useViewportData` in full | Confirmed hardcoded `'mock'` default |
| Read `SlopcastPage` state init | Confirmed all state tied to `MOCK_WELLS` |
| Read E2E tests | Confirmed tests only validate that *some* wells render, not that they're real |
| Read Storybook stories | Confirmed no MapCommandCenter story exists for integration testing |

---

## Recommended Fix Plan (for agent team execution)

### Phase 1: Unblock the live data path (3 files, ~50 LOC)

**Task 1.1:** Wire `dataSourceId` through `MapCommandCenter`
- File: `src/components/slopcast/MapCommandCenter.tsx`
- Add `dataSourceId` prop to `MapCommandCenterProps`
- Pass it to `useViewportData({ ..., dataSourceId })`

**Task 1.2:** Pass `dataSourceId` from `SlopcastPage`
- File: `src/pages/SlopcastPage.tsx`
- Add state: `const [spatialSourceId, setSpatialSourceId] = useState<SpatialDataSourceId>(getStoredSpatialSourceId())`
- Pass to `<MapCommandCenter dataSourceId={spatialSourceId} />`

**Task 1.3:** Fix default in `useViewportData`
- File: `src/hooks/useViewportData.ts`
- Change line 111 from `dataSourceId ?? 'mock'` to `dataSourceId ?? getStoredSpatialSourceId()`

### Phase 2: Decouple page state from MOCK_WELLS (1 file, ~80 LOC)

**Task 2.1:** Lift well data from viewport into page state
- File: `src/pages/SlopcastPage.tsx`
- Replace `MOCK_WELLS` references with a `wells` state variable
- Initialize with `MOCK_WELLS` but accept updates from `MapCommandCenter` via callback
- Add `onWellsLoaded: (wells: Well[]) => void` prop to `MapCommandCenter`
- When `effectiveWells` changes (from viewport data), call the callback
- Update `useWellFiltering(wells)` to use the live well array
- Update `processedGroups` computation to use `wells` instead of `MOCK_WELLS`
- Update `totalWellCount` to derive from `wells.length`

**Task 2.2:** Handle group well ID mismatch
- When data source switches from mock to live, group `wellIds` will contain mock IDs (`w-0`, `w-1`) that don't exist in Databricks data (API-14 numbers)
- Add migration logic: when wells change source, clear stale group assignments and prompt user to re-assign

### Phase 3: Add UI data source toggle (~40 LOC)

**Task 3.1:** Add toggle to `OverlayToolbar`
- File: `src/components/slopcast/map/OverlayToolbar.tsx`
- Make the existing `Mock`/`DB` badge clickable
- On click: call `setStoredSpatialSourceId()` and propagate to parent
- Add visual indicator (active state) for current source
- Show connection status (green dot = connected, red = fallback)

**Task 3.2:** Surface errors to UI
- When `useViewportData` returns `fallbackActive: true` or `error`, show a toast/banner
- Currently errors are swallowed (state exists but never rendered)

### Phase 4: Backend token management

**Task 4.1:** Replace OAuth JWT with a long-lived personal access token or implement token refresh
- File: `backend/.env` and `backend/spatial_service.py`
- Option A: Use Databricks PAT instead of OAuth JWT
- Option B: Add refresh logic in `_get_db_connection()` that detects expired token and re-authenticates
- Add a `/api/spatial/status` health endpoint that returns connection state

### Phase 5: Testing

**Task 5.1:** Add `MapCommandCenter` Storybook story
- Currently missing — only overlay subcomponents have stories
- Create story with mocked `useMapboxMap` and `useViewportData` hooks
- Cover both `mock` and `live` source states

**Task 5.2:** Update E2E tests
- `e2e/slopcast-map.spec.ts` currently only asserts wells render, not their source
- Add test that sets `localStorage('slopcast_spatial_source', 'live')` and verifies the `DB` badge appears
- Add test for error/fallback states

**Task 5.3:** Add integration test for `useViewportData` with live source
- Mock `fetch` to simulate `/api/spatial/wells` responses
- Verify fallback behavior when API returns 500
- Verify cache invalidation on filter change

---

## File Impact Summary

| File | Phase | Change Type |
|------|-------|-------------|
| `src/hooks/useViewportData.ts` | 1 | Fix default source ID |
| `src/components/slopcast/MapCommandCenter.tsx` | 1, 2 | Add `dataSourceId` prop, add `onWellsLoaded` callback |
| `src/pages/SlopcastPage.tsx` | 1, 2 | Decouple from `MOCK_WELLS`, wire live data flow |
| `src/components/slopcast/map/OverlayToolbar.tsx` | 3 | Make source badge interactive |
| `backend/spatial_service.py` | 4 | Token refresh logic |
| `backend/.env` | 4 | Token management |
| `src/components/slopcast/MapCommandCenter.stories.tsx` | 5 | New file |
| `e2e/slopcast-map.spec.ts` | 5 | Extend assertions |

---

## Validation Gates

Each phase must pass its gate before the next begins. These gates go **beyond** the standard `gate.sh` pipeline (typecheck → build → test → storybook → audit) by adding **data-path-specific assertions** that prove real data actually flows.

### Gate 0: Pre-Flight (before any changes)

Baseline the current behavior so we can prove the fix works.

```bash
# 1. Capture current mock-only behavior
npm run typecheck && npm run build && npm test

# 2. Verify the bug exists — grep for hardcoded mock default
grep -n "dataSourceId ?? 'mock'" src/hooks/useViewportData.ts
# EXPECTED: line 111 matches → confirms Bug 1

# 3. Verify no consumer passes dataSourceId
grep -rn "dataSourceId" src/components/slopcast/MapCommandCenter.tsx
# EXPECTED: zero matches in the props destructure → confirms Bug 1

# 4. Count MOCK_WELLS references in SlopcastPage
grep -c "MOCK_WELLS" src/pages/SlopcastPage.tsx
# EXPECTED: 5+ direct references → confirms Bug 3
```

### Gate 1: Live Data Path Unblocked (after Phase 1)

Proves the `useViewportData` hook *can* reach the live source. Does NOT require a running backend.

```
ASSERTION 1.1: No hardcoded 'mock' default
  grep "dataSourceId ?? 'mock'" src/hooks/useViewportData.ts
  EXPECTED: zero matches

ASSERTION 1.2: MapCommandCenter accepts and passes dataSourceId
  grep "dataSourceId" src/components/slopcast/MapCommandCenter.tsx
  EXPECTED: appears in props interface AND in useViewportData call

ASSERTION 1.3: SlopcastPage passes a data source prop
  grep "dataSourceId\|spatialSourceId" src/pages/SlopcastPage.tsx
  EXPECTED: state variable created AND passed to MapCommandCenter

ASSERTION 1.4: Unit test proves live source is reachable
  Create: src/hooks/useViewportData.test.ts
  Test: when dataSourceId='live', getSpatialSource is called with 'live'
  Test: when dataSourceId is absent, reads from getStoredSpatialSourceId()
  Run: npm test -- --grep "useViewportData"
  EXPECTED: all pass

ASSERTION 1.5: Standard gate passes
  npm run typecheck && npm run build && npm test
  EXPECTED: zero failures
```

### Gate 2: Page State Decoupled (after Phase 2)

Proves `SlopcastPage` can operate against a dynamic well array, not just `MOCK_WELLS`.

```
ASSERTION 2.1: MOCK_WELLS is only used as initial/fallback value
  grep -c "MOCK_WELLS" src/pages/SlopcastPage.tsx
  EXPECTED: ≤ 2 references (import + initial state only)

ASSERTION 2.2: useWellFiltering receives dynamic wells
  grep "useWellFiltering" src/pages/SlopcastPage.tsx
  EXPECTED: called with a state variable, not MOCK_WELLS literal

ASSERTION 2.3: totalWellCount derives from state
  grep "totalWellCount" src/pages/SlopcastPage.tsx
  EXPECTED: NOT hardcoded to MOCK_WELLS.length

ASSERTION 2.4: Economics use dynamic wells
  grep "MOCK_WELLS.filter" src/pages/SlopcastPage.tsx
  EXPECTED: zero matches — replaced with state-based well lookup

ASSERTION 2.5: Type safety holds
  npm run typecheck
  EXPECTED: zero errors

ASSERTION 2.6: Existing tests still pass
  npm test
  EXPECTED: all pass (mock wells are still the default, so existing behavior is preserved)
```

### Gate 3: UI Toggle Functional (after Phase 3)

Proves users can switch data sources and see the result.

```
ASSERTION 3.1: OverlayToolbar has interactive source control
  grep -A5 "source.*click\|onClick.*source\|toggle.*source" \
    src/components/slopcast/map/OverlayToolbar.tsx
  EXPECTED: click handler that calls setStoredSpatialSourceId or equivalent

ASSERTION 3.2: Source badge reflects current source
  Storybook story: OverlayToolbar with source='mock' shows "Mock"
  Storybook story: OverlayToolbar with source='databricks' shows "DB"
  npm run storybook:test
  EXPECTED: both stories render without error

ASSERTION 3.3: Error/fallback state is surfaced
  grep "fallbackActive\|error" src/components/slopcast/MapCommandCenter.tsx
  EXPECTED: both states are rendered in JSX (toast, banner, or badge)

ASSERTION 3.4: E2E test validates source toggle
  In e2e/slopcast-map.spec.ts:
  - Set localStorage slopcast_spatial_source='mock'
  - Verify 'Mock' badge visible
  npm run ui:verify
  EXPECTED: passes
```

### Gate 4: Backend Resilient (after Phase 4)

Proves the backend handles token lifecycle and surfaces connection status.

```
ASSERTION 4.1: Health endpoint exists
  curl -s http://127.0.0.1:8001/api/spatial/status | jq .
  EXPECTED: returns { "connected": bool, "source": "databricks"|"mock", "error": null|string }

ASSERTION 4.2: Token refresh or PAT is configured
  grep -c "refresh\|PAT\|personal_access_token\|token_expiry" backend/spatial_service.py
  EXPECTED: ≥ 1 match — token management is implemented

ASSERTION 4.3: Expired token falls back gracefully
  # With an expired/invalid token in backend/.env:
  curl -s -X POST http://127.0.0.1:8001/api/spatial/wells \
    -H "Content-Type: application/json" \
    -d '{"bounds":{"sw_lat":31,"sw_lng":-103,"ne_lat":32,"ne_lng":-101}}'
  EXPECTED: returns wells with source="mock" (not 500 error)

ASSERTION 4.4: Backend tests pass
  cd backend && python -m pytest (if tests exist) or manual curl verification
```

### Gate 5: Full Regression (after Phase 5 / all changes merged)

The complete validation gate plus data-specific assertions.

```
ASSERTION 5.1: Standard validation gate passes
  bash .agents/validation/gate.sh --skip-screenshots
  EXPECTED: VALIDATION GATE: PASS

ASSERTION 5.2: New unit tests exist and pass
  npm test -- --grep "useViewportData|spatialService"
  EXPECTED: ≥ 5 new test cases, all passing

ASSERTION 5.3: E2E map tests pass across themes
  npm run ui:verify
  EXPECTED: slopcast-map.spec.ts passes for slate + mario

ASSERTION 5.4: Storybook builds and tests pass
  npm run ui:components
  EXPECTED: all stories render, including any new MapCommandCenter stories

ASSERTION 5.5: No dead code introduced
  grep -rn "MOCK_WELLS" src/pages/SlopcastPage.tsx
  EXPECTED: ≤ 2 references (import + initial state fallback)

ASSERTION 5.6: Data source is configurable end-to-end
  # In browser console:
  localStorage.setItem('slopcast_spatial_source', 'live')
  # Reload → map should attempt live fetch (may fallback if no backend, but the REQUEST is made)
  # Network tab shows POST /api/spatial/wells
```

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Group well IDs break when switching mock→live | **High** | Phase 2.2 handles ID migration |
| Economics calculations produce NaN/zero with empty groups | **High** | Add null guards in `processedGroups` computation |
| Mapbox rate limits with rapid viewport changes on live data | **Low** | 400ms debounce + 8-entry LRU cache already in place |
| Backend Databricks connection pool exhaustion | **Low** | Single connection with lazy init, 30s cache reduces query volume |
| Token expiry causes silent mock fallback | **High** | Phase 4 addresses token management + Phase 3.2 surfaces errors |
