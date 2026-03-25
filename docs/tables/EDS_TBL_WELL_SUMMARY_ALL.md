# EDS Well Summary All (tbl_well_summary_all)

## Table Overview

| Attribute | Value |
|-----------|-------|
| **Full Name** | `eds.well.tbl_well_summary_all` |
| **Row Count** | ~4.6M wells |
| **Description** | One-line well summary for ALL wells in the Lower 48 (L48). Completely unfiltered version of tbl_well_summary. |
| **Primary Use** | Industry benchmarking, macro analysis, M&A screening |
| **Contact** | enterpriseanalytics@clr.com |

## Key Differences from tbl_well_summary

| Aspect | tbl_well_summary | tbl_well_summary_all |
|--------|------------------|----------------------|
| **Row Count** | ~1.67M | ~4.6M |
| **Scope** | Horizontal wells in CLR areas | All L48 wells |
| **Filtering** | Filtered to areas of interest | Unfiltered |
| **Performance** | Better for routine queries | Requires careful query optimization |
| **Unique APIs** | ~1.66M | ~4.6M |

## Additional Columns (Only in tbl_well_summary_all)

| Column | Type | Description |
|--------|------|-------------|
| `cum_boe_12mo_per_ft` | decimal(38,6) | 12-month cumulative BOE per foot of lateral |
| `cum_gas_12mo_per_ft` | decimal(38,6) | 12-month cumulative gas per foot of lateral |
| `cum_oil_12mo_per_ft` | decimal(38,6) | 12-month cumulative oil per foot of lateral |

## Data Type Differences

Some columns have slightly different data types between the two tables:

| Column | tbl_well_summary | tbl_well_summary_all |
|--------|------------------|----------------------|
| `completion_date` | date | timestamp |
| `first_prod_date` | date | timestamp |
| `permit_date` | date | timestamp |
| `rig_release_date` | date | timestamp |
| `spud_date` | date | timestamp |
| `well_test_date` | date | timestamp |
| `well_test_oil_gravity` | decimal(38,6) | double |
| `nri` | decimal(38,6) | double |
| `wi` | decimal(38,6) | double |

## Important Notes from Data Dictionary

From the official documentation:

> "This table is just completely unfiltered so you must account for the record size when using in downstream tools and processes."

> "Note: eds.well.tbl_well_summary_all sources API and propnum from eds.well_stage_tbl_well_header (Aries/AriesPublic) and does not include some future wells that are present in eds.well.tbl_well_summary."

> "For a 1:1 match with ods.ariesevergreen.ac_property at the well/propnum level, use tbl_well_summary as the primary source and, if additional attributes from tbl_well_summary_all are needed, join Aries on api, propnum, and fka_propnum."

## Usage Recommendations

### When to Use tbl_well_summary_all

1. **Industry-wide Analysis**: Benchmarking across all operators
2. **Basin Studies**: Complete coverage of specific basins
3. **M&A Due Diligence**: Evaluating acquisition targets
4. **Competition Analysis**: Full operator comparisons
5. **Geographic Studies**: Complete L48 coverage

### When to Use tbl_well_summary Instead

1. **CLR Well Analysis**: Focus on operated/non-op wells
2. **Routine Reporting**: Better performance
3. **Aries Integration**: Better propnum coverage
4. **Future Well Planning**: Includes future wells

### Query Performance Tips

```sql
-- Always use filters to reduce data scanned
SELECT *
FROM eds.well.tbl_well_summary_all
WHERE state = 'NORTH DAKOTA'
  AND basin = 'WILLISTON'
  AND wellbore_direction = 'HORIZONTAL'
LIMIT 1000

-- Use aggregations at the database level
SELECT
    basin,
    operator_short,
    COUNT(*) as well_count,
    AVG(eur_boe) as avg_eur
FROM eds.well.tbl_well_summary_all
WHERE eur_boe IS NOT NULL
GROUP BY basin, operator_short
ORDER BY well_count DESC
```

## Schema Reference

This table has the same schema as `tbl_well_summary` (162 common columns) plus 3 additional per-foot normalization columns. See [EDS_TBL_WELL_SUMMARY.md](EDS_TBL_WELL_SUMMARY.md) for complete column documentation.

## Column Categories

All columns are documented in the main well summary table, plus:

### Additional Normalization Columns

| Column | Type | Description |
|--------|------|-------------|
| `cum_boe_12mo_per_ft` | decimal(38,6) | 12-month cumulative BOE normalized by lateral length |
| `cum_gas_12mo_per_ft` | decimal(38,6) | 12-month cumulative gas normalized by lateral length |
| `cum_oil_12mo_per_ft` | decimal(38,6) | 12-month cumulative oil normalized by lateral length |

## Statistics

### Distribution by Operated Class

| Operated Class | Well Count | % of Total |
|----------------|------------|------------|
| NOINT | ~4.58M | 99.6% |
| OP | ~9,400 | 0.2% |
| NONOP | varies | 0.2% |

Note: The operated well counts differ from tbl_well_summary due to different filtering logic and data sources.

### Top Basins by Well Count

Complete L48 coverage with all major basins represented.

## Table Relationships

Same relationships as tbl_well_summary:

| Related Table | Join Key | Notes |
|---------------|----------|-------|
| `epw.aries_evergreen.ac_property` | `propnum` | For CLR wells |
| `eds.production.tbl_monthly_production_all` | `api_14` | Monthly production |
| `eds.completions.*` | `api_14` | Completion details |

## Join Strategy with Aries

Per the documentation, for best Aries integration:

```sql
-- Start with tbl_well_summary for CLR wells
SELECT
    ws.*,
    wsa.cum_boe_12mo_per_ft  -- Additional normalized columns
FROM eds.well.tbl_well_summary ws
LEFT JOIN eds.well.tbl_well_summary_all wsa
    ON ws.api_14 = wsa.api_14
WHERE ws.propnum IS NOT NULL
```

## Related Documentation

- [EDS Well Summary](EDS_TBL_WELL_SUMMARY.md) - Filtered version (recommended for most use cases)
- [AC_PROPERTY](AC_PROPERTY.md) - Aries master well header
