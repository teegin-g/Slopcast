# Economics UI Declutter Plan

## Purpose

- This document plans a focused redesign of the Design > Economics screen.
- It is based on the user's stated intent, the current React component structure, and the available screenshots.
- It applies the `critique` skill as a design-director audit.
- It applies the `frontend-design` skill as the production UI direction.
- It is intentionally implementation-oriented.
- It should guide a future coding pass without requiring another strategy session.
- It does not prescribe a decorative restyle.
- It prescribes a hierarchy and information architecture correction.
- The goal is to make the economics workspace feel calmer, more usable, and more obviously analytical.
- The goal is not to make the existing cards smaller everywhere.
- The goal is to remove redundant surfaces so the remaining controls can breathe.
- The current UI feels cluttered because too many regions are trying to answer the same question.
- The core product question should be: "For this selected group and scenario, what assumptions drive economics?"
- Every surface on the economics screen should support that question.
- Any surface that answers a different question should move elsewhere or collapse behind intent.
- Any surface that repeats the same answer should be deleted or merged.

## Executive Summary

- The root cause is not the pill/card style itself.
- The root cause is unresolved information architecture.
- The current screen has competing scopes.
- The current screen mixes group context, scenario context, module navigation, portfolio metrics, and editable assumptions.
- These are all visually loud.
- They are all persistent.
- They are all close together.
- They do not clearly state which one owns the user's attention.
- The attempted fix converted large cards into smaller cards, but it preserved the same number of conceptual surfaces.
- The result is visual compression, not decluttering.
- Decluttering requires deleting and merging surfaces.
- Scenario selection should become the dominant top context because it changes all economics.
- Group selection should sit directly beneath or inside that context because it defines the editing subject.
- Module selection should be subordinate to group and scenario, not a separate major card row.
- The asset card should disappear as a standalone rail.
- Asset identity should live in the group context row.
- Group status counts should become compact metadata chips.
- Economic pulse should be group-scoped, not portfolio-scoped.
- Type curve inputs should become a primary workspace region.
- The production module should treat the chart and inputs as a paired editing canvas.
- The bottom KPI strip should either become group-scoped or be explicitly labeled portfolio-level.
- The better first pass is a layout consolidation, not another component style iteration.

## Current Implementation Snapshot

- Main screen component: `src/components/slopcast/DesignEconomicsView.tsx`.
- Group selector component: `src/components/slopcast/EconomicsGroupBar.tsx`.
- Scenario selector component: `src/components/slopcast/economics/ScenarioCompareStrip.tsx`.
- Left context rail component: `src/components/slopcast/economics/EconomicsContextRail.tsx`.
- Module selector component: `src/components/slopcast/economics/EconomicsModuleTabs.tsx`.
- Production module component: `src/components/slopcast/economics/ProductionModule.tsx`.
- Shared card primitives: `src/components/slopcast/economics/EconomicsPrimitives.tsx`.
- Existing economics plan doc: `docs/Economics-overhaul.md`.
- Existing E2E coverage: `e2e/slopcast-economics.spec.ts`.
- Existing Storybook coverage includes economics group bar, scenario strip, and modules.
- The current screen is already modular enough to refactor in phases.
- The problem is not missing component boundaries.
- The problem is that the boundaries map to UI artifacts instead of user decisions.

## Anti-Patterns Verdict

- Verdict: the current economics screen partially fails the AI-slop test.
- It does not fail because it is ugly.
- It fails because it uses common AI dashboard tropes as structure.
- It relies heavily on stacked cards.
- It uses card grids to solve information architecture.
- It repeats small uppercase labels everywhere.
- It uses accent colors for many panels at once.
- It treats every region as a framed module.
- It uses decorative sparklines and pulse language in a context where users need operational clarity.
- It has multiple "summary" cards competing with the actual editing controls.
- It makes the screen feel generated from a dashboard template.
- The UI says "analytics dashboard" before it says "economic modeling workspace."
- This matters because the target user is not browsing a report.
- The target user is tuning assumptions.
- The user needs confidence that the active group and scenario are the current editing context.
- The user needs fast access to production, pricing, capex, opex, tax, and ownership inputs.
- The user needs results to react to those edits without taking over the screen.
- The current screen makes context look as important as work.
- The current screen makes summaries look as important as inputs.
- The current screen makes portfolio-level status look as important as group-level edits.
- The design should become a focused underwriting bench.
- The tone should be industrial, precise, and dense, not decorative.
- The differentiated memory should be the command-strip workflow: scenario, group, module, assumptions, result.

## Root Cause Diagnosis

- Root cause 1: scope ambiguity.
- The screen does not consistently tell users whether they are looking at group economics or project economics.
- `activeGroup` drives many modules.
- `aggregateMetrics` drives the context rail and bottom KPI strip.
- The UI labels often imply current group while values may be aggregate.
- This creates cognitive drag.
- Users cannot trust whether a number belongs to the selected group.
- Economic pulse is especially risky because it reads like local status but uses aggregate metrics.
- Group-level editing and portfolio-level reporting need separate visual contracts.
- Root cause 2: redundant identity surfaces.
- `EconomicsGroupBar` names the group.
- `EconomicsContextRail` names the group again.
- The module content often references active group implicitly.
- The bottom console references the active group in operations context.
- The repeated identity does not improve orientation.
- It creates visual competition.
- Root cause 3: redundant scenario surfaces.
- `ScenarioCompareStrip` uses selects.
- `ScenarioCompareStrip` also uses scenario buttons.
- `EconomicsContextRail` repeats active scenario.
- Scenario context should be persistent, but it should have one owner.
- Root cause 4: module navigation is too visually expensive.
- `EconomicsModuleTabs` is a full card with six framed tiles.
- It consumes almost the same visual importance as the editable module.
- Its subtitles are helpful but always visible.
- The user does not need six explanatory subtitles after the first few sessions.
- Root cause 5: the asset card exists after its job is gone.
- The left rail was useful when context was missing.
- After the group bar and scenario strip were added, the rail became mostly duplicate context.
- Its remaining useful content is status counts and group pulse.
- Those can be expressed more compactly.
- Root cause 6: inputs are below outputs.
- Production chart and forecast metrics get more first-screen importance than type curve inputs.
- The user specifically wants type curve parameters and inputs to be more important.
- The UI currently privileges the report output over the modeling controls.
- Root cause 7: the layout uses containment as the default rhythm.
- Almost every region is inside a bordered rounded panel.
- This makes each region equally object-like.
- Equal object treatment weakens hierarchy.
- Removing containers will do more than shrinking containers.

## Intended Design Direction

- Direction: refined industrial underwriting bench.
- Tone: brutally clear, compact, data-first, and operator-focused.
- Avoid: decorative neon dashboard energy.
- Avoid: glassy stacked cards.
- Avoid: hero metric spectacle unless the page is a reporting page.
- Avoid: repeated uppercase labels for every micro-item.
- Use color sparingly as state, not decoration.
- Use group color only to anchor selected group.
- Use scenario color only to anchor scenario state.
- Use module accent only inside the active module, not across the whole page.
- Keep visual density high but decision density low.
- Decision density means the number of choices visible at once.
- Data density means the number of useful values visible once context is understood.
- The revamp should reduce decision density.
- The revamp can preserve or increase useful data density.

## North Star

- First row: "Which scenario am I underwriting?"
- Second row: "Which group am I editing?"
- Third row: "Which economics driver am I changing?"
- Main canvas: "What assumptions and outputs matter for this driver?"
- Side summary: "What changed for the selected group?"
- Bottom area: "What operational details are available if I need them?"
- One screen should not simultaneously feel like navigation, dashboard, editor, and report.
- The economics screen should feel like an editor with live analytical feedback.

