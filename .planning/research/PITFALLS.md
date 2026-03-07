# Domain Pitfalls

**Domain:** UI revamp of a data-heavy React workspace with animated canvas backgrounds
**Researched:** 2026-03-06 (updated with codebase-specific analysis)
**Overall confidence:** HIGH (based on direct codebase analysis + established patterns)

## Critical Pitfalls

Mistakes that cause rewrites, regressions, or ship-blocking issues.

---

### Pitfall 1: Tailwind Utility Classes Are Not Compiled

**What goes wrong:** The codebase has 50+ components using Tailwind utility classes (`px-4`, `flex`, `items-center`, `bg-theme-surface1/70`, `backdrop-blur-md`, `rounded-panel`) but Tailwind CSS is NOT installed. No `tailwind.config`, no PostCSS config, no `@tailwind` directives. These classes are dead -- they produce no CSS output.
**Why it happens:** The codebase was written with Tailwind conventions but Tailwind was never wired up (or was removed at some point). The `isClassic` code paths that use `sc-panel` classes work because those are defined in `theme.css`. The "modern" code paths using Tailwind utilities silently fail.
**Consequences:** Components using the non-classic code path have broken styling. Any developer assuming Tailwind works will write CSS that does nothing.
**Warning signs:**
- Inspect any non-classic component in browser dev tools -- utility classes show no matching CSS rules
- Visual differences between `isClassic=true` and `isClassic=false` that are not intentional
**Prevention:** Install Tailwind v4 as the FIRST step of the revamp. Use `@tailwindcss/vite` plugin (no PostCSS config needed in v4). Wire existing CSS custom properties into Tailwind's `@theme` system. Verify by checking that `bg-surface-1` and `px-4` produce actual CSS in dev tools.
**Phase relevance:** Pre-Phase 1 blocker. Nothing else works until Tailwind is wired up.
**Confidence:** HIGH -- verified by codebase inspection.

---

### Pitfall 2: backdrop-filter Kills Canvas Background Performance

**What goes wrong:** Applying `backdrop-filter: blur()` (glassmorphism) to UI panels that sit over an animated `<canvas>` element forces the browser compositor to re-sample and blur the canvas pixels every single frame. On a 60fps canvas animation, this means 60 blur operations per second per glass element. Frame rate drops to 15-30fps on mid-range hardware, especially when multiple glass panels are visible simultaneously.
**Why it happens:** `backdrop-filter` is GPU-composited but requires reading back the pixels behind the element. When the background is a constantly-changing canvas (not a static image), the blur cache is invalidated every frame. This is fundamentally different from glass effects over static gradients.
**Consequences:** The signature animated backgrounds -- Slopcast's visual identity -- become a liability. Users on laptops see stuttering, fan spin, and battery drain. The natural reaction is "turn off the background," which defeats the entire design concept.
**Warning signs:**
- Frame rate drops below 45fps with DevTools Performance panel open
- Canvas `requestAnimationFrame` callback time exceeds 16ms
- GPU memory usage spikes when glass panels are visible
- Users on integrated graphics (most laptops) report sluggishness
**Prevention:**
- Limit simultaneously-visible glassmorphic panels to 3-4 maximum
- Use smaller blur radius (8-12px, not 20+)
- Use semi-transparent solid backgrounds (`bg-theme-surface1/80`) for large panels (sidebar, main content cards) instead of `backdrop-filter: blur()`
- Reserve `backdrop-filter` for small, non-overlapping elements (tooltips, floating badges)
- Provide a `prefers-reduced-motion` fallback that uses solid semi-transparent backgrounds
- Test with Chrome DevTools "Rendering > Frame Rendering Stats" on integrated GPU and with CPU 4x slowdown. If frame time exceeds 20ms, simplify.
**Phase relevance:** Phase 1 (sidebar + layout shell). This decision determines the entire visual language.
**Confidence:** HIGH -- well-documented compositor behavior. The existing `backdrop-blur-sm` in `DesignWorkspaceTabs` is fine for small elements, but a full sidebar/panel system with blur over 6 animated canvas backgrounds would be catastrophic.

---

### Pitfall 3: The 862-Line God Hook Turns Every Layout Change into a Regression Minefield

