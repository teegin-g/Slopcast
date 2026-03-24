# AC_MONTHLY

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".ac_monthly` |
| **Title** | Aries EG Monthly Table (Forecast) |
| **Alias** | EM |
| **Column Count** | 73 |

## Description

Aries economic output table that stores the forecasted monthly economic run results by month, well, and scenario. Some of the columns/attributes are listed as stream numbers and it is not obvious what they represent. You will need the Aries Help documentation (or view the table through the catalog) in order to reference these correctly. The unique keys in this table are a combination of PROPNUM, SCENARIO, and OUTDATE. This table is customizable and extendable. These outputs are not ran automatically and can be ran and pushed by Aries Evergreen users at any time. Table Alias: EM

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `propnum`, `scenario`, `outdate` | Well + scenario + month |
| **Foreign Key** | `propnum` | References AC_PROPERTY |
| **Foreign Key** | `scenario` | References AC_SCENARIO |

## Column Reference

| Column | Data Type | Title | Description |
|--------|-----------|-------|-------------|
| `g_gas_opc` | `double` | Aries EG Gross Gas Operating Cost | Gross operating expense based on the gas sold for the month multiplied by the ga... |
| `g_intang_inv` | `double` | Aries EG Gross Intangible Investment | Gross intangible investments are subjective and relate to factors like a drop in... |
| `g_ngl_opc` | `double` | Aries EG Gross NGL Operating Cost (Not U | Gross operating expense based on the natural gas liquid (NGL) sold for the month... |
| `g_ngl_sold` | `double` | Aries EG Gross NGL Sold (Not Used) | The gross natural gas liquid (NGL) sold is estimated based on the gross forecast... |
| `g_oil_opc` | `double` | Aries EG Gross Oil Operating Cost | Gross operating expense based on the oil sold for the month multiplied by the oi... |
| `g_oil_sold` | `double` | Aries EG Gross Oil Sold | The gross oil sold is estimated based on the gross forecasted oil after the WEIG... |
| `g_opc_t_fixed` | `double` | Aries EG Gross LOE (OPC/T) | Gross lease operating expense that is a monthly fixed cost. This cost can be cap... |
| `g_op_exp_all` | `double` | Aries EG Gross O/G/W + LOE Costs | The gross total operating expense for LOE (OPC/T), oil (OPC/OIL), gas (OPC/GAS),... |
| `g_op_exp_fixed` | `double` | Aries EG Gross LOE Fixed Cost | The gross regular operating expense based on the LOE (OPC/T). |
| `gor_scf_bbl` | `double` | Aries EG GOR | The gas oil ratio for the month being referenced. This is a calculated stream. |
| `gross_boe` | `double` | Aries EG Gross BOE | The forecasted gross barrel of oil equivalent (BOE) for the month referenced. Th... |
| `gross_ngl` | `double` | Aries EG Gross NGL (Not Used) | The forecasted gross natural gas liquid (NGL) production for the month reference... |
| `g_tang_inv` | `double` | Aries EG Gross Tangible Investment | Gross tangible investments pertain to money spent on concrete items such as payi... |
| `g_wtr_opc` | `double` | Aries EG Gross Water Operating Cost | Gross operating expense based on the water sold for the month multiplied by the ... |
| `g_wtr_rev` | `double` | Aries EG Gross Water Revenue | The gross water sold multiplied by the water rate. |
| `g_wtr_sold` | `double` | Aries EG Gross Water Sold | The gross water sold is estimated based on the gross forecasted water. |
| `mul_ngl` | `double` | Aries EG NGL Multiplier (Not Used) | One or more factors by which to multiply the monthly volumes for the production ... |
| `mul_wtr` | `double` | Aries EG Water Multiplier (MUL/WTR) | One or more factors by which to multiply the monthly volumes for the production ... |
| `n_aban` | `double` | Aries EG Net Abandon Cost | The net operating expense abandonment costs at TO LIFE or delayed. This is, also... |
| `net_boe_sold` | `double` | Aries EG Net BOE Sold | The forecasted net barrel of oil equivalent (BOE) sold for the month referenced.... |
| `n_gas_opc` | `double` | Aries EG Net Gas Operating Cost | Net operating expense based on the gross gas operating cost for the month multip... |
| `n_ngl_opc` | `double` | Aries EG Net NGL Operating Cost (Not Use | Net operating expense based on the gross NGL operating cost for the month multip... |
| `n_ngl_sold` | `double` | Aries EG Net NGL Sold (Not Used) | The amount of net NGL sold, also known as the appraised NGL volume, multiplied b... |
| `n_oil_opc` | `double` | Aries EG Net Oil Operating Cost | Net operating expense based on the gross oil operating cost for the month multip... |
| `n_op_exp_fixed` | `double` | Aries EG Net LOE Fixed Cost | The appraised regular operating expense from the LOE (OPC/T). |
| `n_plug` | `double` | Aries EG Net Plugging Cost | The net operating expense for plugging costs at TO LIFE or delayed. This is, als... |
| `n_salv` | `double` | Aries EG Net Salvage Reimbursement | The net operating expense for salvage reimbursement at TO LIFE or delayed. This ... |
| `n_tot_sev` | `double` | Aries EG Net Total Severance Tax | Appraised total severance tax. |
| `n_wtr_opc` | `double` | Aries EG Net Water Operating Cost | Net operating expense based on the gross water operating cost for the month mult... |
| `n_wtr_rev` | `double` | Aries EG Net Water Revenue | The net water sold, also known as appraised water volume, multiplied by the wate... |
| `n_wtr_sold` | `double` | Aries EG Net Water Sold | The amount of net water sold, also known as the appraised water volume, multipli... |
| `opc_gas_rate` | `double` | Aries EG Operating Cost Rate Gas (OPC/GA | Operating cost rate for gas. Generally, this is a monthly variable cost. This co... |
| `opc_ngl_rate` | `double` | Aries EG Operating Cost Rate NGL (Not Us | Operating cost rate for NGL. Generally, this is a monthly variable cost. This co... |
| `opc_oil_rate` | `double` | Aries EG Operating Cost Rate Oil (OPC/OI | Operating cost rate for oil. Generally, this is a monthly variable cost. This co... |
| `opc_wtr_rate` | `double` | Aries EG Operating Cost Rate Water (OPC/ | Operating cost rate for water. Generally, this is a monthly variable cost. This ... |
| `outdate` | `timestamp` | Aries EG Outdate | This is the monthly forecast date. This date reflects the last day of the month ... |
| `pri_adj_ngl` | `double` | Aries EG Price Adjustment NGL (Not Used) | Price adjustment for NGL, also known as the NGL differential. This value can be ... |
| `pri_ngl` | `double` | Aries EG NGL Price (Not Used) | The price of natural gas liquid (NGL) for the forecasted month.Currently not bei... |
| `pri_wtr` | `double` | Aries EG Water Price (PRI/WTR) | The price of water for the forecasted month. |
| `propnum` | `varchar(12)` | Aries EG Propnum | See related term. |
| `pw_n_tot_bfit` | `double` | Aries EG Net Present Worth Total BFIT | Monthly net present worth total before federal income taxes. |
| `s1062` | `double` | Aries EG Net O/G/W + LOE Costs | The appraised total of the net operating expenses. This includes LOE and the ope... |
| `s1064` | `double` | Aries EG Ad Valorem Tax | Appraised Ad Valorem Tax. |
| `s1065` | `double` | Aries EG Net Total Expense | The appraised total of the net operating expenses. This includes LOE, Ad Valorem... |
| `s1069` | `double` | Aries EG BFIT After NPI | The total appraised BFIT profit after NPI. This is, also, known as BFIT Profit A... |
| `s165` | `double` | Aries EG Oil Multiplier (MUL/OIL) | One or more factors (MUL/OIL) by which to multiply the monthly volumes for the p... |
| `s166` | `double` | Aries EG Gas Multiplier (MUL/GAS) | One or more factors by which to multiply the monthly volumes for the production ... |
| `s195` | `double` | Aries EG Oil Price (PRI/OIL) | The price of oil for the forecasted month. |
| `s196` | `double` | Aries EG Gas Price (PRI/GAS) | The price of gas for the forecasted month. |
| `s237` | `double` | Aries EG Price Adjustment Oil (PAJ/OIL) | Price adjustment for oil, also known as the oil differential. This value can be ... |
| `s238` | `double` | Aries EG Price Adjustment Gas (PAJ/GAS) | Price adjustment for gas, also known as the gas differential. This value can be ... |
| `s370` | `double` | Aries EG Gross Oil | The forecasted gross oil production (in barrels) for the month referenced. |
| `s371` | `double` | Aries EG Gross Gas | The forecasted gross gas (GAS) production (in MCF) for the month referenced. |
| `s376` | `double` | Aries EG Gross Water | The forecasted gross water (WTR) production (in barrels) for the month reference... |
| `s392` | `double` | Aries EG Gross Gas Sold | The gross gas sold is estimated based on the gross forecasted gas after the WEIG... |
| `s750` | `decimal(18,2)` | Aries EG Working Interest Tangible Inves | Total of all tangible investments categories; total tangible capex. |
| `s751` | `decimal(18,2)` | Aries EG Working Interest Intangible Inv | Total of all intangible investments categories; total intangible capex. |
| `s753` | `double` | Aries EG Working Interest Oil Sold | The amount of gross oil sold multiplied by the working interest. |
| `s754` | `double` | Aries EG Working Interest Gas Sold | The amount of gross gas sold multiplied by the working interest. |
| `s815` | `double` | Aries EG Net Oil Sold | The amount of net oil sold, also known as the appraised oil volume, multiplied b... |
| `s816` | `double` | Aries EG Net Gas Sold | The amount of net gas sold, also known as the appraised gas volume, multiplied b... |
| `s846` | `double` | Aries EG Net Oil Revenue | The net oil sold, also known as appraised oil volume, multiplied by the oil rate... |
| `s847` | `double` | Aries EG Net Gas Revenue | The net gas sold, also known as appraised gas volume, multiplied by the gas rate... |
| `s850` | `double` | Aries EG Net NGL Revenue (Not Used) | The net NGL sold, also known as appraised NGL volume, multiplied by the NGL rate... |
| `s861` | `double` | Aries EG Net Revenue All - O/G/W | The sum of the net oil, gas and water revenue. The total net revenue is, also, k... |
| `s892` | `double` | Aries EG Net Revenue After Severance Tax | The net production revenue minus the net total severance tax. |
| `scenario` | `varchar(20)` | Aries EG Scenario | See related term. |
| `stx_gas_rate` | `double` | Aries EG Severance Gas Tax Rate | Gas severance taxes (OPC/GAS) are levied by the various states based on gas prod... |
| `stx_ngl_rate` | `double` | Aries EG Severance NGL Tax Rate (Not Use | NGL severance taxes (OPC/NGL) are levied by the various states based on NGL prod... |
| `stx_oil_rate` | `double` | Aries EG Severance Oil Tax Rate | Oil severance taxes (OPC/OIL) are levied by the various states based on oil prod... |
| `water_cut` | `double` | Aries EG Water Cut | The water cut for the referenced month. This is a calculated stream. |
| `wi_ngl_sold` | `double` | Aries EG Working Interest NGL Sold (Not  | The amount of gross NGL sold multiplied by the working interest. |
| `wi_wtr_sold` | `double` | Aries EG Working Interest Water Sold | The amount of gross water sold multiplied by the working interest. |

## Relationships


| Related Table | Relationship | Join Key |
|---------------|--------------|----------|
| AC_PROPERTY | Many-to-One | `propnum` |
| AC_SCENARIO | Many-to-One | `scenario` |

### Example Query

```sql
SELECT
    m.propnum, m.scenario, m.outdate,
    m.s371 as gross_gas, m.s392 as gross_gas_sold,
    m.s847 as net_gas_revenue
FROM epw.aries_evergreen.ac_monthly m
WHERE m.scenario = 'BASE'
  AND m.outdate >= '2024-01-01'
ORDER BY m.propnum, m.outdate
```


## Stream Number Reference

Many columns in AC_MONTHLY are named by stream number. Key mappings:

| Stream | Column | Description |
|--------|--------|-------------|
| S166 | `s166` | Gas Multiplier (MUL/GAS) |
| S196 | `s196` | Gas Price (PRI/GAS) |
| S238 | `s238` | Price Adjustment Gas (PAJ/GAS) |
| S371 | `s371` | Gross Gas |
| S392 | `s392` | Gross Gas Sold |
| S754 | `s754` | Working Interest Gas Sold |
| S816 | `s816` | Net Gas Sold |
| S847 | `s847` | Net Gas Revenue |
| S861 | `s861` | Net Revenue All (O/G/W) |
| S1062 | `s1062` | Net O/G/W + LOE Costs |
| S1065 | `s1065` | Net Total Expense |

## Usage Notes

- Results are calculated by the Aries economic engine
- Not automatically generated - must be run/pushed by users
- One row per property × scenario × month

