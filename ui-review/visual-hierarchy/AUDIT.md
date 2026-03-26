# Typography Audit -- Complete Catalog

**Date:** 2025-03-24
**Scope:** All files in src/ contributing to visual hierarchy
**Method:** Exhaustive grep of `text-[`, `font-`, `tracking-`, `uppercase` across the source tree

---

## 1. Font Size Catalog

### Arbitrary values (Tailwind `text-[Npx]`)

| Size | Weight(s) | Where | Hierarchy role |
|------|-----------|-------|----------------|
| `text-[7px]` | font-black | DesignEconomicsView.tsx:98 (SVG progress ring text) | Micro annotation |
| `text-[8px]` | font-black | ScenarioDashboard.tsx:232, 268 (ACTIVE badge) | Status micro-badge |
| `text-[9px]` | font-black, font-bold | 40+ locations: form labels, table headers, button text, map controls, status badges | Sub-label / control chrome |
| `text-[10px]` | font-black, font-bold, font-mono | 80+ locations: buttons, subtitles, badge pills, inline values, form headers, nav items | Primary UI chrome text |
| `text-[11px]` | font-black, font-bold, font-semibold | 30+ locations: KPI labels, tile labels, table body, section titles (classic), integration detail | Label / compact body |
| `text-[12px]` | font-black | EconomicsDriversPanel.tsx:190 (driver delta values) | Inline metric |
| `text-[1.8rem]` | font-black | HubPage.tsx:170 (hero heading, mobile) | Page hero |

### Tailwind scale values

| Class | Computed | Weight(s) | Where | Hierarchy role |
|-------|----------|-----------|-------|----------------|
| `text-xs` | 12px | font-black, font-bold, font-medium | Section titles, table headers, nav buttons, menu items, workflow labels | Section heading / label |
| `text-sm` | 14px | font-black, font-bold, font-semibold | Group names, driver titles, empty state headings, GroupList heading | Subheading / secondary name |
| `text-base` | 16px | font-normal | Body text, hub card titles, overflow icon | Body copy |
| `text-lg` | 18px | font-black | Page header title (mobile), landing stats values | Page title (sm) / stat value |
| `text-xl` | 20px | font-black, font-light | KPI strip tile values, driver upside/downside, payout value | Secondary KPI value |
| `text-2xl` | 24px | font-black, font-light, font-bold | Unit label (MM), page title (md), auth headings | Hero unit / page heading |
| `text-3xl` | 30px | font-black | KPI classic tile values, breakeven oil price, scenario NPV | Tertiary hero value |
| `text-4xl` | 36px | font-black | 404 heading, empty state icon size context | Display heading |
| `text-5xl` | 48px | font-black | Hero NPV (sm breakpoint), hub hero (md) | Hero value tier 2 |
| `text-6xl` | 60px | font-black | Hero NPV (md breakpoint) | Hero value tier 1 |
| `text-7xl` | 72px | font-black | Hero NPV (xl breakpoint) | Hero value max |

### Responsive size stacks

| Component | Mobile | Tablet | Desktop | XL |
|-----------|--------|--------|---------|-----|
| Hero NPV value | text-5xl (48px) | text-6xl (60px) | text-6xl (60px) | text-7xl (72px) |
| Page title | text-lg (18px) | text-2xl (24px) | text-2xl (24px) | text-2xl (24px) |
| Nav buttons | text-[10px] | text-xs (12px) | text-xs (12px) | text-xs (12px) |
| Landing hero | text-3xl (30px) | text-5xl (48px) | text-6xl (60px) | text-6xl (60px) |

---

## 2. Font Weight Catalog

| Tailwind class | CSS value | Usage count (approx.) | Typical context |
|----------------|-----------|----------------------|-----------------|
| `font-black` | 900 | 200+ | KPI values, section titles, buttons, labels, badges, nav tabs -- dominant weight |
| `font-bold` | 700 | 40+ | KPI labels, secondary buttons, menu items, table descriptions, filter labels |
| `font-semibold` | 600 | 15+ | Driver names, group names, table annual rows, GroupList heading |
| `font-medium` | 500 | 5-8 | Add-row links, typo-label utility |
| `font-normal` | 400 | 3-5 | typo-h3, typo-body |
| `font-light` | 300 | 2 | typo-h1, typo-h2 (defined but rarely used in components) |
| `font-mono` | monospace | 10+ | Inline editable values, scenario numbers, GroupList metric values |

