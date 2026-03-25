# Aries Economic Engine Overview

## What is Aries?

Aries is Landmark's petroleum economic evaluation and reserves management software. It serves as CLR's primary system for:

- **Reserve Estimation**: Calculating proved, probable, and possible reserves
- **Economic Forecasting**: Projecting revenues, costs, and cash flows
- **Production Forecasting**: Modeling decline curves and future production
- **Scenario Analysis**: Evaluating different pricing, timing, and operational assumptions

Aries Evergreen is the cloud-based version that stores data in Databricks, accessible via the schema `epw.aries_evergreen`.

## Core Concepts

### PROPNUM (Property Number)
The unique identifier for each well/property in the system. This is the primary key that links all Aries tables together.

### SCENARIO
A named combination of forecasts (production, pricing, expenses, ownership) used to run economics. Examples:
- `RD_LOSS_NO` - Scenario used for planning, well life terminates when uneconomic
- `APPROVED` - Hard coded case that represents the assumptions at time of approval
- `CLR4Q25` - Scenario thats populated by assumptions for that quarter.


### QUALIFIER
A sub-identifier within each data section (Production, Prices, Expenses) that allows multiple forecasts per property. Qualifiers are combined into scenarios.

### Economic Run
The process of running the Aries economic engine to calculate outputs:
1. Read input data (AC_ECONOMIC data lines)
2. Apply production forecasts
3. Apply pricing, ownership, and expense assumptions
4. Calculate monthly cash flows (AC_MONTHLY)
5. Summarize to one-line results (AC_ONELINE)

## Data Architecture

### Input Tables

| Table | Purpose |
|-------|---------|
| **AC_PROPERTY** | Master well header with property attributes |
| **AC_ECONOMIC** | Economic data lines (formulas, expressions) |
| **AC_PRODUCT** | Historical monthly production (actuals) |
| **AR_SIDEFILE** | Reusable data line templates |
| **ARLOOKUP** | Lookup tables for dynamic values |
| **AC_SCENARIO** | Scenario definitions |

### Output Tables

| Table | Purpose |
|-------|---------|
| **AC_MONTHLY** | Monthly forecast results (volumes, revenues, costs) |
| **AC_ONELINE** | Summary economics per property/scenario |

### CLR Custom Tables

| Table | Purpose |
|-------|---------|
| **CLR_ATTRIBUTE** | Extended well attributes beyond AC_PROPERTY |
| **CLR_ALTERNATE_INFO** | Alternate working interests, OPC rates, projected dates |
| **CLR_DSO_INFO** | DSO dates for capital alignment with Planning |

## Data Flow

```
AC_PROPERTY (Master Data)
         │
         ▼
AC_ECONOMIC (Data Lines: Production, Prices, Expenses, Ownership)
    │           │
    │    ┌──────┴──────┐
    │    │             │
    ▼    ▼             ▼
AR_SIDEFILE      ARLOOKUP
(Templates)      (Lookups)
    │             │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────┐
    │  ARIES ENGINE   │
    │  (Calculation)  │
    └─────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
AC_MONTHLY    AC_ONELINE
(Monthly)     (Summary)
```

## Economic Data Lines

Aries uses a dataline engine to define economic calculations. Data lines are stored in AC_ECONOMIC with the format:

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
| OPC/T | Expenses | Fixed operating cost per time |
| OPC/OIL | Expenses | Variable cost per barrel |
| OPC/GAS | Expenses | Variable cost per MCF |
| WI | Ownership | Working interest |
| NRI | Ownership | Net revenue interest |
| STX/OIL | Expenses | Severance tax on oil |
| ATX | Expenses | Ad valorem tax |

### Decline Curve Methods

| Method | Description |
|--------|-------------|
| EXP | Exponential decline |
| HYP | Hyperbolic decline |
| HAR | Harmonic decline |
| SPD | Secant effective decline |

### Escalation Methods

| Method | Description |
|--------|-------------|
| PC | Percent compound (monthly) |
| PC/Y | Percent compound (yearly) |
| PE | Percent simple |
| $E | Dollar escalation |
| ESC | Use escalation scheme |

