# Visual Hierarchy & Information Architecture Critique

## Overall Impression

Slopcast's hierarchy demonstrates sophisticated structural thinking — the workspace is segmented into clear affordances (page-level nav, context-specific group bars, tabbed result panes) and the component library shows discipline with consistent accent tokens. However, the density of controls, the proliferation of nested surfaces (panels within panels within panels), and the lack of clear "one primary action" creates cognitive weight that fights against the brand promise of "war-room energy."

The IA is linear but bifurcated: WELLS → assign wells → ECONOMICS → configure drivers → see results. This works as a flow, but within each tab the structure sprawls — ECONOMICS sidebar has 6+ collapsible sections, and the results pane has 5 tabs. The user must maintain too much state across too many containers.

**Overall severity**: MEDIUM. The bones are good. The execution is verbose.

---

## Eye Flow Analysis

### What the Eye Hits First

**ECONOMICS view (Summary tab)**:
1. **EconomicsGroupBar** (sticky at top) — draws attention first due to sticky positioning + border + tight grouping.
2. **KpiGrid hero NPV** — large cyan number (5xl font), animated sparkline background, hover glow. Strong.
3. Then scatter: Group Comparison + Quick Drivers share equal weight. No hierarchy between them.
4. OperationsConsole at bottom — easily skipped.

**WELLS view**:
1. **Mobile panel toggle** (on mobile) — draws eye first due to button weight.
2. **Map Visualizer** — animated pulse dot in header + full-viewport height = dominates desktop.
3. **Group list** in sidebar — secondary, but competes with map due to vertical scrollability.

**PageHeader**:
1. Logo + brand name (left).
2. Theme dropdown (right).
3. Nav tabs (HUB, DESIGN, SCENARIOS) — middle, but visually secondary due to smaller font + ghost state for inactive.
4. Workspace tabs (WELLS / ECONOMICS) inline after nav tabs — feels appended, not primary.

### Problems

- **No single primary action is obvious**. On ECONOMICS, is the user supposed to adjust drivers (left sidebar), switch scenarios (OperationsConsole at bottom), or just read NPV (center)? All three compete equally.
- **WELLS tab has clearer intention** (map + selection actions) but the selection action panel is buried below the fold on desktop in a separate panel.
- **PageHeader navigation hierarchy is flat**. HUB / DESIGN / SCENARIOS and WELLS / ECONOMICS tabs share the same visual tier. User must parse semantics to understand that workspace tabs are nested under DESIGN mode.
- **Mobile panel toggles feel like a concession, not a feature**. They scream "we couldn't fit this on one screen" rather than "this is how you navigate confidently."

---

## Data Gravity Assessment (NPV/IRR/EUR Prominence)

### What Works

- **KpiGrid hero NPV** (DesignEconomicsView:621-365) is the strongest execution of data gravity in the entire app.
  - 5xl to 7xl font size.
  - Cyan accent color (theme-primary).
  - Animated counter on value change.
  - Optional sparkline background showing cumulative cash flow.
  - Hover glow effect (hero-specific, not reused elsewhere).
  - Positioned first in ECONOMICS > Summary tab.

  **This is the app's North Star metric. It's treated like one.**

- **Stat strip tiles** (CAPEX, EUR, Payout, Wells) below hero NPV:
  - 2xl font, animated counters, accent borders (magenta, cyan, lavender).
  - MetricSparklines for snapshot history (if available).
  - Clear unit labels.
  - Good density — 4 tiles in a row on desktop, 2x2 grid on mobile.

- **EconomicsGroupBar summary row** (lines 391-437):
  - Shows NPV for active group as secondary confirmation.
  - "Compute: Fresh" badge signals recalc status.
  - Positioned sticky at top = always visible during scroll.

### What Doesn't Work

- **IRR is missing from the KPI strip entirely**. EUR, Payout, CAPEX are shown, but ROI (which is IRR-adjacent) is only visible in:
  - Group comparison strip (lines 111 in GroupComparisonStrip).
  - EconomicsGroupBar dropdown menu (line 319 in EconomicsGroupBar).

  **IRR is a top-3 O&G metric. It should be in the hero stat strip, not buried in a dropdown.**