## Proposed Information Architecture

- Top context strip owns scenario and group.
- The left context rail is removed.
- The group bar becomes an integrated context command bar.
- The scenario strip becomes a compact scenario ledger above the group command bar.
- The module selector moves into the group command bar.
- The active module title is reduced or removed.
- The module canvas becomes the visual center.
- The active module's primary inputs move above or beside primary outputs.
- Group-scoped pulse moves into a compact right summary in the context strip or module header.
- Portfolio metrics move to a separate "Portfolio" affordance or explicitly labeled bottom strip.
- Operations console remains below, but should be collapsed by default if not part of economics editing.

## Recommended Screen Structure

- Region 1: scenario ledger.
- Region 2: group command row.
- Region 3: active module workspace.
- Region 4: compact group economics pulse.
- Region 5: optional operations drawer.
- This reduces visible primary regions from roughly seven to four.
- The scenario ledger should be a single horizontal strip.
- The group command row should contain group selection, group metadata, and module selector.
- The active module workspace should take at least 65% of vertical first-screen attention.
- The compact group economics pulse should be visually subordinate.
- The operations drawer should not compete with the economics module.

## Region 1: Scenario Ledger

- Replace the current scenario card with a low-height ledger strip.
- The scenario ledger should sit above the group command row.
- Height target: 44px to 64px on desktop.
- Height target: 56px to 88px on mobile.
- The active scenario should be obvious within two seconds.
- The base case should be visually distinct but not huge.
- Use a sequenced row, not a grid of cards.
- Each scenario item should show name and one compact delta summary.
- Example summary: `WTI $75 | Gas $3.50`.
- Example summary: `Prod 1.08x | CAPEX 0.94x`.
- Example summary: `Flat price | Base costs`.
- Use tooltips or disclosure for full assumption deltas.
- Do not show both select dropdowns and pills at the same time.
- Select one primary scenario control model.
- Recommended model: segmented scenario ledger with overflow menu.
- Base case selection should be a secondary action.
- "Set base" should not be as visually prominent as selecting active scenario.
- "What changed" should live inside the active scenario item.
- The changes count can be a small badge.
- The active scenario item should communicate active editing context.
- The base scenario item should communicate compare baseline.
- If active equals base, show one compact "Base active" state.
- If active differs from base, show "Comparing to Base" as quiet copy.
- Avoid naming the row "Scenario" with a large label.
- Use a small fixed label only if needed for accessibility.
- The row itself should communicate scenario context through content.

## Region 2: Group Command Row

- Merge `EconomicsGroupBar` and the asset identity portion of `EconomicsContextRail`.
- The group command row should own active group identity.
- The group command row should own group well count.
- The group command row should own group status chips.
- The group command row should own module selection.
- The group command row should own clone/focus actions.
- Group name should appear once.
- Group name should not appear again in a left card.
- Group subtitle should be one concise line.
- Example: `Tier 1 - Core · 40 wells · $431.3M CAPEX · NPV $791.2M`.
- Status counts should be inline pills.
- Example: `24 producing`, `9 DUC`, `7 permit`.
- Do not use large status cards for producing/DUC/permit.
- The status pills should be metadata, not primary content.
- The group selector dropdown can retain search and sort.
- The collapsed group row should not show a redundant summary row.
- The active group label and the selection summary row should be merged.
- The group row should fit in one line on desktop.
- It may wrap into two lines at tablet widths.
- On mobile, it should become a stacked command row with scenario first, group second, module third.
- Clone group should be a small icon/text action.
- Focus mode should be a toggle if it exists.
- Group health should be a small status chip.
- "Compute: Fresh" should use precise language.
- Better label: `Fresh`, `Needs run`, or `Inputs changed`.
- Avoid `Compute: Fresh` because it reads like system internals.

## Region 3: Module Selector

- Move module selector into the group command row.
- Replace six equal module cards with a compact segmented control.
- Labels: `Production`, `Pricing`, `OPEX`, `Taxes`, `Ownership`, `CAPEX`.
- Remove subtitles from default collapsed state.
- Show module descriptions on hover tooltip or details panel.
- Active module should have clear state.
- Inactive modules should not look like cards.
- Module selector should not be boxed in a large `rounded-panel`.
- Use one container for the command row.
- Do not put module tiles inside another card.
- Keep module switching visually cheaper than assumption editing.
- Keyboard arrow navigation should remain supported.
- Existing `data-testid` attributes should remain or be mapped.

## Region 4: Active Module Workspace

- The active module should become the dominant canvas.
- The production module should be the first redesign target.
- Production is the highest-leverage module because type curve inputs define the economics.
- The production workspace should split into "Inputs" and "Response."
- Inputs should be visually first.
- Response should be visible but not overpowering.
- The chart should explain the result of the inputs.
- The chart should not read like the page hero.
- Type curve parameters should move above the chart or into a left primary panel.
- Decline segment table should get more working space.
- Type curve parameter summary should become editable or closely linked to editable controls.
- Avoid showing a read-only type curve table below the editable decline table unless it adds distinct value.
- If it is only summarizing the same data, merge it into the table header or side stats.
- The input section should include active scenario modifiers where relevant.
- Example: `Scenario scalar: 1.08x`.
- This prevents users from editing group type curve while forgetting scenario assumptions.

## Region 5: Group Economics Pulse

- Economic pulse should be based on selected group.
- Use `activeGroup.metrics` as the default data source.
- Use `activeGroup.flow` as the default cash-flow source.
- If group metrics are missing, show a clearly local empty state.
- Do not use `aggregateMetrics` under a group label.
- If portfolio metrics remain visible, label them `Portfolio`.
- Group pulse should show only the 3-4 numbers needed while editing.
- Recommended group pulse metrics: NPV10, payout, CAPEX, EUR.
- Breakeven WTI is useful if it is truly group-scoped.
- If breakeven is portfolio-scoped today, either compute group-level breakeven or label it explicitly.
- Do not show a sparkline unless it carries useful local meaning.
- If a sparkline remains, it should be group cumulative cash flow.
- The sparkline should not be decorative.
- Add tooltip/axis values if used.
- Otherwise delete the sparkline.

## Region 6: Operations Console

- The operations console is currently visually expensive.
- It sits under the economics workspace.
- It may be useful, but it is not always part of economics editing.
- Make it collapsed by default in economics mode.
- Use a disclosure label like `Operations`.
- Preserve `showSelectionActions={false}`.
- Preserve `compactEconomics`.
- Do not let operations controls pull attention away from type curve inputs.
- If the console is required for save snapshot, separate snapshot action from the full console.
- Place `Save snapshot` in the command row or group pulse.
- Move lower-priority operations into a drawer.

## Layout Wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Scenario ledger: Base | Downside | Upside | Custom        What changed: 4    │
├──────────────────────────────────────────────────────────────────────────────┤
│ Group: Tier 1 - Core · 40 wells · Fresh      [Production Pricing OPEX ...]   │
│ Status: 24 producing · 9 DUC · 7 permit      NPV $791M · Payout 22mo         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Production Inputs                         Forecast Response                 │
│  ┌───────────────────────────────┐        ┌───────────────────────────────┐  │
│  │ Decline segments / type curve │        │ Production forecast chart      │  │
│  │ Scenario scalar context       │        │ EUR / peak / split             │  │
│  └───────────────────────────────┘        └───────────────────────────────┘  │
│                                                                              │
│  Group economic response / cash flow / sensitivity                           │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Operations drawer collapsed                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Refactor Strategy

