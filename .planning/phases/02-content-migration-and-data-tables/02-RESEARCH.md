# Phase 2: Content Migration and Data Tables - Research

**Researched:** 2026-03-07
**Domain:** TanStack Table, Framer Motion, view transitions, data table UX
**Confidence:** MEDIUM-HIGH

## Summary

Phase 2 introduces two new dependencies (TanStack Table and Framer Motion) to replace hand-rolled table implementations and add view transitions. The existing codebase has two hand-rolled tables (`GroupWellsTable.tsx` and `DealsTable.tsx`) with sort/filter logic that will be replaced by TanStack Table's declarative API. The cash flow table is a net-new component built against the `MonthlyCashFlow` type. View transitions wrap the content area inside `AppShell`, keyed off the `section` value from `useSidebarNav`.

The MonthlyCashFlow type does NOT have separate oil/gas revenue fields -- only a combined `revenue` field. The CONTEXT.md specifies columns for "oil rev, gas rev" which will need to be derived or the type extended. Similarly, the cash flow data is monthly-only; annual rollup aggregation must be computed at the component level.

**Primary recommendation:** Install `@tanstack/react-table` (v8) and `motion` (formerly `framer-motion`, v11+). Build wells table first as a simpler migration from existing code, then cash flow table as a new component, then wire view transitions last since they wrap everything.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Wells table: keep current 5 columns (name, formation, lateral length, status, operator) -- no expansion
- Cash flow table: full breakdown -- month, oil vol, gas vol, oil rev, gas rev, LOE, CAPEX, taxes, net CF, cumulative
- Cash flow displays annual rollups by default with drill-down to monthly rows on click
- Negative financial values displayed as red parentheses -- $(1,234) -- standard accounting convention
- Tabular/monospace numerals for all financial columns (already decided in Phase 1)
- Compact/dense row spacing consistent with Phase 1's finance-app density
- Multi-select with checkbox column for row selection (wells table)
- Resizable columns via drag on column borders
- Sticky table header with scrollable body (no virtualization needed)
- Bidirectional sync between well table selection and map -- selecting in table highlights on map and vice versa, coordinated through useSlopcastWorkspace
- Cash flow table: annual rows expandable to show monthly detail
- Crossfade transition when switching sections via sidebar (Wells/Economics/Scenarios)
- Fast duration: 150-200ms
- Use Framer Motion (AnimatePresence + motion.div) -- new dependency
- Sub-section transitions also use the same crossfade (e.g., Summary/Charts/Drivers tabs within Economics)
- Global search bar above table + dropdown filters on key columns (status, formation for wells; year range for cash flow)
- Active filters displayed as removable chips/tags below the search bar
- Cash flow table: filter on annual summary rows (year range, cumulative thresholds)
- Filter and search state persists when switching sections -- not reset on navigation

### Claude's Discretion
- Exact column widths and responsive column hiding on mobile
- TanStack Table configuration details (column definitions, sorting functions)
- Framer Motion easing curve and exact duration within 150-200ms range
- Filter chip styling within the glass design system
- Cash flow annual rollup aggregation logic
- How bidirectional map sync integrates with existing useSlopcastWorkspace state

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Well list rendered with TanStack Table supporting sortable and filterable columns | TanStack Table column definitions, sorting/filtering plugins, checkbox row selection, column resizing. Replaces `GroupWellsTable.tsx` hand-rolled implementation. |
| DATA-02 | Cash flow table rendered with TanStack Table with consistent styling | TanStack Table with expanding rows for annual-to-monthly drill-down, accounting number formatting, computed annual rollups from `MonthlyCashFlow[]`. |
| COMP-03 | Smooth view transitions (slide/fade) when switching between sections via sidebar | Framer Motion `AnimatePresence` + `motion.div` wrapping content area in AppShell, keyed on `section` from `useSidebarNav`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-table | ^8.20 | Headless table primitives (sort, filter, select, resize, expand) | Industry standard for React tables; headless = full style control; supports all required features natively |
| motion (framer-motion) | ^11.15 | AnimatePresence crossfade transitions | De facto React animation library; AnimatePresence handles mount/unmount transitions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none -- existing stack) | -- | -- | Tailwind v4, React 19, Vite 6 already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-table | AG Grid | Overkill for 40-well dataset; heavy bundle; locked decision on TanStack |
| motion | CSS transitions | Cannot animate mount/unmount (AnimatePresence); locked decision on Framer Motion |
| motion | react-transition-group | Lower-level, more boilerplate; Framer Motion is the modern standard |

