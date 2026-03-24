# EDS Well Summary (tbl_well_summary)

## Table Overview

| Attribute | Value |
|-----------|-------|
| **Full Name** | `eds.well.tbl_well_summary` |
| **Row Count** | ~1.67M wells |
| **Description** | One-line well summary for horizontal wells in and around CLR's current operating areas. Contains the original, completed and producing wellbore. Does not include non-producing pilot holes, sidetracks, etc. |
| **Primary Use** | Well-level analytics, benchmarking, spacing analysis |
| **Contact** | enterpriseanalytics@clr.com |

## Key Characteristics

- **Filtering**: This table is filtered to focus on horizontal wells in CLR's areas of interest
- **Primary Key**: `api_14` (unique per row)
- **Propnum Coverage**: ~55% of wells have a propnum linking to Aries
- **Operated Wells**: ~14,500 CLR-operated wells, ~7,700 non-operated wells with interest

## Column Categories

### Identifier Columns

| Column | Type | Description |
|--------|------|-------------|
| `propnum` | string | Aries property number - 10-digit alphanumeric code. Primary key for Aries integration. ~55% coverage. |
| `api_10` | string | First 10 digits of API number (state + county + well) |
| `api_12` | string | First 12 digits of API number (includes directional sidetrack) |
| `api_14` | string | Full 14-digit API number (includes event sequence). **Unique per row.** |
| `well_name` | string | Well name |
| `merrick_id` | bigint | ProCount MerrickID - requires well to be in ProCount |
| `land_well_id` | string | Land Well ID from Well Tracker |
| `surface_id` | string | Surface location identifier |
| `unit_id` | string | Unit ID for CLR operated and non-operated units |
| `unit_name` | string | Unit name |

### Location & Organizational Hierarchy

| Column | Type | Description |
|--------|------|-------------|
| `state` | string | State where surface hole is located |
| `county` | string | County where surface hole is located |
| `basin` | string | Industry-defined geological basin (from US Tectonics layer ~2020) |
| `play` | string | Hydrocarbon play area (being decommissioned) |
| `formation` | string | Geological formation - mappable stratigraphic unit |
| `zone` | string | Geological interval within formation where hydrocarbons are extracted |
| `zone_source` | string | Source of zone determination |
| `region` | string | Highest spatial grouping for CLR wells (NORTH/SOUTH) |
| `district` | string | Spatial grouping inside a region |
| `field_office` | string | Field office assignment (N/A for non-interest wells) |
| `asset_team` | string | Asset team assignment |
| `project` | string | Project assignment |
| `rcc` | string | Regional cost center |
| `core_cost_center` | string | Core cost center assignment |

**CLR Asset Team Distribution (Operated Wells):**
- WILLISTON: 4,503 wells
- POWDER RIVER: 3,003 wells
- PERMIAN: 2,770 wells
- ANADARKO: 2,515 wells
- Others: ~1,700 wells

### Well Characteristics

| Column | Type | Description |
|--------|------|-------------|
| `well_type` | string | Type: Exploration, Development, Infill, Delineation |
| `well_status` | string | Current lifecycle state (Producing, Inactive, P&A, etc.) |
| `wellbore_direction` | string | Wellbore orientation: HORIZONTAL, VERTICAL, DIRECTIONAL |
| `operated_class` | string | Operating status: OP (Operated), NONOP (Non-operated), NOINT (No Interest) |
| `operator` | string | Current operator name |
| `operator_short` | string | Shortened/conformed operator name |
| `operator_peer_group` | string | Operator peer group classification |
| `operator_ticker` | string | Stock ticker symbol for operator |
| `wi` | decimal(38,6) | Working interest |
| `nri` | decimal(38,6) | Net revenue interest |
| `data_trade` | string | Data trade flag |

**Operated Class Distribution:**
- NOINT: 1,647,562 wells (98.7%)
- OP: 14,545 wells (0.9%)
- NONOP: 7,702 wells (0.5%)

**Well Status Distribution (Top 5):**
- PLUGGED AND ABANDONED: 579,927
- PRODUCING: 516,337
- INACTIVE: 143,345
- INACTIVE COMPLETED: 113,873
- PERMIT EXPIRED: 78,681