- Do not start by rewriting every module.
- Start with container consolidation.
- Then move data ownership.
- Then refine the production module hierarchy.
- Then update other modules to use the new shell.
- Keep tests passing after each phase.
- Keep diffs small.
- Avoid new dependencies.
- Reuse existing primitives where they help.
- Delete primitives where they encode the old card-heavy hierarchy.

## Phase 1: Establish Group-Scoped Data Contract

- Add local variables in `DesignEconomicsView.tsx` for group metrics and group flow.
- `const groupMetrics = activeGroup.metrics ?? emptyMetrics`.
- `const groupFlow = activeGroup.flow ?? []`.
- Decide whether `breakevenOilPrice` is group-scoped or portfolio-scoped.
- If group-scoped calculation exists, use it.
- If not, label it portfolio or remove it from group pulse.
- Pass group metrics to group pulse components.
- Stop passing `aggregateMetrics` to surfaces labeled as active group.
- Keep aggregate metrics only for explicitly portfolio surfaces.
- Add helper naming that makes scope impossible to confuse.
- Use names like `portfolioMetrics`, `selectedGroupMetrics`, `selectedGroupFlow`.
- Avoid `aggregateMetrics` in local UI display props unless the display label says portfolio.
- Update Storybook fixtures to include group metrics.
- Add a unit or component test for group pulse scope.
- Test that selected group switch changes displayed pulse values.
- Test that portfolio strip labels portfolio if aggregate metrics remain.

## Phase 2: Replace Context Rail with Integrated Header

- Remove `EconomicsContextRail` from the desktop grid in `DesignEconomicsView.tsx`.
- Replace the two-column layout with a single-column economics workspace.
- Create a new component or evolve `EconomicsGroupBar`.
- Suggested name: `EconomicsCommandHeader`.
- Ownership: scenario ledger, group identity, module selector, compact pulse.
- Keep existing `EconomicsGroupBar` temporarily if needed.
- Avoid a big-bang deletion until tests are updated.
- Move group status counts from `EconomicsContextRail` into the command header.
- Move active scenario display from `EconomicsContextRail` into scenario ledger only.
- Move group economic pulse from `EconomicsContextRail` into a compact pulse cluster.
- Delete the duplicated asset title surface.
- Preserve group dropdown behavior.
- Preserve group search.
- Preserve group sort.
- Preserve clone action.
- Preserve focus toggle if used by parent.
- Preserve toast behavior for clone.
- Reduce sticky behavior to one sticky header.
- Avoid nested sticky surfaces.

## Phase 3: Redesign Scenario Ledger

- Refactor `ScenarioCompareStrip`.
- Remove the select dropdown pair.
- Keep scenario buttons as the primary interaction.
- Rename visually to a ledger or comparison strip.
- Show base state in each scenario item only when relevant.
- Show active state strongly.
- Show compare baseline quietly.
- Move "What Changed" into the right side of the strip.
- Keep the existing `buildWhatChanged` logic.
- Use `activeGroup`, `activeScenario`, and `baseScenario` for deltas.
- Use group-scoped flow and metrics for deltas if possible.
- Avoid `aggregateMetrics` in scenario deltas unless the label says portfolio.
- Add a full-delta popover only on click.
- Use compact visible summaries for each scenario.
- Derive summary from pricing and production/capex scalars.
- If summary cannot be derived for all assumptions, show the top two most important differences.
- Keep full settings in tooltip/popover.
- Do not show full settings on every chip.
- Do not put long subtitles in the row.
- Use title attributes only as a fallback.
- Prefer accessible popover content.
- Include keyboard activation.
- Include `aria-current` or `aria-pressed` for active scenario.

## Phase 4: Merge Module Selector into Header

- Refactor `EconomicsModuleTabs`.
- Make it render as compact segmented control by default.
- Remove outer `rounded-panel` wrapper in the economics screen.
- Keep component reusable for Storybook.
- Add a `variant="compact"` prop if needed.
- Use compact variant in `DesignEconomicsView`.
- Keep larger variant only if another screen needs it.
- Remove module subtitles from default compact variant.
- Add tooltip labels if necessary.
- Use active module accent subtly.
- Do not use six accent colors simultaneously.
- Show only active accent.
- Inactive modules should be neutral.
- This reduces visual noise immediately.

## Phase 5: Reprioritize Production Workspace

- In `ProductionModule.tsx`, move the editable decline segment table into the primary position.
- Replace the current layout order.
- Recommended desktop layout: inputs left, chart right.
- Recommended wide layout: inputs 45%, chart 55%.
- Recommended tablet layout: inputs first, chart second.
- Recommended mobile layout: inputs first, chart second, metrics third.
- Add a compact header to the inputs panel.
- Header should show active group name only if it is not already visible above.
- Prefer not to repeat active group name.
- Show scenario scalar context near inputs.
- Show `Forecast response` as chart heading.
- Merge `Forecast Metrics` into the chart panel's right side or footer.
- Avoid a separate vertical stack of metric cards if it makes the chart row card-heavy.
- Convert production split into a small inline meter.
- The split meter can live under metrics.
- Delete the separate `Type Curve Parameters` read-only panel if redundant.
- Alternatively convert it to a compact `Parameters` summary beside the segment table.
- Make editable inputs look editable.
- Make read-only summaries visually quieter.
- Ensure the user can identify the primary editable table in two seconds.

## Phase 6: Normalize Other Modules

- Apply the same workspace pattern to Pricing.
- Pricing primary input: price deck assumptions and differentials.
- Pricing response: netback, revenue, cash-flow effect.
- Apply the same workspace pattern to OPEX.
- OPEX primary input: LOE structure and fixed/variable costs.
- OPEX response: cost burden and margin effect.
- Apply the same workspace pattern to Taxes.
- Taxes primary input: severance/ad valorem/federal assumptions.
- Taxes response: after-tax cash flow and NPV impact.
- Apply the same workspace pattern to Ownership.
- Ownership primary input: WI/NRI/royalty burden.
- Ownership response: revenue interest and cash-flow split.
- Apply the same workspace pattern to CAPEX.
- CAPEX primary input: capital ledger and timing.
- CAPEX response: payout, PV impact, capital efficiency.
- Do not require every module to have the exact same grid.
- Maintain a shared conceptual pattern, not an identical card pattern.
- Each module should feel tailored to its economics job.

## Phase 7: Visual Simplification Pass

- Audit every `rounded-panel` in economics.
- Remove containers that only group already grouped content.
- Audit every `MetricTile` usage.
- Convert low-importance metric tiles to inline stats.
- Keep metric tiles only for high-signal values.
- Audit every uppercase tracking label.
- Reduce label letter spacing where density matters.
- Avoid `tracking-[0.24em]` on repeated controls.
- Reserve heavy uppercase for section markers.
- Use sentence case for form labels where possible.
- Audit every accent color.
- One active accent per module.
- Group color may coexist as identity.
- Scenario active color may coexist as state.
- Avoid cyan, green, amber, red, mint, and violet all appearing together in one viewport.
- Audit glow usage.
- Remove `shadow-glow-cyan` from routine active controls.
- Use border, fill, and weight for state.
- Keep glow only for rare confirmation or brand moments.
- Audit tiny chart usage.
- Delete decorative sparklines.
- Keep charts that support a decision.

## Phase 8: Responsive Model

