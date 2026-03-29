# 03 — Refactoring Plan

Concrete steps to split the monoliths. Each section is independent — do them in any order.

---

## Refactor 1: Split the God Hook (`useSlopcastWorkspace.ts`)

**Current state:** 862 lines, 25 useState, 9 useEffect, 50+ return values.
**Target state:** 5 focused hooks composed by a thin orchestrator under 200 lines.

### Strategy: Strangler Fig

Don't rewrite all at once. Extract one domain at a time. After each extraction, the app should work identically.

### Step 1 — Extract `useWellFiltering`

Move to `src/hooks/useWellFiltering.ts`

**Owns:**
- `operatorFilter`, `formationFilter`, `statusFilter` state
- `operatorOptions`, `formationOptions`, `statusOptions` memos
- `filteredWells`, `visibleWellIds`, `dimmedWellIds` memos
- Filter setter functions

**Interface:**
```ts
export function useWellFiltering() {
  // ~80 lines
  return {
    operatorFilter, setOperatorFilter,
    formationFilter, setFormationFilter,
    statusFilter, setStatusFilter,
    operatorOptions, formationOptions, statusOptions,
    filteredWells, visibleWellIds, dimmedWellIds,
  };
}
```

### Step 2 — Extract `useWellSelection`

Move to `src/hooks/useWellSelection.ts`

**Owns:**
- `selectedWellIds` state
- Selection handlers (select, deselect, toggle, select all, clear)
- `selectedVisibleCount` memo
- Lasso/map selection integration

**Accepts:** `visibleWellIds` from `useWellFiltering`

**Interface:**
```ts
export function useWellSelection(visibleWellIds: Set<string>) {
  // ~60 lines
  return {
    selectedWellIds,
    selectedVisibleCount,
    toggleWellSelection,
    selectAllVisible,
    clearSelection,
    setSelectedWellIds,
  };
}
```

### Step 3 — Extract `useGroupManagement`

Move to `src/hooks/useGroupManagement.ts`

**Owns:**
- `groups` state and CRUD operations
- `activeGroupId` state
- Group creation from selected wells
- Group assumption updates (type curve, capex, opex, ownership)
- Group deletion, renaming

**Interface:**
```ts
export function useGroupManagement() {
  // ~150 lines
  return {
    groups, setGroups,
    activeGroupId, setActiveGroupId,
    activeGroup,
    createGroup, deleteGroup, renameGroup,
    updateGroupAssumption,
    addWellsToGroup, removeWellsFromGroup,
  };
}
```

### Step 4 — Extract `useScenarioManagement`

Move to `src/hooks/useScenarioManagement.ts`

**Owns:**
- `scenarios` state
- Scenario CRUD
- Active scenario selection
- Pricing/schedule overrides

**Interface:**
```ts
export function useScenarioManagement() {
  // ~80 lines
  return {
    scenarios, setScenarios,
    createScenario, deleteScenario, updateScenario,
  };
}
```

### Step 5 — Extract `useWorkspaceUI`

Move to `src/hooks/useWorkspaceUI.ts`

**Owns:**
- `viewMode` (wells/economics)
- `pageMode` (design/ops/deals)
- Panel open/close states
- Focus mode
- Tab selections
- localStorage persistence for UI preferences

**Interface:**
```ts
export function useWorkspaceUI() {
  // ~100 lines
  return {
    viewMode, setViewMode,
    pageMode, setPageMode,
    focusMode, setFocusMode,
    opsTab, setOpsTab,
    // ...panel states
  };
}
```

### Step 6 — Slim Down `useSlopcastWorkspace`

The original hook becomes a **thin orchestrator** (~150-200 lines):

```ts
export function useSlopcastWorkspace() {
  const filtering = useWellFiltering();
  const selection = useWellSelection(filtering.visibleWellIds);
  const groupMgmt = useGroupManagement();
  const scenarioMgmt = useScenarioManagement();
  const ui = useWorkspaceUI();

  // Economics calculation (the one thing that cross-cuts domains)
  const processedGroups = useMemo(() => {
    return groupMgmt.groups.map(group => {
      const { flow, metrics } = computeGroupEconomics(group, scenarioMgmt.scenarios);
      return { ...group, flow, metrics };
    });
  }, [groupMgmt.groups, scenarioMgmt.scenarios]);

  const { flow: aggregateFlow, metrics: aggregateMetrics } = useMemo(() => {
    return aggregateEconomics(processedGroups);
  }, [processedGroups]);

  // Persistence
  const persistence = useProjectPersistence({ ... });

  return {
    ...filtering,
    ...selection,
    ...groupMgmt,
    ...scenarioMgmt,
    ...ui,
    processedGroups,
    aggregateFlow,
    aggregateMetrics,
  };
}
```

### Verification

After each extraction:
1. `npm run typecheck` passes
2. `npm test` passes
3. App works identically at `localhost:3000`
4. The extracted hook has its own test file