**Installation:**
```bash
npm install @tanstack/react-table motion
```

**Note on package name:** Framer Motion rebranded to `motion` starting v11. The import is `from "motion/react"` for React-specific components (`motion.div`, `AnimatePresence`). If the user specifically wants `framer-motion` package name, v11+ is available under both names but `motion` is the forward path. Confidence: MEDIUM -- verify at install time which package resolves correctly.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    slopcast/
      WellsTable.tsx           # NEW: TanStack-powered wells table (replaces GroupWellsTable)
      CashFlowTable.tsx        # NEW: TanStack-powered cash flow with expandable rows
      FilterChips.tsx           # NEW: Removable filter chip display
      hooks/
        useTableFilters.ts     # NEW: Shared filter state persistence hook
  components/
    layout/
      AppShell.tsx             # MODIFIED: Wrap children with AnimatePresence
      ViewTransition.tsx       # NEW: motion.div wrapper keyed on section
```

### Pattern 1: TanStack Table with Glass Styling
**What:** Headless table hooked into the existing theme system
**When to use:** All data tables in this phase
**Example:**
```typescript
// Confidence: HIGH -- standard TanStack Table v8 pattern
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getExpandedRowModel, ColumnDef, flexRender } from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  enableColumnResizing: true,
  columnResizeMode: 'onChange',
  state: { sorting, columnFilters, rowSelection, expanded },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onRowSelectionChange: setRowSelection,
  onExpandedChange: setExpanded,
});
```

### Pattern 2: AnimatePresence View Transition
**What:** Crossfade between section views on navigation
**When to use:** AppShell content area and EconomicsResultsTabs sub-section
**Example:**
```typescript
// Confidence: HIGH -- standard AnimatePresence pattern
import { AnimatePresence, motion } from 'motion/react';

// In AppShell, wrapping {children}:
<AnimatePresence mode="wait">
  <motion.div
    key={section}  // from useSidebarNav
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.175, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Pattern 3: Accounting Number Format
**What:** Red parentheses for negatives, tabular-nums for alignment
**When to use:** All financial columns in cash flow table
**Example:**
```typescript
function formatAccounting(value: number): { text: string; negative: boolean } {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(abs);
  if (value < 0) return { text: `(${formatted})`, negative: true };
  return { text: formatted, negative: false };
}
// In JSX:
<td className={`tabular-nums ${neg ? 'text-theme-magenta' : 'text-theme-text'}`}>
  {text}
</td>
```

### Pattern 4: Annual Rollup with Expandable Monthly Detail
**What:** Group MonthlyCashFlow[] by year, compute sums, expandable rows
**When to use:** Cash flow table
**Example:**
```typescript
// Build annual summary rows with sub-rows for TanStack expanding
interface AnnualRow {
  year: number;
  oilProduction: number;
  gasProduction: number;
  revenue: number;
  capex: number;
  opex: number;
  netCashFlow: number;
  cumulativeCashFlow: number; // end-of-year cumulative
  subRows: MonthlyCashFlow[];  // TanStack uses subRows for expanding
}

function buildAnnualRollups(flow: MonthlyCashFlow[]): AnnualRow[] {
  const byYear = new Map<number, MonthlyCashFlow[]>();
  for (const row of flow) {
    const year = new Date(row.date).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(row);
  }
  return Array.from(byYear.entries()).map(([year, months]) => ({
    year,
    oilProduction: months.reduce((s, m) => s + m.oilProduction, 0),
    gasProduction: months.reduce((s, m) => s + m.gasProduction, 0),
    revenue: months.reduce((s, m) => s + m.revenue, 0),
    capex: months.reduce((s, m) => s + m.capex, 0),
    opex: months.reduce((s, m) => s + m.opex, 0),
    netCashFlow: months.reduce((s, m) => s + m.netCashFlow, 0),
    cumulativeCashFlow: months[months.length - 1].cumulativeCashFlow,
    subRows: months,
  }));
}
```