- **NPV variants (after-tax, levered) are shown as inline badges below hero NPV** (lines 347-365 in KpiGrid).
  - They're small (10px font), optional (conditional render), and visually secondary.
  - If tax/debt modeling is a feature, these metrics should have equal weight to pre-tax NPV — not appear as footnotes.

- **Breakeven oil price** is also a footnote (line 344 in KpiGrid, 10px muted text).
  - This is a critical deal-breaker metric. Should be a dedicated tile in the stat strip.

- **Group Comparison strip** (lines 34-137 in GroupComparisonStrip):
  - Shows NPV + ROI for all groups.
  - Visually strong (bars, rank badges, animated layout).
  - But positioned **below** KpiGrid, after an accent divider.
  - **This should be above-the-fold or inline with hero KPI, not paginated below.**

### Recommendation

Restructure the ECONOMICS Summary tab to create a 3-tier hierarchy:

**Tier 1 (above fold, always visible)**:
- Hero NPV (current, full-width).
- Stat strip: NPV10, IRR, EUR, Payout, Breakeven Oil (5 tiles, not 4).
- If after-tax/levered are enabled, show NPV10 (pre-tax) + Levered NPV10 + After-Tax NPV10 as **three separate hero tiles**, not badges.

**Tier 2 (scroll target)**:
- Group Comparison (currently buried below accent divider).
- Quick Drivers (currently side-by-side, feels like filler).

**Tier 3 (execution layer)**:
- OperationsConsole (scenario switching, recalc controls).

---

## Information Architecture

### Current Structure

**Page-level navigation** (PageHeader:311-371):
```
HUB | DESIGN | SCENARIOS
      ↓
    WELLS | ECONOMICS (if DESIGN mode)
```

**WELLS workspace**:
- Sidebar (left):
  - Group list (collapsible per group).
  - Active group wells table (collapsible).
  - Filters panel (operator, formation, status).
- Main (right):
  - Map visualizer (full viewport).
  - Selection actions panel (below map, desktop only).
- Mobile:
  - GROUPS | MAP toggle at top.
  - Sticky action tray at bottom (if MAP mode).

**ECONOMICS workspace**:
- Sidebar (left, 5-col span on lg, 4-col span on xl):
  - Mini map preview (compact, no interactions).
  - Controls (type curve, CAPEX, OPEX, ownership) — 4 collapsible sections.
  - Tax & Fiscal (collapsible).
  - Leverage (collapsible).
  - Reserve Category (collapsible).
  - Advanced Settings (collapsible) → contains GroupWellsTable.
  - Setup Insights (collapsible) → checklist + blocker message.
- Main (right, 7-col span on lg, 8-col span on xl):
  - EconomicsGroupBar (sticky at top).
  - EconomicsResultsTabs (5 tabs: Summary, Charts, Drivers, Cash Flow, Reserves).
  - Tab-specific content (varies by active tab).
  - OperationsConsole (at bottom of most tabs).
- Mobile:
  - SETUP | RESULTS toggle at top.
  - Sticky action strip at bottom ("View Results" or "Edit Setup").

### Problems

1. **Too many collapsible sections in ECONOMICS sidebar**. User must remember which drawer contains which control. The Controls component alone has 4 internal accordions (type curve, CAPEX, OPEX, ownership), nested inside a parent sidebar with 7 other collapsibles. **That's 11 drawers in one sidebar.**

2. **ECONOMICS > Setup Insights panel is auto-collapsed once all checks pass** (lines 233-237 in DesignEconomicsView). This is good progressive disclosure, but it's positioned **last in the sidebar** (after Advanced Settings). If it's a checklist, it should be **first** or **sticky at the top of the sidebar**.

3. **EconomicsResultsTabs has 5 tabs, but only Summary and Charts are visually distinct**. Drivers, Cash Flow, Reserves feel like power-user features, but they're given equal weight in the tab strip. Consider grouping them under an "Advanced" overflow menu.

4. **Mobile panel toggles (SETUP | RESULTS, GROUPS | MAP) feel like emergency exits, not intentional navigation**. They're always visible, even on desktop where they're not needed (via hidden classes). The mobile experience should be a designed flow, not a viewport-resize fallback.

