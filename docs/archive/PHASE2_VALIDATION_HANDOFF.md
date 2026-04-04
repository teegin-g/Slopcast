# Phase 2 Validation Handoff: Spatial Service + Databricks Integration

## What Was Built

Phase 2 of the Map Command Center on branch `spike/vibe-slop-stopper`. Two commits:

- `7932e26` — feat(spatial): add backend spatial service + viewport data integration (14 files, +1277 lines)
- `d9ec31c` — fix(spatial): map real Databricks column names and add dotenv loading (+5 files changed)

## Architecture

```
Databricks (eds.well.tbl_well_summary_all)
  → backend/spatial_service.py (lazy connection, 30s TTL cache, mock fallback)
  → backend/spatial_routes.py (POST /api/spatial/wells, GET /api/spatial/layers)
  → Vite proxy /api/* → localhost:8001
  → src/services/spatialService.ts (mock/live adapter, localStorage switching)
  → src/hooks/useViewportData.ts (debounced moveend, 8-entry LRU cache, AbortController)
  → MapCommandCenter.tsx (effectiveWells memo, data layer toggles, loading indicator)
```

## Files Created

### Backend (Python/FastAPI)
- `backend/spatial_models.py` — Pydantic: ViewportBounds, SpatialWellsRequest/Response, SpatialLayer
- `backend/spatial_service.py` — Databricks query with column mapping (sh_latitude_nad27, sh_longitude_nad27, well_name, well_status, api_14, lateral_length, operator, formation), _map_well_status() normalizer, mock fallback (40 seeded wells), TTL cache
- `backend/spatial_routes.py` — APIRouter factory: POST /api/spatial/wells, GET /api/spatial/layers
- `backend/tests/test_spatial_service.py` — 6 tests (mock fallback, bounds, status filter, truncation, layers, cache)
- `backend/tests/test_spatial_routes.py` — 3 tests (wells 200, layers 200, invalid bounds 422)
- `backend/.env` — Databricks credentials (token expires hourly, refresh via `databricks auth token`)

### Frontend (TypeScript/React)
- `src/types.ts` — Added ViewportBounds, SpatialLayerFilter, SpatialWellsResponse, SpatialLayer, SpatialDataSourceId
- `src/services/spatialService.ts` — Adapter pattern (mirrors economicsEngine.ts): mockSource + liveSource, localStorage key `slopcast_spatial_source`
- `src/services/spatialService.test.ts` — 9 tests
- `src/hooks/useViewportData.ts` — Debounced viewport fetch (400ms), LRU cache (8 entries), AbortController, live→mock fallback
- `src/hooks/useViewportData.test.ts` — 5 tests

### Modified Files
- `backend/main.py` — Added dotenv loading + `app.include_router(create_spatial_router())`
- `backend/requirements.txt` — Added databricks-sql-connector, python-dotenv
- `src/components/slopcast/MapCommandCenter.tsx` — useViewportData hook, effectiveWells memo, dataLayers state, spatialFilters, loading overlay, new OverlayToolbar props
- `src/components/slopcast/map/OverlayToolbar.tsx` — DATA section with Producing/DUCs/Permits/Laterals toggles, well count footer, source badge, loading spinner

## Databricks Table Details

- Table: `eds.well.tbl_well_summary_all`
- Key columns: `api_14` (id), `well_name`, `sh_latitude_nad27` (lat), `sh_longitude_nad27` (lng), `lateral_length`, `well_status`, `operator`, `formation`
- Status mapping: well_status containing "PRODUC"/"ACTIVE" → PRODUCING, "DUC"/"DRILLED" → DUC, "PERMIT"/"APPROVED" → PERMIT

## Environment Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
# Refresh token if expired:
TOKEN=$(databricks auth token --host https://dbc-3a822fc8-adcc.cloud.databricks.com | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
# Update backend/.env with fresh token if needed
uvicorn backend.main:app --port 8001 --reload
```

### Frontend
```bash
npm run dev  # localhost:3000
# To switch to live mode in browser console:
localStorage.setItem('slopcast_spatial_source', 'live')
# To switch back to mock:
localStorage.setItem('slopcast_spatial_source', 'mock')
```

## Test Commands

| Command | Expected |
|---------|----------|
| `cd backend && python -m pytest tests/ -v` | 11/11 pass |
| `npm run typecheck` | Clean, no errors |
| `npm run build` | Succeeds (~3.4s) |
| `npm test -- --run` | 129/129 pass (16 files) |
| `npm run ui:audit` | No style drift |

## What to Validate

### 1. Backend API (mock mode — no Databricks needed)
- `curl -X POST http://127.0.0.1:8001/api/spatial/wells -H 'Content-Type: application/json' -d '{"bounds":{"sw_lat":31.8,"sw_lng":-102.4,"ne_lat":32.0,"ne_lng":-102.2}}'`
  - Should return `source: "mock"`, wells within bounds, correct structure
- `curl http://127.0.0.1:8001/api/spatial/layers`
  - Should return 4 layers: producing, duc, permit, laterals
- `curl -X POST ... -d '{"bounds":{"sw_lat":-100,...}}'` → 422 validation error

### 2. Backend API (live Databricks mode)
- With valid .env credentials, same curl should return `source: "databricks"` with real wells
- Verify lat/lng values are sensible (Permian Basin: ~31-33 lat, ~-103 to -101 lng)
- Verify well_status maps correctly to PRODUCING/DUC/PERMIT

### 3. Frontend (browser — mock mode)
- Open localhost:3000, go to WELLS tab
- Map should render with wells (MOCK_WELLS initially)
- Pan around — should see wells update
- OverlayToolbar right side should have DATA section with 4 toggles
- Footer should show "40 · Mock"
- Toggle off "Producing" — well count should decrease
- Toggle all off — map should show no wells

### 4. Frontend (browser — live mode)
- Set `localStorage.setItem('slopcast_spatial_source', 'live')` in console
- Refresh page, pan map
- Network tab: POST requests to /api/spatial/wells should appear ~400ms after pan stops
- Wells from Databricks should render on map
- Footer should show "X · DB" with actual count
- Stop the backend → should fall back to mock data gracefully (no errors)

### 5. Theme verification
- Check WELLS tab in at least: slate, mario, synthwave themes
- OverlayToolbar DATA section should be styled correctly per theme
- Loading indicator should be themed (dark bg in all themes)

### 6. Performance
- Pan rapidly for 10 seconds → no jank, max 2-3 network requests
- Check no console errors during rapid panning
- Verify debounce (requests only fire after 400ms idle)

### 7. Graceful degradation
- Backend not running → map shows MOCK_WELLS, no errors
- localStorage set to 'live' but backend down → falls back to mock, no crash
- Invalid/expired token → falls back to mock with warning log

## Known Limitations
- OAuth token in backend/.env expires hourly — needs refresh for live testing
- SlopcastPage.tsx NOT modified — economics pipeline still uses MOCK_WELLS (by design)
- Lasso/rectangle selection tools are still scaffolded but not functional (Phase 1 scope)
- No Storybook story for the new data layer section in OverlayToolbar
