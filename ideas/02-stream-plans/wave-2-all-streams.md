# Wave 2 Stream Plans: Screens & Assumption Builder

---

## Stream 4: Map Enhancement & Mode System

**Agent:** `map-agent` | **Depends on:** Streams 1, 2 | **~4 hours**

### Files Owned
- `src/components/slopcast/MapCommandCenter.tsx`
- `src/components/slopcast/map/OverlayFiltersBar.tsx`
- `src/components/slopcast/map/OverlayToolbar.tsx`
- `src/hooks/useViewportData.ts`

### Tasks
1. Add `mode: TrackKind` prop to `MapCommandCenter`
2. Mode-aware data layers: PDP shows PRODUCING/SHUT_IN/TA; Undev shows acreage/constraints/permits
3. Mode-aware primary CTA: PDP = "Add to PDP Group", Undev = "Add to Program"
4. Anti-clutter: filters collapse by default with active badge, layer toggles in single popover, export in overflow menu
5. Extract layer management + style switching into `useMapLayers` sub-hook (prerequisite for the 905-line component refactor)
6. PDP overlays: status differentiation (active vs shut-in vs TA), ownership hover data
7. Undev: stub `onCreateDsu` callback prop for polygon draw integration (Stream 6 implements the actual draw tools)

### Acceptance Criteria
- [ ] MapCommandCenter accepts and responds to `mode` prop
- [ ] PDP mode shows producing wells, Undev mode shows acreage context
- [ ] Filters collapse by default
- [ ] Component refactored below 700 lines
- [ ] No visual regressions in existing map behavior

---

## Stream 5: PDP Track Screens

**Agent:** `pdp-agent` | **Depends on:** Streams 1, 2, 3 | **~5 hours**

### Files Owned (all new)
- `src/components/slopcast/pdp/PdpWellsView.tsx` — wraps MapCommandCenter in PDP mode
- `src/components/slopcast/pdp/PdpForecastView.tsx` — PDP economics/forecast screen
- `src/components/slopcast/pdp/ForecastSourcePicker.tsx` — per-well/bulk vendor picker
- `src/components/slopcast/pdp/ForecastReconciliation.tsx` — multi-vendor overlay comparison
- `src/components/slopcast/pdp/EconomicLimitControls.tsx` — rate/cashflow/date abandonment

### Tasks
1. **PdpWellsView**: Render MapCommandCenter with `mode="PDP"`. Add PDP-specific toolbar: forecast availability indicator, status overlay toggles. Selection builds a PDP group.
2. **PdpForecastView**: New economics screen for PDP. Sections:
   - Forecast source picker (per-well or bulk-assign from vendor list)
   - Forecast adjustment (±% miss factor slider, rate floor)
   - LOE (reuse existing `OpexControls`)
   - Ownership (reuse existing `OwnershipControls`)
   - Economic limit controls (rate/cashflow/date with per-well overrides)
   - Progressive disclosure: 5 default fields, rest behind "Advanced" expander
3. **ForecastReconciliation**: Side-by-side or overlay of multiple vendor forecasts for the same well. Recharts overlay chart. "Pick winner" action per well.
4. **EconomicLimitControls**: Three-mode selector (rate-based, cashflow-based, date-based). Threshold input. Per-well override toggle.

### Acceptance Criteria
- [ ] PDP Wells screen renders with map in PDP mode
- [ ] PDP Forecast screen has all required sections
- [ ] Forecast source picker works (mock vendor data is fine)
- [ ] Progressive disclosure hides advanced fields by default
- [ ] Output: group with forecast assignments, LOE, ownership, economic limit

---

## Stream 6: Undev Track Screens

**Agent:** `undev-agent` | **Depends on:** Streams 1, 2, 3, 4 | **~6 hours**

### Files Owned (all new)
- `src/components/slopcast/undev/UndevWellsView.tsx` — map in Undev mode + DSU tools
- `src/components/slopcast/undev/DsuCreationTools.tsx` — polygon draw, auto-generate, snap
- `src/components/slopcast/undev/UndevEconomicsView.tsx` — TC assignment, capex, schedule
- `src/components/slopcast/undev/TypeCurveLibrary.tsx` — browse/search/assign TCs
- `src/components/slopcast/undev/SpacingControls.tsx` — spacing template + degradation
- `src/components/slopcast/undev/ScheduleEditor.tsx` — rig count, drill order, cycle time

### Tasks
1. **UndevWellsView**: MapCommandCenter in Undev mode. Existing wells shown as non-selectable constraints. DSU creation panel on the right.
2. **DsuCreationTools**: Integrate Mapbox GL Draw (or custom polygon draw). Section grid auto-generation from viewport. Bench stacking UI per DSU. Spacing template application. Inventory summary (DSU count, locations, lateral footage). Conflict detection (overlap warnings).
3. **UndevEconomicsView**: Sections:
   - Type curve library browser (list/search/assign per DSU+bench)
   - Lateral length scaling (linear/sub-linear/capped selector)
   - Spacing degradation (from assumption library or manual input)
   - CAPEX (reuse CapexControls with Undev defaults, add per-foot scaling)
   - Schedule (rig count, wells/rig/year, drill order, start date)
   - LOE + Ownership (reuse existing controls with Undev defaults)
