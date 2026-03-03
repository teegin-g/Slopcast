# Slopcast UI/UX Quality-of-Life PRD

**Date:** 2026-03-03
**Scope:** Cross-cutting QoL and polish improvements across Hub, Landing, Workspace (Wells/Economics/Scenarios), and mobile viewports.
**Themes audited:** Slate (modern), Classic/Mario
**Viewports audited:** Desktop 1440×900, Mobile 390×844

> This PRD is additive to the existing Drivers-focused PRD and its addendum. It focuses on **app-wide** quality-of-life improvements rather than single-screen rework.

---

## Executive Summary

Slopcast has strong data density and a cohesive design-token system. The bones are solid. The issues below are about **friction, clarity, and polish** — the kind of things that make the difference between "functional tool" and "tool people enjoy using." Twenty-three suggestions are organized into five categories, each with a clear rationale and an estimated effort band.

---

## Category 1: Navigation & Wayfinding

### 1.1 — Breadcrumb trail / location indicator

**Problem:** Once inside the workspace, the only way to know where you are is to read which header tab is highlighted. The app has a 3-level depth (Hub → Slopcast Landing → Workspace → Wells/Economics sub-tabs → Summary/Charts/Drivers/Reserves sub-sub-tabs) but no persistent breadcrumb or location string.

**Suggestion:** Add a subtle breadcrumb row directly below the header (or integrated into it) that reads like: `Hub / Slopcast / Design — Economics / Drivers`. Clicking any segment navigates back. On mobile, collapse to just the current level with a back arrow.

**Impact:** Reduces "where am I?" confusion, especially after returning to a tab.
**Effort:** Small

---

### 1.2 — Persistent "Back to Landing" affordance from workspace

**Problem:** The "HUB" button in the header goes to the Hub page, but there's no obvious way to return to the Slopcast landing page (deal picker) from inside a workspace without navigating via URL. A user who opened a blank workspace can't easily get back to saved deals.

**Suggestion:** Add a lightweight "back" affordance — either the breadcrumb from 1.1, or a small back-arrow icon next to the app title that returns to `/slopcast` landing.

**Impact:** Eliminates a dead-end feel when inside the workspace.
**Effort:** Small

---

### 1.3 — Active Wells/Economics pill is hard to distinguish at a glance

**Problem:** The Wells and Economics workspace tabs in the header use a "READY"/"CURRENT" badge to indicate status, but the active tab is differentiated mainly by a slightly different background fill. On the Slate theme, "WELLS (READY)" and "ECONOMICS (CURRENT)" both read as muted capsules; the active state isn't immediately obvious, especially in peripheral vision.

**Suggestion:** Make the active workspace tab use a stronger visual signal: a solid bottom border (underline indicator), or a more saturated fill with the inactive tab at lower opacity. The status badges ("READY", "CURRENT") should be either removed or made more contextual — they're always visible but rarely actionable.

**Impact:** Faster mode-switching, less cognitive overhead.
**Effort:** Small

---

### 1.4 — Keyboard shortcut discoverability