### Drilling & Completion

| Column | Type | Description |
|--------|------|-------------|
| `permit_date` | date | Date permit was approved |
| `spud_date` | date | Date drilling started |
| `rig_release_date` | date | Date rig was released |
| `completion_date` | date | Original completion date (usually end of stimulation) |
| `lateral_length` | bigint | Completed lateral length in feet |
| `total_depth` | bigint | Total measured depth in feet |
| `true_vertical_depth` | bigint | True vertical depth in feet |
| `gross_perforated_interval` | bigint | Difference between max perf bottom and min perf top (ft) |
| `perf_top_depth` | bigint | Top perforation depth (ft) |
| `perf_btm_depth` | bigint | Bottom perforation depth (ft) |
| `stage_total` | bigint | Total number of frac stages |
| `stage_spacing` | bigint | Spacing between stages |
| `fluid_total` | bigint | Total fluid pumped (gallons) |
| `fluid_per_ft` | bigint | Fluid per foot of lateral |
| `fluid_per_stage` | bigint | Fluid per stage |
| `proppant_total` | bigint | Total proppant pumped (lbs) |
| `proppant_per_ft` | bigint | Proppant per foot of lateral |
| `proppant_per_stage` | bigint | Proppant per stage |

**Completion Data Coverage (CLR Operated):**
- Stage count: 36.5% of wells
- Proppant: 38.6% of wells
- Fluid: 43.6% of wells
- Lateral length: 41.3% of wells
- Average stages: 32
- Average proppant: 9.79M lbs
- Average lateral: 8,736 ft

### Coordinates & Elevation

| Column | Type | Description |
|--------|------|-------------|
| `sh_latitude_nad27` | decimal(38,6) | Surface hole latitude (NAD27 datum) |
| `sh_longitude_nad27` | decimal(38,6) | Surface hole longitude (NAD27 datum) |
| `bh_latitude_nad27` | decimal(38,6) | Bottom hole latitude (NAD27 datum) |
| `bh_longitude_nad27` | decimal(38,6) | Bottom hole longitude (NAD27 datum) |
| `sh_str` | string | Surface hole section-township-range |
| `ground_elevation` | decimal(38,6) | Ground elevation |
| `kb_elevation` | decimal(38,6) | Kelly bushing elevation |

**Note:** CLR standard datum is NAD27, but some data may be stored in alternative datums due to state regulatory requirements.

### Reservoir Properties

| Column | Type | Description |
|--------|------|-------------|
| `effective_porosity` | double | P50 porosity estimate from geologic interpretation |
| `water_saturation` | double | P50 water saturation from geologic interpretation |
| `initial_reservoir_pressure` | double | Initial reservoir pressure at virgin conditions (psi) |
| `reservoir_temperature` | double | Estimated bottomhole temperature |
| `formation_volume_factor_oil` | double | Oil formation volume factor (Bo) |
| `formation_volume_factor_gas` | double | Gas formation volume factor (Bg) |
| `initial_oil_gravity` | double | Initial oil gravity (API) |
| `initial_gas_gravity` | double | Initial gas gravity |
| `gross_formation_height` | double | Gross formation thickness |
| `bulk_volume_hydrocarbon_height` | double | Bulk volume hydrocarbon height |
| `reservoir_domain` | string | Reservoir domain classification |

**Reservoir Data Coverage (CLR Operated):**
- Porosity: 44.0% of wells
- Water saturation: 44.0% of wells
- Pressure: 44.2% of wells (avg: 7,230 psi)
- Temperature: 44.1% of wells

### Production Data

| Column | Type | Description |
|--------|------|-------------|
| `first_prod_date` | date | First production date |
| `first_prod_year` | int | Year of first production |
| `last_prod_date` | date | Last production month |
| `cum_oil_to_date` | bigint | Cumulative oil produced (bbl) |
| `cum_gas_to_date` | bigint | Cumulative gas produced (mcf) |
| `cum_boe_to_date` | bigint | Cumulative BOE produced |
| `cum_water_to_date` | bigint | Cumulative water produced (bbl) |
| `cum_liquid_to_date` | bigint | Cumulative liquid produced |

