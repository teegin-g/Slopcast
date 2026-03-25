# EPW Enverus Tables

## Schema Overview

| Attribute | Value |
|-----------|-------|
| **Catalog.Schema** | `epw.enverus` |
| **Total Tables** | 113 (including _hist versions) |
| **Purpose** | Third-party industry data from Enverus for benchmarking, competitive intelligence, and analytics |
| **Primary Use** | Industry analysis, M&A research, type curves, reservoir characterization, ESG reporting |

---

## Table Categories

### 1. Economics & Type Curves
| Table | Rows | Description |
|-------|------|-------------|
| `core_economics` | 4.0M | Well-level economics (EUR, NPV, breakeven, costs) |
| `core_typecurves` | 877M | Well-month production data for type curve generation |
| `core_companycurves` | 197K | Company-disclosed type curves with decline parameters |

### 2. Well Headers
| Table | Rows | Description |
|-------|------|-------------|
| `core_wells` | 6.6M | Comprehensive well/completion data with production & economics |
| `core_wells_ext` | 5.7M | Extended coordinates (NAD27 datum) |
| `foundations_wells` | 6.6M | Foundations well data (US + Canada) |
| `foundations_wellheader` | 6.2M | Lightweight well-level headers |
| `foundations_wellboreheader` | 6.3M | Wellbore geometry and spatial data |

### 3. Geology & Reservoir
| Table | Rows | Description |
|-------|------|-------------|
| `core_reservoircharacterization` | 664K | Petrophysical properties (porosity, Sw, pressure, TOC) |
| `foundations_formationtops` | 13.8M | Formation top picks with depths |
| `foundations_drillstemtests` | 1.1M | DST pressure and flow data |
| `foundations_shows` | 1.0M | Hydrocarbon show records |

### 4. Completion Data
| Table | Rows | Description |
|-------|------|-------------|
| `foundations_completionheader` | 6.4M | Completion summary (stages, lateral, proppant) |
| `foundations_fracstages` | 3.8M | Stage-level frac details |
| `foundations_fracclusters` | 1.7M | Cluster-level perforation details |
| `foundations_fracproppantfluids` | 4.0M | Proppant/fluid by stage and material |
| `foundations_downholeconsumable` | 8.7M | FracFocus chemical disclosure data |

### 5. Production Data
| Table | Rows | Description |
|-------|------|-------------|
| `foundations_production` | 555M | Well-level monthly production |
| `producingentity_production` | 714M | Entity-level monthly production |
| `producingentity_header` | 5.9M | Producing entity master/dimension table |
| `producingentity_revenue` | 85M | Production revenue and sales transactions |

### 6. Fluid Analysis
| Table | Rows | Description |
|-------|------|-------------|
| `foundations_gasanalysis` | 1.4M | Gas composition (BTU, gravity, components) |
| `foundations_oilanalysis` | 89K | Oil PVT data (API gravity, viscosity) |
| `foundations_wateranalysis` | 108K | Produced water chemistry (TDS, ions) |

### 7. M&A & Financial
| Table | Rows | Description |
|-------|------|-------------|
| `ma_transactions` | 28K | Closed M&A deals with valuations |
| `ma_dealsforsale` | 10K | Active asset listings |
| `ma_companyindex` | 1.9K | PE-backed company profiles |
| `ma_operatorland` | 54K | Operator acreage positions by county |

### 8. ESG & Emissions
| Table | Rows | Description |
|-------|------|-------------|
| `esg_esgmetrics` | 659 | Corporate ESG metrics |
| `esg_ghgemissionssource` | 22M | Emissions by source and gas type |
| `esg_ghgemissionssummary` | 4.1M | Well/facility-level emissions |

### 9. Spacing Analysis
| Table | Rows | Description |
|-------|------|-------------|
| `spacing_fullspacing` | 3.7M | Pairwise well spacing relationships |
| `spacing_summaryspacing` | 345K | One-line spacing summary per well |

### 10. Activity & Infrastructure
| Table | Rows | Description |
|-------|------|-------------|
| `activity_rigs` | - | Active rig locations |
| `activity_fraccrews` | - | Frac crew activity |
| `activity_detectedwellpad` | - | Satellite-detected well pads |
| `infra_facilities` | - | Midstream facilities |
| `infra_pipelines` | - | Pipeline infrastructure |

---

## Detailed Table Documentation

### core_economics

**Purpose:** Primary economic metrics table with EUR, NPV, costs, and breakeven prices for US wells.

**Row Count:** 4,004,007

**Key Columns:**

