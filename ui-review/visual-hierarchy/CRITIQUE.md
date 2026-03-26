# Visual Hierarchy & Typography Critique

**Reviewer:** Senior Typographer / UI Critic
**Date:** 2025-03-24
**Scope:** KPI display, section headings, data tables, page chrome, landing page, workflow stepper, drivers panel
**Design axiom under review:** "Data has gravity."

---

## 1. Do the numbers feel IMPORTANT?

### The hero NPV card gets this right -- almost.

The Portfolio NPV in `KpiGrid.tsx:329` renders at `text-5xl sm:text-6xl xl:text-7xl font-black tracking-tighter` in the theme accent color (cyan). At 7xl on wide screens (~4.5rem / 72px), this is genuinely large. The `font-black` (900 weight) and negative tracking (`tracking-tighter`, roughly -0.05em) compress the glyphs into a dense, confident mass. Combined with the spring-animated `AnimatedValue` wrapper (`:8-40`), this number does feel weighty.

**But the secondary KPI tiles undercut it.** In `KpiGrid.tsx:365-396`, IRR, EUR, CAPEX, and Payout all display at `text-xl font-black` -- the same size and weight as each other, the same as a body heading. A 28.5% IRR and a 14-month payout are not equivalent in decision gravity. IRR should punch harder than payout. The strip tiles are typographically uniform when they should be ranked.

The `MM` unit label in the hero card (`KpiGrid.tsx:331`) at `text-2xl font-black italic` in lavender is a nice touch -- the italic signals "unit, not number." But in the strip tiles, units render at `text-[11px] font-semibold` (`KpiGrid.tsx:168`), creating a jarring 11px-to-20px jump when your eye moves from hero to strip.

### GroupList metrics are too quiet.

In `GroupList.tsx:151-158`, the per-group NPV and EUR display at `text-[10px]` with `font-mono`. Ten-pixel monospace type on a dark surface is functionally invisible at arm's length. These are the numbers a deal professional uses to compare scenarios side-by-side. They should be at least `text-sm` (14px) with `tabular-nums` and a bolder weight.

### Drivers panel values land well.

`EconomicsDriversPanel.tsx:321-329` shows the biggest upside/downside at `text-xl font-black tabular-nums` with color-coded accent (cyan for upside, magenta for downside). The breakeven oil price at `text-3xl font-black` (`:338`) is the largest number on the Drivers tab. This is correct -- breakeven is the single most actionable figure for an A&D analyst. The panel earns its hierarchy.

---

## 2. Is there a clear hierarchy: page title > section > label > value?

### The hierarchy exists but leaks at every seam.

**Page title** (`PageHeader.tsx:301`): `text-lg md:text-2xl font-bold tracking-tight` in cyan, with an optional `brand-title` class. On small screens this is only 18px. For a page-level header in a cinematic app, this is modest. The subtitle (`PageHeader.tsx:308`) at `text-[10px] md:text-xs uppercase font-bold tracking-[0.2em]` in magenta serves as a brand accent and reads correctly as subordinate.

**Section headings** (`SectionCard.tsx:65`): `text-xs font-black uppercase tracking-[0.24em]` in cyan with `heading-font`. This is the workhorse pattern -- replicated across at least 30+ instances in DesignEconomicsView, CashFlowTable, WellsTable, QuickDrivers, and every collapsible panel. The problem: section headings and KPI labels use the same recipe. The section title "Tax & Fiscal" (`DesignEconomicsView.tsx:398`) and the KPI label "Total CAPEX" (`KpiGrid.tsx:163`) are both `text-xs font-black uppercase tracking-[0.24em]`. They occupy different hierarchy levels but are styled identically.

**Labels** (`KpiGrid.tsx:163`): `text-[11px] font-bold uppercase tracking-[0.18em]`. This is 1px smaller than `text-xs` (12px) and uses `font-bold` (700) vs `font-black` (900). The visual difference between 11px/bold and 12px/black is imperceptible, especially with uppercase + wide tracking which already inflates the apparent size.

**Values** (`KpiGrid.tsx:171`): `text-xl font-black` for strip tiles, `text-5xl+` for hero. Values are consistently the largest element in their container. This is correct.

### The real problem: two hierarchy levels are visually fused.

Section headings and labels have collapsed into a single visual register: small, uppercase, tracked, black-weight, cyan-colored. A busy deal professional scanning the page cannot distinguish "this is the name of a panel" from "this is a metric label" without reading the actual words.

---

## 3. Scannability for busy deal professionals

### The uppercase-everything strategy is a double-edged sword.

Nearly every text element below the page title is uppercase. Section titles, KPI labels, tab labels, button text, status badges, workflow step names, filter controls, table headers -- all uppercase. The search results for `uppercase` across `src/` returned 200+ hits.

Uppercase text with generous letter-spacing is excellent for short labels (2-4 words). It provides a military-grade readability at small sizes. But when everything is uppercase, nothing is. The eye loses its entry points. A scan path through the economics view encounters:

```
PORTFOLIO NPV (10%)  [hero label, 12px, tracking 0.4em]
$42.1                [hero value, 72px]
MM                   [hero unit, 24px]
TOTAL CAPEX          [tile label, 11px, tracking 0.18em]
$9.2 MM              [tile value, 20px]
IRR                  [tile label, 11px, tracking 0.18em]
28.5 %               [tile value, 20px]
TAX & FISCAL         [section title, 12px, tracking 0.24em]
LEVERAGE             [section title, 12px, tracking 0.24em]
```

