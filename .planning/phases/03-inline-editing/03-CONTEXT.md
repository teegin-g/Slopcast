# Phase 3: Inline Editing - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable inline assumption editing for type curve, CAPEX, OPEX, and ownership — users click values to edit in place, edits commit on blur with debounced economics recalculation. No separate editing panels or pages. This phase does NOT add new assumption types or change the economics engine.

</domain>

<decisions>
## Implementation Decisions

### Edit trigger & interaction
- Click-to-edit: single click on a value transforms it into an input field
- Hover affordance only: no visual hint at rest, hover reveals light background highlight + edit cursor
- Tab advances to next editable field (spreadsheet-style sequential editing)
- Escape cancels active edit and reverts to original value
- Enter commits the value (same as blur)

### Commit & recalculation
- Commit-on-blur: value saves when input loses focus (not on every keystroke)
- Debounce delay: 300-500ms after last edit before triggering economics recalculation
- Subtle pulse/shimmer animation on KPI values during recalculation — signals update without blocking UI
- Multiple sequential edits (via Tab) accumulate — single recalc fires after debounce from last edit

### Which assumptions are inline-editable
- All four types: type curve (qi, b, di), CAPEX (9 line items), OPEX (LOE segments), ownership (NRI, cost interest)
- CAPEX supports full CRUD inline: add new line items, remove existing, edit both category name and dollar amount
- OPEX follows same CRUD pattern for LOE segments

### Edit UI appearance
- Validation errors: red border on input + tooltip with error message
- Inline inputs styled to match glass design system (theme tokens, compact density from Phase 1)

### Claude's Discretion
- Number formatting during edit (raw vs live-formatted) — pick what works best for financial input UX
- Undo mechanism (simple re-edit vs Ctrl+Z) — decide based on complexity tradeoff
- Exact pulse/shimmer animation implementation for recalc feedback
- Add/remove row UI for CAPEX/OPEX (button placement, confirmation)
- Input sizing and auto-width behavior
- Tooltip positioning and styling

</decisions>

<specifics>
## Specific Ideas

- Editing should feel like a spreadsheet — click, type, Tab to next, blur commits
- No mode switches or edit panels — values are always "right there"
- Finance-app density (Phase 1) means inline inputs should be compact, not expand the layout
- Recalc feedback should be subtle (shimmer/pulse) not blocking (no loading overlays)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CapexControls.tsx`, `OpexControls.tsx`, `OwnershipControls.tsx`: Existing assumption editors with full state management — logic can be extracted, UI replaced with inline pattern
- `Controls.tsx`: Master controls panel that orchestrates all assumption editors
- `useSlopcastWorkspace.ts`: God hook (~900 lines) manages all assumption state and triggers economics recalculation
- `economicsEngine.ts`: Engine adapter that runs recalculation — consumer of assumption changes
- TanStack Table pattern (Phase 2): CAPEX/OPEX line items could use table rows with inline editing

### Established Patterns
- `isClassic` branching for Mario vs modern themes — inline inputs need both paths
- Glass panel styling (`rounded-panel`, `bg-theme-surface1/70`, `border-theme-border`)
- Tabular-nums for financial values (Phase 2)
- commit-on-blur already used in some form controls

### Integration Points
- Assumption state lives in `useSlopcastWorkspace` → inline edits update via same callbacks
- Economics recalculation triggered by assumption state changes → debounce wraps this
- `DesignEconomicsView.tsx` renders assumption controls → inline editing replaces or augments these
- KPI grid (`KpiGrid.tsx`) displays results → needs shimmer animation hook for recalc feedback

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-inline-editing*
*Context gathered: 2026-03-08*