### Weight distribution problem

`font-black` (900) is used for:
- Hero values (correct: maximum emphasis)
- Section titles (questionable: should be subordinate to values)
- Button text (questionable: buttons are chrome, not data)
- KPI labels (incorrect: labels should be lighter than the values they describe)
- Badges (questionable: "ACTIVE" badge at 10px/900 is visually identical to a label)

When 900 is used everywhere, there is no typographic "forte" left. The hierarchy collapses to: "everything is bold, some things are bigger."

---

## 3. Letter-Spacing Catalog

### Negative tracking (display/value use)

| Value | Tailwind | Where |
|-------|----------|-------|
| -0.05em | `tracking-tighter` | Hero NPV value (KpiGrid.tsx:329), hub hero (HubPage.tsx:170) |
| -0.025em | `tracking-tight` | Page title (PageHeader.tsx:301), classic tile values (KpiGrid.tsx:268), landing hero, scenario NPV |

### Zero tracking (default)

Applied to all body text, form inputs, descriptive paragraphs. No explicit class needed.

### Positive tracking (label/chrome use)

| Value | Tailwind | Approx. count | Where |
|-------|----------|---------------|-------|
| 0.08em | `tracking-[0.08em]` | 2 | Driver label text (EconomicsDriversPanel.tsx:178) |
| 0.1em | `tracking-[0.1em]` | 8 | KPI sub-values, driver delta amounts, scenario NPV label |
| 0.12em | `tracking-[0.12em]` | 10 | Breakeven label, button text, map filter badges |
| 0.14em | `tracking-[0.14em]` | 15 | Integration page buttons, connection form labels, schema mapper |
| 0.15em | `tracking-[0.15em]` | 4 | Active badge, comparison description |
| 0.16em | `tracking-[0.16em]` | 8 | Controls headings, setup insights toggle, mini map label, onboarding |
| 0.18em | `tracking-[0.18em]` | 12 | KPI tile labels, workflow steps, driver detail labels, group wells table |
| 0.2em | `tracking-[0.2em]` | 30+ | Form labels, buttons, subtitle, controls sub-headers, scenario labels, debt/tax labels |
| 0.22em | `tracking-[0.22em]` | 4 | Hub/Integration subtitle accents |
| 0.24em | `tracking-[0.24em]` | 20+ | Section card titles, table column headers, collapsible section titles, cash flow header |
| 0.25em | `tracking-[0.25em]` | 3 | Classic hero label, classic group header |
| 0.28em | `tracking-[0.28em]` | 2 | Auth page accent subtitle |
| 0.3em | `tracking-[0.3em]` | 6 | 404 page, Hub section headers |
| 0.4em | `tracking-[0.4em]` | 3 | Hero NPV label, scenario comparison title |
| -- | `tracking-wide` | 6 | GroupList heading, landing stat labels, scenario comparison |
| -- | `tracking-wider` | 2 | Scenario comparison table headers |
| -- | `tracking-widest` | 25+ | Nav buttons, menu items, active badge, mobile sticky bar, sensitivity matrix |

### Summary: 16+ distinct tracking values

A disciplined type scale should have 3-5 tracking tiers:
1. **Negative** for display/hero values
2. **Default** for body
3. **Medium** (~0.12-0.16em) for labels and section text
4. **Wide** (~0.2-0.25em) for section headings
5. **Extra-wide** (0.3em+) reserved for hero labels only

---

## 4. Typography-to-Hierarchy Mapping

### Current (actual)

