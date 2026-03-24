# CLR_ATTRIBUTE

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".clr_attribute` |
| **Title** | Aries EG CLR Attribute |
| **Alias** | N/A |
| **Column Count** | 17 |

## Description

An extension of the Aries Master table (AC_PROPERTY table). Resource Development can utilize this table to build out more attributes that are not housed in the Master table. The Aries EG CLR Attribute table stores attribute data related to oil and gas properties from the Aries Evergreen reserves database. It contains information such as user-defined text, dates, and values associated with each property number.

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
| `attribute` | `string` | think of attribute as a column name. it needs to be standardized as much as possible. the attribute ... |
| `propnum` | `string` | The Aries property number is the unique identifier for the Aries database that is system generated t... |
| `user_date` | `timestamp` |  |
| `user_text` | `string` |  |
| `user_val` | `decimal(38,6)` |  |
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

This table extends AC_PROPERTY with additional CLR-specific attributes.
