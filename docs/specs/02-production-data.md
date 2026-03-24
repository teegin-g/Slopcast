# Spec 02: Production Data Service

**Status**: Not started
**Dependencies**: Spec 01 (DB connection layer, well IDs, React Query setup)
**Blocks**: None

---

## Goal

Serve actual and forecast production data for selected wells, enabling production charts and feeding the economics engine with real volumes.

---

## User Decisions

- Use the **stitched table** (`tbl_monthly_production_plus_forecast`) as the primary source of truth
- Later allow varying sources, but start with the combined actuals+forecast table

---

## Databricks Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `eds.production.tbl_monthly_production` | 189M | Monthly actuals — `api_14`, `propnum`, `production_month`, `oil`, `gas`, `water`, `boe`, `days_on`, `months_on`, `cum_oil`, `cum_gas` |
| `eds.production.tbl_monthly_production_plus_forecast` | 719M | Stitched actuals + forecast — includes `actual_or_forecast`, `scenario`, `qualifier` columns |
| `eds.production.tbl_daily_production_actuals` | 62M | Daily actuals (future use) |

---

## Backend Changes

### New: `backend/production_service.py`

Functions:
- `get_well_production(well_id, source='stitched', start_date=None, end_date=None)` → monthly production records
- `get_batch_production(well_ids: list, source='stitched', start_date=None, end_date=None)` → dict of well_id → production records
- `get_production_summary(well_id)` → summary stats (peak, cum, latest month)

Query patterns:
```sql
-- Single well stitched production
SELECT production_month, oil, gas, water, boe, days_on, months_on,
       cum_oil, cum_gas, actual_or_forecast, scenario, qualifier
FROM eds.production.tbl_monthly_production_plus_forecast
WHERE propnum = :propnum
  AND scenario = 'RD_LOSS_NO'
ORDER BY production_month

-- Batch (multiple wells)
SELECT propnum, production_month, oil, gas, water, boe, actual_or_forecast
FROM eds.production.tbl_monthly_production_plus_forecast
WHERE propnum IN (:propnums)
  AND scenario = 'RD_LOSS_NO'
ORDER BY propnum, production_month
```

### Modified: `backend/main.py` — New Endpoints

```
GET /api/wells/:id/production?source=stitched&start=...&end=...&scenario=RD_LOSS_NO
    → Monthly production records for a single well

POST /api/wells/batch/production
    Body: { wellIds: string[], source?: string, scenario?: string }
    → { [wellId]: ProductionRecord[] }

GET /api/wells/:id/production/summary
    → { peakOil, peakGas, cumOil, cumGas, latestMonth, monthsProducing }
```

---

## Frontend Changes

### New Types in `src/types.ts`

```typescript
export interface ProductionRecord {
  productionMonth: string;    // ISO date (YYYY-MM-01)
  oil: number;                // bbl
  gas: number;                // mcf
  water: number;              // bbl
  boe: number;
  daysOn: number;
  monthsOn: number;
  cumOil: number;
  cumGas: number;
  actualOrForecast: 'Procount Actuals' | 'Aries Reservoir Forecast' | string;
  scenario?: string;
  qualifier?: string;
}

export interface ProductionSummary {
  peakOil: number;
  peakGas: number;
  cumOil: number;
  cumGas: number;
  latestMonth: string;
  monthsProducing: number;
}
```

### New: `src/services/productionService.ts`

```typescript
export async function getWellProduction(wellId: string, opts?: ProductionQueryOpts): Promise<ProductionRecord[]>
export async function getBatchProduction(wellIds: string[], opts?: ProductionQueryOpts): Promise<Record<string, ProductionRecord[]>>
export async function getProductionSummary(wellId: string): Promise<ProductionSummary>
```

### New: `src/hooks/useProduction.ts`

```typescript
export function useWellProduction(wellId: string, opts?: ProductionQueryOpts)
export function useBatchProduction(wellIds: string[], opts?: ProductionQueryOpts)
export function useProductionSummary(wellId: string)
```

---

## Column Mapping

| Databricks Column | TypeScript Field |
|-------------------|-----------------|
| `production_month` | `productionMonth` |
| `oil` | `oil` |
| `gas` | `gas` |
| `water` | `water` |
| `boe` | `boe` |
| `days_on` | `daysOn` |
| `months_on` | `monthsOn` |
| `cum_oil` | `cumOil` |
| `cum_gas` | `cumGas` |
| `actual_or_forecast` | `actualOrForecast` |
| `scenario` | `scenario` |
| `qualifier` | `qualifier` |

---

## Performance Considerations

- **Always filter by propnum + scenario** — the stitched table is 719M rows
- **Batch endpoint**: Cap at 200 wells per request; execute as single query with `IN (...)` clause
- **Date range**: Default to last 36 months for actuals, full forecast horizon for forecasts
- **Caching**: Production data for PDP wells changes monthly — cache with 1-hour TTL on frontend

---

## Acceptance Criteria

1. `GET /api/wells/{propnum}/production` returns chronological monthly records with actuals + forecast
2. `actualOrForecast` field correctly distinguishes historical from projected data
3. Batch endpoint returns data for multiple wells in a single request
4. Production summary returns peak/cum/latest stats
5. Frontend hooks load data and can be consumed by chart components
