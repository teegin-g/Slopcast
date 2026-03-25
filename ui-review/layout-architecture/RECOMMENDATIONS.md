# Layout Architecture Recommendations

## Prioritized Changes with Before/After Specifics

Changes are ordered by impact-to-effort ratio. Priority 1 items are high-impact, low-effort. Priority 3 items are structural improvements requiring more coordination.

---

## Priority 1: Critical Spacing Fixes (Highest Impact)

### 1.1 Expand Main Content Frame Padding

**File:** `AppShell.tsx:182`

**Before:**
```
<div className="p-3 max-w-[1920px] mx-auto w-full">
```

**After:**
```
<div className="p-3 md:p-5 xl:p-8 max-w-[1920px] mx-auto w-full">
```

**Rationale:** The main content frame padding should scale with viewport. Mobile stays at 12px (space is precious). Tablets get 20px. Desktop gets 32px — matching the documented "page margin" spacing token. This single change will immediately make the app feel more cinematic on the monitors deal teams actually use.

**Impact:** Every page benefits. The animated backgrounds and glass panels get room to breathe. The sidebar-to-content transition gains visual separation.

---

### 1.2 Harmonize Page Grid Gaps

**Files:** `DesignEconomicsView.tsx:362`, `DesignWellsView.tsx:289`

**Before (Economics):**
```
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:min-h-[calc(100vh-13.5rem)]">
```

**Before (Wells):**
```
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 ...">
```

**After (both):**
```
gap-4 lg:gap-6
```

Both page grids should use the same gap. `gap-4` (16px) on mobile/tablet is appropriate for density. `gap-6` (24px) on desktop gives the panels room. Apply this same pattern to both workspaces for consistency when switching between Wells and Economics.

---

### 1.3 Normalize Collapsible Panel Body Padding

**File:** `DesignEconomicsView.tsx` — lines 413, 455, 512, 548, 587

**Before:** Mix of `p-3` and `p-4` across five collapsible sections.

**After:** All collapsible panel bodies use `p-4` (16px).

```
// Tax (line 413): p-3 -> p-4
// Debt (line 455): p-3 -> p-4
// Reserve (line 512): p-3 -> p-4
// Advanced (line 548): already p-4 — keep
// Insights (line 587): already p-4 — keep
```

**Rationale:** These panels are siblings in the same column. Inconsistent internal padding creates uneven visual weight. 16px is the right density for form controls within a panel.

---

### 1.4 Fix Chart Panel Padding Asymmetry

**File:** `DesignEconomicsView.tsx:276`

**Before:**
```
'rounded-panel border p-1 theme-transition bg-theme-surface1/50 border-theme-border shadow-card min-h-[360px]'
```

**After:**
```
'rounded-panel border p-3 theme-transition bg-theme-surface1/50 border-theme-border shadow-card min-h-[360px]'
```

**Rationale:** `p-1` (4px) is the tightest padding in the entire app. The chart content touches the panel border. Classic mode already uses `p-3` for the same component. Match it.

---

## Priority 2: Structural Improvements

### 2.1 Give the PageHeader Vertical Breathing Room

**File:** `PageHeader.tsx:262`

**Before:**
```
className={`px-3 md:px-6 py-3 sticky top-0 z-20 theme-transition ...`}
```

**After:**
```
className={`px-3 md:px-6 lg:px-8 py-3 md:py-4 sticky top-0 z-20 theme-transition ...`}
```

The header carries brand identity, primary navigation, workspace tabs, and theme controls. It needs vertical room to separate the brand row from the nav row. The `border-t` separator at `PageHeader.tsx:318` currently sits in a 12px vertical space — increasing to 16px on desktop gives it room to function as a visual break.

Additionally, the horizontal padding should scale to match the new content frame padding from recommendation 1.1.

---

### 2.2 Expand SidebarNav Spacing

**File:** `SidebarNav.tsx:57`

**Before:**
```
<nav className="flex flex-col gap-0.5 px-2 py-1">
```

**After:**
```
<nav className="flex flex-col gap-1 px-2 py-2">
```

And for each nav button (`SidebarNav.tsx:72`):