### Pattern 5: Bidirectional Map-Table Selection Sync
**What:** Well selection in table updates map, and vice versa
**When to use:** Wells table <-> MapVisualizer
**Example:**
```typescript
// useSlopcastWorkspace already has selectedWellIds (Set<string>) and selection handlers.
// The wells TanStack Table's rowSelection state maps row indices to boolean.
// Bridge: convert between TanStack's { [rowIndex]: boolean } and workspace's Set<string>.

// Table -> workspace:
const onRowSelectionChange = (updater) => {
  const next = typeof updater === 'function' ? updater(rowSelection) : updater;
  const ids = Object.keys(next).filter(k => next[k]).map(k => sortedWells[Number(k)].id);
  onSelectWells(ids);
};

// Workspace -> table:
const rowSelection = useMemo(() => {
  const sel: Record<string, boolean> = {};
  sortedWells.forEach((w, i) => { if (selectedWellIds.has(w.id)) sel[String(i)] = true; });
  return sel;
}, [sortedWells, selectedWellIds]);
```

### Anti-Patterns to Avoid
- **Styling inside TanStack config:** TanStack Table is headless. Never put className in column definitions. Style in the render layer only.
- **Large `mode="sync"` on AnimatePresence:** Use `mode="wait"` so exit animation completes before enter begins. Prevents double-rendering content.
- **Storing filter state locally when it must persist:** Filter state must survive section switches. Store in a hook that lives above the view transition (in SlopcastPage or a context).
- **Using TanStack's built-in global filter for the search bar:** Global filter works but does not give you chip-style per-column feedback. Use column filters with a search-to-column-filter bridge.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table sorting | Custom sort comparators per column | TanStack `getSortedRowModel()` | Handles multi-sort, stable sort, type-aware comparison |
| Column filtering | Manual filter logic + state management | TanStack `getFilteredRowModel()` + column filter functions | Composable filters, faceted values, debouncing built-in |
| Column resizing | mousedown/mousemove drag handlers | TanStack `enableColumnResizing` + `columnResizeMode` | Cross-browser, handles min/max widths, cursor styles |
| Row selection with checkboxes | Manual checkbox state management | TanStack `enableRowSelection` + `getToggleSelectedHandler` | Select-all, range select, controlled state |
| Expandable row groups | Accordion state per row | TanStack `getExpandedRowModel()` + `subRows` | Handles nested expansion, toggle handlers, expanded state |
| Mount/unmount animation | CSS classes + timeouts | Framer Motion `AnimatePresence` | Deferred unmount until exit animation completes |

**Key insight:** TanStack Table provides all five table features (sort, filter, resize, select, expand) through composable plugins with a single `useReactTable` call. Reimplementing any of these is significant complexity that the library handles correctly.

## Common Pitfalls

### Pitfall 1: TanStack Row Selection with External State
**What goes wrong:** TanStack row selection uses row indices by default. If data changes (re-sort, re-filter), indices shift and selections become wrong.
**Why it happens:** Default `getRowId` uses array index.
**How to avoid:** Always provide `getRowId: (row) => row.id` to TanStack Table options. This makes selection stable across sorts/filters.
**Warning signs:** Clicking a row selects the wrong row after sorting.

### Pitfall 2: AnimatePresence Key Must Change
**What goes wrong:** Transition does not fire when switching sections.
**Why it happens:** AnimatePresence triggers exit/enter only when the `key` prop on its direct child changes.
**How to avoid:** Ensure the `key` on the motion.div equals the section string (`wells`, `economics`, `scenarios`).
**Warning signs:** Content swaps instantly with no animation.

