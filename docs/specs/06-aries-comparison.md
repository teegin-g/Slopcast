# Spec 06: Pre-Calculated Economics Comparison (Aries One-Line)

**Status**: Not started
**Dependencies**: Spec 01 (DB connection layer, well IDs)
**Blocks**: None

---

## Goal

Display pre-calculated Aries economics alongside Slopcast's own calculations, enabling users to validate Slopcast results against the industry-standard Aries system.

---

## User Decisions

- Retain Slopcast's own economics engine — Aries data is for **comparison/validation only**
- Default scenario: `RD_LOSS_NO`

---

## Databricks Tables


| Table                                        | Rows     | Purpose                                                      |
| -------------------------------------------- | -------- | ------------------------------------------------------------ |
| `eds.resource_dev.view_ac_oneline_evergreen` | 573K     | Pre-calculated one-line economics per well per scenario      |
| `epw.aries_evergreen.ac_monthly`             | Per-well | Full monthly cash flows from Aries (for detailed comparison) |


### Key Columns: `view_ac_oneline_evergreen`


| Column           | Description                      | App Mapping             |
| ---------------- | -------------------------------- | ----------------------- |
| `propnum`        | Well identifier                  | Join key                |
| `scenario`       | Scenario name (e.g., RD_LOSS_NO) | Filter                  |
| `g_tot_eqty_inv` | Total equity investment (CAPEX)  | `totalEquityInvestment` |
| `gross_oil`      | Gross oil production             | `grossOil`              |
| `gross_gas`      | Gross gas production             | `grossGas`              |
| `n_prod_rev`     | Net production revenue           | `netProdRevenue`        |
| `n_tot_opc`      | Net total operating costs        | `netTotalOpex`          |
| `pw_bfit_net`    | PV10 before federal income tax   | `pv10Bfit`              |
| `e1`             | BFIT rate of return              | `bfitRor`               |
| `e3`             | BFIT payout (years)              | `bfitPayoutYrs`         |
| `m21`            | EUR oil (MBO)                    | `eurOilMbo`             |
| `m22`            | EUR gas (MMCF)                   | `eurGasMmcf`            |
| `m81`            | EUR BOE (MBOE)                   | `eurMboe`               |


---

## Backend Changes

### New: `backend/aries_service.py`

```python
def get_aries_oneline(propnum: str, scenario: str = 'RD_LOSS_NO') -> dict | None:
    """Query view_ac_oneline_evergreen for a single well.
    Returns mapped fields or None if not found.
    """

def get_batch_aries_oneline(propnums: list[str], scenario: str = 'RD_LOSS_NO') -> dict[str, dict]:
    """Batch query for multiple wells. Returns dict keyed by propnum."""

def list_scenarios() -> list[str]:
    """Return distinct scenario names from view_ac_oneline_evergreen."""
```

### Modified: `backend/main.py` — New Endpoints

```
GET  /api/wells/:propnum/aries-economics?scenario=RD_LOSS_NO
     → Aries one-line economics for a single well

POST /api/wells/batch/aries-economics
     Body: { propnums: string[], scenario?: string }
     → { [propnum]: AriesOneLine }

GET  /api/aries/scenarios
     → List of available scenario names
```

---

## Frontend Changes

### New Type in `src/types.ts`

```typescript
export interface AriesOneLine {
  propnum: string;
  scenario: string;
  totalEquityInvestment: number;   // $ — total CAPEX
  grossOil: number;                // MBO
  grossGas: number;                // MMCF
  netProdRevenue: number;          // $
  netTotalOpex: number;            // $
  pv10Bfit: number;                // $ — NPV at 10% BFIT
  bfitRor: number;                 // % — rate of return BFIT
  bfitPayoutYrs: number;           // years
  eurOilMbo: number;               // MBO
  eurGasMmcf: number;              // MMCF
  eurMboe: number;                 // MBOE
}
```

### New: `src/services/ariesService.ts`

```typescript
export async function getAriesOneLine(propnum: string, scenario?: string): Promise<AriesOneLine | null>
export async function getBatchAriesOneLine(propnums: string[], scenario?: string): Promise<Record<string, AriesOneLine>>
export async function listAriesScenarios(): Promise<string[]>
```

### New: `src/hooks/useAriesComparison.ts`

```typescript
export function useAriesOneLine(propnum: string, scenario?: string)
export function useBatchAriesOneLine(propnums: string[], scenario?: string)
export function useAriesScenarios()
```

### New: `src/components/slopcast/AriesComparison.tsx`

Side-by-side comparison panel showing:

```
                     Slopcast        Aries           Delta
─────────────────────────────────────────────────────────────
Total CAPEX          $11.2M          $11.35M         +1.3%
EUR (MBOE)           1,245           1,280           +2.8%
NPV10                $8.7M           $8.9M           +2.3%
IRR / ROR            32.4%           31.8%           -0.6%
Payout               2.1 yrs         2.0 yrs         -4.8%
Net Revenue          $45.2M          $46.1M          +2.0%
Total OPEX           $12.8M          $13.1M          +2.3%
```

**Features**:

- Scenario selector dropdown (default: RD_LOSS_NO)
- Delta column shows absolute and percentage difference
- Color-code deltas: green if Slopcast is more conservative (lower NPV), red if more aggressive
- Works for individual wells and aggregated across a well group

### Integration Points

- Add "Aries Comparison" tab or panel to the Economics results view
- Only show when well has a `propnum` (Aries data requires propnum)
- Gracefully handle wells without Aries data (show "No Aries data available")

---

## Performance Considerations

- **One-line table (573K rows)**: Always filter by propnum + scenario
- **Batch endpoint**: Cap at 200 wells, single query with `IN (...)`
- **Scenario list**: Small — cache client-side for 10 min
- **Aries monthly (future)**: For detailed monthly comparison, add later as needed

---

## Acceptance Criteria

1. `/api/wells/{propnum}/aries-economics` returns Aries one-line data for RD_LOSS_NO scenario
2. Comparison panel shows Slopcast vs Aries metrics side-by-side
3. Delta column correctly computes absolute and percentage differences
4. Scenario dropdown switches between available Aries scenarios
5. Wells without propnum or without Aries data show appropriate empty state
6. Batch endpoint works for loading Aries data across a well group

