# Project Research Summary

**Project:** Slopcast UI Revamp
**Domain:** Data-heavy SaaS workspace UI (oil & gas economics modeling)
**Researched:** 2026-03-06
**Confidence:** HIGH

## Executive Summary

Slopcast is an oil and gas economics modeling workspace built with React + Vite. The UI revamp is fundamentally a **styling infrastructure repair and layout modernization** project. The codebase has 50+ components already written with Tailwind CSS utility classes, but Tailwind was never installed -- meaning the "modern" styling path is entirely dead code. The first and most impactful action is wiring up Tailwind v4, which will make dozens of existing class references produce actual CSS and likely resolve many visual inconsistencies without touching component logic.

The recommended approach is an **App Shell** pattern: a persistent collapsible sidebar replacing the current tab bar, with semi-transparent glass surfaces over animated canvas backgrounds (Slopcast's brand identity). The stack is well-established and high-confidence: Tailwind v4 for styling, Radix UI primitives for accessible headless components, TanStack Table for data-heavy views, and motion (framer-motion) for layout transitions. Total new JS bundle impact is approximately 65-75KB gzipped -- modest given the app already ships recharts, d3, and mapbox-gl (approximately 275KB combined).

The primary risks are (1) backdrop-filter performance over constantly-animating canvas backgrounds -- glass blur must be limited to 3-4 panels with small radius, using semi-transparent solids for large surfaces, (2) the 862-line god hook (`useSlopcastWorkspace`) which couples all state together -- the sidebar must be built as an adapter layer on top of it, not by refactoring it, and (3) theme token fragmentation across 6 visual themes, where new components look correct in one theme and break in the other five. All three risks have clear prevention strategies documented in the pitfalls research.

## Key Findings

### Recommended Stack

The stack leverages the existing codebase's conventions rather than fighting them. Tailwind v4 is the linchpin -- it uses CSS-native `@theme` blocks that map directly to Slopcast's existing CSS custom properties (already in RGB channel format for opacity modifiers). No config file or PostCSS setup needed with the `@tailwindcss/vite` plugin.

**Core technologies:**
- **Tailwind CSS v4** (^4.2.1): Utility CSS framework -- makes 50+ components' existing classNames actually work; CSS-native `@theme` integrates with existing custom properties
- **Radix UI Primitives** (^1.1.x): Headless accessible components (Dialog, Dropdown, Tooltip, Tabs, ScrollArea) -- unstyled, so glass aesthetics are fully controllable
- **TanStack Table** (^8.21.3) + **TanStack Virtual** (^3.13.21): Headless table logic + virtualized scrolling -- essential for wells list, cash flow, and deals tables
- **motion** (^12.35.0): Layout animations for sidebar collapse, panel transitions, view crossfade -- use `motion/mini` (approximately 5KB) where full API is not needed
- **lucide-react** (^0.577.0): Tree-shakeable icon library, standard pairing with Radix/Tailwind stacks
- **CVA + clsx + tailwind-merge**: Component variant system -- replaces `isClassic` ternary branching with typed variant definitions

**What NOT to use:** @radix-ui/themes (imposes design system), shadcn/ui CLI (copy-paste overhead), AG Grid (200KB+, opaque styling), CSS-in-JS libraries (dead-end in 2026), CSS Modules (third styling approach).

### Expected Features

**Must have (table stakes):**
- Working utility CSS (Tailwind installation) -- broken styling is the number one issue
- Persistent sidebar navigation replacing tab bar -- single biggest UX upgrade
- Consistent spacing and typography hierarchy (4/8px grid, 5-6 type scale levels)
- Unified glassmorphic card/panel styling with backdrop-blur over canvas backgrounds
- Loading skeletons, empty states, and error states for all data panels
- Hover/focus states on all interactive elements
- Responsive layout preserving existing mobile support (sidebar becomes drawer via vaul)

**Should have (differentiators):**
- Animated backgrounds visible through glass UI surfaces -- Slopcast's brand identity, no competitor has this
- Command palette (Cmd+K) via cmdk library
- Data tables with sorting, filtering, column resize via TanStack Table
- Smooth view transitions (sidebar collapse, panel mount/unmount)
- Keyboard-first navigation (Radix primitives provide this by default)

**Defer (v2+):**
- Inspector/detail panel for inline assumption editing (high complexity, Phase 3)
- Drag-to-reorder sidebar items
- Snapshot timeline UI
- Dashboard customization / widget grid (anti-feature)
- Dark/light mode toggle (app is inherently dark)

### Architecture Approach

The target is an App Shell with a fixed canvas background at z-0, a transparent shell (sidebar + topbar) at z-10, and content at z-10+. Sidebar navigation uses section-based switching within the single `/slopcast` route (not React Router routes) to preserve the existing `useSlopcastWorkspace` state architecture. Navigation state syncs with URL search params (`?section=economics`) for deep linking. The sidebar is a sibling component to content, not a wrapper, to avoid prop threading through an extra layer.

**Major components:**
1. **WorkspaceRoot** -- layout skeleton, renders canvas background as fixed sibling to app shell
2. **CanvasBackground** -- themed animated canvas at z-0, reads themeId from ThemeProvider
3. **Sidebar** -- persistent navigation (Wells, Economics, Scenarios, Settings), collapsible to icon rail, glass surface with backdrop-blur
4. **Topbar** -- sticky context bar with breadcrumbs, group selector, action buttons
5. **ContentArea** -- scroll container rendering active page view with AnimatePresence transitions
6. **InspectorPanel** (Phase 3) -- right-side contextual editor for inline assumption editing

### Critical Pitfalls

1. **Tailwind not compiled** -- 50+ components have dead utility classes. Install Tailwind v4 as literal first step. Verify in browser dev tools before proceeding.
2. **backdrop-filter over animated canvas** -- blur re-samples canvas pixels every frame (60x/sec per glass element). Limit to 3-4 panels, use small blur radius (8-12px), prefer semi-transparent solids for large surfaces (sidebar, content cards).
3. **862-line god hook coupling** -- `useSlopcastWorkspace` manages 60+ values with zero tests. Build sidebar as an adapter layer (`useSidebarNavigation`) that reads from the hook; do NOT refactor the hook during the revamp.
4. **URL state not synced** -- current tab state is in-memory only. Drive sidebar section from `useSearchParams` from day one so refresh/back/forward work.
5. **Theme token fragmentation** -- 6 themes with distinct palettes. Zero hardcoded colors in new components. Test every visual PR in at least Slate + Mario + Synthwave.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Styling Foundation and Shell

**Rationale:** Everything depends on Tailwind working. The glass token system, sidebar, and layout shell are prerequisites for all subsequent work. This phase resolves the broken styling infrastructure and delivers the single biggest UX improvement (sidebar nav).

**Delivers:** Working Tailwind v4 installation, glass token system, `cn()` utility, z-index scale, typography scale, spacing tokens, WorkspaceShell layout component, collapsible Sidebar with glass chrome, Topbar with breadcrumbs, URL-synced section navigation, mobile drawer via vaul.

**Addresses features:** Working utility CSS, persistent sidebar navigation, consistent spacing/typography, unified card styling, glassmorphism, responsive layout, breadcrumb/location awareness, settings in sidebar.

**Avoids pitfalls:** Pitfall 1 (dead Tailwind classes), Pitfall 2 (backdrop-filter perf -- establish glass strategy early), Pitfall 4 (URL state), Pitfall 6 (theme tokens -- define semantic tokens day one), Pitfall 7 (sidebar space -- collapsible from start), Pitfall 8 (prop threading -- sidebar as sibling), Pitfall 10 (z-index), Pitfall 11 (mobile regression), Pitfall 12 (Tailwind v4 paradigm).

### Phase 2: Content Migration and Data Components

**Rationale:** With the shell in place, migrate existing views (Wells, Economics, Scenarios) into the new layout. Replace custom tables with TanStack Table. Add loading/empty states. This phase delivers the polished data experience.

**Delivers:** Wells view in new ContentArea with TanStack Table for well list, Economics view with TanStack Table for cash flow, Scenarios view migrated, loading skeletons and empty states for all panels, hover/focus state audit, view transition animations via motion.

**Addresses features:** Data tables with sorting/filtering/resize, loading/empty states, hover/focus states, smooth view transitions.

**Avoids pitfalls:** Pitfall 3 (god hook -- content components keep existing prop patterns, no hook refactoring), Pitfall 13 (isClassic -- push differences into CSS tokens), Pitfall 14 (chart resize -- test with sidebar open/collapsed), Pitfall 15 (typography -- established in Phase 1).

### Phase 3: Differentiation and Polish

**Rationale:** With foundation and content stable, add the features that set Slopcast apart: command palette, keyboard navigation, and the inspector panel for inline editing. Inspector is highest complexity and benefits from stable layout.

**Delivers:** Command palette (Cmd+K) via cmdk, keyboard-first navigation extending existing `useKeyboardShortcuts`, InspectorPanel for contextual assumption editing, buffered input pattern (`useBufferedInput`) for inline editing without keystroke lag.

**Addresses features:** Command palette, inline assumption editing, keyboard-first navigation, inspector panel.

**Avoids pitfalls:** Pitfall 5 (inline editing state explosions -- buffered inputs, commit on blur, debounced economics recalc), Pitfall 9 (auto-save race conditions -- separate nav from data state changes).

### Phase Ordering Rationale

- Tailwind installation is a hard prerequisite -- nothing visual works without it. This is not optional Phase 1 work; it is a blocker.
- Sidebar before content migration because the layout shell must exist before views can be placed into it. Migrating content into a not-yet-built shell means double work.
- Data tables alongside content migration because TanStack Table integration is natural during view migration, not a separate effort.
- Inspector panel last because it is the highest-complexity feature, touches the most state, and has the most pitfall exposure (inline editing + auto-save + economics recalc). It benefits maximally from a stable foundation.
- Glass strategy decided in Phase 1 because the backdrop-filter performance constraint shapes every subsequent visual decision. Testing against animated backgrounds early prevents costly rework.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (glass token system):** Needs performance benchmarking of backdrop-filter over each of the 6+ animated canvas backgrounds. The performance characteristics vary by background complexity. Recommend a spike test before committing to blur values.
- **Phase 3 (inspector panel + inline editing):** Complex state management interaction with the god hook. The buffered input pattern and debounced economics recalculation need careful design. Research the specific fields that need inline editing and their validation rules.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Tailwind v4 setup):** Well-documented, `@tailwindcss/vite` plugin is straightforward. Existing CSS custom properties are already in the right format.
- **Phase 2 (TanStack Table integration):** Extensively documented headless table library with clear React examples. Standard pattern.
- **Phase 2 (content migration):** Moving existing components into a new layout container is mechanical work, not architectural.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry. Tailwind v4 integration path confirmed by existing CSS custom property format. Codebase already uses Tailwind conventions. |
| Features | MEDIUM | Feature priorities based on training data analysis of comparable products (Linear, Databricks, Stripe). No user research or analytics data available. |
| Architecture | HIGH | App Shell pattern is well-established. Layout hierarchy verified against existing codebase structure. Component boundaries align with current code organization. |
| Pitfalls | HIGH | 6 of 6 critical pitfalls confirmed by direct codebase analysis. Theme.css structure, god hook size, missing Tailwind installation all verified. |

