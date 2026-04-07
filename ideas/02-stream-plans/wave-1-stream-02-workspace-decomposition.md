# Stream 2: Workspace Hook Decomposition

**Wave:** 1 (Infrastructure)
**Agent:** `hooks-agent`
**Estimated effort:** ~4 hours
**Dependencies:** Stream 1 (types)

---

## Objective

Decompose the 760-line `useSlopcastWorkspace` god hook into focused domain hooks. This is the structural foundation that every screen-level stream depends on.

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/hooks/useSlopcastWorkspace.ts` | Reduce to thin composition hook |
| `src/hooks/useWellGroups.ts` | **Create** — group CRUD, well assignment, track management |
| `src/hooks/useEconomicsComputation.ts` | **Create** — memoized economics with engine adapter |
| `src/hooks/useWorkspaceUI.ts` | **Create** — viewMode, designWorkspace, wellsViewMode, viewportLayout |
| `src/hooks/useStageNavigation.ts` | **Create** — stage state machine, completion tracking |
| `src/hooks/useAcreageFilter.ts` | **Create** — acreage filter state management |
| `src/services/economicsEngine.ts` | Wire into computation hook (currently unused) |

## Pre-Work (Step 0)

1. Read `src/hooks/useSlopcastWorkspace.ts` in full (760 lines, read in 4 chunks)
2. Map every `useState` call and categorize: domain state, UI state, computed state
3. Identify dead code: `pageMode`, `handleSelectDeal`, `handleCreateDeal`, `handleAcreageSearch`
4. Remove dead code + unused exports. Commit cleanup separately.
5. Read `src/services/economicsEngine.ts` (188 lines) to understand the adapter pattern

## Tasks

### Task 1: Extract `useWorkspaceUI`

Extract all UI state into `src/hooks/useWorkspaceUI.ts`:

```typescript
export function useWorkspaceUI() {
  const [viewMode, setViewMode] = useState<ViewMode>('DASHBOARD');
  const [designWorkspace, setDesignWorkspace] = useState<DesignWorkspace>('WELLS');
  const [wellsViewMode, setWellsViewMode] = useState<WellsViewMode>('MAP');
  const [viewportLayout, setViewportLayout] = useState<ViewportLayout>('desktop');

  // Theme-related state (fxMode, etc.) if currently in workspace hook
  // Sidebar/panel collapse states

  return {
    viewMode, setViewMode,
    designWorkspace, setDesignWorkspace,
    wellsViewMode, setWellsViewMode,
    viewportLayout,
    // ...
  };
}
```

### Task 2: Extract `useStageNavigation`

Create stage state machine in `src/hooks/useStageNavigation.ts`:

```typescript
export function useStageNavigation() {
  const [currentStage, setCurrentStage] = useState<ProjectStage>('ACREAGE_FILTER');
  const [stageCompletion, setStageCompletion] = useState<StageCompletion[]>([
    { stage: 'ACREAGE_FILTER', status: 'empty' },
    { stage: 'TRACK_PICKER', status: 'empty' },
    { stage: 'PDP_WELLS', status: 'empty', trackKind: 'PDP' },
    { stage: 'PDP_FORECAST', status: 'empty', trackKind: 'PDP' },
    { stage: 'UNDEV_WELLS', status: 'empty', trackKind: 'UNDEV' },
    { stage: 'UNDEV_ECONOMICS', status: 'empty', trackKind: 'UNDEV' },
    { stage: 'SCENARIOS', status: 'empty' },
  ]);

  const markStageComplete = useCallback((stage: ProjectStage) => { ... }, []);
  const canNavigateTo = useCallback((stage: ProjectStage) => { ... }, []);
  const navigateTo = useCallback((stage: ProjectStage) => { ... }, []);

  return {
    currentStage,
    stageCompletion,
    markStageComplete,
    canNavigateTo,
    navigateTo,
  };
}
```

### Task 3: Extract `useWellGroups`

Move group CRUD into `src/hooks/useWellGroups.ts`:

```typescript
export function useWellGroups(initialGroups: WellGroup[] = []) {
  const [groups, setGroups] = useState<WellGroup[]>(initialGroups);
  const [activeGroupId, setActiveGroupId] = useState<string>('');

  // All group mutation handlers currently in useSlopcastWorkspace:
  const addGroup = useCallback(...);
  const removeGroup = useCallback(...);
  const updateGroup = useCallback(...);
  const assignWellsToGroup = useCallback(...);
  const removeWellFromGroup = useCallback(...);
  const reorderGroups = useCallback(...);
  const duplicateGroup = useCallback(...);

  // Track-aware helpers
  const pdpGroups = useMemo(() => groups.filter(g => g.track === 'PDP'), [groups]);
  const undevGroups = useMemo(() => groups.filter(g => g.track === 'UNDEV'), [groups]);

  return {
    groups, setGroups,
    activeGroupId, setActiveGroupId,
    addGroup, removeGroup, updateGroup,
    assignWellsToGroup, removeWellFromGroup,
    reorderGroups, duplicateGroup,
    pdpGroups, undevGroups,
  };
}
```

### Task 4: Extract `useEconomicsComputation`

Move economics calculation into `src/hooks/useEconomicsComputation.ts`:

```typescript
import { getEngine } from '../services/economicsEngine';

