# Component Consistency Critique

## Overview

This review examines 15 components across the Slopcast design system for visual
coherence, dual-mode (isClassic / modern) integrity, button consistency, table
treatment, and overall polish level. The codebase contains 762 occurrences of
`isClassic` across 59 files — this is the dominant branching mechanism for the
retro (Mario) theme versus all modern themes.

---

## 1. Do the Components Feel Like the Same Design Family?

**Modern themes: YES, mostly.** The modern path has a strong shared vocabulary:

- `rounded-panel` / `rounded-inner` border radius tokens
- `bg-theme-surface1/XX` opacity levels for glass/solid/outline panel styles
- `border-theme-border` uniform borders
- `shadow-card` shared elevation
- `theme-transition` on every panel wrapper
- `text-theme-cyan` / `text-theme-magenta` / `text-theme-lavender` accent system
- Consistent typography: `text-xs font-black uppercase tracking-[0.24em]` headings

The design token layer (`--surface-1`, `--border`, `--cyan`, etc.) is well
established and components consume it uniformly. SectionCard (line 50),
WorkflowStepper (line 46), EconomicsResultsTabs (line 30), and
DesignWorkspaceTabs (line 51) all use the same panel shell pattern.

**Classic (Mario) theme: YES, but with a different grammar.** The classic path
consistently uses:

- `sc-panel` — CSS class with gradient backgrounds, inset shadows, and border
  from `theme.css:1752-1768`
- `sc-panelTitlebar` + `sc-titlebar--neutral/red/blue/brown/yellow` color
  variants for title bars (`theme.css:1770-1858`)
- `sc-kpi` / `sc-kpiValue` for metrics display
- `sc-btnPrimary` / `sc-btnSecondary` for buttons
- `sc-inputNavy` / `sc-selectNavy` for form controls

Both systems are internally coherent. The problem is not that they are
inconsistent within themselves — it is that the boundary between them is
maintained through raw conditional strings in every component rather than an
abstraction layer.

---

## 2. isClassic: Two Coherent Systems or Fragmented?

**Two mostly-coherent systems, with fragmentation at the edges.**

### What works

SectionCard.tsx is the canonical example of clean dual-mode:
```
isClassic
  ? `sc-panel theme-transition overflow-hidden ${className}`
  : `rounded-panel border shadow-card theme-transition ${sectionBgMap[panelStyle]} ...`
```
(SectionCard.tsx:48-51)

WorkflowStepper.tsx mirrors this exactly (WorkflowStepper.tsx:43-46), as do the
tab components (EconomicsResultsTabs.tsx:29-31, DesignWorkspaceTabs.tsx:50-52).

### Where it fragments

1. **Controls.tsx repeats the panel shell 7 times** (lines 91-92, 116-117,
   197-198, 233-234, 263-264, 275-276, 287-288). Every section duplicates the
   same `isClassic ? 'sc-panel ...' : 'rounded-panel border ...'` pattern
   instead of using SectionCard.

2. **Components that skip isClassic entirely.** AnimatedButton, AnimatedTooltip,
   FilterChips, KbdBadge, Toast, and Skeleton have NO isClassic branch. They
   render identically in Mario and modern themes. This means:
   - In Mario theme, AnimatedButton uses `bg-theme-cyan/20` (modern style) —
     it should use `sc-btnPrimary` or `sc-btnSecondary` to feel native.
   - Toast uses `bg-theme-surface1 border border-theme-border` (modern
     tokens) — it looks foreign in the Mario retro context.
   - FilterChips use `bg-theme-surface2/60` — they work passably but don't
     match the retro gradient-and-shadow language.

3. **ProfileSelector.tsx has the deepest isClassic nesting** — 12 separate
   ternary branches (lines 89-93, 101-104, 114-115, 123-126, 132-134,
   163-170, 167-169, 182-185, 199, 203, 211-218, 247-249). The component is
   extremely verbose and hard to maintain.

### Verdict

The two systems are individually coherent but the seam between them is messy.
Six components have zero isClassic coverage, creating visual breaks in the
Mario theme. Controls.tsx demonstrates what happens without an abstraction
layer — the same ternary is copy-pasted dozens of times.

---

## 3. Button Consistency

**This is the weakest area of the design system.**

There are at least five distinct button patterns in active use:

| Pattern | Where | Size / Padding | Hover |
|---------|-------|---------------|-------|
| `AnimatedButton` | AnimatedButton.tsx | 3 sizes (sm/md/lg), motion scale | whileHover scale 1.02 |
| `sc-btnPrimary` (CSS) | GroupList.tsx:29, DesignWellsView, ScenarioDashboard | Varies per use | `filter: brightness(1.05)` |
| `sc-btnSecondary` (CSS) | DesignWellsView:482, GroupWellsTable:78 | Varies per use | `filter: brightness(1.04)` |
| Inline button classes | Controls.tsx:127-131, ProfileSelector.tsx:89-93 | `px-3 py-1.5 text-[9px/10px]` | `hover:bg-black/25` or `hover:border-theme-cyan` |
| Hardcoded CTA style | HubPage.tsx:132, NotFoundPage.tsx:25 | `px-3-5 py-2-3 text-[10px]` | `hover:brightness-105`, `shadow-glow-cyan` |

