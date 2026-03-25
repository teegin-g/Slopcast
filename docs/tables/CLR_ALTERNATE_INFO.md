# CLR_ALTERNATE_INFO

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".clr_alternate_info` |
| **Title** | Aries EG CLR Alternate Info |
| **Alias** | AI_____ |
| **Column Count** | 48 |

## Description

This table captures alternate working interests, OPC, and projected dates (spud, big rig, stim, start, etc.). These alternate data points are used to help determine if CLR will participate in future wells, participate in proposed acquisitions, etc. You can only have one entry per Propnum in the Alternate Info table.This table is, also, used to notate if Corporate Planning should be using other interests besides what is in the AC_PROPERTY table for the planning run that is done monthly. The ariesevergreen.dbo.clr_alternate_info.cp_flag_y_n (Aries EG Corporate Planning Flag Y/N) must equal "Y" in order for Corporate Planning to know to use this table instead of the AC_PROPERTY for alternate interest or capex values. Table Alias: AI_____

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `propnum` | One record per well |
| **Foreign Key** | `propnum` | References AC_PROPERTY |

## Column Reference

| Column | Data Type | Description |
|--------|-----------|-------------|
| `row_id` | `string` | Represents clr row identification number |
| `source_table_id` | `bigint` | Represents the table identification number |
| `propnum` | `string` | The Aries property number is the unique identifier for the Aries database that is system generated t... |
| `alt_capex` | `decimal(38,6)` | Total estimated approved cost for drilling and completion of a well. Allows for a comparison between... |
| `alt_clr_nri` | `decimal(38,6)` | Net Revenue Interest (NRI)Net Revenue Interest (NRI) is the portion of production remaining after de... |
| `alt_clr_wi` | `decimal(38,6)` | Working Interest (WI)Working interest (WI) is the percentage of ownership in an oil and gas lease gr... |
| `alt_gas_diff` | `decimal(38,6)` | can be used as an @macro if an alternate value is needed. |
| `alt_loe` | `decimal(38,6)` | In the context of oil and gas industry transaction documents, LOE is generally used as a catch-all f... |
| `alt_nri_apo` | `decimal(38,6)` | The net revenue interest amount at the point at which all costs of leasing, exploring, drilling and ... |
| `alt_nri_bpo` | `decimal(38,6)` | The period where to cost of leasing, exploring, drilling and operating have not been fully recovered... |
| `alt_oil_diff` | `decimal(38,6)` | can be used as an @macro if an alternate value is needed. |
| `alt_opc_gas` | `decimal(38,6)` | the operating cost per mcf of gas.  can be used as an @macro if an alternate value is needed. |
| `alt_opc_oil` | `decimal(38,6)` | the operating cost per barrel of oil.  can be used as an @macro if an alternate value is needed. |
| `alt_opc_water` | `decimal(38,6)` | the operating cost per barrel of water.  can be used as an @macro if an alternate value is needed.  |
| `alt_other_nri` | `decimal(38,6)` | Net Revenue Interest (NRI)Net Revenue Interest (NRI) is the portion of production remaining after de... |
| `alt_other_wi` | `decimal(38,6)` | Working Interest (WI)Working interest (WI) is the percentage of ownership in an oil and gas lease gr... |
| `alt_pay` | `decimal(38,6)` | an additional payout field for double reversions or other special cases.  the name is kept short int... |
| `alt_pool_nri` | `decimal(38,6)` | Net Revenue Interest (NRI)Net Revenue Interest (NRI) is the portion of production remaining after de... |
| `alt_pool_wi` | `decimal(38,6)` | Working Interest (WI)Working interest (WI) is the percentage of ownership in an oil and gas lease gr... |
| `alt_proj_big_rig` | `timestamp` | Estimated start date based upon the published DSO schedule in which the big rig will commence drilli... |
| `alt_proj_rig_rel` | `timestamp` | Estimated date based upon the published DSO schedule in which the drilling rig will be released from... |
| `alt_proj_spud` | `timestamp` | Estimated date based upon the published DSO schedule in which the spudder rig or big rig will initia... |
| `alt_proj_start` | `timestamp` | Estimated date based upon the published DSO schedule in which the well begin to produce hydrocarbons... |
| `alt_proj_stim` | `timestamp` | Estimated date based upon the published DSO schedule in which the stim ops will commence. Synonyms a... |
| `alt_roy_burden` | `decimal(38,6)` | can be used as an @macro if an alternate value is needed. |
| `alt_wi_apo` | `decimal(38,6)` | The working interest amount at the point at which all costs of leasing, exploring, drilling and oper... |
| `alt_wi_bpo` | `decimal(38,6)` | The period where to cost of leasing, exploring, drilling and operating have not been fully recovered... |
| `alt_wi_capex` | `decimal(38,6)` | for capex, only netting of capital. such as in a carry situation where the capital needs a different... |
| `close_date` | `timestamp` | a close of deal date for unique deal structures. |
| `cost_alias` | `string` | A well's estimated CAPEX (capital expenditure) profile based on project, target formation, lateral l... |
| `cp_flag_y_n` | `string` | flag that notates cases for corporate planning that have non-standard interest set-ups and lets corp... |
| `cwc_alt_int` | `decimal(38,6)` | can be used as an @macro if an alternate value is needed. |
| `description` | `string` | can be used to describe what the values in the other columns are representing.  this column is used ... |
| `election_due` | `timestamp` |  |
| `misc_alias` | `string` | currently this is field is being used for the project name alias (20 characters or less).until aries... |
| `purpose` | `string` | the purpose of this set of attributes. can be used to identify back in after payout wells and specia... |
| `rsv_domain_alias` | `string` | A geographically defined area that has been found to possess the same geologic and/or reservoir comp... |
| `update_date` | `timestamp` | a date field to say when was the last time that interests to be used by corporate planning were upda... |
| `row_active_ind` | `string` | Represents the row active status |
| `row_deleted_ind` | `string` | Represents the row deleted status |
| `row_eff_begin_date` | `timestamp` | Represents the row effective begin date |
| `row_eff_end_date` | `timestamp` | Represents the row effective end date |
| `row_eff_change_date` | `timestamp` | Represents the row effective change date |
| `row_changed_by` | `string` | Represents the row changed by |
| `row_changed_date` | `timestamp` | Represents the row changed date |
| `row_created_by` | `string` | Represents the row created by |
| `row_created_date` | `timestamp` | Represents the row created date |
| `cdc_type` | `bigint` | Represents the cdc type |

## Relationships


| Related Table | Relationship | Join Key |
|---------------|--------------|----------|
| AC_PROPERTY | One-to-One | `propnum` |

### Example Query

```sql
SELECT
    p.propnum, p.well_name,
    a.alternate_wi, a.alternate_nri
FROM epw.aries_evergreen.ac_property p
LEFT JOIN epw.aries_evergreen.clr_alternate_info a
    ON p.propnum = a.propnum
WHERE p.op_nonop = 'NONOP'
```


## CLR-Specific Usage

This table captures alternate assumptions for non-operated wells and participation analysis:

- **Alternate WI/NRI**: Different ownership scenarios
- **Alternate OPC rates**: Different operating cost assumptions
- **Projected dates**: Spud, rig, stim, start dates

Used by OSO (Outside-operated) team for participation decisions.