Every label occupies the same visual texture. The scan degenerates into "big number, little caps text, big number, little caps text." There is no typographic rhythm -- no alternation between tension and release.

### Table scannability is competent but not distinguished.

`CashFlowTable.tsx:289` and `WellsTable.tsx:217` use `text-xs font-black uppercase tracking-[0.24em] text-theme-cyan` for column headers and `text-[11px] text-theme-text` for body cells. The headers are visually distinct (color + weight + case), and the body uses `tabular-nums` for numeric alignment. The `AccountingCell` component (`:33-36`) properly marks negatives with `text-red-400`. This is solid financial table design.

What is missing: no row-level emphasis for summary rows. Annual rollup rows in `CashFlowTable.tsx:317` get `font-semibold bg-theme-surface2/20`, but this is subtle. A deal analyst scanning for "which year did we break even?" needs the annual rows to pop harder.

---

## 4. Uppercase tracking: elegance or shouting?

### The tracking values are inconsistent.

Across the codebase, letter-spacing is specified in at least 12 distinct values:

| Value | Where |
|-------|-------|
| `tracking-tight` | Hero values, page titles |
| `tracking-[0.08em]` | Driver labels (EconomicsDriversPanel.tsx:178) |
| `tracking-[0.1em]` | KPI sub-labels, driver amounts |
| `tracking-[0.12em]` | Button text, breakeven label |
| `tracking-[0.14em]` | Integration page buttons |
| `tracking-[0.15em]` | Active badges |
| `tracking-[0.16em]` | Controls headings, setup toggle |
| `tracking-[0.18em]` | KPI tile labels, workflow steps |
| `tracking-[0.2em]` | Buttons, form labels, brand subtitle |
| `tracking-[0.22em]` | Subtitle accents |
| `tracking-[0.24em]` | Section titles, table headers |
| `tracking-[0.25em]` | Classic group header |
| `tracking-[0.28em]` | Auth page accents |
| `tracking-[0.3em]` | 404 page, Hub sections |
| `tracking-[0.4em]` | Hero NPV label, scenario section |
| `tracking-widest` | Nav buttons, menu items |

Sixteen distinct tracking values is not a scale -- it is drift. Each component author chose what "felt right" without a shared reference. The result is that adjacent elements have tracking differences of 0.02em or 0.04em, which creates visual noise rather than hierarchy.

### The widest tracking (0.4em) is reserved for the right element.

The hero NPV label at `KpiGrid.tsx:324` uses `tracking-[0.4em]`, the most extreme value in the system. This correctly signals "this is the single most important label on the page." But the Scenario Dashboard section titles (`ScenarioDashboard.tsx:449, 454`) also use `tracking-[0.4em]`, diluting its significance.

### Verdict: elegant intent, shouting execution.

The individual choices are defensible. The aggregate effect is a page that yells at the user in sixteen slightly different volumes.

---

## 5. Per-theme heading fonts: do they enhance personality?

### The font system is well-architected.

`theme.css` defines `--font-heading` per theme:
- **Slate**: Inter (no differentiation)
- **Synthwave**: Orbitron (geometric, futuristic -- perfect fit)
- **Tropical**: Quicksand (rounded, friendly -- appropriate)
- **Nocturne**: Cormorant Garamond (serif, literary -- distinctive)
- **Stormwatch**: JetBrains Mono (monospace, utilitarian -- matches "war room" tone)
- **Hyperborea**: Space Grotesk (geometric sans -- clean, modern)

The `heading-font` utility class (`app.css:61-63`) simply sets `font-family: var(--font-heading)`. The `brand-title` class (`theme.css:1699-1704`) adds `letter-spacing: 0.1em`, `text-transform: uppercase`, and `font-weight: 900`.

### But heading fonts are underused.

The `heading-font` class appears on section card titles (`SectionCard.tsx:65`) and KPI tile labels (`KpiGrid.tsx:163`). It does not appear on:
- The hero NPV label (`KpiGrid.tsx:324`)
- Table column headers (`CashFlowTable.tsx:289`, `WellsTable.tsx:217`)
- Workflow step labels (`WorkflowStepper.tsx:83`)
- Drivers panel section headers (`EconomicsDriversPanel.tsx:136`)

This means Cormorant Garamond in Nocturne or Orbitron in Synthwave only surfaces in a handful of places, and the majority of the UI reads as Inter regardless of theme. The per-theme fonts are a structural differentiator that currently has a 20% surface area when it could have 60%.

### The brand font vs heading font distinction is muddy.

`ThemeFeatures.brandFont` controls whether the app name uses `brand-title` (Orbitron for Synthwave). `ThemeFeatures.headingFont` controls whether section titles use `heading-font` (per-theme). But some components check `brandFont` for section-level text (`ScenarioDashboard.tsx:449`, `Controls.tsx:102`), conflating the two roles. The intent is right -- the implementation just needs tidying.

---

## Summary Judgment

The typography system has strong bones: a well-defined color vocabulary, a real theme system with per-theme fonts, proper use of `font-black` for emphasis, and `tabular-nums` where it matters. The hero NPV card is a genuine piece of data visualization.

But the system suffers from **hierarchy compression**. Too many elements occupy the 10-12px uppercase tracked band, making it impossible to scan without reading. The fix is not to make things bigger -- it is to make fewer things loud, and let the quiet elements be genuinely quiet. When everything whispers at the same volume, nothing speaks.

"Data has gravity" requires that the gravitational field be shaped. Right now, the field is flat.