- Desktop should use a sticky compact command header.
- Desktop should avoid a persistent left rail.
- Tablet should stack scenario ledger, group row, module segmented control.
- Mobile should use one context header and one module workspace.
- Mobile should not split into `Context` and `Workspace` if the context rail is gone.
- Remove or repurpose the current mobile `SETUP` / `RESULTS` toggle.
- If mobile needs a toggle, make it `Assumptions` / `Results` inside the active module.
- Do not hide critical scenario or group selection on mobile.
- Keep scenario and group selection at top.
- Use horizontal scroll only for scenario/module chips if necessary.
- Ensure tap targets remain at least 40px tall.
- Ensure group dropdown menu remains usable on narrow screens.
- Ensure popovers do not overflow viewport.

## Phase 9: Testing And Verification

- Update Storybook for the new command header.
- Update or create `EconomicsCommandHeader.stories.tsx`.
- Keep stories for scenario ledger states.
- Add stories for active base case.
- Add stories for active non-base comparison.
- Add stories for many scenarios.
- Add stories for long group names.
- Add stories for missing metrics.
- Add stories for stale/dirty state.
- Update `EconomicsModuleTabs.test.tsx` or add tests for compact variant.
- Update E2E selectors if component names change.
- Preserve existing `data-testid` names where possible.
- Update `e2e/slopcast-economics.spec.ts` if module switching selectors change.
- Run `npm run ui:components`.
- Run `npm run ui:audit`.
- Run `npm run ui:verify`.
- Run E2E economics coverage.
- Capture desktop screenshots in slate and mario themes.
- Capture mobile screenshots in slate and mario themes.
- Verify type curve inputs are visible without scrolling on desktop.
- Verify active scenario is visible without scrolling on desktop.
- Verify active group is visible without scrolling on desktop.
- Verify module selector is visible without scrolling on desktop.
- Verify no duplicate active group titles appear in first viewport.
- Verify no duplicate active scenario controls appear in first viewport.
- Verify group pulse changes when active group changes.
- Verify portfolio metrics are labeled portfolio if shown.

## Acceptance Criteria

- The active group name appears once in the primary economics workspace chrome.
- The active scenario control appears once in the primary economics workspace chrome.
- The module selector does not occupy a full card row.
- The asset card/rail is removed or reduced to non-duplicative content.
- Producing/DUC/Permit information is inline metadata, not large boxes.
- Type curve inputs are visible above the fold on desktop.
- Production inputs are visually more important than read-only production summaries.
- Economic pulse reflects the selected group.
- Portfolio-level metrics are either hidden or explicitly labeled.
- The economics screen has fewer visible bordered panels than before.
- The first viewport has a clear primary editing area.
- The UI no longer feels like a collection of independent dashboards.
- Scenario comparison remains discoverable.
- Group switching remains discoverable.
- Module switching remains fast.
- Keyboard access remains intact.
- Existing economics calculations remain unchanged.
- The redesign does not add dependencies.
- The redesign does not change backend economics contracts.
- The redesign does not remove scenario comparison functionality.
- The redesign does not remove group clone functionality.

## Implementation Checklist: Data Scope

- [ ] Rename local `aggregateMetrics` usage to `portfolioMetrics` where displayed as portfolio.
- [ ] Add `selectedGroupMetrics` derived from `activeGroup.metrics`.
- [ ] Add `selectedGroupFlow` derived from `activeGroup.flow`.
- [ ] Create empty metrics fallback in a helper.
- [ ] Avoid inline anonymous zero objects repeated across components.
- [ ] Decide whether breakeven can be group-scoped.
- [ ] If breakeven is not group-scoped, remove it from group pulse.
- [ ] If breakeven remains, label scope explicitly.
- [ ] Update `EconomicsContext` type to distinguish group and portfolio values.
- [ ] Update `EconomicsModuleProps` only if modules need portfolio metrics.
- [ ] Keep modules primarily group-scoped.
- [ ] Pass portfolio metrics only to components that label portfolio.
- [ ] Update `buildWhatChanged` input names if scope changes.
- [ ] Add a test proving pulse values follow active group.
- [ ] Add a story with two groups showing different NPV values.
- [ ] Add a story with group metrics missing.
- [ ] Show `Run economics` or `No metrics yet` when local metrics are unavailable.
- [ ] Do not show `$0.0M` as if it is a real result.
- [ ] Use a neutral empty state for missing metrics.
- [ ] Preserve economics engine behavior.

## Implementation Checklist: Command Header

- [ ] Create `EconomicsCommandHeader.tsx` or evolve `EconomicsGroupBar.tsx`.
- [ ] Keep the component under `src/components/slopcast/`.
- [ ] Accept `scenarios`.
- [ ] Accept `activeScenarioId`.
- [ ] Accept `baseScenario`.
- [ ] Accept `onSetActiveScenarioId`.
- [ ] Accept `groups`.
- [ ] Accept `activeGroupId`.
- [ ] Accept `onActivateGroup`.
- [ ] Accept `activeGroup`.
- [ ] Accept `economicsModule`.
- [ ] Accept `onSetEconomicsModule`.
- [ ] Accept group metrics.
- [ ] Accept group flow only if needed.
- [ ] Accept group status counts or derive them from wells.
- [ ] Accept `onCloneActiveGroup`.
- [ ] Accept focus mode props only if still used.
- [ ] Render scenario ledger first.
- [ ] Render group identity second.
- [ ] Render module segmented control inside the header.
- [ ] Render compact pulse at the right on wide screens.
- [ ] Stack pulse below group identity on medium screens.
- [ ] Keep actions visually subordinate.
- [ ] Avoid a separate summary row that repeats group name.
- [ ] Avoid nested cards inside the header.
- [ ] Use one border around the whole command header.
- [ ] Use internal separators instead of nested panels.
- [ ] Keep sticky behavior on the command header only.
- [ ] Ensure z-index is lower than global app nav.
- [ ] Ensure dropdown menus appear above module content.
- [ ] Ensure sticky header does not cover anchors or popovers.

## Implementation Checklist: Scenario Ledger

- [ ] Remove the active scenario `<select>`.
- [ ] Remove the disabled compare-to `<select>`.
- [ ] Replace with a scenario row.
- [ ] Keep the active scenario button.
- [ ] Show base badge only on the base scenario.
- [ ] Show compare baseline text only when useful.
- [ ] Show one-line assumption summary per scenario.
- [ ] Use derived `pricingSummary`.
- [ ] Use derived `productionSummary`.
- [ ] Use derived `capexSummary`.
- [ ] Choose at most two summary tokens per scenario.
- [ ] Move full assumption details into tooltip or popover.
- [ ] Preserve `What Changed` popover.
- [ ] Make `What Changed` less visually loud.
- [ ] Move changes badge into small count.
- [ ] Use `aria-expanded` for popover.
- [ ] Use `aria-controls` for popover relationship.
- [ ] Close popover on Escape.
- [ ] Close popover on outside click.
- [ ] Keep keyboard focus predictable.
- [ ] Add overflow behavior for more than five scenarios.
- [ ] Add horizontal scroll only if scenarios exceed width.
- [ ] Add fade or overflow indicator if scrollable.
- [ ] Do not wrap scenario chips into a large second row on desktop.
- [ ] Mobile may allow horizontal scroll.
- [ ] Story: one scenario.
- [ ] Story: three scenarios.
- [ ] Story: eight scenarios.
- [ ] Story: long scenario names.
- [ ] Story: active base.
- [ ] Story: active upside compared to base.

## Implementation Checklist: Group Selector

