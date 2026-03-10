# Slopcast Wells & Economics — Design Critique

**Date:** 2026-03-10
**Branch:** codex/ui-improvements-drivers-focus
**Focus:** Clutter, visual hierarchy, information density, layout efficiency
**Auditor:** Claude Code

## Anti-Patterns Verdict

**PASS.** Not AI-generated looking. The `isClassic` fork, per-theme panelStyle/headingFont differentiation, and domain-specific language (EUR, payout, breakeven, NRI) are all signs of intentional, human-directed design. No gradient text, no generic card grids, no glassmorphism abuse.

## Overall Impression

**The user is right — it's cluttered.** Both sections suffer from the same core problem: **too many panels competing at the same visual weight.** Everything is a `rounded-panel border shadow-card` with identical surface treatment, so nothing recedes and nothing pops. The Economics section is the worst offender — on desktop you see: GroupBar + mobile toggle + 5-tab bar + KPI hero + KPI strip + AccentDivider + GroupComparison + QuickDrivers + AccentDivider + "Execution" label + OperationsConsole + ForecastGrid + EngineComparisonPanel. That's **12+ distinct visual blocks** before scrolling, all wrapped in bordered panels.

**The single biggest opportunity:** Establish a clear **2-tier surface hierarchy** — primary content (KPIs, charts, drivers) gets visual prominence, secondary/utility content (setup insights, operations console, engine comparison) gets quieter treatment or collapses by default.

## What's Working

1. **EconomicsGroupBar is well-designed.** Compact, sticky, searchable dropdown with sort chips, health badges, and keyboard navigation. This is one of the best-executed components — dense information without feeling cluttered because it has clear visual hierarchy within a single bar.

2. **EconomicsDriversPanel has good interaction design.** Selectable driver rows with inline bar charts, expanding detail cards, waterfall chart, and "Jump to driver" CTAs that deep-link to controls. This is genuinely useful workflow — the problem is it's buried as a tab rather than being the star.

3. **Wells view has the right structure.** Left sidebar (groups + filters) + right map is the correct layout. The map gets dominant space, the tooling stays out of the way. The mobile tray pattern with "More/Less" is thoughtful.

## Priority Issues

### P1. Economics: 12+ equal-weight panels create visual noise

**What:** Every section — KPIs, comparison, drivers, operations, forecast, engine comparison — is wrapped in `rounded-panel border shadow-card` with identical padding, opacity, and border treatment. Nothing recedes.

**Why it matters:** When everything has the same visual weight, the user's eye has no path. An A&D analyst opening this view should instantly see NPV and key metrics — instead they're scanning a wall of equally-prominent boxes.

**Fix:** Create a 2-tier panel system:
- **Tier 1 (content):** KpiGrid, Charts, Drivers — full surface treatment, shadow, border
- **Tier 2 (utility):** OperationsConsole, ForecastGrid, EngineComparison, Setup Insights — borderless or outline-only, no shadow, reduced opacity. Consider making OperationsConsole and EngineComparison default-collapsed or moved to a slide-out drawer.

**Command:** `/distill` to strip the utility panels to essentials, then `/normalize` to establish consistent tier hierarchy.

### P2. Economics left column: 7 stacked panels with no grouping

**What:** The setup aside stacks: MiniMapPreview → Controls (with nested sections: Template, CAPEX Snapshot, Decline Profile, CAPEX Logic, LOE, Ownership) → Tax & Fiscal → Leverage → Reserve Category → Advanced Settings → Setup Insights. That's **7 top-level collapsibles** plus multiple nested sections inside Controls, all with identical panel treatment.

**Why it matters:** This is the "setup" column, but it feels like an infinite scroll of configuration. Users doing a quick deal evaluation don't need Tax, Leverage, Reserve Category, and Advanced Settings visible. These are power-user features that should be behind a single "Advanced" accordion, not 4 separate ones.

