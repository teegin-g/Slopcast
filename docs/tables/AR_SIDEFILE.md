# AR_SIDEFILE

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".ar_sidefile` |
| **Title** | Aries EG Sidefile Table |
| **Alias** | ESF |
| **Column Count** | 18 |

## Description

This Aries table stores all sidefile information that is meant to be used inside the Economics engine. Sidefiles streamline economic data entry by reducing the amount of data that is needed in each case. Sidefiles consists of sets of economic data lines that can be dynamically brought into multiple properties at run time by referencing its name. Sidefiles are typically used for price or operating expense data lines, but can be used for data from the Miscellaneous, Production, Prices, Expenses, Ownership, Investments, or Overlays data sections of the Economics table. A sidefile generally contains data for only one economic data section. If it contains lines from multiple sections, such as for both prices and expenses, only those lines from the sidefile that belong to the section from which it is referenced will be brought into the case. Table Alias: ESF

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `sidefile_name`, `sequence` | Sidefile data line |

## Column Reference

| Column | Data Type | Description |
|--------|-----------|-------------|
| `row_id` | `string` |  |
| `source_table_id` | `bigint` |  |
| `filename` | `string` |  |
| `section` | `bigint` |  |
| `sequence` | `bigint` |  |
| `expression` | `string` |  |
| `keyword` | `string` |  |
| `owner` | `string` |  |
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


Referenced by AC_ECONOMIC data lines via the SIDEFILE keyword.

```
SIDEFILE GPRICE2 [qualifier]
```

Sidefiles contain reusable sets of economic data lines.


## Sidefile Usage

Sidefiles streamline data entry by providing reusable templates of economic data lines that can be called into multiple wells.

### Table Structure

| Column | Purpose |
|--------|---------|
| `filename` | Sidefile name (e.g., "CORP_PRICE", "NAV_PRICE") |
| `section` | Economic section code (5=Prices, 6=Expenses, etc.) |
| `sequence` | Line order within the sidefile |
| `keyword` | Data line keyword (PRI/OIL, PRI/GAS, etc.) |
| `expression` | Data line parameters |

### Calling a Sidefile

In AC_ECONOMIC, call a sidefile with:
```
SIDEFILE <sidefile_name> [qualifier]
```

Or with dynamic substitution:
```
SIDEFILE CORP_PRICE_NEW2 @M.DISTRICT
```

### Common CLR Sidefiles

| Sidefile | Usage | Purpose |
|----------|-------|---------|
| CORP_PRICE | 50,521 wells | Standard corporate price deck |
| CORP_BASE | 71,200 wells | Base case pricing |
| CORP_LOW | 56,162 wells | Low case pricing |
| CORP_HIGH | 29,786 wells | High case pricing |
| 5YR_STRIP_WTI | 31,910 wells | 5-year strip pricing |
| NAV_PRICE | Valuation | NAV pricing deck |
| HISTORICAL_WTI | Reference | Historical WTI prices |

### Example: CORP_PRICE Sidefile Content

```
Section 5 (Prices):
  Seq 5:   SIDEFILE HISTORICAL_WTI          -- Nested sidefile for history
  Seq 10:  PRI/OIL  01/2026 58.30 58.30 ... -- Oil price forecast
  Seq 50:  PRI/OIL  65.00 X $/B TO LIFE PC 0  -- Terminal price
  Seq 55:  PRI/GAS  01/2026 3.25 3.25 ...   -- Gas price forecast
  Seq 95:  PRI/GAS  3.25 X $/M TO LIFE PC 0   -- Terminal price
```

### Price Deck Naming Convention

Many sidefiles use an `OIL_GAS` naming pattern:
- `60_300` = $60/bbl oil, $3.00/mcf gas
- `55_275` = $55/bbl oil, $2.75/mcf gas
- `80_400` = $80/bbl oil, $4.00/mcf gas

### Section Codes

Sidefiles are organized by section:

| Section | Description |
|---------|-------------|
| 1 | Miscellaneous |
| 2 | Production |
| 5 | Prices |
| 6 | Expenses |

### Sidefile Nesting

Sidefiles can call other sidefiles:
```
CORP_PRICE contains:
  SIDEFILE HISTORICAL_WTI    -- Pulls in historical prices
  PRI/OIL 01/2026 ...        -- Then adds forward prices
```

### Example Query: View Sidefile Content

```sql
SELECT sequence, section, keyword, expression
FROM epw.aries_evergreen.ar_sidefile
WHERE filename = 'CORP_PRICE'
  AND row_active_ind = 'Y'
ORDER BY sequence
```

### Key Differences from LOOKUP

| Feature | SIDEFILE | LOOKUP |
|---------|----------|--------|
| Purpose | Static templates | Dynamic value substitution |
| Content | Complete data lines | Parameterized templates |
| Variability | Same for all wells | Different values per well |
| Use Case | Price decks, standard costs | Area-specific differentials |

