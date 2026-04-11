# DB Hardening + Progressive Wellbore Rendering

**Date:** 2026-04-10
**Status:** Design approved, pending implementation

## Problem

Two issues with the spatial data pipeline:

1. **Silent mock fallback** — When the Databricks connection fails (warehouse suspended, stale connection, token expired), the app silently falls back to mock data. Users see 40 fake Permian Basin wells and believe they're real. There's no reconnect logic and no unmistakable indicator of data source.

2. **Rendering bottlenecks** — Dense well areas (2k+ points) cause frame drops, and toggling laterals (trajectory data) freezes the UI while all trajectories fetch and all vertex data uploads to the GPU in one synchronous pass.

## Solution Overview

**Part 1: Hardened DB connection + trust indicators**
- Backend connection manager with health checks, auto-reconnect, and query timeouts
- Frontend source badge, connection toasts, and auto-detect on mount

**Part 2: Progressive wellbore rendering**
- Points-first priority rendering (decouple trajectory fetch from well points)
- Incremental vertex buffer uploads chunked across animation frames
- Adaptive trajectory station count based on zoom level

---

## Part 1: Connection Health + Trust Indicators

### 1.1 Backend Connection Manager

**File:** `backend/spatial_service.py`

Replace the bare module-level `_db_connection` singleton with a `ConnectionManager` class:

```
ConnectionManager:
  - connection: Connection | None
  - status: "connected" | "disconnected" | "connecting"
  - last_verified_at: float (time.time())
  - reconnect_attempts: int
  - error: str | None

  get_connection() -> Connection | None:
    if connection is None or status == "disconnected":
      attempt reconnect (max 2 attempts)
    if last_verified_at > 60s ago:
      run SELECT 1 ping
      if ping fails: attempt reconnect
    return connection or None

  reconnect() -> bool:
    close existing connection if any
    attempt new databricks_sql.connect() with 15s connect timeout
    on success: status = "connected", reset attempts
    on failure: status = "disconnected", increment attempts, log error
```

**Query timeouts:** Pass timeout to cursor operations:
- Wells query: 30s timeout
- Trajectory query: 15s timeout
- Health ping: 5s timeout

**Status endpoint extension** (`GET /api/spatial/status`):
Add `last_verified_at` and `reconnect_attempts` to the response. This is already partially wired — extend the existing dict.

### 1.2 Frontend Trust Indicators

**Source badge** (`OverlayToolbar`):
- Always visible, color-coded: green = "Live", yellow = "Demo", red flash on transition
- Show text label, not just icon — "Live" or "Demo"
- When `fallbackActive`, badge shows "Demo (fallback)" in yellow

**Connection toasts:**
- On transition from live → mock: toast "Connection lost — showing demo data" (warning style)
- On successful reconnect: toast "Connected to Databricks" (success style)
- Reuse the existing `src/components/slopcast/Toast.tsx` component
- Toasts auto-dismiss after 5s

**Auto-detect on mount:**
- On app load, call `GET /api/spatial/status`
- If backend reports `connected: true` and current source is `"mock"` (default):
  - Auto-switch to `"live"` source
  - Show toast: "Connected to Databricks"
- If backend reports `connected: false`:
  - Stay on mock, show toast: "Database unavailable — showing demo data"
- Store explicit user choice: if user manually toggles to mock, don't auto-switch back

**Connection polling:**
- Poll `/api/spatial/status` every 30s while source is `"live"` (or every 60s while on mock)
- On status change, update badge and show toast
- Stop polling when tab is hidden (`document.visibilityState`)

### 1.3 Files Modified

| File | Change |
|------|--------|
| `backend/spatial_service.py` | Replace `_db_connection` with `ConnectionManager`, add timeouts |
| `backend/spatial_routes.py` | Extend `/api/spatial/status` response |
| `src/services/spatialService.ts` | Add `fetchStatus()` function, connection polling logic |
| `src/hooks/useViewportData.ts` | Integrate connection status, auto-detect, fallback state |
| `src/components/slopcast/map/OverlayToolbar.tsx` | Hardened source badge with color coding |
| New: `src/hooks/useConnectionStatus.ts` | Connection health polling hook |
| `src/components/slopcast/Toast.tsx` | Reuse existing toast for connection status notifications |

---

## Part 2: Progressive Wellbore Rendering

### 2.1 Points-First Priority Rendering

**Decouple the fetch pipeline:**

Today, `useViewportData` makes one request at the zoom-determined detail level. Change to a two-phase fetch when laterals are enabled:

1. **Phase 1:** Always fetch at `"summary"` detail level first — returns well points with all metadata but no trajectories. Points render immediately via Mapbox GeoJSON layers.

2. **Phase 2:** If `dataLayers.laterals` is enabled AND zoom >= 12, follow up with a `"full"` request for the same viewport. When trajectories arrive, pass them to `MapWellboreLayer`.

