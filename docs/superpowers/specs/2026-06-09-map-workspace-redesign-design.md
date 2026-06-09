# Slopcast Map Workspace Redesign — Design Spec

- **Date:** 2026-06-09
- **Status:** Approved (design), implementation in progress
- **Author:** brainstormed with Claude (superpowers + impeccable)
- **Branch:** `feat/map-workspace-redesign`

## Problem

The WELLS / map workspace looks amateur. Observed live (Permian + Slate themes):

- **Atmosphere drowns the data.** Permian's green background renders over the map so heavily that wells and city labels nearly vanish. Wells barely read in Slate either — for an app whose first principle is "data has gravity," the stars of the screen are the faintest thing on it.
- **Off-system Groups panel.** The floating Groups/Scenarios overlay uses a glass treatment plus an accent button that is magenta in Slate and orange in Permian — a *secondary* accent used as a *primary* action, clashing with every theme. This is the "white-outline glass" inconsistency.
- **Undisciplined accents.** Magenta/orange "New Group", a green "Live" badge, and blue active tools all compete. The product register reserves accent for primary action + current selection only.
- **Heavy, loosely-aligned top bar.** An oversized `WELLS ——— ECONOMICS` segmented pill dominates the header with no clear job.
- **Connection state is invisible until it breaks.** No real warning surface for Databricks or Mapbox being unreachable.
- **The entire bottom band is empty.**

## Goal

A professional, cinematic-but-legible map workspace that matches the brand (bold, opinionated, war-room energy) without becoming a dense Bloomberg terminal. Per PRODUCT.md: *data has gravity, earn every pixel, theme-native, opinionated defaults*.

## Scope

- **In:** Map workspace **plus global chrome** (top bar, left sidebar, new right sidebar). Per-theme atmosphere tuning. New right inspector. New context-aware bottom dock. Map layers: economics-heat overlay + type-curve/formation polygons. Connection warning states. Surface + accent unification.
- **Decisions locked during brainstorming:**
  - Scope = **workspace + global chrome**.
  - Atmosphere = **per-theme tuning** (tame Permian, leave Slate clean).
  - Bottom dock = **context-aware hybrid** (group economics by default, selection analytics on lasso).
  - Pull-in layers = **economics heat** + **type-curve / formation polygons**.
  - Data = **deterministic mock generators behind the existing service/adapter pattern**; real Databricks wiring is a later swap.
- **Deferred (explicitly out for now):** Top Changes / assumption-diff tracking, Top Risks / risk model, Snapshot / Send-for-review collaboration, real Databricks wiring for production/heat/polygons, the Economics page deep-dive (only linked to).
- **Constraint:** Keep the Classic (Mario) `isClassic` fork theme-native, do not remove it. Python economics engine stays (TS↔Python parity).

## Information Architecture

Three data surfaces, each with one job:

| Surface | Scope | Contents |
|---|---|---|
| **Left sidebar** | navigation + groups | App nav (Map/Wells/Economics/Scenarios) + Well Groups list (switch active group, + New, Compare groups) |
| **Right inspector** (new) | the **active group** | 6-stat grid, well-status donut, assumptions summary (type curve / CAPEX / OPEX / ownership), "View details" → Economics |
| **Bottom dock** (new) | context-aware | **Group mode** (default): Forecast · Economics · Assumptions · Well list. **Selection mode** (on lasso/filter-select): Summary · Production · Probit |

The floating Groups overlay panel is **removed**; its NPV/EUR card becomes the inspector's stat grid. Clicking a group on the left makes it active; the right inspector reflects it (master → detail).

## Detailed Design

### 1. Global chrome

