# PDP / Undeveloped Workflow Overhaul Spec

Date: 2026-04-24

## Purpose

Slopcast currently has strong individual surfaces for wells, map selection, economics modules, and scenario sensitivity, but the workflow reads as several adjacent workbenches rather than one guided forecasting product. Navigation is split across `DESIGN`, `SCENARIOS`, `Wells`, `Economics`, mobile panel toggles, module cards, scenario chips, and theme controls. The result is powerful but cluttered: users can do the work, but they have to remember where each step lives.

This spec proposes a comprehensive IA and UX overhaul that splits the product into two forecast workflows:

- **PDP**: evaluate producing wells using historical production and third-party or user-owned forecast sources.
- **Undeveloped**: build development inventory from acreage / DSUs / selected wells, then assign type curves, spacing, schedule, and capital assumptions.

Both workflows use the same high-level flow and converge into a shared scenario workspace where global variables can sensitize the combined asset view.

## Product Thesis

The app should stop asking users to think in generic modules like "Wells" and "Economics" first. It should ask them what kind of asset work they are doing:

- **PDP**: "What producing wells are in my base, whose forecast do I trust, and what operating assumptions should I use?"
- **Undeveloped**: "What inventory can I develop, how do I space it, what type curve applies, and when/how fast do I drill it?"

The underlying model can still share wells, groups, scenarios, economics runs, and outputs. The UI should make the development type explicit because PDP and undeveloped workflows have different evidence, uncertainty, and user intent.

## Current App Observations

### Existing Structure

The current app is centered on `src/pages/SlopcastPage.tsx`, with:

- `PageHeader` for `HUB`, `DESIGN`, `SCENARIOS`, theme switching, and secondary `Wells` / `Economics` tabs.
- `MapCommandCenter` and `DesignWellsView` for well filtering, map selection, group management, and mobile alternatives.
- `DesignEconomicsView` for economics inputs, group context, scenario strip, modules, KPI strip, and operations guidance.
- `ScenarioDashboard` for scenario stack, global variables, sensitivity matrix, and portfolio charts.
- `useSlopcastWorkspace` as the orchestration hook for filters, groups, scenarios, active group, active scenario, layout, persistence, and derived metrics.

### Friction To Solve

- **Navigation hierarchy is indirect**: users move through `DESIGN -> Wells -> Economics -> SCENARIOS`, but the business workflow is really `select universe -> build asset set -> forecast/economics -> sensitize`.
- **Generic labels hide intent**: "Wells" and "Economics" mean different things for PDP vs undeveloped inventory.
- **Too many controls compete at the top**: app navigation, workflow navigation, status badges, and themes sit in the same visual band.
- **Scenario state is duplicated**: `DesignEconomicsView` receives `activeScenarioId` from workspace state, while `ScenarioDashboard` maintains its own local active scenario. A converged scenario workflow needs one source of truth.
- **Scenario dashboard feels disconnected**: it works as an analysis page, but it does not clearly show which PDP and undeveloped cases are feeding the global outputs.
- **Mobile has too much vertical work**: the current mobile UI uses panel toggles, but not a workflow-level frame that tells the user where they are and what comes next.

## Recommended Information Architecture

### Top-Level Shell

Replace the current `DESIGN` / `SCENARIOS` mental model with a project-level workflow shell:

1. **Project Home**
2. **PDP Workflow**
3. **Undeveloped Workflow**
4. **Scenarios**
5. **Outputs** (optional later phase)

The top app header should remain atmospheric and branded, but it should not carry every workflow control. Theme switching should move into a compact utility/menu area so the main navigation can focus on the economic workflow.

### Workflow Stage Grammar

PDP and Undeveloped should share the same stage grammar:

1. **Universe**
2. **Wells / Inventory**
3. **Forecast & Economics**
4. **Review**

The Scenarios workspace then sits outside both workflows:

1. **Scenarios**

This keeps the interface learnable while letting each stage adapt to the development type.

### Recommended Navigation Model

Use a persistent project header plus a workflow rail/stepper:

- **Primary nav**: `PDP`, `Undeveloped`, `Scenarios`
- **Secondary stage nav** inside PDP / Undeveloped: `Universe`, `Wells`, `Forecast & Economics`, `Review`
- **Persistent context strip**: active project, active workflow, selected group/inventory count, readiness status, active scenario.

This should replace parallel navigation models rather than adding another layer. `WorkflowStepper` already exists as a presentational component and should be promoted into the real shell.

## Workflow 1: PDP

### Job To Be Done

As an analyst evaluating existing production, I want to define a producing-well universe, choose the forecast source I trust for each well/group, normalize operating assumptions, and send a base PDP case into scenarios.

### Stage 1: PDP Universe

Purpose: pre-select the working dataset before entering the map/workspace.

Primary controls:

- Basin / county / operator / formation filters.
- Producing status filter defaults to `PRODUCING`.
- Production vintage, first-prod date, lateral length, and last-12-month volume filters.
- Forecast source availability filters: Enverus, Novi, S&P, user forecast, internal fit.
- Saved universe presets.

Recommended layout:

- Left: filter builder with progressive disclosure.
- Center/right: universe summary cards and distribution charts.
- Bottom or side: "Included wells" preview with count, producing mix, and data coverage.

Key UX behavior:

- The user should see "forecast source coverage" before selecting wells.
- Missing production or forecast data should be visible as a data quality warning, not discovered later in economics.
- Filters should be saveable as a named PDP universe.

### Stage 2: PDP Wells

Purpose: search, inspect, and group producing wells from the pre-filtered universe.

Primary controls:

- Map and table synchronized selection.
- Group creation by lasso, filter result, operator/formation, or manual selection.
- Forecast source badges per well.
- Production history quality / last production date indicators.
- Group comparison strip for selected groups.

Recommended layout:

- The current `MapCommandCenter` remains the base but should be PDP-aware.
- Filter controls become contextual overlays rather than a large duplicate panel.
- Group list should show PDP-specific fields: producing well count, last 12 months BOE, current gross/net production, forecast coverage, PDP reserve class.

What changes from today:

- "Scenarios / Groups" should become "PDP Groups".
- Selection actions should prioritize "Create PDP group", "Add to PDP group", and "Compare production".
- The map tooltip should show production/forecast source, not just header metadata.

### Stage 3: PDP Forecast & Economics

Purpose: assign forecast provenance and operating assumptions without forcing a type curve workflow.

Primary PDP modules:

- **Forecast Source**: Enverus, Novi Labs, S&P, user forecast, internal decline fit.
- **Forecast Normalization**: net/gross basis, product stream mapping, effective date, remaining life cutoff, terminal decline override.
- **LOE / OPEX**: fixed LOE, variable oil/gas costs, workover assumptions, escalation.
- **Ownership**: NRI, WI, burdens, overrides.
- **Taxes / Differentials**: severance, ad valorem, oil/gas differentials.
- **Reserves & Risk**: PDP reserve class, forecast confidence, data quality score.

Recommended layout:

- Replace `ProductionModule` with a PDP-specific `ForecastSourceModule`.
- Keep shared economics modules where they fit: OPEX, Ownership, Taxes.
- Hide or demote CAPEX for PDP by default. PDP CAPEX should exist only as optional maintenance/workover capital, not as a drilling AFE module.

Key UX behavior:

- The user should choose forecast source first, then assumptions.
- If multiple forecast sources exist, the UI should compare source NPV/EUR deltas before adoption.
- Every PDP forecast should display provenance: source, version/effective date, import timestamp, and override count.

### Stage 4: PDP Review

Purpose: validate that the PDP case is scenario-ready.

Review checklist:

- Universe definition saved.
- Every active PDP group has a forecast source.
- Forecast source coverage meets threshold.
- LOE/ownership/tax assumptions assigned.
- PDP economics calculated successfully.
- Data quality issues acknowledged.

Outputs:

- PDP base case NPV10, EUR, PDP reserves, current production, payout if relevant.
- Forecast source mix.
- Top risk flags: missing forecasts, stale production, high LOE, ownership gaps.