**What goes wrong:** `useSlopcastWorkspace` returns 60+ values and manages all state: groups, scenarios, wells, economics, filters, UI panels, persistence, keyboard shortcuts, CSV export. Moving from tabs to sidebar means changing how `viewMode`, `designWorkspace`, `mobilePanel`, and `pageMode` interact. Because everything is coupled in one hook, touching navigation state risks breaking economics recalculation, persistence timing, or keyboard shortcuts.
**Why it happens:** The hook was built incrementally -- each feature added its state rather than composing independent hooks. Zero test coverage means no safety net.
**Consequences:** "I just moved the tabs to a sidebar" accidentally breaks auto-save, or economics stop recalculating, or keyboard shortcuts fire in the wrong context. Bugs surface days later because the coupling is invisible.
**Warning signs:**
- You need to modify `useSlopcastWorkspace` to implement the sidebar
- You find yourself adding `if (sidebar)` conditionals inside the hook
- Props threaded from the hook through 3+ component layers change shape
- TypeScript stops catching issues because the hook return type is too wide
**Prevention:**
- Do NOT refactor the hook as part of Phase 1. Create a thin `useSidebarNavigation` hook that reads from `useSlopcastWorkspace` and translates its `viewMode`/`designWorkspace` values into sidebar state
- Extract navigation-specific state into a dedicated hook ONLY after the sidebar works with the adapter approach
- Run `npm test` and `npm run typecheck` after every incremental change -- economics tests are the only safety net
- Add a snapshot test for `SlopcastPage` before starting so you can diff what changed
**Phase relevance:** All phases, especially Phase 1 (sidebar). The adapter approach avoids touching the god hook until a dedicated refactoring phase.
**Confidence:** HIGH -- confirmed by codebase analysis. Hook is 862 lines, 60+ return values, zero tests (per CONCERNS.md).

---

### Pitfall 4: Tab-to-Sidebar Migration Breaks URL State and Deep Linking

**What goes wrong:** The current tab system uses in-memory state (`designWorkspace: 'WELLS' | 'ECONOMICS'`) controlled by `useSlopcastWorkspace`. When migrating to a sidebar, developers forget to sync navigation state with the URL. Users lose the ability to refresh and return to the same view. If sidebar and internal state diverge, the app renders blank panels.
**Why it happens:** Tabs were simple enough for React state. A sidebar implies persistent navigation that users expect to survive page refreshes. The current `SlopcastPage` has no URL-driven routing -- it is a single route with all navigation in component state.
**Consequences:** Bookmarks always open default view. Back/forward buttons exit the workspace. Two sources of truth for active panel.
**Warning signs:**
- Refreshing page always resets to WELLS view
- Browser back exits workspace entirely
- Sidebar state and hook state diverge
**Prevention:**
- Use URL search params for sidebar section: `/workspace?section=economics`
- Make sidebar a controlled component reading from `useSearchParams` (React Router)
- Remove `designWorkspace` state from `useSlopcastWorkspace` and derive from URL -- this is the one state migration worth doing early
- Test: change section, refresh, confirm same section shows
**Phase relevance:** Phase 1 (sidebar). Must be designed in from the start.
**Confidence:** HIGH -- the codebase uses React Router (`useNavigate` imported) but not for intra-workspace navigation.

---

### Pitfall 5: Inline Editing Creates Uncontrolled State Explosions

**What goes wrong:** Converting assumption panels (type curve, CAPEX, OPEX, ownership) from dedicated editing panels to inline-editable cards means each card becomes a mini-form. Without careful state management: (a) every keystroke triggers economics recalculation (the engine runs on `useMemo` dependency changes), (b) optimistic UI shows unsaved values while backend has different data, (c) validation states scattered across 20+ fields with no unified error display.
**Why it happens:** The current `Controls` component has explicit "save" boundaries. Inline editing removes them -- changes are live. The economics engine already recalculates on every state change (CONCERNS.md performance bottleneck). Inline editing amplifies this.
**Consequences:** Typing "1500000" triggers 7 re-renders and 7 economics recalculations (one per digit). The UI feels sluggish. Mid-keystroke KPIs show nonsense values.
**Warning signs:**
- Typing in inline fields causes visible lag or chart flickering
- KPIs update mid-keystroke with intermediate values
- Users lose partially-typed values when clicking between fields
**Prevention:**
- Use local component state for editing; commit to workspace hook `onBlur` or on Enter -- never on every keystroke
- Create a `useBufferedInput` hook: `{ displayValue, onChange, onCommit, isDirty }`
- Debounce economics recalculation with `useDeferredValue` or 300ms debounce on committed value
- Show subtle dirty indicator on uncommitted fields
- Test with full CAPEX table (9 line items) all editable simultaneously
**Phase relevance:** Phase 2 (inline editing). Benefits from stable sidebar/layout in Phase 1.
**Confidence:** HIGH -- universal React forms problem, made worse by the existing economics recalculation chain.