**Problem:** Keyboard shortcuts exist (there's a `KeyboardShortcutsHelp` component) but they aren't surfaced anywhere in the UI except through the "Tour" button. Power users won't discover them.

**Suggestion:** Add a small `?` or `⌘` icon in the header or footer that opens the shortcuts modal. Also show a one-time tooltip on first workspace visit: "Press ? to see keyboard shortcuts."

**Impact:** Power-user velocity, a sign of a mature tool.
**Effort:** Small

---

## Category 2: Information Hierarchy & Visual Clarity

### 2.1 — All-caps overload across the entire app

**Problem:** Nearly every label, section header, button, badge, and metadata string is rendered in `uppercase tracking-[0.2em]+ font-black`. This was observed in: PageHeader tabs, SectionCard titlebars, KPI labels, filter labels, group names, Portfolio Summary labels, Quick Actions, Account Dashboard, Deals Table headers, Selection Actions, and more. When everything is uppercase, nothing stands out.

**Suggestion:** Reserve ALL-CAPS for:
- Top-level section headers (e.g., "SCENARIOS / GROUPS", "BASIN VISUALIZER")
- Status badges ("ACTIVE", "SOON")

Switch to **Title Case** (font-bold, not font-black) for:
- Sub-section headers (e.g., "Capex Snapshot", "Decline Profile", "Quick Drivers")
- Button labels (e.g., "Save Snapshot", "Edit Capex", "Apply Template")
- Filter labels ("Operator", "Formation", "Status")

Switch to **Sentence case** (regular weight) for:
- Descriptive text, metadata rows, and activity items

This creates a 3-tier typographic hierarchy that guides the eye.

**Impact:** High — single biggest readability improvement across every screen.
**Effort:** Medium (systematic find-and-replace across components)

---

### 2.2 — KPI tiles lack visual priority differentiation

**Problem:** On the Economics Summary view, the "Portfolio NPV" hero number ($749.1 MM) is inside a large panel, but the four KPI tiles below it (Total Capex, Portfolio EUR, Payout, Wells) all share identical styling — same border, same font size, same weight. They read as a flat row of equals, but NPV and Payout are typically the decision-driving metrics.

**Suggestion:** Give the "Portfolio NPV" hero number more breathing room (slightly larger font or a gradient accent). For the secondary KPIs, introduce a subtle visual distinction: make the two most decision-relevant metrics (e.g., Payout and ROI) slightly more prominent (thicker value font, or a muted color accent), while making "Wells" and "Total CAPEX" feel more like supporting context.

**Impact:** Users scan the right number first.
**Effort:** Small

---

### 2.3 — Scenario cards: inconsistent sizing creates dead space

**Problem:** On the Scenarios page, the three scenario cards (Bull Scenario, Base Case, Ramp Program) are laid out in a 2+1 grid where the third card ("Ramp Program") floats alone with large empty space to its right. This makes the layout feel unfinished.

**Suggestion:** When there are 3 or fewer scenarios, use a 3-column grid so all cards are the same width in a single row. When there are more than 3, wrap to 2×N. Alternatively, allow the third card to span a wider column to fill the row.

**Impact:** Tighter, more intentional-looking layout.
**Effort:** Small

---

### 2.4 — Left rail on Economics is very long and hard to scan

**Problem:** The Economics left rail contains: Mini Map Preview, Group label + CAPEX badge, Template selector, CAPEX Snapshot (with 3 tiles), Decline Profile (with 4 inputs + 3 sliders), and a Forecast Grid header — all visible simultaneously. The rail requires significant scrolling and has no visual grouping beyond pink-bordered section cards.

**Suggestion:**
1. Default-collapse the Decline Profile and CAPEX Snapshot sections to a single summary line each (e.g., "Qi: 850 BOPD · b: 1.1 · Di: 65%" and "Total: $12.26M · 9 items"). Click to expand.
2. Move the Mini Map Preview into a small thumbnail in the group bar or make it toggleable — it repeats info already visible on the Wells tab.
3. Add section dividers or subtle headers between the collapsible sections.

**Impact:** Less scrolling, faster parameter scanning, cleaner left rail.
**Effort:** Medium

---

### 2.5 — "Selection Actions" panel feels disconnected from the map

**Problem:** The Selection Actions panel ("Assign to Active Group", "Create Group from Selection", "Select Filtered", "Clear") sits below the map on the Wells view. But the map itself has its own selection tools (Lasso, Rect, formation filter). The two feel visually disconnected — the actions are far from where the selecting happens.

**Suggestion:** Either:
- (A) Integrate the selection actions into a floating toolbar at the bottom of the map area (contextual — only visible when wells are selected), or
- (B) Move the selection actions into the map panel itself, as a row below the map controls.

**Impact:** Reduces scroll distance; ties action to context.
**Effort:** Medium

---

## Category 3: Empty States & Onboarding

### 3.1 — Empty deals table needs a richer empty state

**Problem:** When there are no saved deals, the Deals Table shows "No deals found. Create one to get started." — plain text in a large empty panel. This is the first thing a new user sees after signing in and navigating to Slopcast. It doesn't inspire confidence or guide the user.

**Suggestion:** Replace with a richer empty state:
- A simple illustration or icon (e.g., a folder + sparkle)
- "No deals yet" as a heading
- "Start by searching for acreage above, or open a blank workspace to explore with sample data." as body text
- Two inline buttons: "Search Acreage" (focuses the search bar) and "Open Blank Workspace"

**Impact:** Better first-run experience, less "is this broken?" hesitation.
**Effort:** Small

---

### 3.2 — Portfolio Summary shows all zeroes for new users

**Problem:** The Portfolio Summary panel on the landing page shows "Total Deals: 0 / Active: 0 / Total PV10: $0.0M / Total Wells: 0" for new users. Four tiles of zeroes take up significant real estate and provide no value.

**Suggestion:** When all values are zero, collapse the Portfolio Summary into a single muted line: "No portfolio data yet — create your first deal to see metrics here." When at least one deal exists, expand to the full 2×2 grid.

**Impact:** Cleaner first impression; avoids "empty dashboard" syndrome.
**Effort:** Small

---

### 3.3 — Onboarding tour auto-fires and overlaps content

**Problem:** When entering a blank workspace, the onboarding tour (Step 1 of 5) immediately pops up as a modal overlay that partially covers the Scenarios/Groups panel. The "Skip" button is small and the modal blocks interaction with the underlying UI. For returning users who've seen it before, this is friction.

**Suggestion:**
1. Persist a flag (`slopcast-tour-completed`) in localStorage. Don't auto-fire the tour on subsequent visits.
2. Make the tour a non-blocking tooltip that points to the relevant element rather than a centered modal.
3. Add a "Don't show again" checkbox.
4. The "Tour" button in the header already exists for re-triggering.

**Impact:** Returning users aren't blocked; new users get a less intrusive guide.
**Effort:** Small–Medium

---

### 3.4 — Reserves tab shows only PDP with no guidance

**Problem:** The Reserves Classification tab shows only "PDP" with 40 wells and the full EUR assigned. The donut chart shows a single blue ring. There's no indication that PUD, Probable, or Possible categories exist or how to classify wells into them.

**Suggestion:** Add a subtle guidance callout: "All wells are currently classified as PDP. To add PUD or Probable categories, assign reserve classifications in the Wells tab." This teaches the user that the feature is deeper than what they see.

**Impact:** Prevents "is this all it does?" reactions.
**Effort:** Small

---

## Category 4: Interaction & Micro-UX

### 4.1 — Theme switcher icons are unlabeled and tiny

**Problem:** In the Hub header, the theme switcher is a row of 7 small emoji icons (castle, octopus, palm tree, moon, house, mushroom, snowflake). They have no labels and no tooltips on hover (only `title` attributes, which have a browser delay). On mobile, the icons overflow and get clipped.

**Suggestion:**
1. On desktop: show a tooltip immediately on hover (custom tooltip, not browser `title`).
2. On mobile: replace the icon row with a single "Theme" button that opens a bottom sheet or dropdown showing icon + label for each theme.
3. Consider grouping the switcher into the existing dropdown pattern used in the workspace header (which already works well).

**Impact:** Users can actually discover and choose themes intentionally.
**Effort:** Small–Medium

---

### 4.2 — AI assistant FAB has no context or label

**Problem:** The floating action button (chat bubble icon) in the bottom-right corner opens the AI assistant, but it has no label, no tooltip, and no visual hint about what it does. It looks like a generic chat widget.

**Suggestion:**
1. Add a tooltip on hover: "AI Assistant"
2. On first appearance, show a subtle pulse animation and a small label bubble: "Ask me about your economics" that fades after 3 seconds.
3. Consider adding the assistant as a toggleable panel in the header actions (next to Share/Tour) rather than a FAB, which feels more like a SaaS support widget than a power feature.

**Impact:** Higher discovery rate for a key feature.
**Effort:** Small

---

### 4.3 — "Save Snapshot" button is visually alarming

**Problem:** The "Save Snapshot" button on the Economics view uses a bright magenta/red fill with white text — the same visual language used for destructive actions in most apps. It competes for attention with the primary navigation and KPI values.

**Suggestion:** Restyle to use the standard `sc-btnPrimary` (cyan) or a secondary style (outlined). Reserve the warm/red palette for destructive or warning actions. If the intent is to draw attention to "save your work," a gentler approach is a cyan outline button that fills on hover.

**Impact:** Reduces visual noise; aligns button hierarchy to conventions.
**Effort:** Small

---

### 4.4 — Filter dropdowns have no selected-state feedback

**Problem:** On the Wells view, the Operator / Formation / Status filter dropdowns show "All Operators", "All Formations", "All Statuses" as defaults. When a filter is applied, the dropdown value changes but there's no visual indication that a filter is active (no highlight, no badge, no border change). The "RESET" button is the only clue.

**Suggestion:** When any filter is not at its default value:
1. Add a small colored dot or count badge next to "FILTERS" header (e.g., "FILTERS (2 active)")
2. Give the active dropdown a subtle accent border (e.g., `border-theme-cyan`)
3. Show individual clear buttons per filter (small "×" next to the dropdown)

**Impact:** Users always know if/which filters are active.
**Effort:** Small

---

### 4.5 — Map layer toggles (Grid/Heat) lack active state clarity

**Problem:** The Basin Visualizer has "LASSO / RECT" and "GRID / HEAT" toggle buttons, plus a "BY FORMATION" dropdown. The active state for these toggles is nearly invisible — they all look like ghost buttons.

**Suggestion:** Use a filled background for the active toggle state (similar to how the Wells/Economics tabs work). For example, when "GRID" is active, it should have a solid `bg-theme-cyan/20` fill with `text-theme-cyan`.

**Impact:** Users know which map mode is active without trial and error.
**Effort:** Small

---

### 4.6 — No loading/computing indicator when economics recalculate

**Problem:** When changing decline parameters or CAPEX inputs, the economics values update instantly (because it's client-side), but there's no visual feedback that a recalculation happened. Users can't confirm their input actually changed anything unless they watch the NPV number.

**Suggestion:** Add a brief, subtle "recalculating" flash — either:
- A 300ms pulse on the NPV hero number (scale 1.0 → 1.02 → 1.0)
- A tiny "Updated" toast that appears and fades near the KPI row
- A shimmer effect on the values that resolves after computation

**Impact:** Builds confidence that the tool is responsive and inputs matter.
**Effort:** Small

---

## Category 5: Layout & Responsive Polish

### 5.1 — Hub page right column has too much vertical whitespace

**Problem:** The Hub's right column (Account Dashboard + Quick Actions) leaves significant empty space below Quick Actions on desktop. The two panels are narrow and short, creating an unbalanced 60/40 split where the right side feels sparse.

**Suggestion:**
1. Stack Account Dashboard and Quick Actions closer together (reduce gap).
2. Add a third panel to the right column — either a "Recent Activity" feed (last 3 deals opened, last scenario run) or a "Getting Started" checklist for new users.
3. Alternatively, make the right column narrower (3 cols instead of 4) and give the left column more room.

**Impact:** More balanced layout; less wasted space.
**Effort:** Small–Medium

---

### 5.2 — Mobile: header overflows and clips on small screens

**Problem:** On mobile (390px), the Hub header tries to fit the logo, title ("Slopcast Command Hub"), subtitle, sign-in button, and 7 theme icons in one row. The title wraps to 3 lines and the theme icons extend beyond the viewport edge (visible in the mobile-slate-hub screenshot).

**Suggestion:**
1. On mobile, truncate the header title to just "Slopcast Hub" or show only the logo.
2. Move the theme switcher to a hamburger menu or a settings gear icon.
3. Keep only one CTA in the header (Sign In or Resume), move secondary actions to the page body.

**Impact:** Clean mobile header that doesn't overflow.
**Effort:** Medium

---

### 5.3 — Mobile: auth page title wraps awkwardly

**Problem:** On mobile, the auth page title "Sign In To Slopcast Hub" wraps to 4 lines with the theme icons floating in the middle of the title area. The layout breaks visually.

**Suggestion:** On mobile:
1. Use a shorter title: "Sign In"
2. Move theme icons below the title or into a collapsible section.
3. Center the form inputs and reduce padding so the card doesn't feel oversized.

**Impact:** Professional-looking auth flow on mobile.
**Effort:** Small

---

### 5.4 — Workspace horizontal space usage could be tighter

**Problem:** The Wells workspace uses a ~30/70 split (left panel / map). The left panel contains the group list, wells table, and filters but is quite narrow — table columns get truncated (operator names cut off). Meanwhile, the map has plenty of room but doesn't need all of it.

**Suggestion:** Make the left panel resizable with a drag handle (or at minimum, widen it from ~30% to ~35%). Alternatively, allow the wells table to expand into a full-width overlay when clicked, then collapse back.

**Impact:** More readable data tables; better space utilization.
**Effort:** Medium

---

### 5.5 — Charts are too short and waste vertical space

**Problem:** On the Economics Charts tab, the Production Forecast and Cumulative Cash Flow charts are short (~200px tall) and wide. The actual data curves use only a portion of the chart height, leaving a lot of empty canvas. Meanwhile, the left rail takes up vertical space that could be used for taller charts.

**Suggestion:**
1. Make charts taller (at least 280–320px) to give the data more room to breathe.
2. In Focus Mode (from the existing PRD), charts should expand to near-full viewport height.
3. Add a "maximize" button on each chart that expands it to a full-screen overlay.

**Impact:** Data is more readable and visually impactful.
**Effort:** Small–Medium

---

## Category 6: Bonus — Small Touches That Signal Quality

### 6.1 — Add a favicon and page titles

**Problem:** The browser tab shows a generic Vite icon and "Vite + React + TS" as the page title. This is visible in every screenshot and makes the app feel like a dev prototype.

**Suggestion:** Set proper `<title>` tags per route (e.g., "Slopcast — Hub", "Slopcast — Design", "Slopcast — Scenarios"). Add a branded favicon that works in dark and light OS themes.

**Impact:** Looks professional in browser tabs, bookmarks, and link previews.
**Effort:** Tiny

---

### 6.2 — Consistent number formatting with locale awareness

**Problem:** Numbers are formatted inconsistently: "$749.1 MM" vs "$12.26M" vs "$0.31M" vs "31328 MBoe" vs "22 MO". Some use spaces before units, some don't. Some use "MM" (double million), some use "M".

**Suggestion:** Create a single `formatValue(value, unit, options)` utility and use it everywhere. Rules:
- Always use "MM" for millions (industry standard for O&G): `$749.1 MM`
- Always include a space before the unit: `31,328 MBoe`
- Use consistent decimal places per metric type (NPV: 1 decimal, CAPEX: 2, EUR: 0)
- Payout in months: `22 mo`

**Impact:** Professional polish; consistent mental model for users scanning numbers.
**Effort:** Small–Medium

---

### 6.3 — Add subtle transitions when switching tabs/views

**Problem:** Switching between Wells/Economics or between Summary/Charts/Drivers/Reserves tabs causes an instant hard-swap of content. There's no transition, which makes the UI feel jarring.

**Suggestion:** Add a quick 150ms fade transition when the main content area swaps. Not a complex animation — just `opacity: 0 → 1` on the incoming content. This can be done with a simple CSS class toggle.

**Impact:** The app feels smoother and more intentional.
**Effort:** Tiny

---

## Prioritization Matrix

| # | Suggestion | Impact | Effort | Priority |
|---|-----------|--------|--------|----------|
| 6.1 | Favicon + page titles | Medium | Tiny | **P0** |
| 2.1 | Reduce all-caps overload | High | Medium | **P0** |
| 1.3 | Active tab clarity | High | Small | **P0** |
| 3.1 | Rich empty state for deals | Medium | Small | **P0** |
| 3.3 | Non-blocking onboarding tour | Medium | Small | **P0** |
| 4.3 | Save Snapshot button color | Medium | Small | **P0** |
| 6.3 | Tab switch transitions | Medium | Tiny | **P1** |
| 6.2 | Consistent number formatting | Medium | Small–Med | **P1** |
| 4.4 | Filter active-state feedback | Medium | Small | **P1** |
| 4.5 | Map toggle active states | Medium | Small | **P1** |
| 2.2 | KPI visual priority | Medium | Small | **P1** |
| 2.3 | Scenario card grid fix | Low | Small | **P1** |
| 4.6 | Recalculation feedback | Medium | Small | **P1** |
| 1.1 | Breadcrumb trail | Medium | Small | **P1** |
| 1.2 | Back to landing affordance | Medium | Small | **P1** |
| 4.1 | Theme switcher labels | Medium | Small–Med | **P1** |
| 4.2 | AI FAB context/label | Medium | Small | **P1** |
| 3.2 | Collapse zero-state portfolio | Low | Small | **P2** |
| 3.4 | Reserves guidance callout | Low | Small | **P2** |
| 1.4 | Keyboard shortcut discovery | Low | Small | **P2** |
| 2.4 | Left rail accordion collapse | Medium | Medium | **P2** |
| 5.1 | Hub right column balance | Low | Small–Med | **P2** |
| 5.2 | Mobile header overflow | Medium | Medium | **P2** |
| 5.3 | Mobile auth title wrap | Low | Small | **P2** |
| 5.4 | Resizable left panel | Medium | Medium | **P3** |
| 5.5 | Taller charts | Medium | Small–Med | **P3** |
| 2.5 | Selection actions near map | Medium | Medium | **P3** |

---

## Implementation Notes

### Design tokens to leverage
- `rounded-panel` / `rounded-inner` — already in the system, use consistently
- `sc-btnPrimary` / `sc-btnSecondary` — use for button hierarchy
- `text-theme-cyan` for active states, `text-theme-muted` for inactive
- `shadow-card` for elevation, never `shadow-xl`

### Automated validation
- `npm run ui:audit` — must pass after every change
- `npm run ui:shots` — before/after comparison for visual regressions
- `npm run ui:verify` — flow verification (tab switching, group switching, etc.)

### What NOT to change
- The overall layout structure (header + left rail + main content) is sound
- The theme system and design-token architecture are well-built
- The Classic/Mario theme should remain fun — just less overwhelming
- The color palette for Slate is excellent and should not be muted further

---

## Success Criteria

After implementing P0 + P1 items, the app should:
1. Pass the "squint test" — when you squint at a screenshot, you can identify the primary content area, the main action, and the current location
2. Feel responsive and alive — tab switches are smooth, inputs give feedback
3. Look professional in a browser tab — proper title, favicon, consistent formatting
4. Guide new users without blocking them — rich empty states, non-intrusive tour
5. Let power users move fast — clear active states, keyboard shortcuts discoverable, filters show state
