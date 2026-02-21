# Slopcast UI Review (Drivers Screen)

## Goals

* Make the interface feel **distinct, scannable, and calm** (less “chrome noise”).
* Improve **hierarchy** so users instantly know: *where to look → what’s interactive → what changed → what to do next*.
* Preserve the premium night-ops vibe while improving **clarity, speed, and confidence**.

---

## Quick Diagnosis (Why it feels “off”)

### 1) Everything shares the same visual weight

Most elements use the same rounded container + stroke + glow language. When **containers, controls, and data** all look alike, the eye can’t prioritize.

### 2) Border stacking creates “UI noise”

There are borders around sections, sub-sections, and rows—plus inner cards and pills. This produces a grid of outlines that reads as clutter even when content is moderate.

### 3) Weak typographic hierarchy

Many labels are all-caps with similar size/weight/contrast. Headings don’t clearly dominate labels; labels don’t recede.

### 4) Interactive vs. static elements are too similar

Tabs and selectors visually resemble passive containers. Active states are “slightly brighter,” but not unmistakable.

### 5) Competing focal points

Multiple “hero” accents (cyan pill nav, capex cards, driver bars, upside/downside tiles) pull attention in different directions. The screen lacks a single primary narrative.

### 6) Inconsistent spacing rhythm

Padding and spacing vary between modules, so scanning feels jumpy rather than predictable.

### 7) Background texture increases perceived density

Starfield/wave lines behind dense UI adds constant low-level noise, reducing legibility and increasing fatigue.

---

## What “Good” Looks Like Here (Design Principles)

1. **One story at a time**

   * *Select a group → understand results → explain drivers → take action.*
2. **3-level hierarchy**

   * Page regions → section headers → data rows/controls.
3. **Use space before lines**

   * Prefer spacing + subtle surface tone; reserve strokes for true affordances.
4. **Accent color is sacred**

   * Use the bright accent only for selection/primary action (and a separate semantic color for +/-).
5. **Progressive disclosure**

   * Show essentials by default; expand only when asked.

---

## Concrete Improvements (High Impact)

### A) Reduce borders & glows (50–70%)

**Do:**

* Keep a border for **interactive components** (buttons/inputs/tabs) or **major containers**, not every nested level.
* Replace some borders with a slight surface lift (subtle tint/elevation).

**Specific to this screen:**

* Remove borders around each driver row; use a faint row background on hover/selection.
* Simplify the outer “Drivers” wrapper (one container, not nested boxes).

---

### B) Strengthen hierarchy with typography

**Recommended type system (example):**

* **H1 (page title):** 20–24, semibold, high contrast
* **H2 (section):** 14–16, semibold, medium contrast
* **Label (row/field):** 11–12, regular, lower contrast
* **Value (key numbers):** 16–20, semibold, high contrast

**Reduce all-caps** to only small metadata tags; use Title Case for headers.

---

### C) Clarify clickability & active states

**Make active states unmistakable:**

* Tabs: stronger fill difference + underline/indicator + slightly larger label
* Buttons: consistent primary/secondary hierarchy
* Dropdown/select: show clear affordance (caret, hover state, focus ring)

**Grayscale test:** if users can’t identify what’s active without color, it’s too subtle.

---

### D) Unify spacing

Adopt an 8px spacing scale and apply consistently:

* Card padding: 16–24
* Section gaps: 16–24
* Row height: 44–52
* Inline gaps: 8–12

---

### E) Calm the background

* Reduce contrast/opacity of starfield + wave lines by ~30–60%.
* Consider confining decorative effects to header area, or apply a blur behind content panels.

---

## Drivers Panel (How to make it feel clean and distinct)

### Recommended layout structure

1. **Outcome Summary** (top of main area)

* NPV / ROI / Payback / Breakeven (at-a-glance)

2. **Key Drivers** (center)

* Ranked list with clear positive/negative encoding

3. **Details-on-demand** (right drawer or expandable row)

* For a selected driver: assumptions, sensitivity curve, linked inputs

### Make drivers scannable