- **Top bar (single row):** wordmark · nav pills (HUB/DESIGN/SCENARIOS) · spacer · `Scenario ▾` chip · `Price deck ▾` chip · connection status chip · theme chip · `Compare` (ghost) · `Run economics` (primary). Replaces the oversized WELLS/ECONOMICS segmented pill.
- **Context strip (slim row under top bar):** active group name + color dot · well-count pill · status counts (`14 Producing · 13 DUC · 13 Permit`) · "N of M in view" · `Filters [n]` · `Clear`.
- **Left sidebar:** nav (icon + label) over a Well Groups list. Each group row: color dot, name, NPV (muted), well count / scenario. `+ New` in the section header, `Compare groups` pinned at the bottom.

### 2. Atmosphere & data legibility (per-theme tuning)

- Introduce a per-theme **atmosphere-over-map opacity** ceiling so the animated/gradient background never buries map data. Tame Permian specifically; leave Slate as-is.
- Mechanism: a CSS custom property (e.g. `--map-atmosphere-opacity`) consumed by the map's atmosphere layer, defaulted per theme in the theme definitions (theme-native, not a conditional in the map component). Honor `prefers-reduced-motion`.
- **Wells get gravity:** brighter status-colored markers (Producing/DUC/Permit), selected wells ringed in the theme accent, laterals as thin lines. Verify ≥3:1 marker/label contrast against the (tamed) backdrop in every theme.

### 3. Surface & accent system

- **One overlay surface treatment.** Replace `overlayPanelClass`'s glass white-outline with a unified solid/tinted surface matching the sidebar and toolbar (same `--surface`, `--border`, radius). Keep `panelStyle` as a theme knob but ensure all values read as intentional over the map; remove the bright-outline-on-dark artifact.
- **Accent discipline.** Theme primary accent used only for: active nav, current selection, primary buttons. Replace the magenta/orange "New Group" with a neutral/primary treatment. Status colors (producing/duc/permit; success/warn/error) are the only other hues. The connection chip's green becomes part of the semantic status vocabulary (§7), not a lone warm accent.

### 4. Right inspector (new component)

- **Component:** `GroupInspector` (collapsible right sidebar).
- **Inputs:** active `WellGroup`, derived `DealMetrics`, well-status breakdown, assumptions.
- **Sections:** header (group name + color + meta + "View details"); 6-stat grid (NPV10/CAPEX/Payout/EUR/Avg Lateral/Avg Stages); well-status donut (Producing/DUC/Permit/Other with counts + %); assumptions summary (type curve qi/b/Di, CAPEX, OPEX, ownership).
- **Donut:** recharts `<PieChart>` (lib already present) or CSS conic-gradient fallback; theme-palette colors.
- Default open (there is always an active group); collapsible to reclaim map width.

### 5. Context-aware bottom dock (new component)

- **Component:** `InsightsDock` (collapsible, docked under the map column; spans map + inspector width like the reference).
- **Mode** derived from selection state: `selectedWellIds` empty → **group mode**; non-empty → **selection mode**. A blue dot + group name vs a green dot + "N selected · Clear selection" is the mode tell. Tabs swap with mode; collapse remembers the last tab per mode.
- **Group mode tabs:**
  - *Forecast* — rate vs time (oil/gas/boe selector), P10–P90 band, type-curve line, actuals. recharts `ComposedChart`.
  - *Economics* — NPV waterfall (reuse existing `WaterfallChart`).
  - *Assumptions* — parameter table (Base case / type curve / source).
  - *Well list* — the active group's constituent wells table.
- **Selection mode tabs (original ask):**
  - *Summary* — table of selected wells (Well, Operator, Formation, Spud, Lateral ft, EUR, Cum 365…).
  - *Production* — production history **normalized to first producing month (t=0)**, one line per well, **color-by** (formation/operator/spud year/…); hover → per-well tooltip at that month.
  - *Probit* — selected production/design variable plotted against its percentile rank (O&G probit); **color-by** and **shape-by** independent encodings.
- **Empty state:** when nothing is selected and group mode has no data yet, show an opinionated prompt ("Lasso wells to compare a custom selection"), never a dead panel.