4. **TypeCurveLibrary**: List view of saved assumptions (from assumption_library). Filter by type, formation, vintage. Show staleness indicators. Assign to DSU+bench with drag or click.

### Acceptance Criteria
- [ ] DSU polygons can be drawn on the map
- [ ] Bench stacking UI works per DSU
- [ ] TC library lists available assumptions (mock data fine for v1)
- [ ] TC can be assigned per DSU+bench
- [ ] Schedule editor produces rig count + drill order
- [ ] Output: Undev program with DSUs, TCs, CAPEX, schedule

---

## Stream 7: Scenario Enhancement

**Agent:** `scenario-agent` | **Depends on:** Streams 1, 2 | **~3 hours**

### Files Owned
- `src/components/ScenarioDashboard.tsx`
- `src/hooks/useScenarioAnalysis.ts`
- `src/components/slopcast/ScenarioEditForm.tsx`

### Tasks
1. Extend `ScenarioEditForm` with `ScenarioVariable` wrapper: each field renders as single value with "Split" toggle. When split, shows PDP + Undev override inputs.
2. Add price deck selector: strip (monthly forward curve) vs flat vs custom. Strip prices input as a small table/chart.
3. Add discount rate as a sensitizable variable (currently hardcoded at 10%).
4. Side-by-side results view: PDP column | Undev column | Totals column. Toggle between combined and side-by-side via segmented control.
5. Update `useScenarioAnalysis` to apply per-track overrides when `splitByTrack` is true.

### Acceptance Criteria
- [ ] Split toggle appears on each scenario variable
- [ ] When split, PDP and Undev fields render with independent values
- [ ] Price deck selector works (flat at minimum)
- [ ] Side-by-side results view renders with PDP/Undev/Total columns
- [ ] Economics recalculate correctly with per-track overrides

---

## Stream 9: Assumption Builder

**Agent:** `builder-agent` | **Depends on:** Streams 1, 8, 10, 11 | **~5 hours**

### Files Owned (all new)
- `src/components/slopcast/wine-rack/AssumptionBuilder.tsx` — right panel in build mode
- `src/components/slopcast/wine-rack/BuildModeOverlay.tsx` — visual mode indicator
- `src/components/slopcast/wine-rack/CoherenceIndicator.tsx` — 3-bar quality scorer
- `src/components/slopcast/wine-rack/TypeCurveFitTab.tsx` — fit chart + parameter knobs
- `src/components/slopcast/wine-rack/LoeFitTab.tsx` — LOE decomposition UI
- `src/components/slopcast/wine-rack/SpacingDegradationTab.tsx` — degradation analysis UI
- `src/components/slopcast/wine-rack/AssumptionLibrary.tsx` — library browser + save/refresh

### Tasks
1. **Build mode toggle**: Button on WineRackControls toolbar. Toggles `BuilderMode` state. Visual indicators: background tint, panel swap, instruction strip.
2. **Selection in rack**: Adapt D3 lasso from MapVisualizer for rack coordinate space. Click-to-add. Quick actions: "select all in bench", "select within DSU".
3. **Selection summary**: Well count, avg lateral, vintage range, bench breakdown. Live updates.
4. **CoherenceIndicator**: Three small bars (lateral length variance, vintage spread, bench mix). Color-coded green/yellow/red. Hover for explanation + fix suggestion. Calls coherence scoring from backend (Stream 11).
5. **TypeCurveFitTab**: Small Recharts chart showing normalized production with Arps fit overlay. P10/P50/P90 shading. Manual sliders for qi, Di, b, Dmin with live residual. Lateral length normalization toggle. Calls `POST /api/fit/type-curve` from backend.
6. **LoeFitTab**: Pull LOE history via backend. Fixed/variable decomposition display. Distribution histogram with percentile markers. Picker for percentile or custom value.
7. **SpacingDegradationTab**: Co-development detection display (which wells are co-developed). Production ratio scatter plot. Degradation curve fit. Calls `POST /api/analysis/spacing`.
8. **Save with provenance**: Name input, tag input. Saves AnalogBackedAssumption with well IDs, filter snapshot, fit metadata. Toast + "jump to Undev econ" option.
9. **AssumptionLibrary**: List view with staleness badges. "Refresh" button per assumption. "View analogs" opens rack with original selection. Cross-assumption analog overlap.

### Acceptance Criteria
- [ ] Build mode toggles visual state of the rack
- [ ] Lasso selects wells in rack coordinates
- [ ] Coherence scores display correctly for diverse selections
- [ ] TC fit runs and displays Arps curve overlay
- [ ] Save produces AnalogBackedAssumption with provenance fields
- [ ] Library lists saved assumptions with staleness indicators
- [ ] "View analogs" round-trip highlights original selection in rack