**Overall confidence:** HIGH

### Gaps to Address

- **backdrop-filter performance over specific backgrounds:** The 6+ animated canvas backgrounds have varying complexity (particle counts, draw calls). Glass blur performance has not been benchmarked per-background. Needs a spike test in Phase 1 to determine blur radius limits per theme.
- **User navigation patterns:** No analytics data on how users actually navigate between Wells/Economics/Scenarios views. Sidebar design assumes roughly equal usage; if 90% of time is in Economics, the sidebar may be overbuilt. Validate with user observation if possible.
- **isClassic migration path:** The research recommends pushing `isClassic` differences into CSS tokens, but the full scope of `isClassic` branching across all components has not been audited. A component-by-component audit is needed during Phase 2 content migration.
- **Mobile testing coverage:** Research identifies mobile regression as a moderate pitfall, but the current mobile experience has not been tested. Baseline mobile screenshots should be captured before Phase 1 begins.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/styles/theme.css` (2419 lines, 6 themes, 40+ tokens each), `src/hooks/useSlopcastWorkspace.ts` (862 lines, 60+ return values), `src/pages/SlopcastPage.tsx`, `src/components/slopcast/DesignWorkspaceTabs.tsx` (`isClassic` branching)
- npm registry: version numbers verified for all recommended packages (2026-03-06)
- `.planning/codebase/CONCERNS.md`: tech debt, performance bottlenecks, fragile areas

### Secondary (MEDIUM confidence)
- Training data analysis of comparable products: Linear, Databricks, Stripe Dashboard, Apple apps, Figma, Notion -- used for feature prioritization and UX patterns
- CSS `backdrop-filter` compositor behavior: well-documented Chromium rendering pipeline, but not benchmarked against Slopcast's specific canvas backgrounds
- Tailwind v4 CSS-native `@theme` integration: documented in Tailwind v4 release notes, not yet tested in this codebase

### Tertiary (LOW confidence)
- Bundle size estimates: approximate gzipped sizes from npm/bundlephobia, actual impact depends on tree-shaking effectiveness in this specific build
- Mobile drawer (vaul) integration: library is well-regarded but has not been tested against existing `useViewportLayout` and `mobilePanel` patterns

---
*Research completed: 2026-03-06*
*Ready for roadmap: yes*