- [ ] Keep previous/next group controls.
- [ ] Replace text arrows with icon buttons if icon library is available.
- [ ] If no icon library exists locally, keep arrows but reduce visual noise.
- [ ] Keep group color dot.
- [ ] Keep group dropdown search.
- [ ] Keep sort controls in dropdown.
- [ ] Keep health indicator in dropdown.
- [ ] Remove duplicate active group summary row.
- [ ] Merge active group name and well count.
- [ ] Add group metrics inline.
- [ ] Add status chips inline.
- [ ] Show `Fresh` or `Needs run` as one compact state.
- [ ] Replace `Compute: Fresh` with user-facing state copy.
- [ ] Keep clone action.
- [ ] Consider moving clone into dropdown if it is not frequently used.
- [ ] Keep focus action if useful.
- [ ] Do not make clone as prominent as active group selection.
- [ ] Ensure group dropdown has max height and scroll.
- [ ] Ensure dropdown remains readable in classic theme.
- [ ] Ensure dropdown remains readable in slate theme.
- [ ] Ensure dropdown remains readable in mario theme.
- [ ] Preserve `data-testid="economics-group-select"`.
- [ ] Preserve group option test IDs if possible.

## Implementation Checklist: Module Selector

- [ ] Add compact rendering to `EconomicsModuleTabs`.
- [ ] Use segmented-control layout.
- [ ] Remove per-module subtitle from compact mode.
- [ ] Keep module metadata available for tooltips.
- [ ] Use active module `aria-current="page"` or `aria-pressed`.
- [ ] Preserve click behavior.
- [ ] Preserve test IDs.
- [ ] Ensure active module is legible in every theme.
- [ ] Use neutral inactive states.
- [ ] Use one active accent.
- [ ] Remove large `min-h-[56px]` in compact mode.
- [ ] Target 36px to 40px height for desktop compact control.
- [ ] Allow horizontal scroll on mobile.
- [ ] Avoid grid wrapping unless necessary.
- [ ] Do not add icons unless they clarify.
- [ ] If icons are used, use real icons, not decorative SVG shapes.
- [ ] Keep labels short.
- [ ] Use `Ownership` not `Own.` unless width requires abbreviation.
- [ ] Use `CAPEX` not `Capital` to match domain language.
- [ ] Use `OPEX` not `Costs` to match domain language.

## Implementation Checklist: Production Module

- [ ] Move `DeclineSegmentTable` above chart on mobile.
- [ ] Move `DeclineSegmentTable` to primary left column on desktop.
- [ ] Pair chart with metric summary.
- [ ] Reduce standalone metric tile count.
- [ ] Merge `Forecast Metrics` into chart panel.
- [ ] Convert `Production Split` to a compact inline meter.
- [ ] Reevaluate `Type Curve Parameters` panel.
- [ ] Delete it if it repeats the editable table.
- [ ] If retained, make it a compact summary in the inputs panel.
- [ ] Show scenario production scalar near inputs.
- [ ] Show group type curve basis near inputs.
- [ ] Label editable table clearly.
- [ ] Label read-only outputs quietly.
- [ ] Keep chart height stable.
- [ ] Use `StableChart` as-is unless it creates extra wrapper noise.
- [ ] Ensure chart does not dominate first viewport on desktop.
- [ ] Ensure input controls are visible without scroll.
- [ ] Ensure assumptions are editable with keyboard.
- [ ] Ensure table column labels remain readable.
- [ ] Ensure long values do not overflow.
- [ ] Add story for narrow input panel.
- [ ] Add story for many decline segments.
- [ ] Add story for missing segments.

## Implementation Checklist: Pricing Module

- [ ] Make price assumptions the primary region.
- [ ] Put oil price, gas price, and differentials together.
- [ ] Show active scenario pricing context.
- [ ] Show netback response next to assumptions.
- [ ] Avoid separate metric cards for every derived price.
- [ ] Use one compact revenue/cash-flow response chart.
- [ ] Use inline deltas against base scenario.
- [ ] Group editable assumptions by commodity.
- [ ] Do not hide differentials under decorative cards.
- [ ] Ensure scenario ledger and module content do not repeat scenario name.
- [ ] Add story for high oil/low gas scenario.
- [ ] Add story for negative differential.
- [ ] Add story for missing pricing assumptions.
- [ ] Keep existing calculation functions unchanged.
- [ ] Keep form inputs accessible.

## Implementation Checklist: OPEX Module

- [ ] Make cost structure assumptions primary.
- [ ] Separate fixed and variable costs clearly.
- [ ] Show cost per well and cost per BOE if available.
- [ ] Show margin response as secondary.
- [ ] Avoid donut chart if table communicates better.
- [ ] If chart remains, connect it to editable categories.
- [ ] Show scenario opex scalar context.
- [ ] Use compact cost burden summary.
- [ ] Avoid multiple amber-highlight cards.
- [ ] Add story for high LOE case.
- [ ] Add story for zero wells.
- [ ] Add story for mixed fixed/variable assumptions.

## Implementation Checklist: Taxes Module

- [ ] Make tax assumptions primary.
- [ ] Group severance, ad valorem, and federal assumptions.
- [ ] Show after-tax response next to assumptions.
- [ ] Do not overuse red accents.
- [ ] Red should indicate tax module identity, not error.
- [ ] Ensure error states use a distinct danger treatment.
- [ ] Show tax impact as one concise value.
- [ ] Show pre-tax vs after-tax comparison only if useful.
- [ ] Add story for no tax assumptions.
- [ ] Add story for high severance tax.
- [ ] Add story for missing metrics.

## Implementation Checklist: Ownership Module

- [ ] Make WI/NRI/royalty inputs primary.
- [ ] Show revenue interest response.
- [ ] Clarify whether ownership is group-level or scenario-level.
- [ ] Do not show ownership chart if inputs explain it better.
- [ ] Use a simple split bar if needed.
- [ ] Keep ownership math transparent.
- [ ] Add story for 100% working interest.
- [ ] Add story for burdened NRI.
- [ ] Add story for invalid ownership values.

## Implementation Checklist: CAPEX Module

- [ ] Make capital ledger primary.
- [ ] Show timing assumptions near line items.
- [ ] Show payout response next to ledger.
- [ ] Show capital efficiency as a compact summary.
- [ ] Avoid a large PV-10 tile if the module is about editing CAPEX.
- [ ] Use violet only for active CAPEX state.
- [ ] Show scenario capex scalar context.
- [ ] Add story for many line items.
- [ ] Add story for no line items.
- [ ] Add story for front-loaded timing.
- [ ] Add story for delayed timing.

## Implementation Checklist: Visual Tokens

- [ ] Audit `shadow-card` usage in economics.
- [ ] Remove shadows from command header inner controls.
- [ ] Keep shadows for popovers only.
- [ ] Audit `bg-theme-surface1/55`.
- [ ] Use fewer translucent surfaces.
- [ ] Prefer solid theme surfaces for dense data.
- [ ] Audit `backdrop-blur`.
- [ ] Remove blur from routine panels.
- [ ] Keep borders subtle.
- [ ] Reduce active glow states.
- [ ] Use active fill and border instead.
- [ ] Reserve high chroma for active selection and warnings.
- [ ] Use group color only for group identity.
- [ ] Use scenario color only for scenario state.
- [ ] Use module accent only inside module body.
- [ ] Avoid simultaneous rainbow accents.
- [ ] Keep panels at `rounded-panel` and inner elements at `rounded-inner`.
- [ ] Do not reintroduce `rounded-2xl`.
- [ ] Do not reintroduce `rounded-xl`.
- [ ] Do not reintroduce `shadow-xl`.
- [ ] Do not reintroduce `sc-titlebar--brown`.

