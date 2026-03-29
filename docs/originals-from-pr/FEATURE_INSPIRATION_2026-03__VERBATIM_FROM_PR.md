# Slopcast Feature Inspiration & UI/UX Review

*Based on the current state of `codex/ui-improvements-drivers-focus-outbound` — March 27, 2026*

---

## Part 1: Feature Inspiration

### Where You Are Now

You've got a solid foundation: 7 themes with atmospheric backgrounds, a working economics engine with taxes/debt/reserves, an interactive D3/Mapbox map with lasso/heatmap tools, an AI assistant (local parsing), onboarding tour, keyboard shortcuts, inline editing, and a hub page teasing 3 future modules. The core build-analyze-compare loop works. What follows are the directions that could take this from "impressive demo" to "thing people can't stop showing off."

---

### 1. The Cinematic Deal Briefing Room

**The vision:** When a user finishes building a deal, they can enter a **Deal Briefing** mode — a full-screen, presentation-grade view designed for boardroom screens and investor meetings. Think of it as the "keynote mode" for oil & gas economics.

- A **hero card** with the deal name, operator, basin, and headline NPV in massive typography
- Animated **waterfall chart** that builds itself segment by segment (price impact, CAPEX impact, production uplift) — the driver shock data already exists, this is pure visualization
- A **map flyover** that zooms into the well pad cluster with satellite imagery
- KPI tiles that count up from zero on entry (like a sports broadcast scoreboard)
- Theme-aware — Synthwave briefing looks completely different from Slate briefing
- One-click **PDF export** that captures the briefing as a formatted report with cover page, map, charts, and metrics

This is the feature that makes someone pull out their phone and take a video of their screen. The data is all there; this is about presentation craft.

---

### 2. Monte Carlo Mode

**The vision:** A toggle that switches the economics engine from deterministic to probabilistic. Instead of one NPV, you get a distribution.

- User defines **uncertainty ranges** on key inputs: qi (type curve initial rate), oil price, CAPEX total, decline rate — simple sliders with min/max/distribution shape
- Run N iterations (1000 default) and render a **histogram or CDF** of NPV outcomes
- Show **P10 / P50 / P90** bands on the production forecast chart (fan chart)
- A **tornado diagram** ranking which inputs contribute most to outcome variance
- The sensitivity matrix you already have is the spiritual precursor to this — Monte Carlo is the grown-up version
- Could be its own tab alongside SUMMARY / CHARTS / DRIVERS / RESERVES

This is the kind of feature that makes reservoir engineers take the product seriously. It transforms Slopcast from "economics calculator" to "decision support tool."

---

### 3. A Real Theme: Midnight Petroleum

You have 7 themes and they're differentiated, but there's room for one that leans hard into the **oil & gas identity** rather than being genre-themed (synthwave, tropical, etc.).