5. **HUB vs DESIGN vs SCENARIOS — semantic confusion**. "DESIGN" suggests layout or visual customization, but it's actually the main workspace (Wells + Economics). "SCENARIOS" is clearly an analysis mode. "HUB" is a launcher. The label "DESIGN" should be "WORKSPACE" or "STUDIO" or just removed (default active).

6. **Group navigation is inconsistent across WELLS and ECONOMICS**:
   - WELLS: Sidebar group list with expand/collapse per group, inline "Activate" buttons.
   - ECONOMICS: Sticky EconomicsGroupBar with dropdown menu, prev/next arrows, inline search + sort.

   Why are these different? They're solving the same problem (choose active group). Pick one pattern and use it everywhere.

### What Works

- **EconomicsGroupBar as a sticky context bar** (lines 154-439 in EconomicsGroupBar) is excellent. Always visible, shows active group, wells count, NPV, compute status, and provides quick group switching. This should be the pattern for WELLS too.

- **FocusMode** (triggered via "Focus" button in EconomicsGroupBar) hides the setup sidebar and expands the results pane to full width. This is smart progressive disclosure — let users hide complexity when they just want to stare at numbers.

- **Mobile-first responsive grid** (grid-cols-1 lg:grid-cols-12) with explicit col-span breakpoints is clean and predictable.

### Recommendations

**IA restructure**:

1. **Flatten page-level nav to 3 modes**:
   - **HUB** (launcher, current).
   - **WORKSPACE** (rename from DESIGN) → defaults to WELLS, inline workspace tabs.
   - **SCENARIOS** (analysis, current).

2. **Consolidate group navigation**:
   - Use **EconomicsGroupBar pattern everywhere** (WELLS + ECONOMICS).
   - Sidebar group list (WELLS) becomes just a metadata/filter panel, not a switcher.

3. **Collapse ECONOMICS sidebar to 3 sections** (not 7):
   - **Drivers** (type curve, CAPEX, OPEX, ownership) — single collapsible with internal tabs or stacked inputs.
   - **Advanced** (tax, leverage, reserve category) — single collapsible.
   - **Setup Insights** (checklist, blocker message) — always visible, pinned at top.

4. **Reduce EconomicsResultsTabs to 3 tabs**:
   - **Summary** (current).
   - **Charts** (current).
   - **Data** (dropdown/overflow menu for Drivers, Cash Flow, Reserves).

5. **Mobile: replace toggle buttons with a slide-in drawer**:
   - On WELLS, map is primary. Sidebar slides in from left on tap.
   - On ECONOMICS, results are primary. Sidebar slides in from left on tap.
   - No toggle — just one FAB button: "Setup" or "Groups" depending on mode.

---

## Navigation & Wayfinding

### Current Wayfinding Cues

- **PageHeader brand + logo** (always visible, top-left).
- **Active workspace tabs** (WELLS | ECONOMICS) — Motion animated underline (layoutId="designWorkspaceActiveTab").
- **Active results tab** (Summary | Charts | ...) — similar Motion layoutId animation.
- **Active group** in EconomicsGroupBar — inline color dot + name + NPV summary row.
- **Breadcrumbs**: None. User cannot see where they are in the workspace hierarchy at a glance.

### Problems

- **No breadcrumb or "you are here" indicator**. When a user is on ECONOMICS > Summary tab, focused on Group A, with Tax panel open and Pricing scenario B active, **there is no compact summary of that state**. They must visually scan 4 separate UI regions (header tabs, group bar, results tabs, operations console) to reconstruct their context.

- **Back navigation is ambiguous**. Clicking "HUB" button (line 312-320 in PageHeader) navigates to /hub. But what if user wants to go back to WELLS from ECONOMICS? They must remember to click the workspace tab. **There's no implicit "back" in the flow — only lateral tab switching.**

- **Mobile sticky action strip** (bottom of screen in DesignEconomicsView, lines 709-743) changes its action label based on which panel is active:
  - SETUP mode: "View Results →"
  - RESULTS mode: "← Edit Setup"

  This is directional navigation, but it's only on mobile, and only on ECONOMICS. **WELLS doesn't have a similar affordance** (it uses a tray, lines 458-556 in DesignWellsView). Inconsistent.

- **Focus mode hides the sidebar but doesn't change the header or add a "return to normal" button**. User must remember they're in focus mode and click the "Focus" button again to toggle off. **This is a mode, not a view.**