---

### Pitfall 6: Theme Token Fragmentation Across Six Visual Themes

**What goes wrong:** New components (sidebar, inline editors, cards) need theme tokens. Developers define tokens for Slate, test it, ship it, then discover Synthwave's neon colors make the sidebar unreadable, Mario's warm palette clashes with card borders, or Hyperborea's dark blues make selected states invisible.
**Why it happens:** 6 themes with distinct palettes, each with a `[data-theme]` CSS block and ~40+ custom properties. New components using hardcoded Tailwind colors look correct in Slate and broken in everything else.
**Consequences:** Revamp ships polished in dev theme but broken in 5 of 6 themes. Fixing one theme breaks another.
**Warning signs:**
- New components use raw Tailwind colors (`text-white`, `bg-slate-800`) instead of theme tokens
- Visual QA only happens in Slate theme
- PR screenshots only show one theme
**Prevention:**
- Zero hardcoded colors in new components -- every color must be a `theme-*` token or CSS variable
- Theme testing checklist: every visual PR must include screenshots in Slate + Mario + Synthwave (most visually different)
- Add semantic tokens early: `--sidebar-bg`, `--sidebar-active`, `--sidebar-border`, `--inline-edit-bg`, `--inline-edit-focus`
- Use `npm run ui:audit` to catch forbidden classnames
- Test sidebar against each animated background
**Phase relevance:** Phase 1 and all subsequent phases. Define semantic tokens in Phase 1 and enforce from day one.
**Confidence:** HIGH -- confirmed by `theme.css` (6 theme blocks, 40+ tokens each) and `DesignWorkspaceTabs.tsx` (`isClassic` branching).

---

## Moderate Pitfalls

### Pitfall 7: Sidebar Eats Horizontal Space on Data-Dense Views

**What goes wrong:** Persistent sidebar on a data-heavy workspace (maps, charts, 9-column CAPEX table) reduces content area by 200-280px. On 1366px laptops, tables overflow, chart legends become illegible, map becomes too small.
**Prevention:**
- Collapsible icon rail (48-56px) by default on screens under 1440px
- `min-width` on main content (e.g., 900px); sidebar auto-collapses when insufficient space
- Test at 1366x768 -- critical viewport, not 1920x1080
- Slide-over sidebar on mobile rather than persistent
**Phase relevance:** Phase 1 (sidebar). Responsive from the start.
**Confidence:** HIGH.

---

### Pitfall 8: Prop Threading Explosion from Layout Restructuring

**What goes wrong:** `SlopcastPage` passes 30+ props to `DesignWellsView` and 30+ to `DesignEconomicsView` from the god hook. Adding a sidebar wrapper means threading through an additional layer. Sidebar becomes a second god component.
**Prevention:**
- Sidebar is a sibling, NOT a wrapper -- receives only `{ activeSection, onChangeSection, sections[] }`
- Content components keep getting props directly from the hook
- Use React context for the 3-4 values sidebar needs (active section, theme, collapse state)
- Resist creating `<WorkspaceLayout sidebar={...} content={...}>` that requires passing everything through
**Phase relevance:** Phase 1 (sidebar). Architecture decision happens here.
**Confidence:** HIGH -- visible in `SlopcastPage.tsx` lines 86-160.

---

### Pitfall 9: Auto-Save Race Condition During Rapid Navigation

