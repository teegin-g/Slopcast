# Codebase Concerns

**Analysis Date:** 2026-03-05

## Tech Debt

**God Hook: `useSlopcastWorkspace` (862 lines, 64 hook calls)**
- Issue: Single hook manages ALL workspace state: theme, view mode, groups, scenarios, wells, filters, economics, persistence, keyboard shortcuts, workflow steps, and UI state. Returns 80+ values. Contains 64 combined `useState`/`useEffect`/`useMemo`/`useCallback` invocations.
- Files: `src/hooks/useSlopcastWorkspace.ts`
- Impact: Any change to any workspace concern risks regressions in unrelated features. Impossible to test individual behaviors in isolation. Every re-render triggered by any state change flows through the entire hook.
- Fix approach: Decompose into focused hooks: `useWellFilters`, `useGroupManagement`, `useScenarioManagement`, `useWorkflowState`, `useEconomicsComputation`. Compose them in a thin orchestrator hook. Each sub-hook becomes independently testable.

**Pervasive `any` types in data layer (30+ occurrences)**
- Issue: All Supabase row mappers use `(row: any)` casts instead of typed responses. This eliminates compile-time safety for the entire persistence boundary.
- Files: `src/services/projectRepository.ts` (lines 115, 161, 171, 176, 181, 203, 217, 260, 355, 464, 553, 598), `src/services/dealRepository.ts` (lines 176, 264, 273, 283, 299, 313, 323, 335), `src/services/integrationService.ts` (lines 58, 73), `src/services/profileRepository.ts` (line 17), `src/components/ScenarioDashboard.tsx` (lines 139, 190), `src/components/ScenarioComparison.tsx` (line 40)
- Impact: Schema changes in Supabase silently break row mapping at runtime. No compile-time protection for misspelled column names or changed types.
- Fix approach: Use Supabase generated types from `supabase/types/database.ts` to type query results. Replace `(row: any)` with `(row: Tables<'projects'>)` etc. The generated types already exist in the project.

**Duplicated utility code across repositories**
- Issue: `projectRepository.ts`, `dealRepository.ts`, and `integrationService.ts` each independently define identical `requireSupabase()`, `requireUserId()`, `makeUuid()`, `normalizeRole()`, `isUuid()`, and `toJson()` helpers.
- Files: `src/services/projectRepository.ts` (lines 12-30, 86-102), `src/services/dealRepository.ts` (lines 14-32), `src/services/integrationService.ts` (lines 40-56)
- Impact: Bug fixes or auth behavior changes must be applied in 3 places. Drift between implementations is inevitable.
- Fix approach: Extract shared helpers to `src/services/supabaseHelpers.ts`. Import from all three repositories.

**Background theme components total 4,039 lines**
- Issue: Six decorative background components consume significant code surface area. Each is a standalone canvas/SVG animation with no shared abstractions.
- Files: `src/components/HyperboreaBackground.tsx` (1017 lines), `src/components/TropicalBackground.tsx` (950 lines), `src/components/StormDuskBackground.tsx` (770 lines), `src/components/MoonlightBackground.tsx` (461 lines), `src/components/SynthwaveBackground.tsx` (438 lines), `src/components/MarioOverworldBackground.tsx` (403 lines)
- Impact: Large bundle size for purely decorative features. Any shared animation improvement must be applied to all six files independently.
- Fix approach: Extract common canvas animation utilities (particle systems, gradient helpers, requestAnimationFrame lifecycle) into a shared module. Each theme becomes a configuration over the shared engine.

**Python engine adapter uses hardcoded pricing fallback**
- Issue: `pyEngine.aggregateEconomics()` hardcodes pricing values `{ oilPrice: 75, gasPrice: 3.25, ... }` instead of using actual scenario pricing, because the Python API shape differs from the TypeScript side.
- Files: `src/services/economicsEngine.ts` (lines 144-148)
- Impact: Python engine aggregate economics always uses $75 oil / $3.25 gas regardless of user-configured scenario pricing. Results will silently diverge from the TypeScript engine.
- Fix approach: Thread actual scenario pricing through the aggregate call, or align the Python backend API to accept per-group pricing.

**Python engine strips OPEX/ownership detail**
- Issue: `toPyPricing()` flattens multi-segment OPEX into only the first segment's `fixedPerWellPerMonth` and ignores variable costs, JV agreements, and multiple OPEX segments entirely.
- Files: `src/services/economicsEngine.ts` (lines 100-113, comment on line 115)
- Impact: Python engine results diverge from TypeScript engine when users configure multi-segment OPEX, variable costs, or JV ownership. Users comparing engines see unexplained differences.
- Fix approach: Extend the Python backend to accept the full OPEX/ownership shape, or clearly warn users about the feature gap in the engine comparison UI.