### Pitfall 3: Filter State Reset on Section Switch
**What goes wrong:** User sets filters on wells table, switches to economics, comes back -- filters are gone.
**Why it happens:** If filter state lives inside the wells view component, AnimatePresence unmounts it on section switch.
**How to avoid:** Lift filter state above the AnimatePresence boundary. Store in a ref/context in SlopcastPage or a dedicated `useTableFilters` hook that persists across mounts.
**Warning signs:** Filters disappear when navigating away and back.

### Pitfall 4: Cash Flow Revenue Split Not in Type
**What goes wrong:** CONTEXT.md specifies separate oil rev / gas rev columns, but `MonthlyCashFlow` only has `revenue` (combined).
**Why it happens:** The economics engine computes combined revenue.
**How to avoid:** Either extend MonthlyCashFlow with `oilRevenue` / `gasRevenue` computed fields, or derive them at the table level from production * pricing. The simpler approach is to derive in the annual rollup builder using production volumes * active group pricing.
**Warning signs:** Missing columns or zero values in oil/gas revenue.

### Pitfall 5: Column Resize Conflicts with Tailwind Table Layout
**What goes wrong:** TanStack column resizing relies on explicit pixel widths via `style`. Tailwind's table utilities (`table-auto`, `table-fixed`) can fight with this.
**Why it happens:** CSS table layout algorithm overrides inline width styles.
**How to avoid:** Use `table-fixed` layout and set column widths via TanStack's `size` / `minSize` / `maxSize` in column definitions. Apply widths as inline styles on `<th>` and `<td>`.
**Warning signs:** Columns snap back to auto-width after resize drag.

### Pitfall 6: Framer Motion Bundle Size
**What goes wrong:** Importing from `motion` pulls the full library (~30KB gzip).
**Why it happens:** Tree-shaking is imperfect with motion components.
**How to avoid:** Import specifically from `motion/react` (not the root). Use `LazyMotion` + `domAnimation` feature bundle if size becomes a concern. For this app (already loading mapbox-gl, recharts, d3), the incremental cost is acceptable.
**Warning signs:** Build size regression in `npm run build`.

## Code Examples

### Wells Table Column Definitions
```typescript
// Confidence: HIGH -- direct mapping from existing GroupWellsTable columns
const wellColumns: ColumnDef<Well>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    size: 40,
    enableResizing: false,
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Well',
    size: 200,
  },
  {
    accessorKey: 'formation',
    header: 'Formation',
    size: 140,
  },
  {
    accessorKey: 'lateralLength',
    header: 'Lateral',
    cell: ({ getValue }) => formatFeet(getValue<number>()),
    size: 100,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
  },
  {
    accessorKey: 'operator',
    header: 'Operator',
    size: 160,
  },
];
```

### Sticky Header Table Shell
```typescript
// Glass-styled table wrapper matching Phase 1 design system
<div className="rounded-panel border shadow-card bg-theme-surface1/70 border-theme-border overflow-hidden">
  <div className="px-4 py-2 border-b border-theme-border/60">
    {/* Search bar + filter dropdowns */}
  </div>
  {/* Filter chips */}
  <div className="overflow-auto max-h-[60vh]">
    <table className="w-full table-fixed" style={{ width: table.getTotalSize() }}>
      <thead className="sticky top-0 z-10 bg-theme-surface1 border-b border-theme-border">
        {/* TanStack header groups */}
      </thead>
      <tbody className="text-[11px] text-theme-text">
        {/* TanStack rows */}
      </tbody>
    </table>
  </div>
</div>
```