- **Color palette:** Deep navy (#0a0e1a) with crude oil amber (#c5943a) as the accent, white gas flare highlights, brushed steel surfaces
- **Typography:** Something industrial and confident — Barlow Condensed for headings, IBM Plex Mono for data
- **Personality:** The feel of a midnight operations center monitoring a drilling program. Subtle animated radar sweep in the background. Panel borders that look like machined metal
- **Map style:** Dark satellite with amber well dots that pulse subtly, like signals on a radar screen
- **Charts:** Amber/gold oil curve, cool blue gas, white cash flow — the palette of actual commodity trading screens
- This theme says "I take my job seriously and my tools seriously"

Alternatively (or additionally): a **Blueprint** theme — technical drawing aesthetics, graph paper background, hand-drafted line weights, monospaced everything. Engineers would love it.

---

### 4. Hub Module: HedgeLab (Playable Prototype)

The Hub page teases Flowline, HedgeLab, and CapexForge. HedgeLab is the most self-contained and visually interesting to prototype:

- **Forward curve visualizer** — an interactive price deck chart where users can drag control points to shape their price outlook (WTI strip, Henry Hub)
- **Hedge strategy builder** — add collars (floor + ceiling), swaps (fixed price), or puts to the curve, and see the hedged band overlay on the price chart in real time
- **Hedged vs. unhedged cash flow** — pull the Slopcast deal's unlevered cash flow and show what it looks like with the hedge overlay applied
- **P&L heatmap** — a grid showing mark-to-market across price x time scenarios
- Even as a mock/demo with fake data, this is visually stunning and signals that the platform has depth beyond well economics

---

### 5. The Command Palette (cmdk)

**The vision:** `Cmd+K` opens a spotlight-style command palette that makes the entire app keyboard-navigable.

- **Navigation:** "Go to Wells", "Go to Economics", "Switch to Analysis mode", "Open Hub"
- **Actions:** "Create new group", "Run economics", "Export CSV", "Save snapshot", "Toggle theme"
- **Search:** "Find wells by operator: Devon", "Show Wolfcamp wells", "Jump to group: Core Acreage"
- **Scenario shortcuts:** "Compare scenarios", "Create scenario from current", "Apply 10% CAPEX stress"
- **AI shortcut:** "Ask AI: what if oil drops to $55?" routes to the AI assistant
- The keyboard shortcuts hook already exists — this becomes the visual layer on top of it
- Fuzzy matching, recent actions, categorized results — the standard cmdk UX everyone loves

This is a relatively scoped build that makes the app feel 10x more professional. Power users will immediately feel at home.

---

### 6. Scenario Comparison Theater

The Analysis mode / ScenarioDashboard exists but could become a much more dramatic experience:

- **Side-by-side scenario cards** that you can drag to reorder, with a glowing highlight on the "winner" by each metric
- A **diff view** between any two scenarios: what changed in assumptions, and what that did to every metric. Red/green delta badges everywhere
- **Scenario timeline** — a horizontal strip showing the history of scenarios you've created, like git commits. Click any point to restore that state
- **Spider/radar chart** comparing 3-5 scenarios across NPV, IRR, EUR, Payout, Risk Score simultaneously
- A **"What beats this?"** mode that auto-generates scenarios by varying one input at a time until it finds parameter combinations that improve NPV by 10%+ — basically an optimizer

---

### 7. Map as a First-Class Experience

The map already has lasso, heatmap, grid, and formation filter. To make it the centerpiece:

- **3D terrain** with Mapbox GL — subtle elevation makes the basin feel real, especially for users who know the geography
- **Lateral stick visualization** — draw the actual horizontal well paths (even if synthetic/estimated from surface + BHL). This is the single most-requested visualization in A&D tools
- **Color wells by any metric** — EUR, NPV, operator, formation, status. A dropdown to switch the color encoding turns the map into an instant insight tool
- **Cluster and declutter** — at basin zoom, aggregate wells into clusters with count badges; at pad zoom, show individual wells with labels
- **Draw-a-DSU tool** — user draws a section boundary and the app auto-generates theoretical well sticks based on spacing assumptions. This connects to spec 05 but could start as a visual prototype
- **Split view** — map on left, economics on right, both reactive. Select wells on the map, see economics update live

---

### 8. AI Deal Memo Generator

The AI assistant currently does local keyword parsing. The big upgrade:

- User clicks "Generate Deal Memo" after building a deal
- The app assembles context: group wells, type curve, CAPEX, pricing, NPV/IRR/EUR, scenario comparisons, driver sensitivities
- Sends to Gemini/GPT with a structured prompt to generate a **1-page investment memo**: Executive Summary, Subsurface Risk Assessment, Economics Overview, Comparable Transactions, Recommendation
- Renders it in a beautiful **memo view** inside the app — not a raw text dump, but a typeset document with the active theme's typography
- One-click **copy to clipboard** or **export as PDF**
- Stretch: let users highlight any metric in the app and say "Explain this" to get AI-generated context

---

### 9. Living Dashboard / Portfolio View

Right now each deal is analyzed in isolation. A portfolio view would show:

- **All deals on one screen** — a card grid or ranked list with sparkline NPVs, status badges, and owner avatars
- **Portfolio-level aggregates** — total NPV, weighted IRR, aggregate production forecast, total CAPEX commitment
- **Deal scoring** — a composite score (NPV/CAPEX ratio, IRR vs hurdle, EUR per lateral foot) that ranks deals automatically
- **Drag deals into a "committed" bucket** vs "evaluating" — capital allocation visualization showing how much budget is deployed vs available
- This transforms Slopcast from "analyze one deal" to "manage a portfolio" — a massive strategic upgrade

---

### 10. Immersive Onboarding & Empty States

The onboarding tour exists but is tooltip-based. A more cinematic approach:

- **Animated welcome sequence** on first visit — the theme background animates in, the app name types itself out, then panels slide into place one by one. 3 seconds of theater that sets the mood
- **Empty state illustrations** per theme — when there are no wells selected, no groups created, or no economics run yet, show a theme-aware illustration with a clear CTA. Not a blank void, but a designed invitation
- **Interactive tutorial deal** — instead of tooltips, drop the user into a pre-built "Tutorial Basin" with 10 wells, walk them through selecting, grouping, running economics, and comparing scenarios with inline prompts. They learn by doing
- **Progress rings** on the landing page showing completion: "3 of 5 groups have economics configured" — gamification lite

---

### Quick Wins That Feel Big

If you want something you can finish over lunch and feel great about:

- **KPI sparklines** — tiny inline charts next to NPV/IRR/EUR showing how the value changed over your last N snapshots. The data is there, it's purely a viz addition
- **Animated number transitions** — when economics recalculate, KPI values should count up/down to their new value instead of snapping. Spring physics. Makes the whole app feel alive
- **Theme preview on hover** — in the theme picker, hovering a theme shows a live preview before committing. Reduces friction and shows off the theme system
- **Sound design** — subtle audio feedback on key actions (economics complete chime, snapshot saved click, theme switch whoosh). Optional, toggle in settings. Weird? Yes. Memorable? Absolutely

---

### Top 3 If You Only Pick Three

1. **Cinematic Deal Briefing Room** — highest visual impact, data already exists, pure frontend craft
2. **Command Palette** — fastest to build, biggest daily-use UX improvement, makes everything else more accessible
3. **Monte Carlo Mode** — biggest credibility upgrade with technical users, transforms the product category

---
---

## Part 2: UI/UX Audit

*Structured per the Impeccable `/audit` framework — diagnostics across accessibility, performance, theming, responsiveness, and anti-patterns.*

---

### Anti-Patterns Verdict

**Partial pass.** Slopcast avoids the most egregious AI slop patterns — it has genuine creative direction, per-theme structural variation, and a clear brand identity. But there are fingerprints worth calling out:

- **Cyan-on-dark as the dominant accent.** The non-classic themes all lean on `--cyan` as the primary highlight. Cyan on dark is the #1 AI-generated-UI tell. The theme system differentiates structurally (panel style, border radius, fonts), but the accent color story is too uniform across themes. Synthwave gets away with it; Slate and Stormwatch do not.
- **Glass panels everywhere.** `bg-theme-surface1/50`, `backdrop-blur-sm`, `shadow-card` — the app leans hard on glassmorphism as a default. When `panelStyle` is `glass` (Slate, Synthwave), this is intentional. But even `outline` and `solid` themes render with translucent surfaces (`bg-theme-surface1/60`, `bg-theme-surface1/20`), diluting the structural differentiation those modes are supposed to provide.
- **Hero metric layout.** The KPI grid uses the exact template the frontend-design skill warns about: big number, small label, supporting stats, gradient accent (the blur orb in the top-right corner). The sparkline and payout ring break the pattern somewhat, but the hero NPV card reads as "AI dashboard."
- **Identical card grids.** The Portfolio Summary on the landing page is a 2x2 grid of identically-sized tiles with "label + big number" — textbook AI grid layout.

**What saves it:** The `isClassic` fork (Mario theme) has genuinely distinct personality. The atmospheric backgrounds are creative and varied. The theme system's `ThemeFeatures` concept (headingFont, panelStyle, denseSpacing, retroGrid) is architecturally sound — the problem is execution doesn't always honor those differences in the component layer.

---

### Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 5 |
| Medium | 8 |
| Low | 6 |

**Top 5 issues:**
1. Missing ARIA roles and labels on most interactive elements (sidebar nav, group tree, tab controls, map tools)
2. `max-h` + `opacity` used for expand/collapse animation — animates layout properties, causes jank
3. `isClassic` ternary branching in every component creates exponential maintenance burden and inconsistency
4. Mobile experience hides critical functionality rather than adapting it
5. Empty states are functional but not designed — they don't guide or teach

---

### Critical Issues

#### CRIT-01: Map tools have no keyboard access or ARIA labels
- **Location:** `MapVisualizer.tsx` — lasso, rectangle, formation select, heatmap toggle
- **Category:** Accessibility
- **Description:** Map interaction tools (lasso, rectangle select, grid toggle, heatmap toggle) are clickable elements without `role="button"`, `aria-label`, or keyboard event handlers. Screen readers cannot discover or operate them.
- **Impact:** Entire well-selection workflow is inaccessible to keyboard-only and screen reader users.
- **WCAG:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A)
- **Recommendation:** Add `role="toolbar"` on the tools container, `role="button"` + `aria-label` + `aria-pressed` on each tool, and `onKeyDown` handlers for Enter/Space.
- **Suggested command:** `/harden`