## Security Considerations

**Gemini API key uses `process.env` in browser code**
- Risk: `src/services/geminiService.ts` reads `process.env.GEMINI_API_KEY` and `process.env.API_KEY`. In a Vite browser build, `process.env` is undefined unless polyfilled. If a bundler exposes it, the API key gets embedded in the client bundle.
- Files: `src/services/geminiService.ts` (lines 5-8)
- Current mitigation: The code likely fails silently (returns null) since Vite does not polyfill `process.env`. The function appears unreachable in production.
- Recommendations: Move Gemini calls to the Python backend and proxy through `/api`. Use `import.meta.env.VITE_*` only for public keys. Never embed secret API keys in frontend bundles.

**Integration connection params stored as opaque JSON**
- Risk: `connectionParams: Record<string, unknown>` may contain database passwords, API keys, or connection strings that flow through the Supabase `integration_configs` table.
- Files: `src/services/integrationService.ts` (line 16, 64), `src/pages/IntegrationsPage.tsx`
- Current mitigation: Supabase RLS presumably restricts access to owner's rows.
- Recommendations: Encrypt sensitive connection params server-side before storage. Never return raw credentials in list queries. Mask values in the UI.

**MapBox token accessed via `any` cast**
- Risk: `(import.meta as any).env?.VITE_MAPBOX_TOKEN` bypasses type safety. Minor concern, but the `any` cast is unnecessary.
- Files: `src/components/MapVisualizer.tsx` (line 28)
- Current mitigation: Token is a public client-side token (standard for Mapbox GL).
- Recommendations: Use `import.meta.env.VITE_MAPBOX_TOKEN` directly without casting. Ensure Mapbox token is domain-restricted in the Mapbox dashboard.

## Performance Bottlenecks

**Economics recomputation on every state change**
- Problem: `processedGroups` useMemo in `useSlopcastWorkspace` recalculates economics for ALL groups whenever `groups` or `scenarios` changes. The `cachedCalculateEconomics` LRU cache (100 entries) mitigates repeat calculations, but any group modification (name change, color change) invalidates the dependency array.
- Files: `src/hooks/useSlopcastWorkspace.ts` (lines 228-253), `src/utils/economics.ts` (lines 6-50)
- Cause: The `groups` array reference changes on any group property update, triggering useMemo for all groups even if only one changed.
- Improvement path: Normalize group state so individual group updates only change that group's reference. Use per-group memoization. The LRU cache key already handles this partially but the useMemo still re-runs the loop.

**4,039 lines of canvas animation code loaded eagerly**
- Problem: All six background components are likely imported at module level via the theme system, adding significant JavaScript to the initial bundle.
- Files: `src/components/*Background.tsx` (6 files, 4039 lines total)
- Cause: Theme system references `BackgroundComponent` directly.
- Improvement path: Lazy-load background components with `React.lazy()`. Only the active theme's background needs to be loaded.

## Fragile Areas

**Project persistence hydration race condition**
- Files: `src/components/slopcast/hooks/useProjectPersistence.ts` (lines 219-320)
- Why fragile: The hydration guard (`isHydratingRef.current`) uses a `queueMicrotask` to reset, creating a narrow timing window. The auto-save effect triggers on `snapshot` changes with a 1-second debounce. If hydration from Supabase triggers state updates that change the snapshot before the microtask fires, the hook may immediately save back the partially-hydrated state, overwriting the server copy.
- Safe modification: Always test persistence changes with: (1) fresh load with existing Supabase project, (2) modify state immediately after load, (3) verify no data loss on reload.
- Test coverage: Zero automated tests for this hook.

**MapBox/D3 fallback visualization**
- Files: `src/components/MapVisualizer.tsx` (574 lines)
- Why fragile: The component manages three rendering paths: Mapbox GL (external API), D3 SVG overlay, and a pure-SVG offline fallback. The Mapbox initialization uses `@ts-ignore` and `as any` casts to work around module default export issues. If MapBox GL changes its export shape, the component silently falls back to the offline SVG map with no error surfaced to users.
- Safe modification: Test with Mapbox token present AND absent. Verify lasso/rectangle selection tools work in both D3 and Mapbox modes.
- Test coverage: No automated tests.

