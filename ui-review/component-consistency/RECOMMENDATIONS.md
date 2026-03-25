# Component Consistency Recommendations

Prioritized refactoring recommendations to improve consistency, reduce
duplication, and elevate the Slopcast design system.

---

## Priority 1: Establish a Shared Button Component

**Problem:** Five distinct button patterns exist. AnimatedButton.tsx is dead
code. Buttons vary in size, tracking, hover treatment, and border-radius.

**Recommendation:**

1. **Revive and extend AnimatedButton** (AnimatedButton.tsx) to handle both
   isClassic and modern modes. Add an isClassic prop that switches between
   `sc-btnPrimary`/`sc-btnSecondary` CSS classes and the current Tailwind
   variant system.

2. **Define a strict size scale:**
   - `xs`: `px-2 py-1 text-[9px]` (inline controls, table actions)
   - `sm`: `px-3 py-1.5 text-[10px]` (panel actions, secondary CTAs)
   - `md`: `px-4 py-2 text-xs` (standard buttons)
   - `lg`: `px-5 py-3 text-sm` (hero CTAs, page-level actions)

3. **Standardize letter-spacing** to one value for uppercase button labels:
   `tracking-[0.16em]`. Currently four different values are in use
   (`tracking-widest` ~0.1em, `[0.12em]`, `[0.14em]`, `[0.16em]`).

4. **Add `glow` prop** that applies `shadow-glow-cyan` or `shadow-glow-magenta`
   based on variant, respecting `theme.features.glowEffects`.

5. **Replace all inline button classes** with the shared component. Target
   files (highest impact):
   - `src/components/Controls.tsx` — lines 127, 146, 174, 180
   - `src/components/slopcast/ProfileSelector.tsx` — lines 89, 101, 146, 247
   - `src/components/slopcast/DesignWellsView.tsx` — lines 482, 497, 512, 531, 545
   - `src/pages/HubPage.tsx` — lines 132, 184, 263, 320
   - `src/pages/IntegrationsPage.tsx` — lines 248, 348, 439
   - `src/components/GroupList.tsx` — line 29
   - `src/components/slopcast/CommentsPanel.tsx` — line 116

**Estimated scope:** ~30 button instances to migrate.

---

## Priority 2: Extract a Panel Primitive

**Problem:** The panel shell pattern (`isClassic ? 'sc-panel ...' : 'rounded-panel
border shadow-card ...'`) is duplicated 30+ times. SectionCard exists but is
underused.

**Recommendation:**

1. **Create a lightweight `ThemePanel` component** (or rename SectionCard to
   Panel and make title optional — it already is). The component should:
   - Accept `isClassic` (or derive it from `useTheme()` internally)
   - Accept `panelStyle` (default from `theme.features.panelStyle`)
   - Accept optional `title`, `titleVariant` (neutral/red/blue/brown/yellow)
   - Handle classic path: `sc-panel` + `sc-panelTitlebar sc-titlebar--{variant}`
   - Handle modern path: `rounded-panel border shadow-card` + panelStyle bg
   - Support stagger animation (already in SectionCard)

2. **Migrate Controls.tsx first** — replace the 7 inline panel shells (lines
   91-93, 116-118, 197-199, 233-235, 263-265, 275-277, 287-289) with
   `<ThemePanel>` wrappers. This single file change eliminates ~35 lines of
   duplicated ternary logic.

3. **Then migrate DesignEconomicsView.tsx** — 8 panel instances (lines 123,
   275, 322, 385, 427, 469, 520, 565).

4. **Standardize opacity levels** for the `glass` panelStyle. Currently:
   - SectionCard uses `/70` (line 18)
   - Controls uses `/60`, `/80`, `/40` (mixed)
   - KpiGrid hero uses `/90` (line 220)
   - KpiGrid tiles use `/60` (line 226)

   Recommendation: glass = `/60` (tiles/cards), `/80` (hero/primary), `/90`
   (elevated/modal). Three levels, documented.

---

