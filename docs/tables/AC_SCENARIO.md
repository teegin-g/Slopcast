# AC_SCENARIO

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".ac_scenario` |
| **Title** | Aries EG Scenario |
| **Alias** | SCENARIO______ |
| **Column Count** | 26 |

## Description

Table that contains the scenarios that have been used in the database. Table Alias: SCENARIO______

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `scenario` | Unique scenario name |

## Column Reference

| Column | Data Type | Description |
|--------|-----------|-------------|
| `row_id` | `string` |  |
| `source_table_id` | `bigint` |  |
| `data_sect` | `bigint` |  |
| `dbskey` | `string` |  |
| `scen_name` | `string` |  |
| `owner` | `string` |  |
| `qual0` | `string` |  |
| `qual1` | `string` |  |
| `qual2` | `string` |  |
| `qual3` | `string` |  |
| `qual4` | `string` |  |
| `qual5` | `string` |  |
| `qual6` | `string` |  |
| `qual7` | `string` |  |
| `qual8` | `string` |  |
| `qual9` | `string` |  |
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
| AC_MONTHLY | One-to-Many | `scenario` |
| AC_ONELINE | One-to-Many | `scenario` |

Scenarios define which qualifier combinations to use when running economics.