**Fix:**
- Merge Tax, Leverage, Reserve Category, and Advanced Settings into a **single** "Advanced Configuration" collapsible with internal tabs or sub-sections
- Move Setup Insights to the GroupBar (it's already showing health badges there — consolidate)
- Consider making MiniMapPreview collapsible or removing it entirely from Economics (it's already in Wells view)

**Command:** `/distill` to collapse the 4 advanced panels into 1.

### P3. Duplicate information shown simultaneously

**What:** The same data appears in multiple places:
- **Group name + wells count** appears in: GroupBar, GroupBar summary row, Controls header, MiniMapPreview label, Setup Insights, and QuickDrivers
- **NPV** appears in: KpiGrid hero, GroupBar summary, GroupComparisonStrip, QuickDrivers, OperationsConsole, EconomicsDriversPanel
- **Breakeven oil price** appears in: KpiGrid (below hero), QuickDrivers, EconomicsDriversPanel

**Why it matters:** Redundancy isn't reinforcement when it's this dense — it's noise. Each repeated element takes visual space and cognitive load without adding new information.

**Fix:**
- Show NPV in exactly 2 places: the hero KPI and the group comparison strip
- Show breakeven in exactly 1 place: the Drivers tab (where it has context)
- Remove the GroupBar summary row — the GroupBar select button already shows the group name with color dot
- Remove group name/wells from Controls header — it's redundant with the GroupBar

**Command:** `/distill`

### P4. Wells view: Filters panel is too prominent for a secondary tool

**What:** The FiltersPanel takes up significant vertical space in the left column with 3 full-width select dropdowns stacked vertically, each with a label, plus a "visible / total" counter. This pushes the WellsTable (the actual useful content) further down.

**Why it matters:** Filters are a tool you use briefly, not content you reference. They shouldn't compete with the group list and wells table for attention.

**Fix:** Replace the 3 stacked dropdowns with a **single horizontal filter bar** above the map (or at the top of the sidebar), using compact chip-style or inline selects. Show active filter chips that can be dismissed. The current FilterChips component exists in the codebase — use it as the primary filter UI and make the full FilterPanel a collapsible "Advanced Filters" option.

**Command:** `/distill` to compact the filter UI.

### P5. 5-tab results bar adds decision fatigue

**What:** `EconomicsResultsTabs` presents Summary, Charts, Cash Flow, Drivers, Reserves as 5 equal-weight buttons in a grid. Below the tabs, the Summary view then shows its own sub-sections (KPIs, comparison, drivers snippet, operations).

**Why it matters:** 5 tabs is a lot for a results pane that already has a summary view trying to show everything. The Summary tab duplicates elements from Charts (sparkline in KPI hero), Drivers (QuickDrivers panel, operations console has a "Key Drivers" sub-tab), and Cash Flow (sparkline). It tries to be a dashboard of dashboards.

**Fix:** Consider whether Summary + Charts + Drivers could be a single scrollable view with sections rather than 3 separate tabs. Cash Flow and Reserves are distinct enough to warrant tabs. This would reduce to 3 tabs: **Overview** (KPIs + chart + drivers), **Cash Flow**, **Reserves**.

**Command:** `/distill`

## Minor Observations

- **AccentDivider** (`DesignEconomicsView.tsx:102-104`) — a gradient line between sections adds visual noise without serving hierarchy. Remove it. White space is a better divider.
- **"Execution" label** (`DesignEconomicsView.tsx:654-660`) — a tiny 9px label that says "Execution" before the OperationsConsole. This is vestigial UI — the OperationsConsole already has its own title. Remove.
- **OperationsConsole rendered twice** — Once inside the Summary tab (`compactEconomics` mode), once outside for other tabs. Two different layouts for the same component adds maintenance burden and user confusion.
- **MiniMapPreview in Economics** — Shows a tiny 120px SVG of well locations. In the Economics view, this adds almost no value. Users already assigned wells in the Wells view. Remove or make it a hover/tooltip on the group name.
- **Mobile toggle panels** (SETUP/RESULTS, GROUPS/MAP) — Both use identical 2-column grid button layouts. Good consistency, but the text-[9px] size might be hard to tap. Consider larger touch targets.

## Questions to Consider

- **What if the Economics view defaulted to Focus Mode?** Focus mode hides the setup column and gives results full width. If most users are reviewing results, not tweaking inputs, this might be the right default — with a clear "Edit Setup" button to expand the column.
- **What if QuickDrivers, GroupComparison, and OperationsConsole were removed from Summary and only lived in their own tabs/sections?** Summary would become: Hero NPV + 4 KPI tiles. Clean, scannable, decisive.
- **What would this look like with 50% fewer panels?** Not 50% less information — 50% fewer *containers*. Group related metrics into shared panels instead of wrapping each in its own bordered card.
- **Does the user need to see 7 setup controls simultaneously?** Or do they work through them sequentially? If sequential, a stepper/wizard pattern would reduce visible complexity dramatically.

## Recommended Next Steps

1. **`/distill`** on Economics view — collapse advanced panels, remove duplicate info, simplify Summary tab
2. **`/distill`** on Wells view — compact the filters panel
3. **`/normalize`** — establish 2-tier panel hierarchy across both views
4. **`/polish`** — final pass on spacing, alignment, and visual rhythm after structural changes