### View Transition Wrapper
```typescript
// ViewTransition.tsx -- reusable wrapper
import { AnimatePresence, motion } from 'motion/react';

interface ViewTransitionProps {
  transitionKey: string;
  children: React.ReactNode;
}

export function ViewTransition({ transitionKey, children }: ViewTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.175, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion package | motion package | 2024 (v11) | Import path changed to `motion/react` |
| react-table v7 (render props) | @tanstack/react-table v8 (hooks) | 2022 | Fully headless, no built-in UI |
| Manual column resize with DOM events | TanStack columnResizeMode | v8 native | Built-in resize handles and state |

**Deprecated/outdated:**
- `framer-motion` package name: Still works but `motion` is the maintained path forward
- TanStack Table `useTable` (v7 API): Replaced by `useReactTable` in v8

## Open Questions

1. **Oil/Gas Revenue Split**
   - What we know: `MonthlyCashFlow.revenue` is combined. CONTEXT.md wants separate oil rev / gas rev columns.
   - What's unclear: Whether to extend the type or derive at display time.
   - Recommendation: Derive at display time using `oilProduction * oilPrice` and `gasProduction * gasPrice` from the active group's pricing assumptions. Avoids changing the economics engine.

2. **motion vs framer-motion Package Name**
   - What we know: The library rebranded from `framer-motion` to `motion` around v11.
   - What's unclear: Exact current version number (training data suggests v11.x).
   - Recommendation: Install `motion` and import from `motion/react`. If that fails, fall back to `npm install framer-motion` and `import from "framer-motion"`. Verify at install time.

3. **Filter State Persistence Architecture**
   - What we know: Filters must survive section switches. AnimatePresence unmounts views.
   - What's unclear: Best place to store -- context vs lifted state vs URL params.
   - Recommendation: URL search params for filter state (consistent with existing section navigation pattern via `useSearchParams`). Filters become shareable and survive navigation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Wells table renders with sorting and filtering | unit | `npx vitest run src/components/slopcast/WellsTable.test.tsx` | Wave 0 |
| DATA-01 | Row selection syncs with external selectedWellIds | unit | `npx vitest run src/components/slopcast/WellsTable.test.tsx` | Wave 0 |
| DATA-02 | Cash flow table renders annual rollups with expandable monthly rows | unit | `npx vitest run src/components/slopcast/CashFlowTable.test.tsx` | Wave 0 |
| DATA-02 | Negative values display as red parentheses | unit | `npx vitest run src/components/slopcast/CashFlowTable.test.tsx` | Wave 0 |
| COMP-03 | View transition fires on section change | unit | `npx vitest run src/components/layout/ViewTransition.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run typecheck && npm run build`
- **Phase gate:** Full suite green + `npm run ui:audit` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/slopcast/WellsTable.test.tsx` -- covers DATA-01
- [ ] `src/components/slopcast/CashFlowTable.test.tsx` -- covers DATA-02
- [ ] `src/components/layout/ViewTransition.test.tsx` -- covers COMP-03
- [ ] `src/utils/cashFlowRollup.test.ts` -- unit test for annual aggregation logic

## Sources

### Primary (HIGH confidence)
- Existing codebase: `GroupWellsTable.tsx`, `DealsTable.tsx`, `AppShell.tsx`, `useSidebarNav.ts`, `types.ts`
- Project CONTEXT.md with locked decisions

### Secondary (MEDIUM confidence)
- TanStack Table v8 API (from training data, May 2025): `useReactTable`, row model plugins, column resizing, expanding -- well-established stable API
- Framer Motion / motion v11 API (from training data): `AnimatePresence`, `motion.div`, `mode="wait"` -- stable well-documented API

### Tertiary (LOW confidence)
- Exact latest version numbers for `@tanstack/react-table` and `motion` -- verify at install time
- `motion` vs `framer-motion` import path resolution -- verify at install time

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH - TanStack Table v8 and Framer Motion are well-established but exact current versions unverified
- Architecture: HIGH - Based on direct analysis of existing codebase structure, types, and integration points
- Pitfalls: HIGH - Identified from known common issues with these libraries and specific codebase constraints (MonthlyCashFlow type gap, filter state lifecycle)

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable libraries, low churn)
