# Interaction & Motion Audit

**Scope:** Complete catalog of all motion configurations, CSS transitions, AnimatePresence usage, reduced-motion accessibility, and hover/focus states across the Slopcast frontend.

---

## 1. Motion Spring Configurations

All `motion/react` spring definitions found in `src/`.

### Button / Tap Feedback Springs

| File | Line | Config | Context |
|------|------|--------|---------|
| `AnimatedButton.tsx` | 35 | `{ type: 'spring', stiffness: 400, damping: 17 }` | Universal button spring (tap + hover) |
| `PageHeader.tsx` | 55 | `{ type: 'spring', stiffness: 400, damping: 17 }` | ThemeDropdown trigger whileTap |
| `PageHeader.tsx` | 84 | `{ type: 'spring', stiffness: 400, damping: 17 }` | ThemeDropdown item whileTap |
| `PageHeader.tsx` | 150 | `{ type: 'spring', stiffness: 400, damping: 17 }` | OverflowMenu trigger whileTap |
| `PageHeader.tsx` | 183 | `{ type: 'spring', stiffness: 400, damping: 17 }` | OverflowMenu item (Share) whileTap |
| `PageHeader.tsx` | 201 | `{ type: 'spring', stiffness: 400, damping: 17 }` | OverflowMenu item (Tour) whileTap |
| `PageHeader.tsx` | 219 | `{ type: 'spring', stiffness: 400, damping: 17 }` | OverflowMenu item (Light/Dark) whileTap |
| `PageHeader.tsx` | 326 | `{ type: 'spring', stiffness: 400, damping: 17 }` | Nav HUB button whileTap |
| `PageHeader.tsx` | 338 | `{ type: 'spring', stiffness: 400, damping: 17 }` | Nav DESIGN button whileTap |
| `PageHeader.tsx` | 358 | `{ type: 'spring', stiffness: 400, damping: 17 }` | Nav SCENARIOS button whileTap |

### Ephemeral UI Springs (Tooltips, Toasts, Dropdowns)

| File | Line | Config | Context |
|------|------|--------|---------|
| `AnimatedTooltip.tsx` | 36 | `{ type: 'spring', stiffness: 400, damping: 25 }` | Tooltip enter/exit |
| `Toast.tsx` | 53 | `{ type: 'spring', stiffness: 400, damping: 25 }` | Toast item enter/exit |
| `PageHeader.tsx` | 73 | `{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }` | ThemeDropdown panel open/close |
| `PageHeader.tsx` | 167 | `{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }` | OverflowMenu panel open/close |

### Layout & Tab Indicator Springs

| File | Line | Config | Context |
|------|------|--------|---------|
| `DesignWorkspaceTabs.tsx` | 69 | `{ type: 'spring', stiffness: 400, damping: 30 }` | layoutId tab indicator slide |
| `EconomicsResultsTabs.tsx` | 66 | `{ type: 'spring', stiffness: 400, damping: 30 }` | layoutId tab indicator slide |

### Entrance / Scroll-Reveal Springs

| File | Line | Config | Context |
|------|------|--------|---------|
| `SectionCard.tsx` | 42-45 | `{ type: 'spring', stiffness: 200, damping: 25, delay: staggerIndex * 0.06 }` | Panel scroll-in with stagger |
| `ViewTransition.tsx` | 24 | `{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }` | Page-level view crossfade |
| `GroupComparisonStrip.tsx` | 77 | `{ type: 'spring', stiffness: 300, damping: 25 }` | Ranking item enter/exit |
| `GroupComparisonStrip.tsx` | 127 | `{ type: 'spring', stiffness: 200, damping: 25 }` | NPV bar width animation |
| `Skeleton.tsx` | 136 | `{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay }` | FadeIn wrapper (duration-based) |

### Data Animation Springs

| File | Line | Config | Context |
|------|------|--------|---------|
| `KpiGrid.tsx` | 25-28 | `{ type: 'spring', stiffness: 80, damping: 20, mass: 0.8 }` | AnimatedValue numeric interpolation |
| `ReadinessChecklist.tsx` | 25 | `{ type: 'spring', stiffness: 100, damping: 20 }` | Progress bar width |

### Other Timed Animations

