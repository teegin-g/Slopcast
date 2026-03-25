# EDS Production Tables

## Schema Overview

| Attribute | Value |
|-----------|-------|
| **Catalog.Schema** | `eds.production` |
| **Purpose** | Production volumes - actuals, forecasts, and combined views |
| **Primary Use** | Production reporting, decline analysis, forecast-to-actual comparisons |

## Table Summary

### Daily Production Tables

| Table | Rows | Description |
|-------|------|-------------|
| `tbl_daily_production` | 52M | Core daily production data |
| `tbl_daily_production_actuals` | 62M | Actual production only (no forecasts) |
| `tbl_daily_production_actuals_plus_forecast` | 86M | Combined actuals + Aries forecasts |

### Monthly Production Tables

| Table | Rows | Description |
|-------|------|-------------|
| `tbl_monthly_production` | 189M | Core monthly production data |
| `tbl_monthly_production_all` | 477M | Extended monthly with all sources |
| `tbl_monthly_production_plus_forecast` | 719M | Combined actuals + forecasts |
| `tbl_macro_production` | 45M | Aggregated macro-level production |
| `tbl_macro_production_with_forecast` | 63M | Macro production with forecasts |

---

## Daily Production Tables

### tbl_daily_production

**Purpose:** Core daily production volumes from multiple data sources.

| Column | Type | Description |
|--------|------|-------------|
| `api_14` | string | 14-digit API well number (primary key) |
| `propnum` | string | Aries property number |
| `production_date` | date | Calendar date of production |
| `oil` | decimal | Daily oil production (BBL) |
| `gas` | decimal | Daily gas production (MCF) |
| `water` | decimal | Daily water production (BBL) |
| `boe` | decimal | Barrels of oil equivalent (oil + gas/6) |
| `data_source` | string | Source system for the data |
| `operated_class` | string | OP, NONOP, or NOINT |

**Statistics:**
- **Rows:** 52,000,000+
- **Date Range:** 1900-01-01 to 2031-12-31
- **Data Sources:** S&P, Enverus, NDIC, ProCount

**Key Insight:** Contains both historical actuals and near-term forecasts. Use `actual_or_forecast` column to distinguish.

---

### tbl_daily_production_actuals

**Purpose:** Filtered view containing only actual production (no forecasts).

| Column | Type | Description |
|--------|------|-------------|
| `api_14` | string | 14-digit API well number |
| `propnum` | string | Aries property number |
| `production_date` | date | Calendar date |
| `oil_actual` | decimal | Actual oil production (BBL) |
| `gas_actual` | decimal | Actual gas production (MCF) |
| `water_actual` | decimal | Actual water production (BBL) |
| `boe_actual` | decimal | Actual BOE |
| `days_on` | int | Days on production |

**Statistics:**
- **Rows:** 62,000,000+
- **Sources:** ProCount (CLR operated), Enverus/S&P (industry)

---

### tbl_daily_production_actuals_plus_forecast

**Purpose:** Combined table with actuals transitioning to Aries forecasts at the forecast start date.

| Column | Type | Description |
|--------|------|-------------|
| `api_14` | string | 14-digit API well number |
| `propnum` | string | Aries property number |
| `production_date` | date | Calendar date |
| `oil` | decimal | Daily oil (actual or forecast) |
| `gas` | decimal | Daily gas (actual or forecast) |
| `water` | decimal | Daily water (actual or forecast) |
| `boe` | decimal | Daily BOE |
| `actual_or_forecast` | string | "Procount Actuals" or "Aries Reservoir Forecast" |
| `scenario` | string | Aries scenario name (for forecasts) |
| `qualifier` | string | Aries qualifier name (for forecasts) |

**Statistics:**
- **Rows:** 86,000,000+
- **Date Range:** Historical actuals through 2031+ forecasts
- **Key Column:** `actual_or_forecast` distinguishes data type

**Usage Pattern:**
```sql
-- Get actuals only
SELECT * FROM eds.production.tbl_daily_production_actuals_plus_forecast
WHERE actual_or_forecast = 'Procount Actuals'

-- Get forecasts only
SELECT * FROM eds.production.tbl_daily_production_actuals_plus_forecast
WHERE actual_or_forecast = 'Aries Reservoir Forecast'
```

---

## Monthly Production Tables

### tbl_monthly_production

**Purpose:** Core monthly production volumes - the primary table for monthly analysis.

| Column | Type | Description |
|--------|------|-------------|
| `api_14` | string | 14-digit API well number |
| `propnum` | string | Aries property number |
| `production_month` | date | First day of production month |
| `oil` | decimal | Monthly oil production (BBL) |
| `gas` | decimal | Monthly gas production (MCF) |
| `water` | decimal | Monthly water production (BBL) |
| `boe` | decimal | Monthly BOE |
| `days_on` | int | Days producing in month |
| `months_on` | int | Cumulative months on production |
| `cum_oil` | decimal | Cumulative oil to date |
| `cum_gas` | decimal | Cumulative gas to date |
| `cum_boe` | decimal | Cumulative BOE to date |
| `data_source` | string | Source system |
| `operated_class` | string | OP, NONOP, or NOINT |

