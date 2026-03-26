# Motion & Interaction Recommendations

**Priority:** Ordered by impact-to-effort ratio. Items marked [QUICK] are < 30 minutes. Items marked [MEDIUM] are 1-3 hours. Items marked [DEEP] require architectural changes.

---

## 1. Global Reduced-Motion Gate [QUICK]

**Problem:** All motion/react animations ignore `prefers-reduced-motion`. Only the synthwave CSS background and Mario Canvas background respect the user preference.

**Fix:** Wrap the app's `<MotionConfig>` provider with `reducedMotion="user"`:

```tsx
// In index.tsx or App.tsx, wrapping the app root:
import { MotionConfig } from 'motion/react';

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

This single change makes every `motion.*` component in the codebase respect the OS accessibility preference. Springs become instant, layout animations become instant, AnimatePresence exit animations are skipped.

**Files to change:**
- `src/index.tsx` (add MotionConfig wrapper)

**Also needed:** Add reduced-motion checks to the remaining Canvas backgrounds:
- `src/components/TropicalBackground.tsx`
- `src/components/MoonlightBackground.tsx`
- `src/components/HyperboreaBackground.tsx`

Pattern to follow: `MarioOverworldBackground.tsx:173`

---

## 2. Unify the Ephemeral UI Spring Profile [QUICK]

**Problem:** Tooltips and toasts use `{400, 25}` while buttons use `{400, 17}`. Dropdown menus use duration-based easing. Three different timing models for similar-weight UI surfaces.

**Fix:** Extract a shared spring config constant:

```ts
// src/theme/motion.ts (new file or add to existing theme config)
export const SPRING = {
  snappy: { type: 'spring' as const, stiffness: 400, damping: 20 },
  entrance: { type: 'spring' as const, stiffness: 300, damping: 28, mass: 0.8 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  value: { type: 'spring' as const, stiffness: 80, damping: 20, mass: 0.8 },
};
```

Consolidate `{400, 17}` and `{400, 25}` into a single `snappy` profile at `{400, 20}`. This splits the difference: slightly more damped than the current button spring, slightly less than the tooltip spring. The user won't perceive the change, but the system gains consistency.

**Files to update:**
- `src/components/slopcast/AnimatedButton.tsx:35`
- `src/components/slopcast/AnimatedTooltip.tsx:36`
- `src/components/slopcast/Toast.tsx:53`
- `src/components/slopcast/PageHeader.tsx:55,73,84,150,167,183,201,219,326,338,358`
- `src/components/slopcast/GroupComparisonStrip.tsx:77,127`
- `src/components/slopcast/SectionCard.tsx:42`
- `src/components/layout/ViewTransition.tsx:24`

Convert the dropdown menu animations from `{ duration: 0.15 }` to the `snappy` spring. Spring-based dropdown open/close will feel more physically grounded and match the rest of the system.

---

## 3. Animate Modal Dialogs [MEDIUM]

**Problem:** `KeyboardShortcutsHelp.tsx:22` and `ProjectSharePanel.tsx:46` render with `if (!open) return null` -- no entrance or exit animation. They pop in and vanish.

**Fix:** Wrap each modal in AnimatePresence and add a motion.div with scale + fade:

For both `KeyboardShortcutsHelp.tsx` and `ProjectSharePanel.tsx`:

1. Remove the `if (!open) return null` early return
2. Wrap the entire return in `<AnimatePresence>`
3. Conditionally render the modal content based on `open`
4. Add to the modal panel div:
   - `initial={{ opacity: 0, scale: 0.95, y: 8 }}`
   - `animate={{ opacity: 1, scale: 1, y: 0 }}`
   - `exit={{ opacity: 0, scale: 0.95, y: 8 }}`
   - `transition={SPRING.snappy}`
5. Add to the backdrop div:
   - `initial={{ opacity: 0 }}`
   - `animate={{ opacity: 1 }}`
   - `exit={{ opacity: 0 }}`

**Files to change:**
- `src/components/slopcast/KeyboardShortcutsHelp.tsx`
- `src/components/slopcast/ProjectSharePanel.tsx`

---

## 4. Convert MobileDrawer to motion/react [MEDIUM]

**Problem:** `MobileDrawer.tsx:49` uses CSS `transition-transform duration-300 ease-in-out` while every other animated surface uses spring physics. The drawer feels like it belongs to a different app.

**Fix:** Replace the CSS transition approach with `AnimatePresence` + `motion.div`:

- Backdrop: `motion.div` with opacity fade (spring)
- Panel: `motion.div` with `x` animation (`initial={{ x: '-100%' }}`, `animate={{ x: 0 }}`)
- Use the `entrance` spring profile for the panel slide
- Remove the `open ? 'translate-x-0' : '-translate-x-full'` conditional classes
- The AnimatePresence `exit` will handle the close animation naturally

**File to change:**
- `src/components/layout/MobileDrawer.tsx`

---

## 5. AI Assistant Open/Close Animation [MEDIUM]

**Problem:** `AiAssistant.tsx:157-173` -- the FAB uses CSS `hover:scale-105`, and the chat panel mounts with no animation. This is the highest-touch interactive surface in the app and it has the least motion polish.

**Fix:** Two-phase animation:

**Phase 1 (Quick win):** Wrap the chat panel in AnimatePresence with a spring scale-up from the bottom-right corner:
- `initial={{ opacity: 0, scale: 0.8, y: 20 }}`
- `animate={{ opacity: 1, scale: 1, y: 0 }}`
- `exit={{ opacity: 0, scale: 0.8, y: 20 }}`
- `transition={SPRING.snappy}`
- Set `style={{ transformOrigin: 'bottom right' }}` so it scales from the FAB's position

**Phase 2 (Stretch):** Convert the FAB itself to a `motion.button` with `whileTap={{ scale: 0.9 }}` and `whileHover={{ scale: 1.08 }}` using the snappy spring. Add a subtle `layoutId` shared between the FAB and the chat panel header for a morphing effect.

**File to change:**
- `src/components/slopcast/AiAssistant.tsx`

---

## 6. Add Focus Rings to Interactive Elements [QUICK]

**Problem:** `AnimatedButton.tsx`, `DesignWorkspaceTabs.tsx`, `GroupComparisonStrip.tsx`, and all PageHeader buttons lack visible focus indicators. Keyboard navigation is blind.

**Fix:** Add a consistent focus ring pattern. Use the existing glow system:

For motion.button elements, add a Tailwind class:
```
focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:ring-offset-1 focus-visible:ring-offset-theme-bg
```

For `AnimatedButton.tsx:32`, append to the className string:
```
focus-visible:ring-2 focus-visible:ring-theme-cyan/40 focus-visible:outline-none
```

**Files to update:**
- `src/components/slopcast/AnimatedButton.tsx:32`
- `src/components/slopcast/DesignWorkspaceTabs.tsx:60`
- `src/components/slopcast/GroupComparisonStrip.tsx:79`
- `src/components/slopcast/PageHeader.tsx:56,85,151,185,203,221,329,341,361`
- `src/components/slopcast/Toast.tsx:66` (dismiss button)
- `src/components/slopcast/OnboardingTour.tsx:112` (Next button)

---

## 7. Kill the WorkflowStepper Perpetual Pulse [QUICK]

**Problem:** `WorkflowStepper.tsx:72-80` -- the ACTIVE step runs `scale: [1, 1.03, 1]` on a continuous 400ms loop. This is distracting after a few seconds and wastes GPU cycles.

**Fix:** Change from a continuous animation to a single entrance pulse:

At `WorkflowStepper.tsx:72-80`, replace:
```tsx
animate={step.status === 'ACTIVE' ? { scale: [1, 1.03, 1] } : { scale: 1 }}
transition={step.status === 'ACTIVE' ? { duration: 0.4, ease: 'easeInOut' } : { duration: 0.2 }}
```

With:
```tsx
initial={{ scale: step.status === 'ACTIVE' ? 0.97 : 1 }}
animate={{ scale: 1 }}
transition={{ type: 'spring', stiffness: 300, damping: 20 }}
```

This gives a single satisfying snap when the step becomes active, then settles. The step's color already communicates its active state -- the pulse is redundant.

**File to change:**
- `src/components/slopcast/WorkflowStepper.tsx`

---

## 8. Fix ReadinessChecklist Spring Overshoot [QUICK]

**Problem:** `ReadinessChecklist.tsx:25` -- `{stiffness: 100, damping: 20}` is underdamped for a progress bar. The bar will visually overshoot its target width, making 73% look like 78% before settling.

**Fix:** Increase damping to eliminate overshoot:

At `ReadinessChecklist.tsx:25`, change:
```tsx
transition={{ type: 'spring', stiffness: 100, damping: 20 }}
```
To:
```tsx
transition={{ type: 'spring', stiffness: 200, damping: 30 }}
```

This creates a critically-damped spring that reaches the target without overshoot. Progress bars communicate data -- they should not lie, even briefly.

**File to change:**
- `src/components/slopcast/ReadinessChecklist.tsx`

---

## 9. OnboardingTour Step Transitions [MEDIUM]

**Problem:** `OnboardingTour.tsx:77-95` -- the highlight ring has CSS `transition-all duration-300` for position changes, but the tooltip card teleports between steps with no animation.

**Fix:** Convert the tooltip card to a `motion.div` with AnimatePresence:

- Key the tooltip on `stepIndex` so AnimatePresence detects the change
- `initial={{ opacity: 0, y: 8 }}`
- `animate={{ opacity: 1, y: 0 }}`
- `exit={{ opacity: 0, y: -8 }}`
- Use `SPRING.snappy` for timing

Also convert the highlight ring from CSS transition to a `motion.div` with `layout` prop for spring-based position animation. This will make the ring *slide* between targets with spring physics instead of linear interpolation.

**File to change:**
- `src/components/slopcast/OnboardingTour.tsx`

---

## 10. Skeleton-to-Content Crossfade [MEDIUM]

**Problem:** Skeleton components (`Skeleton.tsx`) shimmer in place, then the real content mounts and the skeleton unmounts with no transition between them.

**Fix:** The `FadeIn` wrapper (`Skeleton.tsx:127-140`) already exists but is not widely used. Adopt it as the standard content entrance wrapper:

- Wherever a Skeleton is conditionally replaced by real content, wrap the real content in `<FadeIn>`:
  ```tsx
  {isLoading ? <KpiGridSkeleton /> : <FadeIn><KpiGrid {...props} /></FadeIn>}
  ```

For a more polished version, create a `<SkeletonTransition>` component that uses AnimatePresence to crossfade:
```tsx
<AnimatePresence mode="wait">
  {isLoading ? (
    <motion.div key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <KpiGridSkeleton />
    </motion.div>
  ) : (
    <FadeIn key="content">
      <KpiGrid {...props} />
    </FadeIn>
  )}
</AnimatePresence>
```

**Files to update:**
- Components that use skeleton loading states (KpiGrid consumers, Charts, tables)

---

## 11. ViewTransition Mode Adjustment [QUICK]

**Problem:** `ViewTransition.tsx:18` uses `mode="wait"`, which creates a visible gap between exit and enter. For workspace tab switches (WELLS/ECONOMICS), this reads as a stutter.

**Fix:** Change to `mode="popLayout"` for a crossfade effect:

At `ViewTransition.tsx:18`:
```tsx
<AnimatePresence mode="popLayout">
```

This allows the entering view to begin its animation while the exiting view is still leaving, creating an overlap/crossfade rather than a sequential swap. The content will feel more fluid for sibling views that share layout structure.

**Caveat:** Test this change carefully -- `popLayout` can cause brief layout doubling if the container doesn't have a fixed height. May need `position: relative` on the wrapper and `position: absolute` on exiting elements.

**File to change:**
- `src/components/layout/ViewTransition.tsx`

---

## 12. KPI Tile Entrance Stagger [QUICK]

**Problem:** In the KPI grid (`KpiGrid.tsx:314-421`), the hero NPV card and the five metric tiles all appear simultaneously. There's no stagger to guide the eye.

**Fix:** Wrap each `KpiStripTile` in a `FadeIn` with incremental delays:

```tsx
<FadeIn delay={0.05}><KpiStripTile title="Total CAPEX" ... /></FadeIn>
<FadeIn delay={0.10}><KpiStripTile title="Portfolio EUR" ... /></FadeIn>
<FadeIn delay={0.15}><KpiStripTile title="IRR" ... /></FadeIn>
<FadeIn delay={0.20}><KpiStripTile title="Payout" ... /></FadeIn>
<FadeIn delay={0.25}><WellsBadge ... /></FadeIn>
```

The hero card should enter first (no delay), then the tiles cascade left-to-right with 50ms intervals.

**File to change:**
- `src/components/slopcast/KpiGrid.tsx`

---

## 13. Chat Message Entrance Animation [QUICK]

**Problem:** `AiAssistant.tsx:243-262` -- chat messages render in a `.map()` with no animation. Messages appear instantly.

**Fix:** Wrap each message in a `motion.div` with a slide-up entrance:

```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={SPRING.snappy}
>
```

Also add AnimatePresence around the "Thinking..." indicator (`AiAssistant.tsx:263-270`) for a fade-in/fade-out rather than instant mount/unmount.

**File to change:**
- `src/components/slopcast/AiAssistant.tsx`

---

## Priority Matrix

| # | Recommendation | Impact | Effort | Priority |
|---|---------------|--------|--------|----------|
| 1 | Global reduced-motion gate | Critical (a11y) | [QUICK] | P0 |
| 6 | Focus rings on interactive elements | Critical (a11y) | [QUICK] | P0 |
| 2 | Unify spring profiles | High (consistency) | [QUICK] | P1 |
| 7 | Kill perpetual stepper pulse | Medium (polish) | [QUICK] | P1 |
| 8 | Fix progress bar overshoot | Medium (data integrity) | [QUICK] | P1 |
| 3 | Animate modal dialogs | High (brand) | [MEDIUM] | P1 |
| 5 | AI Assistant open/close | High (delight) | [MEDIUM] | P1 |
| 4 | Convert MobileDrawer to springs | Medium (consistency) | [MEDIUM] | P2 |
| 9 | OnboardingTour step transitions | Medium (first impression) | [MEDIUM] | P2 |
| 11 | ViewTransition mode adjustment | Medium (fluidity) | [QUICK] | P2 |
| 12 | KPI tile entrance stagger | Low (polish) | [QUICK] | P3 |
| 10 | Skeleton-to-content crossfade | Low (polish) | [MEDIUM] | P3 |
| 13 | Chat message entrance animation | Low (delight) | [QUICK] | P3 |
