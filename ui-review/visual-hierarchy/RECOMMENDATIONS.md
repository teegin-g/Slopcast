# Typography Recommendations

**Objective:** Make data feel heavy, make chrome feel light, make the hierarchy scannable in under two seconds.
**Design axiom:** "Data has gravity." Gravity requires a field with peaks and valleys -- not a flat plane.

---

## 1. Establish a strict tracking scale and enforce it

### Current state: 16+ arbitrary tracking values.

### Proposed scale (5 tiers):

| Tier | Value | Tailwind | Use case |
|------|-------|----------|----------|
| **Display** | -0.04em | `tracking-tight` | Hero values, page titles, any number > text-2xl |
| **Default** | 0 | (none) | Body text, descriptions, form values |
| **Label** | 0.12em | `tracking-[0.12em]` | KPI labels, field labels, inline annotations |
| **Section** | 0.2em | `tracking-[0.2em]` | Section headings, table column headers, panel titles |
| **Display label** | 0.35em | `tracking-[0.35em]` | Hero metric label only (PORTFOLIO NPV) |

### Implementation

Create utility classes in `app.css` and migrate component-level arbitrary values:

```css
.track-label   { letter-spacing: 0.12em; }
.track-section { letter-spacing: 0.2em; }
.track-hero    { letter-spacing: 0.35em; }
```

This collapses 16 values to 5. Each value is perceptually distinct from its neighbors.

**Key files to update:**
- `KpiGrid.tsx:163` -- change `tracking-[0.18em]` to `tracking-[0.12em]` (label tier)
- `KpiGrid.tsx:324` -- change `tracking-[0.4em]` to `tracking-[0.35em]` (display label tier)
- `SectionCard.tsx:65` -- change `tracking-[0.24em]` to `tracking-[0.2em]` (section tier)
- `CashFlowTable.tsx:289`, `WellsTable.tsx:217` -- change `tracking-[0.24em]` to `tracking-[0.2em]`
- `PageHeader.tsx` nav buttons -- change `tracking-widest` to `tracking-[0.2em]`
- All instances of `tracking-[0.14em]`, `tracking-[0.16em]`, `tracking-[0.18em]` -- consolidate to `tracking-[0.12em]`
- All instances of `tracking-[0.24em]`, `tracking-[0.25em]`, `tracking-[0.28em]`, `tracking-[0.3em]` -- consolidate to `tracking-[0.2em]`

---

## 2. Separate section headings from KPI labels visually

### Current state

Both use: `text-xs font-black uppercase tracking-[~0.24em] text-theme-cyan`.

### Proposed differentiation

| Element | Size | Weight | Tracking | Color | Font |
|---------|------|--------|----------|-------|------|
| **Section heading** | `text-xs` (12px) | `font-bold` (700) | `tracking-[0.2em]` | `text-theme-cyan` | `heading-font` |
| **KPI label** | `text-[10px]` | `font-semibold` (600) | `tracking-[0.12em]` | `text-theme-muted` | Inter (body) |

The key change: **KPI labels become muted, not cyan.** The label is not the star -- the number is. By pulling labels into `text-theme-muted`, the value below gains relative prominence without changing its own styling.

**Files to update:**
- `KpiGrid.tsx:163` -- change from `text-[11px] font-bold uppercase tracking-[0.18em] text-theme-text/70 heading-font` to `text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-muted`
- `KpiGrid.tsx:184` -- same treatment for WellsBadge label
- `SectionCard.tsx:65` -- change from `text-xs font-black` to `text-xs font-bold` and ensure `heading-font` is always present
- `EconomicsDriversPanel.tsx:319, 326, 337, 346, 357` -- KPI-style labels should use the label tier, not the section tier

---

## 3. Demote button text from font-black to font-bold

### Current state

Every button in the app uses `font-black` (900). Buttons are navigation chrome, not data. They should not compete visually with KPI values or section headings.

### Proposed

Change all button instances from `font-black` to `font-bold` (700). This is a single search-and-replace scoped to button elements and their className strings.

**Impact files (sample, not exhaustive):**
- `PageHeader.tsx:329-330` (nav buttons) -- `font-black` to `font-bold`
- `DesignEconomicsView.tsx:330-350` (mobile panel toggle) -- `font-black` to `font-bold`
- `EconomicsResultsTabs.tsx:49-52` (result tabs) -- `font-black` to `font-bold`
- `LandingPage.tsx:155, 165` (action buttons) -- `font-black` to `font-bold`

