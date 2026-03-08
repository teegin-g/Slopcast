---
phase: 02-content-migration-and-data-tables
plan: 01
subsystem: ui
tags: [tanstack-table, react-table, motion, framer-motion, wells-table, filter-chips]

# Dependency graph
requires:
  - phase: 01-styling-foundation-and-app-shell
    provides: Glass design system tokens, rounded-panel/rounded-inner classes, theme CSS custom properties
provides:
  - TanStack Table-powered WellsTable component with sort/filter/select/resize
  - useTableFilters hook with module-level persistence across AnimatePresence unmounts
  - FilterChips removable filter tag component
  - @tanstack/react-table and motion npm packages installed
affects: [02-02, 02-03, 03-01]

# Tech tracking
tech-stack:
  added: [@tanstack/react-table ^8, motion ^11]
  patterns: [TanStack Table headless table with glass styling, module-level filter store for persistence, bidirectional selection sync via getRowId + controlled rowSelection]

key-files:
  created:
    - src/components/slopcast/WellsTable.tsx
    - src/components/slopcast/WellsTable.test.tsx
    - src/components/slopcast/FilterChips.tsx
    - src/components/slopcast/hooks/useTableFilters.ts
  modified:
    - src/components/slopcast/DesignWellsView.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "Used module-level Map store instead of URL params for filter persistence -- avoids conflicts with existing useSidebarNav URL param pattern while surviving AnimatePresence unmounts"
  - "Set getRowId to row.id for stable selection across sort/filter operations"
  - "Typed useReactTable<Well> explicitly to resolve TypeScript generic inference issues with mixed column definitions"

patterns-established:
  - "TanStack Table integration: useReactTable<T> with getCoreRowModel + getSortedRowModel + getFilteredRowModel, glass-styled wrapper"
  - "Filter persistence: module-level store keyed by tableId, clearFilterStore() exposed for testing"
  - "Bidirectional selection: derive rowSelection Record from external Set<string>, convert back via onRowSelectionChange"

requirements-completed: [DATA-01]

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 2 Plan 1: Wells Table Summary

**TanStack Table-powered wells table with sortable columns, global search, dropdown filters with removable chips, resizable columns, and bidirectional checkbox selection synced with map via selectedWellIds**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T18:57:53Z
- **Completed:** 2026-03-08T19:02:31Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed @tanstack/react-table and motion dependencies for Phase 2
- Built WellsTable with 5 data columns + checkbox select, sorting, global filter, status/formation dropdown filters, column resize, sticky header
- Created useTableFilters hook with module-level store that persists filter state across section navigation (AnimatePresence unmount/remount)
- Created FilterChips component for removable active filter display
- Replaced GroupWellsTable with WellsTable in DesignWellsView
- Full TDD cycle: 6 unit tests covering rendering, sorting, filtering, selection, external state sync

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies + create useTableFilters + FilterChips** - `cfd6917` (feat)
2. **Task 2 RED: Add failing WellsTable tests** - `195a416` (test)
3. **Task 2 GREEN: Implement WellsTable + integrate into DesignWellsView** - `0994b9b` (feat)

## Files Created/Modified
- `src/components/slopcast/WellsTable.tsx` - TanStack Table-powered wells table with sort/filter/select/resize
- `src/components/slopcast/WellsTable.test.tsx` - 6 unit tests for wells table
- `src/components/slopcast/FilterChips.tsx` - Removable filter chip display component
- `src/components/slopcast/hooks/useTableFilters.ts` - Filter state persistence hook with module-level store
- `src/components/slopcast/DesignWellsView.tsx` - Replaced GroupWellsTable import with WellsTable
- `package.json` - Added @tanstack/react-table and motion dependencies

## Decisions Made
- Used module-level Map store for filter persistence instead of URL search params to avoid conflicts with existing useSidebarNav pattern
- Set getRowId to well.id for stable selection across sort/filter (prevents Pitfall 1 from RESEARCH.md)
- Used container.querySelector approach in tests to avoid React testing-library issues with multiple element matches

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript generic inference in useReactTable**
- **Found during:** Task 2 (WellsTable implementation)
- **Issue:** `getValue<number>()` type argument rejected, `getRowId` row parameter typed as unknown
- **Fix:** Changed to `info.getValue() as number`, added explicit `useReactTable<Well>` generic
- **Files modified:** src/components/slopcast/WellsTable.tsx
- **Verification:** npm run typecheck passes
- **Committed in:** 0994b9b

**2. [Rule 1 - Bug] Added clearFilterStore for test isolation**
- **Found during:** Task 2 (WellsTable tests)
- **Issue:** Module-level filter store leaked state between test runs causing test failures
- **Fix:** Exported clearFilterStore() function, called in beforeEach
- **Files modified:** src/components/slopcast/hooks/useTableFilters.ts, WellsTable.test.tsx
- **Verification:** All 6 tests pass reliably
- **Committed in:** 0994b9b

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed items above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- WellsTable component ready, TanStack Table and Motion packages installed
- CashFlowTable (plan 02-02) can reuse same TanStack Table patterns and useTableFilters hook
- View transitions (plan 02-03) can use already-installed motion package

---
*Phase: 02-content-migration-and-data-tables*
*Completed: 2026-03-08*
