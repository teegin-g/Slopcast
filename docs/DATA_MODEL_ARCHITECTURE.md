# Slopcast Data Model & Routing Architecture

## Context

This document fleshes out the data model, spatial layers, and routing for Slopcast's transition from mock data to live Databricks-backed data. The goal is to define how map layers, well data, production, and economics flow from Databricks through the app — and how users interact with that data to build DSUs, assign assumptions, and run economics.

---

## 1. Spatial Layers (Map)

### 1.1 Wellbore Sticks

Wells rendered as lateral sticks on the map using surface-hole (SH) and bottom-hole (BH) coordinates.

| Layer | Source Table | Key Columns | Filter |
|-------|-------------|-------------|--------|
| **Developed (PDP)** | `epw.egis.gis__well_master` (1.6M rows) | `sh_latitude_nad27`, `sh_longitude_nad27`, `bh_latitude_nad27`, `bh_longitude_nad27`, `shape_wkt` | `well_status = 'PRODUCING'` or similar |
| **Undeveloped (Operated)** | `epw.egis.gis__well_future` (7.5K rows) | Same coordinate columns + `shape_wkt` | `op_nonop = 'OP'` |
| **Undeveloped (Non-Op)** | `epw.egis.gis__well_future` | Same | `op_nonop = 'NONOP'` |
| **Generated Sticks** | User-created | Computed from DSU geometry + wells/section assumption + mileage | User-defined |

**Rendering rules:**
- PDP/producing: Bold stroke, colored by operator (or single accent color)
- Undeveloped: Lighter/translucent stroke, same color logic but ~40% opacity
- Formation filter controls which sticks are visible (e.g. only "MIDDLE BAKKEN" wells)

**Coordinate note:** eGIS data uses NAD27 datum. All SH/BH coords are `*_nad27`. The `shape_wkt` column contains full wellbore geometry as WKT for rendering sticks.

### 1.2 Land Grid / Lease Layer

| Layer | Source Table | Rows | Key Columns |
|-------|-------------|------|-------------|
| **Company Leases/Units** | `epw.egis.gis__units` | 146K | `unit_id`, `unit_name`, `formation`, `operator`, `op_nonop_noint`, `density`, `total_wells`, `dev_wells`, `undev_wells`, `nri`, `working_interest`, `gross_eur_oil_mmbo`, `shape_wkt` |
| **Generic Sections (TRS)** | `epw.egis.gis__lg_section` | View | `sec`, `township`, `rng`, `mer`, `state`, `shape_wkt` |
| **Texas Abstracts** | `epw.egis.gis__lg_tx_abstract` | View | `absna`, `absno`, `county`, `district`, `survna`, `blockna`, `shape_wkt` |

**Layer priority:**
1. Company lease/unit shapes render on top (more accurate boundaries)
2. For sections NOT covered by lease layer, fall back to generic TRS grid or TX abstract grid
3. User can toggle between layers

### 1.3 Reservoir Coverage

| Layer | Source Table | Key Columns |
|-------|-------------|-------------|
| **Reservoir Domains** | `epw.egis.gis__reservoir_domains` | `asset`, `formation`, `development_group`, `engineer`, `reservoir_domain`, `region`, `phase_window`, `shape_wkt` |

Used for: type curve assignment, cost profile defaults, LOE curves. Reservoir domains are the geographic grouping that drives most economic assumptions.

### 1.4 Future Layers (Toggle Options)

- **Operator map**: Color units/sections by operator from `gis__units.operator`
- **Reservoir map**: Color by `reservoir_domain` from `gis__reservoir_domains`
- **Spacing map**: Color by well density from `gis__units.density` or Enverus spacing data (`epw.enverus.spacing_summaryspacing`)

---

## 2. Well Header Data

The "spine" of the app. Well header data powers filtering, drives which sticks render, and determines what production/economic data to pull.

### 2.1 Primary Well Header