| Category | Columns | Description |
|----------|---------|-------------|
| **Identifiers** | `wellid`, `api_uwi`, `api_uwi_14_unformatted` | Well identification |
| **EUR** | `eurwh_mboe`, `oileurwh_mbbl`, `gaseurwh_bcf` | Estimated Ultimate Recovery |
| **EUR by Time** | `eurwh_mboe_60/120/180/360` | EUR at various horizons |
| **Costs** | `totalwellcost_usdmm`, `completioncost_usdmm`, `drillingcost_usdmm` | Well costs ($MM) |
| **NPV** | `npvperwellat50and200_usdmm`, `npvperwellat60and300_usdmm` | NPV at price decks |
| **Breakeven** | `be15to1wtinymex_usdperbbl`, `be25to1wtinymex_usdperbbl` | Breakeven oil prices |
| **IRR** | `irrperwellat*_usdmm` | Internal rate of return |
| **OPEX** | `totalopex_usdperboe`, `fixedopex_usdperwellpermonth` | Operating expenses |
| **Tax/Royalty** | `oilseverancetax_pct`, `royaltyrateoil_pct` | Tax and royalty rates |

**Key Statistics:**
| Metric | Average | Median | Coverage |
|--------|---------|--------|----------|
| EUR (MBOE) | 261 | 46 | 61% |
| Total Well Cost | $2.88M | $1.68M | 17% |
| NPV (60/300) | $1.11M | -$0.21M | 14% |
| Breakeven (BE25) | - | $73/bbl | 14% |

---

### core_reservoircharacterization

**Purpose:** Petrophysical properties from log analysis at formation interval level.

**Row Count:** 664,121

**Key Columns:**

| Category | Columns | Description |
|----------|---------|-------------|
| **Formation** | `envinterval`, `envplay`, `envbasin` | Geologic classification |
| **Depth** | `md`, `tvd`, `subsea` | Measured and true vertical depth |
| **Porosity** | `effectiveporosity`, `densityporosity`, `neutronporosity` | Porosity metrics (+ P25/P50/P75) |
| **Saturation** | `watersaturation` | Water saturation |
| **Pressure** | `mudderivedreservoirpressure`, `reservoirtemperature` | Reservoir conditions |
| **Rock Volume** | `clayvolume`, `quartzvolume`, `carbonatevolume` | Mineralogy |
| **TOC** | `toc`, `totalorganiccarbon` | Organic content |
| **Hydrocarbon** | `ogip`, `ooip`, `hcpv` | Original in-place volumes |

**Sample Values:**
- Porosity: 2.6% - 5.7%
- Water Saturation: 6% - 18%
- Reservoir Pressure: 2,583 - 4,976 psi
- TOC: 0.33% - 3.38%

---

### core_companycurves

**Purpose:** Company-disclosed type curves with full Arps decline parameters.

**Row Count:** 197,063 (298 distinct type curves x 669 months)

**Key Columns:**

| Category | Columns | Description |
|----------|---------|-------------|
| **Identity** | `typecurveid`, `curvename`, `corporateentity`, `envticker` | Curve identification |
| **EUR** | `curveeur_mboe`, `envcalculatedwheurmboe` | Stated and calculated EUR |
| **Oil Decline** | `bfactoroilseg1/2/3`, `daoilseg1/2/3_pct`, `initialratedoilseg1_bblperday` | Oil Arps parameters |
| **Gas Decline** | `bfactorgasseg1/2/3`, `dagasseg1/2/3_pct`, `initialratedgasseg1_mcfperday` | Gas Arps parameters |
| **Completion** | `laterallength_ft`, `drillandcompletecost_mmusd`, `proppantintensity_lbsperft` | Design parameters |
| **Forecast** | `cdoilproduction_bblperday`, `cdwhgasproduction_mcfperday` (by month) | Monthly production profile |

**CLR Type Curve Found:**
- **Name:** CLR-US FEB 2021 SCOOP WOODFORD 7500 FT LATERAL
- **EUR:** 1,978.5 MBOE
- **Oil IP:** 465 bbl/day, b=1.10, Di=52%
- **Gas IP:** 2,950 mcf/day, b=1.20, Di=49%
- **D&C Cost:** $8.0 MM

---

### ma_transactions

**Purpose:** Comprehensive M&A transaction database with deal valuations.

**Row Count:** 28,018

**Key Columns:**