#### CRIT-02: Tab controls lack ARIA tab pattern
- **Location:** `EconomicsResultsTabs.tsx`, mobile panel toggles in `DesignEconomicsView.tsx`, `DesignWellsView.tsx`
- **Category:** Accessibility
- **Description:** Tab-like navigation (SUMMARY / CHARTS / DRIVERS / RESERVES, SETUP / RESULTS, GROUPS / MAP) uses plain `<button>` elements without `role="tablist"`, `role="tab"`, `aria-selected`, or `role="tabpanel"` on the content areas. Arrow key navigation is not implemented.
- **Impact:** Screen readers announce these as generic buttons. Users can't understand the tab metaphor or navigate between tabs with arrow keys.
- **WCAG:** 4.1.2 Name, Role, Value (A)
- **Recommendation:** Implement the WAI-ARIA Tabs pattern with proper roles and keyboard interaction.
- **Suggested command:** `/harden`

---

### High-Severity Issues

#### HIGH-01: Expand/collapse animates `max-height` and `opacity`
- **Location:** `DesignEconomicsView.tsx` (Advanced Configuration), `SlopcastPage.tsx` (Forecast Grid, Engine Comparison)
- **Category:** Performance
- **Description:** Collapsible sections use `max-h-[2000px]` / `max-h-0` with `opacity` transitions. Animating `max-height` triggers layout recalculation on every frame. The `max-h-[2000px]` value causes the transition duration to be unpredictable (CSS transitions traverse the full 0–2000px range even if actual content is 200px).
- **Impact:** Janky expand/collapse on lower-end devices. Unpredictable animation timing.
- **Recommendation:** Use `grid-template-rows: 0fr` → `1fr` for height animation (transforms to GPU-composited), or use `details`/`summary` with CSS transition.
- **Suggested command:** `/animate`

#### HIGH-02: Mobile experience amputates rather than adapts
- **Location:** `DesignEconomicsView.tsx` (line 291-293), `DesignWellsView.tsx`
- **Category:** Responsive
- **Description:** On mobile, the economics view hides either SETUP or RESULTS entirely with `hidden lg:block`. The wells view hides either GROUPS or MAP. Users must toggle between them — they can never see context and results simultaneously. The mobile sticky action bar at the bottom uses `fixed` positioning that could overlap content.
- **Impact:** Users lose context when switching between setup and results. The "View Results →" / "← Edit Setup" flow is disorienting because the entire panel swaps.
- **Recommendation:** Consider a stacked layout on mobile (abbreviated setup summary that stays visible above scrollable results), or a slide-over panel that overlays rather than replaces. At minimum, show a collapsed summary of the hidden panel.
- **Suggested command:** `/adapt`