| Well Category | Source Table | Rows | Join Key |
|---------------|-------------|------|----------|
| **All horizontal wells (CLR areas)** | `eds.well.tbl_well_summary` | 1.67M | `api_14` (unique), `propnum` (~55% coverage) |
| **All L48 wells (industry)** | `eds.well.tbl_well_summary_all` | 4.6M | `api_14` |
| **CLR-interest (Aries master)** | `epw.aries_evergreen.ac_property` | 31K | `propnum` (unique) |

**Recommended approach:** Use `eds.well.tbl_well_summary` as the primary well header source — it has the richest pre-joined data (162 columns). Supplement with `ac_property` for CLR-interest wells that need Aries-specific fields (cost_profile, reservoir_domain, LOE, engineer, etc.).

### 2.2 Key Well Header Fields to Surface

| Category | Fields | Source |
|----------|--------|--------|
| **Identity** | `api_14`, `propnum`, `well_name`, `unit_id`, `unit_name` | tbl_well_summary |
| **Location** | `state`, `county`, `basin`, `formation`, `zone`, `district`, `asset_team`, `project` | tbl_well_summary |
| **Dates** | `permit_date`, `spud_date`, `completion_date`, `first_prod_date`, `rig_release_date` | tbl_well_summary |
| **Projected dates** | `proj_spud_date`, `proj_stim_date`, `proj_big_rig_start`, `proj_rig_release` | ac_property + clr_dso_info |
| **Well design** | `lateral_length`, `total_depth`, `true_vertical_depth`, `stage_total`, `proppant_total`, `fluid_total` | tbl_well_summary |
| **Status** | `well_status`, `operated_class` (OP/NONOP/NOINT), `wellbore_direction` | tbl_well_summary |
| **Ownership** | `wi`, `nri` | tbl_well_summary (or ac_property for `nri_bpo_oil`, `nri_bpo_gas`) |
| **Performance** | `eur_boe`, `eur_oil_bbl`, `eur_gas_mcf`, `peak_boe`, `cum_oil_to_date`, `cum_gas_to_date` | tbl_well_summary |
| **Operator** | `operator`, `operator_short`, `operator_ticker` | tbl_well_summary |
| **Type Curve** | `prod_typecurve`, `res_domain_typecurve`, `reservoir_domain`, `cost_profile` | ac_property |
| **Spacing** | `env_spacing_status`, `env_bounded_status_same_zone_current`, `env_dist_to_neighbor_same_zone_hz` | tbl_well_summary |

### 2.3 Undeveloped Well Sources

| Category | Source | Notes |
|----------|--------|-------|
| **Operated undev** | `epw.aries_evergreen.ac_property` WHERE rsv_cat NOT IN ('PDP') | 31K total props, subset are undev |
| **Operated undev (if not in Aries)** | `epw.egis.gis__well_future` | 7.5K future wells with SH/BH coords |
| **Non-op undev** | No reliable external source | User generates sticks from DSU geometry + wells/section + mileage assumptions |

---

## 3. Production Data

### 3.1 Actual Production (PDP)

| Granularity | Source Table | Rows | Key Columns |
|-------------|-------------|------|-------------|
| **Monthly (primary)** | `eds.production.tbl_monthly_production` | 189M | `api_14`, `propnum`, `production_month`, `oil`, `gas`, `water`, `boe`, `days_on`, `months_on`, `cum_oil`, `cum_gas` |
| **Monthly (all sources)** | `eds.production.tbl_monthly_production_all` | 477M | Same + `gross_oil`, `net_oil`, `ngl`, `condensate` |
| **Daily** | `eds.production.tbl_daily_production_actuals` | 62M | `api_14`, `propnum`, `production_date`, `oil_actual`, `gas_actual`, `water_actual` |
| **Aries historical** | `epw.aries_evergreen.ac_product` | Per-well | `propnum`, `p_date`, `oil`, `gas`, `water`, `days_on` |

**Recommended:** Use `tbl_monthly_production` for standard production charts. Use `tbl_monthly_production_all` when you need gross/net breakdowns.

### 3.2 Forecast Production