| File | Line | Config | Context |
|------|------|--------|---------|
| `KpiGrid.tsx` | 112 | `{ duration: 1.2, ease: 'easeOut' }` | Sparkline stroke draw-on |
| `KpiGrid.tsx` | 119 | `{ duration: 0.8, delay: 0.6 }` | Sparkline fill fade-in |
| `WorkflowStepper.tsx` | 78-80 | `{ duration: 0.4, ease: 'easeInOut' }` | Active step pulse (keyframe) |
| `WorkflowStepper.tsx` | 81 | `{ duration: 0.2 }` | Inactive step settle |
| `Skeleton.tsx` | 37 | `{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }` | Text skeleton shimmer |
| `Skeleton.tsx` | 51 | `{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }` | Base skeleton shimmer |
| `Skeleton.tsx` | 99 | `{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: i * 0.05 }` | Chart skeleton bar shimmer |
| `FilterChips.tsx` | 28 | `{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }` | Chip enter/exit |
| `EconomicsDriversPanel.tsx` | 206 | `{ type: 'spring', stiffness: 300, damping: 30 }` | Driver detail expand/collapse |

---

## 2. CSS Transition Definitions

### Tailwind `transition-*` Classes in Use

| Pattern | Approximate Count | Typical Context |
|---------|-------------------|-----------------|
| `transition-colors` | ~80+ occurrences | Buttons, links, hover color changes |
| `transition-all` | ~15 occurrences | Buttons with multiple property changes |
| `transition-transform` | ~5 occurrences | Scale effects on hover |
| `transition-opacity` | ~3 occurrences | MobileDrawer, fade states |
| `theme-transition` | ~60+ occurrences | Custom class for theme switch transitions |

### Custom CSS `@keyframes`

| Name | File | Line | Duration | Purpose |
|------|------|------|----------|---------|
| `swGridPulse` | `theme.css` | 2173 | - | Synthwave grid perspective pulse |
| `swTwinkleFast` | `theme.css` | 2187 | - | Star twinkle (fast) |
| `swTwinkleMed` | `theme.css` | 2191 | - | Star twinkle (medium) |
| `swTwinkleSlow` | `theme.css` | 2196 | - | Star twinkle (slow) |
| `swSunBreathe` | `theme.css` | 2215 | - | Sun glow pulsation |
| `swShootingStar` | `theme.css` | 2230 | - | Shooting star across sky |
| `swEdgeGlow` | `theme.css` | 2256 | - | Mountain edge glow |
| `swContourShimmer` | `theme.css` | 2266 | - | Mountain contour shimmer |
| `swScanLine` | `theme.css` | 2276 | - | CRT scan line sweep |
| `swSpin` | `theme.css` | 2293 | - | Sun ray rotation |
| `swRayPulse` | `theme.css` | 2299 | - | Sun ray opacity pulse |
| `swSunRingPulse` | `theme.css` | 2328 | - | Sun ring scale pulse |
| `swBeamSweep` | `theme.css` | 2339 | - | Foreground beam sweep |
| `shimmer` | `theme.css` | 2439 | 0.8s ease-in-out infinite | Recalculating KPI shimmer |
| `spin` | `App.tsx` | 14 | - | Loading spinner |

### Explicit CSS `transition` Properties

| File | Line | Property | Context |
|------|------|----------|---------|
| `MobileDrawer.tsx` | 36 | `transition-opacity duration-300` | Backdrop fade |
| `MobileDrawer.tsx` | 49 | `transition-transform duration-300 ease-in-out` | Drawer slide |
| `OnboardingTour.tsx` | 79 | `transition-all duration-300` | Tour highlight ring position |

---

## 3. AnimatePresence Usage Catalog

| File | Line | Mode | Purpose | Notes |
|------|------|------|---------|-------|
| `ViewTransition.tsx` | 18 | `mode="wait"` | Page-level view swap | Exit completes before enter starts |
| `Toast.tsx` | 87 | `mode="popLayout"` | Toast stack | Items reflow on add/remove |
| `AnimatedTooltip.tsx` | 29 | (default) | Tooltip show/hide | No mode -- allows overlap |
| `FilterChips.tsx` | 20 | `mode="popLayout"` | Chip add/remove | Layout reflow on filter change |
| `GroupComparisonStrip.tsx` | 63 | `mode="popLayout"` | Ranking reorder | Handles rank position changes |
| `PageHeader.tsx` | 67 | (default) | ThemeDropdown open/close | No mode |
| `PageHeader.tsx` | 161 | (default) | OverflowMenu open/close | No mode |
| `EconomicsDriversPanel.tsx` | 200 | `initial={false}` | Driver detail expand | Suppresses mount animation |