## Workflow 2: Undeveloped

### Job To Be Done

As an analyst evaluating undeveloped inventory, I want to define the acreage/well universe, create development units or inventory groups, assign spacing and type curve assumptions, model capital/schedule, and send development cases into scenarios.

### Stage 1: Undeveloped Universe

Purpose: pre-select the development area and available inputs before building DSUs/inventory.

Primary controls:

- Basin / county / operator / formation filters.
- Acreage boundaries, leases, DSUs, sections, and spacing units.
- Existing producing wells and offset analog wells.
- Permit / DUC / undeveloped status filters.
- Landing zone / bench filters.
- Optional development constraints: working interest area, lease expiry, surface constraints.

Recommended layout:

- Left: acreage and reservoir filters.
- Center: inventory opportunity summary.
- Right: analog well quality and acreage coverage.

Key UX behavior:

- The user should understand what acreage or development fairway they are working in before selecting inventory.
- Offset analog wells should be available but visually distinct from planned undeveloped inventory.

### Stage 2: Undeveloped Wells / Inventory

Purpose: create DSUs, planned wells, and development groupings.

Primary controls:

- Map-based DSU creation from selected acreage/sections.
- Planned well/stick generation inside DSUs.
- Spacing assumptions: inter-well spacing, lateral length, bench stacking, parent/child risk.
- Grouping by DSU, bench, phase, operator, acreage block, or development tranche.
- Inventory status: PUD, probable, possible, concept.

Recommended layout:

- Build on `MapCommandCenter`, but add a development mode toolbar:
  - Select acreage
  - Create DSU
  - Draw / generate sticks
  - Set spacing
  - Assign bench
  - Add to development group
- Use a right-side inspector for the selected DSU or planned well.
- Show existing producing wells as context, not as the primary selected object.

What changes from today:

- "Well group" becomes "Development group" or "DSU group" in this workflow.
- Selection actions should support acreage/DSU operations, not only existing well selection.
- Planned inventory should not be forced into the existing `Well` shape without an explicit type/model distinction.

### Stage 3: Undeveloped Forecast & Economics

Purpose: assign type curves, capital, schedule, spacing, and risk to planned inventory.

Primary undeveloped modules:

- **Type Curve**: choose existing TC, create TC, fit from analogs, import TC.
- **Spacing & Inventory**: well count, lateral length, bench, spacing, parent/child degradation.
- **CAPEX**: drilling/completion/facilities/equipment, per-well or per-foot, inflation/scalars.
- **Schedule**: rig count, phase sequencing, drill/stim timing, first production timing.
- **LOE / OPEX**: fixed and variable costs after first production.
- **Ownership**: NRI/WI and promoted/JV structures.
- **Taxes / Differentials**: shared with PDP where possible.
- **Risking**: PUD/probable/possible risk factor, execution risk, geologic risk.

Recommended layout:

- Keep the existing economics module pattern, but make modules workflow-specific.
- In Undeveloped, `ProductionModule` remains type-curve oriented.
- `CapexModule` and schedule controls should be elevated; they are core to development economics.
- Add a spacing/DSU module between Type Curve and CAPEX.

Key UX behavior:

- A type curve should be attachable at group, DSU, bench, or planned-well level.
- The UI should always show which inventory objects inherit an assumption and which have overrides.
- Scenario global variables can sensitize CAPEX and production, but base assumptions live here.

### Stage 4: Undeveloped Review

Purpose: validate that the development case is scenario-ready.

Review checklist:

- DSUs or development groups created.
- Planned wells/sticks have spacing and bench assignments.
- Type curve assigned or created.
- CAPEX and schedule assumptions assigned.
- LOE, ownership, taxes, and risk factors assigned.
- Economics calculated successfully.

Outputs:

- Development NPV10, IRR, EUR, total CAPEX, payout, inventory count.
- Type curve and spacing summary.
- Schedule summary: rig count, wells/year, capital by year.
- Risked and unrisked metrics.

## Shared Scenarios Workspace

### Purpose