| Category | Source Table | Rows | Notes |
|----------|-------------|------|-------|
| **PDP forecasts** | `eds.resource_dev.tbl_pdp_daily_forecasts` | 39M | Daily oil/gas/water/boe forecasts for 10.8K producing wells |
| **Undev forecasts** | `eds.resource_dev.tbl_undev_daily_forecasts` | 26M | Daily forecasts for 7K future wells |
| **Combined actuals + forecast** | `eds.production.tbl_monthly_production_plus_forecast` | 719M | `actual_or_forecast` column distinguishes; includes Novi forecasts for non-op |
| **All scenarios (master)** | `eds.resource_dev.tbl_aries_forecast_daily_volumes` | 521M | Every scenario/qualifier combo |

**For wells without forecasts (non-op undev):** Use reservoir domain type curves from `eds.resource_dev.vw_rdtc_active_typecurves` (1.3K active curves with EUR, costs, ROR).

### 3.3 Actuals + Forecast Stitching

Use `eds.production.tbl_monthly_production_plus_forecast` — it already stitches actuals and forecasts:
- `actual_or_forecast = 'Procount Actuals'` for historical
- `actual_or_forecast = 'Aries Reservoir Forecast'` for projected
- Includes `scenario` and `qualifier` columns for forecast versioning

---

## 4. Economic Parameters

### 4.1 Decline Curve (Arps) Parameters

| Source | Table | Rows | Key Fields |
|--------|-------|------|------------|
| **Parsed Aries params (primary)** | `eds.resource_dev.tbl_well_qualifier_prod_econ_parameters` | 279K | `propnum`, `qualifier`, `keyword` (OIL/GAS/WTR), `segment_type` (Hyp/Exp/Lin), `initial_value` (qi), `hyp_b` (b-factor), `hyp_di` (Di%), `hyp_df` (Df%), `final_value`, `duration_mos` |
| **Raw Aries expressions** | `epw.aries_evergreen.ac_economic` | 3.4M | `propnum`, `qualifier`, `keyword`, `section`, `expression` — source of truth but requires parsing |
| **Non-op forecasts (Novi)** | `eds.resource_dev.tbl_novi_forecast_aries_format` | 389K | Novi ML-generated forecasts in Aries format |
| **Enverus economics** | `epw.enverus.core_economics` | 4M | `eurwh_mboe`, `totalwellcost_usdmm`, NPV, breakeven — third-party estimates |

**Mapping to app's `TypeCurveParams`:**
```
qi          = initial_value (from keyword='OIL', segment_type='Hyp', first segment)
b           = hyp_b
di          = hyp_di (annual %)
terminalDecline = hyp_df (annual %)
gorMcfPerBbl    = Derived from GAS/OIL ratio stream or separate lookup
```

**Qualifier priority (which forecast to use):** Defined in `eds.resource_dev.tbl_evergreen_scenario_prod_qualifiers`. Example for `RD_LOSS_NO`: DSO > CC_1Q26 > CC_4Q25 > CLR4Q25 > ... > DEFAULT.

### 4.2 Type Curves

| Source | Table | Rows | Key Fields |
|--------|-------|------|------------|
| **CLR active type curves** | `eds.resource_dev.vw_rdtc_active_typecurves` | 1.3K | `prod_typecurve`, `reservoir_domain`, `formation`, `lateral_length`, `eur_oil_mbo`, `eur_gas_mmcf`, `eur_mboe`, `tot_cwc` (total well cost), `tot_pv_10`, `ror`, `cost_profile` |
| **Enverus company curves** | `epw.enverus.core_companycurves` | 197K | Full Arps decline parameters per segment, D&C costs, EUR |

Type curves link to wells via `ac_property.prod_typecurve` or `ac_property.reservoir_domain`.

### 4.3 Capital Costs (CAPEX)