This means the user sees well points on the map within the first response, and laterals "fill in" behind them. If the user pans before trajectories load, cancel the phase-2 request (the existing `AbortController` pattern — but actually wire the signal through to `fetch` this time).

**Frontend change** (`useViewportData.ts`):
- Split `fetchViewportData()` into `fetchPoints()` and `fetchTrajectories()`
- `fetchPoints()` resolves first, updates `wells` state
- `fetchTrajectories()` resolves second, merges trajectory data into existing wells
- If viewport changes during phase 2, cancel phase 2 and restart from phase 1

### 2.2 Incremental Vertex Buffer Uploads

**File:** `src/components/slopcast/MapWellboreLayer.ts`

Today, `uploadVertexData()` builds one giant `Float32Array` from all wells' trajectories and uploads it in a single `gl.bufferData()` call. For 500 wells with 50 stations each = 25,000 line segments = 400,000 floats — this blocks the main thread.

Change to incremental uploads:

1. **Pre-allocate the GPU buffer** — calculate total vertex count upfront, allocate with `gl.bufferData(target, totalBytes, gl.DYNAMIC_DRAW)` once (no data yet).

2. **Chunk the wells** — split the wells array into batches of 100.

3. **Per-frame upload** — on each `requestAnimationFrame`:
   - Pack the next batch of 100 wells into a `Float32Array`
   - Upload via `gl.bufferSubData(target, byteOffset, data)` — writes into the pre-allocated buffer at the correct offset
   - Increment the draw count (`vertexCount`) to include the new batch
   - Call `map.triggerRepaint()` to render the partial buffer

4. **Visual effect** — laterals "grow" across the map over ~5-10 frames (50-170ms at 60fps for 500 wells). Users see continuous progress instead of a freeze.

5. **Cancellation** — if `setWellbores()` is called again while a batch sequence is in progress (e.g., user panned), cancel the current sequence and restart with the new data.

### 2.3 Adaptive Trajectory Detail

**Backend change** (`spatial_service.py`):

The `_MAX_STATIONS_PER_WELL = 50` constant is currently fixed. Make it responsive to zoom level:

| Zoom | Max stations | Rationale |
|------|-------------|-----------|
| 12-13 | 20 | Laterals visible but small — fewer stations still look smooth |
| 14-15 | 35 | Medium detail |
| 16+ | 50 | Full detail at high zoom |

**Frontend passes zoom** — extend the `SpatialWellsRequest` with an optional `zoom` field. The backend uses it to select station count. If omitted, defaults to 50 (backward compat).

### 2.4 Loading Indicator

While trajectories are loading (phase 2 in-flight) or vertex uploads are in progress:
- Show a subtle text in the toolbar: "Loading laterals... 127 / 342" (wells with trajectories loaded)
- Or a thin progress bar at the top/bottom of the map container
- Disappears when all batches have uploaded

### 2.5 Files Modified

| File | Change |
|------|--------|
| `src/hooks/useViewportData.ts` | Two-phase fetch (points then trajectories), wire AbortSignal |
| `src/components/slopcast/MapWellboreLayer.ts` | Incremental vertex uploads via rAF batching |
| `src/components/slopcast/MapCommandCenter.tsx` | Trajectory loading indicator, progress state |
| `backend/spatial_service.py` | Adaptive station count based on zoom, accept `zoom` parameter |
| `backend/spatial_models.py` | Add `zoom` field to `SpatialWellsRequest` |
| `src/services/spatialService.ts` | Pass zoom in live source requests |

---

## Testing

### Unit Tests
- `ConnectionManager`: test reconnect logic, timeout behavior, status transitions
- `useViewportData`: test two-phase fetch, cancellation on viewport change
- `MapWellboreLayer`: test incremental upload scheduling, cancellation, draw count progression

### Integration Tests
- Source auto-detect: mock backend returning connected/disconnected, verify auto-switch
- Fallback flow: simulate live fetch failure, verify toast + badge update + mock fallback
- Progressive render: load 500 wells with laterals, verify points appear before trajectories

### Manual Verification
- Start with backend off → verify "Demo" badge + toast
- Start backend → verify auto-switch to "Live" + toast
- Kill backend mid-session → verify fallback toast + badge change
- Toggle laterals in a dense area → verify no UI freeze, progressive lateral appearance
- Pan rapidly with laterals on → verify previous trajectory loads cancel cleanly

---

## Out of Scope

- Web workers for vertex packing (can upgrade later if data volumes grow)
- Server-side clustering / MVT tiles (current scale doesn't warrant it)
- Connection pooling (single-user; `databricks-sql-connector` is synchronous)
- The committed `.env` with real Databricks credentials (security issue, but separate concern)
- SQL injection hardening on filter values (noted, but separate concern)
- `MapWellPulseLayer` hookup (exists but not wired — separate feature)