### What Works

- **Sticky EconomicsGroupBar** serves as a constant context anchor. Always shows active group + compute status + wells count.

- **Workflow stepper** (WorkflowStepper.tsx, currently commented out in many views) would help if it were always visible. It shows SETUP | SELECT | RUN | REVIEW with color-coded status (active, complete, stale). **Why is this hidden?**

- **Mobile panel toggles** (GROUPS | MAP, SETUP | RESULTS) provide clear mode switching on small screens. The grid-cols-2 layout with cyan active state is obvious.

### Recommendations

1. **Add breadcrumbs to PageHeader**:
   ```
   Slopcast > Workspace > Economics > Group: Permian Tier-1 > Summary
   ```
   Compact, one line, right of the logo. Truncate group name on mobile.

2. **Make WorkflowStepper always visible on ECONOMICS**:
   - Position it below EconomicsGroupBar, sticky, compact horizontal strip.
   - Show 4 step dots (SETUP, SELECT, RUN, REVIEW) with color-coded status.
   - Click to jump to step (e.g., SELECT opens WELLS tab with active group pre-selected).

3. **Add a "You are here" badge to active results tab**:
   - Current: tab label + animated underline.
   - Better: tab label + underline + "(active)" badge or pulsing dot.

4. **Unify mobile navigation**: use slide-in drawer everywhere, not toggle buttons.

---

## Layout & Space Allocation

### Desktop Layout (lg+)

**ECONOMICS view**:
- Sidebar: 5/12 cols (lg), 4/12 cols (xl).
- Main: 7/12 cols (lg), 8/12 cols (xl).
- Focus mode: sidebar hidden, main takes full 12/12 cols.

**WELLS view**:
- Sidebar: 5/12 cols (lg), 4/12 cols (xl).
- Main: 7/12 cols (lg), 8/12 cols (xl).

Both views use identical grid breakpoints. Sidebar is scrollable (`lg:overflow-y-auto`), main is scrollable.

### Problems

- **Sidebar content density is inconsistent**:
  - WELLS sidebar: 3 panels (group list, active wells table, filters). Feels spacious.
  - ECONOMICS sidebar: 7-9 panels (map preview, controls, tax, leverage, reserve, advanced, setup). Feels overwhelming.

- **Main content on ECONOMICS has 5 result tabs, but only Summary is designed for full-width consumption**. Charts, Drivers, Cash Flow, Reserves all feel like they're inside a generic container (`<div className="space-y-4">`). No layout differentiation.

- **KpiGrid hero NPV card** (lines 316-365 in KpiGrid) uses Motion `whileHover={{ scale: 1.005 }}`. This is subtle and nice, but the rest of the hero panel (sparkline background, glow orb) already provides hover feedback. **The scale effect feels redundant.**

- **Group Comparison + Quick Drivers** (lines 634-648 in DesignEconomicsView) are side-by-side in a 2-column grid. On mobile they stack. But Quick Drivers is visually lighter (2 bar charts + breakeven label) than Group Comparison (ranked list of all groups). They don't balance well.

- **Mobile: full-screen toggles instead of split-screen**. On tablet (768px-1024px), the user could see both sidebar and main with horizontal scrolling, but the code forces "one or the other" (hidden classes). This is over-optimized for phone, under-optimized for tablet.

### What Works

- **EconomicsGroupBar is sticky, compact, and doesn't take vertical space**. It's a 1-line bar (2 lines with summary row). This is good UI density.

- **PageHeader uses grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto]** (line 257 in PageHeader) so brand + nav collapse into a single column on mobile, theme dropdown stays on the right. Smart responsive.

- **Focus mode collapses sidebar and expands main to full width**. This is excellent for "just show me the numbers" mode.

### Recommendations

1. **Increase sidebar width on XL screens** (1280px+):
   - Current: 4/12 cols (33%).
   - Better: 3/12 cols (25%) to give more breathing room to main content.

2. **Add a layout variant for ECONOMICS > Summary tab**:
   - Current: vertical stack (KpiGrid → divider → 2-col grid → divider → console).
   - Better: **Hero NPV at top, full-width. Below, 3-column grid: Group Comparison (2 cols) + Quick Drivers (1 col).** This gives Group Comparison more room, makes Quick Drivers feel like a sidebar widget.