**The `handleSelectDeal` callback is a no-op**
- Files: `src/hooks/useSlopcastWorkspace.ts` (lines 145-147)
- Why fragile: `handleSelectDeal` receives a `dealId` parameter but only calls `setPageMode('workspace')` without loading the deal data. This appears to be an incomplete feature. Users clicking a saved deal in the landing page get switched to the workspace but see stale/default data, not the selected deal.
- Safe modification: Implement deal loading or remove the affordance.
- Test coverage: None.

## Scaling Limits

**LRU economics cache fixed at 100 entries**
- Current capacity: 100 cached results in `econCache` Map.
- Limit: With multiple groups and scenarios, the combinatorial space exceeds 100 quickly. Cache thrashing occurs when users have > ~10 groups with varying scenario parameters.
- Files: `src/utils/economics.ts` (lines 6-8)
- Scaling path: Increase cache size or switch to a WeakRef-based cache. Consider Web Workers for economics calculation to avoid blocking the main thread.

**All wells are mock data (`MOCK_WELLS`)**
- Current capacity: 40 hardcoded wells in `src/constants.ts`.
- Limit: The `useSlopcastWorkspace` hook references `MOCK_WELLS` directly throughout (lines 173, 232, 261, 265, 269, 273, 287). Switching to real well data requires replacing every `MOCK_WELLS` reference.
- Files: `src/hooks/useSlopcastWorkspace.ts`, `src/constants.ts`
- Scaling path: Abstract well data source behind a provider/service. Load wells from Supabase when authenticated, fall back to mock data for demos.

## Dependencies at Risk

**`canvas` package (v3.2.1) in production dependencies**
- Risk: `canvas` is a native Node.js module (requires C++ compilation) listed in `dependencies` instead of `devDependencies`. It is likely only used for server-side rendering or Playwright testing, not in the browser bundle.
- Files: `package.json` (line 31)
- Impact: Increases install time, causes build failures on platforms without native build tools, and bloats `node_modules`.
- Migration plan: Move to `devDependencies` if only used in scripts/tests. Verify it is not imported anywhere in `src/`.

**`@vitejs/plugin-react` in production dependencies**
- Risk: Build tool plugin listed in `dependencies` instead of `devDependencies`.
- Files: `package.json` (line 30)
- Impact: Unnecessarily included in production installs.
- Migration plan: Move to `devDependencies` along with `typescript` and `vite`.

## Test Coverage Gaps

**Only 1 test file exists for the entire frontend**
- What's not tested: All React components, all hooks, all services, all repository layers, auth adapters, theme system, persistence logic, keyboard shortcuts, CSV export, AI assistant.
- Files: `src/utils/economics.test.ts` (457 lines, 20 tests) is the only test file.
- Risk: Any refactoring to the 862-line workspace hook, persistence layer, or data repositories has zero safety net. Regressions are caught only by manual testing or Playwright UI snapshots.
- Priority: **High** - The economics calculator is well-tested, but the entire application layer around it has zero unit/integration test coverage.

**No integration tests for Supabase persistence**
- What's not tested: `projectRepository.ts` (674 lines), `dealRepository.ts` (481 lines), `integrationService.ts`, `useProjectPersistence.ts` (389 lines).
- Files: All files in `src/services/`, `src/components/slopcast/hooks/useProjectPersistence.ts`
- Risk: Schema migrations, RLS policy changes, or Supabase SDK upgrades can silently break persistence without detection.
- Priority: **High** - Data loss from persistence bugs is the highest-impact failure mode.

**No tests for auth adapter pattern**
- What's not tested: `DevBypassAdapter`, `SupabaseAdapter`, `AuthProvider` session lifecycle, `ProtectedRoute`.
- Files: `src/auth/AuthProvider.tsx`, `src/auth/adapters/devBypassAdapter.ts`, `src/auth/adapters/supabaseAdapter.ts`
- Risk: Auth regressions (stuck loading states, failed refreshes) block all authenticated functionality.
- Priority: **Medium** - Auth adapter is simple but critical path.

## Missing Critical Features

**Deal loading is not implemented**
- Problem: `handleSelectDeal` in `useSlopcastWorkspace.ts` accepts a `dealId` but does not load deal data. The landing page shows saved deals but clicking one only switches the page mode without hydrating the workspace.
- Files: `src/hooks/useSlopcastWorkspace.ts` (lines 145-147)
- Blocks: Users cannot resume work on previously saved deals from the landing page.

**Acreage search is a stub**
- Problem: `handleAcreageSearch` logs the query to console and does nothing.
- Files: `src/hooks/useSlopcastWorkspace.ts` (lines 153-155)
- Blocks: Search functionality in the landing page is non-functional.

---

*Concerns audit: 2026-03-05*