| Source | Table | Rows | Key Fields |
|--------|-------|------|------------|
| **Cost profiles (AFE breakdown)** | `eds.resource_dev.vw_evergreen_well_cost_profiles` | 1.1K | `asset_team`, `cost_profile`, `site`, `spud`, `drill`, `stim`, `facility`, `drillout`, `tubing`, `art_lift`, `post_prod`, `total_well_cost` |
| **Cost profiles (unpivoted)** | `eds.resource_dev.vw_evergreen_well_cost_profile_unpivot` | 10K | Same data in `(cost_profile, activity, cost)` format |
| **Aries lookup (source of truth)** | `epw.aries_evergreen.arlookup` WHERE name='CLR_COST_PROFILE' | Dynamic | Full cost profile lookup with template substitution |

**Mapping to app's `CapexAssumptions.items`:**
```
DRILLING    = drill
COMPLETION  = stim
FACILITIES  = facility + site
EQUIPMENT   = tubing + art_lift
OTHER       = spud + drillout + post_prod
```

Average total well cost: ~$11.35M (range $3.15M–$21.87M by asset team).

### 4.4 Operating Costs (OPEX)

| Source | Table | Key Fields |
|--------|-------|------------|
| **Per-well LOE** | `epw.aries_evergreen.ac_property` | `loe` ($/well/month), `opc_oil` ($/bbl), `opc_gas` ($/mcf), `opc_water` ($/bbl) |
| **LOE type curves by domain** | `epw.aries_evergreen.arlookup` WHERE name LIKE '%LOE_TC%' | Dynamic templates keyed by `rsv_domain_alias` |

**Mapping to app's `OpexAssumptions`:**
```
fixedPerWellPerMonth = ac_property.loe
variableOilPerBbl    = ac_property.opc_oil
variableGasPerMcf    = ac_property.opc_gas
```

### 4.5 Ownership / Interest

| Source | Table | Key Fields |
|--------|-------|------------|
| **Standard interests** | `epw.aries_evergreen.ac_property` | `wi`, `nri_bpo_oil`, `nri_bpo_gas`, `nri_apo_oil`, `nri_apo_gas`, `orri` |
| **Alternate interests** | `epw.aries_evergreen.clr_alternate_info` | `alt_clr_wi`, `alt_clr_nri`, `alt_nri_bpo`, `alt_nri_apo`, `alt_wi_bpo`, `alt_wi_apo`, `alt_wi_capex` |

**Mapping to app's `OwnershipAssumptions`:**
```
baseNri          = nri_bpo_oil (or alt_clr_nri if cp_flag_y_n = 'Y')
baseCostInterest = wi (or alt_clr_wi)
```

### 4.6 Pre-Calculated Economics (One-Line)

| Source | Table | Rows | Key Fields |
|--------|-------|------|------------|
| **Aries one-line** | `eds.resource_dev.view_ac_oneline_evergreen` | 573K | `propnum`, `scenario`, `g_tot_eqty_inv` (CAPEX), `gross_oil/gas`, `n_prod_rev`, `n_tot_opc`, `pw_bfit_net` (PV10), `e1` (BFIT ROR), `e3` (BFIT payout yrs), `m21` (EUR oil), `m22` (EUR gas), `m81` (EUR BOE) |
| **Aries monthly** | `epw.aries_evergreen.ac_monthly` | Per-well per-scenario per-month | Full monthly cash flow with revenues, costs, taxes, PV |

These provide "pre-baked" economics from Aries that can be displayed alongside Slopcast's own calculations for comparison/validation.

### 4.7 Pricing

| Source | Table | Notes |
|--------|-------|-------|
| **Price deck sidefiles** | `epw.aries_evergreen.ar_sidefile` | Named price decks: CORP_PRICE, CORP_BASE, CORP_LOW, CORP_HIGH, 5YR_STRIP_WTI, NAV_PRICE |
| **Differentials by area** | `epw.aries_evergreen.arlookup` WHERE name LIKE '%DIFF%' | GAS_DIFF_BASE, OIL_DIFF_BASE keyed by reservoir domain |
| **Tax rates by state** | `epw.aries_evergreen.arlookup` WHERE name IN ('SEV', 'ADVAL') | Severance and ad valorem tax rates |

---

## 5. Data Hierarchy & Routing

