# EDS Resource Development Tables

## Schema Overview

| Attribute | Value |
|-----------|-------|
| **Catalog.Schema** | `eds.resource_dev` |
| **Purpose** | Production forecasting, decline curves, type curves, Aries economic integration |
| **Primary Use** | Resource development planning, reserves booking, economic analysis |

## Table Summary

| Table | Rows | Description |
|-------|------|-------------|
| `tbl_aries_forecast_daily_volumes` | 521M | Master daily forecast table with all scenarios |
| `tbl_pdp_daily_forecasts` | 39M | PDP (Proved Developed Producing) daily forecasts |
| `tbl_undev_daily_forecasts` | 26M | Undeveloped well daily forecasts |
| `tbl_approval_daily_volumes` | 25M | Approved well daily forecasts |
| `tbl_evergreen_monthly_primary` | 9.5M | Monthly Aries output with row rankings |
| `tbl_aries_production_lines_parsed` | 266K | Parsed decline curve expressions |
| `tbl_well_qualifier_prod_econ_parameters` | 266K | Decline curve parameters (b, Di, Df) |
| `tbl_novi_forecast_aries_format` | 394K | Novi Labs ML forecasts in Aries format |
| `tbl_evergreen_well_scenario_qualifier` | 3M | Well-scenario-qualifier mappings |
| `tbl_evergreen_scenario_prod_qualifiers` | 1.4K | Scenario configuration definitions |
| `vw_rdtc_active_typecurves` | 1.3K | Active type curves for resource development |
| `vw_evergreen_well_cost_profiles` | 1.1K | Well cost profiles by asset team |
| `view_ac_monthly_evergreen` | - | Aries monthly economic view |
| `view_ac_oneline_evergreen` | - | Aries one-line summary view |

---

## Core Forecasting Tables

### tbl_aries_forecast_daily_volumes

**Purpose:** Master table containing daily production forecasts for all wells across all scenarios and qualifiers.

| Column | Type | Description |
|--------|------|-------------|
| `db_source` | string | Source database: AriesEvergreen or AriesRDTC |
| `propnum` | string | Aries property number (10-char alphanumeric) |
| `well_name` | string | Continental well name |
| `op_nonop` | string | Operating status: OP, NONOP, NOINT |
| `asset_team` | string | Asset team: WILLISTON, ANADARKO, PERMIAN, POWDER RIVER |
| `district` | string | District within asset team |
| `scenario` | string | Economic scenario name |
| `qualifier` | string | Production qualifier name |
| `production_date` | date | Calendar date of forecast |
| `days` | int | Normalized production day (1 = first day on) |
| `daily_oil_prod` | decimal(10,2) | Daily oil production (BBL) |
| `daily_gas_prod` | decimal(10,2) | Daily gas production (MCF) |
| `daily_wtr_prod` | decimal(10,2) | Daily water production (BBL) |
| `daily_boe_prod` | decimal(10,2) | Daily BOE (oil + gas/6) |

**Key Scenarios:**
| Scenario | Wells | Rows | Purpose |
|----------|-------|------|---------|
| RD_LOSS_NO | 20,379 | 74M | Resource development without loss wells |
| CLR4Q24 | 20,131 | 74M | Q4 2024 corporate run |
| CLR1Q26 | 18,457 | 67M | Q1 2026 corporate run |
| APPROVED | 6,861 | 25M | Sanctioned/approved wells |
| TYPE_CURVE | 2,051 | 7.5M | Type curve forecasts |

**Key Qualifiers:**
| Qualifier | Wells | Description |
|-----------|-------|-------------|
| CLR4Q24 | 11,969 | Q4 2024 production qualifier |
| CC_1Q26 | 7,938 | Q1 2026 corporate case |
| DEFAULT | 7,771 | Default/fallback qualifier |
| DSO | 7,519 | Drill spud order qualifier |
| APPROVED | 6,861 | Approved wells qualifier |
| TYPE_CURVE | 2,051 | Type curve qualifier |

---