## Implementation Checklist: Typography

- [ ] Reduce repeated `font-black`.
- [ ] Use `font-semibold` for secondary labels.
- [ ] Use `font-black` only for selected state, metrics, and section anchors.
- [ ] Reduce repeated extreme tracking.
- [ ] Use `tracking-[0.08em]` to `tracking-[0.14em]` for compact labels.
- [ ] Avoid `tracking-[0.24em]` except rare section headers.
- [ ] Use title case or sentence case for form labels.
- [ ] Keep domain abbreviations uppercase.
- [ ] Keep KPI abbreviations uppercase.
- [ ] Avoid all-caps paragraphs.
- [ ] Use tabular numbers for metrics.
- [ ] Align numerical values for scanning.
- [ ] Use smaller metric values in pulse than in results canvas.
- [ ] Do not let helper copy compete with section headings.
- [ ] Remove repeated explanatory subtitles from module selector.
- [ ] Keep module descriptions available in tooltip or docs.

## Implementation Checklist: Copy

- [ ] Replace `Economic Pulse` with `Group economics` or `Selected group`.
- [ ] Replace `Cash pulse` with `Cumulative cash flow` if chart remains.
- [ ] Replace `Live` with `Active` or `Current`.
- [ ] Replace `Compute: Fresh` with `Fresh`.
- [ ] Replace `Compute: Stale` with `Needs run`.
- [ ] Replace `Context` mobile label if context rail is removed.
- [ ] Replace `Workspace` mobile label if module workspace is always visible.
- [ ] Use `Compare to Base` only when active scenario differs from base.
- [ ] Use `No modeled differences from base` for empty deltas.
- [ ] Use `No group metrics yet` for missing local metrics.
- [ ] Avoid "pulse" language unless it maps to a live signal.
- [ ] Avoid "portfolio" unless values are actually portfolio-level.
- [ ] Avoid "asset" if the selected object is a group.
- [ ] Use `Group` consistently for `WellGroup`.
- [ ] Use `Scenario` consistently for scenario assumptions.

## Implementation Checklist: Accessibility

- [ ] Scenario ledger buttons need accessible names.
- [ ] Active scenario state needs programmatic state.
- [ ] Base scenario badge should not be color-only.
- [ ] Group status chips should not be color-only.
- [ ] Module segmented control should support keyboard focus.
- [ ] Dropdown should close on Escape.
- [ ] Popover should close on Escape.
- [ ] Focus should return to triggering button after popover close.
- [ ] Ensure color contrast in slate theme.
- [ ] Ensure color contrast in mario theme.
- [ ] Ensure color contrast in classic mode.
- [ ] Tooltip content should be available by keyboard.
- [ ] Do not rely on hover-only details for essential settings.
- [ ] Charts need text alternatives or adjacent summaries.
- [ ] Empty states should be announced as text.
- [ ] Avoid tiny touch targets.
- [ ] Use `button` elements for clickable chips.
- [ ] Use `nav` for module selector.
- [ ] Use `aria-label` for icon-only controls.
- [ ] Avoid invisible interactive surfaces.

## Implementation Checklist: State And Edge Cases

- [ ] No active group.
- [ ] Empty groups array.
- [ ] Active group missing metrics.
- [ ] Active group has zero wells.
- [ ] Active group has long name.
- [ ] Active group has unusual color.
- [ ] Group has only permit wells.
- [ ] Group has only DUC wells.
- [ ] Group has no capex line items.
- [ ] Group has no decline segments.
- [ ] Scenario list is empty.
- [ ] Scenario list has one item.
- [ ] Scenario list has many items.
- [ ] Active scenario missing from list.
- [ ] Base scenario missing from list.
- [ ] Base scenario same as active scenario.
- [ ] Active scenario differs heavily from base.
- [ ] What-changed list is empty.
- [ ] What-changed list is long.
- [ ] Metrics are negative.
- [ ] Payout is unavailable.
- [ ] Breakeven is unavailable.
- [ ] Cash flow has fewer than two points.
- [ ] Cash flow is all negative.
- [ ] Cash flow crosses zero late.
- [ ] User switches group while popover is open.
- [ ] User switches scenario while dropdown is open.
- [ ] User switches module while editing.

## Suggested File Changes

- [ ] `src/components/slopcast/DesignEconomicsView.tsx`: replace rail layout with command header layout.
- [ ] `src/components/slopcast/EconomicsGroupBar.tsx`: merge or retire after command header exists.
- [ ] `src/components/slopcast/economics/ScenarioCompareStrip.tsx`: convert to compact scenario ledger.
- [ ] `src/components/slopcast/economics/EconomicsContextRail.tsx`: delete or stop rendering in economics screen.
- [ ] `src/components/slopcast/economics/EconomicsModuleTabs.tsx`: add compact segmented variant.
- [ ] `src/components/slopcast/economics/ProductionModule.tsx`: reprioritize inputs over output cards.
- [ ] `src/components/slopcast/economics/EconomicsPrimitives.tsx`: add lighter primitives if needed.
- [ ] `src/components/slopcast/economics/derived.ts`: add group-scoped pulse helpers if needed.
- [ ] `src/components/slopcast/EconomicsGroupBar.stories.tsx`: update or replace with command header stories.
- [ ] `src/components/slopcast/economics/ScenarioCompareStrip.stories.tsx`: update ledger stories.
- [ ] `src/components/slopcast/economics/EconomicsModules.stories.tsx`: update layout assumptions.
- [ ] `e2e/slopcast-economics.spec.ts`: adjust selectors only if necessary.

## Proposed New Components

- `EconomicsCommandHeader`.
- `ScenarioLedger`.
- `GroupSelectorControl`.
- `GroupStatusChips`.
- `GroupPulseInline`.
- `EconomicsModuleSegmentedControl`.
- `ModuleWorkspaceShell`.
- `ProductionAssumptionWorkbench`.
- `ForecastResponsePanel`.
- These are suggested boundaries, not mandatory names.
- Prefer fewer components if the implementation stays clear.
- Extract only when repeated or complex.
- Do not create abstractions for one-off layout wrappers.

## Component Responsibility Map

- `EconomicsCommandHeader` owns screen context.
- `ScenarioLedger` owns scenario selection and comparison summary.
- `GroupSelectorControl` owns group switching and dropdown.
- `GroupStatusChips` owns producing/DUC/permit counts.
- `GroupPulseInline` owns selected group metrics.
- `EconomicsModuleSegmentedControl` owns module switching.
- `ModuleWorkspaceShell` owns module content layout rhythm.
- `ProductionAssumptionWorkbench` owns type curve edits.
- `ForecastResponsePanel` owns production chart and derived response.
- `OperationsConsole` remains operational support.
- `DesignEconomicsView` wires state and scope.

## Detailed UI Requirements

- Scenario ledger should not exceed one desktop row.
- Scenario ledger should not use equal card grids.
- Scenario ledger active item should have a clear selected fill.
- Scenario ledger base item should have a small `Base` badge.
- Scenario ledger should include active scenario name.
- Scenario ledger should include concise assumption summary.
- Scenario ledger should include comparison state.
- Scenario ledger should include delta count.
- Scenario ledger should avoid redundant labels.
- Scenario ledger should preserve what-changed detail.
- Group command row should not exceed two desktop rows.
- Group command row should include active group name.
- Group command row should include well count.
- Group command row should include group metrics if available.
- Group command row should include status chips.
- Group command row should include freshness state.
- Group command row should include module segmented control.
- Group command row should include clone action.
- Group command row should not include duplicate group title.
- Group command row should not include large status cards.
- Group command row should not include scenario name.
- Module segmented control should be compact.
- Module segmented control should not show subtitles by default.
- Module segmented control should not use six independent card borders.
- Module segmented control should keep active state accessible.
- Module segmented control should support current tests.
- Module workspace should have one primary panel.
- Module workspace should have one secondary response panel.
- Module workspace should not look like a dashboard card collage.
- Module workspace should keep editable controls visibly editable.
- Module workspace should keep charts tied to decisions.
- Group pulse should be small.
- Group pulse should be local.
- Group pulse should not use decorative chart language.
- Bottom KPI strip should be either removed or relabeled.
- Operations console should be collapsed or visually subordinated.