---

## Refactor 2: Lazy-Load Background Components

**Current state:** 4,039 lines loaded eagerly in the bundle.
**Target state:** Each background loads on-demand when its theme is active.

### Step 1 — Create Lazy Wrappers

In `src/components/backgrounds/index.ts`:

```ts
import { lazy } from 'react';

export const HyperboreaBackground = lazy(() => import('../HyperboreaBackground'));
export const TropicalBackground = lazy(() => import('../TropicalBackground'));
export const StormDuskBackground = lazy(() => import('../StormDuskBackground'));
export const MoonlightBackground = lazy(() => import('../MoonlightBackground'));
export const SynthwaveBackground = lazy(() => import('../SynthwaveBackground'));
export const MarioOverworldBackground = lazy(() => import('../MarioOverworldBackground'));
```

### Step 2 — Wrap in Suspense at the Theme Level

Wherever the background is rendered (likely `AppShell` or `ThemeProvider`):

```tsx
<Suspense fallback={<div className="bg-deep" />}>
  <ActiveBackground />
</Suspense>
```

### Step 3 (Future) — Extract Shared Canvas Logic

If backgrounds share patterns (canvas setup, resize, animation loop, cleanup), extract:

```ts
// src/hooks/useCanvasAnimation.ts
export function useCanvasAnimation(config: CanvasConfig) {
  // Canvas ref, resize observer, requestAnimationFrame loop, cleanup
}
```

Each background becomes a config + draw function instead of a standalone program.

---

## Refactor 3: Split `types.ts`

**Current state:** 497 lines, 46 types, 56 files import from it.
**Target state:** Domain-specific type files with barrel re-export.

### New Structure

```
src/types/
  index.ts          # Re-exports everything (backward compatible)
  well.ts           # Well, WellGroup, WellStatus, Formation
  economics.ts      # DealMetrics, MonthlyCashFlow, CashFlowResult, CommodityPricing
  scenario.ts       # Scenario, ScheduleParams, ScenarioScalars
  deal.ts           # DealRecord, DealSummary
  ownership.ts      # OwnershipParams, CostInterest, NRI
  capex.ts          # CapexItem, CapexSchedule
  opex.ts           # OpexSegment, OpexSchedule
  ui.ts             # ViewMode, PageMode, TabState (if any UI types exist)
```

### Migration

1. Create `src/types/` directory
2. Move types into domain files
3. Create `src/types/index.ts` that re-exports everything:
   ```ts
   export * from './well';
   export * from './economics';
   export * from './scenario';
   // ...
   ```
4. Existing `import { Well } from '@/types'` continues to work unchanged
5. Delete old `src/types.ts`

**Zero breaking changes.** The barrel re-export means no import paths need updating.

---

## Refactor 4: Split `theme.css`

**Current state:** 2,454 lines, 217 sections, everything in one file.
**Target state:** Split by concern, imported from a single entry point.

### Option A: Split by Layer

```
src/styles/
  index.css         # @import for all layers (entry point)
  tokens.css        # CSS custom properties (colors, spacing, radii per theme)
  components.css    # Component-level styles (.glass-panel, .kpi-card, etc.)
  layout.css        # Grid, spacing, page structure
  animations.css    # Keyframes, transitions
  utilities.css     # One-off utility classes
```

`index.css`:
```css
@import './tokens.css';
@import './layout.css';
@import './components.css';
@import './animations.css';
@import './utilities.css';
```

### Option B: Commit to Tailwind

You already have `@tailwindcss/vite` installed. If you go this route:

1. Move CSS custom properties (tokens) into `tailwind.config.ts` `theme.extend`
2. Replace component classes with Tailwind utilities in JSX
3. Keep only theme token definitions in CSS
4. `theme.css` shrinks to ~300 lines (just the `:root` and `[data-theme]` blocks)

**Recommendation:** Option A is lower risk. Option B is higher payoff but more work.

---

## Refactor 5: Add Component Tests (Strategic)

Don't try to test everything. Focus on the highest-value targets.

### Priority 1 — State Hooks (after split)

Test `useWellFiltering`, `useWellSelection`, `useGroupManagement` with `@testing-library/react` `renderHook`:

```ts
import { renderHook, act } from '@testing-library/react';
import { useWellFiltering } from './useWellFiltering';

test('filters wells by operator', () => {
  const { result } = renderHook(() => useWellFiltering());
  act(() => result.current.setOperatorFilter('Pioneer'));
  expect(result.current.filteredWells.every(w => w.operator === 'Pioneer')).toBe(true);
});
```

### Priority 2 — Data Services

Test `projectRepository` and `dealRepository` with mocked Supabase client.

### Priority 3 — Key UI Flows

Playwright tests (already have infrastructure) for:
- Create a well group from selected wells
- Run economics and verify KPI display
- Switch themes and verify no visual regression