#### HIGH-03: No focus management on view transitions
- **Location:** `ViewTransition.tsx`, all tab/panel switches
- **Category:** Accessibility
- **Description:** When switching between tabs (SUMMARY → CHARTS → DRIVERS) or views (WELLS → ECONOMICS), focus is not programmatically moved to the new content area. The `ViewTransition` component handles the animation but not focus.
- **Impact:** Keyboard users are left focused on the tab button while new content renders below. Screen reader users get no announcement that content has changed.
- **WCAG:** 2.4.3 Focus Order (A)
- **Recommendation:** After transition completes, move focus to the new content panel or a heading within it. Add `aria-live="polite"` region for content change announcements.
- **Suggested command:** `/harden`

#### HIGH-04: `isClassic` ternary branching throughout every component
- **Location:** Systemic — `DesignEconomicsView`, `DesignWellsView`, `KpiGrid`, `LandingPage`, `Sidebar`, every component
- **Category:** Theming
- **Description:** Virtually every className and style decision branches on `isClassic` with ternary expressions (e.g., `isClassic ? 'sc-panel' : 'rounded-panel bg-theme-surface1/60 ...'`). This means:
  - Every new component must replicate the pattern
  - The classic theme gets a completely separate visual implementation
  - Bugs in one branch may not appear in the other
  - The non-classic path bundles ALL theme concerns into single-branch expressions, even though themes like Synthwave and Slate should look quite different from each other
- **Impact:** Maintenance cost is doubled. Theme differentiation beyond Mario is limited because all 6 non-classic themes share identical component markup.
- **Recommendation:** Extract the `isClassic` fork into the CSS layer (e.g., `[data-theme='mario']` selectors) and let components render theme-agnostic markup that consumes CSS custom properties. This is the direction `ThemeFeatures` already points toward — the component layer just hasn't caught up.
- **Suggested command:** `/normalize`, `/extract`

#### HIGH-05: Touch targets below 44px throughout
- **Location:** Filter chips, tab buttons, advanced config sub-tabs, sidebar nav items (when collapsed)
- **Category:** Responsive / Accessibility
- **Description:** Many interactive elements use `py-1.5` or `py-2` with `text-[9px]` or `text-[10px]`, resulting in tap targets well under 44x44px. The collapsed sidebar icons, filter chip "×" dismiss buttons, and advanced config sub-tabs are the worst offenders.
- **Impact:** Mobile users will mis-tap frequently. Accessibility guidelines (WCAG 2.5.8 Target Size, AAA) recommend 44px minimum.
- **Recommendation:** Add `min-h-[44px] min-w-[44px]` to all interactive elements, or increase padding. Use `@media (pointer: coarse)` to scale up touch targets on touch devices without affecting desktop density.
- **Suggested command:** `/adapt`

---

### Medium-Severity Issues

#### MED-01: Landing page search is a simulated stub
- **Location:** `LandingPage.tsx` line 98-99 — `setTimeout(() => setIsSearching(false), 600)`
- **Category:** UX / Discoverability
- **Description:** The acreage search bar appears fully functional but uses a hardcoded 600ms `setTimeout` to simulate loading, then does a local keyword parse against a fixed list of operators/basins. The "Showing results for:" message appears but results don't actually filter deals.
- **Impact:** Users will try the search, get no meaningful results, and lose trust in the feature. A non-functional search bar that looks functional is worse than no search bar.
- **Recommendation:** Either wire it up to actually filter the deals table (the `ParsedFilters` type is ready), or replace it with an honest empty state: "Search coming soon — for now, browse your saved deals below."
- **Suggested command:** `/clarify`

