# Map Workbench Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Spec: `docs/superpowers/specs/2026-06-09-map-workbench-layout-design.md`.

**Goal:** Convert the full-bleed-canvas-with-floating-overlays map workspace into a framed-center workbench (Linear/VS Code two-tier nav): solid chrome (activity rail, groups panel, inspector) frames the map as flex regions; ephemeral UI (tool rail, dock, legend) floats on the canvas.

**Architecture:** Restructure `AppShell` into a two-tier left nav (fixed activity rail + collapsible contextual panel) and `MapCommandCenter` into a flex row (`groups | map(flex-1) | inspector`). Reduce `PageHeader` to a slim action/context bar. Add a dismissible floating bottom dock and rail-toggled map layers, backed by deterministic mock services behind the existing `services/` adapter pattern. Fix a blocking Mapbox marker-render bug first.

**Tech Stack:** React + Vite + TypeScript, Mapbox GL JS, recharts + d3 (installed), Vitest, Storybook, Playwright.

---

## Ultracode execution notes

This plan is structured for parallel fan-out. Phase **dependencies are strict** (0 → 1 → {2,3}); **within Phase 2 and Phase 3, logic tasks are parallelizable** because they own disjoint files. Each task lists `Parallelizable: yes/no` and `Owns:` (the files it writes). Two tasks may run concurrently only if their `Owns:` sets are disjoint. Verification gates (`npm run typecheck`, `npm test`, Storybook, Playwright, `ui:audit`) are explicit — run the listed gate before marking a task complete. Adversarial-check points are flagged with **⚔ VERIFY** for an independent agent to confirm the claim against the running app, not just green tests.

**Baseline expectation:** 2 pre-existing test failures (`PageHeader.test.tsx`, `ThemeSelectorMenu.stories.tsx` Interactive) fail on `main` and are unrelated to this work. Phase 1 Task 1.6 updates `PageHeader.test.tsx` as a side effect of the header rewrite; the ThemeSelectorMenu story failure is addressed in Task 1.7.

**Dev server:** port 3000 is occupied by an unrelated app. Run `npm run dev -- --port 3100 --host 127.0.0.1`. Mapbox token is in `.env` (`VITE_MAPBOX_TOKEN`).

---

## File Structure

**Phase 0 — bugfix**
- Modify: `src/components/slopcast/map/wellLayerController.ts` — fix nested-zoom radius expression.
- Create: `src/components/slopcast/map/wellLayerController.test.ts` — assert radius expressions are top-level interpolates.

**Phase 1 — shell reflow + chrome (keystone)**
- Modify: `src/components/layout/AppShell.tsx` — two-tier flex (activity rail + contextual panel + main column).
- Create: `src/components/layout/ActivityRail.tsx` (+ `.stories.tsx`) — tier-1 fixed nav rail (brand + Wells/Econ/Scenarios icons).
- Create: `src/components/layout/ContextualPanel.tsx` — tier-2 router: `wells` → rich Groups panel, else slim selector.
- Create: `src/components/layout/GroupsPanel.tsx` (+ `.stories.tsx`) — rich group cards + active-group well list (absorbs `OverlayGroupsPanel` content).
- Create: `src/components/layout/SlimGroupSelector.tsx` — compact group dropdown for non-Wells screens.
- Create: `src/services/storage/workspacePreferences` additions — `getPanelCollapsed`/`setPanelCollapsed` for groups + inspector collapse state.
- Modify: `src/components/slopcast/MapCommandCenter.tsx` — wrap canvas + overlays in a flex row with an inspector column; remove the floating groups panel mount.
- Modify: `src/components/slopcast/PageHeader.tsx` — reduce to slim action/context bar.
- Modify: `src/components/slopcast/PageHeader.test.tsx` — update assertions to slim header.
- Modify: `src/components/slopcast/map/OverlayFiltersBar.tsx` — consolidate context strip; drop dynamic `left-[300px]` offset.
- Retire: `src/components/slopcast/map/OverlayGroupsPanel.tsx` — delete after GroupsPanel is live.
- Reuse (no change): `src/components/slopcast/map/GroupInspector.tsx` — mount in the inspector column.

**Phase 2 — context-aware bottom dock**
- Create: `src/types/production.ts` — `MonthlyProduction`, `WellProductionSeries`.
- Create: `src/utils/productionNormalize.ts` (+ `.test.ts`).
- Create: `src/utils/probit.ts` (+ `.test.ts`).
- Create: `src/services/productionService.ts` (+ `.test.ts`) — deterministic mock monthly production.
- Create: `src/components/slopcast/map/insightsDock/InsightsDock.tsx` (+ `.stories.tsx`).
- Create: `src/components/slopcast/map/insightsDock/useDockMode.ts` (+ `.test.ts`).
- Create: `insightsDock/{ForecastTab,EconomicsTab,AssumptionsTab}.tsx` (group mode).
- Create: `insightsDock/{SummaryTab,ProductionChart,ProbitChart}.tsx` (selection mode).
- Modify: `src/components/slopcast/MapCommandCenter.tsx` — mount `InsightsDock` as a floating overlay.