### tbl_pdp_daily_forecasts

**Purpose:** Daily production forecasts for Proved Developed Producing (PDP) wells - currently producing wells with proven reserves.

| Column | Type | Description |
|--------|------|-------------|
| `propnum` | string | Aries property number |
| `well_name` | varchar(50) | Well name |
| `well_number` | varchar(100) | SAP Functional Location |
| `op_nonop` | varchar(5) | Operating status |
| `asset_team` | varchar(50) | Asset team |
| `production_date` | date | Calendar date |
| `days_on` | int | Days on production |
| `oil_forecast` | decimal(10,2) | Daily oil forecast (BBL) |
| `gas_forecast` | decimal(10,2) | Daily gas forecast (MCF) |
| `wtr_forecast` | decimal(10,2) | Daily water forecast (BBL) |
| `boe_forecast` | decimal(10,2) | Daily BOE forecast |

**Statistics:**
- **Wells:** 10,787 unique
- **Date Range:** 2023-12-01 to 2036-03-30
- Asset Distribution: WILLISTON (6,847), ANADARKO (2,292), POWDER RIVER (834), PERMIAN (773)

---

### tbl_undev_daily_forecasts

**Purpose:** Daily production forecasts for undeveloped wells - planned/future wells not yet drilled.

**Schema:** Same as tbl_pdp_daily_forecasts

**Statistics:**
- **Wells:** 7,017 unique
- **Date Range:** 2025-01-01 to 2059-12-31
- Asset Distribution: POWDER RIVER (2,358), WILLISTON (1,962), PERMIAN (1,701), ANADARKO (954)
- Primarily operated wells (OP: 6,174 vs NONOP: 843)

**Key Insight:** PDP and Undev tables are **mutually exclusive** - a well is either developed OR undeveloped.

---

### tbl_approval_daily_volumes

**Purpose:** Daily forecasts for wells that have passed through the formal approval process.

**Schema:** Similar to other forecast tables but uses `days_on` instead of `days`.

**Statistics:**
- **Wells:** 6,861 unique (matches APPROVED scenario exactly)
- Asset Distribution: WILLISTON (4,088), ANADARKO (1,786), PERMIAN (698), POWDER RIVER (268)

---

## Decline Curve Tables

### tbl_aries_production_lines_parsed

**Purpose:** Parsed Aries decline curve expressions broken into component parameters.

| Column | Type | Description |
|--------|------|-------------|
| `db_source` | string | Source Aries database |
| `propnum` | string | Property number |
| `well_name` | string | Well name |
| `major` | string | Primary phase: OIL or GAS |
| `qualifier` | string | Production qualifier |
| `seq` | int | Sequence number per qualifier |
| `expression` | string | Raw Aries expression |
| `phase_seq` | int | Sequence within keyword |
| `keyword` | string | Forecast type: OIL, GAS, WTR, GAS/OIL, etc. |
| `start` | date | Forecast start date |
| `e1` - `e7` | string | Parsed expression parameters |

**Keyword Distribution:**
| Keyword | Rows | Wells | Description |
|---------|------|-------|-------------|
| OIL | 93,609 | 19,724 | Oil production forecast |
| WTR | 86,255 | 19,578 | Water production forecast |
| GAS | 60,563 | 14,914 | Gas production forecast |
| GAS/OIL | 21,464 | 7,502 | Gas-oil ratio streams |
| MUL/OIL | 1,389 | 1,296 | Multiplier on oil |
| MUL/GAS | 1,327 | 1,236 | Multiplier on gas |

**Expression Format Examples:**
```
Hyperbolic:    "701.25 X B/D 6 EXP B/1.001 80.12"
               IP=701.25, b=1.001, Di=80.12%

Ramp-up:       "351 701.25 B/D 1 MOS SPD X"
               Initial=351, Peak=701.25, 1 month ramp

Exponential:   "X 0.001 B/D X YRS EXP 6"
               Terminal rate=0.001 B/D, 6% annual decline
```

---