3. **Remove Motion scale effect on hero NPV card**. The glow orb + sparkline already provide hover feedback. Scale feels over-animated.

4. **On tablet (768px-1024px), show sidebar as a slide-in overlay instead of forced hidden**. User can swipe in from left edge or tap a "Setup" button to reveal sidebar, then dismiss it. Main content stays visible.

---

## Discoverability & Affordances

### What's Obvious

- **Buttons with high color contrast** (cyan bg, black text in classic mode; cyan bg, theme-bg text in modern) are clickable.
- **Active tabs** have animated underlines + color shift.
- **Active group** in EconomicsGroupBar has colored border + name + summary row.
- **Wells on map** have hover tooltips + color coding by group.
- **Collapsible panels** have chevron icons that rotate 180° when expanded.

### What's Hidden

1. **Keyboard shortcuts** (lines 6 in KeyboardShortcutsHelp):
   - `Cmd/Ctrl + K` to toggle help panel.
   - `G` to toggle AI assistant.
   - `S` to toggle scenarios.
   - `E` to switch to economics.
   - `W` to switch to wells.
   - `F` to toggle focus mode.
   - `T` to cycle themes.

   **None of these are discoverable from the UI.** There's no "?" button in the header, no tooltip on buttons showing shortcuts, no onboarding tour step mentioning them.

2. **Clone Group button** (line 377-388 in EconomicsGroupBar) is inline in the sticky bar, but it's labeled "Clone Group" in 8px font, positioned after prev/next arrows and focus button. **Easy to miss.**

3. **Setup Insights panel** (lines 549-603 in DesignEconomicsView) auto-collapses when all checks pass. User may never know it existed if they set up their project correctly on first try. **This is good for experts, bad for onboarding.**

4. **Breakeven oil price** is calculated and shown in KpiGrid (line 344) and OperationsConsole (breakevenOilPrice prop), but **there's no UI to explain what it is or how it's calculated**. New user: "What does $67/bbl mean?"

