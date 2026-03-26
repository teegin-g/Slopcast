# UI Review Implementation Plan

**Date:** 2026-03-25
**Branch:** `ui-critique-fixes`
**Source Reviews:** `ui-review/`, `.planning/CRITIQUE-WELLS-ECONOMICS.md`, `.planning/AUDIT-REPORT.md`
**Status:** Plan written. Agent team spawning FAILED — see diagnosis below.

## Agent Team Spawning Diagnosis (2026-03-25)

### Problem
Spawned team agents went idle immediately without making any changes. No worktrees were created.

### Root Cause: Model ID Mismatch
This session runs through a **Databricks proxy** with custom model IDs:
- `ANTHROPIC_MODEL=databricks-claude-opus-4-6`
- `ANTHROPIC_BASE_URL=https://dbc-3a822fc8-adcc.cloud.databricks.com/serving-endpoints/anthropic`

When the Agent tool spawns sub-agents, it records `model: "claude-opus-4-6"` in the team config instead of `model: "databricks-claude-opus-4-6"`. The `ANTHROPIC_DEFAULT_OPUS_MODEL` env var is NOT used to resolve agent model IDs.

**Evidence from `~/.claude/teams/ui-review/config.json`:**
```
team-lead:    model=databricks-claude-opus-4-6  ← CORRECT (inherits session model)
a11y-agent:   model=claude-opus-4-6             ← WRONG (hardcoded default)
theme-agent:  model=claude-opus-4-6             ← WRONG
layout-agent: model=claude-opus-4-6             ← WRONG
```

### Secondary Issue: Worktree Isolation Failed
`isolation: "worktree"` produced no `.claude/worktrees/` entries. Agents ran "in-process" but couldn't make changes.

### Key Finding: Regular Agents Work Fine
A test agent spawned WITHOUT `isolation: "worktree"` and WITHOUT `team_name` successfully read files and ran bash commands through the Databricks proxy. **The issue is specifically `isolation: "worktree"` combined with team membership, NOT model routing.**

### Recommended Approach for Next Session
1. **Use regular `Agent` tool calls** — spawn implementation agents with `mode: "bypassPermissions"` but WITHOUT `isolation: "worktree"` and WITHOUT `team_name`. Run them sequentially (each workstream as one agent call). This is the safest approach.
2. **Or** run multiple agents in parallel on the same branch (no worktrees) — works if file conflicts are managed by running non-overlapping workstreams together.
3. **Or** execute workstreams manually in the main session — most reliable but slowest.

### Execution Order (Sequential Fallback)
If doing it manually in one session:
1. Workstream 1 (Accessibility) — smallest, most isolated
2. Workstream 3 (Layout) — structural spacing changes
3. Workstream 2 (Theme Colors) — CSS token changes
4. Workstream 4 (Typography) — widespread text property changes
5. Workstream 5 (Motion) — creates new file + updates spring values
6. Workstream 6 (Validation) — typecheck, build, test, visual QA

## Context

Slopcast's UI has undergone a comprehensive 6-category design review identifying ~50 actionable fixes. The app's cinematic identity is strong — this is a systems-hardening and presentation-refinement effort, not a redesign. Changes span accessibility, theme colors, layout spacing, typography, motion polish, and shape/borders.

---

## Workstream 1: Accessibility & Motion Safety

**Goal:** Fix the two Critical audit findings (reduced-motion, keyboard focus).

### 1.1 Add MotionConfig Wrapper

**File:** `src/index.tsx`

**Current code (lines 21-38):**
```tsx
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
```

**Change:** Add `import { MotionConfig } from 'motion/react';` at top. Wrap inside ThemeProvider:
```tsx
<ThemeProvider>
  <MotionConfig reducedMotion="user">
    <ToastProvider>
      ...
    </ToastProvider>
  </MotionConfig>
</ThemeProvider>
```

This single change makes every `motion.*` component respect the OS `prefers-reduced-motion` setting.