### Components That Should Use AnimatePresence But Don't

| File | Line | Surface | Current Behavior |
|------|------|---------|-----------------|
| `KeyboardShortcutsHelp.tsx` | 22 | Modal dialog | Binary mount/unmount, no animation |
| `ProjectSharePanel.tsx` | 46 | Modal dialog | Binary mount/unmount, no animation |
| `AiAssistant.tsx` | 157-173 | FAB + chat panel | CSS transition only on FAB; panel has no animation |
| `OnboardingTour.tsx` | 74 | Tour overlay | Binary mount/unmount for entire overlay |
| `MobileDrawer.tsx` | 34 | Slide drawer | CSS transition, not motion/react |

---

## 4. Reduced-Motion Accessibility Audit

### What's Covered

**CSS animations (synthwave theme only):**
`theme.css:2367-2383` -- A `@media (prefers-reduced-motion: reduce)` block sets `animation: none !important` on all synthwave-specific CSS animation classes. This covers:
- Grid pulse
- Star twinkle (all speeds)
- Sun breathe
- Shooting star
- Mountain edge/contour effects
- Sun rays / ring pulse
- Foreground beams

**Canvas backgrounds (MarioOverworldBackground only):**
`MarioOverworldBackground.tsx:173` -- Checks `window.matchMedia('(prefers-reduced-motion: reduce)')`.

### What's NOT Covered

**All motion/react spring animations are unguarded.** None of the following respect `prefers-reduced-motion`:

- AnimatedButton whileHover/whileTap (`AnimatedButton.tsx:33-34`)
- ViewTransition page slides (`ViewTransition.tsx:19-28`)
- SectionCard scroll-in reveals (`SectionCard.tsx:37-46`)
- Toast enter/exit (`Toast.tsx:48-53`)
- AnimatedTooltip (`AnimatedTooltip.tsx:31-36`)
- KpiGrid AnimatedValue number interpolation (`KpiGrid.tsx:24-29`)
- CashFlowSparkline draw-on (`KpiGrid.tsx:102-122`)
- GroupComparisonStrip reorder (`GroupComparisonStrip.tsx:71-77`)
- DesignWorkspaceTabs layoutId indicator (`DesignWorkspaceTabs.tsx:63-69`)
- EconomicsResultsTabs layoutId indicator (`EconomicsResultsTabs.tsx:60-66`)
- WorkflowStepper active pulse (`WorkflowStepper.tsx:69-85`)
- ReadinessChecklist progress bar (`ReadinessChecklist.tsx:21-26`)
- Skeleton shimmer loops (`Skeleton.tsx:30-53`)
- FilterChips add/remove (`FilterChips.tsx:22-28`)
- EconomicsDriversPanel expand (`EconomicsDriversPanel.tsx:202-206`)
- All PageHeader dropdown/menu animations

**Global `animate-pulse`, `animate-spin`, `animate-shimmer`** used in:
- `DesignWellsView.tsx:378`
- `OperationsConsole.tsx:121`
- `EngineComparisonPanel.tsx:130,148`
- `WaterfallChart.tsx:177`
- `KpiGrid.tsx:235`

These Tailwind utilities have built-in reduced-motion support via Tailwind's `motion-reduce:` variant, but **only if the Tailwind config includes the `motion-reduce` variant**. This should be verified.

**Canvas-based backgrounds (Tropical, Moonlight, Hyperborea, Synthwave SVG) are unverified** -- only MarioOverworld checks the media query.

### Severity

**High.** WCAG 2.1 SC 2.3.3 (AAA) and SC 2.3.1 (A) require that motion can be disabled. The motion/react springs are purely decorative in most cases and should be suppressible. The `motion/react` library supports a `MotionConfig` provider with `reducedMotion="user"` that would handle this globally.

---

## 5. Hover / Focus States Catalog

### motion.* Hover States (Spring-Driven)

| File | Line | Element | Effect |
|------|------|---------|--------|
| `AnimatedButton.tsx` | 34 | All AnimatedButtons | `whileHover={{ scale: 1.02 }}` |

### motion.* Tap States (Spring-Driven)