**Phase 3 — map layers**
- Create: `src/services/geologyService.ts` (+ `.test.ts`) — mock formation/type-curve GeoJSON.
- Create: `src/services/heatService.ts` (+ `.test.ts`) — per-well NPV/acre + legend domain.
- Create: `src/components/slopcast/map/MapLayersControl.tsx` — rail toggle group.
- Modify: `src/components/slopcast/map/wellLayerController.ts` — add heat + polygon layer add/remove helpers.
- Modify: `src/components/slopcast/map/OverlayToolbar.tsx` — host the layer toggles.
- Modify: `src/components/slopcast/MapCommandCenter.tsx` — wire layer visibility state.

---

## Phase 0 — Marker-render bugfix (ship first, independent)

### Task 0.1: Fix nested-zoom radius expression in well layers

**Files:**
- Modify: `src/components/slopcast/map/wellLayerController.ts:117-201`
- Test: `src/components/slopcast/map/wellLayerController.test.ts`

**Context:** `addWellStatusLayers` sets `'circle-radius': ['case', selectedState, ['*', defaultRadius, 1.25], defaultRadius]` (line 158 for producing, line 193 for permit). `defaultRadius`/`permitRadius` are `['interpolate', ['linear'], ['zoom'], …]`. Mapbox forbids a `zoom` expression nested inside `case`/`*`, so `addLayer` throws and the producing + permit layers never render. The fix: build the radius as a single top-level `interpolate` whose stop outputs are themselves `case` expressions on `selectedState` (selected = base × 1.25). A `case` as an interpolate *output* is legal; a `zoom`-interpolate inside a `case` is not.

`Parallelizable: no` (other phases depend on a clean map). `Owns: wellLayerController.ts, wellLayerController.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/slopcast/map/wellLayerController.test.ts
import { describe, it, expect } from 'vitest';
import { buildStatusRadius } from './wellLayerController';

describe('buildStatusRadius', () => {
  it('produces a top-level interpolate (zoom never nested in case/*)', () => {
    const expr = buildStatusRadius([4, 7, 11], 1.25);
    expect(expr[0]).toBe('interpolate');
    // stop outputs are case-on-selected, not the other way around
    const firstOutput = expr[4];
    expect(Array.isArray(firstOutput)).toBe(true);
    expect((firstOutput as unknown[])[0]).toBe('case');
  });

  it('selected stop output is base * multiplier', () => {
    const expr = buildStatusRadius([4, 7, 11], 1.25) as unknown[];
    // expr = ['interpolate',['linear'],['zoom'], 6, caseExpr, 10, caseExpr, 14, caseExpr]
    const caseExpr = expr[4] as unknown[];
    // ['case', selectedState, 4*1.25, 4]
    expect(caseExpr[2]).toBeCloseTo(5); // 4 * 1.25
    expect(caseExpr[3]).toBe(4);
  });

  it('no array node anywhere is a zoom-interpolate inside a case', () => {
    const expr = buildStatusRadius([3, 5, 8], 1.25);
    const json = JSON.stringify(expr);
    // a zoom interpolate serializes with ["zoom"]; it must appear exactly once (top level)
    const zoomCount = (json.match(/\["zoom"\]/g) || []).length;
    expect(zoomCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- wellLayerController`
Expected: FAIL — `buildStatusRadius is not a function`.

- [ ] **Step 3: Add the `buildStatusRadius` helper and use it**

Add near the top of `addWellStatusLayers` scope (exported for testing):

```typescript
/**
 * Build a circle-radius expression that interpolates on zoom AND enlarges when
 * the feature is selected. Mapbox forbids nesting a zoom expression inside
 * `case`/`*`, so selection is applied to each interpolate STOP OUTPUT instead.
 * @param stops three radii [z6, z10, z14]
 * @param selectedMultiplier scale factor when feature-state `selected` is true
 */
export function buildStatusRadius(
  stops: [number, number, number] | number[],
  selectedMultiplier: number,
): unknown {
  const selected = ['boolean', ['feature-state', 'selected'], false];
  const stopFor = (r: number) => ['case', selected, r * selectedMultiplier, r];
  return [
    'interpolate', ['linear'], ['zoom'],
    6, stopFor(stops[0]),
    10, stopFor(stops[1]),
    14, stopFor(stops[2]),
  ];
}
```

