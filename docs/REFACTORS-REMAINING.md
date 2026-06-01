# Slopcast Refactors — Remaining items

> Companion to `REFACTORS.md`. On branch `refactors/2026-05-31/catalog-cleanup`,
> the large majority of the 79 catalog items are implemented, committed, and
> verified green: **strict** typecheck · 231 unit · 13 rig-scheduler · 54
> storybook · both prod builds · ui:audit · visual spot-checks (Slate + Classic).
>
> Since the first cut, these previously-deferred items were also completed:
> **R5-06** (tsconfig `strict: true` — all 222 errors fixed, type-only, no
> behavior change), **R3-11** (AppShell prop bag), **R4-11** (TS↔Python parity
> backstop — engines agree bit-for-bit), **R5-14** (named d3 imports), and the
> type-system hygiene (R5-02/03/04/05, with R5-03 done shape-safe).

## Still open — deliberately deferred (visual-risk or user-preference)

### R2-13 + R5-13 — Full leaf-`isClassic` migration into theme primitives
- **What:** Push the remaining inline `isClassic` branches (EconomicsGroupBar
  ~28, IntegrationsPage ~50, HubPage ~35, MapCommandCenter ~23, AuthPage ~17, …)
  into shared `<ThemePanel>` / `<ThemeButton>`.
- **DONE so far:** `<ThemePanel>` and `<ThemeButton>` now exist
  (`src/components/theme/`). The byte-identical-output call sites were migrated
  (HubPage: 4 panels + 2 buttons; AuthPage: 1 button) and verified
  visually-identical.
- **KEY FINDING (why the rest is blocked on a design decision, not effort):**
  A careful pass over the leaf components (EconomicsGroupBar, OperationsConsole,
  DesignWellsView, MapCommandCenter, IntegrationsPage/Wizard/Table) migrated
  **zero** further sites under a strict byte-identical constraint — because their
  panel/button styles genuinely **diverge**: e.g. `text-xs` vs `text-[10px]`,
  extra `backdrop-blur-sm`, `border-2`, `sc-btn*` utilities, `bg-theme-surface1`
  (no opacity suffix), a dynamic `overlayPanelClass()`, and parent-prepended
  `border` that the primitive would double. Folding these into the primitives
  **changes their rendered appearance**.
- **So the remaining work is a DESIGN call, not mechanical:** decide, per
  divergence, whether to normalize toward the primitive (a deliberate visual
  change) or keep it bespoke. That belongs to the theme-system owner. Once those
  calls are made, migrate one component per PR and screenshot every theme vs
  `main`. Groundwork done: R3-02 moved TaxControls/SchemaMapper/ConnectionForm to
  `useTheme()`-derived `isClassic`; `<ScenarioCard>` exists.

### R1-05 / R1-08 — Port remaining backgrounds to `useCanvasBackground` / extend FX
- **Status:** `useCanvasBackground` exists; Mario is ported (R1-01). Tropical/
  Moonlight/Hyperborea/OilRig left on bespoke lifecycles.
- **Why still deferred:** Each has effect-scoped mutable state (clouds/birds/grain
  buffers/dt accumulation) the generic hook would reset; converting risks a
  visible animation change that can't be verified pixel-for-pixel. R1-08 is a
  no-op for backgrounds with no existing FX-driven draw code.
- **Suggested approach:** Per-background, only with side-by-side animation A/B;
  otherwise leave — the duplication is contained.

### R6-09 / R6-17 / R6-18 — fixtures / playground / snapshot-script reorg
- **Why still deferred:** `playground/` notebooks (DCA Sandbox, sensitivity_demo,
  type_curve_analysis) and `fixtures/` look like intentional dev assets; moving
  them is a workspace-organization preference best confirmed first, not a code
  fix. Note `scripts/ui-snapshots.mjs` is currently broken anyway (stale
  `getByTitle('Slate')` selector — themes moved into a PageHeader dropdown), so
  R6-18's dedup should follow a fix of that selector.

## Partials worth noting (done, but not maximal)
- **R1-01** background hook: Mario only (see R1-05).
- **R2-01** MapCommandCenter: extracted `useMapTheme` + `useMapInit`;
  `useMapLayers` left inline (3 effects share `mapLayerEpoch` /
  `previousFeatureStateRef` / `hoverRafRef`). `useMapSelection` already exists.
- **R2-08** WellSelectionActions: desktop slot extracted; map-header + mobile-tray
  slots left (structurally distinct DOM/testids).

## Known pre-existing issue (out of catalog scope)
- `scripts/ui-snapshots.mjs` (`npm run ui:shots`) is broken: it waits on
  `getByTitle('Slate')`, but themes now live behind the PageHeader theme
  dropdown (`theme-dropdown-toggle` → `theme-option-*`). Update the selector to
  open the dropdown first before this snapshot tooling works again.