## Visual Hierarchy Rules

- Rule 1: one selected scenario.
- Rule 2: one selected group.
- Rule 3: one selected module.
- Rule 4: one primary editable control area.
- Rule 5: one primary response area.
- Rule 6: no duplicate selected group titles.
- Rule 7: no duplicate selected scenario selectors.
- Rule 8: no equal-weight card rows above the primary workspace.
- Rule 9: no more than one high-chroma accent family in the module body.
- Rule 10: no decorative metrics above editable inputs.
- Rule 11: labels should explain scope when values might be ambiguous.
- Rule 12: portfolio values must say portfolio.
- Rule 13: group values must say group only when context is not already obvious.
- Rule 14: edit controls should look more actionable than summaries.
- Rule 15: summaries should support the edit, not replace it.
- Rule 16: every visible bordered panel must justify its border.
- Rule 17: every chart must answer a user question.
- Rule 18: every chip must be either a state, filter, or metadata token.
- Rule 19: every tooltip must expose detail, not rescue unclear labels.
- Rule 20: every first-viewport element must be part of current underwriting context.

## The Most Important Deletions

- Delete the left asset rail from the economics desktop layout.
- Delete duplicate scenario select controls.
- Delete duplicate group summary row in `EconomicsGroupBar`.
- Delete large producing/DUC/permit boxes.
- Delete always-visible module subtitles.
- Delete decorative cash pulse if not group-scoped.
- Delete output-first production hierarchy.
- Delete redundant read-only type curve table if it repeats inputs.
- Delete any panel wrapper whose only content is another panel.
- Delete glow states from routine active controls.

## The Most Important Merges

- Merge asset identity into group command row.
- Merge group well count into group subtitle.
- Merge producing/DUC/permit into group status chips.
- Merge module selector into group command row.
- Merge scenario compare controls into scenario ledger.
- Merge forecast metrics into forecast response panel.
- Merge type curve summary into production inputs.
- Merge group economic pulse into command header or module header.
- Merge save snapshot action into command area if it is critical.
- Merge portfolio strip into a clear portfolio affordance if it remains.

## The Most Important Elevations

- Elevate scenario ledger above group context.
- Elevate group context above module selector.
- Elevate type curve inputs above production chart.
- Elevate editable assumptions above read-only summaries.
- Elevate group-scoped metrics above portfolio metrics.
- Elevate data scope clarity above visual decoration.
- Elevate keyboard interaction parity.
- Elevate empty states for missing metrics.
- Elevate responsive adaptation.
- Elevate story coverage for edge cases.

## Suggested Milestone Plan

- Milestone 1: data scope correction.
- Milestone 2: command header shell.
- Milestone 3: scenario ledger.
- Milestone 4: compact module navigation.
- Milestone 5: production workspace reprioritization.
- Milestone 6: group pulse and portfolio labeling.
- Milestone 7: responsive cleanup.
- Milestone 8: Storybook and E2E verification.
- Milestone 9: visual polish pass.
- Milestone 10: delete retired components.

## Milestone 1 Details

- Goal: stop mixing group and portfolio values in group-labeled UI.
- Files: `DesignEconomicsView.tsx`, `EconomicsContextRail.tsx`, `derived.ts`.
- Risk: medium because displayed metrics may shift.
- Test: group switch changes group pulse.
- Test: portfolio labels remain accurate.
- Acceptance: no active-group surface uses aggregate values silently.
- Avoid: changing economics formulas.
- Avoid: changing persistence.
- Avoid: changing scenario engine.

## Milestone 2 Details

- Goal: create one top command surface.
- Files: `DesignEconomicsView.tsx`, `EconomicsGroupBar.tsx`, new header component.
- Risk: medium because layout selectors may change.
- Test: group switching still works.
- Test: clone group still works.
- Test: active group screen reader label still exists.
- Acceptance: left context rail no longer renders on desktop economics.
- Avoid: deleting old components until new tests pass.

## Milestone 3 Details

- Goal: make scenario selection concise and singular.
- Files: `ScenarioCompareStrip.tsx`, stories, tests.
- Risk: low to medium.
- Test: active scenario switch works.
- Test: what-changed popover works.
- Test: base scenario displayed.
- Acceptance: no duplicate select controls.
- Avoid: losing full delta visibility.

## Milestone 4 Details

- Goal: make module selection cheaper.
- Files: `EconomicsModuleTabs.tsx`, `DesignEconomicsView.tsx`.
- Risk: low.
- Test: each module still switches.
- Test: E2E module selectors pass.
- Acceptance: module selector no longer occupies a full card row.
- Avoid: hiding module navigation on mobile.

## Milestone 5 Details

- Goal: make production assumptions primary.
- Files: `ProductionModule.tsx`.
- Risk: medium because layout changes affect charts.
- Test: chart remains healthy.
- Test: decline table remains editable.
- Test: no dimension warnings.
- Acceptance: type curve inputs above fold on desktop.
- Avoid: reducing table usability.

## Milestone 6 Details

- Goal: localize economic pulse and label portfolio values.
- Files: `DesignEconomicsView.tsx`, pulse component, bottom KPI strip.
- Risk: medium because users may notice changed values.
- Test: group pulse follows active group.
- Test: portfolio strip says portfolio.
- Acceptance: no unlabeled aggregate numbers near group identity.
- Avoid: removing portfolio context if it remains useful.

## Milestone 7 Details

- Goal: adapt mobile around the new architecture.
- Files: `DesignEconomicsView.tsx`, header component, module components.
- Risk: medium.
- Test: mobile scenario access.
- Test: mobile group access.
- Test: mobile module switching.
- Acceptance: no obsolete `Context`/`Workspace` toggle if rail is gone.
- Avoid: hiding critical controls.

## Milestone 8 Details

- Goal: lock behavior and visual states.
- Files: stories, E2E, component tests.
- Risk: low.
- Test: `npm run ui:components`.
- Test: `npm run ui:audit`.
- Test: `npm run ui:verify`.
- Test: economics E2E.
- Acceptance: all existing economics checks pass.
- Avoid: relying only on manual inspection.

## Milestone 9 Details

- Goal: remove remaining AI-dashboard tells.
- Files: economics components and primitives.
- Risk: low to medium.
- Test: screenshots across themes.
- Test: visual scan for duplicate cards.
- Acceptance: fewer framed panels, less glow, clearer hierarchy.
- Avoid: removing useful density.

## Milestone 10 Details

- Goal: remove dead UI surfaces.
- Files: retired components and stories.
- Risk: low if imports are clean.
- Test: TypeScript build.
- Test: Storybook build.
- Acceptance: no unused economics rail paths.
- Avoid: deleting components still used by other screens.

## Open Product Decisions