| Category | Columns | Description |
|----------|---------|-------------|
| **Deal Value** | `value_mm`, `dealvaluecash_mm`, `dealvaluedebt_mm`, `dealvalueequity_mm` | Transaction value ($MM) |
| **Metrics** | `dealvalueperacreage`, `dollarperprovedboe`, `dollarperdailyboe` | Per-unit valuations |
| **EBITDA** | `cashfloworebitda_mm`, `cashfloworebitdamultiple` | Cash flow metrics |
| **Reserves** | `pv10proved_mm` | PV10 of proved reserves |
| **Parties** | `buyer`, `seller`, `advisors` | Transaction parties |
| **Geography** | `basin`, `play`, `state` | Asset location |

**Use Cases:**
- Benchmark acquisition valuations ($/acre, $/BOE, EBITDA multiples)
- Track competitor M&A activity
- Analyze deal structure trends

---

### esg_ghgemissionssummary

**Purpose:** Well and facility-level GHG emissions data.

**Row Count:** 4,131,689

**Key Columns:**

| Category | Columns | Description |
|----------|---------|-------------|
| **Emissions** | `totalco2eemissions_mt`, `totalch4emissions_mt`, `totalco2emissions_mt` | GHG emissions (MT) |
| **Intensity** | `emissionintensity_kgofco2eperboe`, `methaneintensity_kgofco2eperboe` | Per-BOE metrics |
| **Production** | `totalcalendaryearboe_boe` | Annual production |
| **Flaring** | `totalflaredvolume_mcf` | Flared gas volume |
| **Equipment** | `compressors`, `pneumaticpumps`, `flarestacks` | Source emissions |

**Top Basins by Emissions (2023):**
| Basin | Total CO2e (MT) |
|-------|-----------------|
| WESTERN GULF | 417M |
| APPALACHIAN | 259M |
| ARK-LA-TX | 104M |

---

### spacing_summaryspacing

**Purpose:** One-line well spacing summary with bounded status and parent/child classification.

**Row Count:** 345,031

**Key Columns:**

| Category | Columns | Description |
|----------|---------|-------------|
| **Distance** | `avg3ddistsamezone_ft`, `closesthzdistsamezone_ft` | Distance to neighbors |
| **Bounded** | `boundedsamezone`, `boundedanyzone` | UNBOUNDED/HALFBOUNDED/FULLYBOUNDED |
| **Parent/Child** | `parentchildsamezone`, `parentchildanyzone` | PARENT/CHILD/STANDALONE |
| **Density** | `nearneighborcountsamezone`, `wellspersectionsamezone` | Well density metrics |

**Maps to CLR `tbl_well_summary`:**
- `env_spacing_status` = `parentchildanyzone`
- `env_bounded_status_same_zone_current` = `boundedsamezone`
- `env_dist_to_neighbor_same_zone_hz` = `closesthzdistsamezone_ft`

---

## Join Keys & Relationships

### Primary Identifiers

| Identifier | Format | Description |
|------------|--------|-------------|
| `wellid` | bigint | Enverus well ID (primary) |
| `completionid` | bigint | Enverus completion ID |
| `wellboreid` | bigint | Enverus wellbore ID |
| `api_uwi` | string | Formatted API/UWI |
| `api_uwi_14_unformatted` | string | 14-digit API (no dashes) |
| `api_uwi_12_unformatted` | string | 12-digit API (no dashes) |
| `clr_guwi` | bigint | CLR internal GUWI |

### Joining to CLR Tables

**To eds.well.tbl_well_summary:**
```sql
-- Primary join via API
SELECT e.*, w.*
FROM epw.enverus.core_economics e
JOIN eds.well.tbl_well_summary w
  ON e.api_uwi_14_unformatted = w.api_14

-- Alternative via 12-digit API
JOIN eds.well.tbl_well_summary w
  ON e.api_uwi_12_unformatted = w.api_12
```

**To eds.resource_dev tables:**
```sql
-- Join via propnum (requires intermediate lookup)
SELECT e.*, f.*
FROM epw.enverus.core_economics e
JOIN eds.well.tbl_well_summary w ON e.api_uwi_14_unformatted = w.api_14
JOIN eds.resource_dev.tbl_pdp_daily_forecasts f ON w.propnum = f.propnum
```

### Cross-Table Joins (Within Enverus)

```sql
-- Economics + Reservoir
SELECT e.eurwh_mboe, r.effectiveporosity, r.watersaturation
FROM epw.enverus.core_economics e
JOIN epw.enverus.core_reservoircharacterization r ON e.wellid = r.wellid

-- Well + Completion + Spacing
SELECT w.*, c.fracstages, c.laterallength_ft, s.parentchildsamezone
FROM epw.enverus.core_wells w
JOIN epw.enverus.foundations_completionheader c ON w.completionid = c.completionid
JOIN epw.enverus.spacing_summaryspacing s ON w.wellid = s.wellid
```

