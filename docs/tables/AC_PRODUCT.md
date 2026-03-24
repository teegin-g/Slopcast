# AC_PRODUCT

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".ac_product` |
| **Title** | Aries EG Monthly Production Table (Historical) |
| **Alias** | MPMost |
| **Column Count** | 36 |

## Description

Aries historical monthly production (actuals) table. Data is stored in a monthly format with records for each month. This is customizable and extendable. The unique keys in this table are a combination of PROPNUM and P_DATE. Table Alias: MPMost

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `propnum`, `p_date` | Well + production month |
| **Foreign Key** | `propnum` | References AC_PROPERTY |

## Column Reference

| Column | Data Type | Title | Description |
|--------|-----------|-------|-------------|
| `air_injection` | `decimal(18,2)` | Aries EG Air Injection | The cumulative air that was injected into the well for the referenced month. |
| `boe` | `double` | Aries EG BOE | The gross cumulative barrels of oil equivalent (BOE) production, measured in Bbl... |
| `butane` | `double` | Aries EG Butane | The gross cumulative butane production for the referenced month. |
| `created_dt` | `timestamp` | Aries EG Created Date | The date the entry was created. |
| `days_on` | `double` | Aries EG Days On | The number of days the well was online for the month referenced. |
| `eor_gas_inj` | `double` | Aries EG EOR Gas Injection |  |
| `eor_gas_prod` | `double` | Aries EG EOR Gas Production |  |
| `eor_gas_recovered` | `double` | Aries EG EOR Gas Recovered |  |
| `eor_gor` | `double` | Aries EG EOR GOR |  |
| `ethane` | `double` | Aries EG Ethane | The gross cumulative ethane production for the referenced month. |
| `gas` | `double` | Aries EG Gas Sold | The gross cumulative gas sold, measured in Mcf, for the referenced month. |
| `gas_flared` | `double` | Aries EG Gas Flared | The gross cumulative gas flared, measured in Mcf, for the referenced month. |
| `gas_prod` | `double` | Aries EG Gas Prod | The gross cumulative gas production, measured in Mcf, for the referenced month. |
| `gor` | `double` | Aries EG GOR | The gas oil ratio (GOR) for the month referenced. |
| `gor_scf_bbl` | `double` | Aries EG GOR SCF BBL | See related term. |
| `gravity` | `double` | Aries EG Gravity (Not Used) |  |
| `ngl` | `double` | Aries EG NGL (Not Used) | The gross cumulative NGL production, measured in units (U), for the referenced m... |
| `oil` | `double` | Aries EG Oil | The gross cumulative oil production, measured in Bbl, for the referenced month. |
| `p_con` | `double` | Aries EG P Con (Not Used) | Currently not being used. |
| `p_date` | `timestamp` | Aries EG P Date | The date that the monthly production was recorded for. The date always reference... |
| `producing_method` | `varchar(40)` | Aries EG Producing Method | The last method of production for the referenced month. |
| `propane` | `double` | Aries EG Propane | The gross cumulative propane production for the referenced month. |
| `propnum` | `varchar(12)` | Aries EG Propnum |  |
| `simulated_gas` | `decimal(18,2)` | Aries EG Simulated Gas (Not Used) |  |
| `simulated_oil` | `decimal(18,2)` | Aries EG Simulated Oil (Not Used) |  |
| `sulfur` | `double` | Aries EG Sulfur | The gross cumulative sulfur production for the referenced month. |
| `updated_by` | `varchar(100)` | Updated By |  |
| `updated_dt` | `timestamp` | Aries EG Updated Date | The date the entry was updated. |
| `usr1` | `double` | Aries EG User 1 | Free text field for user to record any notes for the referenced month. |
| `usr2` | `double` | Aries EG User 2 | Free text field for user to record any notes for the referenced month. |
| `usr3` | `double` | Aries EG User 3 | Free text field for user to record any notes for the referenced month. |
| `usr4` | `double` | Aries EG User 4 | Free text field for user to record any notes for the referenced month. |
| `water` | `double` | Aries EG Water | The gross cumulative water production, measured in Bbl, for the referenced month... |
| `water_cut` | `double` | Aries EG Water Cut | The water cut for the referenced month. |
| `water_injection` | `decimal(18,2)` | Aries EG Water Injection | The cumulative water that was injected into the well for the referenced month. |
| `wells` | `double` | Aries EG Wells | Number of wells associated with monthly data. |

## Relationships


| Related Table | Relationship | Join Key |
|---------------|--------------|----------|
| AC_PROPERTY | Many-to-One | `propnum` |

### Example Query

```sql
SELECT
    propnum, p_date, oil, gas, water, days_on
FROM epw.aries_evergreen.ac_product
WHERE propnum = 'WELL001'
ORDER BY p_date DESC
LIMIT 12
```