**What goes wrong:** Persistence layer uses 1-second debounced auto-save with `isHydratingRef` guard (fragile per CONCERNS.md). Rapid sidebar section switching triggers state changes the debounce interprets as user edits. Auto-save fires with intermediate state.
**Prevention:**
- Distinguish navigation state changes from data state changes in persistence layer
- Navigation state (active sidebar section) should NOT trigger auto-save
- Moving navigation to URL params (Pitfall 4's prevention) naturally separates concerns
- Add `isProgrammaticChange` flag during section switches
**Phase relevance:** Phase 1 (sidebar) and Phase 2 (inline editing -- more frequent state changes).
**Confidence:** MEDIUM -- documented in CONCERNS.md but interaction with sidebar is theoretical.

---

### Pitfall 10: Animated Background Z-Index Wars

**What goes wrong:** Canvas background is full-screen. Sidebar, modals, dropdowns, tooltips all layer above it. Without deliberate z-index system, `z-50`, `z-[999]`, and `z-[9999]` proliferate. Menus render behind sidebar. Modals behind background. AI Assistant conflicts with sidebar.
**Prevention:**
- Define z-index scale before writing layout code:
  - `z-0`: Canvas background
  - `z-10`: Main content panels
  - `z-20`: Sidebar
  - `z-30`: Dropdowns/popovers (Radix primitives portal to body, helping here)
  - `z-40`: Modals/overlays
  - `z-50`: Toast notifications
- Create CSS variables: `--z-canvas`, `--z-content`, `--z-sidebar`, `--z-dropdown`, `--z-modal`
- Audit existing z-index (AiAssistant, OnboardingTour, KeyboardShortcutsHelp, ProjectSharePanel all have z-index values)
**Phase relevance:** Phase 1 (layout shell). Z-index contract before new components.
**Confidence:** HIGH -- 5+ overlay components plus 6 animated backgrounds already exist.

---

### Pitfall 11: Mobile Responsiveness Regression

**What goes wrong:** Current codebase has explicit mobile handling (`mobilePanel` state, `useViewportLayout` hook). Sidebar-first redesign deprioritizes mobile. Result: beautiful desktop sidebar, broken mobile where sidebar overlaps content and existing mobile panel switcher stops working.
**Prevention:**
- Define mobile sidebar behavior upfront: drawer/sheet (use vaul library) that slides over content
- Map existing `mobilePanel` switching to sidebar sections rather than replacing it
- Test at 375px after every layout change
- Use existing `viewportLayout` hook to conditionally render sidebar vs mobile nav
**Phase relevance:** Phase 1 (sidebar). Design mobile alongside desktop.
**Confidence:** HIGH -- existing `wellsMobilePanel`, `economicsMobilePanel` will break if nav model changes without accounting for them.

---

### Pitfall 12: Tailwind v4 Configuration Paradigm Shift

**What goes wrong:** Tailwind v4 uses CSS-native `@theme` blocks instead of `tailwind.config.js`. Developers familiar with v3 try to create a config file or use v3 syntax (`theme.extend`, `@apply`).
**Prevention:**
- Read Tailwind v4 docs before starting. Key changes: no config file, no `theme.extend`. Theme customization in CSS via `@theme { }`.
- The existing RGB channel format (`--bg-deep: 15 23 42`) maps directly to Tailwind's opacity modifier syntax.
- Use `@tailwindcss/vite` plugin -- no PostCSS config needed.
**Phase relevance:** Pre-Phase 1 setup.
**Confidence:** HIGH.

---

### Pitfall 13: isClassic Branching Doubles Testing Surface

**What goes wrong:** `isClassic` boolean branches rendering logic in every component. New components must implement both branches. Developers forget the `isClassic` path; it renders with broken styles.
**Prevention:**
- For new components, push `isClassic` differences into CSS tokens rather than JS branching -- use theme-specific CSS custom properties via Tailwind v4's `@theme` per `[data-theme]`
- If `isClassic` must remain, add to testing checklist: every new component verified in both modes
- Goal: migrate `isClassic` to `theme.features.retroGrid` over time, eliminating prop threading
**Phase relevance:** All phases.
**Confidence:** HIGH -- confirmed in `DesignWorkspaceTabs.tsx`.

---

## Minor Pitfalls

### Pitfall 14: Chart Library Conflicts with New Layout

**What goes wrong:** Economics charts (Recharts) have fixed aspect ratios or hardcoded widths that break when sidebar changes available space. Charts overflow, render wrong size, or trigger infinite resize loops.
**Prevention:** Use `<ResponsiveContainer>` consistently. Test with sidebar open and collapsed. Watch for charts using `window.innerWidth`.
**Phase relevance:** Phase 1 (layout changes).
**Confidence:** MEDIUM.

---

### Pitfall 15: Typography Inconsistency

**What goes wrong:** New sidebar/card components use different font sizes and weights than existing components. App looks like two products stitched together.
**Prevention:**
- Define type scale early: 3-4 heading sizes, body, caption, mono (for numbers)
- New components must respect `--font-brand` token (Orbitron for Synthwave themes)
- Do not introduce font sizes without removing old ones
**Phase relevance:** Phase 1 (set type scale early).
**Confidence:** MEDIUM.

---

### Pitfall 16: Bundle Size Creep

**What goes wrong:** Adding Radix + TanStack + motion + lucide adds ~65-75KB gzipped on top of existing recharts (45KB) + d3 + mapbox (200KB).
**Prevention:** Use `motion/mini` (~5KB vs ~18KB). Tree-shake Radix (individual package imports). Monitor with `npx vite-bundle-visualizer` after each package addition.
**Phase relevance:** Phase 1 (library additions).
**Confidence:** MEDIUM.

---

### Pitfall 17: Stacking Context from backdrop-filter Breaks Portals

**What goes wrong:** `backdrop-filter` creates a new stacking context. Dropdown menus and tooltips inside blurred panels render behind other panels instead of floating above everything.
**Prevention:** Use Radix primitives which portal to `<body>` and escape stacking contexts. Alternatively, render dropdowns outside the blurred container.
**Phase relevance:** Phase 1 (glass effects + interactive elements).
**Confidence:** HIGH.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Pre-Phase 1: Tailwind setup | v4 config paradigm (Pitfall 12) | Use `@tailwindcss/vite`, CSS `@theme` blocks, no config file |
| Pre-Phase 1: Tailwind setup | Non-compiled utilities discovered (Pitfall 1) | Install Tailwind first, verify in dev tools |
| Phase 1: Sidebar navigation | backdrop-filter performance over canvas (Pitfall 2) | Semi-transparent solids for large panels, blur only for small elements |
| Phase 1: Sidebar navigation | Horizontal space on 1366px (Pitfall 7) | Collapsible icon rail on smaller screens |
| Phase 1: Sidebar navigation | URL state not synced (Pitfall 4) | Drive sidebar from URL search params from day one |
| Phase 1: Sidebar navigation | Z-index chaos (Pitfall 10) | Define z-index scale before writing components |
| Phase 1: Sidebar navigation | Mobile regression (Pitfall 11) | Design drawer/sheet nav alongside desktop sidebar |
| Phase 1: Layout shell | Theme token fragmentation (Pitfall 6) | Add semantic sidebar tokens, test in 3+ themes |
| Phase 1: Layout shell | Prop threading explosion (Pitfall 8) | Sidebar as sibling, not wrapper |
| Phase 1: Layout shell | God hook coupling (Pitfall 3) | Adapter hooks, don't refactor the god hook |
| Phase 2: Inline editing | State explosion from live editing (Pitfall 5) | Buffer inputs locally, commit on blur/Enter |
| Phase 2: Inline editing | Auto-save race conditions (Pitfall 9) | Separate nav from data state changes |
| Phase 2: Inline editing | Economics recalc per keystroke (Pitfall 5) | 300ms debounce on committed values |
| Phase 3: Visual polish | Typography inconsistency (Pitfall 15) | Set type scale in Phase 1 |
| Phase 3: Visual polish | Chart resize issues (Pitfall 14) | Test charts with sidebar open/collapsed |
| All phases | isClassic branching (Pitfall 13) | Push differences into CSS tokens |
| All phases | Bundle size creep (Pitfall 16) | Monitor with vite-bundle-visualizer |

## Sources

- Direct codebase analysis: `src/hooks/useSlopcastWorkspace.ts`, `src/pages/SlopcastPage.tsx`, `src/styles/theme.css`, `src/theme/themes.ts`, `src/components/slopcast/DesignWorkspaceTabs.tsx`, `src/components/slopcast/DesignEconomicsView.tsx` (HIGH confidence)
- `.planning/codebase/CONCERNS.md` -- tech debt, performance bottlenecks, fragile areas (HIGH confidence)
- `.planning/PROJECT.md` -- project requirements and constraints (HIGH confidence)
- Tailwind CSS v4 configuration paradigm: verified no `tailwind.config` or PostCSS config in codebase (HIGH confidence)
- CSS `backdrop-filter` compositor behavior: well-documented Chromium rendering pipeline behavior (HIGH confidence from training data)
- React forms/inline-editing patterns: standard React patterns (HIGH confidence from training data)

---

*Pitfalls audit: 2026-03-06*