**Before:**
```
py-1.5
```

**After:**
```
py-2
```

**Rationale:** 2px gap between primary navigation items (Wells / Economics / Scenarios) is too compressed. These are the top-level wayfinding controls. Increasing to 4px gap and 8px vertical padding per item makes the navigation feel intentional rather than squeezed. The active indicator (`border-l-2`) gets more room to stand out.

---

### 2.3 Unify Max-Width Tokens

**Files:** `AppShell.tsx:182`, `HubPage.tsx:161`, `LandingPage.tsx:118`

**Before:**
- AppShell: `max-w-[1920px]`
- HubPage: `max-w-[1600px]`
- LandingPage: `max-w-[1400px]`

**After:** Define a shared approach:

```
// AppShell.tsx — workspace pages get full width
max-w-[1920px]

// HubPage.tsx and LandingPage.tsx — marketing/landing pages get narrower
max-w-[1600px]
```

The Landing page at `max-w-[1400px]` is too narrow. At 1440px viewport, the content has only 40px of total horizontal margin — tighter than the workspace pages. Normalize Hub and Landing to `max-w-[1600px]`.

Better still: define a CSS custom property `--max-content-width` and use it consistently, allowing themes to override if needed.

---

### 2.4 Normalize Min-Height Calculations

**Files:** `DesignWellsView.tsx:289`, `DesignEconomicsView.tsx:362, 365, 630`

**Before:**
- Wells: `xl:min-h-[calc(100vh-11rem)]`
- Economics: `lg:min-h-[calc(100vh-13.5rem)]`

These values differ by 2.5rem (40px), causing a height jump when switching workspaces. The Economics header includes `EconomicsGroupBar` which Wells does not have, accounting for the difference.

**After:** Both should use a shared calculation or, better, remove the hardcoded `min-h-` and let the grid stretch naturally with `flex-1` on the content area. The current approach fights against the natural flex layout established by `AppShell.tsx:160` (`flex-1 flex flex-col overflow-hidden`).

If a minimum height is needed to prevent collapse on short content, use a single consistent value:
```
lg:min-h-[calc(100vh-14rem)]
```

The extra 0.5rem compared to Economics accounts for the group bar, and the Wells view gets slightly more breathing room at the bottom.

---

### 2.5 Add a Desktop-Wide Breakpoint

**File:** `useViewportLayout.ts`

**Before:**
```typescript
function getViewportLayout(width: number): ViewportLayout {
  if (width < 1024) return 'mobile';
  if (width < 1320) return 'mid';
  return 'desktop';
}
```

**After:**
```typescript
export type ViewportLayout = 'mobile' | 'mid' | 'desktop' | 'wide';

function getViewportLayout(width: number): ViewportLayout {
  if (width < 1024) return 'mobile';
  if (width < 1320) return 'mid';
  if (width < 1920) return 'desktop';
  return 'wide';
}
```

**Rationale:** On 27" monitors (effective 1440px-2560px), the layout does nothing beyond the 1320px desktop breakpoint. Adding a `wide` layout allows the app to make structural decisions at ultrawide resolutions: wider sidebar, larger KPI typography, or a third column for the Economics summary view.

This does not require immediate visual changes — it establishes the hook for future enhancements. The immediate benefit is that the content frame padding (recommendation 1.1) can scale further: `2xl:p-10` for ultrawide monitors.

---

## Priority 3: Polish and Consistency

### 3.1 Fix Classic Mode Radius Inconsistency

**File:** `DesignWellsView.tsx:96, 109`

**Before:** The Operator select uses `rounded-md` (line 96), while Formation and Status selects use `rounded-inner` (lines 109, 121).

**After:** All three selects in the classic FiltersPanel should use `rounded-inner`:
```
className="w-full rounded-inner px-3 py-2 text-xs font-black sc-inputNavy"
```

---

### 3.2 Use Z-Index Tokens

**Files:** `AppShell.tsx:124, 137, 160`, `MobileDrawer.tsx:36`, `DesignWellsView.tsx:459`