* Align driver rows into a strict grid: **Name | Impact Bar | Value**
* Put the sign (+/-) near the value, not only in color.
* Use fewer decimals and consistent formatting.

---

## Novel Improvements (Differentiators that feel “new”)

### 1) “Focus Mode” (declutter toggle)

A one-click switch that hides secondary chrome:

* Collapses the sidebar into a compact rail
* Shows only: group name, outcome summary, ranked drivers
* Great for presenting and for quick decision-making

### 2) “Narrative Sensitivity” (explainability layer)

When a driver is selected, show:

* **What moved** (assumption + delta)
* **Why it matters** (which component of cashflow it influences)
* **Confidence** (based on data quality / variance)
* **Action** (jump to the input that controls it)

### 3) “Pin & Compare” scenarios (micro A/B)

Allow users to pin up to 3 snapshots:

* Baseline vs Scenario A vs Scenario B
* Driver deltas display as **Δ vs Baseline**
* Helpful for committees and tradeoff reviews

### 4) “Semantic Zoom” for complexity

As users zoom in (or expand), reveal more detail:

* Default: top 3 drivers
* Expand: top 10 + mini sparklines
* Deep dive: distribution/curve + linked parameters

### 5) “Driver Decomposition” (stacked contribution)

Break a driver like “Oil Benchmark” into components:

* price deck vs basis vs differential vs transport
  This turns one bar into a **mini stack** that explains the bar.

### 6) “Precision Mode” formatting

For decision meetings:

* Round values to the level that matters
* Collapse “MM” formatting into consistent units
* Add a “copy summary” button that copies a clean text snippet

### 7) Intelligent grouping (“What’s common across these wells?”)

If Tier groups are multi-well:

* Show variance bands and flag outliers
* Offer quick split: “Create subgroup from outliers”

### 8) Attention-guided highlights

Use a subtle “next best action” cue:

* *Your breakeven is N/A because X is missing → Fix input*
* *Development pace dominates downside risk → review schedule*

---

## Interaction Improvements

### Reduce friction in the left rail

* Collapse CAPEX + Decline into **accordion sections** with a compact summary header.
* Add **inline reset/undo** per section.
* Add “Apply template” as a primary action only when changes exist.

### Make the group selector more usable

* Add search, tags, and sort (e.g., ROI, payback, capex)
* Show group health (data completeness, last updated)
* Allow keyboard navigation

---

## Accessibility & Usability Enhancements

* Ensure contrast meets WCAG for body text (especially cyan on dark).
* Add clear focus rings for keyboard users.
* Add reduced-motion mode (glows/animated backgrounds).
* Never rely on color alone to convey +/-; include sign and/or icon.

---

## Prioritized Action Plan

### Phase 1 (1–2 days): Visual declutter

* Remove most nested borders
* Reduce background noise
* Standardize spacing

### Phase 2 (3–5 days): Hierarchy & interaction

* Type scale + consistent value styling
* Clear active/clickable states
* Rework Drivers list alignment

### Phase 3 (1–2 sprints): Differentiators

* Focus Mode
* Pin & Compare
* Narrative Sensitivity + jump-to-input

---

## Checklists

### Visual Hierarchy Checklist

* [ ] One primary focal region
* [ ] Section headers clearly dominate labels
* [ ] Accent color used only for active/primary
* [ ] Key numbers are visually prioritized

### Clutter Reduction Checklist

* [ ] No more than 1–2 border layers per region
* [ ] Spacing defines structure more than strokes
* [ ] Background texture is subtle behind dense content

### Drivers Readability Checklist

* [ ] Strict column alignment
* [ ] Sign shown with symbol, not just color
* [ ] Consistent units/rounding
* [ ] Details available on demand

---

## Suggested “Before/After” Mental Model

**Before:** a grid of similar-looking containers; every element competes.

**After:**

1. Calm surfaces with fewer lines
2. Strong, scan-friendly hierarchy
3. Drivers list as the hero
4. Details appear only when needed
5. Novel features (Focus, Compare, Narrative) add polish and distinctiveness
