# Stream 10: Backend — Production Data Pipeline

**Wave:** 0 (Foundation)
**Agent:** `backend-data-agent`
**Estimated effort:** ~3 hours
**Dependencies:** None

---

## Objective

Build the production data pipeline that is the critical-path blocker for the Wine Rack assumption builder. Add endpoints for fetching monthly production history and enriched well data with completion metadata.

## Files to Create/Modify

| File | Action |
|------|--------|
| `backend/spatial_models.py` | Add production + enrichment Pydantic models |
| `backend/spatial_routes.py` | Add new endpoints |
| `backend/spatial_service.py` | Add production + enrichment query functions |

## Pre-Work

1. Read `backend/spatial_service.py` (755 lines, read in chunks) to understand the Databricks connector pattern
2. Read `backend/spatial_models.py` (57 lines) for existing model patterns
3. Read `backend/spatial_routes.py` (39 lines) for router structure
4. Check what tables exist in the Databricks `eds` catalog — look for production history, completion data, formation tops tables
5. Remove the dead `SpatialDBManager` class (legacy PostGIS code at lines 686-754 of spatial_service.py)

## Tasks

### Task 1: Add Pydantic Models

In `backend/spatial_models.py`, add:

```python
from pydantic import BaseModel
from typing import Optional
from datetime import date

class MonthlyProductionRecord(BaseModel):
    well_id: str
    month: str  # YYYY-MM
    oil_bbl: float
    gas_mcf: float
    water_bbl: float
    days_on_prod: int

class ProductionRequest(BaseModel):
    well_ids: list[str]
    start_month: Optional[str] = None  # YYYY-MM
    end_month: Optional[str] = None    # YYYY-MM

class ProductionResponse(BaseModel):
    wells: dict[str, list[MonthlyProductionRecord]]
    data_through_date: str

class EnrichedWell(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    lateral_length: Optional[float] = None
    status: str
    operator: Optional[str] = None
    formation: Optional[str] = None
    # Enrichment fields
    tvd_ft: Optional[float] = None
    bench: Optional[str] = None
    completion_date: Optional[str] = None
    first_prod_date: Optional[str] = None
    ip30: Optional[float] = None
    ip90: Optional[float] = None
    eur_mbo: Optional[float] = None
    cum_oil_bbl: Optional[float] = None
    cum_gas_mcf: Optional[float] = None
    gor_mcf_per_bbl: Optional[float] = None
    months_on_prod: Optional[int] = None
    frac_intensity_lbs_per_ft: Optional[float] = None
    stage_count: Optional[int] = None
    proppant_lbs: Optional[float] = None
    azimuth_deg: Optional[float] = None

class BenchDefinition(BaseModel):
    name: str
    formation: str
    top_depth_ft: float
    base_depth_ft: float
```

### Task 2: Add Production Query to Spatial Service

In `backend/spatial_service.py`, add a method to the `SpatialService` class:

```python
async def fetch_production_history(
    self,
    well_ids: list[str],
    start_month: str | None = None,
    end_month: str | None = None,
) -> dict[str, list[dict]]:
    """Fetch monthly production for given well IDs from Databricks."""
```

**Implementation notes:**
- Query the production history table (likely `eds.well.tbl_monthly_production` or `eds.production.tbl_well_monthly` — discover the actual table name)
- Filter by `well_id IN (...)` with parameterized query
- Batch large well ID lists (>100) into multiple queries
- Return as dict keyed by well ID
- Include mock fallback: generate synthetic production data for mock wells using Arps decline (qi=850, b=1.2, di=65%) with random noise

### Task 3: Add Well Enrichment Query

```python
async def fetch_enriched_wells(
    self,
    well_ids: list[str] | None = None,
    bounds: dict | None = None,
    filters: dict | None = None,
) -> list[dict]:
    """Fetch wells with full enrichment (completion data, production metrics, bench)."""
```

