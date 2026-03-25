# CLR_DSO_INFO

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".clr_dso_info` |
| **Title** | Aries EG DSO Information |
| **Alias** | DS |
| **Column Count** | 32 |

## Description

Captures projected DSO dates to allow alignment of capital spending from Aries with Planning. Table Alias: DS

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `propnum` | One record per well |
| **Foreign Key** | `propnum` | References AC_PROPERTY |

## Column Reference

| Column | Data Type | Description |
|--------|-----------|-------------|
| `row_id` | `string` |  |
| `source_table_id` | `bigint` |  |
| `propnum` | `string` | The Aries property number is the unique identifier for the Aries database that is system generated t... |
| `drill_obligation_type` | `string` |  |
| `drill_obligation_year` | `bigint` |  |
| `proj_art_lift1_date` | `timestamp` |  |
| `proj_art_lift2_date` | `timestamp` |  |
| `proj_drillout_date` | `timestamp` |  |
| `proj_facility_date` | `timestamp` |  |
| `proj_inter2_date` | `timestamp` |  |
| `proj_inter_date` | `timestamp` |  |
| `proj_lateral_date` | `timestamp` |  |
| `proj_post_end` | `timestamp` |  |
| `proj_post_start` | `timestamp` |  |
| `proj_put_ol_date` | `timestamp` |  |
| `proj_rig_release` | `timestamp` |  |
| `proj_site_const` | `timestamp` |  |
| `proj_spud_date` | `timestamp` |  |
| `proj_stim_end_date` | `timestamp` |  |
| `proj_stim_start_date` | `timestamp` |  |
| `proj_tubing_date` | `timestamp` |  |
| `schedule_version` | `string` |  |
| `row_active_ind` | `string` |  |
| `row_deleted_ind` | `string` |  |
| `row_eff_begin_date` | `timestamp` |  |
| `row_eff_end_date` | `timestamp` |  |
| `row_eff_change_date` | `timestamp` |  |
| `row_changed_by` | `string` |  |
| `row_changed_date` | `timestamp` |  |
| `row_created_by` | `string` |  |
| `row_created_date` | `timestamp` |  |
| `cdc_type` | `bigint` |  |

## Relationships


| Related Table | Relationship | Join Key |
|---------------|--------------|----------|
| AC_PROPERTY | One-to-One | `propnum` |

### Example Query

```sql
SELECT
    p.propnum, p.well_name,
    d.dso_date, d.capital_amount
FROM epw.aries_evergreen.ac_property p
LEFT JOIN epw.aries_evergreen.clr_dso_info d
    ON p.propnum = d.propnum
WHERE d.dso_date >= '2024-01-01'
```


## CLR-Specific Usage

This table aligns Aries capital spending with Planning/Finance:

- **DSO dates**: Development Schedule Optimization dates
- **Capital timing**: When capital is expected to be spent
- **Budget alignment**: Links to SAP/financial systems