## Priority 3: Add isClassic to Missing Components

**Six components have zero isClassic support.** Add minimal dual-mode coverage:

### Toast.tsx (Medium priority)
- Classic mode: replace `bg-theme-surface1 border border-theme-border` with
  `sc-panel` class. Replace `rounded-inner` with the panel's built-in radius.
- Classic mode border-left colors: map `success` to `border-l-theme-cyan`,
  keep others consistent with the existing `toastStyles` map.
- File: `src/components/slopcast/Toast.tsx`, line 54

### Skeleton.tsx (Medium priority)
- Classic mode: replace `bg-theme-surface2/50` base with a class using
  `sc-panel` gradient colors at lower opacity for the shimmer effect.
- KpiGridSkeleton (line 57): classic mode should match the `sc-kpi` structure.
- File: `src/components/slopcast/Skeleton.tsx`, lines 24, 57-66

### FilterChips.tsx (Low priority)
- Classic mode: replace `bg-theme-surface2/60 border-theme-border/40` with
  `bg-black/20 border-black/30 text-white` to match the retro vocabulary seen
  in ProfileSelector classic mode.
- File: `src/components/slopcast/FilterChips.tsx`, line 29

### AnimatedTooltip.tsx (Low priority)
- Classic mode: replace `bg-theme-surface1 border-theme-border` with a dark
  retro surface. The tooltip is small enough that this is low-impact.
- File: `src/components/slopcast/AnimatedTooltip.tsx`, line 32

### KbdBadge.tsx (Low priority)
- Classic mode: replace `bg-theme-surface2/40 border-theme-border/30` with
  `bg-black/20 border-black/30 text-white/50`.
- Also: change `rounded` to `rounded-inner` for consistency (line 4).
- File: `src/components/slopcast/KbdBadge.tsx`, line 4

### AnimatedButton.tsx (Covered by Priority 1)
- Will be addressed when the button component is extended.

---

## Priority 4: Standardize Section Header Typography

**Problem:** Section headers use five different tracking values and inconsistent
font sizes across the codebase.

**Recommendation:**

1. **Define two header levels:**
   - `panel-title`: `text-xs font-black uppercase tracking-[0.24em]`
     - Classic: `text-white`
     - Modern: `text-theme-cyan heading-font`
   - `section-label`: `text-[10px] font-black uppercase tracking-[0.2em]`
     - Classic: `text-white/70` or `text-theme-warning`
     - Modern: `text-theme-muted`

2. **Create utility classes or a small component** for these. The
   `heading-font` class already exists in `src/app.css:61` but is applied
   inconsistently.

3. **Apply `brandFont` check consistently.** Currently only Controls.tsx:102
   and ScenarioDashboard check `theme.features.brandFont`. All panel titles
   should apply it when enabled.

4. **Audit files for convergence:**
   - `src/components/slopcast/SectionCard.tsx:65` — `tracking-[0.24em]` (correct)
   - `src/components/Controls.tsx:83` — `tracking-[0.22em]` (should be 0.24em)
   - `src/components/slopcast/KpiGrid.tsx:324` — `tracking-[0.4em]` (intentionally
     wide for hero, acceptable as exception)
   - `src/components/slopcast/KpiGrid.tsx:163` — `tracking-[0.18em]` (tile
     labels, acceptable as smaller variant)

---

## Priority 5: Consume ThemeFeatures Fully

**Problem:** Several ThemeFeatures are defined but not consumed.

### `denseSpacing` (themes.ts:41)
- **Not used anywhere.** Should drive spacing in grid gaps, panel padding, and
  table density.
- Recommendation: define a spacing scale variant that applies tighter padding
  when `denseSpacing: true`. Apply to panel body padding (currently hardcoded
  `p-4` everywhere) and grid gaps (currently `gap-2` or `gap-3`).

### `panelStyle` (themes.ts:39)
- **Only consumed by KpiGrid and SectionCard.** All other panels hardcode their
  opacity.