### 1.2 Canvas Background Reduced-Motion

**Files:**
- `src/components/TropicalBackground.tsx`
- `src/components/MoonlightBackground.tsx`
- `src/components/HyperboreaBackground.tsx`

**Reference pattern:** `src/components/MarioOverworldBackground.tsx:173`

For each file, at the top of the `useEffect` that sets up the canvas:
```typescript
const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
let reduceMotion = motionQuery?.matches ?? false;
const handleMotionChange = (e: MediaQueryListEvent) => { reduceMotion = e.matches; };
motionQuery?.addEventListener?.('change', handleMotionChange);
```

In the draw loop, when `reduceMotion` is true, draw one static frame and skip `requestAnimationFrame`.

In cleanup: `motionQuery?.removeEventListener?.('change', handleMotionChange);`

### 1.3 Focus-Visible Rings

Add `focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none` to:

| File | Element(s) |
|------|-----------|
| `src/components/slopcast/AnimatedButton.tsx` | The `motion.button` className |
| `src/components/slopcast/DesignWorkspaceTabs.tsx` | Each tab button |
| `src/components/slopcast/GroupComparisonStrip.tsx` | The `motion.button` for group cards |
| `src/components/slopcast/PageHeader.tsx` | All nav buttons, theme picker buttons, overflow menu buttons |
| `src/components/slopcast/Toast.tsx` | The dismiss button |
| `src/components/slopcast/OnboardingTour.tsx` | Next and Skip buttons |

---

## Workstream 2: Theme Colors & Atmosphere

**Goal:** Fix Synthwave readability, adjust per-theme tokens, clean up radius system.

### 2.1 theme.css Changes (exclusive file — no other agent touches this)

**File:** `src/styles/theme.css`

| Change | Location | Before | After |
|--------|----------|--------|-------|
| Slate radius | `:root` block, `--radius-panel` | `18px` | `12px` |
| Synthwave radius | `[data-theme='synthwave']` block | (inherits 18px) | Add `--radius-panel: 14px;` |
| Synthwave surface-1 | `[data-theme='synthwave']` block | `--surface-1: 35 37 88;` | `--surface-1: 38 30 72;` |
| Tropical border | `[data-theme='tropical']` block | `--border: 45 212 191;` (same as --cyan) | `--border: 38 160 148;` |
| Remove --radius-kpi | `:root` (~line 159) and `[data-theme='mario']` (~line 630) | `--radius-kpi: 18px;` / `8px` | Delete declarations |
| .sc-kpi rules | `.sc-kpi` and `.sc-kpi::before` | `var(--radius-kpi)` | `var(--radius-panel)` |

### 2.2 Synthwave Panel Style

**File:** `src/theme/themes.ts`
- Find synthwave theme entry
- Change `panelStyle: 'outline'` to `panelStyle: 'glass'`

### 2.3 Outline Opacity Floor

**File:** `src/components/slopcast/SectionCard.tsx`
- Find the outline panelStyle opacity map
- Raise background from `/20` to `/30` (e.g., `bg-theme-surface1/20` → `bg-theme-surface1/30`)

### 2.4 KPI Label Text

**File:** `src/components/slopcast/KpiGrid.tsx`
- Search for `text-theme-text/70` on label elements
- Replace with `text-theme-muted`

### 2.5 Toast Border Tokens

**File:** `src/components/slopcast/Toast.tsx`

| Before | After |
|--------|-------|
| `border-l-green-400` | `border-l-theme-cyan` (or `border-l-theme-success` if token exists) |
| `border-l-yellow-400` | `border-l-theme-warning` |
| `border-l-red-400` | `border-l-theme-danger` (check if token exists in theme.css first) |

### 2.6 Border Radius Cleanup

Replace `rounded-md`, `rounded-lg`, bare `rounded` (not `rounded-panel`/`rounded-inner`/`rounded-full`) with `rounded-inner` in:
- `src/components/Controls.tsx`
- `src/components/TaxControls.tsx`
- `src/components/DebtControls.tsx`
- `src/components/slopcast/ProfileSelector.tsx`
- `src/components/slopcast/DesignEconomicsView.tsx`

