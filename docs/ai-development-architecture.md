# AI Development Architecture

This repo is optimized for small, reviewable AI-assisted changes. Prefer moving policy into testable modules instead of widening page, hook, or component orchestration files.

## Boundaries

- `src/domain/*`: pure business logic, reducers, selectors, fixtures, and deterministic transforms. No React, browser globals, Supabase, fetch, Mapbox, or localStorage.
- `src/services/*`: IO adapters only. Supabase, backend fetches, storage adapters, and repository row mapping live here.
- `src/hooks/*`: composition and browser lifecycle. Hooks may connect domain modules, services, and React state, but should not hide large business rules.
- `src/components/*`: rendering and local interaction state. Reusable UI touched under `src/components/` needs colocated Storybook coverage when practical.
- `src/types/*`: public domain type modules. `src/types/index.ts` is the only type barrel; do not recreate `src/types.ts`.
- `backend/*`: FastAPI routes are thin. SQL construction, row mapping, connection management, and cache policy belong in focused helpers.

## Where New Code Goes

- New workspace mutations: `src/domain/workspace`.
- New economics calculations or selectors: `src/domain/economics` or `src/utils/economics.ts` until that module is split.
- New persistence/load/save behavior: `src/services` for IO and `src/components/slopcast/hooks` only for React orchestration.
- New map layer behavior: `src/components/slopcast/map` controllers/hooks, not `MapCommandCenter`.
- New visual component states: component-local stories plus `npm run ui:components` when Storybook coverage is changed.

## Current Exceptions

- `src/hooks/useSlopcastWorkspace.ts` is still a composition hotspot during migration. New feature logic should move out of it unless the change only wires existing capabilities together.
- `src/components/slopcast/MapCommandCenter.tsx` still owns some Mapbox lifecycle. New layer setup should use the map controller path.
- `src/services/projectRepository.ts` still contains broad row mapping. New JSONB contracts should be parsed with focused helpers.
- `src/utils/economics.ts` remains the authoritative TypeScript economics engine until the engine boundary is split further.

## Verification Defaults

- Always run `npm run typecheck` and `npm test` after frontend/domain changes.
- Run `python3 -m pytest backend/tests -q` after backend or contract changes.
- Use `backend/requirements-live.txt` only for live Databricks/PostGIS-style spatial checks; mock-mode tests should not require live credentials.
- Run `npm run boundaries:check` after type/import boundary work.
- For visual/layout/theme changes, follow `AGENTS.md`: Storybook when reusable components are touched, Playwright/UI checks for integrated layout changes.
