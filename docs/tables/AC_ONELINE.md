# AC_ONELINE

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".ac_oneline` |
| **Title** | Aries EG Oneline Table |
| **Alias** | OL |
| **Column Count** | 139 |

## Description

The Aries Evergreen Oneline Table contains key economic and production data at the well level used for reserves analysis and forecasting in a one line per well format (per scenario). It can be joined to other Aries tables to provide additional context. This economic output table stores the “bottom line” economic run results by scenario. This table is user extendable. These outputs are not ran automatically and can be ran and pushed by Aries Evergreen users at any time. Table Alias: OL

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `propnum`, `scenario` | Well + scenario combination |
| **Foreign Key** | `propnum` | References AC_PROPERTY |
| **Foreign Key** | `scenario` | References AC_SCENARIO |

## Column Reference

| Column                 | Data Type       | Title                                    | Description                                                                         |
| ---------------------- | --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `afit_before_loans`    | `double`        | Aries EG AFIT Before Loans               | Appraised AFIT before financing payments.                                           |
| `afit_less_loans_eqty` | `double`        | Aries EG AFIT Less Loan Equity           | AFIT net after financial payments.                                                  |
| `afit_payout_pw`       | `double`        | Aries EG AFIT Payout Present Worth       | The payout present worth after federal income tax.                                  |
| `afit_pw_01`           | `double`        | Aries EG AFIT Present Worth 01           | AFIT Revenue at discount rate #1 (CLRPW - 0).                                       |
| `afit_pw_02`           | `double`        | Aries EG AFIT Present Worth 02           | AFIT Revenue at discount rate #2 (CLRPW - 5).                                       |
| `afit_pw_03`           | `double`        | Aries EG AFIT Present Worth 03           | AFIT Revenue at discount rate #3 (CLRPW - 10).                                      |
| `afit_pw_04`           | `double`        | Aries EG AFIT Present Worth 04           | AFIT Revenue at discount rate #4 (CLRPW - 15).                                      |
| `afit_pw_05`           | `double`        | Aries EG AFIT Present Worth 05           | AFIT Revenue at discount rate #5 (CLRPW - 20).                                      |
| `afit_pw_06`           | `double`        | Aries EG AFIT Present Worth 06           | AFIT Revenue at discount rate #6 (CLRPW - 25).                                      |
| `afit_pw_07`           | `double`        | Aries EG AFIT Present Worth 07           | AFIT Revenue at discount rate #7 (CLRPW - 30).                                      |
| `afit_pw_08`           | `double`        | Aries EG AFIT Present Worth 08           | AFIT Revenue at discount rate #8 (CLRPW - 35).                                      |
| `afit_pw_09`           | `double`        | Aries EG AFIT Present Worth 09           | AFIT Revenue at discount rate #9 (CLRPW - 40).                                      |
| `afit_pw_10`           | `double`        | Aries EG AFIT Present Worth 10           | AFIT Revenue at discount rate #10 (CLRPW - 50).                                     |
| `afit_pw_11`           | `double`        | Aries EG AFIT Present Worth 11           | AFIT Revenue at discount rate #11 (CLRPW - 60).                                     |
| `afit_pw_12`           | `double`        | Aries EG AFIT Present Worth 12           | AFIT Revenue at discount rate #12 (CLRPW - 70).                                     |
| `afit_pw_13`           | `double`        | Aries EG AFIT Present Worth 13           | AFIT Revenue at discount rate #13 (CLRPW - 80).                                     |
| `afit_pw_14`           | `double`        | Aries EG AFIT Present Worth 14           | AFIT Revenue at discount rate #14 (CLRPW - 90).                                     |
| `afit_pw_15`           | `double`        | Aries EG AFIT Present Worth 15           | AFIT Revenue at discount rate #15 (CLRPW - 100).                                    |
| `afit_pw_to_inv`       | `double`        | Aries EG AFIT PV/I                       | This field is capturing the AFIT discounted Income to Investment or basically th... |
| `air_injection`        | `decimal(18,2)` | Aries EG Air Injection                   | The cumulative amount of air injected into a well.                                  |
| `b1`                   | `double`        | Aries EG BFIT Present Worth 01           | BFIT Revenue at discount rate #1 (CLRPW - 0).                                       |
| `b10`                  | `double`        | Aries EG BFIT Present Worth 10           | BFIT Revenue at discount rate #10 (CLRPW - 50).                                     |
| `b11`                  | `double`        | Aries EG BFIT Present Worth 11           | BFIT Revenue at discount rate #11 (CLRPW - 60).                                     |
| `b12`                  | `double`        | Aries EG BFIT Present Worth 12           | BFIT Revenue at discount rate #12 (CLRPW - 70).                                     |
| `b13`                  | `double`        | Aries EG BFIT Present Worth 13           | BFIT Revenue at discount rate #13 (CLRPW - 80).                                     |
| `b14`                  | `double`        | Aries EG BFIT Present Worth 14           | BFIT Revenue at discount rate #14 (CLRPW - 90).                                     |
| `b15`                  | `double`        | Aries EG BFIT Present Worth 15           | BFIT Revenue at discount rate #15 (CLRPW - 100).                                    |
| `b2`                   | `double`        | Aries EG BFIT Present Worth 02           | BFIT Revenue at discount rate #2 (CLRPW - 5).                                       |
| `b3`                   | `double`        | Aries EG BFIT Present Worth 03           | BFIT Revenue at discount rate #3 (CLRPW - 10).                                      |
| `b4`                   | `double`        | Aries EG BFIT Present Worth 04           | BFIT Revenue at discount rate #4 (CLRPW - 15).                                      |
| `b5`                   | `double`        | Aries EG BFIT Present Worth 05           | BFIT Revenue at discount rate #5 (CLRPW - 20).                                      |
| `b6`                   | `double`        | Aries EG BFIT Present Worth 06           | BFIT Revenue at discount rate #6 (CLRPW - 25).                                      |
| `b7`                   | `double`        | Aries EG BFIT Present Worth 07           | BFIT Revenue at discount rate #7 (CLRPW - 30).                                      |
| `b8`                   | `double`        | Aries EG BFIT Present Worth 08           | BFIT Revenue at discount rate #8 (CLRPW - 35).                                      |
| `b9`                   | `double`        | Aries EG BFIT Present Worth 09           | BFIT Revenue at discount rate #9 (CLRPW - 40).                                      |
| `bfit_less_loans`      | `double`        | Aries EG BFIT Less Loans                 | BFIT after financing payments.                                                      |
| `bfit_less_loans_inv`  | `double`        | Aries EG BFIT Less Loans  Investments    | BFIT after financing payments and equity investments.                               |
| `depl_taken`           | `double`        | Aries EG Depletion Taken                 | If you are an independent producer or royalty owner you may qualify for percenta... |
| `depr_tang`            | `double`        | Aries EG Depreciated Tangible Investment | The appraised total tangible depreciation.                                          |
| `disc_inv_pw_01`       | `double`        | Aries EG Discounted Investment Present W | Investment discounted by the Discount Rate #1 (0.00)                                |
| `disc_inv_pw_02`       | `double`        | Aries EG Discounted Investment Present W | Investment discounted by the Discount Rate #2 (0.05)                                |
| `disc_inv_pw_03`       | `double`        | Aries EG Discounted Investment Present W | Investment discounted by the Discount Rate #3 (0.10)                                |
| `e1`                   | `double`        | Aries EG BFIT Rate of Return             | The rate of return before federal income tax. See related term.                     |
| `e2`                   | `double`        | Aries EG AFIT Rate of Return             | The rate of return after federal income tax. See related term.                      |
| `e3`                   | `double`        | Aries EG BFIT Undiscounted Project Payou | Payout in years based on the BFIT undiscounted.                                     |
| `e4`                   | `double`        | Aries EG AFIT Undiscounted Project Payou | Payout in years based on the AFIT undiscounted.                                     |
| `e5`                   | `double`        | Aries EG BFIT Discounted Project Payout  | Payout in years based on the BFIT discounted.                                       |
| `e7`                   | `double`        | Aries EG BFIT Undiscounted Net Income/In | Before federal income tax (BFIT) undiscounted net income/investment.                |
| `e8`                   | `double`        | Aries EG AFIT Undiscounted Net Income/In | After federal income tax (AFIT) undiscounted net income/investment.                 |
| `e9`                   | `double`        | Aries EG PV/I                            | Discounted Net Investment, also known as PV10/I or PV/I. Use this for a single w... |
| `finding_costs_boe`    | `decimal(15,2)` | Aries EG Finding Costs BOE               | Finding cost per barrel of oil equivalent.                                          |
| `first_gas_nri`        | `double`        | Aries EG First Gas NRI                   | The first Gas NRI value reported when the economics are run.                        |
| `first_oil_nri`        | `double`        | Aries EG First Oil NRI                   | The first Oil NRI value reported when the economics are run.                        |
| `g_gas_sold`           | `double`        | Aries EG Gross Gas Sold                  | The cumulative gross gas sold is estimated based on the gross forecasted gas aft... |
| `g_ngl_sold`           | `double`        | Aries EG Gross NGL Sold (Not Used)       | The cumulative gross natural gas liquid (NGL) sold is estimated based on the gro... |
| `g_oil_sold`           | `double`        | Aries EG Gross Oil Sold                  | The cumulative gross oil sold is estimated based on the gross forecasted oil aft... |
| `gor`                  | `double`        | Aries EG GOR                             | The gas oil ratio for the scenario being referenced. This is a calculated stream... |
| `gross_gas`            | `double`        | Aries EG Gross Gas                       | The cumulative forecasted gross gas production.                                     |
| `gross_ngl`            | `double`        | Aries EG Gross NGL (Not Used)            | The cumulative forecasted gross natural gas liquid (NGL) production.Currently no... |
| `gross_oil`            | `double`        | Aries EG Gross Oil                       | The cumulative forecasted gross oil production.                                     |
| `gross_wtr`            | `double`        | Aries EG Gross Water                     | The cumulative forecasted gross water production.                                   |
| `g_tot_eqty_inv`       | `double`        | Aries EG Gross Total Equity Investment   | The total equity investment, also known as capex, that is associated with the we... |
| `g_wtr_sold`           | `double`        | Aries EG Gross Water Sold                | The cumulative gross water sold is estimated based on the gross forecasted water... |
| `interest_capitalized` | `double`        | Aries EG Interest Capitalized            | The additional interest being paid due to accrued interest periodically applied ... |
| `interest_paid`        | `double`        | Aries EG Interest Paid                   | The cumulative amount of interest paid towards a loan.                              |
| `m1`                   | `double`        | Aries EG PV10 Discounted Rate            | The PV10 discount rate is the primary present worth discount rate in Aries.PV10 ... |
| `m101`                 | `varchar(20)`   | Aries EG Input Settings                  | An Input Setting defines global economic information that is required for an eva... |
| `m106`                 | `varchar(50)`   | Aries EG Scenario                        | See related term.                                                                   |
| `m155`                 | `decimal(15,2)` | Aries EG Gross Prior Water               | The cumulative production of water that the well has already produced prior to t... |
| `m156`                 | `decimal(15,2)` | Aries EG Gross Ultimate Water (EUR)      | The gross ultimate water, also known as the water Estimated Ultimate Recovery (W... |
| `m16`                  | `varchar(12)`   | Aries EG Run Date                        | The date in which the scenario was ran in the database.                             |
| `m160`                 | `varchar(50)`   | Aries EG Price Qualifier                 | The qualifier associated with the pricing used in the scenario.                     |
| `m18`                  | `double`        | Aries EG Gross Oil Wells                 | The number of oil wells associated with the case being ran, which is determined ... |
| `m19`                  | `double`        | Aries EG Gross Gas Wells                 | The number of gas wells associated with the case being ran, which is determined ... |
| `m21`                  | `double`        | Aries EG Gross Ultimate Oil (EUR)        | The gross ultimate oil, also known as the oil Estimated Ultimate Recovery (Oil E... |
| `m22`                  | `double`        | Aries EG Gross Ultimate Gas (EUR)        | The gross ultimate gas, also known as the gas Estimated Ultimate Recovery (Gas E... |
| `m23`                  | `double`        | Aries EG Gross Prior Oil                 | The cumulative production of oil that the well has already produced prior to the... |
| `m25`                  | `double`        | Aries EG Gross Prior Gas                 | The cumulative production of gas that the well has already produced prior to the... |
| `m27`                  | `double`        | Aries EG First Oil Price                 | The initial price of oil. This is the realized price of oil (oil price plus pric... |
| `m28`                  | `double`        | Aries EG First Gas Price                 | The initial price of gas. This is the realized price of gas (gas price plus pric... |
| `m31`                  | `double`        | Aries EG Initial Working Interest        | The initial working interest (WI) associated with the well at the time the scena... |
| `m37`                  | `double`        | Aries EG Gross Remaining BOE             | Gross remaining barrels of oil equivalent (BOE) is the estimated ultimate recove... |
| `m38`                  | `double`        | Aries EG Net Remaining BOE               | Net remaining barrels of oil equivalent (BOE) is the net estimated ultimate reco... |
| `m4`                   | `double`        | Aries EG Life of Well                    | Life of the well from the effective date. Most cap out at 50 years.                 |
| `m41`                  | `double`        | Aries EG Initial Net Revenue Interest    | The initial net revenue interest (NRI) associated with the well at the time the ... |
| `m56`                  | `varchar(100)`  | Aries EG Production Qualifier            | The qualifier associated with the production forecast used in the scenario.         |
| `m6`                   | `varchar(8)`    | Aries EG Effective Date                  | The Effective Report start date is, also, known as the Input Setting Date. This ... |
| `m7`                   | `varchar(8)`    | Aries EG Present Worth Date              | The present worth date, which is the 1st of the month.                              |
| `m8`                   | `timestamp`     | Aries EG Last Start Date                 | The last Start Date associated with the scenario when it was ran.                   |
| `m81`                  | `double`        | Aries EG Gross Ultimate BOE              | The gross ultimate barrel of oil equivalent, also known as the BOE Estimated Ult... |
| `n_gas_opc`            | `double`        | Aries EG Net Gas Operating Cost          | Net operating expense based on the gross gas operating cost for the month multip... |
| `n_gas_rev`            | `double`        | Aries EG Net Gas Revenue                 | The net gas sold, also known as appraised gas volume, multiplied by the gas rate... |
| `n_gas_sold`           | `double`        | Aries EG Net Gas Sold                    | The amount of net gas sold, also known as the appraised gas volume, multiplied b... |
| `n_ngl_opc`            | `double`        | Aries EG Net NGL Operating Cost (Not Use | Net operating expense based on the gross NGL operating cost for the month multip... |
| `n_ngl_rev`            | `double`        | Aries EG Net NGL Revenue (Not Used)      | The net NGL sold, also known as appraised NGL volume, multiplied by the NGL rate... |
| `n_ngl_sold`           | `double`        | Aries EG Net NGL Sold (Not Used)         | The amount of net NGL sold, also known as the appraised NGL volume, multiplied b... |
| `n_oil_opc`            | `double`        | Aries EG Net Oil Operating Cost          | Net operating expense based on the gross oil operating cost for the month multip... |
| `n_oil_rev`            | `double`        | Aries EG Net Oil Revenue                 | The net oil sold, also known as appraised oil volume, multiplied by the oil rate... |
| `n_oil_sold`           | `double`        | Aries EG Net Oil Sold                    | The amount of net oil sold, also known as the appraised oil volume, multiplied b... |
| `n_opc_plus_adv`       | `double`        | Aries EG Net Total Expense               | The appraised total of the net operating expenses. This includes LOE, Ad Valorem... |
| `n_op_exp_fixed`       | `double`        | Aries EG Net LOE Fixed Cost              | The total appraised regular operating expense from the LOE (OPC/T).                 |
| `n_prod_rev`           | `double`        | Aries EG Net Production Revenue          | The sum of the net oil, gas and water revenue. The total net revenue is, also, k... |
| `n_rev_less_sev`       | `double`        | Aries EG Net Revenue After Severance Tax | The net production revenue minus the net total severance tax.                       |
| `n_tot_ad_val`         | `double`        | Aries EG Net Total Ad Valorem Tax        | Total appraised Ad Valorem Tax.                                                     |
| `n_tot_bfit`           | `double`        | Aries EG BFIT After NPI                  | The total appraised BFIT profit after NPI. This is, also, known as BFIT Profit A... |
| `n_tot_opc`            | `double`        | Aries EG Net O/G/W + LOE Costs           | The appraised total of the net operating expenses. This includes LOE and the ope... |
| `n_tot_sev`            | `double`        | Aries EG Net Total Severance Tax         | Appraised total severance tax.                                                      |
| `n_ult_boe`            | `double`        | Aries EG Net Ultimate BOE                | The net ultimate barrel of oil equivalent, also known as the net BOE Estimated U... |
| `n_wtr_opc`            | `double`        | Aries EG Net Water Operating Cost        | Net operating expense based on the gross water operating cost for the month mult... |
| `n_wtr_rev`            | `double`        | Aries EG Net Water Revenue               | The net water sold, also known as appraised water volume, multiplied by the wate... |
| `n_wtr_sold`           | `double`        | Aries EG Net Water Sold                  | The amount of net water sold, also known as the appraised water volume, multipli... |
| `p1`                   | `double`        | Aries EG Present Worth Rate 01           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `p2`                   | `double`        | Aries EG Present Worth Rate 02           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `p3`                   | `double`        | Aries EG Present Worth Rate 03           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `p4`                   | `double`        | Aries EG Present Worth Rate 04           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `p5`                   | `double`        | Aries EG Present Worth Rate 05           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `p6`                   | `double`        | Aries EG Present Worth Rate 06           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `p7`                   | `double`        | Aries EG Present Worth Rate 07           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `p8`                   | `double`        | Aries EG Present Worth Rate 08           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `p9`                   | `double`        | Aries EG Present Worth Rate 09           | The present worth rate is also known as the discount rate. The Discount Rate is ... |
| `principal_paid`       | `double`        | Aries EG Principal Paid                  | The cumulative amount of principal paid on a loan.                                  |
| `propnum`              | `varchar(12)`   | Aries EG Propnum                         | See related term.                                                                   |
| `pw_afit_net`          | `double`        | Aries EG Net Present Worth AFIT          | Net Present Value (NPV), or present worth (PW), is the value of all future cash ... |
| `pw_bfit_net`          | `double`        | Aries EG Net Present Worth BFIT          | Net Present Value (NPV), or present worth (PW), is the value of all future cash ... |
| `scenario`             | `varchar(20)`   | Aries EG Scenario                        | See related term.                                                                   |
| `taxable_income`       | `double`        | Aries EG Taxable Income                  | The total amount of income that is taxable.                                         |
| `total_tax_paid`       | `double`        | Aries EG Total Tax Paid                  | Total Tax Paid; AFIT.                                                               |
| `tot_bor_inv`          | `double`        | Aries EG Total Borrowed Investments      | The total borrowed investment.                                                      |
| `tot_eqty_inv`         | `double`        | Aries EG Total Equity Investment         | The net appraised equity capital investments.                                       |
| `tot_inv_eqty_risk`    | `double`        | Aries EG Total Equity  Risk Investments  | Appraised equity and risk investments.                                              |
| `tot_inv_wo_risk`      | `double`        | Aries EG Total Investment Without Risk   | Appraised total investment without risk.                                            |
| `tot_risk_inv`         | `double`        | Aries EG Total Risked Investment         | Appraised risk investment amount.                                                   |
| `username`             | `varchar(100)`  | Aries EG Username                        | Name of the individual that ran the scenario.                                       |
| `water_cut`            | `double`        | Aries EG Water Cut                       | The water cut for the referenced scenario. This is a calculated stream.             |
| `water_injection`      | `decimal(18,2)` | Aries EG Water Injection                 | The cumulative amount of water that has been injected into the well.                |
| `wi_gas_sold`          | `double`        | Aries EG Working Interest Gas Sold       | The amount of gross gas sold multiplied by the working interest.                    |
| `wi_ngl_sold`          | `double`        | Aries EG Working Interest NGL Sold (Not  | The amount of gross NGL sold multiplied by the working interest.                    |
| `wi_oil_sold`          | `double`        | Aries EG Working Interest Oil Sold       | The amount of gross oil sold multiplied by the working interest.                    |
| `wi_wtr_sold`          | `double`        | Aries EG Working Interest Water Sold     | The amount of gross water sold multiplied by the working interest.                  |

## Relationships


| Related Table | Relationship | Join Key |
|---------------|--------------|----------|
| AC_PROPERTY | Many-to-One | `propnum` |
| AC_SCENARIO | Many-to-One | `scenario` |

### Example Query

```sql
SELECT
    p.propnum, p.well_name,
    o.net_oil_res, o.net_gas_res,
    o.bfit_pw_10 as npv10
FROM epw.aries_evergreen.ac_property p
JOIN epw.aries_evergreen.ac_oneline o
    ON p.propnum = o.propnum
WHERE o.scenario = 'BASE'
```