- Should economics be primarily group-level or portfolio-level?
- If both, which one is the default screen mode?
- Should portfolio metrics live in a separate tab?
- Should scenario base case be editable from this screen?
- Should "set as base" be an economics action or scenario-management action?
- Should group clone live in the economics header or group management menu?
- Should focus mode remain visible by default?
- Should operations console be available by default or behind disclosure?
- Should type curve summary be editable or read-only?
- Should breakeven WTI be computed per group?
- Should economic pulse include IRR?
- Should unavailable IRR be hidden rather than shown as `0.0%`?
- Should mini maps be part of economics context?
- Should production split matter enough to remain visible?
- Should scenario summaries prioritize pricing or volume deltas?

## Recommended Answers To Open Decisions

- Default economics screen should be group-level.
- Portfolio should be secondary and explicitly labeled.
- Portfolio belongs in results/reporting, not the primary assumption editor.
- Base case selection should remain scenario-management-adjacent.
- Economics screen can show base state but should not overemphasize changing base.
- Group clone can remain visible but subordinate.
- Focus mode can remain visible if users rely on it.
- Operations console should be collapsed by default.
- Type curve summary should be merged with editable inputs.
- Breakeven should be hidden until group-scoped.
- IRR should not show as `0.0%` unless truly calculated as zero.
- Mini maps do not belong in economics unless spatial grouping is being edited.
- Production split can be a small meter.
- Scenario summaries should prioritize assumptions changed from base.

## Design Director Critique

- The current screen is trying to prove it has features.
- A stronger screen would prove it understands the user's task.
- The user is underwriting a selected group under a selected scenario.
- The UI should make those two facts unavoidable.
- The current screen makes those facts visible but not decisive.
- That is why it feels cluttered even after shrinking cards.
- Shrinking cards is a local optimization.
- Removing duplicated decisions is the system fix.
- The scenario row should not be another dashboard card.
- The group row should not be another mini dashboard.
- The module selector should not be another row of cards.
- The production page should not make the forecast chart feel more editable than the inputs.
- Every time a value appears, the user should know its scope.
- Every time a control appears, the user should know whether it changes scenario, group, or module.
- If the control changes scenario, it belongs in scenario ledger.
- If the control changes group, it belongs in group selector.
- If the control changes module, it belongs in module selector.
- If the control changes assumptions, it belongs in the module body.
- If the control exports or snapshots, it belongs in operations.
- That rule alone will clean up most of the screen.

## Why The Previous Pill/Card Direction Failed

- It solved shape before structure.
- It treated clutter as a sizing problem.
- It kept every existing concept visible.
- It turned scenario cards into another row of micro-cards.
- It turned group status into another row of micro-cards.
- It kept the asset card as a duplicated identity surface.
- It kept module selection as a separate card system.
- It did not decide whether economic pulse was local or portfolio.
- It did not elevate the editing controls enough.
- It made the interface denser but not simpler.
- Dense can be good.
- Dense without hierarchy is clutter.
- The redesign needs density with a strict hierarchy.

## Success Metrics

- Time to identify active scenario should be under two seconds.
- Time to identify active group should be under two seconds.
- Time to find type curve inputs should be under two seconds on desktop.
- Number of duplicate active group labels in first viewport should be one or zero depending context.
- Number of duplicate active scenario controls should be one.
- Number of first-viewport bordered regions should decrease.
- Number of visible primary decision areas should decrease.
- Module switching should remain one click.
- Scenario switching should remain one click.
- Group switching should remain one click plus optional dropdown.
- Active group metrics should change after group switch.
- Active scenario deltas should change after scenario switch.
- No major chart should render blank.
- No text should overflow in long group/scenario cases.
- No mobile-critical control should be hidden.

## Manual QA Script

- Open Design view.
- Open Economics workspace.
- Confirm scenario ledger is first economics-specific row.
- Confirm active scenario is obvious.
- Confirm base case is identifiable.
- Confirm group command row appears under scenario ledger.
- Confirm active group appears once.
- Confirm well count appears near group name.
- Confirm producing/DUC/permit are small metadata chips.
- Confirm module selector is compact.
- Switch to Pricing.
- Confirm module body changes.
- Switch to OPEX.
- Confirm module body changes.
- Switch back to Production.
- Confirm type curve inputs are prominent.
- Edit a decline segment.
- Confirm dirty/fresh state updates if supported.
- Switch scenario.
- Confirm scenario state updates.
- Open What Changed.
- Confirm deltas are readable.
- Switch group.
- Confirm group pulse changes.
- Confirm group status chips change.
- Confirm no portfolio number is mislabeled as group.
- Resize to mobile.
- Confirm scenario remains reachable.
- Confirm group remains reachable.
- Confirm module selector remains reachable.
- Confirm type curve inputs appear before forecast outputs.

## Storybook QA Script

- Open command header default story.
- Verify active group and active scenario.
- Open long group name story.
- Verify truncation and tooltip if needed.
- Open many scenarios story.
- Verify overflow behavior.
- Open missing metrics story.
- Verify empty state copy.
- Open stale group story.
- Verify stale state copy.
- Open classic theme story if supported.
- Verify contrast.
- Open mario theme story if supported.
- Verify contrast.
- Open production module story.
- Verify inputs-first hierarchy.
- Open many decline segments story.
- Verify table remains usable.
- Run story tests.

## E2E QA Script

- Run economics coverage in slate.
- Run economics coverage in mario.
- Run economics coverage in mobile.
- Verify no dimension warnings.
- Verify no console errors.
- Verify module switching selectors.
- Verify group switching selectors.
- Verify charts healthy.
- Verify screenshot diffs manually.
- If screenshot diffs are large, inspect for intended layout changes.
- Do not approve if duplicate context surfaces remain.

## Risk Register

- Risk: deleting the rail removes useful context.
- Mitigation: move useful local context into command header.
- Risk: compact scenario summaries hide details.
- Mitigation: keep full what-changed popover.
- Risk: group-scoped metrics differ from portfolio expectations.
- Mitigation: label portfolio values explicitly.
- Risk: module selector becomes too subtle.
- Mitigation: use clear active state and stable position.
- Risk: mobile loses context toggle.
- Mitigation: scenario/group/module remain persistent at top.
- Risk: production inputs become cramped.
- Mitigation: allocate first column width and responsive stacking.
- Risk: Storybook coverage lags.
- Mitigation: update stories in same phase as component changes.
- Risk: E2E selectors break.
- Mitigation: preserve test IDs wherever possible.
- Risk: visual polish turns into restyling.
- Mitigation: enforce deletion/merge checklist before color tweaks.

## Non-Goals

- Do not redesign the entire application shell.
- Do not change economics formulas.
- Do not change persistence schema.
- Do not add a new design system dependency.
- Do not create a new charting library.
- Do not rebuild all modules at once.
- Do not turn the economics screen into a marketing dashboard.
- Do not add more cards to solve clutter.
- Do not hide required assumptions behind modals.
- Do not make portfolio reporting the default if the task is group editing.
- Do not remove scenario comparison.
- Do not remove group switching.
- Do not remove module switching.

## Final Recommendation

- Start with scope correction and shell consolidation.
- Do not start with colors, borders, or card sizing.
- Build a single command header.
- Remove the context rail.
- Make scenario and group the only persistent context controls.
- Make module navigation compact.
- Make production inputs primary.
- Make economic pulse selected-group scoped.
- Label or relocate portfolio metrics.
- Then run visual polish.
- This sequence addresses root cause before aesthetics.
- It should produce a screen that feels less cluttered because it has fewer competing jobs.
- The intended outcome is a calmer, sharper economics workspace where the user always knows what they are editing, under which scenario, and what the selected group economics say in response.