### tbl_well_qualifier_prod_econ_parameters

**Purpose:** Structured decline curve parameters for each well/qualifier combination.

| Column | Type | Description |
|--------|------|-------------|
| `propnum` | string | Property number |
| `well_name` | string | Well name |
| `qualifier` | string | Production qualifier |
| `keyword` | string | Forecast type (OIL, GAS, WTR, etc.) |
| `segment_type` | string | Decline type: Lin, Hyp, Exp |
| `initial_value` | double | Initial production rate (IP) |
| `final_value` | double | Terminal rate |
| `hyp_b` | decimal | **b-factor** for hyperbolic decline |
| `hyp_di` | double | **Initial decline rate** (Di) |
| `hyp_df` | double | **Terminal decline rate** (Df) |
| `duration_mos` | int | Duration in months |
| `duration_date` | date | End date constraint |
| `volume_limit` | double | Cumulative volume limit |

**Segment Type Distribution:**
| Type | Count | Description |
|------|-------|-------------|
| Hyp | 110,697 | Hyperbolic decline |
| Exp | 105,015 | Exponential decline |
| Lin | 24,261 | Linear ramp |
| Ratio.LIN | 11,096 | Linear ratio stream |
| Ratio.LOG | 10,549 | Logarithmic ratio |

**Typical Decline Parameters (Hyperbolic):**
| Phase | Avg b | Avg Di | Avg Df | Avg IP |
|-------|-------|--------|--------|--------|
| OIL | 1.004 | 51.4% | 5.9% | 530 B/D |
| GAS | 1.167 | 48.6% | 5.9% | 3,565 M/D |
| WTR | 1.018 | 56.3% | 5.9% | 1,539 B/D |

---

## Type Curve Tables

### vw_rdtc_active_typecurves

**Purpose:** Active type curves used for resource development planning.

| Column | Type | Description |
|--------|------|-------------|
| `propnum` | varchar(12) | Type curve property number |
| `prod_typecurve` | varchar(50) | Type curve name (e.g., "MB S PONDEROSA 4MI") |
| `op_nonop` | varchar(5) | Always OP for type curves |
| `area` | varchar(15) | NORTH or SOUTH |
| `district` | varchar(50) | District (ND BAKKEN, etc.) |
| `asset_team` | varchar(50) | Asset team |
| `project` | varchar(50) | Project name |
| `reservoir_domain` | varchar(50) | Reservoir domain classification |
| `formation` | varchar(100) | Formation (MIDDLE BAKKEN, THREE FORKS 1) |
| `major` | varchar(3) | Primary phase (OIL) |
| `phase_window` | varchar(25) | Phase classification |
| `start_date` | date | Type curve effective date |
| `status` | varchar(30) | ACTIVE or inactive |
| `cost_profile` | varchar(255) | Associated cost profile |
| `lateral_length` | int | Type curve lateral length (ft) |
| `max_month_oil/gas/boe` | int | Peak month production |
| `cum_oil/gas/boe_12mo` | int | 12-month cumulative production |
| `eur_oil_mbo` | decimal(10,3) | EUR oil (MBO) |
| `eur_gas_mmcf` | decimal(10,3) | EUR gas (MMCF) |
| `eur_mboe` | decimal(10,3) | EUR BOE (MBOE) |
| `eur_per_ft_boe` | decimal(8,3) | EUR per lateral foot |
| `tot_cwc` | decimal(12,2) | Total completion well cost |
| `cwc_per_ll_ft` | decimal(6,2) | CWC per lateral foot |
| `tot_pv_10` | decimal(12,2) | PV10 value |
| `ror` | decimal(4,3) | Rate of return |
| `cos` | decimal(5,2) | Cost of supply ($/BOE) |

**Type Curve Examples:**
| Type Curve | Lateral | EUR BOE | 12mo BOE | CWC | PV10 | ROR |
|------------|---------|---------|----------|-----|------|-----|
| MB S PONDEROSA 4MI | 19,700 | 962 MBOE | 344 MBOE | $15.2M | $4.1M | 28% |
| MBO S ROCKET 3MI | 14,700 | 810 MBOE | 262 MBOE | $10.5M | $5.6M | 46% |
| TF S ROCKET 3MI | 14,700 | 717 MBOE | 220 MBOE | $10.6M | $2.3M | 23% |