### 6. Map layers (pull-ins)

- **Layers control** on the map: Wells, Laterals, Economics heat, Type-curve areas, Satellite (consolidating today's scattered toggles).
- **Economics heat:** color wells/areas by NPV-per-acre with a Low→High legend (mock data now).
- **Type-curve / formation polygons:** render boundary polygons + labels (Wolfcamp A/B/D, type-curve areas) from mock GeoJSON.
- **Map furniture:** minimap inset, scale bar, compass — consistent with theme surfaces.

### 7. Connection status & warnings (workstream 1)

- **Header connection chip** is the single source of truth: `Live` (green) / `Degraded` (amber) / `Unreachable` (red) with a short message, covering **both** Databricks (`useConnectionStatus` → `/api/spatial/status`) and Mapbox (token missing / GL load failure).
- On unreachable, surface a persistent, dismissible inline warning (not just a transient toast) explaining impact and the active fallback (mock data / no basemap). Never rely on color alone — pair with icon + label.

## Data & Adapters (mock scaffolding)

Follow the existing `services/` adapter pattern (cf. `economicsEngine`, `spatialService`, `wellUniverseService`) so each new data source is a clean swap to Databricks later.

- **Production history:** deterministic per-well monthly generator from the well's type-curve params (qi, b, Di) + seeded jitter → `MonthlyProduction[]`. New `productionService` with `mock` + future `databricks` impl. Normalizable to t=0.
- **Economics-per-acre (heat):** derive from per-well economics / spacing; expose via the economics adapter or a small `heatService`.
- **Type-curve & formation polygons:** mock GeoJSON (constants or `geologyService`).
- Determinism (seeded) so tests and screenshots are stable.

## Theming

- New per-theme tokens: `--map-atmosphere-opacity` (and any unified overlay-surface tokens). Defaults live in each theme definition; components consume tokens, not conditionals (except the `isClassic` fork, which is preserved and made theme-native).

## Testing

- **Vitest:** mock generators (deterministic output), probit percentile math, t=0 normalization, donut/status aggregation.
- **Storybook:** stories for `GroupInspector`, `InsightsDock` (both modes), and each chart, using `DEFAULT_*` constants + small well sets.
- **Playwright:** `ui:shots` for the WELLS tab in **slate + permian + mario**; `ui:verify` for select→dock→inspector flows.
- **Gate:** `.agents/validation/gate.sh` (typecheck → build → test → storybook → audit → screenshots → E2E). Run `npm run ui:audit` after visual changes; use `rounded-panel` outer / `rounded-inner` nested.

## Build Order (priority: polish first)

1. **Phase 1 — Polish & chrome.** Surface + accent unification; remove floating Groups panel; per-theme atmosphere taming + well legibility; slim top bar + context strip; left sidebar groups list; connection chip + warnings; **right inspector**.
2. **Phase 2 — Context-aware dock.** Dock shell + mode switching; group mode (Forecast / Economics / Assumptions / Well list); selection mode (Summary / Production / Probit); mock `productionService`.
3. **Phase 3 — Map layers.** Economics-heat overlay + legend; type-curve / formation polygons; minimap / scale / compass; mock `geologyService` + heat data.

Each phase: TDD where it counts, atomic commits, run the gate, screenshot WELLS across themes. Open a **draft PR** early and accumulate commits.

## Open Risks

- **Map data shape:** production/heat/polygon mock generators must match whatever the real Databricks schema will be closely enough that the later swap is mechanical. Mitigation: model mock types on `tbl_well_summary_all` columns where known.
- **Vertical real estate:** left + right + dock open shrinks the map. Mitigation: both right inspector and dock collapse; sensible defaults (inspector open, dock opens on selection / collapsed-by-default in group mode if empty).
- **Theme breadth:** 8 themes × new components. Mitigation: token-driven styling + Storybook coverage across at least slate/permian/mario.
