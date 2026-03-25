# AC_ECONOMIC

## Overview

| Property | Value |
|----------|-------|
| **Full Path** | `"ods.ariesevergreen".ac_economic` |
| **Title** | Aries EG Economic Table |
| **Alias** | EC |
| **Column Count** | 6 |

## Description

Aries table of Expert Editor data lines that are used to calculate economics and generate the ariesevergreen.dbo.ac_monthly (Aries EG Monthly Table (Forecast)) outputs. Data is captured by PROPNUM, QUALIFIER, KEYWORD, SECTION, and SEQUENCE. Table Alias: EC

## Key Fields


| Key Type | Fields | Description |
|----------|--------|-------------|
| **Primary Key** | `propnum`, `qualifier`, `keyword`, `section`, `sequence` | Unique data line |
| **Foreign Key** | `propnum` | References AC_PROPERTY |

## Column Reference

| Column | Data Type | Title | Description |
|--------|-----------|-------|-------------|
| `expression` | `varchar(250)` | Aries EG Expression | The Expression represents the individual items that are displayed the economic l... |
| `keyword` | `varchar(10)` | Aries EG Keyword | Each row in the Economics begins with a keyword, such as OIL, which sets the mea... |
| `propnum` | `varchar(12)` | Aries EG Propnum | See related term. |
| `qualifier` | `varchar(12)` | Aries EG Qualifier | See related term. |
| `section` | `smallint` | Aries EG Section | There are 7 sections in the Economics table. Each section contains specific cate... |
| `sequence` | `smallint` | Aries EG Sequence | The number associated with each economic line in the table. The economics are ra... |

## Relationships


| Related Table | Relationship | Join Key |
|---------------|--------------|----------|
| AC_PROPERTY | Many-to-One | `propnum` |
| AR_SIDEFILE | Reference | Via SIDEFILE keyword |
| ARLOOKUP | Reference | Via LOOKUP keyword |

### Example Query

```sql
SELECT
    propnum, qualifier, keyword, section, sequence, expression
FROM epw.aries_evergreen.ac_economic
WHERE propnum = 'WELL001'
  AND keyword = 'OIL'
ORDER BY qualifier, section, sequence
```


## Data Line Format

Economic data lines follow this structure:

```
KEYWORD  START  END  UNITS  CUTOFF  CUT_UNITS  METHOD  VALUE  [QUALIFIER]
```

### Common Keywords

| Keyword | Section | Description |
|---------|---------|-------------|
| OIL | Production | Oil production forecast |
| GAS | Production | Gas production forecast |
| WTR | Production | Water production forecast |
| PRI/OIL | Prices | Oil price |
| PRI/GAS | Prices | Gas price |
| OPC/T | Expenses | Fixed operating cost |
| OPC/OIL | Expenses | Variable cost per barrel |
| OPC/GAS | Expenses | Variable cost per MCF |
| WI | Ownership | Working interest |
| NRI | Ownership | Net revenue interest |

### Decline Methods

| Method | Description |
|--------|-------------|
| EXP | Exponential decline |
| HYP | Hyperbolic decline |
| HAR | Harmonic decline |
| SPD | Secant effective decline |

### Escalation Methods

| Method | Description |
|--------|-------------|
| PC | Percent compound |
| PE | Percent simple |
| $E | Dollar escalation |
| ESC | Use scheme |

