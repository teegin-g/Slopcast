# Slopcast Workspace UI

This folder owns the main product-specific UI for the Slopcast workspace: wells, map interactions, economics panels, review surfaces, and shared workspace chrome.

## Read This First

- [`../../pages/SlopcastPage.tsx`](../../pages/SlopcastPage.tsx): live page entrypoint (renders workspace UI; state lives in `useSlopcastWorkspace`)
- [`../../hooks/useSlopcastWorkspace.ts`](../../hooks/useSlopcastWorkspace.ts): canonical workspace state — groups, scenarios, selections, persistence
- [`MapCommandCenter.tsx`](MapCommandCenter.tsx): map shell, overlay panels, and viewport-driven well rendering
- [`hooks/useProjectPersistence.ts`](hooks/useProjectPersistence.ts): save/load bridge between workspace state and `projectRepository`
- [`../../services/FEATURE.md`](../../services/FEATURE.md): adapter routing for persistence, economics, and spatial fetches

## Key Neighbors

- [`DesignEconomicsView.tsx`](DesignEconomicsView.tsx): economics-side workspace UI
- [`DesignWorkspaceTabs.tsx`](DesignWorkspaceTabs.tsx): wells vs economics workspace switching
- [`EconomicsResultsTabs.tsx`](EconomicsResultsTabs.tsx): results-mode tab model
- [`PageHeader.tsx`](PageHeader.tsx): top-of-workspace controls and context
- [`map/`](map): overlay toolbar, filters, selection bar, and group panel

## Tests And Stories

- [`KpiGrid.stories.tsx`](KpiGrid.stories.tsx), [`PageHeader.stories.tsx`](PageHeader.stories.tsx), [`WorkflowStepper.stories.tsx`](WorkflowStepper.stories.tsx): representative reusable UI stories in this area
- [`WellsTable.test.tsx`](WellsTable.test.tsx), [`CashFlowTable.test.tsx`](CashFlowTable.test.tsx): nearby focused component tests
- [`map/OverlayToolbar.stories.tsx`](map/OverlayToolbar.stories.tsx), [`map/OverlayFiltersBar.stories.tsx`](map/OverlayFiltersBar.stories.tsx): map UI story entrypoints

## Related Docs

- [`../../../docs/specs/04-spatial-layers-map.md`](../../../docs/specs/04-spatial-layers-map.md): target-state spatial and map integration work
- [`../../../AGENTS.md`](../../../AGENTS.md): UI verification workflow

## Avoid These False Starts

- Do not start with isolated `*.stories.tsx` files when debugging workspace behavior; start at `SlopcastPage.tsx`, then drop into the component or hook that owns the surface.
- `useSlopcastWorkspace` (in `src/hooks/`) is the canonical state source for the workspace — do not duplicate its state or look for top-level state in `SlopcastPage.tsx`.
- Do not search all of `src/components/` first for map work; start with `MapCommandCenter.tsx` and `map/`.
