# ARLOOKUP

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".arlookup` |
| **Title** | Aries EG Lookup Table |
| **Alias** | N/A |
| **Column Count** | 47 |

## Description

This Aries table stores all "Lookup Table" information that is meant to be used inside the Economics engine. A LOOKUP constructs economic data lines and inserts parameters in them based on instructions and values in a user-constructed table. The LOOKUP data feature to generate one or more input data lines in your economic cases at run time that are filled out with values calculated from this table. The calculations are based on parameters that you supply on the LOOKUP line in the case.There are two section within a LOOKUP: The Template Line section and the Lookup Data section. The Template Line section: Type or paste the data lines here that you want to be inserted into a case at run time. These lines follow the format of normal formula or LIST data lines. You enter a question mark in the cells wherever you want to insert a value from the lookup. The order of these questions marks sets the order of the answer columns needed in the Data Lines section below. The number of question marks ...

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `lookup_name`, `key_value` | Lookup table entry |

## Column Reference

| Column | Data Type | Description |
|--------|-----------|-------------|
| `row_id` | `string` |  |
| `source_table_id` | `bigint` |  |
| `linetype` | `bigint` |  |
| `name` | `string` |  |
| `sequence` | `bigint` |  |
| `owner` | `string` |  |
| `var0` | `string` |  |
| `var1` | `string` |  |
| `var10` | `string` |  |
| `var11` | `string` |  |
| `var12` | `string` |  |
| `var13` | `string` |  |
| `var14` | `string` |  |
| `var15` | `string` |  |
| `var16` | `string` |  |
| `var17` | `string` |  |
| `var18` | `string` |  |
| `var19` | `string` |  |
| `var2` | `string` |  |
| `var20` | `string` |  |
| `var21` | `string` |  |
| `var22` | `string` |  |
| `var23` | `string` |  |
| `var24` | `string` |  |
| `var25` | `string` |  |
| `var26` | `string` |  |
| `var27` | `string` |  |
| `var28` | `string` |  |
| `var29` | `string` |  |
| `var3` | `string` |  |
| `var30` | `string` |  |
| `var4` | `string` |  |
| `var5` | `string` |  |
| `var6` | `string` |  |
| `var7` | `string` |  |
| `var8` | `string` |  |
| `var9` | `string` |  |
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


Referenced by AC_ECONOMIC data lines via the LOOKUP keyword.

```
LOOKUP MYTYPE @m.well_type
```

Lookups dynamically insert values based on property attributes.


## Lookup Table Usage

Lookups dynamically insert economic data lines based on property attributes. They allow a single LOOKUP call to insert different values for different wells based on their characteristics (reservoir domain, state, cost profile, etc.).

### How Lookup Tables Work

A lookup table consists of three row types (`linetype`):

| LineType | Purpose |
|----------|---------|
| 0 | **Template rows** - Define the data line structure with placeholders |
| 1 | **Header row** - Column names (var0 = key field, var1-varN = value columns) + data types (M=match, C=currency, N=numeric, L=list) |
| 3 | **Data rows** - Actual values keyed by var0 |

### Calling a Lookup

```
LOOKUP <lookup_name> @<table_alias>.<field_name>
```

Examples from CLR data:
```
LOOKUP GAS_DIFF_BASE @AI.RSV_DOMAIN_ALIAS     -- Gas differential by reservoir domain
LOOKUP SEV @M.STATE                           -- Severance tax by state
LOOKUP CLR_COST_PROFILE @AI.COST_ALIAS        -- Capital costs by cost profile
LOOKUP PRB_LOE_TC @AI.RSV_DOMAIN_ALIAS        -- LOE type curve by reservoir domain
```

### Table Alias Reference

| Alias | Table | Common Fields |
|-------|-------|---------------|
| @M | AC_PROPERTY | STATE, PROJECT, RESERVOIR_DOMAIN, COST_PROFILE, AOI |
| @AI | CLR_ALTERNATE_INFO | RSV_DOMAIN_ALIAS, COST_ALIAS, MISC_ALIAS |
| @DS | CLR_DSO_INFO | PROJ_SPUD_DATE, etc. |

### Example: GAS_DIFF_BASE Lookup

**Template rows (linetype=0):**
```
PAJ/GAS   X   $/M   04/2026   AD   PC
"         X   $/M   01/2027   AD   PC
"         X   $/M   TO        LIFE PC
```

**Header row (linetype=1):**
```
var0=RES_DOM_ALIAS, var1=SHORT_TERM, var2=MID_TERM, var3=BENCHMARK
```

**Data rows (linetype=3):**
```
var0=SCMR BC OIL, var1=0.14, var2=-0.21, var3=-0.11
var0=GODC LOCO,   var1=0.02, var2=-0.08, var3=-0.02
```

When Aries runs `LOOKUP GAS_DIFF_BASE @AI.RSV_DOMAIN_ALIAS` for a well with RSV_DOMAIN_ALIAS = "SCMR BC OIL", it:
1. Finds the matching row (var0 = "SCMR BC OIL")
2. Substitutes values into the template: SHORT_TERM=0.14, MID_TERM=-0.21, BENCHMARK=-0.11
3. Creates the PAJ/GAS data lines with those differentials

### Common Lookup Tables at CLR

| Lookup Name | Used In | Key Field | Purpose |
|-------------|---------|-----------|---------|
| GAS_DIFF_BASE | Prices | RSV_DOMAIN_ALIAS | Gas price differentials by area |
| OIL_DIFF_BASE | Prices | RSV_DOMAIN_ALIAS | Oil price differentials by area |
| SEV | Expenses | STATE | Severance tax rates by state |
| ADVAL | Expenses | STATE | Ad valorem tax rates by state |
| CLR_COST_PROFILE | Investments | COST_ALIAS | Capital costs by well design |
| PRB_LOE_TC | Expenses | RSV_DOMAIN_ALIAS | LOE type curves for PRB |
| ANDKO_LOE_TC | Expenses | RSV_DOMAIN_ALIAS | LOE type curves for Anadarko |

### Section Usage

Lookups are called from different economic sections:

| Section | Code | Common Lookups |
|---------|------|----------------|
| Production | 2 | STATETX (state tax flags) |
| Prices | 5 | GAS_DIFF_BASE, OIL_DIFF_BASE |
| Expenses | 6 | SEV, ADVAL, *_LOE_TC |
| Investments | 4 | CLR_COST_PROFILE, *_CAPEX |

### Example Query: View Lookup Structure

```sql
SELECT linetype, sequence, var0, var1, var2, var3
FROM epw.aries_evergreen.arlookup
WHERE name = 'GAS_DIFF_BASE'
  AND row_active_ind = 'Y'
ORDER BY linetype, sequence
```