### 5.1 Geographic Hierarchy

```
Basin
  └── Reservoir Domain (from gis__reservoir_domains)
        └── Project (from ac_property.project)
              └── DSU (from gis__units or user-created)
                    └── Section/Abstract (from gis__lg_section / gis__lg_tx_abstract)
```

### 5.2 User Flow: Select -> Filter -> Populate

```
1. MAP: User lassos/selects wells on map
   ├── Filter by: formation, operator, status, operated_class
   └── Source: gis__well_master + gis__well_future (spatial query)

2. WELL HEADER: Selected wells populate the well header table
   ├── Source: tbl_well_summary JOIN ac_property
   └── User can further filter/sort in table

3. PRODUCTION: For selected wells, pull production data
   ├── PDP actuals: tbl_monthly_production (by api_14/propnum)
   ├── PDP forecast: tbl_pdp_daily_forecasts (by propnum)
   ├── Undev forecast: tbl_undev_daily_forecasts (by propnum)
   └── Combined: tbl_monthly_production_plus_forecast

4. ECONOMICS: For selected wells, pull or compute economics
   ├── Arps params: tbl_well_qualifier_prod_econ_parameters (by propnum)
   ├── Type curve: vw_rdtc_active_typecurves (by reservoir_domain)
   ├── Cost profile: vw_evergreen_well_cost_profiles (by cost_profile)
   ├── LOE: ac_property.loe + opc_* fields
   ├── Ownership: ac_property.wi/nri or clr_alternate_info
   └── Pre-calc: view_ac_oneline_evergreen (by propnum + scenario)
```

### 5.3 Data Mapping to Current App Types

| App Type | Databricks Source | Notes |
|----------|-------------------|-------|
| `Well` | `eds.well.tbl_well_summary` | Extend with more fields (status expanded, dates, EUR, spacing) |
| `WellGroup` | User-created, backed by selection | Groups reference wells by `api_14` or `propnum` |
| `TypeCurveParams` | `tbl_well_qualifier_prod_econ_parameters` or `vw_rdtc_active_typecurves` | Parse Arps params into qi/b/di/df |
| `CapexAssumptions` | `vw_evergreen_well_cost_profiles` | Map cost phases to CapexItem categories |
| `OpexAssumptions` | `ac_property.loe` + `opc_*` | Single segment initially, multi-segment from LOE type curves |
| `OwnershipAssumptions` | `ac_property.wi/nri_*` + `clr_alternate_info` | BPO/APO maps to JV agreement pre/post payout |
| `CommodityPricingAssumptions` | `ar_sidefile` (price decks) + `arlookup` (differentials) | Named price scenarios |
| `DealMetrics` | Computed or from `view_ac_oneline_evergreen` | Can compare Slopcast calc vs Aries calc |
| `MonthlyCashFlow` | Computed or from `ac_monthly` | Can overlay Aries monthly on Slopcast calc |

---

## 6. DSU Creation Feature

### 6.1 Workflow

1. **Enter DSU mode**: User toggles a special map interaction mode
2. **Select sections**: User clicks contiguous sections/abstracts from `gis__lg_section` or `gis__lg_tx_abstract`
   - Validate contiguity (sections must share edges)
   - Enforce max 6-mile linear distance
3. **Preview tooltip**: Show DSU length (sum of section widths), total acreage (sum of `shape_wkt` areas)
4. **Save DSU**: User names the DSU and saves it to a DSU shape layer
   - Store: geometry (union of selected section geometries), name, formation target, user metadata
5. **Assign assumptions**: In later views, user paints/lassos DSUs and assigns:
   - Density (wells per section)
   - Type curve (from `vw_rdtc_active_typecurves`)
   - Cost profile (from `vw_evergreen_well_cost_profiles`)
   - Interest assumptions

### 6.2 DSU Data Model (New)

