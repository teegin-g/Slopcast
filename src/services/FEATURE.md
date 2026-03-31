# Service And Adapter Layer

This folder is the frontend adapter boundary for persistence, economics-engine selection, Supabase access, and spatial/integration fetches.

## Read This First

- [`economicsEngine.ts`](economicsEngine.ts): engine selection and browser-vs-Python economics contract
- [`projectRepository.ts`](projectRepository.ts): project save/load and economics snapshot persistence
- [`supabaseClient.ts`](supabaseClient.ts): Supabase environment and client bootstrap
- [`spatialService.ts`](spatialService.ts): viewport and map-adjacent spatial fetches

## Key Neighbors

- [`dealRepository.ts`](dealRepository.ts): deal-specific persistence path
- [`integrationService.ts`](integrationService.ts): external integration surface
- [`../components/slopcast/hooks/useProjectPersistence.ts`](../components/slopcast/hooks/useProjectPersistence.ts): primary caller for project persistence flows
- [`../utils/economics.ts`](../utils/economics.ts): underlying TypeScript economics engine used by `economicsEngine.ts`
- [`../../supabase/`](../../supabase): migrations, generated types, and local data setup

## Tests

- [`spatialService.test.ts`](spatialService.test.ts): focused service test in this folder
- [`../utils/economics.test.ts`](../utils/economics.test.ts): core economics verification for the TypeScript engine

## Related Docs

- [`../../docs/specs/03-economic-parameters.md`](../../docs/specs/03-economic-parameters.md): target-state economics data-service shape
- [`../../docs/specs/04-spatial-layers-map.md`](../../docs/specs/04-spatial-layers-map.md): target-state spatial and map integration shape
- [`../../docs/CODING_AGENT_HARNESS.md`](../../docs/CODING_AGENT_HARNESS.md): global harness context

## Avoid These False Starts

- Do not start in `supabase/` for routine frontend save/load behavior; start in `projectRepository.ts` and only descend into migrations or generated types if the issue is schema-shaped.
- Do not edit `utils/economics.ts` when the problem is engine selection or API routing; start in `economicsEngine.ts`.
- Do not infer map data flow from UI files alone; pair `spatialService.ts` with `MapCommandCenter.tsx`.