| Hierarchy level | Expected treatment | Actual treatment |
|-----|-----|------|
| **Hero value** (NPV $42.1M) | Largest, heaviest, accent color, negative tracking | text-5xl-7xl, font-black, tracking-tighter, text-theme-cyan -- CORRECT |
| **Primary KPI** (IRR, EUR) | Large, heavy, white/neutral | text-xl, font-black, text-theme-text -- ADEQUATE but undifferentiated between metrics |
| **Section heading** (Tax & Fiscal) | Medium, uppercase, accent color, heading font | text-xs, font-black, uppercase, tracking-[0.24em], text-theme-cyan -- IDENTICAL to KPI label |
| **KPI label** (Total CAPEX) | Small, uppercase, muted or secondary color | text-[11px], font-bold, uppercase, tracking-[0.18em], text-theme-text/70 -- VISUALLY FUSED with section heading |
| **Table header** | Small, uppercase, accent, sticky | text-xs, font-black, uppercase, tracking-[0.24em], text-theme-cyan -- IDENTICAL to section heading |
| **Body text** | Default size, normal weight | text-xs, text-theme-muted -- CORRECT |
| **Table cell** | Slightly small, tabular | text-[11px], tabular-nums -- CORRECT |
| **Button/nav** | Small, uppercase, tracked | text-[10px]-text-xs, font-black, uppercase, tracking-widest -- OVERWEIGHT for chrome |
| **Micro badge** | Smallest, uppercase, accent bg | text-[8px]-text-[10px], font-black, uppercase -- CORRECT |

### Problem zones

1. **Section heading = KPI label = Table header** -- all three are `text-xs font-black uppercase tracking-[0.24em] text-theme-cyan`
2. **Button text uses `font-black`** -- chrome should be lighter than data
3. **KPI labels use `font-bold`** at 11px while section headings use `font-black` at 12px -- 1px and one weight step is not a visible distinction

---

## 5. Inconsistencies Catalog

### Same role, different styling

| Role | Variant A | Variant B |
|------|-----------|-----------|
| Section title | `text-xs font-black tracking-[0.24em]` (SectionCard) | `text-sm font-semibold tracking-wide` (GroupList:105) |
| KPI tile label | `text-[11px] font-bold tracking-[0.18em]` (KpiGrid:163) | `text-xs font-black tracking-[0.2em]` (LandingPage:206) |
| Button text | `text-[10px] font-black tracking-[0.2em]` (most buttons) | `text-[9px] font-black tracking-[0.14em]` (integration buttons) |
| Group metric label | `text-[9px] font-black tracking-widest text-theme-warning` (GroupList:77, classic) | `text-[9px] font-bold uppercase text-theme-lavender` (GroupList:151, themed) |
| Table body cell | `text-[11px] text-theme-text` (CashFlowTable:309) | `text-[11px] text-theme-text` (WellsTable:245) -- consistent here |

### Defined but unused typography utilities

From `app.css:48-57`:
- `typo-h1`: `text-2xl font-light tracking-tight` -- NOT USED in any component reviewed
- `typo-h2`: `text-xl font-light tracking-tight` -- NOT USED
- `typo-h3`: `text-base font-normal` -- NOT USED
- `typo-body`: `text-sm font-normal` -- NOT USED
- `typo-caption`: `text-xs text-theme-muted` -- NOT USED
- `typo-label`: `text-xs font-medium uppercase tracking-wider` -- NOT USED
- `typo-section`: `text-xs font-bold uppercase tracking-[0.2em] text-theme-cyan` -- NOT USED
- `typo-value`: `font-mono tabular-nums` -- NOT USED

An entire typography scale was defined and then bypassed. Every component inlines its own text styling.

### heading-font class usage gaps

Applied at: `SectionCard.tsx:65`, `KpiGrid.tsx:163`
Missing from: `CashFlowTable.tsx:289`, `WellsTable.tsx:217`, `WorkflowStepper.tsx:83`, `EconomicsDriversPanel.tsx:136`, `DesignEconomicsView.tsx:128/398/440/482/533/573`

The per-theme heading font (Orbitron, Quicksand, Cormorant Garamond, JetBrains Mono, Space Grotesk) only appears in ~30% of section-level headings.

---

## 6. Font Family Tokens

From `theme.css` and `app.css`:

| Token | Default (Slate) | Synthwave | Tropical | Nocturne | Stormwatch | Hyperborea | Mario |
|-------|----------------|-----------|----------|----------|------------|------------|-------|
| `--font-brand` | Inter | Orbitron | Inter | Inter | Inter | Inter | Inter |
| `--font-heading` | Inter | Orbitron | Quicksand | Cormorant Garamond | JetBrains Mono | Space Grotesk | (not set, inherits Inter) |
| body | Inter | Inter | Inter | Inter | Inter | Inter | Inter |

Only Synthwave sets both `--font-brand` and `--font-heading` to a distinctive typeface. Nocturne has the most dramatic heading font (a serif) but no brand font override. Mario has no heading font differentiation at all.