**Cumulative Production by Period:**
| Column Pattern | Description |
|----------------|-------------|
| `cum_oil_3mo`, `cum_oil_6mo`, etc. | Cumulative oil at 3, 6, 9, 12, 24, 60 months |
| `cum_gas_3mo`, `cum_gas_6mo`, etc. | Cumulative gas at 3, 6, 9, 12, 24, 60 months |
| `cum_boe_3mo`, `cum_boe_6mo`, etc. | Cumulative BOE at 3, 6, 9, 12, 24, 60 months |
| `cum_water_3mo`, `cum_water_6mo`, etc. | Cumulative water at 3, 6, 9, 12, 24, 60 months |
| `cum_liquid_3mo`, `cum_liquid_6mo`, etc. | Cumulative liquid at 3, 6, 9, 12, 24, 60 months |

### Production Ratios

| Column | Type | Description |
|--------|------|-------------|
| `gor_cum_to_date` | double | Gas-oil ratio for life of well |
| `gor_3mo`, `gor_6mo`, etc. | double | GOR at 3, 6, 9, 12, 24, 60 months |
| `water_cut_cum_to_date` | double | Water cut for life of well |
| `water_cut_3mo`, `water_cut_6mo`, etc. | double | Water cut at 3, 6, 9, 12, 24, 60 months |
| `log_gor` | double | Logarithm of GOR |

### Peak Production

| Column | Type | Description |
|--------|------|-------------|
| `peak_boe` | bigint | Peak monthly BOE production |
| `peak_boe_month_date` | date | Date of peak BOE production |
| `peak_boe_month_norm` | bigint | Normalized peak BOE month |
| `oil_at_peak_boe` | bigint | Oil production in peak BOE month |
| `gas_at_peak_boe` | bigint | Gas production in peak BOE month |

### EUR (Estimated Ultimate Recovery)

| Column | Type | Description |
|--------|------|-------------|
| `eur_boe` | bigint | EUR in barrels of oil equivalent |
| `eur_oil_bbl` | bigint | EUR oil in barrels |
| `eur_gas_mcf` | bigint | EUR gas in mcf |
| `eur_water` | bigint | EUR water |
| `eur_oil_per_ft` | bigint | EUR oil per foot of lateral |
| `eur_gas_per_ft` | bigint | EUR gas per foot of lateral |
| `eur_boe_per_ft` | bigint | EUR BOE per foot of lateral |
| `eur_source` | string | Source of EUR estimate |
| `eur_scenario` | string | Aries scenario used for EUR |
| `eur_qualifier` | string | EUR qualifier |

**EUR Source Distribution:**
- ENVERUS: 797,583 wells (avg EUR: 414,416 BOE)
- NOVI LABS: 58,200 wells (avg EUR: 798,341 BOE)
- ARIES EVERGREEN: 11,662 wells (avg EUR: 781,148 BOE)
- ARIES PUBLIC: 1,133 wells (avg EUR: 812,960 BOE)

### Well Test Data

| Column | Type | Description |
|--------|------|-------------|
| `well_test_date` | date | Date of well test |
| `well_test_oil` | bigint | Oil rate from well test |
| `well_test_gas` | bigint | Gas rate from well test |
| `well_test_water` | bigint | Water rate from well test |
| `well_test_boe` | bigint | BOE rate from well test |
| `well_test_choke` | string | Choke setting during well test |
| `well_test_csg_psi` | bigint | Casing pressure during test |
| `well_test_tbg_psi` | bigint | Tubing pressure during test |
| `well_test_oil_gravity` | decimal(38,6) | Oil gravity from well test |

### Well Spacing & Interference (ENV Columns)