export function useEconomicsComputation(
  groups: WellGroup[],
  wells: Well[],
  scenarios: Scenario[],
  engineChoice: 'ts' | 'py' = 'ts'
) {
  // Wire the engine adapter instead of calling cachedCalculateEconomics directly
  const engine = useMemo(() => getEngine(engineChoice), [engineChoice]);

  const processedGroups = useMemo(() => {
    return groups.map(group => {
      const groupWells = wells.filter(w => group.wellIds.has(w.id));
      // Use engine adapter
      const result = engine.calculateEconomics(
        groupWells, group.typeCurve, group.capex,
        /* pricing from active scenario */, group.opex, group.ownership
      );
      return { ...group, metrics: result.metrics, flow: result.flow };
    });
  }, [groups, wells, engine]);

  const aggregated = useMemo(
    () => engine.aggregateEconomics(processedGroups),
    [processedGroups, engine]
  );

  return { processedGroups, aggregated };
}
```

### Task 5: Extract `useAcreageFilter`

```typescript
export function useAcreageFilter() {
  const [acreageFilter, setAcreageFilter] = useState<AcreageFilter>({
    operators: [],
    formations: [],
    basins: [],
  });

  const updateFilter = useCallback((partial: Partial<AcreageFilter>) => {
    setAcreageFilter(prev => ({ ...prev, ...partial }));
  }, []);

  const clearFilter = useCallback(() => {
    setAcreageFilter({ operators: [], formations: [], basins: [] });
  }, []);

  const isFilterActive = useMemo(
    () => acreageFilter.operators.length > 0 ||
          acreageFilter.formations.length > 0 ||
          acreageFilter.basins.length > 0,
    [acreageFilter]
  );

  return { acreageFilter, updateFilter, clearFilter, isFilterActive };
}
```

### Task 6: Rewrite `useSlopcastWorkspace` as Composition

Reduce the file to a thin composition hook that orchestrates the domain hooks:

```typescript
export function useSlopcastWorkspace() {
  const ui = useWorkspaceUI();
  const stages = useStageNavigation();
  const acreage = useAcreageFilter();
  const { groups, ...groupActions } = useWellGroups(DEFAULT_GROUPS);
  const { wells, ...wellState } = useWellData(acreage.acreageFilter);
  const selection = useWellSelection(wells);
  const filtering = useWellFiltering(wells);
  const scenarios = useScenarios(DEFAULT_SCENARIOS);
  const economics = useEconomicsComputation(groups, wells, scenarios.scenarios);

  // Compose and return the same interface for backward compatibility
  return {
    ...ui,
    ...stages,
    ...acreage,
    ...groupActions,
    groups,
    ...wellState,
    wells,
    ...selection,
    ...filtering,
    ...scenarios,
    ...economics,
  };
}
```

**Critical:** The return type must remain backward-compatible. All consuming components (`SlopcastPage`, `MapCommandCenter`, `DesignEconomicsView`, etc.) currently destructure from this hook. The new version must export the same property names.

### Task 7: Wire Economics Engine Adapter

In `src/services/economicsEngine.ts`:
- Verify the TS engine correctly wraps `utils/economics.ts`
- Verify the Python engine targets correct backend endpoints
- Export a `getEngine(choice: 'ts' | 'py')` function
- Connect the adapter to `useEconomicsComputation`

## Verification

1. `npx tsc --noEmit` — must pass
2. `npm test` — all existing tests pass (especially economics tests)
3. `npm run dev` — app renders and behaves identically to before decomposition
4. Verify: switching between WELLS/ECONOMICS/ANALYSIS still works
5. Verify: group CRUD still works
6. Verify: economics still compute correctly

## Acceptance Criteria

- [ ] Dead code removed from `useSlopcastWorkspace` (pageMode, handleSelectDeal, etc.)
- [ ] `useWorkspaceUI` extracted and working
- [ ] `useStageNavigation` created with stage state machine
- [ ] `useWellGroups` extracted with all group CRUD
- [ ] `useEconomicsComputation` extracted and using engine adapter
- [ ] `useAcreageFilter` created
- [ ] `useSlopcastWorkspace` reduced to <150 lines composition hook
- [ ] Return interface is backward-compatible (no consuming component changes needed)
- [ ] All existing tests pass
- [ ] App renders and functions identically
