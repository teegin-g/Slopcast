# Spec 01: Data Access Layer & Well Header Service

**Status**: Not started
**Dependencies**: None (foundation spec)
**Blocks**: Specs 02, 03, 04, 05, 06

---

## Goal

Create the backend data access layer that connects to Databricks and serves well header data to the frontend. This is the foundation spec — every other spec depends on the DB connection pattern and extended Well type established here.

---

## User Decisions

- **Well ID hierarchy**: Slopcast UUID > propnum > api_14
- **Initial load**: Users filter to a subset (basin, operator, formation) — not all 1.6M wells
- **Data access**: Direct Databricks SQL queries for now; Lakebase later

---

## Databricks Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `eds.well.tbl_well_summary` | 1.67M | Primary well header (162 columns) — identity, location, dates, design, status, performance, operator, spacing |
| `epw.aries_evergreen.ac_property` | 31K | CLR-interest wells — type curve, reservoir domain, cost profile, LOE, ownership, engineer |

**Join**: `tbl_well_summary.propnum = ac_property.propnum` (LEFT JOIN — ~55% of wells have propnums)

---

## Backend Changes

### New: `backend/db.py` — Databricks Connection Manager

```python
# Connection pool / factory for databricks-sql-connector
# Reads config from environment variables:
#   DATABRICKS_SERVER_HOSTNAME
#   DATABRICKS_HTTP_PATH
#   DATABRICKS_ACCESS_TOKEN (or OAuth)
# Exposes: get_connection() context manager
```

### New: `backend/well_service.py` — Well Query Logic

Functions:
- `search_wells(basin, operator, formation, status, bbox, limit, offset)` → paginated results from `tbl_well_summary`
- `get_well_header(well_id)` → single well detail joining `tbl_well_summary` + `ac_property`
- `get_filter_options()` → distinct basins, operators, formations for dropdown population

### Modified: `backend/main.py` — New Endpoints

```
GET /api/wells?basin=...&operator=...&formation=...&status=...&bbox=...&limit=100&offset=0
    → Paginated well list with core fields

GET /api/wells/:id/header
    → Full well header with all enriched fields (tbl_well_summary + ac_property)

GET /api/wells/filters
    → { basins: string[], operators: string[], formations: string[] }
```

### Modified: `backend/requirements.txt`

Add: `databricks-sql-connector>=3.0.0`

---

## Frontend Changes

### Modified: `src/types.ts` — Extend `Well` Interface

Current `Well` has 8 fields. Extend to include:

```typescript
export interface Well {
  // Existing
  id: string;          // Slopcast UUID
  name: string;
  lat: number;
  lng: number;
  lateralLength: number;
  status: 'PRODUCING' | 'DUC' | 'PERMIT' | 'DRILLING' | 'COMPLETED' | 'SI' | 'TA';
  operator: string;
  formation: string;

  // New — Identity
  api14?: string;
  propnum?: string;
  unitId?: string;
  unitName?: string;

  // New — Location
  county?: string;
  basin?: string;
  zone?: string;
  state?: string;
  assetTeam?: string;
  reservoirDomain?: string;

  // New — Dates
  permitDate?: string;
  spudDate?: string;
  completionDate?: string;
  firstProdDate?: string;

  // New — Well Design
  totalDepth?: number;
  tvd?: number;
  stageTotal?: number;
  proppantTotal?: number;
  fluidTotal?: number;
  wellboreDirection?: string;

  // New — Performance
  eurBoe?: number;
  eurOil?: number;
  eurGas?: number;
  peakBoe?: number;
  cumOilToDate?: number;
  cumGasToDate?: number;

  // New — Ownership
  wi?: number;
  nri?: number;

  // New — Operator
  operatorShort?: string;
  operatorTicker?: string;

  // New — Aries-specific (only for CLR-interest wells)
  costProfile?: string;
  prodTypeCurve?: string;
}
```

### New: `src/services/wellService.ts` — Frontend API Client

```typescript
export async function searchWells(filters: WellFilters): Promise<PaginatedResult<Well>>
export async function getWellHeader(wellId: string): Promise<Well>
export async function getFilterOptions(): Promise<FilterOptions>
```

### New: `src/hooks/useWells.ts` — React Query Hook

```typescript
export function useWells(filters: WellFilters)     // paginated list
export function useWellHeader(wellId: string)       // single well detail
export function useFilterOptions()                  // dropdown options
```

### Modified: `package.json`

Add: `@tanstack/react-query` (note: `@tanstack/react-table` already present)

### Modified: `src/hooks/useSlopcastWorkspace.ts`

- Replace `MOCK_WELLS` import with `useWells()` hook
- Keep mock data as fallback when API is unavailable (error state)
- Wire filter state (basin, operator, formation) to query parameters

### New: `src/index.tsx` or `src/App.tsx`

- Wrap app in `<QueryClientProvider>` from React Query

---

## Column Mapping: `tbl_well_summary` → `Well`

| Databricks Column | TypeScript Field | Notes |
|-------------------|-----------------|-------|
| `api_14` | `api14` | Unique per well |
| `propnum` | `propnum` | ~55% coverage |
| `well_name` | `name` | |
| `sh_latitude_nad27` | `lat` | May need NAD27→WGS84 |
| `sh_longitude_nad27` | `lng` | May need NAD27→WGS84 |
| `lateral_length` | `lateralLength` | In feet |
| `well_status` | `status` | Map to union type |
| `operator` | `operator` | |
| `operator_short` | `operatorShort` | |
| `operator_ticker` | `operatorTicker` | |
| `formation` | `formation` | |
| `basin` | `basin` | |
| `county` | `county` | |
| `state` | `state` | |
| `zone` | `zone` | |
| `asset_team` | `assetTeam` | From ac_property |
| `permit_date` | `permitDate` | ISO string |
| `spud_date` | `spudDate` | ISO string |
| `completion_date` | `completionDate` | ISO string |
| `first_prod_date` | `firstProdDate` | ISO string |
| `total_depth` | `totalDepth` | |
| `true_vertical_depth` | `tvd` | |
| `stage_total` | `stageTotal` | |
| `proppant_total` | `proppantTotal` | |
| `fluid_total` | `fluidTotal` | |
| `wellbore_direction` | `wellboreDirection` | |
| `eur_boe` | `eurBoe` | |
| `eur_oil_bbl` | `eurOil` | |
| `eur_gas_mcf` | `eurGas` | |
| `peak_boe` | `peakBoe` | |
| `cum_oil_to_date` | `cumOilToDate` | |
| `cum_gas_to_date` | `cumGasToDate` | |
| `wi` | `wi` | |
| `nri` | `nri` | Or `nri_bpo_oil` from ac_property |

---

## Performance Considerations

- **Pagination**: Default 100 wells per page, max 500
- **Indexes**: Queries filter on `basin`, `operator`, `formation`, `well_status` — ensure these columns are used in WHERE clauses
- **Caching**: Filter options (basins/operators/formations) change rarely — cache client-side for 5 min
- **Connection pooling**: Reuse Databricks SQL connections across requests

---

## Acceptance Criteria

1. `GET /api/wells?basin=Permian&limit=50` returns 50 wells with all mapped fields
2. `GET /api/wells/:id/header` returns enriched well data with ac_property fields
3. `GET /api/wells/filters` returns distinct basins, operators, formations
4. Frontend loads wells from API on page load with basin/operator/formation filters
5. Falls back to `MOCK_WELLS` when API is unreachable (graceful degradation)
6. `npm run typecheck` passes with the extended `Well` interface
7. React Query is installed and provider is set up at the app root
