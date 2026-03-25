# Component Consistency Audit

Detailed technical audit of component variants, visual states, style divergence,
isClassic coverage gaps, inline style usage, and duplicated styling logic.

---

## 1. Component Variants and Visual States

### SectionCard.tsx
- **Variants:** panelStyle = glass | solid | outline (line 12, consumed at 17-21)
- **States:** entrance animation via useInView + staggerIndex (lines 38-46)
- **Missing:** no hover state, no focus state, no loading/skeleton state

### AnimatedButton.tsx
- **Variants:** variant = primary | secondary | ghost | danger (line 5)
- **Size:** sm | md | lg (line 6)
- **States:** disabled (opacity-40, line 32), whileTap scale, whileHover scale
- **Missing:** loading state, active/selected state, no isClassic variant

### AnimatedTooltip.tsx
- **Variants:** side = top | bottom (line 7)
- **States:** show/hide via AnimatePresence (lines 29-39)
- **Missing:** no isClassic styling, no variant for theme-aware backgrounds

### KpiGrid.tsx
- **Variants:** Full isClassic branch (lines 238-311 classic, 314-421 modern)
- **States:** shimmer on recalculation (line 235), after-tax/levered toggles
- **panelStyle-aware:** heroBgMap and tileBgMap (lines 219-229)
- **Sub-components:** AnimatedValue, CashFlowSparkline, PayoutRing,
  MetricSparkline, KpiStripTile, WellsBadge — all internal, well-factored

### FilterChips.tsx
- **Variants:** none
- **States:** AnimatePresence enter/exit (lines 25-28)
- **Missing:** isClassic, selected state, size variant

### KbdBadge.tsx
- **Variants:** none (className passthrough)
- **States:** hidden on mobile via `hidden md:inline-flex` (line 4)
- **Missing:** isClassic

### Toast.tsx
- **Variants:** type = success | info | warning | error (line 4)
- **States:** auto-dismiss timer (line 43), exit animation (line 52)
- **Missing:** isClassic, position variant (hardcoded bottom-right, line 86)

### Skeleton.tsx
- **Variants:** variant = text | rect | circle (line 6), multi-line text
- **States:** infinite shimmer animation (lines 12-15)
- **Exported skeletons:** KpiGridSkeleton, TableSkeleton, ChartSkeleton,
  GroupComparisonSkeleton, FadeIn — all match target component layouts
- **Missing:** isClassic (skeletons always use modern tokens)

### ProfileSelector.tsx
- **Variants:** Full isClassic throughout (12+ branches)
- **States:** isOpen dropdown, filterType, filterBasin, selectedPreset,
  showSaveForm, isLoading
- **Well-covered** but extremely verbose

### WorkflowStepper.tsx
- **Variants:** compact boolean (line 17), full isClassic dual-mode
- **States:** NOT_STARTED, ACTIVE, COMPLETE, STALE (line 5)
- **ACTIVE state:** motion scale pulse (lines 72-81)

### Controls.tsx
- **Variants:** isClassic dual-mode on every section
- **States:** showTemplateMenu, pendingTemplate confirmation dialog
- **Sub-delegations:** CapexControls, OpexControls, OwnershipControls,
  DeclineSegmentTable

### CapexControls.tsx
- **Variants:** summary (pie chart) vs editing (grid) modes
- **States:** isEditing toggle, tooltip on pie chart
- **isClassic:** Partial — 10+ ternary branches but not on every element

### EconomicsResultsTabs.tsx
- **Variants:** 5 tabs with active indicator (layoutId animation)
- **States:** active, disabled (Cash Flow when no data)
- **isClassic:** Full coverage

### DesignWorkspaceTabs.tsx
- **Variants:** compact boolean, 2 tabs
- **States:** active (layoutId), attention badges (wellsNeedsAttention,
  economicsNeedsAttention)
- **isClassic:** Full coverage

### InlineEditableValue.tsx
- **Variants:** type = text | number
- **States:** viewing, editing, error
- **isClassic:** None (receives className externally)

---

## 2. Style Divergence Between Similar Components

### Tab components: EconomicsResultsTabs vs DesignWorkspaceTabs

Both use the same `layoutId` animated indicator pattern but diverge:

| Property | EconomicsResultsTabs | DesignWorkspaceTabs |
|----------|---------------------|---------------------|
| Active bg (classic) | `bg-theme-warning` (line 63) | `bg-theme-warning` (line 66) |
| Active bg (modern) | `bg-theme-cyan` (line 63) | `bg-theme-cyan/80` (line 66) |
| Border weight (classic) | `border-2` (line 50) | `border-2` (line 27) |
| Border weight (modern) | `border` (line 52) | `border` (line 33) |
| Tracking | `tracking-widest` (line 49) | `tracking-[0.15em]` (line 26) |
| Active text (modern) | `text-theme-bg` (line 54) | `text-theme-bg` (line 35) |
| Shadow (modern active) | `shadow-glow-cyan` (line 54) | `shadow-sm` (line 35) |

The `tracking-widest` vs `tracking-[0.15em]` and `shadow-glow-cyan` vs
`shadow-sm` differences create subtle but perceptible visual inconsistency
between the two tab bars.

### Panel wrappers: SectionCard vs Controls.tsx inline panels

SectionCard.tsx:50 uses `sectionBgMap[panelStyle]` to pick glass/solid/outline.
Controls.tsx hardcodes specific opacities:
- Line 93: `bg-theme-surface1` (solid, no opacity)
- Line 118: `bg-theme-surface1/60` (glass-like)
- Line 199: `bg-theme-surface1/80`
- Line 235: `bg-theme-surface1/40`

These four different opacity values across the same view create uneven depth
layering. SectionCard's three-level system (glass=70%, solid=100%, outline=20%)
is not being followed.

### Button styling: ProfileSelector vs Controls vs page-level CTAs

ProfileSelector.tsx:89-93:
```
px-3 py-1.5 rounded-inner text-xs font-black uppercase tracking-[0.14em]
```

Controls.tsx:127-131:
```
px-3 py-1.5 rounded-inner text-[9px] font-black uppercase tracking-[0.14em]
```

HubPage.tsx:132:
```
px-3 md:px-4 py-2 rounded-panel text-[9px] md:text-[10px] font-black uppercase tracking-widest
```

Note: `text-xs` vs `text-[9px]` vs `text-[10px]`, `rounded-inner` vs
`rounded-panel`, `tracking-[0.14em]` vs `tracking-widest`. No shared button
component is used.

---

## 3. isClassic Coverage Gaps

Components with NO isClassic support:

| Component | File | Impact |
|-----------|------|--------|
| AnimatedButton | AnimatedButton.tsx | Dead code — zero imports |
| AnimatedTooltip | AnimatedTooltip.tsx | Low — small overlay element |
| FilterChips | FilterChips.tsx | Medium — visible in well selection |
| KbdBadge | KbdBadge.tsx | Low — subtle helper badge |
| Toast | Toast.tsx | Medium — appears on save/error actions |
| Skeleton | Skeleton.tsx | Medium — visible during loading states |
| InlineEditableValue | InlineEditableValue.tsx | Low — delegates to parent className |

Components with PARTIAL isClassic support:

| Component | File | Gap |
|-----------|------|-----|
| CapexControls | CapexControls.tsx | Pie chart tooltip uses CSS vars (line 123-128), editing grid header uses `text-theme-muted` universally (line 184) |
| Controls.tsx | Controls.tsx | Confirmation dialog "Apply" button uses `bg-theme-magenta text-white` without isClassic (line 174) |

The practical consequence: in Mario theme, toasts, skeletons, filter chips,
and tooltips all render with modern surface tokens (`bg-theme-surface1`,
`border-theme-border`) which resolve to the Mario CSS values but miss the
gradient/inset-shadow treatment that `sc-panel` provides. They look "flat"
compared to the gradient-rich panels around them.

---

## 4. Inline Styles That Should Be Classes

### Dynamic color dots (acceptable inline styles)
- Controls.tsx:100 — `style={{ backgroundColor: group.color, boxShadow: ... }}`
- CapexControls.tsx:142 — `style={{ backgroundColor: d.color }}`

These are driven by user-assigned runtime colors and are appropriate as inline
styles.

### Layout dimensions (acceptable)
- Skeleton.tsx:33 — `style={{ width: i === lines - 1 ? '60%' : '100%' }}`
- Skeleton.tsx:78 — `style={{ gridTemplateColumns: \`repeat(${cols}, 1fr)\` }}`

Dynamic dimensions based on props — acceptable.

### Chart tooltip styling (should be a class)
- CapexControls.tsx:123-128 — Recharts tooltip contentStyle with inline
  `background`, `border`, `borderRadius`, `fontSize`. This should use a CSS
  class or at minimum a shared constant, because every Recharts tooltip in the
  app likely needs the same treatment.

### Tab indicator z-index (should be a class)
- EconomicsResultsTabs.tsx:65 — `style={{ zIndex: 0 }}`
- DesignWorkspaceTabs.tsx:68 — `style={{ zIndex: 0 }}`