Exception: the mobile sticky CTA at `DesignEconomicsView.tsx:762-774` can remain `font-black` because it is a primary conversion element.

---

## 4. Increase KPI strip tile values from text-xl to text-2xl

### Current state

`KpiGrid.tsx:365-396` -- all strip tile values display at `text-xl` (20px). The hero is 48-72px. The jump from 72px to 20px is a 3.6:1 ratio -- too steep. The tiles feel like footnotes to the hero rather than supporting metrics in their own right.

### Proposed

Increase strip tile values to `text-2xl` (24px). This creates a 3:1 ratio with the hero at 72px, which is within the golden section range. Also consider making IRR slightly more prominent than payout, since IRR is a decision-critical metric:

```
IRR:     text-2xl font-black text-theme-cyan (accent color for emphasis)
EUR:     text-2xl font-black text-theme-text
CAPEX:   text-2xl font-black text-theme-text
Payout:  text-xl  font-black text-theme-text (one step down -- supporting metric)
Wells:   text-xl  font-black text-theme-text (one step down -- count, not metric)
```

**Files to update:**
- `KpiGrid.tsx:365` -- AnimatedValue className: change `text-xl` to `text-2xl`
- `KpiGrid.tsx:380` -- same
- `KpiGrid.tsx:395` -- same for IRR
- `KpiGrid.tsx:409`, `KpiGrid.tsx:185` -- keep `text-xl` for Payout and Wells

---

## 5. Activate the defined typography utilities

### Current state

`app.css:48-57` defines `typo-h1` through `typo-value` -- none are used in any reviewed component. The entire typography scale is dead code.

### Proposed

Either adopt these utilities or remove them. Recommended approach: revise the utilities to match the proposed hierarchy, then migrate components.

Revised utilities:

```css
.typo-hero-value  { @apply text-5xl sm:text-6xl xl:text-7xl font-black tracking-tight; }
.typo-kpi-value   { @apply text-2xl font-black tabular-nums leading-none; }
.typo-section     { @apply text-xs font-bold uppercase tracking-[0.2em] text-theme-cyan heading-font; }
.typo-kpi-label   { @apply text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-muted; }
.typo-table-head  { @apply text-xs font-bold uppercase tracking-[0.2em] text-theme-cyan; }
.typo-body        { @apply text-sm text-theme-text; }
.typo-caption     { @apply text-xs text-theme-muted; }
.typo-table-cell  { @apply text-[11px] text-theme-text tabular-nums; }
.typo-button      { @apply text-[10px] font-bold uppercase tracking-[0.12em]; }
```

These 9 utilities would cover ~90% of the typography in the app. Components would import a single class instead of assembling 4-6 Tailwind utilities per element.

**Migration priority (highest-impact files first):**
1. `KpiGrid.tsx` -- hero value, strip tiles, labels
2. `SectionCard.tsx` -- section headings
3. `CashFlowTable.tsx` + `WellsTable.tsx` -- table chrome
4. `EconomicsDriversPanel.tsx` -- driver metrics
5. `PageHeader.tsx` -- nav chrome
6. `DesignEconomicsView.tsx` -- collapsible panel titles

---

## 6. Extend heading-font to all section-level elements

### Current state

`heading-font` class appears in SectionCard and KpiGrid tile labels, but not in table headers, collapsible panel titles, workflow steps, or driver section headers.

### Proposed

Add `heading-font` to every element at the "section heading" hierarchy level. This ensures that when a user switches to Nocturne (Cormorant Garamond) or Stormwatch (JetBrains Mono), the typographic personality change permeates the entire interface, not just scattered panels.

**Files to update:**
- `CashFlowTable.tsx:260, 289` -- add `heading-font` to "Cash Flow" title and column headers
- `WellsTable.tsx:217` -- add `heading-font` to column headers
- `WorkflowStepper.tsx:59` -- add `heading-font` to "Workflow" heading
- `WorkflowStepper.tsx:83` -- add `heading-font` to step labels
- `EconomicsDriversPanel.tsx:136` -- add `heading-font` to "Key sensitivity drivers"
- `EconomicsDriversPanel.tsx:319, 326, 337, 346` -- add `heading-font` to stat labels
- `DesignEconomicsView.tsx:128, 398, 440, 482, 533, 573` -- add `heading-font` to all collapsible section titles
- `LandingPage.tsx:201` -- add `heading-font` to "Portfolio Summary"

