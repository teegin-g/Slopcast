# Slopcast UI Audit Report

**Date:** 2026-03-10
**Branch:** codex/ui-improvements-drivers-focus
**Auditor:** Claude Code

## Anti-Patterns Verdict

**PASS.** This does *not* look AI-generated. The codebase shows a strong, opinionated design identity with deliberate per-theme structural differentiation (different panelStyles, headingFonts, border radii, brand fonts). No gradient text, no glassmorphism abuse, no generic card grids, no bounce easing on core interactions, no generic Inter-only typography. The `isClassic` hard-fork for the Mario theme is a legitimate architectural pattern. The chart palettes use intentional, theme-specific color choices rather than the typical AI pastel rainbow.

Minor tells to watch: The `AccentDivider` component (`DesignEconomicsView.tsx:102`) uses `bg-gradient-to-r from-theme-cyan via-theme-magenta to-theme-lavender` which leans toward decorative gradient, but it uses theme tokens and is used sparingly (accent, not text). Acceptable.

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 6 |
| Medium | 8 |
| Low | 5 |
| **Total** | **21** |

**Top 5 Issues:**
1. Almost zero ARIA attributes across 50+ components (Critical)
2. `prefers-reduced-motion` only covers Synthwave background, not other 5 animated backgrounds or CSS transitions (Critical)
3. Broken logo `src` in PageHeader points to `sandbox:/mnt/data/` path (High)
4. Hard-coded hex colors in background components (~222 occurrences across 13 files) (High)
5. Only 11 semantic landmark elements across entire app (High)

**Quality Score:** 72/100 — Strong visual design and theme architecture; weak on accessibility and motion safety.

---

## Detailed Findings by Severity

### Critical Issues

**C1. Systemic Missing ARIA / Accessibility Attributes**
- **Location:** All interactive components across `src/components/`
- **Category:** Accessibility
- **Description:** Only 22 ARIA-related attributes found across 11 files (out of 50+ component files). The vast majority of interactive elements — dropdown menus, collapsible panels, tab bars, modals — have no `aria-expanded`, `aria-controls`, `aria-haspopup`, `aria-modal`, or `role` attributes.
- **Specific gaps:**
  - `PageHeader.tsx` — ThemeDropdown and OverflowMenu: no `aria-expanded`, `aria-haspopup`, `role="listbox"` or `role="menu"`
  - `DesignEconomicsView.tsx` — Collapsible sections (Tax, Leverage, Reserve, Advanced): no `aria-expanded`, `aria-controls`
  - `Controls.tsx:161` — Confirmation dialog: no `role="dialog"`, `aria-modal="true"`, focus trap
  - `SidebarNav.tsx` — Tab-like navigation: no `role="tablist"` / `role="tab"` / `aria-selected`
  - `EconomicsResultsTabs` — Tab bar: likely same issue
  - `LandingPage.tsx` — No `<main>` landmark
- **Impact:** Screen reader users cannot navigate the app. Violates WCAG 2.1 Level A (4.1.2 Name, Role, Value).
- **Suggested command:** `/harden`

**C2. Incomplete `prefers-reduced-motion` Support**
- **Location:** `src/styles/theme.css:2360-2377`, all `*Background.tsx` components
- **Category:** Accessibility
- **Description:** `prefers-reduced-motion: reduce` only disables animations for Synthwave background elements. The other 5 animated backgrounds (MoonlightBackground, TropicalBackground, MarioOverworldBackground, StormDuskBackground, HyperboreaBackground) have no reduced-motion handling. Only `MarioOverworldBackground.tsx:173` checks the media query in JS. All CSS `transition-*` and `animate-*` classes throughout the app also continue running.
- **Impact:** Users with vestibular disorders may experience nausea/discomfort. Violates WCAG 2.1 Level AAA (2.3.3 Animation from Interactions), and the backgrounds violate Level A (2.3.1 Three Flashes or Below Threshold) if any contain rapid movement.
- **Suggested command:** `/harden`

### High-Severity Issues

**H1. Broken Logo Image Source**
- **Location:** `src/components/slopcast/PageHeader.tsx:255`
- **Category:** Performance / UX
- **Description:** Logo `src` is `"sandbox:/mnt/data/slopcast_logo_transparent.png"` — a ChatGPT sandbox path that won't resolve in production. The `onError` fallback uses DOM manipulation (`document.createElement`) instead of React state, which is fragile and breaks React's reconciliation.
- **Impact:** Logo always fails to load; fallback uses anti-pattern DOM manipulation.
- **Suggested command:** `/harden`