Both use `style={{ zIndex: 0 }}` on the motion indicator. This could be a
Tailwind class `z-0`.

### Background component styles
- HyperboreaBackground.tsx:1003, TropicalBackground.tsx:936,
  MarioOverworldBackground.tsx:392, MoonlightBackground.tsx:447 — Canvas wrapper
  positioning. These are structural and acceptable as inline styles.

---

## 5. Duplicated Styling Logic

### Panel shell duplication

The pattern `isClassic ? 'sc-panel theme-transition' : 'rounded-panel border
shadow-card theme-transition bg-theme-surface1/XX border-theme-border'` appears
in at least 25 locations across the codebase. SectionCard.tsx exists to
encapsulate this, but most components do not use it.

Locations duplicating the panel pattern (non-exhaustive):
- Controls.tsx: lines 91-93, 116-118, 197-199, 233-235, 263-265, 275-277, 287-289
- SensitivityMatrix.tsx: lines 74, 97
- ScenarioDashboard.tsx: lines 208, 288, 326, 410, 446
- ScenarioComparison.tsx: lines 70, 119, 159
- DesignEconomicsView.tsx: lines 123, 275, 322, 385, 427, 469, 520, 565
- DealsTable.tsx: line 95
- OperationsConsole.tsx: lines 105, 258

**Estimated duplication:** 30+ instances of the same ternary.

### Section header duplication

Controls.tsx defines `sectionHeaderClass` (lines 82-84) as a local variable:
```
isClassic
  ? 'text-[10px] font-black uppercase tracking-[0.22em] text-white ...'
  : 'text-[10px] font-black uppercase tracking-[0.22em] text-theme-cyan ...'
```

This same pattern (uppercase label, accent colored, border-bottom separator)
appears in:
- SectionCard.tsx:61-66 (as part of the component, slightly different sizing)
- KpiGrid.tsx:324 (inline `text-xs font-bold uppercase tracking-[0.4em]`)
- DesignEconomicsView (multiple section headers)

The tracking values are inconsistent: `[0.22em]`, `[0.24em]`, `[0.4em]`,
`[0.3em]`, `[0.18em]`.

### Button class duplication

The pattern for isClassic small action buttons:
```
isClassic
  ? 'bg-black/15 text-white border-black/30 hover:bg-black/25'
  : 'bg-theme-bg text-theme-cyan border-theme-border hover:border-theme-cyan'
```

Appears in:
- Controls.tsx:128-131
- ProfileSelector.tsx:91-93, 102-104
- CapexControls.tsx:174-177

### Titlebar duplication

The `sc-panelTitlebar sc-titlebar--neutral` + matching modern path appears in:
- SectionCard.tsx:57-58
- WorkflowStepper.tsx:52-53
- GroupWellsTable.tsx:64
- ForecastGrid.tsx:138
- DesignEconomicsView.tsx:127, 394, 436, 478, 529, 569
- CommentsPanel.tsx:51
- AuditLogPanel.tsx:45
- ReservesPanel.tsx:91

All with the modern fallback:
`'px-4 py-2 border-b border-theme-border/60'`

---

## 6. Token Coverage Summary

| Token | Usage | Notes |
|-------|-------|-------|
| `rounded-panel` | ~60+ uses | Consistent for outer panels in modern mode |
| `rounded-inner` | ~40+ uses | Consistent for nested elements |
| `shadow-card` | ~40+ uses | Applied to panels in modern mode |
| `theme-transition` | ~50+ uses | Applied broadly, good coverage |
| `heading-font` | ~5 uses | Underused — most headings use inline font classes |
| `brand-font` | ~12 uses | Used in ScenarioDashboard and Controls only |
| `shadow-glow-cyan` | ~12 uses | Used on CTAs in pages, absent from component lib |
| `shadow-glow-magenta` | ~2 uses | Rarely used |
| `animate-shimmer` | ~5 uses | KpiGrid recalculation only |

### Missing token usage
- `heading-font` and `brand-font` should be applied consistently to section
  headers — currently only a few components check `theme.features.headingFont`
  or `theme.features.brandFont`.
- `panelStyle` from ThemeFeatures is only consumed by KpiGrid and SectionCard.
  All other panels hardcode their opacity levels.
- `glowEffects` is only checked in Controls.tsx:100 (group color dot) and
  MapVisualizer.tsx:344 (SVG filter). No component uses it for panel or button
  glow effects.
- `denseSpacing` from ThemeFeatures is not consumed by ANY component. It is
  defined (themes.ts:41) but never read.
