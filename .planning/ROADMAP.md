# Roadmap: Slopcast UI Revamp

## Overview

This roadmap transforms the Slopcast workspace from a tab-based layout with broken Tailwind classes into a modern app shell with persistent sidebar navigation, glassmorphic surfaces over animated canvas backgrounds, TanStack-powered data tables, and inline assumption editing. Three phases deliver: (1) the styling infrastructure and navigation shell, (2) content migration into the new shell with proper data tables, (3) inline editing capabilities. Each phase builds on the previous and delivers a coherent, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Styling Foundation and App Shell** - Install Tailwind v4, establish glass token system, build sidebar navigation shell with responsive layout
- [x] **Phase 2: Content Migration and Data Tables** - Migrate Wells/Economics/Scenarios views into new shell with TanStack Table and view transitions (completed 2026-03-08)
- [ ] **Phase 3: Inline Editing** - Enable inline assumption editing with buffered inputs and debounced economics recalculation

## Phase Details

### Phase 1: Styling Foundation and App Shell
**Goal**: Users can navigate the workspace via a persistent sidebar over glassmorphic surfaces, with animated backgrounds visible underneath, on both desktop and mobile
**Depends on**: Nothing (first phase)
**Requirements**: STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-05, STYLE-06, NAV-01, NAV-02, NAV-03, NAV-04, COMP-01, COMP-02, RESP-01, RESP-02
**Success Criteria** (what must be TRUE):
  1. User sees Tailwind utility classes rendering correctly across all workspace components (no dead CSS)
  2. User can navigate between Wells, Economics, and Scenarios sections via a persistent sidebar without losing context
  3. User can see the current section indicated in the sidebar and URL updates to reflect navigation (browser back/forward works)
  4. User sees animated canvas backgrounds visible through semi-transparent glass panels across all 6 themes
  5. User on mobile sees sidebar collapsed to a drawer or bottom nav with equivalent navigation capability
**Plans:** 4/6 plans executed

Plans:
- [x] 01-01-PLAN.md -- Tailwind v4 migration, glassmorphism token system, GlassPanel/GlassCard/Vignette components
- [x] 01-02-PLAN.md -- Sidebar navigation shell, URL state sync, responsive AppShell layout, mobile drawer
- [ ] 01-03-PLAN.md -- Spacing/typography/interaction state polish, visual verification across all themes
- [ ] 01-04-PLAN.md -- (gap closure) Remove duplicate theme selector from sidebar
- [ ] 01-05-PLAN.md -- (gap closure) Replace hardcoded colors with theme tokens in 14 high-impact components
- [ ] 01-06-PLAN.md -- (gap closure) Replace hardcoded colors in remaining 15 components + chart inline styles

### Phase 2: Content Migration and Data Tables
**Goal**: Users interact with Wells and Economics data through sortable, filterable tables inside the new app shell, with smooth transitions between views
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. User can sort and filter the well list by any column (operator, formation, status, etc.)
  2. User can view cash flow data in a styled table with sortable columns matching the glass design system
  3. User sees smooth slide/fade transitions when switching between sections via the sidebar
**Plans:** 3/3 plans complete

Plans:
- [x] 02-01-PLAN.md -- Install TanStack Table + Motion, build wells table with sort/filter/select/resize, bidirectional map sync
- [ ] 02-02-PLAN.md -- Cash flow table with annual rollup rows, expandable monthly detail, accounting number formatting
- [ ] 02-03-PLAN.md -- Framer Motion crossfade view transitions for section and sub-tab switching

### Phase 3: Inline Editing
**Goal**: Users can edit assumptions directly where they are displayed without navigating to separate editing panels
**Depends on**: Phase 2
**Requirements**: DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. User can click on a type curve, CAPEX, OPEX, or ownership value and edit it in place
  2. Edits commit on blur (not on every keystroke) and economics recalculate after a debounce delay without UI lag
  3. User can edit multiple assumption fields in sequence without triggering a recalculation storm
**Plans:** 2 plans

Plans:
- [ ] 03-01-PLAN.md -- InlineEditableValue component, useDebouncedRecalc hook, RecalcStatus context, shimmer CSS, with tests
- [ ] 03-02-PLAN.md -- Wire inline editing into Controls/Capex/Opex/Ownership, debounced recalc through DesignEconomicsView, KPI shimmer

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Styling Foundation and App Shell | 4/6 | In Progress|  |
| 2. Content Migration and Data Tables | 3/3 | Complete    | 2026-03-08 |
| 3. Inline Editing | 0/2 | Not started | - |
