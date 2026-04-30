# Pre-GPT-5.5 Code Review

Review target: commit `8fa78fc` (`feat(spatial): enhance viewport wells API with zoom support and diagnostics`), the last commit before Thursday, April 23, 2026.

Review date: April 29, 2026.

## Scope

This review covers the pre-April-23 code snapshot, not the current branch head. I inspected the snapshot in a detached worktree at `/tmp/slopcast-pre-gpt55-review` so the current working tree and uncommitted `.omx` state stayed untouched.

The review focuses on:

- Application architecture and ownership boundaries.
- Frontend implementation quality.
- Spatial/backend implementation quality.
- Economics engine correctness and maintainability.
- Testing, build, dependency, and operational risks.

## Review Documents

- [Architecture Review](./architecture-review.md)
- [Implementation Review](./implementation-review.md)
- [Refactoring Roadmap](./refactoring-roadmap.md)
- [Verification Notes](./verification.md)

## Executive Findings

The codebase is functional and has a better-than-typical test base for a fast-moving prototype: TypeScript typecheck passes, app unit tests pass, backend tests pass, and production build succeeds at the reviewed snapshot.

The main architectural risk is concentration of responsibility. `useSlopcastWorkspace`, `MapCommandCenter`, `backend/spatial_service.py`, and `src/utils/economics.ts` each combine multiple domains that should evolve independently. This makes feature work fast in the short term but raises regression risk for persistence, map behavior, and economics correctness.

The most important correctness risk is economics engine divergence. The TypeScript engine supports gas, OPEX segments, ownership/JV layers, tax/debt overlays, reserves risk, and multi-segment forecasts. The Python engine is documented as a parity port, but only models a flatter oil/NRI/LOE shape. Keeping both selectable without a strict parity contract can produce materially different economics for the same deal.

The most important security/dependency risk is the pre-boundary dependency set. `npm audit` reports 11 advisories: 1 critical, 6 high, 3 moderate, and 1 low. Vite, Rollup, protobufjs, undici, minimatch, path-to-regexp, postcss, and related transitive packages need upgrade review.

The most important refactor target is the map/spatial stack. It currently mixes Mapbox lifecycle, theme overrides, source fallback policy, connection toasts, layer construction, selection behavior, and WebGL laterals in one component. Extracting a map adapter and layer controller would remove a lot of duplicated style-reload code and make map regressions easier to test.

## Suggested Priority

1. Stabilize dependencies and CI gates.
2. Decide whether TypeScript or Python owns economics truth; make the other a verified adapter or remove it from user-facing choice.
3. Split `useSlopcastWorkspace` into state reducers/selectors and narrow feature hooks.
4. Split `MapCommandCenter` into map shell, data orchestration, layer controller, and overlay UI.
5. Harden Databricks SQL query construction and spatial cache policy.
6. Add integration tests for persistence, live spatial fallback, and TS/Python economics parity.
