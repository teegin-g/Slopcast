# Requirements: Slopcast UI Revamp

**Defined:** 2026-03-06
**Core Value:** Users can navigate the workspace intuitively — always knowing where they are, what they can do, and how to find settings — without the UI getting in the way of the animated themes underneath.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Styling Foundation

- [x] **STYLE-01**: Tailwind CSS v4 installed and wired with existing CSS custom properties via @theme
- [x] **STYLE-02**: Spacing tokens standardized on 4/8/12/16/24/32/48px grid across all workspace components
- [x] **STYLE-03**: Typography hierarchy defined with 5-6 levels (H1, H2, H3, body, caption, label) using Tailwind utilities
- [x] **STYLE-04**: Hover and focus-visible states present on all interactive elements (buttons, table rows, sidebar items, inputs)
- [x] **STYLE-05**: Glassmorphism token system established (--glass-sidebar, --glass-panel, --glass-card) with backdrop-blur + semi-transparent backgrounds
- [x] **STYLE-06**: Animated canvas backgrounds remain visible and prominent through the glass UI shell across all themes

### Navigation

- [x] **NAV-01**: Persistent collapsible sidebar replaces tab-based view switching (Wells, Economics, Analysis sections)
- [x] **NAV-02**: Breadcrumb or active-section indicator visually shows current location at all times
- [x] **NAV-03**: Sidebar collapses to icon-only mode on viewports narrower than breakpoint
- [x] **NAV-04**: URL state synced with sidebar navigation so browser back/forward works

### Components

- [x] **COMP-01**: Unified outer card component with glass styling used consistently across workspace
- [x] **COMP-02**: Unified inner card component for nested content tiles used consistently
- [x] **COMP-03**: Smooth view transitions (slide/fade) when switching between sections via sidebar

### Data & Editing

- [x] **DATA-01**: Well list rendered with TanStack Table supporting sortable and filterable columns
- [x] **DATA-02**: Cash flow table rendered with TanStack Table with consistent styling
- [ ] **DATA-03**: User can edit type curve, CAPEX, OPEX, and ownership assumptions inline where they are displayed
- [ ] **DATA-04**: Inline edits are debounced/buffered (commit-on-blur) to prevent economics recalculation storms

### Responsive

- [x] **RESP-01**: Desktop layout renders sidebar + content area with full functionality
- [x] **RESP-02**: Mobile layout collapses sidebar to drawer or bottom nav with preserved functionality

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Navigation Enhancement

- **NAV-05**: Command palette (Cmd+K) for quick-jumping to any group, section, or action
- **NAV-06**: Keyboard-first navigation (Tab through sidebar, arrow keys in tables, Escape to close)

### Settings & Organization

- **SET-01**: Settings/preferences (theme, engine, mode) consolidated in sidebar section
- **SET-02**: Drag-to-reorder sidebar well group items

### Data Presentation

- **DATA-05**: Inspector panel (right-side detail panel) for selected well group context
- **DATA-06**: Loading skeleton states for KPI grid, charts, and tables
- **DATA-07**: Empty states with CTAs for all data panels
- **DATA-08**: Snapshot/version indicator showing last save time

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hub page redesign | Workspace-only scope for this milestone |
| Auth page redesign | Workspace-only scope |
| Integrations page redesign | Workspace-only scope |
| UX workflow rethink | Visual/layout only — no changes to how deals flow from wells → assumptions → economics |
| New features or functionality | This is a reskin, not a feature build |
| Backend changes | Front-end only |
| Dark/light mode toggle | App is inherently dark (animated backgrounds); themes provide variety |
| Dashboard customization / widget grid | Over-engineering for a focused economics tool |
| Notification center | Single-user modeling tool, not collaboration platform |
| Multi-level nested navigation | Only ~4 sections; deep nav trees add complexity without value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STYLE-01 | Phase 1 | Complete |
| STYLE-02 | Phase 1 | Complete |
| STYLE-03 | Phase 1 | Complete |
| STYLE-04 | Phase 1 | Complete |
| STYLE-05 | Phase 1 | Complete |
| STYLE-06 | Phase 1 | Complete |
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| NAV-04 | Phase 1 | Complete |
| COMP-01 | Phase 1 | Complete |
| COMP-02 | Phase 1 | Complete |
| COMP-03 | Phase 2 | Complete |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| RESP-01 | Phase 1 | Complete |
| RESP-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after roadmap creation*
