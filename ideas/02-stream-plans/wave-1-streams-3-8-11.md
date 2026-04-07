# Wave 1 Stream Plans: Navigation, Wine Rack Renderer, Backend Fit

---

## Stream 3: Navigation & Stage System

**Agent:** `nav-agent` | **Depends on:** Streams 1, 2 | **~3 hours**

### Files Owned
- `src/App.tsx`, `src/pages/SlopcastPage.tsx`, `src/components/slopcast/PageHeader.tsx`
- `src/components/layout/Sidebar.tsx`, `src/components/slopcast/DesignWorkspaceTabs.tsx`

### Tasks
1. Wire existing `Sidebar` into `SlopcastPage` layout (it already has collapse state, group tree)
2. Redesign `SidebarNav` as stage pipeline with completion indicators from `useStageNavigation`
3. Add stage-driven conditional rendering in `SlopcastPage` (replace viewMode/designWorkspace switching with `currentStage`-based rendering)
4. Add `WellsViewMode` sub-nav (MAP | TABLE | WINE_RACK) within PDP/Undev wells screens
5. Keep backward compat: existing WELLS/ECONOMICS tabs still work as fallback if stages aren't initialized

### Acceptance Criteria
- [ ] Sidebar renders in SlopcastPage with stage pipeline
- [ ] Stage indicators show empty/in-progress/complete states
- [ ] Clicking a stage navigates to it (if allowed by `canNavigateTo`)
- [ ] View mode switcher (MAP/TABLE/WINE_RACK) renders within wells screens
- [ ] App still compiles and renders existing views

---

## Stream 8: Wine Rack Renderer

**Agent:** `renderer-agent` | **Depends on:** Stream 1 only (uses mock data) | **~5 hours**

### Files Owned (all new)
- `src/components/slopcast/wine-rack/WineRackView.tsx` — container with controls + renderer
- `src/components/slopcast/wine-rack/WineRackRenderer.tsx` — D3 + React SVG cross-section
- `src/components/slopcast/wine-rack/ProjectionEngine.ts` — coordinate projection logic
- `src/components/slopcast/wine-rack/VariableEncodingPanel.tsx` — channel mapper dropdowns
- `src/components/slopcast/wine-rack/BenchBands.tsx` — horizontal formation bands
- `src/components/slopcast/wine-rack/WellBar.tsx` — individual well bar component
- `src/components/slopcast/wine-rack/WineRackControls.tsx` — toolbar (projection, toggles)
- `src/components/slopcast/wine-rack/WineRack.stories.tsx` — Storybook story

### Tasks
1. **ProjectionEngine**: Three modes — average azimuth (compute from trajectory heel→toe), user-drawn line (accept line segment, project wells onto it), surface X sort (sort by longitude, ignore spatial distance)
2. **WineRackRenderer**: D3 `scaleLinear` for Y (TVD, increasing down) and X (projected position). `d3.zoom` for pan/zoom. SVG `<rect>` for well bars, `<rect>` with low opacity for bench bands. Depth ruler on left, bench labels on right.
3. **WellBar**: Horizontal bar — length = lateral length (scaled), vertical position = TVD, toe/heel taper indicator. Accepts color, thickness, opacity, outline from encoding. Hover → tooltip card. Click → pin well (propagate to `selectedWellIds`).
4. **BenchBands**: Render from bench definitions (from backend or static reference). Faint horizontal bands with formation labels.
5. **VariableEncodingPanel**: 5 dropdown rows (color, thickness, opacity, outline, label) each selecting from well attributes. D3 color scales: `scaleSequential` for continuous, `scaleOrdinal` for categorical.
6. **WineRackControls**: Projection mode selector, toggle switches (parent/child connectors, vintage gradient, spacing annotations), inset mini-map.
7. **Storybook story**: Render with mock wells (40 Permian Basin wells from constants.ts). Demonstrate all three projection modes and variable encoding.
8. **Performance**: For >200 wells, batch SVG updates. Stub Canvas rendering path for >500 wells.

### Key Implementation Notes
- Use existing `selectedWellIds` + `handleSelectWells` from `useWellSelection` — the rack is a third consumer alongside map and table
- D3 lasso pattern from `MapVisualizer.tsx` can be adapted for rack coordinate space
- Adapt `MiniMapPreview` component for the inset projection line display
- All well data comes from props (the parent decides whether to use mock or live data)

### Acceptance Criteria
- [ ] Storybook story renders 40 mock wells as horizontal bars at correct TVD
- [ ] Bench bands display behind wells with formation labels
- [ ] All 3 projection modes produce different X layouts
- [ ] Variable encoding changes bar color/thickness/opacity in real-time
- [ ] Zoom/pan works smoothly
- [ ] Hover shows tooltip, click pins well
- [ ] `npx tsc --noEmit` passes

---

## Stream 11: Backend — Fit & Analysis Endpoints

**Agent:** `fit-agent` | **Depends on:** Stream 10 | **~4 hours**

### Files Owned (all new)
- `backend/fit_models.py` — Pydantic request/response models
- `backend/fit_service.py` — Curve fitting + analysis logic
- `backend/fit_routes.py` — FastAPI router

### Tasks
1. **Move decline functions** from `playground/decline_multiseg.py` to `backend/fit_service.py`
2. **Type curve fitting** (`POST /api/fit/type-curve`): Accept well IDs + options. Fetch production via Stream 10's service. Normalize by lateral length if requested. Fit Arps params (qi, Di, b) via `scipy.optimize.curve_fit`. Return params + R² + P10/P50/P90 EUR.
3. **LOE decomposition** (`POST /api/fit/loe`): Accept well IDs. Fetch operating expense history (or derive from production + cost assumptions). Simple regression to split fixed $/well/month from variable $/boe. Return distribution stats (P10-P90).
4. **Spacing degradation** (`POST /api/analysis/spacing`): Accept well IDs + distance/time config. Use trajectory data to compute inter-well distances. Identify co-developed wells (same bench, within distance/time window). Compute production ratio vs standalone average. Fit degradation curve. Return breakpoints + function params.
5. **Assumption CRUD** (`POST/GET/PUT/DELETE /api/assumptions`): Store/retrieve AnalogBackedAssumption objects. Use in-memory dict for now (Supabase integration in Wave 3). Include staleness check (flag if data_through_date > 6 months old).
6. **Coherence scoring** (utility in fit_service): Given a set of well IDs, compute lateral length CV, vintage range, bench count → return green/yellow/red per dimension.

### Acceptance Criteria
- [ ] `POST /api/fit/type-curve` returns valid Arps params for test well set
- [ ] R² and EUR P50 are reasonable for synthetic data
- [ ] `POST /api/fit/loe` returns fixed/variable split
- [ ] `POST /api/analysis/spacing` returns degradation breakpoints
- [ ] CRUD endpoints work for assumption objects
- [ ] Coherence endpoint returns scored dimensions
- [ ] All endpoints handle mock data gracefully