```typescript
interface DSU {
  id: string;
  name: string;
  sectionIds: string[];      // References to lg_section or lg_tx_abstract
  geometry: GeoJSON;          // Union of section geometries
  totalAcreage: number;
  linearLengthMiles: number;
  formation: string;          // Target formation
  wellsPerSection: number;    // Density assumption
  typeCurveId: string | null; // Link to reservoir domain type curve
  costProfileId: string | null;
  ownershipProfile: OwnershipAssumptions | null;
  reservoirDomain: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 6.3 Generated Wells from DSU

When a DSU has density/mileage assumptions, generate synthetic undeveloped sticks:
- Stick count = `wellsPerSection * sectionCount`
- Sticks evenly distributed within DSU geometry
- Lateral direction follows formation dip or user preference
- Each generated well inherits DSU's type curve, cost profile, and ownership

---

## 7. Layer Creation & Template System

### 7.1 Layer Hierarchy

```
Section/Abstract (base landgrid)
  └── DSU (user-grouped sections)
        └── Reservoir Domain (geologic grouping)
              └── Project (organizational grouping)
                    └── Basin (top-level)
```

### 7.2 Template Application

Users can "paint" templates onto geographic layers at any level:

| Template Type | Source | Applied To |
|---------------|--------|-----------|
| Type Curve | `vw_rdtc_active_typecurves` | DSU, Reservoir Domain |
| Cost Profile | `vw_evergreen_well_cost_profiles` | DSU, Reservoir Domain, Asset Team |
| Interest/Ownership | `ac_property` + `clr_alternate_info` | Individual wells or DSU |
| LOE Profile | `arlookup` (LOE type curves) | Reservoir Domain |
| Price Deck | `ar_sidefile` | Project-level or global |
| Differentials | `arlookup` (DIFF tables) | Reservoir Domain |

### 7.3 Paint/Lasso Tool

1. User selects a template (e.g., "SCMR BC OIL type curve")
2. User lassos or clicks DSUs/reservoir domains on map
3. All wells within selected geometry inherit the template
4. Overrides cascade: Well-level > DSU-level > Domain-level > Default

---

## 8. API / Backend Routing

### 8.1 Proposed API Endpoints

```
GET  /api/wells?bbox=...&formation=...&status=...
     -> Spatial query against gis__well_master + gis__well_future

GET  /api/wells/:id/header
     -> tbl_well_summary LEFT JOIN ac_property

GET  /api/wells/:id/production?type=monthly|daily&period=...
     -> tbl_monthly_production or tbl_daily_production_actuals

GET  /api/wells/:id/forecast?scenario=...
     -> tbl_pdp_daily_forecasts or tbl_undev_daily_forecasts

GET  /api/wells/:id/economics?scenario=...
     -> tbl_well_qualifier_prod_econ_parameters + view_ac_oneline_evergreen

GET  /api/typecurves?asset_team=...&formation=...
     -> vw_rdtc_active_typecurves

GET  /api/costprofiles?asset_team=...
     -> vw_evergreen_well_cost_profiles

GET  /api/layers/sections?bbox=...
     -> gis__lg_section + gis__lg_tx_abstract

GET  /api/layers/units?bbox=...
     -> gis__units

GET  /api/layers/reservoir-domains?bbox=...
     -> gis__reservoir_domains

GET  /api/pricedecks
     -> ar_sidefile (distinct filenames)

POST /api/dsus
     -> Create DSU from selected sections

GET  /api/dsus/:id
     -> DSU with computed geometry + acreage
```

### 8.2 Performance Considerations

- **Spatial queries**: eGIS tables have `shape_wkt` — need PostGIS-style spatial filtering. Consider pre-computing bounding boxes or using Databricks H3 indexes.
- **Large tables**: `tbl_monthly_production_all` (477M rows), `tbl_aries_forecast_daily_volumes` (521M rows) — always filter by `propnum`/`api_14` + date range + `operated_class`
- **Caching**: Type curves (1.3K rows), cost profiles (1.1K rows), price decks — small enough to cache client-side
- **Materialized views**: Consider creating focused views for the app that pre-join well header + ownership + latest economics

---

## 9. Open Questions

See follow-up questions below — these need clarification before implementation.