Use `grep -rn 'rounded-md\|rounded-lg' src/components/` to find instances first.

### 2.7 Verify Double-Vignette Fix

**File:** `src/components/layout/AppShell.tsx`
- Confirm `<Vignette>` is only rendered when `!workspace.BackgroundComponent`
- If not conditional, make it so

---

## Workstream 3: Layout & Spacing

**Goal:** Breathing room on desktop, consistent gaps and padding.

### 3.1 Main Content Frame Padding

**File:** `src/components/layout/AppShell.tsx`
- Find: `p-3 max-w-[1920px]` on the content area div
- Change `p-3` to `p-3 md:p-5 xl:p-8`

### 3.2 Grid Gap Harmonization

**Files:** `src/components/slopcast/DesignEconomicsView.tsx`, `src/components/slopcast/DesignWellsView.tsx`
- Both main grids should use: `gap-4 lg:gap-6`

### 3.3 Chart Panel Padding

**File:** `src/components/slopcast/DesignEconomicsView.tsx`
- Find chart panel with `p-1` → change to `p-3`

### 3.4 Collapsible Panel Body Padding

**File:** `src/components/slopcast/DesignEconomicsView.tsx`
- All collapsible panel body sections: normalize `p-3` to `p-4`

### 3.5 PageHeader Responsive Padding

**File:** `src/components/slopcast/PageHeader.tsx`
- Change `py-3` to `py-3 md:py-4`
- Ensure `lg:px-8` is present

### 3.6 SidebarNav Spacing

**File:** `src/components/layout/SidebarNav.tsx`
- `<nav>` gap: `gap-0.5` → `gap-1`
- Button padding: `py-1.5` → `py-2`

### 3.7 Wide Viewport Breakpoint

**File:** `src/components/slopcast/hooks/useViewportLayout.ts`

Update type and function:
```typescript
export type ViewportLayout = 'mobile' | 'mid' | 'desktop' | 'wide';

function getViewportLayout(width: number): ViewportLayout {
  if (width < 1024) return 'mobile';
  if (width < 1320) return 'mid';
  if (width < 1920) return 'desktop';
  return 'wide';
}
```

**CRITICAL:** Check all consumers. Any `layout === 'desktop'` checks may need `|| layout === 'wide'`. Key files: AppShell.tsx, DesignWellsView.tsx, DesignEconomicsView.tsx, SlopcastPage.tsx.

### 3.8 KPI Strip Responsive Density

**File:** `src/components/slopcast/KpiGrid.tsx`
- Find KPI strip grid (grid-cols-2 xl:grid-cols-5 or similar)
- Change to: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`

---

## Workstream 4: Typography & Visual Hierarchy

**Goal:** Data dominates, chrome recedes. Clear hierarchy scannable in 2 seconds.

### 4.1 Typography Utility Classes

**File:** `src/app.css` — add in `@layer components`:
```css
.track-label   { letter-spacing: 0.12em; }
.track-section { letter-spacing: 0.2em; }
.track-hero    { letter-spacing: 0.35em; }

