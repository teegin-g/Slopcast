# Spec 03: Economic Parameters Service

**Status**: Not started
**Dependencies**: Spec 01 (DB connection layer, well IDs)
**Blocks**: None

---

## Goal

Serve real economic assumptions (type curves, CAPEX profiles, OPEX, ownership, price decks) from Databricks so users can assign them to well groups instead of only using hardcoded defaults.

---

## User Decisions

- **Decline params**: Parse Aries parameters into Slopcast engine inputs — retain our own economics engine, do not use Aries calculations directly
- **Default scenario**: `RD_LOSS_NO` is the default qualifier for decline parameters

---

## Databricks Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `eds.resource_dev.vw_rdtc_active_typecurves` | 1.3K | Active type curves — EUR, costs, ROR by reservoir domain |
| `eds.resource_dev.tbl_well_qualifier_prod_econ_parameters` | 279K | Parsed Arps decline params — qi, b, Di, Df per segment |
| `eds.resource_dev.vw_evergreen_well_cost_profiles` | 1.1K | AFE cost breakdown by asset team / cost profile |
| `eds.resource_dev.vw_evergreen_well_cost_profile_unpivot` | 10K | Same costs in (profile, activity, cost) format |
| `epw.aries_evergreen.ac_property` | 31K | Per-well LOE, opc_oil, opc_gas, wi, nri fields |
| `epw.aries_evergreen.clr_alternate_info` | — | Alternate interest scenarios |
| `epw.aries_evergreen.ar_sidefile` | — | Named price decks (CORP_PRICE, 5YR_STRIP_WTI, etc.) |
| `epw.aries_evergreen.arlookup` | — | Differentials by reservoir domain, tax rates by state |

---

## Backend Changes

### New: `backend/economics_params_service.py`

**Type Curves**:
```python
def list_type_curves(asset_team=None, formation=None, reservoir_domain=None) -> list[dict]:
    """Query vw_rdtc_active_typecurves, return list shaped for frontend."""
    # Key fields: prod_typecurve, reservoir_domain, formation, lateral_length,
    #   eur_oil_mbo, eur_gas_mmcf, eur_mboe, tot_cwc, tot_pv_10, ror, cost_profile
```

**Decline Parameter Parsing** (critical mapping):
```python
def get_well_decline_params(propnum: str, qualifier: str = 'RD_LOSS_NO') -> dict:
    """Parse tbl_well_qualifier_prod_econ_parameters into TypeCurveParams format.

    Mapping:
      keyword='OIL', segment_type='Hyp' → primary segment
        initial_value → qi
        hyp_b → b
        hyp_di → di (annual %)
        hyp_df → terminalDecline (annual %)

      keyword='OIL', segment_type='Exp' → exponential tail segment
        initial_value → qi (or inherit from prior segment end rate)

      keyword='GAS' → derive gorMcfPerBbl from gas/oil ratio

    Returns: { qi, b, di, terminalDecline, gorMcfPerBbl, segments[] }
    """
```

**Cost Profiles**:
```python
def list_cost_profiles(asset_team=None) -> list[dict]:
    """Query vw_evergreen_well_cost_profiles.

    Mapping to CapexAssumptions.items:
      drill → DRILLING
      stim → COMPLETION
      facility + site → FACILITIES
      tubing + art_lift → EQUIPMENT
      spud + drillout + post_prod → OTHER
    """
```

**OPEX**:
```python
def get_well_opex(propnum: str) -> dict:
    """Query ac_property for LOE fields.

    Mapping to OpexAssumptions:
      loe → fixedPerWellPerMonth
      opc_oil → variableOilPerBbl
      opc_gas → variableGasPerMcf
    """
```

**Ownership**:
```python
def get_well_ownership(propnum: str) -> dict:
    """Query ac_property + clr_alternate_info.

    Mapping to OwnershipAssumptions:
      wi → baseCostInterest (or alt_clr_wi if cp_flag_y_n='Y')
      nri_bpo_oil → baseNri (or alt_clr_nri)
      BPO/APO terms → JvAgreement pre/post payout
    """
```

**Price Decks**:
```python
def list_price_decks() -> list[dict]:
    """Query ar_sidefile for distinct named price scenarios."""

def get_price_deck(name: str) -> dict:
    """Get full price deck time series."""
```

### Modified: `backend/main.py` — New Endpoints