| File | Line | Element | Effect |
|------|------|---------|--------|
| `AnimatedButton.tsx` | 33 | All AnimatedButtons | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 54 | ThemeDropdown trigger | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 83 | ThemeDropdown items | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 149 | OverflowMenu trigger | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 182 | OverflowMenu: Share | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 200 | OverflowMenu: Tour | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 218 | OverflowMenu: Light/Dark | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 325 | Nav: HUB | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 337 | Nav: DESIGN | `whileTap={{ scale: 0.97 }}` |
| `PageHeader.tsx` | 357 | Nav: SCENARIOS | `whileTap={{ scale: 0.97 }}` |

### CSS Hover States (Color / Background)

| Pattern | Files Using It |
|---------|----------------|
| `hover:bg-theme-surface2/50` | AnimatedButton (ghost), misc panels |
| `hover:bg-theme-surface2` | PageHeader menus, OverflowMenu items |
| `hover:bg-theme-cyan/30` | AnimatedButton (primary) |
| `hover:text-theme-text` | Muted text elements across ~30 components |
| `hover:text-theme-magenta` | ProjectSharePanel remove button |
| `hover:border-theme-cyan` | PageHeader ThemeDropdown trigger |
| `hover:bg-black/10` to `hover:bg-black/35` | Classic theme variants across components |
| `hover:scale-[1.02]` | HubPage CTA button |
| `hover:scale-105` | AiAssistant FAB (`AiAssistant.tsx:161`) |
| `hover:brightness-105` | HubPage buttons |
| `hover:shadow-glow-cyan` | Various CTA buttons |
| `hover:bg-theme-surface2/60` | AiAssistant example commands |
| `hover:bg-black/65` | MobileDrawer backdrop |

### CSS Focus States

| Pattern | Files Using It |
|---------|----------------|
| `focus:border-theme-cyan` | All text inputs, selects (~20 instances) |
| `focus:border-theme-magenta` | ScenarioDashboard sensitivity selects |
| `focus:ring-1 focus:ring-theme-cyan/30` | EconomicsGroupBar inputs, InlineEditableValue |
| `focus:ring-red-500/30` | InlineEditableValue error state |
| `outline-none` | Universally applied to inputs (correct for custom focus rings) |

### Missing Focus States

| File | Element | Issue |
|------|---------|-------|
| `AnimatedButton.tsx` | All button variants | No `whileFocus` or `focus:` ring defined |
| `PageHeader.tsx` | All nav/menu buttons | `whileTap` but no focus ring |
| `Toast.tsx` | Dismiss button | No focus indication |
| `OnboardingTour.tsx` | Next/Skip buttons | No focus ring |
| `GroupComparisonStrip.tsx` | Ranking buttons | No focus ring; keyboard users can't see which group is focused |
| `DesignWorkspaceTabs.tsx` | Tab buttons | No focus ring despite being keyboard-navigable (Cmd+1/2) |

---

## 6. Layout Animation Inventory

### layoutId Animations

| File | Line | layoutId String | Scope |
|------|------|-----------------|-------|
| `DesignWorkspaceTabs.tsx` | 64 | `"designWorkspaceActiveTab"` | Tab indicator slides between WELLS/ECONOMICS |
| `EconomicsResultsTabs.tsx` | 61 | `"economicsResultsActiveTab"` | Tab indicator slides between results tabs |

### layout Prop Usage

| File | Line | Element | Purpose |
|------|------|---------|---------|
| `Toast.tsx` | 49 | `<motion.div layout>` | Toast stack reflow on add/remove |
| `FilterChips.tsx` | 24 | `<motion.span layout>` | Chip reflow on filter change |
| `GroupComparisonStrip.tsx` | 73 | `<motion.button layout>` | Ranking reorder |

---

## 7. useInView / Scroll-Triggered Animations

| File | Line | Config | Purpose |
|------|------|--------|---------|
| `SectionCard.tsx` | 34 | `useInView(ref, { once: true, margin: '-50px' })` | Panel entrance on scroll |

Only one component uses scroll-triggered animation. The `-50px` margin means the element must be 50px into the viewport before triggering, preventing premature reveals at the viewport edge.

---

## 8. Animated Canvas / SVG Backgrounds

| File | Type | Reduced Motion |
|------|------|----------------|
| `SynthwaveBackground.tsx` | Inline SVG + CSS animations | Yes (via theme.css media query) |
| `TropicalBackground.tsx` | Canvas API | No |
| `MoonlightBackground.tsx` | Canvas API | No |
| `HyperboreaBackground.tsx` | Canvas API | No |
| `MarioOverworldBackground.tsx` | Canvas API | Yes (matchMedia check) |