| Column | Type | Description |
|--------|------|-------------|
| `env_spacing_status` | string | Overall spacing status |
| `env_spacing_status_same_zone_current` | string | Current spacing status in same zone |
| `env_spacing_status_same_zone_at_drill` | string | Spacing status at drill time in same zone |
| `env_spacing_status_all_zone_at_drill` | string | Spacing status at drill time across all zones |
| `env_bounded_status_same_zone_current` | string | Current bounded status in same zone |
| `env_bounded_status_same_zone_at_drill` | string | Bounded status at drill time in same zone |
| `env_bounded_status_all_zone_current` | string | Current bounded status across all zones |
| `env_bounded_status_all_zone_at_drill` | string | Bounded status at drill time across all zones |
| `env_dist_to_neighbor_same_zone_hz` | double | Horizontal distance to nearest neighbor in same zone (ft) |
| `env_dist_to_neighbor_same_zone_at_drill` | double | Horizontal distance to neighbor at drill time |
| `env_dist_to_neighbor_all_zone_hz` | double | Horizontal distance to nearest neighbor in any zone (ft) |
| `env_dist_to_neighbor_all_zone_vt` | double | Vertical distance to nearest neighbor (ft) |
| `env_dist_to_neighbor_all_zone_at_drill` | double | Distance to neighbor at drill time across zones |

**Spacing Status Distribution:**
- CO-COMPLETED: 100,233 wells
- CHILD: 56,767 wells
- PARENT: 25,933 wells
- STANDALONE: 1,415 wells

**Bounded Status Distribution:**
- FULLYBOUNDED: 122,988 wells
- HALFBOUNDED: 46,760 wells
- UNBOUNDED: 18,813 wells

**Average Distance to Neighbor (CLR Operated):**
- Same zone horizontal: 1,390 ft
- All zone horizontal: 867 ft

## Table Relationships

### Primary Relationships

| Related Table | Join Key | Relationship | Notes |
|---------------|----------|--------------|-------|
| `epw.aries_evergreen.ac_property` | `propnum` | Many-to-1 | ~23K wells have matching propnum |
| `eds.production.tbl_monthly_production` | `api_14` | 1-to-Many | Monthly production actuals |
| `eds.completions.tbl_completions_well_stim_oneline` | `api_14` | 1-to-1 | Completion details |
| `eds.well.tbl_well_completion_details` | `api_14` | 1-to-Many | Detailed completion data |

### Join Examples

**Join with Aries AC_PROPERTY:**
```sql
SELECT
    ws.api_14,
    ws.well_name,
    ws.cum_oil_to_date,
    ap.reservoir_domain,
    ap.cost_profile
FROM eds.well.tbl_well_summary ws
INNER JOIN epw.aries_evergreen.ac_property ap
    ON ws.propnum = ap.propnum
WHERE ws.operated_class = 'OP'
```

**Join with Monthly Production:**
```sql
SELECT
    ws.api_14,
    ws.well_name,
    mp.p_date,
    mp.oil,
    mp.gas
FROM eds.well.tbl_well_summary ws
INNER JOIN eds.production.tbl_monthly_production mp
    ON ws.api_14 = mp.api_14
WHERE ws.operated_class = 'OP'
ORDER BY ws.api_14, mp.p_date
```

## Observations & Notes

1. **Data Quality**:
   - About 45% of wells have no propnum, limiting Aries integration
   - Reservoir data coverage is about 44% for CLR operated wells
   - Completion data coverage varies from 36-44% for operated wells

2. **Filtering Logic**:
   - This table focuses on horizontal wells in CLR areas
   - Use `operated_class` to filter for CLR interest wells
   - NOINT wells are industry wells with no CLR interest

3. **EUR Hierarchy**:
   - Aries Evergreen is preferred for CLR wells
   - Enverus provides the broadest coverage for industry wells
   - Novi Labs provides type-curve based EUR estimates

4. **Spacing Analysis**:
   - ENV columns are pre-calculated spacing metrics
   - Can identify parent/child relationships
   - Useful for interference studies

5. **Production Normalization**:
   - Cumulative production at fixed time intervals (3, 6, 9, 12, 24, 60 months)
   - Allows consistent benchmarking across wells

## Related Documentation

- [EDS Well Summary All](EDS_TBL_WELL_SUMMARY_ALL.md) - Unfiltered version with 4.5M+ wells
- [AC_PROPERTY](AC_PROPERTY.md) - Aries master well header
- [TABLE_RELATIONSHIPS](../TABLE_RELATIONSHIPS.md) - Overall table relationships