#### MED-02: Portfolio Summary stats on landing page are a stale card grid
- **Location:** `LandingPage.tsx` lines 193-228
- **Category:** Anti-pattern
- **Description:** The Portfolio Summary is a 2x2 grid of identical tiles (Total Deals, Active, Total PV10, Total Wells) — the "identical card grid" anti-pattern called out in the frontend-design skill. Each tile is structurally identical: label + big number.
- **Impact:** Reads as filler content. Doesn't tell a story or guide action. The numbers are useful but the presentation is generic.
- **Recommendation:** Break the grid. Make Total PV10 a hero number (it's the metric that matters most). Show Active as a progress indicator or ratio. Replace the grid with an asymmetric layout — one big number, two supporting stats inline, one call-to-action badge.
- **Suggested command:** `/bolder`, `/distill`

#### MED-03: Onboarding tour tooltip positioning is fragile
- **Location:** `OnboardingTour.tsx` — `getBoundingClientRect` on `data-tour-step` targets
- **Category:** Responsive / UX
- **Description:** Tour step positioning uses `getBoundingClientRect` with static offsets. On mobile or when the layout shifts (sidebar collapse, tab switch), the tooltip can appear off-screen or overlapping the target element. No repositioning logic handles viewport edges.
- **Impact:** On mobile, the first step ("Welcome to Slopcast") likely overlaps or clips. Steps targeting elements in hidden panels (like Economics workspace) will fail to position.
- **Recommendation:** Add viewport boundary detection (if tooltip exceeds viewport bounds, flip direction). Skip steps whose target elements are not currently visible. Consider a modal-based onboarding for the first 2 steps before moving to contextual tooltips.
- **Suggested command:** `/onboard`

#### MED-04: AI assistant panel has no dismiss affordance on mobile
- **Location:** `AiAssistant.tsx` — floating panel
- **Category:** Responsive
- **Description:** The AI assistant renders as a floating chat panel. On small screens, it may overlap critical UI content. There's no swipe-to-dismiss or dedicated mobile layout — it's the same floating panel that works on desktop.
- **Impact:** Mobile users opening the AI chat may find it obscures the economics results or map they're trying to ask about.
- **Recommendation:** On mobile, render the AI assistant as a bottom sheet (slide up from bottom, swipe down to dismiss) instead of a floating panel. Limit initial height to 50% of viewport.
- **Suggested command:** `/adapt`

#### MED-05: ProjectSharePanel renders with empty handlers
- **Location:** `SlopcastPage.tsx` line 232-238
- **Description:** The share panel is rendered with `members={[]}`, `onInvite={() => {}}`, `onRemoveMember={() => {}}`, `onUpdateRole={() => {}}`. It's accessible from the UI but does nothing.
- **Impact:** Users who find the share feature will attempt to invite team members and get no feedback. Silent failure erodes trust.
- **Recommendation:** Either gate the share button behind a "coming soon" badge with a waitlist CTA, or wire up the Supabase `project_members` table. Don't ship a functional-looking UI with no-op handlers.
- **Suggested command:** `/clarify`, `/onboard`

#### MED-06: KPI hero card blur orb is decorative noise on non-glass themes
- **Location:** `KpiGrid.tsx` line 252-253
- **Description:** The NPV hero card renders a `blur-[100px]` cyan orb in the top-right corner when `panelStyle !== 'solid'`. This means both `glass` AND `outline` themes get the orb. For `outline` themes (which aim for minimal, drawn-line aesthetics), a giant blurred circle undercuts the design intent.
- **Impact:** Themes that are supposed to feel structurally different end up looking similar because they share decorative effects.
- **Recommendation:** Gate the orb on `panelStyle === 'glass'` only, or better yet, make it a `ThemeFeatures` flag (e.g., `ambientGlow: boolean`).
- **Suggested command:** `/normalize`

#### MED-07: No loading skeletons anywhere
- **Location:** Systemic — all data views
- **Category:** Performance / UX
- **Description:** When economics recalculate (via `useDebouncedRecalc`), the `animate-shimmer` class is applied to KPI values. But there are no skeleton states for the initial load, for chart rendering, for the deals table, or for the map. The `Suspense` fallback in `SlopcastPage` is a spinner.
- **Impact:** Users see content pop in without warning. The shimmer during recalc is good, but the gap is the initial render — users get a flash of empty containers before data paints.
- **Recommendation:** Add skeleton variants for KpiGrid (gray placeholder bars in the same layout), Charts (rectangle placeholder), and the deals table (row placeholders). The shimmer animation already exists — reuse it.
- **Suggested command:** `/polish`, `/delight`

#### MED-08: Color-only status communication in several places
- **Location:** `QuickDrivers` (positive/negative uses only cyan/magenta), `GroupComparisonStrip`, `EconomicsDriversPanel`
- **Category:** Accessibility
- **Description:** Positive vs. negative delta values are communicated solely through color (cyan = positive, magenta = negative). The `+`/`-` sign prefix helps, but the bar charts, border accents, and ring charts rely entirely on color to distinguish meaning.
- **WCAG:** 1.4.1 Use of Color (A)
- **Recommendation:** Add icons (↑/↓ arrows), patterns (striped vs. solid bars), or text labels alongside color. The `+`/`-` sign prefix is a good start — extend the pattern to all visual indicators.
- **Suggested command:** `/harden`

---

### Low-Severity Issues

#### LOW-01: `text-[9px]` and `text-[10px]` used inconsistently
- **Location:** Systemic — labels, section headers, badges
- **Description:** Some labels use `text-[9px]`, others `text-[10px]`, with no clear rule for which gets which. Both are extremely small and below the generally recommended 12px minimum for body text.
- **Recommendation:** Establish a `typo-micro` token at a fixed size (e.g., 10px) and use it consistently. Consider bumping to 11px — the uppercase tracking makes it readable, but just barely.
- **Suggested command:** `/normalize`

#### LOW-02: Redundant `theme-transition` class on nearly every element
- **Location:** Systemic
- **Description:** Many elements apply `theme-transition` alongside other transition classes (`transition-colors`, `transition-all`). If `theme-transition` applies transitions to background/border/color, the additional Tailwind transition utilities may conflict or duplicate.
- **Recommendation:** Audit whether `theme-transition` alone is sufficient or if the Tailwind utilities are needed. Standardize on one approach.
- **Suggested command:** `/optimize`

#### LOW-03: `onMarkDirty={() => {}}` is a no-op
- **Location:** `SlopcastPage.tsx` line 115
- **Description:** The `onMarkDirty` prop is passed as an empty function. This suggests the dirty-tracking system was planned but not connected. Any component calling `onMarkDirty` is silently doing nothing.
- **Recommendation:** Either wire it to the persistence layer or remove the prop from the interface to avoid confusion.
- **Suggested command:** `/distill`

#### LOW-04: Sidebar `SidebarGroupTree` has no empty state
- **Location:** `Sidebar.tsx` → `SidebarGroupTree`
- **Description:** When there are no groups, the sidebar group tree renders nothing — just empty space below the nav. New users won't know what should be there.
- **Recommendation:** Show a subtle "No groups yet — create one in the Wells workspace" hint with a small icon.
- **Suggested command:** `/onboard`

#### LOW-05: `PayoutRing` benchmark is hardcoded to 60 months
- **Location:** `KpiGrid.tsx` line 75
- **Description:** The payout progress ring benchmarks against 60 months. This is a reasonable default for Permian Basin economics but won't make sense for all plays or deal types. There's no way to configure it.
- **Recommendation:** Make benchmark configurable via scenario assumptions or a user preference.
- **Suggested command:** `/clarify`

#### LOW-06: No `prefers-reduced-motion` respect
- **Location:** Systemic — `ViewTransition`, atmospheric backgrounds, theme switch animations
- **Description:** Users who prefer reduced motion (accessibility setting on macOS/Windows) still get all animations — atmospheric backgrounds, view transitions, blur orb hover effects, shimmer recalc animation.
- **WCAG:** 2.3.3 Animation from Interactions (AAA)
- **Recommendation:** Add `@media (prefers-reduced-motion: reduce)` to disable atmospheric backgrounds, reduce `ViewTransition` to instant switch, and remove hover glow effects.
- **Suggested command:** `/harden`

---

### Patterns & Systemic Issues

| Pattern | Occurrences | Impact |
|---------|-------------|--------|
| `isClassic` ternary forking in className | Every component | Doubles maintenance, limits per-theme differentiation for non-classic themes |
| `text-[9px]`/`text-[10px]` without tokens | 30+ locations | Inconsistent micro-typography, below-minimum readability |
| Missing ARIA on custom interactive elements | Tabs, map tools, collapsibles, sidebar tree | Core workflows inaccessible to assistive technology |
| `hidden lg:block` mobile strategy | Wells view, Economics view | Content amputation rather than adaptation |
| No skeleton/loading states | All initial renders | Flash of empty layout before content paints |

---

### Positive Findings

1. **Theme system architecture is excellent.** The `ThemeFeatures` concept (panelStyle, headingFont, denseSpacing, retroGrid, brandFont) is the right abstraction. The problem is downstream — components don't always honor these features. But the bones are there.

2. **Sparkline in the NPV hero card is genuinely useful.** The `CashFlowSparkline` showing cumulative cash flow behind the NPV number is the kind of "data has gravity" visualization the design principles call for. It communicates more than a number alone.

3. **Debounced recalc with visual shimmer is good UX.** The `useDebouncedRecalc` hook plus `animate-shimmer` on KPI values gives users a clear signal that values are updating. This is a pattern worth extending to other areas.

4. **Driver panel with "Jump to Driver" navigation is smart.** Clicking a driver in `EconomicsDriversPanel` scrolls/navigates to the relevant control section. This bidirectional link between insight and action is exactly right for a power-user tool.

5. **The `WaterfallChart` component exists.** This is already a differentiator — most O&G economics tools don't visualize value bridges. It's quietly excellent.

---

### Recommendations by Priority

#### Immediate (this session)
1. Add `role="tablist"` / `role="tab"` / `aria-selected` to `EconomicsResultsTabs` and mobile panel toggles
2. Add `aria-label` to all map tool buttons
3. Gate the blur orb in KpiGrid to `panelStyle === 'glass'` only

#### Short-term (next few sessions)
4. Replace `max-h` expand/collapse with `grid-template-rows` transitions
5. Add `@media (prefers-reduced-motion: reduce)` global rule
6. Add skeleton placeholders for KpiGrid and Charts
7. Either wire the acreage search to filter deals or replace with an honest "coming soon" state
8. Gate ProjectSharePanel behind a "coming soon" badge

#### Medium-term (next milestone)
9. Begin migrating `isClassic` ternary forks into CSS-layer `[data-theme='mario']` overrides
10. Redesign the landing page Portfolio Summary to break the identical-card-grid pattern
11. Implement mobile bottom sheet for AI assistant
12. Add viewport-aware repositioning to the onboarding tour

#### Long-term (strategic)
13. Introduce a second accent color per theme to reduce cyan-on-dark uniformity
14. Add loading skeletons to all data views as a systemic pattern
15. Build a proper ARIA tab pattern component and use it everywhere

---

### Suggested Commands for Fixes

| Command | Addresses |
|---------|-----------|
| `/harden` | CRIT-01, CRIT-02, HIGH-03, HIGH-05, MED-08, LOW-06 — accessibility gaps, ARIA patterns, keyboard nav, reduced motion |
| `/normalize` | HIGH-04, MED-06, LOW-01, LOW-02 — theme consistency, `isClassic` branching, token standardization |
| `/adapt` | HIGH-02, HIGH-05, MED-04 — mobile experience, touch targets, responsive layouts |
| `/animate` | HIGH-01 — expand/collapse animation using GPU-friendly properties |
| `/onboard` | MED-03, MED-05, LOW-04 — tour positioning, empty states, feature gating |
| `/clarify` | MED-01, MED-05, LOW-05 — stub features, misleading UI, configurable defaults |
| `/distill` | MED-02, LOW-03 — remove noise, clean up dead props |
| `/bolder` | MED-02 — redesign Portfolio Summary with asymmetric layout |
| `/polish` | MED-07 — skeleton states, loading refinement |
| `/delight` | MED-07 — shimmer extensions, micro-interactions during data loading |
| `/optimize` | LOW-02 — transition class audit, deduplication |

---
---

## Part 3: Design Critique

*Structured per the Impeccable `/critique` framework — evaluating the interface as a designed experience, not just a technical artifact.*

---

### Anti-Patterns Verdict

**Conditional pass.** If someone said "AI made this," you'd believe it for the non-classic themes but not for Mario (Classic). The atmospheric backgrounds and theme structural variation are genuinely creative. The main tells:

- The NPV hero card + supporting metric tiles are the exact "AI dashboard" layout pattern (big number top, 2x2 grid below)
- Cyan accent everywhere on dark backgrounds
- Glassmorphism as default surface treatment
- All-uppercase micro-labels at 9-10px with extreme letter-spacing — this is a recognizable AI typography pattern that's become a crutch

The classic theme (Mario) actually avoids most of these because it has its own visual system. The irony is that the theme intended as "retro/nostalgic" feels more hand-crafted than the "modern" themes.

---

### Overall Impression

**What works:** The app has *mood*. Walking into the Synthwave theme with the retro grid background, or the Stormwatch theme with its atmospheric depth — there's genuine creative energy here. The economics engine is serious, and the UI treats the numbers with appropriate weight. The sidebar + content area layout works. The `isClassic` Mario theme is delightful and proves the team can design with personality.

**What doesn't:** The non-classic themes blur together more than they should. Despite 6 unique themes (Slate, Synthwave, Tropical, Nocturne, Stormwatch, Hyperborea), the component layer renders them nearly identically — same card shapes, same typography, same accent color, same glass panels. The backgrounds change dramatically but the foreground stays the same. It's like wearing the same outfit in front of different wallpapers.

**The single biggest opportunity:** **Make each theme transform the foreground, not just the background.** If Stormwatch changes the background to stormy atmospherics but the KPI card still looks the same as Slate's KPI card, the theme system is only 30% utilized. Themes should change how data is *presented*, not just what sits behind it.

---

### What's Working

1. **The driver panel's "Jump to Driver" interaction.** Clicking "CAPEX" in the drivers analysis scrolls to the CAPEX controls section. This bidirectional link between insight and action is exactly what a power-user economics tool needs. It says: "we understand your workflow." This pattern should be extended everywhere — clicking any metric should navigate to the input that controls it.

2. **The cumulative cash flow sparkline behind the hero NPV.** This is subtle, smart, and genuinely informative. A single number says "how much." The sparkline says "how it gets there" — when payout happens, the cash flow shape, whether returns are front-loaded. It communicates without demanding attention. More of this.

3. **The atmospheric background system.** The themed backgrounds (Synthwave's retro grid, the ambient orbs on the landing page) create genuine mood that distinguishes Slopcast from every other O&G tool in the market. This is the "impressed & engaged" emotional goal delivered.

---

### Priority Issues

#### 1. All non-classic themes wear the same clothes
- **What:** Despite 6 distinct theme IDs with unique backgrounds, chart palettes, and `ThemeFeatures`, the component markup renders identical foreground UI for all of them. Same `rounded-panel`, same `text-theme-cyan` headings, same `text-[10px] font-black uppercase tracking-[0.24em]` labels.
- **Why it matters:** Users who switch themes expect a real transformation — not just a wallpaper swap. The brand promise is "every theme should feel like a deliberate creative choice, not a skin swap," but the current execution is closer to a skin swap with a really good background layer.
- **Fix:** Choose 2-3 themes and give their components distinct foreground treatments. Examples:
  - **Stormwatch** could use solid, heavy-border panels with no transparency — industrial, weatherproof. Data in monospaced tabular figures. No glow.
  - **Tropical** could use warmer, rounder panels with generous padding. Softer typography. Playful accent on data — maybe an inline emoji or color-coded dot before each KPI.
  - **Hyperborea** could use ultra-minimal outlines, maximum whitespace, and let the numbers breathe. Thin 1px borders, no fills.
- **Command:** `/normalize` to establish per-theme component variants, `/bolder` to push each theme further

#### 2. The landing page doesn't tell a story
- **What:** The landing page is: title → subtitle → search bar → two buttons → deals table + map + stats grid. It's functional but emotionally flat. There's no narrative — no "here's what you did last time, here's what needs attention, here's where the opportunity is."
- **Why it matters:** The landing page is the first thing users see in every session. The emotional goal is "energized & ambitious — deal-making should feel exciting." A static grid of deals and a dormant search bar doesn't generate excitement.
- **Fix:** Lead with a contextual hero:
  - If the user has active deals: "Your top deal, {name}, has an NPV of ${X}MM — up $2MM since last week. 3 groups need economics configured."
  - If the user is new: A dramatic reveal animation + guided path to their first deal
  - Replace the 2x2 stats grid with a single strong statement: "$47.2M in active portfolio value across 12 wells"
  - Make the search bar feel like the powerful thing it should be — placeholder text that rotates through example queries, autocomplete suggestions
- **Command:** `/bolder`, `/onboard`

#### 3. The economics setup column is visually monotonous
- **What:** The left panel in Economics view is a vertical stack of collapsible sections (Type Curve, CAPEX, OPEX, Ownership, Advanced Configuration) that all look identical — same header style, same expand/collapse chevron, same nested content layout. It reads as an endless form.
- **Why it matters:** Users building economics need to quickly scan which sections are configured and which need attention. When every section looks the same, there's no visual hierarchy to guide them. The "readiness blocker" message at the top is helpful, but it's too subtle — a tiny `text-[9px]` label that could easily be missed.
- **Fix:**
  - Add completion indicators to each section header — a small checkmark or progress dot that shows "Type Curve: configured, CAPEX: 9 items, OPEX: needs attention"
  - Make the section that needs attention visually distinct — a slightly different border color, a pulsing dot, anything that breaks the monotony
  - Consider a workflow progress bar at the top of the setup column that fills as sections are completed
  - The readiness blocker should be a prominent banner, not a whisper
- **Command:** `/clarify`, `/delight`

#### 4. Scenario dashboard (Analysis mode) is under-designed relative to the rest
- **What:** The `ScenarioDashboard` is the payoff of the entire workflow — you've built groups, configured economics, now you compare scenarios. But compared to the rich SUMMARY/CHARTS/DRIVERS tabs in the economics view, the scenario comparison feels like an afterthought.
- **Why it matters:** This is where deal decisions happen. "Which scenario gives the best risk-adjusted return?" is the million-dollar question. If this view doesn't feel dramatic and authoritative, the product's climax falls flat.
- **Fix:**
  - Scenario cards should feel like playing cards or trading cards — visual weight, distinct borders, a clear "winner" highlight
  - A spider/radar chart comparing all scenarios at a glance
  - Animated transitions when adding/removing scenarios
  - A "Battle Mode" where two scenarios are placed side-by-side with every metric compared and delta-highlighted
- **Command:** `/bolder`, `/animate`

#### 5. The AI assistant is hiding in the corner
- **What:** The AI assistant is a floating chat panel activated by a button. It's positioned as an overlay — you open it, chat, close it. It feels bolted on rather than woven into the experience.
- **Why it matters:** If the AI can parse "what if oil drops to $55?" and adjust scenario parameters, that's magical. But users have to know it exists, open a separate panel, type in natural language, and trust the result. That's a lot of friction for a feature that could be the product's signature interaction.
- **Fix:**
  - Embed AI suggestions *inline* — when looking at drivers, show an AI-generated insight card: "Oil price is your biggest risk. A $10 drop reduces NPV by $4.2MM."
  - Make the command palette (Cmd+K) the primary AI entry point — type a natural language scenario and see it applied immediately
  - When the user hovers a KPI for more than 2 seconds, offer a tooltip: "Ask AI to explain this metric" or "What would improve this?"
  - The AI should feel like a copilot sitting next to you, not a chatbot in a drawer
- **Command:** `/delight`, `/bolder`

---

### Minor Observations

- **The "Open Blank Workspace" button on the landing page feels like a secondary escape hatch**, but for power users it might be the primary action. Consider letting the user set their preferred landing behavior (go straight to workspace vs. browse deals).
- **The Hub page's "coming soon" modules are static text.** Even a teaser animation or mockup screenshot would build anticipation. Right now they feel like placeholders that were never revisited.
- **The `WellsBadge` on the KPI grid has an "active" pill badge** that doesn't convey much — all displayed wells are active by definition. Replace with something informative: "40 wells in group" or "+5 since last snapshot."
- **The sidebar's collapsed state loses the "Slopcast" brand label**, which is fine, but the collapsed sidebar could show a tiny brand icon/mark instead of just navigation icons.
- **Advanced Configuration's "Financial / Reserves / Group Wells" sub-tabs** are buried inside a collapsible that's inside the setup panel. Two levels of progressive disclosure for core features (tax, debt, reserve category) means many users will never find them.

---

### Questions to Consider

- **What if each theme had a signature KPI visualization?** Instead of the same hero NPV card in every theme, what if Synthwave rendered NPV as a neon sign, Stormwatch as a gauge/dial, and Tropical as a progress bar toward a target? Same data, completely different emotional resonance.

- **What if the economics setup was visual instead of form-based?** Instead of collapsible sections with input fields, what if the type curve was a drag-to-shape interactive chart, the CAPEX was a stacked bar you could click to expand, and OPEX was a timeline you could annotate? The data is numeric, but the entry doesn't have to be.

- **What would it look like if confidence was the design principle?** Right now, many elements hedge — small text, muted colors, hidden behind collapsibles. What if the app was more opinionated? Bigger numbers. Bolder colors. Fewer options visible, stronger defaults. "We've configured the best defaults for Permian Basin economics. Adjust if you know better."

- **What if the map and economics were never separate?** The current flow is: select wells (map) → configure economics (form) → view results (charts). What if all three were visible simultaneously in a triptych layout? Select a well on the map, see its economics update in real-time in the adjacent panel, with the chart responding below.

- **What's the "screenshot moment"?** Every great product has a view that users screenshot and share. For Slopcast, is it the NPV hero card? The waterfall chart? The atmospheric background? Identify it, and make it twice as impressive. Design the feature that people put in their LinkedIn posts.