**Statistics:**
- **Rows:** 189,000,000+
- **Wells:** Covers all CLR operated, non-op, and industry wells
- **Date Range:** Historical through current month

---

### tbl_monthly_production_all

**Purpose:** Extended monthly production with all data sources and additional attributes.

**Schema:** Same as tbl_monthly_production plus:

| Column | Type | Description |
|--------|------|-------------|
| `gross_oil` | decimal | Gross oil before royalties |
| `gross_gas` | decimal | Gross gas before royalties |
| `net_oil` | decimal | Net oil after royalties |
| `net_gas` | decimal | Net gas after royalties |
| `ngl` | decimal | Natural gas liquids (BBL) |
| `condensate` | decimal | Condensate production (BBL) |

**Statistics:**
- **Rows:** 477,000,000+
- **Note:** Includes more granular production breakdowns

---

### tbl_monthly_production_plus_forecast

**Purpose:** Combined monthly actuals and Aries forecasts, and Novi/Enverus forecasts for OSO/NOINT wells- the largest production table.

| Column | Type | Description |
|--------|------|-------------|
| `api_14` | string | 14-digit API well number |
| `propnum` | string | Aries property number |
| `production_month` | date | Month of production |
| `oil` | decimal | Monthly oil |
| `gas` | decimal | Monthly gas |
| `water` | decimal | Monthly water |
| `boe` | decimal | Monthly BOE |
| `actual_or_forecast` | string | Data type indicator |
| `scenario` | string | Aries scenario (forecasts) |
| `qualifier` | string | Aries qualifier (forecasts) |
| `forecast_start_date` | date | When forecast begins |

**Statistics:**
- **Rows:** 719,000,000+
- **Date Range:** Historical through 2075
- **Scenarios:** Inherits from eds.resource_dev scenario architecture

**Key Insight:** Forecast data extends 50+ years for economic modeling. Use scenario/qualifier to select appropriate forecast version.

---

### tbl_macro_production

**Purpose:** Aggregated production at higher organizational levels (asset team, district, project).

| Column | Type | Description |
|--------|------|-------------|
| `asset_team` | string | WILLISTON, ANADARKO, PERMIAN, POWDER RIVER |
| `district` | string | District within asset team |
| `production_month` | date | Month |
| `total_oil` | decimal | Aggregated oil production |
| `total_gas` | decimal | Aggregated gas production |
| `total_boe` | decimal | Aggregated BOE |
| `well_count` | int | Number of producing wells |
| `operated_class` | string | OP or NONOP aggregation level |

**Statistics:**
- **Rows:** 45,000,000+
- **Aggregation:** By asset_team, district, and time

---

### tbl_macro_production_with_forecast

**Purpose:** Macro-level production including future forecasts for portfolio planning.

**Schema:** Same as tbl_macro_production plus forecast columns.

**Statistics:**
- **Rows:** 63,000,000+
- **Use Case:** Corporate-level production planning and forecasting

---

## Data Sources

| Source | Description | Coverage |
|--------|-------------|----------|
| **ProCount** | CLR internal production accounting | OP wells, real-time |
| **Enverus** | Third-party industry data | All US wells |
| **S&P** | Standard & Poor's production data | Industry benchmark |
| **NDIC** | North Dakota Industrial Commission | ND state data |
| **Aries** | Internal economic/forecast system | CLR forecasts |
| **Novi Labs** | ML-based forecasts | Predictive analytics |

---

## Column Categories (From Data Dictionary)

The EDS Production dictionary contains **305 columns** organized into these categories:

### Identifier Columns
- `api_14`, `propnum`, `merrick_id`, `land_well_id`
- Used for joining to other EDS tables

### Date/Time Columns
- `production_date`, `production_month`, `first_prod_date`
- `forecast_start_date`, `last_prod_date`

### Actual Production Columns
- `oil`, `gas`, `water`, `boe`
- `cum_oil`, `cum_gas`, `cum_water`, `cum_boe`
- `days_on`, `months_on`

### Forecast Columns
- `oil_forecast`, `gas_forecast`, `water_forecast`
- `actual_or_forecast` flag
- `scenario`, `qualifier`

### Gross/Net Columns
- `gross_oil`, `gross_gas`, `gross_boe`
- `net_oil`, `net_gas`, `net_boe`
- Based on working interest (WI) and net revenue interest (NRI)

### Period Production Columns
- `oil_3mo`, `oil_6mo`, `oil_12mo`, `oil_24mo`
- Same pattern for gas and BOE
- Pre-calculated cumulative periods for analysis

### Rate Columns
- `oil_rate`, `gas_rate`, `water_rate`
- `gor` (gas-oil ratio), `wor` (water-oil ratio)

---

## Key Relationships