Then replace line 158:
```typescript
        'circle-radius': buildStatusRadius([4, 7, 11], 1.25),
```
and replace line 193:
```typescript
        'circle-radius': buildStatusRadius([3, 5, 8], 1.25),
```
Remove the now-unused `defaultRadius`/`permitRadius` consts at lines 118-119 (the DUC layer at line 176 uses `defaultRadius` directly — replace it with a plain top-level interpolate inline: `['interpolate', ['linear'], ['zoom'], 6, 4, 10, 7, 14, 11]`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- wellLayerController`
Expected: PASS (3 tests).

- [ ] **Step 5: ⚔ VERIFY in the running app**

Run `npm run dev -- --port 3100 --host 127.0.0.1`, open `http://127.0.0.1:3100/slopcast?section=wells`, switch to the Wells map, zoom in until the "40" cluster breaks apart. Confirm: (a) browser console has **zero** `circle-radius … zoom expression` errors; (b) producing (filled) and permit markers render, not just DUCs; (c) selecting a well visibly enlarges its marker.

- [ ] **Step 6: Commit**

```bash
git add src/components/slopcast/map/wellLayerController.ts src/components/slopcast/map/wellLayerController.test.ts
git commit -m "fix(map): repair nested-zoom radius expr so producing/permit markers render"
```

---

## Phase 1 — Shell reflow + chrome (KEYSTONE — unblocks 2 & 3)

> Phase 1 tasks are mostly sequential because they share `AppShell.tsx` and `MapCommandCenter.tsx`. Tasks 1.1 (ActivityRail) and 1.3 (GroupsPanel) are leaf components and **can be built in parallel** (disjoint files) before the integration tasks wire them in.

### Task 1.1: ActivityRail component (tier-1 nav)

**Files:**
- Create: `src/components/layout/ActivityRail.tsx`
- Create: `src/components/layout/ActivityRail.stories.tsx`

**Context:** A fixed ~46px vertical rail: brand mark at top, then icon buttons for Wells/Economics/Scenarios driving the existing `Section` type from `useSidebarNav`. Theme-native via CSS custom properties; the `isClassic` fork uses warning accent (mirror Sidebar.tsx:54-58). Icons: reuse the same lucide/SVG icons the current `SidebarNav` uses (read `src/components/layout/SidebarNav.tsx` for the exact icon set and copy them).

`Parallelizable: yes` (with 1.3). `Owns: ActivityRail.tsx, ActivityRail.stories.tsx`

- [ ] **Step 1: Read the icon source**

Read `src/components/layout/SidebarNav.tsx` to copy the exact icon components and active-state styling for Wells/Economics/Scenarios.

- [ ] **Step 2: Write the component**

```tsx
// src/components/layout/ActivityRail.tsx
import React from 'react';
import type { Section } from '../../hooks/useSidebarNav';
// NOTE: import the same icons SidebarNav uses (copy from that file)

interface ActivityRailProps {
  section: Section;
  onSetSection: (s: Section) => void;
  isClassic: boolean;
}

const NAV: { id: Section; label: string }[] = [
  { id: 'wells', label: 'Wells' },
  { id: 'economics', label: 'Economics' },
  { id: 'scenarios', label: 'Scenarios' },
];

export function ActivityRail({ section, onSetSection, isClassic }: ActivityRailProps) {
  return (
    <nav
      data-testid="activity-rail"
      className="flex flex-col items-center gap-1 w-[46px] flex-none h-full py-2 theme-transition"
      style={{
        background: 'var(--glass-sidebar-bg)',
        borderRight: '1px solid var(--glass-sidebar-border)',
      }}
      aria-label="Primary"
    >
      <div className={`typo-label font-bold mb-2 ${isClassic ? 'text-theme-warning' : 'text-theme-cyan'}`}>SL</div>
      {NAV.map(item => {
        const active = section === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-current={active ? 'page' : undefined}
            data-testid={`activity-rail-${item.id}`}
            onClick={() => onSetSection(item.id)}
            className={`w-9 h-9 flex items-center justify-center rounded-inner theme-transition focus-visible:outline-2 focus-visible:outline-theme-cyan ${
              active
                ? (isClassic ? 'bg-theme-warning/20 text-theme-warning' : 'bg-theme-cyan/15 text-theme-cyan')
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-surface2/50'
            }`}
          >
            {/* TODO replaced in Step 1: real icon per item.id */}
            <span className="typo-label">{item.label[0]}</span>
          </button>
        );
      })}
    </nav>
  );
}
```
Replace the placeholder `<span>` with the real icons from Step 1 (one per section).

- [ ] **Step 3: Write the story**

```tsx
// src/components/layout/ActivityRail.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ActivityRail } from './ActivityRail';

const meta: Meta<typeof ActivityRail> = {
  title: 'Layout/ActivityRail',
  component: ActivityRail,
  args: { section: 'wells', isClassic: false, onSetSection: () => {} },
};
export default meta;
type Story = StoryObj<typeof ActivityRail>;

export const WellsActive: Story = {};
export const EconomicsActive: Story = { args: { section: 'economics' } };
export const Classic: Story = { args: { isClassic: true } };
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck` → Expected: clean. Run: `npm run storybook` and confirm the three stories render with correct active states and icons.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ActivityRail.tsx src/components/layout/ActivityRail.stories.tsx
git commit -m "feat(layout): add ActivityRail (tier-1 nav)"
```

### Task 1.2: Panel collapse persistence helpers

**Files:**
- Modify: `src/services/storage/workspacePreferences` (read the file first for its exact export style — it already has `getSidebarCollapsed`/`setSidebarCollapsed`)
- Test: colocated test if one exists for that module; otherwise add `workspacePreferences.test.ts`

**Context:** Mirror the existing `getSidebarCollapsed`/`setSidebarCollapsed` pattern to add `getPanelCollapsed(key)`/`setPanelCollapsed(key, v)` for `'groups'` and `'inspector'`. Per spec open-question, collapse state is **in-session only by default** — but reusing the existing localStorage helper is trivial and consistent, so persist it.

`Parallelizable: yes`. `Owns: workspacePreferences module + its test`

- [ ] **Step 1: Read** `src/services/storage/workspacePreferences` to match its exact signature/storage-key convention.
- [ ] **Step 2: Write failing test** asserting `setPanelCollapsed('groups', true)` then `getPanelCollapsed('groups') === true`, and unset returns `null`.
- [ ] **Step 3: Run** `npm test -- workspacePreferences` → FAIL.
- [ ] **Step 4: Implement** `getPanelCollapsed`/`setPanelCollapsed` following the sidebar-collapse code exactly, keyed `slopcast.panel.<key>.collapsed`.
- [ ] **Step 5: Run** `npm test -- workspacePreferences` → PASS.
- [ ] **Step 6: Commit** `git commit -m "feat(storage): add panel collapse persistence helpers"`

### Task 1.3: GroupsPanel component (tier-2 rich panel)

**Files:**
- Create: `src/components/layout/GroupsPanel.tsx`
- Create: `src/components/layout/GroupsPanel.stories.tsx`

**Context:** The rich contextual panel for the Wells screen — group cards (name, well count, status mix, NPV) + active-group well list + "New Group". This **absorbs the content** of the floating `OverlayGroupsPanel.tsx` (read it for the exact data shape, metric formatting, and clone/new-group handlers) and the `SidebarGroupTree`. Reuse `summarizeGroupWells` from `groupInspectorStats.ts` for status counts. Collapsible to a sliver via the Task 1.2 helpers.

`Parallelizable: yes` (with 1.1). `Owns: GroupsPanel.tsx, GroupsPanel.stories.tsx`

- [ ] **Step 1: Read** `src/components/slopcast/map/OverlayGroupsPanel.tsx` (data + handlers), `src/components/slopcast/map/groupInspectorStats.ts` (`summarizeGroupWells`), and `src/components/GroupList.tsx` (existing accent-disciplined card styling) to reuse patterns rather than reinvent.
- [ ] **Step 2: Write the component** — a `flex flex-col` panel (no fixed width; parent column owns width). Props: `{ groups, activeGroupId, onActivateGroup, onNewGroup, onCloneGroup, collapsed, onToggleCollapse, wells }`. Render a collapse chevron, a scrollable group-card list (active card uses **primary cyan** accent per the merged accent-discipline work, not magenta/orange), and the active group's well list. When `collapsed`, render only a sliver with the chevron. Use `rounded-panel` outer / `rounded-inner` nested per CLAUDE.md.
- [ ] **Step 3: Write stories** — `Default` (3 groups, Tier 1 active), `Collapsed`, `SingleGroup`, `Classic`.
- [ ] **Step 4: Verify** — `npm run typecheck` clean; Storybook renders all four; run `npm run ui:audit` to catch forbidden classnames.
- [ ] **Step 5: Commit** `git commit -m "feat(layout): add GroupsPanel (tier-2 rich groups panel)"`

### Task 1.4: ContextualPanel router + SlimGroupSelector

**Files:**
- Create: `src/components/layout/ContextualPanel.tsx`
- Create: `src/components/layout/SlimGroupSelector.tsx`

**Context:** `ContextualPanel` chooses content by `section`: `wells` → `GroupsPanel`; `economics`/`scenarios` → `SlimGroupSelector` (a compact dropdown that switches the active group with no map detail). Depends on Task 1.3.

`Parallelizable: no` (needs 1.3). `Owns: ContextualPanel.tsx, SlimGroupSelector.tsx`

- [ ] **Step 1:** Write `SlimGroupSelector.tsx` — a compact `<select>`-style dropdown (reuse existing combobox styling from the codebase) bound to `groups`/`activeGroupId`/`onActivateGroup`.
- [ ] **Step 2:** Write `ContextualPanel.tsx` — `if (section === 'wells') return <GroupsPanel .../>; return <SlimGroupSelector .../>`. Forward all group props + collapse props.
- [ ] **Step 3: Verify** — `npm run typecheck` clean.
- [ ] **Step 4: Commit** `git commit -m "feat(layout): add ContextualPanel router + SlimGroupSelector"`

### Task 1.5: Integrate two-tier nav into AppShell

**Files:**
- Modify: `src/components/layout/AppShell.tsx:111-176`

**Context:** Replace the single `<aside>` (Sidebar) with `[ActivityRail][ContextualPanel]` as flex siblings before the main column. Keep `useSidebarNav`, the section→workspace sync effect (lines 84-94), and mobile drawer behavior. The `ContextualPanel` consumes `processedGroups`/`activeGroupId`/`setActiveGroupId` already threaded through `workspace`. Collapse state from Task 1.2 helpers.

`Parallelizable: no` (depends 1.1, 1.4). `Owns: AppShell.tsx`

- [ ] **Step 1:** Add imports for `ActivityRail`, `ContextualPanel`, `getPanelCollapsed`/`setPanelCollapsed`. Add `const [groupsCollapsed, setGroupsCollapsed] = useState(() => getPanelCollapsed('groups') ?? false);`.
- [ ] **Step 2:** Replace the desktop `<aside>…<Sidebar/></aside>` block (lines 122-136) with:
```tsx
{viewport !== 'mobile' && (
  <>
    <ActivityRail section={section} onSetSection={handleSetSection} isClassic={workspace.isClassic} />
    <ContextualPanel
      section={section}
      groups={workspace.processedGroups}
      activeGroupId={workspace.activeGroupId}
      onActivateGroup={workspace.setActiveGroupId}
      collapsed={groupsCollapsed}
      onToggleCollapse={() => { const n = !groupsCollapsed; setGroupsCollapsed(n); setPanelCollapsed('groups', n); }}
      isClassic={workspace.isClassic}
    />
  </>
)}
```
Keep the `MobileDrawer` branch using the old `Sidebar` for now (mobile is out of scope for the reflow).

- [ ] **Step 3: Verify** — `npm run typecheck` clean; `npm run build` succeeds.
- [ ] **Step 4: ⚔ VERIFY** — dev server, `?section=wells`: confirm activity rail + groups panel render on the left, switching sections updates both rail active-state and panel content; `?section=economics` shows the slim selector. No console errors.
- [ ] **Step 5: Commit** `git commit -m "feat(layout): wire two-tier nav into AppShell"`

### Task 1.6: Reduce PageHeader to slim action/context bar

**Files:**
- Modify: `src/components/slopcast/PageHeader.tsx`
- Modify: `src/components/slopcast/PageHeader.test.tsx`

**Context:** Remove brand block + primary nav (now in the rail). Keep: scenario + price-deck chips (left), connection status chip (reuse `deriveConnectionState` from `connectionState.ts`), and right-aligned Compare · Run economics · `ThemeSelectorMenu`. Read the full current `PageHeader.tsx` and `DesignWorkspaceTabs.tsx` first; the WELLS/ECONOMICS pill (`DesignWorkspaceTabs`) is **removed** (the rail owns Wells/Econ switching). Read `src/components/slopcast/map/connectionState.ts` for the chip helper.

`Parallelizable: no` (touches header consumed by AppShell). `Owns: PageHeader.tsx, PageHeader.test.tsx`

- [ ] **Step 1:** Read `PageHeader.tsx` (full), `DesignWorkspaceTabs.tsx`, `connectionState.ts`.
- [ ] **Step 2:** Rewrite the header body: a single `flex items-center justify-between` row. Left: scenario chip + price-deck chip (lift the chip markup currently rendered in the workspace; if they live elsewhere, render placeholders wired to the same props and note the prop source). Center-left: connection chip. Right: `Compare` button, `Run economics` button (primary cyan), `ThemeSelectorMenu`. Drop the `DesignWorkspaceTabs` import and the brand block. Preserve `isClassic ? 'sc-header' : …` wrapper classes and `headerAtmosphereClass`/`fxClass`.
- [ ] **Step 3:** Update `PageHeader.test.tsx` — remove assertions for the removed `theme-dropdown-toggle`/nav pills; assert presence of `data-testid="run-economics"` and the connection chip. (This also clears one of the 2 pre-existing baseline failures.)
- [ ] **Step 4: Verify** — `npm test -- PageHeader` PASS; `npm run typecheck` clean.
- [ ] **Step 5: ⚔ VERIFY** — header shows only chips + connection + actions + theme; no nav pills, no oversized brand. Run economics button triggers the same handler as before.
- [ ] **Step 6: Commit** `git commit -m "feat(chrome): reduce PageHeader to slim action/context bar"`

### Task 1.7: MapCommandCenter flex row + mount GroupInspector; retire OverlayGroupsPanel

**Files:**
- Modify: `src/components/slopcast/MapCommandCenter.tsx:546+`
- Delete: `src/components/slopcast/map/OverlayGroupsPanel.tsx`
- Modify: `src/components/slopcast/ThemeSelectorMenu.stories.tsx` (fix the pre-existing Interactive story failure while here)

**Context:** Wrap the existing canvas+overlays in a flex row and add the inspector as a real right column. The map cell keeps `relative` so all current floating overlays (toolbar, legend, selection pill) stay `absolute` within it. `GroupInspector` is presentational (no width) — the column owns width (~288px) + collapse. Remove the `OverlayGroupsPanel` mount (its content now lives in the tier-2 GroupsPanel) and adjust `OverlayFiltersBar`'s offset in Task 1.8.

`Parallelizable: no` (depends 1.5; shares MapCommandCenter with Phases 2-3). `Owns: MapCommandCenter.tsx, OverlayGroupsPanel.tsx (delete), ThemeSelectorMenu.stories.tsx`

- [ ] **Step 1:** Read `MapCommandCenter.tsx:540-620` (the container + overlay mounts) and `GroupInspector.tsx` props.
- [ ] **Step 2:** Change the root container (line 546) from a single `relative` box to a flex row wrapper:
```tsx
<div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
  <div className={`relative flex-1 overflow-hidden ${mapFrameClass}`}>
    {/* existing canvas + absolute overlays unchanged */}
  </div>
  <aside
    data-testid="inspector-column"
    className={`flex-none transition-[width] duration-300 ${inspectorCollapsed ? 'w-8' : 'w-[288px]'} overflow-y-auto`}
    style={{ background: 'var(--glass-sidebar-bg)', borderLeft: '1px solid var(--glass-sidebar-border)' }}
  >
    {inspectorCollapsed
      ? <button data-testid="inspector-expand" onClick={() => setInspectorCollapsed(false)} className="w-full h-full">⟨</button>
      : <div className="p-3"><GroupInspector {...inspectorProps} /></div>}
  </aside>
</div>
```
Add `const [inspectorCollapsed, setInspectorCollapsed] = useState(() => getPanelCollapsed('inspector') ?? false);` and a collapse toggle. Derive `inspectorProps` from the active group + `summarizeGroupWells` (read `GroupInspector.stories.tsx` for the exact prop shape).
- [ ] **Step 3:** Remove the `OverlayGroupsPanel` import + JSX mount. Delete the file. Grep for other importers: `grep -rn OverlayGroupsPanel src/` → expect none after removal.
- [ ] **Step 4:** Fix `ThemeSelectorMenu.stories.tsx` Interactive story (it can't find the `listbox` — update the play function selector to match the portaled menu; read the component for the correct role/testid).
- [ ] **Step 5: Verify** — `npm run typecheck` clean; `npm run build` succeeds; `npm test` (the ThemeSelectorMenu story failure now resolved → baseline failures gone).
- [ ] **Step 6: ⚔ VERIFY** — inspector renders as a right column beside the map (not overlapping the tool rail); collapse/expand works; the floating groups panel is gone; group metrics appear in the inspector.
- [ ] **Step 7: Commit** `git commit -m "feat(map): flex-row shell with inspector column; retire floating groups panel"`

### Task 1.8: Consolidate the context/filter strip

**Files:**
- Modify: `src/components/slopcast/map/OverlayFiltersBar.tsx`

**Context:** With the groups panel now a flex sibling (not floating), the filter bar's dynamic `left-[300px]`/`left-3` offset (lines 144-147) is obsolete — it should span the map cell. Fold in active-group + status counts + in-view count + Filters/Clear so there's one strip, not a duplicate row.

`Parallelizable: no` (depends 1.7). `Owns: OverlayFiltersBar.tsx`

- [ ] **Step 1:** Read `OverlayFiltersBar.tsx` fully.
- [ ] **Step 2:** Remove the `groupsPanelOpen` conditional offset; set the bar to `absolute top-3 left-3 right-[56px]` (clearing only the floating tool rail). Add a left segment: active group name + status counts (`14P · 13D · 13Pm`) + in-view count, then the existing operator/formation/status dropdowns + Filters/Clear.
- [ ] **Step 3:** Remove the now-unused `groupsPanelOpen` prop from the component and its caller in `MapCommandCenter.tsx`.
- [ ] **Step 4: Verify** — `npm run typecheck` clean; `npm run ui:audit` clean.
- [ ] **Step 5: ⚔ VERIFY** — one strip across the top of the map showing group context + filters; no leftover gap where the floating panel offset used to be.
- [ ] **Step 6: Commit** `git commit -m "feat(map): consolidate group context into the filter strip"`

### Task 1.9: Phase 1 visual regression gate

`Parallelizable: no`. `Owns: (none — verification only)`

- [ ] **Step 1:** Run the full gate: `npm run typecheck && npm test && npm run build && npm run ui:audit`. All green (no pre-existing failures remain after 1.6/1.7).
- [ ] **Step 2:** `npm run ui:shots` then review desktop + mobile across **slate + permian + mario** on the WELLS screen. Confirm the workbench reads correctly per theme; capture before/after.
- [ ] **Step 3: ⚔ VERIFY (independent agent):** open the app and confirm against the spec's composite: activity rail (fixed) | groups panel (collapsible) | map | inspector (collapsible); slim header; floating dock-area empty (dock arrives Phase 2); rail floats without colliding. File any deviation as a new task.

---

## Phase 2 — Context-aware bottom dock

> Logic tasks 2.1–2.4 are **parallelizable** (disjoint files). UI tasks 2.5–2.8 depend on them. 2.9 integrates.

### Task 2.1: Production types

**Files:** Create `src/types/production.ts`; Modify `src/types/index.ts` (barrel export).
`Parallelizable: yes`. `Owns: types/production.ts, types/index.ts (append only)`

- [ ] **Step 1:** Define and export:
```typescript
// src/types/production.ts
export interface MonthlyProduction {
  monthIndex: number; // 0-based months from first production
  oilBbl: number;
  gasMcf: number;
}
export interface WellProductionSeries {
  wellId: string;
  firstProductionMonthOffset: number; // months from group t0
  months: MonthlyProduction[];
}
```
- [ ] **Step 2:** Add `export * from './production';` to `src/types/index.ts`.
- [ ] **Step 3: Verify** `npm run typecheck` clean. **Commit** `git commit -m "feat(types): add production series types"`.

### Task 2.2: productionNormalize util (TDD)

**Files:** Create `src/utils/productionNormalize.ts` (+ `.test.ts`).
`Parallelizable: yes`. `Owns: utils/productionNormalize.ts(+test)`

- [ ] **Step 1: Failing test** — `normalizeToFirstProduction(series)` shifts each series so `monthIndex` 0 = first producing month; asserts a series with `firstProductionMonthOffset: 3` maps its month 0 to aligned index 0, and that aggregation across two offset series sums correctly at aligned indices.
- [ ] **Step 2:** Run `npm test -- productionNormalize` → FAIL.
- [ ] **Step 3:** Implement the normalization (pure function, no deps).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(utils): add production normalization"`.

### Task 2.3: probit util (TDD)

**Files:** Create `src/utils/probit.ts` (+ `.test.ts`).
`Parallelizable: yes`. `Owns: utils/probit.ts(+test)`

- [ ] **Step 1: Failing test** — `percentileToProbit(p)` maps p∈(0,1) to a z-position; assert `percentileToProbit(0.5) ≈ 0`, monotonic increasing, and `probitColor(value, domain)` returns a color string within the legend scale.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement using an inverse-normal-CDF approximation (Acklam or rational approx — include the constants inline; no new dependency).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(utils): add probit position + color helpers"`.

### Task 2.4: productionService mock (TDD)

**Files:** Create `src/services/productionService.ts` (+ `.test.ts`).
`Parallelizable: yes`. `Owns: services/productionService.ts(+test)`

**Context:** Deterministic monthly production per well derived from the group's type curve. **Reuse path (verified):** `src/utils/economics.ts` does NOT export a standalone decline function — the production math lives inside `calculateEconomics` (economics.ts:275), whose returned `MonthlyCashFlow[]` already carries `oilProduction`/`gasProduction` per month (see `src/types/economics.ts:115`). So `productionService` should run `calculateEconomics` for a single-well group (or scale the group curve by well share) and map `MonthlyCashFlow.oilProduction`/`gasProduction` → `MonthlyProduction`. Mirror the adapter shape of `src/services/economicsEngine.ts` (read it for the pattern). Determinism: `calculateEconomics` is already deterministic; seed any per-well variance from a hash of `wellId`, never `Math.random`.

- [ ] **Step 1: Failing test** — `getProductionSeries(wells, typeCurve)` returns one `WellProductionSeries` per well; calling twice yields deep-equal output (determinism); month 0 oil ≈ `qi` scaled; series length matches horizon (`MONTHS_TO_PROJECT` from economics.ts = 120).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement by calling `calculateEconomics` (economics.ts:275) and mapping each `MonthlyCashFlow`'s `oilProduction`/`gasProduction` (types/economics.ts:115) into `MonthlyProduction`. Do NOT reimplement Arps. Hash `wellId` for any per-well variance.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(services): add deterministic mock productionService"`.

### Task 2.5: useDockMode hook (TDD)

**Files:** Create `insightsDock/useDockMode.ts` (+ `.test.ts`).
`Parallelizable: no` (leaf, but logically grouped). `Owns: useDockMode.ts(+test)`

- [ ] **Step 1: Failing test** — `useDockMode(selectionCount)` returns `'group'` when count 0, `'selection'` when >0; remembers last active tab per mode across mode switches.
- [ ] **Step 2-4:** Implement with `useState`/`useEffect`; tests pass (use `@testing-library/react` `renderHook`).
- [ ] **Step 5: Commit** `git commit -m "feat(dock): add useDockMode"`.

### Task 2.6: Group-mode tabs (Forecast/Economics/Assumptions)

**Files:** Create `insightsDock/{ForecastTab,EconomicsTab,AssumptionsTab}.tsx`.
`Parallelizable: yes` (after 2.1–2.4). `Owns: those three files`

- [ ] **Step 1:** `ForecastTab` — render the normalized group production (recharts) from `productionService` + `productionNormalize`. `EconomicsTab` — reuse `src/components/slopcast/WaterfallChart.tsx` (read it) with the active group's metrics. `AssumptionsTab` — read-only summary of type curve/CAPEX/OPEX/ownership.
- [ ] **Step 2: Verify** `npm run typecheck` clean. **Commit** `git commit -m "feat(dock): add group-mode tabs"`.

### Task 2.7: Selection-mode tabs (Summary/Production/Probit)

**Files:** Create `insightsDock/{SummaryTab,ProductionChart,ProbitChart}.tsx`.
`Parallelizable: yes` (after 2.1–2.4). `Owns: those three files`

- [ ] **Step 1:** `SummaryTab` — counts + aggregate metrics for the selected wells. `ProductionChart` — aggregated normalized series for the selection. `ProbitChart` — per-well metric plotted on probit axis using `probit.ts`.
- [ ] **Step 2: Verify** `npm run typecheck` clean. **Commit** `git commit -m "feat(dock): add selection-mode tabs"`.

### Task 2.8: InsightsDock shell + stories

**Files:** Create `insightsDock/InsightsDock.tsx` (+ `.stories.tsx`).
`Parallelizable: no` (depends 2.5–2.7). `Owns: InsightsDock.tsx, InsightsDock.stories.tsx`

- [ ] **Step 1:** Build the dismissible floating shell: `absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[64%]` with a mode switch (`useDockMode`), tab bar, and a close button. Group mode → 2.6 tabs; selection mode → 2.7 tabs. `rounded-panel`, theme-native surfaces.
- [ ] **Step 2:** Stories: `GroupMode`, `SelectionMode`, `Dismissed`.
- [ ] **Step 3: Verify** — Storybook renders both modes; `npm run ui:audit` clean. **Commit** `git commit -m "feat(dock): add InsightsDock shell"`.

### Task 2.9: Mount InsightsDock in MapCommandCenter

**Files:** Modify `src/components/slopcast/MapCommandCenter.tsx`.
`Parallelizable: no`. `Owns: MapCommandCenter.tsx (dock mount region)`

- [ ] **Step 1:** Mount `<InsightsDock>` inside the map cell's absolute-overlay container, wired to selection count + active group + `productionService`. Dismiss state in local `useState`.
- [ ] **Step 2: Verify** `npm run typecheck && npm run build` clean.
- [ ] **Step 3: ⚔ VERIFY** — dock floats at bottom showing group economics; lasso-selecting wells flips it to selection analytics; dismiss hides it and the map is full-height; re-open restores last tab.
- [ ] **Step 4: Commit** `git commit -m "feat(map): mount context-aware InsightsDock"`.

---

## Phase 3 — Map layers (heat + formation polygons)

> 3.1, 3.2 parallelizable (disjoint services). 3.3–3.5 integrate.

### Task 3.1: heatService mock (TDD)

**Files:** Create `src/services/heatService.ts` (+ `.test.ts`).
`Parallelizable: yes`. `Owns: services/heatService.ts(+test)`

- [ ] **Step 1: Failing test** — `getNpvPerAcre(wells, metrics)` returns one value per well + a `{min,max}` legend domain; deterministic.
- [ ] **Step 2-4:** Implement (derive NPV/acre from existing group metrics; deterministic). Tests pass.
- [ ] **Step 5: Commit** `git commit -m "feat(services): add mock heatService"`.

### Task 3.2: geologyService mock (TDD)

**Files:** Create `src/services/geologyService.ts` (+ `.test.ts`).
`Parallelizable: yes`. `Owns: services/geologyService.ts(+test)`

- [ ] **Step 1: Failing test** — `getFormationPolygons()` returns valid GeoJSON `FeatureCollection` with `formation` + label props; coordinates within the Permian bbox; deterministic.
- [ ] **Step 2-4:** Implement returning a small hand-authored FeatureCollection. Tests pass.
- [ ] **Step 5: Commit** `git commit -m "feat(services): add mock geologyService"`.

### Task 3.3: Layer add/remove helpers in wellLayerController

**Files:** Modify `src/components/slopcast/map/wellLayerController.ts`.
`Parallelizable: no` (depends 3.1, 3.2; shares the file touched in Phase 0 — must come after 0.1 merges). `Owns: wellLayerController.ts (new exported helpers only)`

- [ ] **Step 1:** Add `addHeatLayer(map, values, domain)` / `removeHeatLayer(map)` (circle-color interpolated on NPV/acre) and `addFormationLayer(map, geojson)` / `removeFormationLayer(map)` (fill + line + symbol label). Pure layer ops, idempotent (guard with `getLayer`/`getSource`).
- [ ] **Step 2:** Add a unit test asserting the heat color expression is a top-level `interpolate` (no nested-zoom regression).
- [ ] **Step 3: Verify** `npm test -- wellLayerController` PASS. **Commit** `git commit -m "feat(map): add heat + formation layer helpers"`.

### Task 3.4: MapLayersControl in the tool rail

**Files:** Create `src/components/slopcast/map/MapLayersControl.tsx`; Modify `OverlayToolbar.tsx`.
`Parallelizable: no`. `Owns: MapLayersControl.tsx, OverlayToolbar.tsx`

- [ ] **Step 1:** `MapLayersControl` — toggle group (Wells / NPV heat / Formations) emitting a `{wells,heat,formations}` visibility object. Read `OverlayToolbar.tsx` and slot it into the existing "DATA" section of the rail.
- [ ] **Step 2: Verify** Storybook/typecheck clean. **Commit** `git commit -m "feat(map): add MapLayersControl to tool rail"`.

### Task 3.5: Wire layer visibility in MapCommandCenter

**Files:** Modify `src/components/slopcast/MapCommandCenter.tsx`.
`Parallelizable: no`. `Owns: MapCommandCenter.tsx (layer wiring region)`

- [ ] **Step 1:** Hold `layerVisibility` state; on change call the Task 3.3 add/remove helpers with data from `heatService`/`geologyService`. Default: wells on, heat/formations off.
- [ ] **Step 2: Verify** `npm run typecheck && npm run build` clean.
- [ ] **Step 3: ⚔ VERIFY** — toggling NPV heat recolors wells with a legend; toggling Formations draws labeled polygons; toggles are independent; no console errors.
- [ ] **Step 4: Commit** `git commit -m "feat(map): wire rail-toggled map layers"`.

### Task 3.6: Final full-gate + cross-theme regression

`Parallelizable: no`. `Owns: (verification only)`

- [ ] **Step 1:** `npm run typecheck && npm test && npm run build && npm run ui:audit` — all green.
- [ ] **Step 2:** `npm run ui:shots` + `npm run ui:verify` across slate/permian/mario, WELLS + ECONOMICS.
- [ ] **Step 3: ⚔ VERIFY (independent agent):** full workbench against the spec — every locked decision present; no regressions to Phase 1; markers/heat/polygons/dock all functional. Produce a short pass/fail report.

---

## Self-Review

- **Spec coverage:** Phase 0 ↔ spec "Phase 0 bugfix"; Tasks 1.1–1.9 ↔ two-tier nav, slim top bar, context strip, inspector placement, retire OverlayGroupsPanel, collapse behavior; Phase 2 ↔ context-aware dock + productionService + probit/normalize; Phase 3 ↔ heat + formation layers + rail toggles + geology/heat services. Constraints (isClassic fork, Python engine, theme-native, scope) carried into task notes. The two spec "Open questions" are resolved in-plan (Task 1.2 persists collapse; Task 1.4/1.7 place the tier-2 panel in AppShell, map row starts at the canvas).
- **Type consistency:** `buildStatusRadius`, `WellProductionSeries`/`MonthlyProduction`, `getProductionSeries`, `normalizeToFirstProduction`, `percentileToProbit`/`probitColor`, `useDockMode`, `getNpvPerAcre`, `getFormationPolygons`, `add/removeHeatLayer`, `add/removeFormationLayer` are each defined in one task and referenced consistently.
- **Placeholder scan:** the only inline `TODO` is the ActivityRail icon, explicitly resolved in its Step 1/Step 2.