Scenarios should become the convergence point for PDP and Undeveloped, not a disconnected third tab. It should answer:

- What is the value of PDP alone?
- What is the value of undeveloped inventory alone?
- What is the combined asset value?
- Which global assumptions move value the most?

### Scenario Inputs

Scenarios should sensitize global variables across one or both workflows:

- Commodity prices: oil, gas, NGLs if added.
- Differentials and escalation.
- CAPEX scalar.
- LOE scalar.
- Production / EUR scalar.
- Rig count and schedule pace.
- Development start date.
- Risk factor scalars.
- Optional forecast source switch for PDP, if multiple sources are loaded.

### Scenario Structure

Each scenario should define:

- Name, color, description.
- Included workflows: PDP, Undeveloped, or both.
- Global variable overrides.
- Schedule / rig assumptions for undeveloped.
- PDP forecast source or source preference rules where relevant.
- Output metrics by workflow and combined portfolio.

### Recommended Layout

Use a three-region scenario workspace:

1. **Scenario Stack**
  - Base case, upside, downside, custom scenarios.
  - Each card shows included workflows and headline NPV.
2. **Scenario Builder**
  - Global assumption controls.
  - Variable groups: Pricing, Schedule, CAPEX, Production, Risk, Costs.
  - Clear "applies to PDP", "applies to Undeveloped", or "applies to both" labels.
3. **Scenario Results**
  - PDP / Undeveloped / Combined metric cards.
  - Sensitivity matrix.
  - Value bridge from base case.
  - Cash flow overlay.

### Critical State Change

`activeScenarioId` should be lifted into one source of truth in `useSlopcastWorkspace` and passed into both economics and scenarios views. `ScenarioDashboard` should not maintain a separate local active scenario.

## Data Model Implications

The current `WellGroup` model is a useful starting point but is doing too much for a workflow split. The overhaul should introduce explicit workflow-aware entities while preserving shared economics inputs.

### Proposed Concepts

```ts
type DevelopmentType = 'PDP' | 'UNDEVELOPED';

interface ForecastCase {
  id: string;
  name: string;
  developmentType: DevelopmentType;
  universeId: string;
  groupIds: string[];
  readiness: 'DRAFT' | 'NEEDS_INPUTS' | 'READY' | 'ERROR';
}

interface UniverseDefinition {
  id: string;
  developmentType: DevelopmentType;
  name: string;
  filters: Record<string, unknown>;
  savedAt: string;
}

interface PdpGroupAssumptions {
  forecastSourceId: string;
  forecastSourceType: 'ENVERUS' | 'NOVI' | 'SP' | 'USER' | 'INTERNAL_FIT';
  normalization: Record<string, unknown>;
}

interface DevelopmentInventoryGroup {
  id: string;
  dsuIds: string[];
  plannedWellIds: string[];
  spacingAssumptions: Record<string, unknown>;
  typeCurveId: string;
}
```

These names are illustrative. The implementation should align with `src/types.ts`, Supabase schema, and persistence boundaries.

### Forecast Source Model

PDP needs first-class forecast provenance:

- Source type.
- Source entity ID.
- Version/effective date.
- Import timestamp.
- Forecast stream coverage.
- Override count.
- Confidence/data quality score.

### Planned Inventory Model

Undeveloped needs a distinction between existing wells and planned wells:

- Existing wells remain `Well`.
- Planned wells should have their own type with geometry, bench, spacing, status, and parent DSU.
- DSUs should have acreage/geometry, bench inventory, spacing configuration, and assigned group.

## UX Principles

### 1. Development Type First

Every screen should communicate whether the user is working PDP, Undeveloped, or Scenarios. Avoid generic labels where a workflow-specific term is clearer.

### 2. Shared Pattern, Different Inputs

PDP and Undeveloped should feel like sibling workflows, not separate apps. The stage sequence, readiness model, and review pattern should match, while the actual inputs differ.

### 3. Provenance Over Mystery

Forecasts and assumptions must always show where they came from. This matters more in PDP than a prettier curve editor.

### 4. Assumption Inheritance Must Be Visible