**H2. Hard-Coded Hex Colors in Background Components**
- **Location:** `SynthwaveBackground.tsx` (116 occurrences), `TropicalBackground.tsx` (29), `MoonlightBackground.tsx` (24), `StormDuskBackground.tsx` (10), `HyperboreaBackground.tsx` (12), `MarioOverworldBackground.tsx` (6), `CapexControls.tsx` (6)
- **Category:** Theming
- **Description:** 222 hard-coded hex values across 13 files. While background components are inherently theme-specific (they only render for their theme), `CapexControls.tsx` has 6 hex values that should use tokens. The `EconomicsGroupBar.tsx` and `DebugOverlay.tsx` also have hardcoded colors.
- **Impact:** Background components are acceptable (they're 1:1 with their theme), but non-background components with hex values bypass theming.
- **Suggested command:** `/normalize`

**H3. Minimal Semantic HTML Landmarks**
- **Location:** Across all pages and components
- **Category:** Accessibility
- **Description:** Only 11 semantic landmark elements (`<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`, `<section>`, `<article>`) across 6 files. `AppShell.tsx` has `<main>` and `<aside>`, `SidebarNav.tsx` has `<nav>`, but most pages (`LandingPage.tsx`, `HubPage.tsx`, `NotFoundPage.tsx`, `IntegrationsPage.tsx`) use plain `<div>` for their root layout. None of the data tables use `<table>` semantics with proper `<th>`, `scope`, etc.
- **Impact:** Landmark-based navigation impossible. Screen readers can't quickly jump between regions. Violates WCAG 1.3.1 (Info and Relationships).
- **Suggested command:** `/harden`

**H4. Focus Management Missing in Overlays/Modals**
- **Location:** `Controls.tsx:160` (template confirmation), `PageHeader.tsx` (ThemeDropdown, OverflowMenu), `AiAssistant.tsx`, `OnboardingTour.tsx`, `ProjectSharePanel.tsx`, `KeyboardShortcutsHelp.tsx`
- **Category:** Accessibility
- **Description:** Overlay/modal components rely on click-outside detection but have no focus trap, no focus restoration on close, and no Escape key handling (except possibly in a few cases). The template confirmation dialog (`Controls.tsx:160`) renders a full-screen backdrop but doesn't trap focus or handle keyboard dismissal.
- **Impact:** Keyboard users can tab behind modals into obscured content. Violates WCAG 2.4.3 (Focus Order).
- **Suggested command:** `/harden`

**H5. Missing Keyboard Event Handlers on Interactive Elements**
- **Location:** Throughout the app
- **Category:** Accessibility
- **Description:** Only 11 `onKeyDown`/`onKeyUp`/`tabIndex` attributes across 7 files. All custom dropdown menus, collapsible panels, and interactive widgets rely solely on mouse events. No keyboard navigation within the theme picker, group tree, or forecast grid.
- **Impact:** Keyboard-only users cannot operate dropdown menus, select themes, or navigate groups. Violates WCAG 2.1.1 (Keyboard).
- **Suggested command:** `/harden`

**H6. Heading Hierarchy Issues**
- **Location:** Throughout components
- **Category:** Accessibility
- **Description:** 70 `<h1>`-`<h6>` elements across 32 files, but many are `<h2>` or `<h3>` used for visual styling (10px uppercase labels) without following logical hierarchy. Multiple `<h1>` elements exist (LandingPage has one, PageHeader has one). Many panel title bars use `<h2>` for tiny 10px labels that aren't document-level headings.
- **Impact:** Screen reader heading navigation is confusing. Violates WCAG 1.3.1.
- **Suggested command:** `/harden`

### Medium-Severity Issues

**M1. No Skip Navigation Link**
- **Location:** `src/components/layout/AppShell.tsx`
- **Category:** Accessibility
- **Description:** No "skip to main content" link for keyboard users to bypass the sidebar and header.
- **Impact:** Keyboard users must tab through all sidebar items every page load. Violates WCAG 2.4.1 (Bypass Blocks).
- **Suggested command:** `/harden`

**M2. `eslint-disable` Suppressed Hook Dependency Warnings**
- **Location:** `AppShell.tsx:99`, `DesignEconomicsView.tsx:236`
- **Category:** Performance
- **Description:** Two `eslint-disable react-hooks/exhaustive-deps` comments suppress warnings about incomplete dependency arrays. The `AppShell.tsx:89-99` effect syncs `section` to workspace state but excludes workspace setters from deps, and `DesignEconomicsView.tsx:232-236` auto-collapses setup insights but omits `showSetupInsights`.
- **Impact:** Potential stale closure bugs if workspace setters are recreated, though currently stable since they're wrapped in `useCallback`.

**M3. Collapsible Panels Use `max-h-0`/`max-h-[2000px]` Animation Hack**
- **Location:** `DesignEconomicsView.tsx:394-398,436-440,478-482,528-532`
- **Category:** Performance
- **Description:** Four collapsible sections use `max-h-0` / `max-h-[2000px]` with `transition-all duration-300` for expand/collapse. This animates `max-height` (a layout property), which triggers layout recalculation every frame.
- **Impact:** Minor jank on lower-end devices. The `transition-all` also unnecessarily transitions `opacity` and other properties.
- **Suggested command:** `/optimize`

**M4. SVG Icons Defined Inline as Components**
- **Location:** `SidebarNav.tsx:13-33` (3 icons), `Sidebar.tsx:20-34` (CollapseChevron)
- **Category:** Performance
- **Description:** SVG icons are defined as React functional components that re-create SVG elements on every render. Not memoized.
- **Impact:** Minimal for current count, but pattern should be watched as icon count grows.

**M5. `setTimeout` Used for Fake Loading State**
- **Location:** `LandingPage.tsx:99`
- **Category:** UX
- **Description:** `setTimeout(() => setIsSearching(false), 600)` simulates a loading state for acreage search. This is artificial delay with no cleanup on unmount.
- **Impact:** Potential state update on unmounted component; misleading UX for what's actually synchronous parsing.
- **Suggested command:** `/distill`

**M6. Background Components Not Cleaned Up on Theme Switch**
- **Location:** `SlopcastPage.tsx:23-27`, `AppShell.tsx:125-130`
- **Category:** Performance
- **Description:** Background components are lazy-loaded via `React.lazy()` which is good. However, when switching themes rapidly, the previous background's canvas/animation may not clean up before the new one mounts, as `Suspense fallback={null}` provides no visual transition.
- **Impact:** Brief visual glitch during rapid theme switches. Low user impact.
- **Suggested command:** `/optimize`

**M7. Theme Dropdown Has No Scroll for Small Viewports**
- **Location:** `PageHeader.tsx:64-85`
- **Category:** Responsive
- **Description:** Theme dropdown menu has `min-w-[140px]` and renders all 7 themes. No `max-height` or `overflow-y-auto` set, so on very short viewports the dropdown could extend below the viewport.
- **Impact:** Themes at bottom unreachable on short screens.
- **Suggested command:** `/adapt`

**M8. Mobile Sticky Action Strip May Overlap Content**
- **Location:** `DesignEconomicsView.tsx:709-742`
- **Category:** Responsive
- **Description:** Fixed-bottom action strip (`fixed bottom-0`) on mobile doesn't account for its height in the content scroll area. Content behind it may be unreachable.
- **Impact:** Last items in scrollable content may be hidden behind the sticky bar.
- **Suggested command:** `/adapt`

### Low-Severity Issues

**L1. Single `!important` Override**
- **Location:** `src/styles/theme.css:2375`
- **Category:** Theming
- **Description:** `animation: none !important` in reduced-motion media query. This is acceptable and actually correct usage for accessibility overrides.
- **Impact:** None — correct pattern.

**L2. Only 2 `<img>` Tags, Both Have `alt`**
- **Location:** `PageHeader.tsx:256`, `MapVisualizer.tsx:433`
- **Category:** Accessibility (Positive)
- **Description:** Both images in the app have alt text. Good.
- **Impact:** None — this is a positive finding.

**L3. Responsive Breakpoints Rely on Tailwind Classes**
- **Location:** Throughout
- **Category:** Responsive
- **Description:** Only 2 `@media` queries in CSS files. All responsive behavior is handled via Tailwind responsive prefixes (`lg:`, `xl:`, `md:`). This is fine — it's the Tailwind way. The `useViewportLayout` hook provides JS-level breakpoint awareness.
- **Impact:** None — correct pattern for Tailwind projects.

**L4. Chart Palette Uses Hard-Coded Hex in Theme Registry**
- **Location:** `src/theme/themes.ts:96-114` (and all theme entries)
- **Category:** Theming
- **Description:** `chartPalette` and `mapPalette` use hex strings rather than CSS custom properties. This is intentional — Recharts/D3 need resolved color values, not CSS variables.
- **Impact:** None — architectural decision, acceptable trade-off.

**L5. No Visible Focus Indicator on Some Custom Buttons**
- **Location:** Various panel title bars, template buttons
- **Category:** Accessibility
- **Description:** While `app.css:67-71` defines a `.focus-ring` utility and several components use `focus-visible:outline-*`, not all interactive elements apply it. Panel expand/collapse buttons in `DesignEconomicsView.tsx` don't have visible focus indicators.
- **Impact:** Keyboard users may lose track of focus position. Partial WCAG 2.4.7 violation.
- **Suggested command:** `/harden`

---

## Patterns & Systemic Issues

1. **Accessibility is the #1 gap.** The app is built mouse-first. ARIA attributes, focus management, keyboard navigation, and semantic HTML are minimal. This is a systemic issue — fixing it requires a component-by-component pass.

2. **`isClassic` branching creates duplication.** Every component has `isClassic ? ... : ...` for class names, which is the documented pattern. However, this means accessibility fixes need to be applied to both branches.

3. **Background components are properly isolated** in lazy-loaded, theme-specific files. This is good architecture.

4. **`prefers-reduced-motion` is partially implemented.** Only Synthwave gets it in CSS, only Mario checks it in JS. The other 4 animated backgrounds have no motion safety.

5. **Theme token usage is excellent in most components.** The Tailwind `@theme inline` setup is clean, and components overwhelmingly use `text-theme-*`, `bg-theme-*`, `border-theme-*` tokens. The hard-coded hex values are concentrated in background components (acceptable) and a handful of non-background files (should fix).

---

## Positive Findings

- **Theme system architecture is excellent.** Clean separation: CSS custom properties for tokens, `ThemeFeatures` for structural differences, `ThemeMeta` for palette/behavior, `ThemeProvider` for state. New themes can be added with minimal code.
- **`React.memo` is used on expensive components** (KpiGrid, DesignEconomicsView, PageHeader, LandingPage). `useMemo`/`useCallback` used 107 times across 35 files — good memoization discipline.
- **No gradient text, no generic AI aesthetic.** The visual design is distinctive and opinionated — each theme has real personality.
- **`useDebouncedRecalc` pattern** prevents economics recalculation on every keystroke. Smart.
- **Lazy-loaded backgrounds** prevent bundle bloat from theme-specific animation code.
- **`focus-ring` utility class** defined in CSS — the foundation exists, just needs broader application.
- **Typography hierarchy is well-defined** in `app.css` (`typo-h1` through `typo-label`, `typo-section`, `typo-value`).

---

## Recommendations by Priority

### Immediate (this sprint)
1. Add `prefers-reduced-motion` support to all 5 remaining background components
2. Fix broken logo `src` in PageHeader — use a real asset path or remove the `<img>` and always use the text fallback
3. Add `role="dialog"`, `aria-modal`, and focus trap to the template confirmation modal in Controls.tsx

### Short-term (next sprint)
4. Add ARIA attributes to all dropdown menus (`aria-expanded`, `aria-haspopup`, `role="menu"`)
5. Add `aria-expanded` and `aria-controls` to all collapsible panels
6. Add `role="tablist"` / `role="tab"` / `aria-selected` to SidebarNav and EconomicsResultsTabs
7. Add skip-to-content link in AppShell
8. Ensure visible focus indicators on all interactive elements

### Medium-term
9. Replace `max-height` animation hack with CSS `grid-template-rows: 0fr/1fr` pattern for collapsibles
10. Add `<main>` landmark to LandingPage and other pages
11. Fix heading hierarchy — use visually-hidden headings for screen readers where `<h2>` is used for styling
12. Add `pb-16` or `mb-16` to mobile content area to account for sticky bottom bar

### Long-term
13. Replace CapexControls hard-coded hex values with theme tokens
14. Add scroll containment to theme dropdown for short viewports
15. Clean up fake setTimeout loading state in LandingPage

---

## Suggested Commands for Fixes

- **`/harden`** — Addresses 10 issues (C1, C2, H3, H4, H5, H6, M1, L5, and partially H1). Highest-impact single command.
- **`/normalize`** — Addresses H2 (non-background hard-coded colors) and ensures token consistency.
- **`/optimize`** — Addresses M3 (collapsible animation), M6 (background cleanup).
- **`/adapt`** — Addresses M7 (dropdown overflow), M8 (mobile sticky bar overlap).
- **`/distill`** — Addresses M5 (fake loading state).
