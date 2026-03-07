---
status: diagnosed
trigger: "Theme selector in sidebar should only be in header (PageHeader)"
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:00:00Z
---

## Current Focus

hypothesis: Theme selector is duplicated -- rendered in both Sidebar bottom and PageHeader
test: Read both components
expecting: Both contain theme icon buttons
next_action: return diagnosis

## Symptoms

expected: Theme selector appears only in PageHeader (top header bar)
actual: Theme selector appears in both PageHeader AND at the bottom of the Sidebar
errors: none (visual/UX issue)
reproduction: Open workspace mode, expand sidebar -- theme icons visible at sidebar bottom
started: Introduced when Sidebar component was created in 01-02/01-03

## Eliminated

(none needed -- root cause identified on first pass)

## Evidence

- timestamp: 2026-03-07T00:00:00Z
  checked: src/components/layout/Sidebar.tsx lines 109-132
  found: Theme selector rendered at sidebar bottom when expanded (!collapsed && themes && onSetThemeId && themeId)
  implication: This is the unwanted duplicate

- timestamp: 2026-03-07T00:00:00Z
  checked: src/components/slopcast/PageHeader.tsx
  found: PageHeader already has full ThemeSwitcher component with theme icons (line 36-78, used at line 372-376)
  implication: Header already has the desired theme selector -- sidebar copy is redundant

- timestamp: 2026-03-07T00:00:00Z
  checked: src/components/layout/AppShell.tsx lines 105-119
  found: AppShell passes themeId, onSetThemeId, themes to Sidebar via sidebarProps
  implication: Props are threaded through just for the sidebar theme selector

- timestamp: 2026-03-07T00:00:00Z
  checked: src/components/layout/Sidebar.tsx interface (lines 18-20)
  found: SidebarProps includes themeId?, onSetThemeId?, themes? -- all optional, only used for theme selector
  implication: These props can be removed entirely

## Resolution

root_cause: Theme selector was added to Sidebar.tsx (lines 109-132) as a duplicate of the one already in PageHeader.tsx. Both render theme icon buttons; the sidebar copy should be removed.
fix: (diagnosis only)
verification: (diagnosis only)
files_changed: []