- Recommendation: ThemePanel (Priority 2) should read `panelStyle` from context
  by default. This automatically propagates to all migrated panels.

### `glowEffects` (themes.ts:38)
- **Only used for map dots and group color swatches.** Should also drive:
  - Button glow on hover (CTA buttons)
  - Active tab indicator glow
  - KPI hero card subtle border glow
- Recommendation: add conditional `shadow-glow-cyan` to active tab indicators
  in EconomicsResultsTabs and DesignWorkspaceTabs when `glowEffects: true`.

### `headingFont` (themes.ts:40)
- The `heading-font` CSS class exists but is only applied in ~5 places.
- Recommendation: ThemePanel title rendering should always apply `heading-font`.
  SectionCard.tsx:65 already does this. Ensure Controls.tsx section headers
  also apply it.

---

## Priority 6: Consolidate Recharts Tooltip Styling

**Problem:** CapexControls.tsx:123-128 uses inline `contentStyle` for Recharts
tooltips. Every chart likely needs the same theme-aware tooltip.

**Recommendation:**

1. Create a shared `CHART_TOOLTIP_STYLE` constant or a `<ThemedTooltip>`
   wrapper:
   ```ts
   export const chartTooltipStyle = {
     background: 'var(--theme-bg)',
     border: '1px solid var(--theme-border)',
     borderRadius: 'var(--radius-inner)',
     fontSize: '10px',
     color: 'var(--theme-text)',
   };
   ```

2. Import and use in CapexControls.tsx:127, and any other Recharts tooltip
   locations (Charts.tsx, ReservesPanel.tsx, etc.).

---

## Priority 7: Clean Up Minor Inconsistencies

### z-index inline styles
- EconomicsResultsTabs.tsx:65 and DesignWorkspaceTabs.tsx:68 use
  `style={{ zIndex: 0 }}`. Replace with Tailwind class `z-0`.

### FilterChips dismiss button
- FilterChips.tsx:38 uses literal character `x` for dismiss. Replace with an
  SVG `X` icon or the `&times;` entity used in CapexControls.tsx:266 for visual
  consistency.

### KbdBadge border radius
- KbdBadge.tsx:4 uses `rounded` (4px default). Should use `rounded-inner` to
  match the nested element convention.

### InlineEditableValue error colors
- InlineEditableValue.tsx:92-93 hardcodes `border-red-500` and line 97
  hardcodes `text-red-400 border-red-500/30`. Should use theme danger tokens
  if available, or at minimum use `border-theme-danger` if defined.

---

## Migration Order

| Phase | Scope | Files | Est. Impact |
|-------|-------|-------|-------------|
| 1 | Shared button component | AnimatedButton + ~30 call sites | High — visual unity |
| 2 | ThemePanel extraction | SectionCard refactor + Controls, DesignEconomicsView | High — code reduction |
| 3 | isClassic coverage | Toast, Skeleton, FilterChips, Tooltip, KbdBadge | Medium — Mario theme polish |
| 4 | Header typography | Controls, KpiGrid, DesignEconomicsView headers | Medium — micro-consistency |
| 5 | ThemeFeatures consumption | denseSpacing, panelStyle, glowEffects, headingFont | Medium — theme differentiation |
| 6 | Chart tooltip shared constant | CapexControls, Charts, ReservesPanel | Low — small dedup |
| 7 | Minor cleanups | z-index, FilterChips icon, KbdBadge radius, error colors | Low — polish |

---

## Metrics to Track

After refactoring, measure:

1. **isClassic ternary count** — target reduction from ~762 occurrences to
   under 200 (by moving branching into shared components).
2. **Unique button class strings** — target reduction from 5+ patterns to
   1 component with 4 variants.
3. **Panel shell duplication** — target zero inline panel class strings;
   all panels use ThemePanel or SectionCard.
4. **ThemeFeatures consumption** — all 6 features should be read by at
   least one component each (currently `denseSpacing` has zero consumers).
5. **Tracking value variants** — target 2 (panel-title + section-label)
   instead of the current 5+.
