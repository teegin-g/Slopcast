# Phase 2: Content Migration and Data Tables - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Wells/Economics/Scenarios views into the new app shell with TanStack Table-powered data tables and Framer Motion view transitions. Tables must integrate with the glassmorphism design system from Phase 1. Inline editing of assumptions is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Table columns & density
- Wells table: keep current 5 columns (name, formation, lateral length, status, operator) — no expansion
- Cash flow table: full breakdown — month, oil vol, gas vol, oil rev, gas rev, LOE, CAPEX, taxes, net CF, cumulative
- Cash flow displays annual rollups by default with drill-down to monthly rows on click
- Negative financial values displayed as red parentheses — $(1,234) — standard accounting convention
- Tabular/monospace numerals for all financial columns (already decided in Phase 1)
- Compact/dense row spacing consistent with Phase 1's finance-app density

### Table interactions
- Multi-select with checkbox column for row selection (wells table)
- Resizable columns via drag on column borders
- Sticky table header with scrollable body (no virtualization needed)
- Bidirectional sync between well table selection and map — selecting in table highlights on map and vice versa, coordinated through useSlopcastWorkspace
- Cash flow table: annual rows expandable to show monthly detail

### View transitions
- Crossfade transition when switching sections via sidebar (Wells/Economics/Scenarios)
- Fast duration: 150-200ms
- Use Framer Motion (AnimatePresence + motion.div) — new dependency
- Sub-section transitions also use the same crossfade (e.g., Summary/Charts/Drivers tabs within Economics)

### Filter & search UX
- Global search bar above table + dropdown filters on key columns (status, formation for wells; year range for cash flow)
- Active filters displayed as removable chips/tags below the search bar
- Cash flow table: filter on annual summary rows (year range, cumulative thresholds)
- Filter and search state persists when switching sections — not reset on navigation

### Claude's Discretion
- Exact column widths and responsive column hiding on mobile
- TanStack Table configuration details (column definitions, sorting functions)
- Framer Motion easing curve and exact duration within 150-200ms range
- Filter chip styling within the glass design system
- Cash flow annual rollup aggregation logic
- How bidirectional map sync integrates with existing useSlopcastWorkspace state

</decisions>

<specifics>
## Specific Ideas

- Cash flow table should feel like a financial spreadsheet — annual rollups with expandable monthly detail, red parentheses for negatives
- Table interactions should be rich (checkboxes, resizable columns, sticky headers) but not over-engineered — this is a working finance tool, not a spreadsheet app
- View transitions should be fast and subtle — crossfade that adds polish without slowing navigation
- Filter chips give immediate visual feedback about what's filtered — dismissible with X

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GroupWellsTable.tsx`: Existing hand-rolled wells table with sort/filter — will be replaced by TanStack version but column definitions and formatting helpers (formatFeet, compareValues) can be reused
- `DealsTable.tsx`: Another hand-rolled table with sort/filter — same patterns, provides reference for status badges and currency formatting
- `src/styles/theme.css`: CSS custom properties (R G B channels) for Tailwind opacity modifiers — tables style through these
- `isClassic` branching pattern: Both existing tables already branch for Mario vs modern themes — maintain this
- `useSlopcastWorkspace.ts`: God hook (~900 lines) with well selection state — bidirectional map sync connects here
- `useViewportLayout.ts`: Viewport breakpoint detection for responsive table behavior

### Established Patterns
- Tables use `rounded-panel border shadow-card` outer wrapper with `bg-theme-surface1/70`
- Headers use `text-[10px] font-black uppercase tracking-[0.24em] text-theme-cyan`
- Financial values use `tabular-nums` class for alignment
- Sort indicators: inline arrows (▲/▼ or ↑/↓) on column headers
- Empty states: centered icon + message + CTA pattern (see DealsTable)

### Integration Points
- `SlopcastPage.tsx` → `AppShell` → content area is where view transitions wrap
- `DesignWellsView.tsx` contains the wells section — GroupWellsTable lives here
- `DesignEconomicsView.tsx` contains economics — cash flow table will be a new component here
- `EconomicsResultsTabs.tsx` handles Summary/Charts/Drivers sub-tabs — sub-section transitions wrap here
- URL search params drive section navigation (from Phase 1) — Framer Motion keys off section changes

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-content-migration-and-data-tables*
*Context gathered: 2026-03-07*