The `theme.css` defines z-index tokens at lines 43-48:
```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-modal: 30;
--z-toast: 40;
--z-tooltip: 50;
```

None of these are used. Replace hardcoded z-index classes with token references:

**Before:** `z-0`, `z-20`, `z-30`, `z-40`, `z-50`

**After:** Create Tailwind utilities that map to these tokens, or use inline styles:
```
style={{ zIndex: 'var(--z-base)' }}     // background canvas
style={{ zIndex: 'var(--z-sticky)' }}   // main content, header
style={{ zIndex: 'var(--z-modal)' }}    // sidebar, drawer
style={{ zIndex: 'var(--z-toast)' }}    // mobile action tray
```

---

### 3.3 Improve Sidebar Collapse Animation Timing

**File:** `AppShell.tsx:138`

**Before:**
```
transition-[width] duration-300 ease-in-out
```

**After:**
```
transition-[width] duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)]
```

The current `ease-in-out` creates a symmetrical animation that feels slow. A faster start with a gentle landing matches the spring-based motion used elsewhere in the app (PageHeader buttons use `spring` with `stiffness: 400, damping: 17`). Reducing to 250ms also aligns better with the `duration-200` used on the collapse chevron rotation (`Sidebar.tsx:22`).

---

### 3.4 Add Sidebar-to-Content Gap

**File:** `AppShell.tsx:160`

**Before:**
```
<div className="relative z-20 flex-1 flex flex-col overflow-hidden">
```

The main content column butts directly against the sidebar. The only separation is the sidebar's `borderRight: '1px solid var(--glass-sidebar-border)'`.

**After:**
```
<div className="relative z-20 flex-1 flex flex-col overflow-hidden ml-0 lg:ml-1">
```

A 4px left margin on desktop creates a subtle visual gap between the glass sidebar and the content area. This is especially visible on themes with transparent sidebar backgrounds (glass mode), where the animated background bleeds through the gap and creates depth.

Alternatively, add a left padding to the main column:
```
<main className="flex-1 overflow-y-auto pl-0 lg:pl-1">
```

---

### 3.5 Responsive KPI Strip Density

**File:** `KpiGrid.tsx:358`

**Before:**
```
<div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
```

**After:**
```
<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 xl:gap-4">
```

On `lg` (1024px-1279px), the 2-column layout puts wide tiles side by side. Adding a 3-column step at `lg` prevents the tiles from stretching too wide while maintaining density. On `xl`, increase the gap to 16px to give the 5-column layout enough breathing room.

---

## Implementation Order

**Phase 1 (immediate, zero-risk):**
1. Recommendation 1.1 — Main content frame padding
2. Recommendation 1.3 — Collapsible panel body padding
3. Recommendation 1.4 — Chart panel padding
4. Recommendation 3.1 — Classic radius fix

**Phase 2 (same sprint, low-risk):**
5. Recommendation 1.2 — Page grid gap harmonization
6. Recommendation 2.1 — PageHeader vertical spacing
7. Recommendation 2.2 — SidebarNav spacing
8. Recommendation 3.3 — Sidebar animation timing

**Phase 3 (next sprint, requires QA across all themes):**
9. Recommendation 2.3 — Max-width unification
10. Recommendation 2.4 — Min-height normalization
11. Recommendation 2.5 — Wide viewport breakpoint
12. Recommendation 3.2 — Z-index tokens
13. Recommendation 3.4 — Sidebar-to-content gap
14. Recommendation 3.5 — KPI strip density steps

---

## Expected Visual Impact

After Phase 1 alone, the app will feel meaningfully different on desktop monitors:
- The content area gains 20px of additional padding on each side (12px to 32px), creating 40px more total breathing room.
- The collapsible panels in Economics become visually uniform.
- The chart panel stops looking like it was accidentally under-padded.
- The animated backgrounds and vignette effects become more visible in the expanded margin area.

The overall effect: the layout stops fighting the atmospheric design and starts amplifying it. Dense content inside a generous frame reads as "intentionally compact" rather than "ran out of space." This is the difference between Bloomberg terminal density (functional but oppressive) and a cinematic war-room tool (dense but exciting).