Users need to know whether an assumption applies to a case, group, DSU, planned well, or individual well. Overrides should be visible and reversible.

### 5. Scenarios Are Global, Base Inputs Are Local

Workflow screens define base assumptions. Scenario screens apply global overrides and sensitivities. Avoid editing base PDP/Undeveloped assumptions from the scenario page unless the user explicitly promotes a scenario back into the base case.

## Visual / Interaction Recommendations

### Header

- Keep branding, but reduce the number of primary buttons.
- Move theme selection into a compact utility menu or secondary tray.
- Replace `DESIGN` / `SCENARIOS` with `PDP`, `Undeveloped`, `Scenarios`.
- Use a persistent project context strip below the header.

### Stage Stepper

- Promote `WorkflowStepper` into the real app shell.
- Show stage readiness with clear labels: `Needs universe`, `Needs forecast`, `Ready for scenarios`.
- On mobile, make the stepper sticky and compact.

### Map

- Keep the cinematic command-center feel.
- Add workflow mode tools:
  - PDP: production/forecast source, data quality, PDP group assignment.
  - Undeveloped: DSU creation, planned well generation, spacing, bench assignment.
- Avoid showing every filter and action at once; expose the next likely action based on selection state.

### Economics

- Replace the single generic module list with workflow-specific modules.
- Keep common modules visually consistent across workflows.
- Use the context rail to show workflow-specific KPIs:
  - PDP: current production, PDP EUR, forecast coverage.
  - Undeveloped: inventory count, CAPEX, wells/year, unrisked/risked NPV.

### Scenarios

- Show PDP, Undeveloped, and Combined results side by side.
- Add a value bridge for "what changed from base".
- Make every global control declare its target workflow.
- Keep sensitivity matrix, but make the selected base scenario and included workflows obvious.

## Recommended Implementation Phases

### Phase 1: Workflow Shell And State Consolidation

Scope:

- Introduce workflow-level state: active workflow, active stage, active scenario.
- Replace or wrap current `DESIGN` / `SCENARIOS` navigation with `PDP`, `Undeveloped`, `Scenarios`.
- Promote a real workflow stepper.
- Remove duplicated scenario active state.

Acceptance criteria:

- User can switch between PDP, Undeveloped, and Scenarios from the primary nav.
- PDP and Undeveloped each show the same stage sequence.
- Active scenario is shared between economics and scenarios.
- Reload restores active workflow, stage, and scenario.

### Phase 2: PDP Workflow Thin Slice

Scope:

- PDP Universe page using current well filters plus PDP-specific defaults.
- PDP Wells page reusing `MapCommandCenter` with PDP labels and source badges.
- PDP Forecast & Economics page with forecast source selection and shared LOE/Ownership/Taxes modules.
- PDP Review readiness checklist.

Acceptance criteria:

- User can create a PDP case from producing wells.
- User can assign a forecast source to a PDP group.
- Type curve editing is not the primary PDP path.
- PDP case contributes metrics to Scenarios.

### Phase 3: Undeveloped Workflow Thin Slice

Scope:

- Undeveloped Universe page using existing filters plus acreage/inventory framing.
- Undeveloped map mode for development groups.
- Type curve, spacing, CAPEX, schedule, LOE, ownership, taxes modules.
- Undeveloped Review readiness checklist.

Acceptance criteria:

- User can create an undeveloped inventory group.
- User can assign type curve, spacing, CAPEX, and schedule assumptions.
- Undeveloped case contributes metrics to Scenarios.
- Scenario CAPEX/production/schedule scalars affect undeveloped outputs.

### Phase 4: Scenario Convergence

Scope:

- Redesign `ScenarioDashboard` around PDP / Undeveloped / Combined results.
- Add included-workflow controls per scenario.
- Add global variable targets.
- Add value bridge and improved sensitivity framing.

Acceptance criteria:

- User can sensitize PDP alone, Undeveloped alone, or combined case.
- Scenario cards clearly show included workflows.
- Combined NPV reconciles to PDP + Undeveloped contributions.
- Scenario outputs make it obvious which variables changed.

