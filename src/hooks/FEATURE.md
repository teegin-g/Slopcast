# Hooks

App-level and component-scoped hooks.

## Entrypoints

- **`useSlopcastWorkspace.ts`** (863 LOC) — Central workspace state: groups, scenarios, selections, persistence. Read in chunks.
- **`useDerivedMetrics.ts`** — Computes deal metrics from workspace state (NPV, IRR, EUR, payout)
- **`useKeyboardShortcuts.ts`** — Global keyboard shortcut bindings
- **`useMapboxMap.ts`** — Map instance lifecycle and interaction handlers
- **`useSidebarNav.ts`** — Sidebar navigation state
- **`useViewportData.ts`** — Viewport-responsive data loading

## Hook Hierarchy

`useSlopcastWorkspace` is the root — it composes persistence, filtering, and derived state. Other hooks consume its output via props or context.

## Tests

- `useSidebarNav.test.ts`, `useViewportData.test.ts`, `useWellFiltering.test.ts`

## Avoid These False Starts

- Don't duplicate state that `useSlopcastWorkspace` already manages
- Don't create new hooks for one-off component logic — colocate in the component
