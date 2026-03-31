# Frontend Map

Use this file to route quickly inside `src/` before searching broadly.

## Read This First

- [`pages/SlopcastPage.tsx`](pages/SlopcastPage.tsx): live route entry for the main Slopcast workspace
- [`components/slopcast/FEATURE.md`](components/slopcast/FEATURE.md): product UI map for the wells, map, and economics surfaces
- [`services/FEATURE.md`](services/FEATURE.md): adapter and persistence routing for Supabase, economics engines, and spatial data
- [`utils/economics.ts`](utils/economics.ts): deterministic TypeScript economics calculator

## Main Layers

- `pages/`: route-level composition and page entrypoints
- `components/slopcast/`: product-specific workspace UI
- `services/`: data access and integration adapters
- `hooks/`: app-level hooks, including older workspace abstractions and map/filter state
- `utils/`: pure logic that should stay framework-light
- `theme/` and `styles/`: theming system and CSS tokens

## Current Routing Notes

- Start with `SlopcastPage.tsx` for behavior on the `/slopcast` route.
- `hooks/useSlopcastWorkspace.ts` is still useful context, but it is not the primary route entrypoint for the live page.
- For persistence or backend-facing behavior, jump to `services/FEATURE.md` before reading individual repositories.
- For map or workspace UI behavior, jump to `components/slopcast/FEATURE.md` before scanning `components/` broadly.

## Useful Neighbors

- [`types.ts`](types.ts): shared domain types
- [`constants.ts`](constants.ts): defaults and mock wells
- [`hooks/useWellFiltering.ts`](hooks/useWellFiltering.ts): filtering state used by the workspace
- [`hooks/useWellSelection.ts`](hooks/useWellSelection.ts): selection state used by the workspace
- [`components/layout/AppShell.tsx`](components/layout/AppShell.tsx): consumes the older workspace object model

## Related Docs

- [`../CLAUDE.md`](../CLAUDE.md): repo-wide conventions
- [`../docs/specs/03-economic-parameters.md`](../docs/specs/03-economic-parameters.md): economics data-service target state
- [`../docs/specs/04-spatial-layers-map.md`](../docs/specs/04-spatial-layers-map.md): spatial and map target state