---

## Aries Integration Views

### view_ac_monthly_evergreen

**Purpose:** Monthly time series of production and economics from Aries.

**Key Columns:**
| Column | Description |
|--------|-------------|
| `propnum`, `scenario` | Well and scenario identifiers |
| `outdate` | Month end date |
| `gross_oil`, `gross_gas`, `gross_boe` | Gross production volumes |
| `pri_oil`, `pri_gas` | Commodity prices |
| `n_oil_rev`, `n_gas_rev`, `n_prod_rev` | Net revenues |
| `n_tot_opc` | Net operating costs (LOE) |
| `n_tot_bfit` | Net before-tax cash flow |
| `pw_n_tot_bfit` | Present worth of monthly BFIT |
| `stx_oil_rate`, `stx_gas_rate` | Severance tax rates |

### view_ac_oneline_evergreen

**Purpose:** Single-row summary per well/scenario with lifetime economics.

**Key Columns:**
| Column | Description |
|--------|-------------|
| `g_ult_oil`, `g_ult_gas`, `g_ult_boe` | **EUR** - Estimated Ultimate Recovery |
| `n_prod_rev` | Total net production revenue |
| `n_tot_opc` | Total operating costs |
| `n_tot_bfit` | Total BFIT cash flow |
| `pw_bfit_net` | **PV10** - Present value at 10% |
| `bfit_pw_01` - `bfit_pw_15` | NPV at various discount rates |
| `bfit_ror` | Rate of return |
| `life_of_well` | Economic life (years) |
| `finding_costs_boe` | F&D costs per BOE |

---

## Cost Profile View

### vw_evergreen_well_cost_profiles

**Purpose:** Well cost breakdowns by development phase and asset team.

| Column | Type | Description |
|--------|------|-------------|
| `asset_team` | varchar(20) | Asset team |
| `cost_profile` | varchar(50) | Cost profile identifier |
| `site` | decimal | Site preparation ($K) |
| `spud` | decimal | Spud costs ($K) |
| `drill` | decimal | Drilling costs ($K) |
| `stim` | decimal | Stimulation costs ($K) |
| `facility` | decimal | Facility costs ($K) |
| `drillout` | decimal | Drillout costs ($K) |
| `tubing`, `art_lift`, `post_prod` | decimal | Additional costs ($K) |
| `total_well_cost` | decimal | Total well cost ($K) |

**Cost Summary by Asset Team:**
| Asset Team | Profiles | Avg Cost | Avg Drill | Avg Stim |
|------------|----------|----------|-----------|----------|
| ANADARKO | 357 | $12.3M | $2.8M | $3.7M |
| PERMIAN | 322 | $11.5M | $4.1M | $3.7M |
| POWDER RIVER | 186 | $10.9M | $4.0M | $3.5M |
| WILLISTON | 230 | $9.4M | $1.6M | $2.7M |

---

## Scenario Configuration

### tbl_evergreen_scenario_prod_qualifiers

**Purpose:** Defines which production qualifiers are used in each scenario, with priority ordering.

| Column | Type | Description |
|--------|------|-------------|
| `scenario` | string | Scenario name |
| `section` | bigint | Aries section (4 = Production) |
| `qualifier_order` | int | Priority order (1 = highest) |
| `qualifier` | string | Qualifier name |

**Example Configuration:**
```
RD_LOSS_NO:
  Section 4: [DSO, CC_1Q26, CC_4Q25, CLR4Q25, CLR3Q25, CLR2Q25, CLR1Q25, DEFAULT]

APPROVED:
  Section 4: [APPROVED, DEFAULT]

CLR1Q26:
  Section 4: [CLR1Q26, CLR4Q25, CLR3Q25, CLR2Q25, CLR1Q25, DEFAULT]
```

