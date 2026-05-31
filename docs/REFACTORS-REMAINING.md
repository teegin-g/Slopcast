# Slopcast Refactors — Remaining (deferred) items

> Companion to `REFACTORS.md`. As of branch `refactors/2026-05-31/catalog-cleanup`,
> ~58 of the 79 catalog items are implemented, committed, and verified green
> (typecheck · 230 unit · 13 rig-scheduler · 54 storybook · both prod builds ·
> ui:audit · visual spot-checks in Slate + Classic). The items below were
> **deliberately deferred** because they are high-effort, high-regression-risk,
> or blocked on prerequisites. Each is safe to do later as a focused, separately
> reviewed change. Do NOT batch these blindly.

## Tier 1 — High regression risk (hard to verify with current gates)

### R2-13 + R5-13 — Full leaf-`isClassic` migration into theme primitives
- **What:** Introduce `<ThemePanel>` / `<ThemeButton>` (R5-13) and push the
  remaining inline `isClassic` branches (EconomicsGroupBar ~28, IntegrationsPage
  ~50, HubPage ~35, MapCommandCenter ~23, AuthPage ~17, …) into them (R2-13).
- **Why deferred:** Keeping all themes — especially **Classic** — pixel-identical
  through this migration is exactly what the automated gates (typecheck/unit/
  storybook/audit) cannot fully confirm. Only per-view, per-theme screenshot
  diffing catches a regression here, across hundreds of branch sites.
- **Suggested approach:** One component family per PR. After each, screenshot the
  affected view in **every** theme (esp. Classic) and diff against `main`. The
  partial groundwork is done: R3-02 already moved TaxControls/SchemaMapper/
  ConnectionForm to `useTheme()`-derived `isClassic`, and `<ScenarioCard>` exists.

### R3-11 — Narrow the AppShell 18-field prop bag
- **What:** Split `AppShell`'s single `workspace` prop (18 fields drilled to
  PageHeader/Sidebar) into `layout`/`nav` sub-objects or a `WorkspaceContext`.
- **Why deferred:** Re-shaping the central layout contract ripples across the
  whole shell; medium risk, broad surface.
- **Suggested approach:** Prefer a `WorkspaceContext` so consumers pull what they
  need; migrate consumers incrementally; verify the shell renders in 2+ themes.

## Tier 2 — High effort (volume), moderate risk

### R5-06 — Enable `tsconfig` `strict: true`
- **What:** Turn on strict; fix the resulting errors.
- **Status:** `tsc --noEmit --strict` currently reports **222 errors**.
- **Why deferred:** Multi-hour grind. Most fixes are mechanical (param types,
  null guards) but a careless null-guard/`!` can change runtime behavior. Also
  needs `@types/d3` (currently `import * as d3`/named imports are untyped) and
  react-dom type resolution.
- **Suggested approach:** Enable one strict sub-flag at a time
  (`noImplicitAny` → `strictNullChecks` → full `strict`), fixing per-domain in
  small PRs. Add `@types/d3` first to clear a large error cluster. Run the full
  test suite after each batch — strict fixes must not change behavior.

## Tier 3 — Blocked on prerequisites

### R4-11 — TS↔Python economics parity test
- **Why deferred:** Needs the Python backend (`backend/economics.py` / the
  `/api/economics/*` routes) run once to generate golden outputs for the shared
  fixture. The dev-only engine toggle (R4-01) is already wired, so the Python
  path is reachable.
- **Suggested approach:** Write a small script that runs `backend/economics.py`
  on `dual-parity-rich.json`, check the Python-derived goldens into the repo,
  then have the vitest parity test assert TS matches within rel-error < 1e-6 on
  NPV10/IRR/EUR/payout/after-tax/levered. Keep it backend-free at CI time.

## Tier 4 — Low value / intentional / visual-safety

### R1-05 / R1-08 — Port remaining backgrounds to `useCanvasBackground` / extend FX
- **Status:** `useCanvasBackground` exists and Mario is ported (R1-01). Tropical/
  Moonlight/Hyperborea/OilRig were left on their bespoke lifecycles.
- **Why deferred:** Each has effect-scoped mutable state (clouds/birds/grain
  buffers/dt accumulation) that the generic hook would reset; converting risks a
  visible animation change that's hard to verify pixel-for-pixel. R1-08 (FX
  intensity) is a no-op for backgrounds with no existing FX-driven draw code.
- **Suggested approach:** Per-background, only if you can A/B the animation
  visually; otherwise leave — the duplication is contained.

### R6-09 / R6-17 / R6-18 — fixtures / playground / snapshot-script reorg
- **Why deferred:** `playground/` notebooks and `fixtures/` may be intentional
  dev assets; `scripts/ui-snapshots.mjs` is also currently broken (stale
  `getByTitle('Slate')` selector — themes moved into a PageHeader dropdown), so
  R6-18's dedup should follow a fix of that selector.

## Partials worth noting (done, but not maximal)
- **R1-01** background hook: Mario only (see R1-05).
- **R2-01** MapCommandCenter: extracted `useMapTheme` + `useMapInit`;
  `useMapLayers` left inline (3 effects share `mapLayerEpoch` /
  `previousFeatureStateRef` / `hoverRafRef`). `useMapSelection` already exists.