### To eds.well.tbl_well_summary

```sql
-- Join production to well attributes
SELECT w.well_name, w.asset_team, w.formation,
       p.production_month, p.oil, p.gas, p.boe
FROM eds.production.tbl_monthly_production p
JOIN eds.well.tbl_well_summary w
  ON p.api_14 = w.api_14
WHERE w.operated_class = 'OP'
```

### To eds.resource_dev Forecast Tables

```sql
-- Compare production actuals to forecasts
SELECT
    p.api_14,
    p.production_month,
    p.oil as actual_oil,
    f.oil_forecast as forecast_oil,
    (p.oil - f.oil_forecast) as variance
FROM eds.production.tbl_monthly_production p
JOIN eds.resource_dev.tbl_pdp_daily_forecasts f
  ON p.propnum = f.propnum
  AND p.production_month = DATE_TRUNC('month', f.production_date)
WHERE p.actual_or_forecast = 'Procount Actuals'
```

### To epw.aries_evergreen.ac_property

```sql
-- Get Aries economic data for producing wells
SELECT p.propnum, p.oil, p.gas,
       a.g_ult_oil as eur_oil,
       a.pw_bfit_net as pv10
FROM eds.production.tbl_monthly_production p
JOIN epw.aries_evergreen.ac_property a
  ON p.propnum = a.propnum
```

---

## Usage Patterns

### Get Monthly Production Trend for Asset Team

```sql
SELECT
    DATE_TRUNC('month', production_month) as month,
    SUM(oil) as total_oil,
    SUM(gas) as total_gas,
    SUM(boe) as total_boe,
    COUNT(DISTINCT api_14) as producing_wells
FROM eds.production.tbl_monthly_production p
JOIN eds.well.tbl_well_summary w ON p.api_14 = w.api_14
WHERE w.asset_team = 'WILLISTON'
  AND w.operated_class = 'OP'
  AND production_month >= '2024-01-01'
GROUP BY 1
ORDER BY 1
```

### Compare Actuals to Forecast

```sql
SELECT
    production_month,
    SUM(CASE WHEN actual_or_forecast = 'Procount Actuals' THEN boe END) as actual_boe,
    SUM(CASE WHEN actual_or_forecast = 'Aries Reservoir Forecast' THEN boe END) as forecast_boe
FROM eds.production.tbl_monthly_production_plus_forecast
WHERE propnum IN (SELECT propnum FROM eds.well.tbl_well_summary WHERE operated_class = 'OP')
GROUP BY production_month
ORDER BY production_month
```

### Decline Curve Analysis

```sql
SELECT
    months_on,
    AVG(oil) as avg_oil,
    AVG(gas) as avg_gas,
    AVG(boe) as avg_boe,
    COUNT(*) as well_months
FROM eds.production.tbl_monthly_production p
JOIN eds.well.tbl_well_summary w ON p.api_14 = w.api_14
WHERE w.operated_class = 'OP'
  AND w.asset_team = 'WILLISTON'
  AND w.first_prod_year >= 2020
  AND months_on BETWEEN 1 AND 60
GROUP BY months_on
ORDER BY months_on
```

---

## Table Selection Guide

| Use Case                          | Recommended Table                            |
| --------------------------------- | -------------------------------------------- |
| Daily production analysis         | `tbl_daily_production`                       |
| Daily actuals only (no forecast)  | `tbl_daily_production_actuals`               |
| Daily actuals + forecast combined | `tbl_daily_production_actuals_plus_forecast` |
| Monthly production analysis       | `tbl_monthly_production`                     |
| Monthly with all sources          | `tbl_monthly_production_all`                 |
| Monthly actuals + forecast        | `tbl_monthly_production_plus_forecast`       |
| Portfolio-level production        | `tbl_macro_production`                       |
| Portfolio planning with forecast  | `tbl_macro_production_with_forecast`         |

---

## Notes & Observations

1. **Actual vs Forecast Distinction:**
   - Use `actual_or_forecast` column to filter
   - "Procount Actuals" = real production data
   - "Aries Reservoir Forecast" = projected production

2. **Date Range Considerations:**
   - Some historical dates (1900-01-01) are placeholders
   - Forecast dates extend to 2075 for economic modeling
   - Filter by `actual_or_forecast` for meaningful analysis

3. **BOE Calculation:**
   - Standard conversion: BOE = Oil + Gas/6
   - Consistent across all production tables

4. **Data Source Priority:**
   - CLR Operated: ProCount (primary)
   - Non-Operated: Varies by source
   - Industry: Enverus/S&P

5. **Relationship to Resource Dev:**
   - Production tables contain **actuals**
   - Resource dev tables contain **forecasts and economics**
   - Combined tables bridge both for analysis

6. **Performance Considerations:**
   - Monthly tables are large (189M - 719M rows)
   - Always filter by operated_class, asset_team, or date range
   - Use propnum/api_14 indexes for joins

---

*Last Updated: January 2026*
