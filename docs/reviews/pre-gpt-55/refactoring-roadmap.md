# Refactoring Roadmap

This roadmap is ordered to reduce risk before changing architecture. Each phase should stay small enough to review independently.

## Phase 1: Stabilize Tooling and Dependency Risk

Goal: make the current codebase safer to evolve.

Tasks:

- Upgrade vulnerable npm dependencies or add an explicit dependency-risk exception document where upgrades are blocked.
- Add `npm audit --audit-level=high` or an equivalent allowlisted audit check to CI.
- Register pytest markers, especially `integration`.
- Add backend live-mode dependency docs or a separate requirements file.
- Keep the existing passing gates: `npm run typecheck`, `npm test`, `npm run build`, `python3 -m pytest backend/tests -q`.

Acceptance:

- Audit output has no untriaged critical/high advisories.
- CI reports the same gates run locally.
- Backend mock/live setup is documented.

## Phase 2: Lock Economics Behavior

Goal: prevent silent economics regressions before refactoring.

Tasks:

- Create golden fixtures for a small portfolio with:
  - Oil and gas revenue.
  - Multiple OPEX segments.
  - Per-foot and per-well CAPEX.
  - Multi-segment forecast.
  - JV pre/post payout.
  - Tax and debt overlays.
- Decide engine ownership:
  - TypeScript-only authoritative path, or
  - Python authoritative path, or
  - dual-engine parity with explicit fixture coverage.
- Add tests that assert the chosen contract.
- Include engine ID and calculation version in persisted economics snapshots.

Acceptance:

- Product cannot accidentally compare TS rich economics with Python simplified economics as equivalent.
- Cache keys are derived from a normalized calculation input object.
- A calculation version is visible in saved runs.

## Phase 3: Extract Workspace Domain State

Goal: make workspace behavior testable without rendering the whole app.

Tasks:

- Introduce `workspaceUiReducer` for view mode, tabs, focus mode, mobile panels, and open sections.
- Introduce `groupsReducer` for add/clone/assign/create-from-selection/update operations.
- Introduce `scenariosReducer` for scenario mutations.
- Move CSV/PDF/snapshot operations into `useWorkspaceActions`.
- Move validation warnings into a selector with unit tests.

Acceptance:

- `useSlopcastWorkspace` becomes a composition layer rather than the owner of all logic.
- Group/scenario behavior has direct reducer tests.
- Existing page and e2e behavior remains unchanged.

## Phase 4: Split Map Command Center

Goal: isolate Mapbox lifecycle from UI overlays and spatial policy.

Tasks:

- Extract `useSpatialSourcePolicy`:
  - connection status polling,
  - auto-switch to live,
  - fallback to mock,
  - toast side effects.
- Extract a `WellLayerController`:
  - source creation,
  - cluster layers,
  - well status layers,
  - label layers,
  - event handlers,
  - cleanup.
- Use one rehydration path after style changes.
- Move layer expressions and IDs to constants.
- Add tests around style reload and listener cleanup where practical.

Acceptance:

- Initial map load and satellite style reload share the same layer setup path.
- Layer event handlers have explicit cleanup.
- `MapCommandCenter` primarily composes hooks and overlay components.

## Phase 5: Harden Spatial Backend

Goal: make live Databricks behavior safer and easier to operate.

Tasks:

- Validate Databricks catalog/schema/table names against an identifier allowlist.
- Parameterize all `IN` list values.
- Extract:
  - `ConnectionManager`,
  - query builder,
  - row-to-domain mapper,
  - trajectory fetcher,
  - cache.
- Add bounded cache TTL or explicit invalidation.
- Add metrics/logging for live query fallback to mock.

Acceptance:

- SQL construction tests cover malicious filter values and invalid identifiers.
- Mock fallback is observable.
- Cache behavior is documented and tested.

## Phase 6: Tighten Persistence Contracts

Goal: prepare Supabase persistence for real multi-project/collaboration use.

Tasks:

- Add explicit project open/create/select operations.
- Stop auto-loading the newest project without a user-visible selection concept.
- Add conflict/version handling to save responses.
- Use typed row mappers and JSONB contract validators.
- Add tests for failed saves, queued saves, ID reconciliation, and project switching.

Acceptance:

- Persistence behavior is explicit in the UI state model.
- Repository mappers are tested without rendering React.
- Failed saves are durable and actionable, not only transient messages.

## Phase 7: Bundle and UI Performance Pass

Goal: reduce first-load cost and protect interactive map performance.

Tasks:

- Lazy-load Mapbox only when the map workspace opens.
- Lazy-load Recharts-heavy panels by workspace/tab.
- Split background/theme implementations into async chunks where they are not first viewport.
- Add bundle-size tracking.
- Run visual verification for slate and mario desktop/mobile after changes.

Acceptance:

- Initial route no longer downloads Mapbox unless the map is needed.
- Bundle-size changes are tracked in CI or a review artifact.
- Existing `ui:verify` coverage remains green.
