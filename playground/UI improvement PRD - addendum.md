# Slopcast UI Improvements — Addendum (Drivers + Focus/Narrative)

This addendum extends `/Users/teegingroves/Programming/Slopcast/playground/UI improvement PRD.md` with additional improvements and a decision-complete implementation checklist.

## What’s already done vs the original PRD

- **Left rail friction reduction**: `Controls` is already an accordion with compact sections, and includes a **CAPEX Snapshot** + “Edit CAPEX” entry point.
- **Setup guidance**: Economics view already includes **Setup Insights** with a progress ring + checklist and a “Current blocker”.
- **Drivers surfaced**: Economics has a dedicated **Drivers** results tab and an Operations Console **Key Drivers** pane.

## Additional improvements (this branch)

### 1) Focus Mode (declutter toggle)

**Goal:** one-click presentation/scanning mode that hides secondary chrome.

- Add a `Focus` toggle in the Economics group bar.
- Persist in localStorage key: `slopcast-econ-focus-mode` (`"1"` / `"0"`).
- When enabled:
  - Hide the entire **left rail** (Mini map preview, Controls, Group wells table, Setup insights).
  - Expand results to full width.
  - Hide Execution / Operations Console area (presenting mode).
  - Mobile: hide the Setup/Results toggle and force Results view.

### 2) Narrative Sensitivity (details-on-demand)

**Goal:** make Drivers feel explainable and actionable.

- Driver rows become selectable (not just static cards).
- Selecting a driver shows a details panel:
  - **What moved** (Up/Down shocks and their ΔNPV)
  - **Why it matters** (static explanation per driver family)
  - **Best / Worst case** deltas
  - CTA button that jumps to the right input:
    - `oil` → “Edit Pricing” (Scenario view → Pricing accordion)
    - `rig` → “Edit Schedule” (Scenario view → Fleet Scheduling accordion)
    - `capex` → “Edit CAPEX” (Economics Controls → CAPEX section)
    - `eur` → “Edit Decline Profile” (Economics Controls → Decline Profile section)

One-shot jump hint key: `slopcast-analysis-open-section` (`"PRICING" | "SCHEDULE" | "SCALARS"`) is written before navigating to Scenarios and cleared after ScenarioDashboard consumes it.

### 3) Group selector upgrade (search + sort + health)

**Goal:** make it faster to find, compare, and trust a group.

- Dropdown adds:
  - Search input: “Search groups…” (case-insensitive filter by name)
  - Sort pills: `NPV` (desc), `ROI` (desc), `Payout` (asc; `<=0` treated as ∞), `CAPEX` (asc), `Name` (asc)
- Each option row shows:
  - Color dot + name
  - Compact metrics strip: NPV, ROI, Payout, CAPEX, Wells
  - Health badge `done/3` where done = (has wells, has CAPEX items, Qi > 0)

### 4) Drivers visual hierarchy + formatting rules

**Goal:** calmer, more scannable Drivers panel.

- Replace stacked bordered cards with a single list surface:
  - One `rounded-inner` container, rows use hover/selected background (no per-row borders).
  - Strict columns: `Driver | Impact bar | ΔNPV`.
- Formatting rules (within Drivers panel):
  - Always show explicit sign (`+` / `−`) and color.
  - Use consistent unit rendering: `MM` with a space (e.g. `+162.8 MM`).
  - Prefer Title Case section headers; reduce all-caps usage.

### 5) Mario background calming + reduced-motion notes

**Goal:** preserve vibe but reduce perceived density behind dense UI.

- Reduce opacity of Mario `.theme-atmo` overlays by ~30% in non-`fx-max`.
- Ensure reduced-motion preference disables any relevant animations (no-op if none exist for mario).

## Acceptance checklist / test matrix

### Manual UI verification (required)

After each major change (group selector, drivers refactor, narrative jump, focus mode, background):

1. `/slopcast`
2. Theme `slate`:
   - DESIGN → Economics → Drivers
   - Group dropdown: search + sort + select
   - Select each driver → verify details panel → CTA jump works
   - Toggle Focus on/off (and refresh to confirm persistence)
   - Switch to SCENARIOS and confirm accordion jump works
3. Theme `mario`: repeat the same
4. Mobile viewport: repeat key interactions (Focus + CTA jumps)

### Automated checks (must pass)

- `npm run ui:audit`
- `npm run ui:verify`
- `UI_OUT_DIR=artifacts/ui/before npm run ui:shots` (baseline)
- `UI_OUT_DIR=artifacts/ui/after npm run ui:shots` (post-change)
- `npm run build`