.typo-hero-value  { @apply text-5xl sm:text-6xl xl:text-7xl font-black tracking-tight; }
.typo-kpi-value   { @apply text-2xl font-black tabular-nums leading-none; }
.typo-section     { @apply text-xs font-bold uppercase tracking-[0.2em] text-theme-cyan heading-font; }
.typo-kpi-label   { @apply text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-muted; }
.typo-button      { @apply text-[10px] font-bold uppercase tracking-[0.12em]; }
```

### 4.2 KPI Strip Tile Value Sizes

**File:** `src/components/slopcast/KpiGrid.tsx`
- Strip tile values: `text-xl` → `text-2xl` (for CAPEX, EUR, IRR)
- Keep Payout and Wells at `text-xl` (secondary)

### 4.3 Color-Code KPI Importance

**File:** `src/components/slopcast/KpiGrid.tsx`

| Metric | Value Color | Rationale |
|--------|------------|-----------|
| IRR | `text-theme-cyan` | Primary decision metric after NPV |
| EUR | `text-theme-text` | Volume — important but derivative |
| CAPEX | `text-theme-text` | Input metric |
| Payout | `text-theme-lavender` | Time — secondary decision factor |
| Wells | `text-theme-muted` | Count — contextual |

### 4.4 Demote Button Text Weight

Search across components: change `font-black` to `font-bold` on **button elements only** (not headings or KPI values).

Key files:
- `PageHeader.tsx` (nav buttons)
- `EconomicsResultsTabs.tsx` (tab text)
- `DesignWorkspaceTabs.tsx` (tab text)
- `DesignEconomicsView.tsx` (mobile toggle buttons)
- `Controls.tsx` (template/section buttons)

### 4.5 Extend heading-font Coverage

Add `heading-font` class to section-level headings in:
- `CashFlowTable.tsx` — column headers
- `WellsTable.tsx` — column headers
- `WorkflowStepper.tsx` — heading and step labels
- `EconomicsDriversPanel.tsx` — section headings
- `DesignEconomicsView.tsx` — collapsible section titles

### 4.6 GroupList Metric Legibility

**File:** `src/components/GroupList.tsx`
- NPV value: increase to `text-sm font-bold tabular-nums text-theme-cyan`
- Label: increase to `text-[10px] font-semibold uppercase tracking-[0.12em]`

---

## Workstream 5: Motion & Interaction Polish

**Goal:** Unified spring system, animated modals, fixed motion bugs.

### 5.1 Shared Spring Constants

**NEW FILE:** `src/theme/motion.ts`
```typescript
export const SPRING = {
  snappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  entrance: { type: 'spring' as const, stiffness: 300, damping: 28, mass: 0.8 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  value: { type: 'spring' as const, stiffness: 80, damping: 20, mass: 0.8 },
};
```

### 5.2 Unify Spring Values

Replace inline spring objects with imports from `motion.ts`:

| File | Current | Replace With |
|------|---------|-------------|
| `AnimatedButton.tsx:35` | `{400, 17}` | `SPRING.snappy` |
| `AnimatedTooltip.tsx:36` | `{400, 25}` | `SPRING.snappy` |
| `Toast.tsx:53` | `{400, 25}` | `SPRING.snappy` |
| `GroupComparisonStrip.tsx:77` | `{300, 25}` | `SPRING.gentle` |
| `GroupComparisonStrip.tsx:127` | `{200, 25}` | `SPRING.gentle` |
| `SectionCard.tsx:42` | varies | `SPRING.entrance` |
| `ViewTransition.tsx:24` | `{300, 30, 0.8}` | `SPRING.entrance` |
| `ReadinessChecklist.tsx:25` | `{100, 20}` | `SPRING.value` |

### 5.3 Kill WorkflowStepper Perpetual Pulse

**File:** `src/components/slopcast/WorkflowStepper.tsx`

Replace the continuous animation:
```tsx
// BEFORE (lines 72-80):
animate={step.status === 'ACTIVE' ? { scale: [1, 1.03, 1] } : { scale: 1 }}
transition={step.status === 'ACTIVE' ? { duration: 0.4, ease: 'easeInOut' } : { duration: 0.2 }}

// AFTER:
initial={{ scale: step.status === 'ACTIVE' ? 0.97 : 1 }}
animate={{ scale: 1 }}
transition={SPRING.snappy}
```

### 5.4 Fix ReadinessChecklist Spring Overshoot

**File:** `src/components/slopcast/ReadinessChecklist.tsx:25`
- Change `{ stiffness: 100, damping: 20 }` to `{ stiffness: 200, damping: 30 }` (critically damped)

### 5.5 Animate Modal Dialogs

**Files:** `src/components/slopcast/KeyboardShortcutsHelp.tsx`, `src/components/slopcast/ProjectSharePanel.tsx`

For both:
1. Import `{ AnimatePresence, motion } from 'motion/react'` and `{ SPRING } from '../../theme/motion'`
2. Remove `if (!open) return null` early return
3. Wrap return in `<AnimatePresence>`
4. Conditionally render content based on `open`
5. Backdrop: `motion.div` with `initial/animate/exit={{ opacity: 0/1/0 }}`
6. Panel: `motion.div` with `initial={{ opacity: 0, scale: 0.95, y: 8 }}` / `animate={{ opacity: 1, scale: 1, y: 0 }}` / `exit={{ opacity: 0, scale: 0.95, y: 8 }}` / `transition={SPRING.snappy}`

### 5.6 Convert MobileDrawer to Springs

**File:** `src/components/layout/MobileDrawer.tsx`

Replace CSS `transition-transform duration-300 ease-in-out` + `translate-x-0`/`-translate-x-full` toggle with:
```tsx
<AnimatePresence>
  {open && (
    <>
      <motion.div  // backdrop
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div  // panel
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={SPRING.entrance}
        className="fixed left-0 top-0 bottom-0 w-64 z-50 ..."
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### 5.7 AI Assistant Open/Close Animation

**File:** `src/components/slopcast/AiAssistant.tsx`

Wrap chat panel in AnimatePresence with spring scale-up from bottom-right:
```tsx
initial={{ opacity: 0, scale: 0.8, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.8, y: 20 }}
transition={SPRING.snappy}
style={{ transformOrigin: 'bottom right' }}
```

### 5.8 ViewTransition Mode

**File:** `src/components/layout/ViewTransition.tsx:18`
- Change `mode="wait"` to `mode="popLayout"`

### 5.9 KPI Tile Entrance Stagger

**File:** `src/components/slopcast/KpiGrid.tsx`

Wrap each KPI tile in `motion.div` with staggered delay:
```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ ...SPRING.snappy, delay: index * 0.06 }}
>
  <KpiStripTile ... />
</motion.div>
```

---

## Workstream 6: Integration & Validation

### Validation Steps
1. `npm run typecheck` — zero errors
2. `npm run build` — successful production build
3. `npm test` — all tests pass
4. `npm run ui:audit` — no new violations

### Visual Verification
- Economics tab: Slate theme (spacing, KPI values, 12px radius)
- Economics tab: Synthwave theme (glass panels, warm surface, readable text)
- Economics tab: Tropical theme (border distinct from accent)
- Wells tab: Classic/Mario theme (beveled panels intact)
- Mobile viewport 375px (panels, toggles, sticky bar)
- Keyboard: Tab through nav — focus rings visible
- Motion: Open KeyboardShortcuts modal — animates in/out
- Motion: KPI tiles stagger on page load

---

## Shared File Conflict Map

| File | Workstreams | Regions Affected |
|------|------------|-----------------|
| `KpiGrid.tsx` | 2 (labels), 3 (grid-cols), 4 (value sizes), 5 (stagger) | Different lines — low conflict |
| `PageHeader.tsx` | 1 (focus rings), 3 (padding), 4 (font-bold) | Different properties |
| `DesignEconomicsView.tsx` | 2 (radius), 3 (gaps/padding), 4 (font-bold, heading-font) | Different regions |
| `SectionCard.tsx` | 2 (opacity), 4 (font-bold), 5 (spring) | Different lines |
| `Toast.tsx` | 1 (focus ring), 2 (border tokens), 5 (spring) | Different lines |

**Recommended execution order:**
1. Workstreams 1, 2, 3 in parallel (foundation)
2. Merge and validate
3. Workstreams 4, 5 in parallel (overlay)
4. Merge and full validation (workstream 6)

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run typecheck` | Type-check with tsc --noEmit |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run ui:audit` | Check for forbidden CSS / style drift |
