# Slopcast Feature Ideas

A curated list of additions and features that complement what Slopcast already does well. Organized by category, from high-leverage quick wins to larger strategic bets.

---

## 1. Data & Analytics Upgrades

### Real Production Data Integration
Replace or supplement the 40-well `MOCK_WELLS` dataset with a live connection to public well data (e.g., Enverus/DrillingInfo API, Texas RRC, NM OCD). Let users search by county, section, or API number and pull actual laterals, IPs, and decline histories into their groups.

### Type Curve Auto-Fit
Given a set of selected wells with production history, auto-fit the Arps decline parameters (qi, b, di) via least-squares regression against real data. Display the fitted curve overlaid on actuals so users can see the quality of fit before adopting it.

### Gas Economics (NGL Yield, Shrinkage)
The `gorMcfPerBbl` field exists but gas economics are minimal. Add NGL yield (bbl/MMcf), shrinkage factor, and separate NGL pricing to the commodity assumptions. This would make the model realistic for wet-gas/condensate plays beyond the Permian.

### Monte Carlo Simulation
Add a probabilistic mode that runs N iterations with distributions around key inputs (qi, oil price, CAPEX) and outputs P10/P50/P90 NPV distributions as a histogram or CDF chart. The sensitivity matrix is a good start -- this takes it to the next level.

---

## 2. Map & Visualization Enhancements

### Real Basemap with Pan/Zoom
Swap the static OpenStreetMap tile for an interactive map layer (Mapbox GL JS or Deck.gl). Enable pan, zoom, satellite imagery toggle, and well-pad-level detail. The D3 overlay for wells can remain on top.

### Well Spacing & Section Grid Overlay
Draw section lines (1-mile grid), township/range labels, and lateral sticks on the map. This helps users visually assess spacing assumptions and identify infill opportunities.

### Heatmap Layer
Add a toggle to render a heatmap of well density, EUR per lateral foot, or NPV by location. This immediately highlights the "sweet spot" in a basin.

### Geospatial Lasso Improvements
Add a "rectangle select" tool alongside the freehand lasso, and a "select by formation" quick-filter that highlights wells on the map by color-coded formation.

---

## 3. Collaboration & Workflow

### Project Sharing & Role-Based Access
The `project_members` table and roles (`owner`, `editor`, `viewer`) exist in the schema but aren't wired up in the UI. Build out invite-by-email, a members list panel, and role-based permission guards so teams can share projects.

### Audit Log / Version History
Track every change to groups, scenarios, and assumptions with a timestamped log. Let users revert to any previous snapshot. The `economics_runs` table already stores run history -- extend this to a full changelog.

### Comments & Annotations
Let users attach notes to specific wells, groups, or scenarios. Useful for investment committee reviews ("This well has high water cut risk") or field team coordination.

---

## 4. Economics Engine

### Reserves Booking (SEC/PRMS Categories)
Classify wells into Proved Developed Producing (PDP), Proved Undeveloped (PUD), and Probable/Possible buckets. Roll up reserves by category with appropriate risk factors applied to each.

### Tax & Fiscal Modeling
Add a simplified tax layer: severance tax rates by state, ad valorem taxes, and federal income tax with depletion allowance. This gets the model closer to after-tax cash flow that decision-makers actually use.

### Waterfall Chart for Value Bridge
Show a waterfall chart that decomposes NPV change from one scenario to another: "Price impact: +$12MM, CAPEX impact: -$3MM, Production impact: +$5MM." The driver shocks already compute the deltas -- this is a visualization upgrade.

### Debt / Leverage Module
Add an optional capital structure layer: revolver draw, term loan, interest expense, and cash sweep. Output levered returns and debt coverage ratios alongside the unlevered metrics.

---

## 5. AI & Intelligence

### Gemini Deal Memo Generator
Expand the existing Gemini integration beyond the single-prompt analysis. Generate a full 1-page investment memo with sections: Executive Summary, Subsurface Risk, Economics Summary, Comparable Transactions, and Recommendation. Export as PDF.

### Natural Language Scenario Builder
Let users type "What if oil drops to $55 and we cut rigs to 1?" and have Gemini parse it into scenario parameter adjustments that auto-populate the scenario dashboard.

### Anomaly Detection
Flag wells or groups that deviate significantly from the type curve, have unusual cost structures, or show metrics that are statistical outliers compared to the portfolio.

---

## 6. UX & Polish

### Onboarding Tour / Guided Setup
First-time users see a step-by-step walkthrough overlay explaining the Setup -> Select -> Review workflow. The `WorkflowStepper` component already tracks progress -- add tooltip popovers for each step.

### Keyboard Shortcuts
Power users want speed: `Cmd+1`/`Cmd+2` to switch Wells/Economics workspaces, `Cmd+S` to snapshot, `Cmd+E` to export, `A` to select all visible wells, `Esc` to clear selection.

### Dark/Light Mode per Theme
Some themes (especially Slate) could offer a light variant for users who work in bright environments or need higher contrast for presentations.

### Dashboard KPI Sparklines
Add inline sparklines next to the KPI cards (NPV, CAPEX, EUR, Payout) showing how the value trends across the last N snapshots. This gives a sense of trajectory as users iterate.

### Mobile-Optimized Scenario Cards
The scenario dashboard is desktop-oriented. Add swipeable scenario cards for mobile with key metrics front-and-center and drill-down on tap.

---

## 7. Export & Reporting

### PDF Report Builder
Generate a formatted multi-page PDF report with: cover page, map screenshot, KPI summary, production/cash flow charts, sensitivity matrix, and driver analysis. Branded with the active theme's color palette.

### PowerPoint Export
Export a presentation-ready deck with one slide per section (map, economics, scenarios). Useful for investment committee or board presentations.

### API Endpoint for External Consumption
Expose a REST API (or even just a JSON export) of project economics so other tools (Excel models, BI dashboards, internal apps) can pull Slopcast results programmatically.

---

## 8. Coming-Soon Modules (Hub Page)

The Hub already teases three upcoming modules. Here's what they could actually do:

### Flowline (Production Telemetry)
Real-time production monitoring dashboard: daily oil/gas/water volumes, runtime %, downtime alerts, artificial lift performance. Connect to SCADA or OFM data feeds.

### HedgeLab (Hedge Strategy)
Model collar, swap, and put option strategies against the forward curve. Show hedged vs. unhedged cash flow and mark-to-market P&L. Integrates with Slopcast scenarios as the "base exposure."

### CapexForge (Cost Templates)
AACE-aligned cost estimate templates with historical benchmarking. Auto-populate AFE line items from Slopcast group CAPEX assumptions. Generate sanction-ready memo PDFs.

---

## Priority Recommendation

If I were picking the highest-impact features to build next:

1. **Project Sharing** -- the schema is already there; wiring it up unlocks team use
2. **Interactive Map** -- biggest visual upgrade, makes well selection intuitive
3. **Type Curve Auto-Fit** -- bridges the gap between mock data and real-world analysis
4. **Waterfall Chart** -- the data already exists in the driver analysis; purely a viz addition
5. **Keyboard Shortcuts** -- cheap to build, big UX improvement for power users