**Key problems:**

- AnimatedButton (AnimatedButton.tsx) is defined but **never imported anywhere
  else in the codebase**. The grep for `AnimatedButton` only returns its own
  definition file. It is a dead component.
- Classic buttons (`sc-btnPrimary`, `sc-btnSecondary`) have proper CSS states
  (hover, active, focus, focus-visible) in theme.css:1932-1982, but modern
  buttons are styled inline with Tailwind and have inconsistent hover
  treatments.
- Button padding ranges from `px-2 py-0.5` (badges) to `px-6 py-3` (large
  CTAs) with no systematic scale being followed.
- `tracking-widest` vs `tracking-[0.14em]` vs `tracking-[0.12em]` vs
  `tracking-[0.16em]` — four different letter-spacing values for uppercase
  button labels across the codebase.

---

## 4. Table Visual Consistency

Tables are relatively consistent within their respective modes:

- **Classic mode tables** use `sc-insetLight` surfaces with `sc-insetText`
  coloring, visible in DeclineSegmentTable and GroupWellsTable.
- **Modern mode tables** use `border-theme-border` with `bg-theme-bg` headers,
  seen in CapexControls.tsx:183-184 and CashFlowTable.

**Inconsistencies:**

- CapexControls.tsx:183 uses `rounded-inner` on the table wrapper, while the
  Skeleton TableSkeleton (Skeleton.tsx:70) uses `rounded-panel`. These should
  match — inner tables should use `rounded-inner`.
- CapexControls.tsx:184 hardcodes `grid-cols-12` while WellsTable uses
  `@tanstack/react-table` with flexible column sizing. The grid-based table is
  more fragile at different viewport widths.
- Header text sizing: CapexControls uses `text-[10px]` (line 184), while the
  broader convention in KpiGrid and SectionCard headings is `text-[11px]` or
  `text-xs`.

---

## 5. Generic / Unstyled vs. Polished Components

### Highly polished

- **KpiGrid.tsx** — The most sophisticated component. Full isClassic dual path,
  panelStyle-aware backgrounds, animated values, sparklines, payout rings,
  metric trend sparklines, recalculation shimmer. This is the gold standard.
- **SectionCard.tsx** — Clean abstraction with motion entrance animations,
  stagger support, panelStyle maps. Well structured.
- **WorkflowStepper.tsx** — Proper dual-mode, pulse animation on active step,
  status-based coloring.
- **EconomicsResultsTabs.tsx / DesignWorkspaceTabs.tsx** — layoutId-based
  animated tab indicators. Polished motion.

### Functional but generic

- **AnimatedTooltip.tsx** — Uses theme tokens but has no isClassic path. Spring
  animation is solid but the component is visually plain.
- **FilterChips.tsx** — Layout animation is good. Uses theme tokens but no
  isClassic branch. The `x` dismiss button (literal character, line 38) should
  be an SVG icon for visual polish.
- **KbdBadge.tsx** — Minimal, no isClassic. Uses a standard `rounded` instead
  of `rounded-inner` — minor but breaks pattern (line 4).
- **InlineEditableValue.tsx** — Functional and clean. No isClassic branch but
  receives className from parent, so it delegates styling. Error tooltip
  (line 97) hardcodes `text-red-400` / `border-red-500/30` instead of using
  theme danger tokens.

### Essentially unstyled / dead

- **AnimatedButton.tsx** — Well-designed API (variant, size, motion) but has
  zero consumers. It exists in isolation. It also lacks an isClassic path
  entirely — it only speaks modern theme tokens.

---

## Summary Assessment

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Modern theme cohesion | A- | Strong shared vocabulary, minor surface inconsistencies |
| Classic theme cohesion | B+ | CSS primitives are solid, but 6 components skip it entirely |
| Cross-mode coherence | C+ | The branching works but is verbose, unmaintainable, no abstraction |
| Button system | D+ | Five distinct patterns, AnimatedButton dead, no shared scale |
| Table consistency | B | Mostly aligned, minor radius/sizing variance |
| Overall polish distribution | B | Top components are excellent; utility components are neglected |

The design system's biggest structural risk is the button layer. A component
library exists in name (AnimatedButton) but is unused, while page-level code
builds buttons from raw Tailwind/CSS classes with inconsistent sizing, spacing,
and hover treatments. The second risk is isClassic sprawl — 762 occurrences
across 59 files with no abstraction layer means every new component must
manually re-implement the dual-mode pattern or simply skip it (as 6 components
already have).