### Phase 5: Persistence And Reporting

Scope:

- Persist workflow state, universe definitions, forecast source selections, DSUs/planned wells, and scenario targets.
- Add audit/version history for assumption changes.
- Prepare outputs/reporting surfaces.

Acceptance criteria:

- User can close and reopen a project without losing workflow position or assumptions.
- Forecast provenance and scenario overrides are saved.
- Review pages and scenario outputs can support future PDF/deck export.

## First Slice Recommendation

Start with **Phase 1 + a minimal PDP slice**.

Reason:

- It directly addresses the current clutter by changing the navigation model.
- PDP can be implemented without solving full DSU geometry first.
- Forecast source selection creates immediate product differentiation from the current type-curve-only mental model.
- It creates the scenario-state foundation required for the combined future workflow.

First shippable version:

- Primary nav: `PDP`, `Undeveloped`, `Scenarios`.
- PDP stages: `Universe`, `Wells`, `Forecast & Economics`, `Review`.
- Undeveloped stages visible but partially gated with intentional "coming next" empty states.
- PDP Forecast Source module supports `User`, `Enverus`, `Novi`, and `S&P` as selectable sources using local source metadata until real integrations are wired.
- Scenarios shows PDP contribution and keeps active scenario in shared state.

## Success Metrics

- Users can explain where they are in the workflow without reading docs.
- The number of top-level visible buttons in the header is reduced.
- A PDP user can complete a producing-well forecast path without touching type curve controls.
- An undeveloped user can understand where DSU / spacing / type curve / CAPEX assumptions belong.
- Scenario outputs clearly separate PDP, Undeveloped, and Combined value.
- Mobile users always have a visible workflow/stage context.

## Risks And Guardrails

- **Risk: adding a new nav layer without removing old ones.** Guardrail: retire or hide `DESIGN` / `Wells` / `Economics` labels once workflow nav exists.
- **Risk: forcing PDP and Undeveloped into one over-generic component.** Guardrail: share stage shell and common modules, but allow workflow-specific modules.
- **Risk: data model churn.** Guardrail: create adapter layers around current `WellGroup` before large persistence migrations.
- **Risk: scenario ambiguity.** Guardrail: scenario controls must label whether they apply to PDP, Undeveloped, or both.
- **Risk: undeveloped geometry becomes too large for the first pass.** Guardrail: ship development groups and interim planned-inventory records before full DSU editing.

## Open Product Decisions

- Should PDP and Undeveloped be separate saved cases inside one deal, or separate project types that only combine at Scenarios?
- Which PDP forecast source should be treated as the default when multiple are available?
- Should user-uploaded PDP forecasts be supported in the first PDP slice, or should the first version use manually entered/source-labeled curves?
- Should DSU creation be map-first from day one, or initially represented as structured inventory groups with geometry added later?
- Should Scenarios support promoting a scenario back into base assumptions?

## File Areas Likely Affected

- `src/pages/SlopcastPage.tsx`
- `src/hooks/useSlopcastWorkspace.ts`
- `src/types.ts`
- `src/components/slopcast/PageHeader.tsx`
- `src/components/slopcast/WorkflowStepper.tsx`
- `src/components/slopcast/MapCommandCenter.tsx`
- `src/components/slopcast/DesignWellsView.tsx`
- `src/components/slopcast/DesignEconomicsView.tsx`
- `src/components/slopcast/economics/`*
- `src/components/ScenarioDashboard.tsx`
- `src/components/SensitivityMatrix.tsx`
- `src/components/slopcast/hooks/useProjectPersistence.ts`
- `src/services/projectRepository.ts`

## Summary

The strongest version of this idea is not simply "two tabs for PDP and Undeveloped." It is a workflow reset: choose the development type first, guide users through the same stage grammar, tailor each stage to the economic reality of that development type, then converge both cases into one scenario engine.

PDP should become a provenance-led producing-well forecast workflow. Undeveloped should become an inventory, spacing, type curve, capital, and schedule workflow. Scenarios should become the portfolio control room where both are sensitized together.