---

## Usage Patterns

### Competitive Benchmarking

```sql
-- Compare CLR EUR to peer operators in Bakken
SELECT
    w.envoperator,
    COUNT(*) as wells,
    AVG(e.eurwh_mboe) as avg_eur_mboe,
    AVG(e.totalwellcost_usdmm) as avg_cost_mm,
    AVG(e.eurwh_mboe / NULLIF(e.totalwellcost_usdmm, 0)) as eur_per_mm_cost
FROM epw.enverus.core_economics e
JOIN epw.enverus.core_wells w ON e.wellid = w.wellid
WHERE w.envbasin = 'WILLISTON'
  AND w.envplay = 'BAKKEN-US'
  AND e.eurwh_mboe IS NOT NULL
GROUP BY w.envoperator
HAVING COUNT(*) >= 50
ORDER BY avg_eur_mboe DESC
```

### Type Curve Development

```sql
-- Generate type curve from actual well performance
SELECT
    totalcompletionmonths as month,
    AVG(liquidsprod_bbl) as avg_oil,
    AVG(gasprod_mcf) as avg_gas,
    PERCENTILE(liquidsprod_bbl, 0.5) as p50_oil,
    COUNT(*) as well_count
FROM epw.enverus.core_typecurves
WHERE envbasin = 'DELAWARE'
  AND envinterval = 'WOLFCAMP A'
  AND totalcompletionmonths BETWEEN 1 AND 60
GROUP BY totalcompletionmonths
ORDER BY totalcompletionmonths
```

### M&A Valuation Analysis

```sql
-- Recent Permian deal valuations
SELECT
    closingdate,
    buyer,
    seller,
    value_mm,
    dealvalueperacreage as dollar_per_acre,
    dollarperprovedboe as dollar_per_boe,
    cashfloworebitdamultiple as ebitda_multiple
FROM epw.enverus.ma_transactions
WHERE basin LIKE '%PERMIAN%'
  AND closingdate >= '2023-01-01'
  AND value_mm > 100
ORDER BY closingdate DESC
```

### ESG Emissions Tracking

```sql
-- Operator emissions intensity comparison
SELECT
    currentenvoperator,
    SUM(totalco2eemissions_mt) as total_emissions,
    SUM(totalcalendaryearboe_boe) as total_production,
    SUM(totalco2eemissions_mt) / NULLIF(SUM(totalcalendaryearboe_boe), 0) * 1000 as intensity_kg_per_boe
FROM epw.enverus.esg_ghgemissionssummary
WHERE reportingyear = '2023'
  AND envbasin = 'WILLISTON'
GROUP BY currentenvoperator
HAVING SUM(totalcalendaryearboe_boe) > 1000000
ORDER BY intensity_kg_per_boe
```

---

## Data Quality Notes

1. **Coverage Varies by Column:**
   - EUR populated for ~61% of wells in core_economics
   - NPV/costs populated for ~14-17% of wells
   - Economic data primarily updated in 2025-2026

2. **Geographic Coverage:**
   - US and Canada wells included
   - Canadian wells use UWI format instead of API

3. **Historical Tables:**
   - All tables have `_hist` versions for point-in-time snapshots
   - Use `row_eff_begin_date` and `row_eff_end_date` for temporal queries

4. **CLR Integration:**
   - `clr_guwi` column provides direct linkage to CLR internal systems
   - 0 value for `clr_guwi` indicates non-CLR interest wells

5. **Data Freshness:**
   - Production data: Monthly updates
   - Economics: Periodic recalculation
   - M&A: Near real-time deal tracking

---

## Key Differences from CLR Internal Data

| Aspect | CLR Internal (eds.*) | Enverus (epw.enverus) |
|--------|---------------------|----------------------|
| **Scope** | CLR wells only | Industry-wide |
| **Identifiers** | propnum, merrick_id | wellid, api_uwi |
| **Economics** | Aries-based | Enverus methodology |
| **EUR** | Internal forecasts | Enverus DCA |
| **Spacing** | Subset of Enverus | Full spacing analysis |
| **Completion Detail** | Summary only | Stage/cluster level |
| **Chemical Data** | Not available | FracFocus disclosure |
| **M&A** | Not available | Full transaction database |
| **ESG** | Not available | Emissions tracking |

---

*Last Updated: January 2026*
