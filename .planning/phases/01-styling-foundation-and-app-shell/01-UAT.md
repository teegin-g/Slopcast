---
status: diagnosed
phase: 01-styling-foundation-and-app-shell
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md]
started: 2026-03-07T12:00:00Z
updated: 2026-03-07T12:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. App Loads Without Errors
expected: Navigate to localhost:3000. The app loads without console errors. Sidebar visible on left, main content area on right, animated canvas background visible behind panels.
result: pass

### 2. Sidebar Navigation Sections
expected: Sidebar shows three navigation items: Wells, Economics, and Scenarios. Clicking each switches the main content view. Active section shows a visual indicator (highlight or accent).
result: pass

### 3. Glass Panel Styling
expected: Content panels have a translucent glass effect — you can see the animated background through them. Panels have subtle borders and shadows. The overall look is layered and atmospheric, not flat.
result: issue
reported: "Make sure panel and tile border colors and font colors match the color tokens for the themes"
severity: major

### 4. Vignette Overlay
expected: A subtle dark gradient is visible at the edges of the viewport, creating a vignette effect that frames the content. Most noticeable at the corners.
result: pass

### 5. Theme Switching
expected: Theme selector (icon dots at bottom of sidebar) lets you switch between themes. Each theme changes the overall color scheme — background, panel tinting, accent colors should all change. Try at least Slate, Synthwave, and Mario.
result: issue
reported: "the theme should only be accessible in the header, not sidebar"
severity: major

### 6. Mario Theme Classic Mode
expected: When Mario theme is active, panels should have a solid retro look (NO glass transparency/blur) with distinct borders. It should look intentionally different from the glass themes.
result: pass

### 7. Well Group Tree
expected: Sidebar shows a collapsible well group list. Groups can be expanded/collapsed. Each group shows a color dot and well count badge.
result: pass

### 8. URL Navigation Sync
expected: Clicking sidebar sections updates the URL (search params change). Using browser back/forward buttons navigates between previously visited sections.
result: pass

### 9. Sidebar Collapse Toggle
expected: Desktop: a toggle button collapses the sidebar to a narrow icon strip. Clicking again expands it. The collapse preference persists across page reloads.
result: pass

### 10. Mobile Responsive Layout
expected: Narrow the browser window below ~768px. Sidebar should auto-hide. A hamburger/menu button appears to open the sidebar as a drawer overlay. Clicking the backdrop or pressing Escape closes it.
result: pass

## Summary

total: 10
passed: 8
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Content panels have translucent glass effect with theme-appropriate borders, shadows, and font colors"
  status: failed
  reason: "User reported: Make sure panel and tile border colors and font colors match the color tokens for the themes"
  severity: major
  test: 3
  root_cause: "27+ child components use hardcoded Tailwind color classes (text-white/, border-white/, bg-black/) and inline rgba() instead of theme tokens (text-theme-text/, border-theme-border/, bg-theme-surface1/)"
  artifacts:
    - path: "src/components/slopcast/EconomicsGroupBar.tsx"
      issue: "13 white/ + 14 black/ hardcoded color classes"
    - path: "src/components/slopcast/DesignEconomicsView.tsx"
      issue: "13 white/ + 9 black/ hardcoded color classes"
    - path: "src/components/slopcast/PageHeader.tsx"
      issue: "8 white/ + 12 black/ hardcoded color classes"
    - path: "src/components/slopcast/EconomicsDriversPanel.tsx"
      issue: "10 white/ + 9 black/ hardcoded color classes"
    - path: "src/components/slopcast/ProfileSelector.tsx"
      issue: "10 white/ + 9 black/ hardcoded color classes"
    - path: "src/components/slopcast/DealsTable.tsx"
      issue: "9 white/ + 1 black/ hardcoded color classes"
    - path: "src/components/slopcast/DesignWellsView.tsx"
      issue: "9 white/ + 5 black/ hardcoded color classes"
    - path: "src/components/slopcast/WaterfallChart.tsx"
      issue: "Inline hardcoded hex colors instead of chartPalette tokens"
    - path: "src/components/slopcast/ReservesPanel.tsx"
      issue: "Hardcoded category color map instead of chartPalette"
    - path: "src/components/slopcast/MiniMapPreview.tsx"
      issue: "Inline rgba() for grid lines, fills, strokes"
    - path: "src/components/slopcast/GroupComparisonStrip.tsx"
      issue: "Hardcoded #ef4444 instead of text-theme-danger"
  missing:
    - "Replace text-white/XX with text-theme-text/XX across 27 files"
    - "Replace border-white/XX with border-theme-border/XX"
    - "Replace bg-black/XX with bg-theme-surface1/XX or bg-theme-bg/XX"
    - "Replace hardcoded hex colors in charts with chartPalette from theme context"
  debug_session: ".planning/debug/glass-hardcoded-colors.md"
- truth: "Theme selector accessible in header, not sidebar"
  status: failed
  reason: "User reported: the theme should only be accessible in the header, not sidebar"
  severity: major
  test: 5
  root_cause: "Theme selector duplicated — rendered in both Sidebar bottom (lines 109-132) and PageHeader. Sidebar copy needs removal."
  artifacts:
    - path: "src/components/layout/Sidebar.tsx"
      issue: "Lines 109-132: theme selector JSX block and lines 18-20 theme props need removal"
    - path: "src/components/layout/AppShell.tsx"
      issue: "Lines 116-118: themeId, onSetThemeId, themes passed to sidebarProps unnecessarily"
  missing:
    - "Remove theme selector JSX block from Sidebar.tsx"
    - "Remove themeId/onSetThemeId/themes props from SidebarProps interface"
    - "Remove corresponding prop assignments from AppShell.tsx sidebarProps"
  debug_session: ".planning/debug/sidebar-theme-selector.md"