```
GET  /api/typecurves?asset_team=...&formation=...&reservoir_domain=...
     → List of type curves

GET  /api/wells/:propnum/decline-params?qualifier=RD_LOSS_NO
     → Parsed Arps params as TypeCurveParams

GET  /api/costprofiles?asset_team=...
     → List of cost profiles mapped to CapexAssumptions

GET  /api/wells/:propnum/opex
     → OpexAssumptions for a well

GET  /api/wells/:propnum/ownership
     → OwnershipAssumptions for a well

GET  /api/pricedecks
     → List of available price deck names

GET  /api/pricedecks/:name
     → Full price deck time series
```

---

## Frontend Changes

### New: `src/services/economicsParamsService.ts`

```typescript
export async function listTypeCurves(filters?: TypeCurveFilters): Promise<TypeCurveOption[]>
export async function getWellDeclineParams(propnum: string, qualifier?: string): Promise<TypeCurveParams>
export async function listCostProfiles(assetTeam?: string): Promise<CostProfileOption[]>
export async function getWellOpex(propnum: string): Promise<OpexAssumptions>
export async function getWellOwnership(propnum: string): Promise<OwnershipAssumptions>
export async function listPriceDecks(): Promise<PriceDeckOption[]>
export async function getPriceDeck(name: string): Promise<PriceDeckTimeSeries>
```

### New Types in `src/types.ts`

```typescript
export interface TypeCurveOption {
  id: string;
  prodTypeCurve: string;
  reservoirDomain: string;
  formation: string;
  lateralLength: number;
  eurOilMbo: number;
  eurGasMmcf: number;
  eurMboe: number;
  totalWellCost: number;
  pv10: number;
  ror: number;
  costProfile: string;
  // Derived TypeCurveParams
  params: TypeCurveParams;
}

export interface CostProfileOption {
  id: string;
  assetTeam: string;
  costProfile: string;
  totalWellCost: number;
  // Mapped to CapexAssumptions
  capex: CapexAssumptions;
}

export interface PriceDeckOption {
  name: string;
  description?: string;
}

export interface PriceDeckTimeSeries {
  name: string;
  entries: { date: string; oilPrice: number; gasPrice: number }[];
}
```

### New: `src/hooks/useEconomicsParams.ts`

```typescript
export function useTypeCurves(filters?: TypeCurveFilters)
export function useWellDeclineParams(propnum: string)
export function useCostProfiles(assetTeam?: string)
export function useWellOpex(propnum: string)
export function useWellOwnership(propnum: string)
export function usePriceDecks()
export function usePriceDeck(name: string)
```

---

## Arps Parameter Parsing (Detail)

The `tbl_well_qualifier_prod_econ_parameters` table stores decline parameters as individual rows:

```
propnum | qualifier   | keyword | segment_type | initial_value | hyp_b | hyp_di | hyp_df | final_value | duration_mos
ABC123  | RD_LOSS_NO  | OIL     | Hyp          | 850           | 1.2   | 65     | 8      | NULL        | 60
ABC123  | RD_LOSS_NO  | OIL     | Exp          | NULL          | 0     | 8      | 8      | 5           | NULL
ABC123  | RD_LOSS_NO  | GAS     | Hyp          | 1200          | 1.1   | 55     | 6      | NULL        | 48
```

**Parsing logic**:
1. Filter rows by `propnum` + `qualifier` (default `RD_LOSS_NO`)
2. Group by `keyword` (OIL, GAS, WTR)
3. For OIL keyword, map segments ordered by appearance:
   - First `Hyp` segment → primary: `{ qi: initial_value, b: hyp_b, di: hyp_di, terminalDecline: hyp_df }`
   - Subsequent segments → additional `ForecastSegment[]` entries
4. Derive `gorMcfPerBbl` from GAS `initial_value` / OIL `initial_value` (first segments)
5. Map `segment_type` to `ForecastSegment.method`: Hyp→arps, Exp→arps(b=0), Lin→linear

---

## Performance Considerations

- **Type curves (1.3K rows)** and **cost profiles (1.1K rows)**: Small enough to cache entirely on the frontend (stale-while-revalidate, 10-min TTL)
- **Decline params**: Per-well query — always filter by propnum + qualifier
- **Price decks**: Small dataset — cache client-side

---

## Acceptance Criteria

1. `/api/typecurves` returns list with `params` field shaped as `TypeCurveParams`
2. `/api/wells/{propnum}/decline-params` correctly parses multi-segment Arps into `TypeCurveParams` with `segments[]`
3. `/api/costprofiles` returns list with `capex` field shaped as `CapexAssumptions`
4. Arps parsing handles Hyp, Exp, and Lin segment types
5. GOR is correctly derived from oil/gas initial values
6. Selecting a type curve in the UI populates the well group's `typeCurve` field with real data
7. Selecting a cost profile populates the well group's `capex` field