5. **After-Tax / Levered NPV toggles** (lines 125-127 in DesignEconomicsView pass `onToggleAfterTax` and `onToggleLevered`, but these props are never rendered as interactive controls in the UI. **They're passed but unused.**

   **ERROR: These props are used in KpiGrid (lines 347-365) to conditionally render after-tax/levered badges, but they're shown/hidden based on `showAfterTax` and `showLevered` boolean props, not user-controlled toggles.**

6. **FocusMode button** (lines 357-374 in EconomicsGroupBar) is labeled "Focus" in 8px font, positioned inline with group switcher and clone button. **No icon, no tooltip, no explanation of what it does.**

### Recommendations

1. **Add "?" help button to PageHeader** (right side, next to theme dropdown):
   - Opens KeyboardShortcutsHelp panel.
   - Always visible, obvious affordance.

2. **Add keyboard shortcut badges to buttons**:
   - ECONOMICS tab → shows "E" in a tiny pill badge on hover.
   - WELLS tab → shows "W".
   - Focus button → shows "F".

3. **Add a "What's this?" icon next to Breakeven Oil Price** (info circle icon):
   - Click to open a tooltip: "Minimum oil price required for NPV ≥ $0 at 10% discount rate."

4. **Convert After-Tax / Levered badges to toggleable chips**:
   - Current: passive badges below hero NPV.
   - Better: toggle switches in Setup Insights or a "Display Options" dropdown in PageHeader.

5. **Show Setup Insights as a slide-in tray on first load**:
   - Animate in from right side, overlay main content, show checklist.
   - User must click "Got it" or "Dismiss" to close.
   - After dismissed once, collapses to sidebar panel (current behavior).

---

## What's Working

### Strong Patterns

1. **KpiGrid hero NPV** — this is the app's best example of data gravity. Large, animated, contextual (sparkline), and color-coded. Keep this pattern and apply it to other hero metrics.

2. **EconomicsGroupBar as a sticky context anchor** — always shows active group, compute status, wells count, and provides quick group switching. This should be the pattern for WELLS too (replace sidebar group list with a similar compact bar).

3. **Motion layout animations for active tabs** — the animated underline (layoutId) provides clear feedback when switching tabs. Smooth, not distracting.

4. **Collapsible sidebar sections** — progressive disclosure is good. The execution (7-9 collapsibles) is too much, but the pattern itself is sound.

5. **Mobile sticky action strips** — "View Results →" / "← Edit Setup" buttons at bottom of screen make the primary action obvious on mobile. Extend this to WELLS view (currently uses a tray, which is less obvious).

6. **Focus mode** — hide sidebar, expand main to full width, perfect for "just show me the numbers" mode. Add a keyboard shortcut badge and an icon to make it more discoverable.

### Weak Patterns

1. **Mobile panel toggles** (GROUPS | MAP, SETUP | RESULTS) — feel like fallbacks, not designed experiences. Replace with slide-in drawer navigation (sidebar slides in from left, main stays visible).

2. **Too many collapsible sections in ECONOMICS sidebar** — 7-9 drawers is overwhelming. Flatten to 3: Drivers, Advanced, Setup Insights.

3. **5 tabs in EconomicsResultsTabs** — only Summary and Charts are frequently used. Group the rest under "Data" or "Advanced" overflow menu.

4. **Group navigation inconsistency** — WELLS uses sidebar group list with expand/collapse, ECONOMICS uses sticky bar with dropdown. Pick one pattern.

5. **No breadcrumbs or "you are here" summary** — user must visually scan 4+ UI regions to reconstruct their current context.

---

## Priority Issues (Top 5 with Fixes)

### 1. **IRR is missing from the hero KPI strip**

**Severity**: HIGH
**Impact**: Users evaluating deals need IRR (or ROI) prominently displayed. It's currently buried in dropdown menus and comparison strips.

**Fix**:
- Add IRR tile to KpiGrid stat strip (line 368-415 in KpiGrid).
- Position it between EUR and Payout.
- Use AnimatedValue component, lavender accent, "x" unit suffix.
- Source from `aggregateMetrics.roi` or calculate IRR from cash flow.

**Code change** (KpiGrid.tsx:368-415):
```tsx
<KpiStripTile
  title="Portfolio IRR"
  valueNode={
    <AnimatedValue
      value={metrics.irr ?? 0}  // Add irr field to DealMetrics type
      format={(n) => n.toFixed(1)}
      className={`text-xl font-black text-theme-text leading-none ${shimmerClass}`}
    />
  }
  unit="x"
  accent="lavender"
  shimmer={shimmerClass}
  bgClass={tileBgMap[panelStyle]}
/>
```

---

### 2. **Too many collapsible sections in ECONOMICS sidebar (7-9 drawers)**

**Severity**: HIGH
**Impact**: Cognitive overload. User must remember which drawer contains which control. Auto-collapse behavior helps, but the quantity is still overwhelming.

**Fix**:
- Flatten to **3 collapsible sections**:
  1. **Drivers** (type curve, CAPEX, OPEX, ownership) — render Controls component inside.
  2. **Advanced** (tax, leverage, reserve category) — merge Tax/Fiscal, Leverage, Reserve Category into one collapsible.
  3. **Setup Insights** (checklist, blocker message) — keep as-is, but move to top of sidebar.

**Code change** (DesignEconomicsView.tsx:350-603):
- Remove individual collapsibles for Tax, Leverage, Reserve.
- Nest them inside a single "Advanced Settings" collapsible.
- Reorder sidebar: Setup Insights → Drivers → Advanced Settings.

---

### 3. **No breadcrumbs or "you are here" summary in PageHeader**

**Severity**: MEDIUM
**Impact**: User cannot see their current context at a glance. Must visually scan 4+ UI regions.

**Fix**:
- Add breadcrumb trail to PageHeader, positioned right of logo, left of theme dropdown.
- Format: `Workspace > Economics > Group: Permian Tier-1 > Summary`
- Truncate group name on mobile.
- Use `text-[9px] uppercase tracking-[0.18em] text-theme-muted` styling.

**Code change** (PageHeader.tsx:257-395):
```tsx
<div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-theme-muted">
  <span>Workspace</span>
  <span className="opacity-50">›</span>
  <span>{designWorkspace === 'WELLS' ? 'Wells' : 'Economics'}</span>
  {activeGroupName && (
    <>
      <span className="opacity-50">›</span>
      <span className="truncate max-w-[120px]">{activeGroupName}</span>
    </>
  )}
</div>
```

---

### 4. **Group Comparison is buried below the fold (after KpiGrid + divider)**

**Severity**: MEDIUM
**Impact**: Group Comparison shows NPV + ROI for all groups — critical for deal evaluation. Currently positioned as secondary content.

**Fix**:
- Move Group Comparison above Quick Drivers.
- Change layout from 2-column grid (1fr 1fr) to 3-column grid (2fr 1fr).
- Group Comparison takes 2 cols, Quick Drivers takes 1 col.
- This gives Group Comparison more room and elevates its importance.

**Code change** (DesignEconomicsView.tsx:634-648):
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2">
    <GroupComparisonStrip {...} />
  </div>
  <div className="lg:col-span-1">
    <QuickDrivers {...} />
  </div>
</div>
```

---

### 5. **Keyboard shortcuts are not discoverable**

**Severity**: MEDIUM
**Impact**: Power users miss out on `Cmd+K`, `E`, `W`, `F`, `G`, `S`, `T` shortcuts because there's no visual cue.

**Fix**:
- Add "?" button to PageHeader (right side, before theme dropdown).
- Opens KeyboardShortcutsHelp panel.
- Add keyboard shortcut badges to interactive elements on hover:
  - ECONOMICS tab → "(E)" pill badge.
  - WELLS tab → "(W)" pill badge.
  - Focus button → "(F)" pill badge.

**Code change** (PageHeader.tsx:374-393):
```tsx
<button
  type="button"
  onClick={() => onShowKeyboardHelp?.()}  // Add onShowKeyboardHelp prop
  className={...}
  title="Keyboard shortcuts (Cmd+K)"
>
  <span className="text-sm">?</span>
</button>
```

---

## Recommendations

### Structural

1. **Consolidate ECONOMICS sidebar to 3 sections**: Drivers, Advanced, Setup Insights.
2. **Add breadcrumbs to PageHeader**: Show current workspace, tab, group, and view.
3. **Add IRR tile to hero KPI strip**: Between EUR and Payout.
4. **Move Group Comparison above the fold**: 3-column layout (2fr for comparison, 1fr for quick drivers).
5. **Unify group navigation**: Use EconomicsGroupBar pattern everywhere (WELLS + ECONOMICS).

### Tactical

6. **Add "?" help button to PageHeader**: Opens keyboard shortcuts panel.
7. **Add keyboard shortcut badges to buttons**: Show "(E)", "(W)", "(F)" pills on hover.
8. **Convert After-Tax / Levered badges to toggles**: Move to Setup Insights or "Display Options" dropdown.
9. **Add tooltips to Breakeven Oil Price**: "Minimum oil price for NPV ≥ $0 at 10% discount."
10. **Show Setup Insights as a slide-in tray on first load**: Animate in from right, require dismissal.

### Polish

11. **Remove Motion scale effect on hero NPV card**: Glow orb + sparkline already provide hover feedback.
12. **Increase sidebar contrast on XL screens**: Reduce from 4/12 cols to 3/12 cols (25%).
13. **Add "You are here" badge to active results tab**: Pulsing dot or "(active)" label.
14. **Replace mobile panel toggles with slide-in drawer**: Sidebar slides in from left, main stays visible.
15. **Add WorkflowStepper to ECONOMICS view**: Sticky, compact, 4-step horizontal strip below EconomicsGroupBar.

---

## Conclusion

Slopcast's visual hierarchy and information architecture demonstrate sophisticated structural thinking — the workspace is cleanly segmented, the component library is disciplined, and the KpiGrid hero NPV is a masterclass in data gravity. However, the density of controls (7-9 collapsible sections in ECONOMICS sidebar), the proliferation of nested surfaces, and the lack of clear "one primary action" creates cognitive weight that fights against the brand promise of "war-room energy."

The IA is sound but verbose. WELLS → ECONOMICS flow works, but each workspace sprawls into too many sub-containers. Users must maintain too much state across too many panels.

**Priority fixes**: Add IRR to hero KPI strip, flatten sidebar to 3 sections, add breadcrumbs, elevate Group Comparison, make keyboard shortcuts discoverable.

**Overall grade**: B+. The bones are excellent. The execution needs pruning.