---

## Data Flow Diagram

```
                    SOURCE DATA
                         |
    +--------------------+--------------------+
    |                    |                    |
    v                    v                    v
tbl_well_qualifier_   vw_evergreen_    tbl_novi_forecast_
prod_econ_parameters  well_cost_       aries_format
(Decline: b/Di/Df)    profiles         (ML forecasts)
                      (D&C costs)
    |                    |                    |
    +--------------------+--------------------+
                         |
                         v
        tbl_aries_production_lines_parsed
        (Parsed decline expressions)
                         |
                         v
        tbl_aries_forecast_daily_volumes
        (Master daily forecasts - 521M rows)
                         |
    +--------------------+--------------------+
    |                    |                    |
    v                    v                    v
tbl_pdp_daily_     tbl_undev_daily_   tbl_approval_
forecasts          forecasts          daily_volumes
(PDP wells)        (Future wells)     (Approved)
                         |
                         v
        tbl_evergreen_monthly_primary
        (Monthly aggregation)
                         |
    +--------------------+--------------------+
    |                                         |
    v                                         v
view_ac_monthly_evergreen          view_ac_oneline_evergreen
(Monthly time series)              (EUR, PV10, ROR summary)
```

---

## Key Relationships

| From Table | To Table | Join Key | Relationship |
|------------|----------|----------|--------------|
| Any forecast table | eds.well.tbl_well_summary | propnum | Well attributes |
| Any forecast table | epw.aries_evergreen.ac_property | propnum | Aries master |
| tbl_evergreen_scenario_prod_qualifiers | All forecast tables | scenario | Scenario config |
| vw_rdtc_active_typecurves | vw_evergreen_well_cost_profiles | cost_profile | Type curve costs |

---

## Usage Patterns

### Get PDP forecasts for an asset team
```sql
SELECT propnum, well_name, production_date,
       oil_forecast, gas_forecast, boe_forecast
FROM eds.resource_dev.tbl_pdp_daily_forecasts
WHERE asset_team = 'WILLISTON'
  AND production_date >= '2025-01-01'
```

### Get decline parameters for approved wells
```sql
SELECT propnum, keyword, segment_type,
       initial_value as ip, hyp_b, hyp_di, hyp_df
FROM eds.resource_dev.tbl_well_qualifier_prod_econ_parameters
WHERE qualifier = 'APPROVED'
  AND keyword IN ('OIL', 'GAS')
```

### Get type curve economics
```sql
SELECT prod_typecurve, formation, lateral_length,
       eur_mboe, tot_cwc, tot_pv_10, ror
FROM eds.resource_dev.vw_rdtc_active_typecurves
WHERE status = 'ACTIVE'
  AND asset_team = 'WILLISTON'
ORDER BY ror DESC
```

---

## Notes & Observations

1. **Scenario Naming Convention:**
   - `CLRxQyy` = Corporate quarterly runs (e.g., CLR4Q24 = Q4 2024)
   - `RD_LOSS_*` = Resource development scenarios
   - `APPROVED*` = Sanctioned well scenarios
   - `TYPE_CURVE` = Type curve placeholder wells

2. **Qualifier Priority:**
   - Scenarios use ordered qualifier lists
   - First matching qualifier wins
   - DEFAULT is always the fallback

3. **Decline Curve Standards:**
   - Oil: b ≈ 1.0, Di ≈ 50%, Df ≈ 6%
   - Gas: b ≈ 1.17 (slightly higher), Di ≈ 49%
   - Water: b ≈ 1.0, Di ≈ 56%

4. **Data Sources:**
   - AriesEvergreen: Primary production database (~20K wells)
   - AriesRDTC: Resource Development Type Curves (~2K wells)
   - Novi Labs: ML-based forecasts (~394K rows)

5. **Reserve Categories:**
   - PDP (Proved Developed Producing): Currently producing
   - Undeveloped: Planned but not drilled
   - These are mutually exclusive in the data