---

## 7. Improve GroupList metric legibility

### Current state

`GroupList.tsx:151-158` -- per-group NPV and EUR at `text-[10px] font-mono`. This is the scenario comparison surface. Users need to spot which group has the best NPV without clicking into it.

### Proposed

Increase to `text-sm` (14px), use `tabular-nums font-bold`, and give NPV the accent color:

```tsx
<span className="text-sm font-bold tabular-nums text-theme-cyan">
  ${(group.metrics.npv10 / 1e6).toFixed(1)}M
</span>
```

Also increase the label from `text-[9px]` to `text-[10px]`:

```tsx
<span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-lavender">
  NPV10
</span>
```

**File:** `GroupList.tsx:148-160`

---

## 8. Add typographic rhythm with mixed-case section subtitles

### Current state

Every piece of text below the page title is uppercase. This creates a monotone texture.

### Proposed

Introduce mixed-case (sentence case) for secondary descriptions and narrative text. Reserve uppercase exclusively for:
- Metric labels (NPV, IRR, EUR, CAPEX)
- Section headings
- Button text
- Status badges

Change to sentence case:
- `EconomicsDriversPanel.tsx:139` -- "Select a driver to see details." (already sentence case -- good)
- `EconomicsDriversPanel.tsx:270` -- narrative "Why it matters" body (already sentence case -- good)
- `CashFlowTable.tsx:249` -- empty state description (already sentence case -- good)
- `DesignEconomicsView.tsx:588-589` -- step status description

The existing sentence-case text is correct. The issue is that it is visually drowned by the surrounding uppercase elements. By reducing the weight and tracking of labels (recommendations 1-3 above), the sentence-case text will naturally breathe and provide the rhythm the scan path needs.

---

## 9. Use color to distinguish metric importance

### Current state

All KPI strip tile values render in `text-theme-text` (white/near-white). The hero uses `text-theme-cyan`. There is no color gradient across the secondary metrics.

### Proposed color assignments for KPI strip tiles:

| Metric | Color | Rationale |
|--------|-------|-----------|
| IRR | `text-theme-cyan` | Return rate is the primary decision metric after NPV |
| EUR | `text-theme-text` | Volume metric -- important but derivative |
| CAPEX | `text-theme-text` | Input metric -- user-controlled |
| Payout | `text-theme-lavender` | Time metric -- secondary decision factor |
| Wells | `text-theme-muted` | Count -- contextual, not analytical |

This creates a color hierarchy: cyan (decision-critical) > white (primary data) > lavender (secondary) > muted (contextual). The eye naturally gravitates to the colored elements.

**File:** `KpiGrid.tsx:359-418` -- update AnimatedValue className per metric

---

## 10. Summary priority matrix

| # | Recommendation | Effort | Impact | Files |
|---|---------------|--------|--------|-------|
| 1 | Consolidate tracking scale (16 -> 5) | Medium | High | 40+ files, but search-replaceable |
| 2 | Separate section heading from KPI label | Low | High | KpiGrid, SectionCard, EconomicsDriversPanel |
| 3 | Demote button weight (900 -> 700) | Low | Medium | 20+ button instances |
| 4 | Increase strip tile values (xl -> 2xl) | Low | High | KpiGrid.tsx only |
| 5 | Activate typography utilities | Medium | High | app.css + all components |
| 6 | Extend heading-font coverage | Low | Medium | 8-10 files |
| 7 | Improve GroupList metrics | Low | Medium | GroupList.tsx only |
| 8 | Mixed-case rhythm (reduce uppercase volume) | Low | Medium | Contextual -- emerges from other changes |
| 9 | Color-code KPI importance | Low | High | KpiGrid.tsx only |
| 10 | -- | -- | -- | -- |

**Recommended execution order:** 4, 9, 2, 3, 6, 1, 7, 5

Start with the changes that are low-effort and high-impact on the most-viewed surface (KPI grid), then move to systemic cleanup (tracking scale, utility adoption).