**Implementation notes:**
- Join the well summary table with completion and production summary views
- Compute TVD from bottomhole depth columns if available
- Extract bench from formation string (e.g., "Wolfcamp A" → bench="Wolfcamp A Upper")
- Compute azimuth from surface and bottomhole coordinates
- Compute GOR from cumulative production if available
- Mock fallback: enrich the 40 mock wells with synthetic completion dates, production metrics, and bench assignments

### Task 4: Add Bench/Formation Tops

```python
async def fetch_bench_definitions(
    self,
    area_bounds: dict | None = None,
) -> list[dict]:
    """Fetch stratigraphic bench definitions with depth ranges."""
```

**Implementation notes:**
- If a formation tops table exists in Databricks, query it
- If not, use a static reference table for the Permian Basin:
  ```
  Woodford:    top=11000, base=11200
  Sycamore:    top=10200, base=10500
  Meramec:     top=9400,  base=9800
  Osage:       top=8800,  base=9200
  Wolfcamp A:  top=7800,  base=8200
  Wolfcamp B:  top=7200,  base=7800
  Bone Spring: top=6500,  base=7200
  ```
- Return bench definitions sorted by depth (shallowest first)

### Task 5: Add API Endpoints

In `backend/spatial_routes.py`:

```python
@router.post("/production")
async def get_production_history(request: ProductionRequest):
    """Fetch monthly production history for given well IDs."""

@router.post("/wells/enriched")
async def get_enriched_wells(request: WellsRequest):
    """Fetch wells with full enrichment data."""

@router.get("/benches")
async def get_bench_definitions(
    north: float | None = None,
    south: float | None = None,
    east: float | None = None,
    west: float | None = None,
):
    """Fetch stratigraphic bench definitions."""
```

### Task 6: Mock Data Generation

For the mock fallback (when Databricks is unavailable), generate:

1. **Production history** for each of the 40 mock wells:
   - Start month: random between 2019-01 and 2023-06
   - Monthly oil: Arps decline from qi=800-1200 (random), b=1.0-1.5, di=55-75%
   - Monthly gas: oil × GOR (random 2.5-6.0 Mcf/Bbl)
   - Monthly water: starts low, increases with production decline
   - Days on prod: 28-31 (realistic)

2. **Enriched well fields** for each mock well:
   - TVD: 7800-8500 ft (matching existing trajectory generation)
   - Bench: one of ["Wolfcamp A", "Wolfcamp B", "Bone Spring", "Meramec"]
   - Completion date: random 2019-2023
   - IP30/IP90: derived from generated production
   - EUR: Arps EUR calculation
   - Cum oil/gas: sum of production through today
   - Stage count: lateral length / 200 (typical)
   - Proppant: stage count × 400,000 lbs (typical)

### Task 7: Remove Dead Code

- Remove `SpatialDBManager` class (lines ~686-754 of `spatial_service.py`)
- Remove any `app.state.db_manager` references
- Clean imports

## Verification

1. Run existing backend tests: `cd backend && python -m pytest`
2. Start the backend: `cd backend && uvicorn main:app --reload`
3. Test new endpoints with curl:
   ```bash
   # Production history
   curl -X POST http://localhost:8000/api/spatial/production \
     -H "Content-Type: application/json" \
     -d '{"well_ids": ["mock-well-1", "mock-well-2"]}'

   # Enriched wells
   curl -X POST http://localhost:8000/api/spatial/wells/enriched \
     -H "Content-Type: application/json" \
     -d '{"well_ids": ["mock-well-1"]}'

   # Bench definitions
   curl http://localhost:8000/api/spatial/benches
   ```
4. Verify mock fallback produces realistic data (spot-check production decline shape)

## Acceptance Criteria

- [ ] `POST /api/spatial/production` returns monthly oil/gas/water for requested well IDs
- [ ] `POST /api/spatial/wells/enriched` returns wells with all enrichment fields populated
- [ ] `GET /api/spatial/benches` returns bench definitions with depth ranges
- [ ] Mock fallback generates realistic synthetic production data
- [ ] Mock wells have bench assignments, completion dates, and production metrics
- [ ] Existing spatial endpoints still work (no regressions)
- [ ] Dead `SpatialDBManager` code removed
- [ ] Backend starts and all endpoints respond
