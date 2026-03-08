---
status: complete
phase: 02-content-migration-and-data-tables
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md]
started: 2026-03-08T19:15:00Z
updated: 2026-03-08T19:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Wells Table Renders with Sortable Columns
expected: Navigate to the Wells section via sidebar. The wells table shows 5 columns (Well, Formation, Lateral, Status, Operator). Clicking any column header sorts rows by that column. Sort indicator appears on active column.
result: pass

### 2. Wells Table Global Search and Dropdown Filters
expected: Above the wells table, there is a search bar and dropdown filters for Status and Formation. Typing in search filters across all columns. Selecting a dropdown value filters to matching rows. Active filters appear as removable chips below the search bar. Clicking X on a chip removes that filter.
result: pass

### 3. Wells Table Checkbox Selection and Map Sync
expected: Each row has a checkbox. Checking a row selects it (row highlights). Selected wells are also highlighted on the map. Conversely, selecting wells on the map checks the corresponding rows in the table. A header checkbox selects/deselects all visible rows.
result: pass

### 4. Wells Table Column Resizing and Sticky Header
expected: Hovering between column headers shows a resize cursor. Dragging resizes the column. When scrolling a long well list, the table header stays pinned at the top while the body scrolls.
result: pass

### 5. Cash Flow Table with Annual Rollups
expected: Navigate to Economics, select a well group with economics data, then click the "Cash Flow" tab in the results area. The table shows annual summary rows with columns for year, oil/gas volumes, oil/gas revenue, LOE, CAPEX, taxes, net CF, and cumulative. Financial values use tabular-nums alignment.
result: pass

### 6. Cash Flow Table Expandable Monthly Detail
expected: Clicking an annual row (or its expand arrow) expands it to show the individual monthly rows underneath. Clicking again collapses them. Monthly rows show the same columns with per-month data.
result: pass

### 7. Cash Flow Negative Values in Red Parentheses
expected: Any negative financial value in the cash flow table displays as red text in accounting format with parentheses, e.g., $(1,234) instead of -$1,234.
result: pass

### 8. Section Crossfade Transition
expected: Click between Wells, Economics, and Scenarios in the sidebar. Each switch shows a fast, smooth crossfade (old view fades out, new view fades in). The transition takes roughly 150-200ms — noticeable polish but not slow.
result: pass

### 9. Sub-Tab Crossfade Transition
expected: Within Economics, switch between Summary, Charts, Cash Flow, and Drivers tabs. Each switch also shows the same fast crossfade transition, consistent with the section-level transitions.
result: pass

### 10. Glass Design System Consistency
expected: Both tables (wells and cash flow) use the glass panel styling — semi-transparent backgrounds, theme-colored borders, theme-colored header text. Tables look consistent with the rest of the app across at least Slate and one other theme.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