## Sidefiles and Lookups

### Sidefiles (AR_SIDEFILE)
Reusable templates of data lines that can be called into multiple properties:

```
SIDEFILE GPRICE2  [qualifier]
```

Common uses:
- Price decks
- Standard expense assumptions
- Tax rates by state

### Lookups (ARLOOKUP)
Dynamic value tables that insert parameters based on property attributes:

```
LOOKUP MYTYPE @m.well_type
```

## CLR Workflow

### Reserves Forecasting
1. Engineers update production forecasts in AC_ECONOMIC
2. Run economics to generate AC_MONTHLY and AC_ONELINE
3. Results feed into reserves reporting

### Capital Planning Integration
- **CLR_DSO_INFO**: Stores projected DSO dates
- Aligns capital spending timing with Planning department
- Links Aries forecasts to financial planning systems

### Non-Operated Analysis
- **CLR_ALTERNATE_INFO**: Stores alternate WI/NRI scenarios
- Used for participation decisions on non-op wells
- Captures alternate OPC rates and projected dates

## Key Table Relationships

```
AC_PROPERTY (1)
    │
    ├── PROPNUM ──> AC_MONTHLY (many, by SCENARIO + OUTDATE)
    │
    ├── PROPNUM ──> AC_ONELINE (many, by SCENARIO)
    │
    ├── PROPNUM ──> AC_ECONOMIC (many, by QUALIFIER + KEYWORD + SEQUENCE)
    │
    ├── PROPNUM ──> AC_PRODUCT (many, by P_DATE)
    │
    ├── PROPNUM ──> CLR_ALTERNATE_INFO (1)
    │
    ├── PROPNUM ──> CLR_DSO_INFO (1)
    │
    └── PROPNUM ──> CLR_ATTRIBUTE (1)

AC_SCENARIO
    └── SCENARIO ──> AC_MONTHLY, AC_ONELINE
```

## Common Queries

### Get monthly forecast for a property
```sql
SELECT *
FROM epw.aries_evergreen.ac_monthly
WHERE propnum = 'WELL001'
  AND scenario = 'BASE'
ORDER BY outdate
```

### Join property attributes with one-line economics
```sql
SELECT
    p.propnum, p.well_name, p.asset_team, p.formation,
    o.net_reserves_oil, o.net_reserves_gas, o.npv_10
FROM epw.aries_evergreen.ac_property p
JOIN epw.aries_evergreen.ac_oneline o
    ON p.propnum = o.propnum
WHERE o.scenario = 'BASE'
```

### Get production actuals vs forecast
```sql
-- Actuals from AC_PRODUCT
SELECT propnum, p_date, oil, gas
FROM epw.aries_evergreen.ac_product
WHERE propnum = 'WELL001'

-- Forecast from AC_MONTHLY
SELECT propnum, outdate, s371 as gross_gas, g_oil_sold
FROM epw.aries_evergreen.ac_monthly
WHERE propnum = 'WELL001'
  AND scenario = 'BASE'
```

## Stream Numbers

Many AC_MONTHLY columns are named by stream number (e.g., `s371`, `s847`). Key mappings:

| Stream | Column | Description |
|--------|--------|-------------|
| S371 | s371 | Gross Gas |
| S392 | s392 | Gross Gas Sold |
| S816 | s816 | Net Gas Sold |
| S847 | s847 | Net Gas Revenue |
| S861 | s861 | Net Revenue All (O/G/W) |

See the individual table documentation for complete stream mappings.

## Related Documentation

- [Table Relationships](TABLE_RELATIONSHIPS.md)
- [AC_PROPERTY](tables/AC_PROPERTY.md) - Master well table
- [AC_MONTHLY](tables/AC_MONTHLY.md) - Monthly forecast output
- [AC_ONELINE](tables/AC_ONELINE.md) - Summary economics
- [AC_ECONOMIC](tables/AC_ECONOMIC.md) - Economic data lines
- [AC_PRODUCT](tables/AC_PRODUCT.md) - Historical production
