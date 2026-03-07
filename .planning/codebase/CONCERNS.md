# Codebase Concerns

**Analysis Date:** 2026-03-06

## Tech Debt

**Monolithic Workspace Hook (862 lines):**
- Issue: `useSlopcastWorkspace` is a single hook that manages nearly all app state -- groups, scenarios, wells, economics, filters, UI panels, persistence, keyboard shortcuts, CSV export, and workflow logic. Returns 60+ values.
- Files: `src/hooks/useSlopcastWorkspace.ts`
- Impact: Any change risks regression across unrelated features. Difficult to test in isolation. Slow to understand for new contributors.
- Fix approach: Extract cohesive sub-hooks (e.g., `useWellFiltering`, `useEconomicsState`, `useExportActions`, `useWorkflowSteps`) and compose them. Each sub-hook becomes independently testable.

**Duplicated Supabase Utility Functions:**
- Issue: `requireSupabase()`, `requireUserId()`, `makeUuid()`, `normalizeRole()`, `isUuid()`, and `toJson()` are copy-pasted identically across four repository files.
- Files: `src/services/projectRepository.ts`, `src/services/dealRepository.ts`, `src/services/integrationService.ts`, `src/services/profileRepository.ts`
- Impact: Bug fixes or behavior changes must be applied in four places. Easy to miss one.
- Fix approach: Extract a shared `src/services/supabaseHelpers.ts` module exporting these utilities. Import from all repositories.

**Pervasive `any` Types in Repository Layer:**
- Issue: All Supabase query results are typed as `any` in `.map()` callbacks (e.g., `(row: any) => ({...})`). At least 25+ occurrences across service files.
- Files: `src/services/projectRepository.ts` (12+ occurrences), `src/services/dealRepository.ts` (8+ occurrences), `src/services/integrationService.ts` (2 occurrences), `src/services/profileRepository.ts` (1 occurrence)
- Impact: No compile-time safety on database row shapes. Typos in column names (e.g., `row.owner_user_id` vs `row.ownerUserId`) silently produce `undefined`. Refactoring database schema won't surface breakage.
- Fix approach: Generate Supabase types from `supabase/types/database.ts` (already present) and use typed `.select()` or cast rows to generated types instead of `any`.

**Python Engine Feature Parity Gap:**
- Issue: The Python backend receives a simplified `PricingAssumptions` shape that drops OPEX segments, ownership JV agreements, GOR, and tax/debt layers. The `aggregateEconomics` call hardcodes pricing (`$75 oil, $3.25 gas`) instead of using actual scenario values.
- Files: `src/services/economicsEngine.ts` (lines 100-167), `backend/models.py`, `backend/economics.py`
- Impact: Switching to the Python engine produces different (incorrect) results vs TypeScript. Users cannot trust engine comparison. The hardcoded pricing in `pyEngine.aggregateEconomics` is a data bug.
- Fix approach: Extend Python backend models to accept full OPEX/ownership/GOR structures. Pass actual scenario pricing in `aggregateEconomics`. Add parity tests.

**Gemini Service Uses `process.env` in Browser Code:**
- Issue: `geminiService.ts` reads `process.env.GEMINI_API_KEY` which is not available in Vite browser bundles (Vite uses `import.meta.env`). The service silently returns a fallback string.
- Files: `src/services/geminiService.ts` (lines 6-7)
- Impact: AI deal analysis feature is always broken in production builds. The key would need to be `VITE_GEMINI_API_KEY` via `import.meta.env`, or the call should be proxied through the backend to avoid exposing the API key client-side.
- Fix approach: Proxy Gemini calls through the FastAPI backend, or at minimum switch to `import.meta.env.VITE_GEMINI_API_KEY`. Exposing the key client-side is a security risk regardless.

**Background Component Bloat:**
- Issue: Five animated canvas background components (~3,500 lines total) are included in the main bundle. Each is 400-1000+ lines of inline Canvas rendering code.
- Files: `src/components/HyperboreaBackground.tsx` (1017 lines), `src/components/TropicalBackground.tsx` (950 lines), `src/components/StormDuskBackground.tsx` (770 lines), `src/components/MoonlightBackground.tsx` (461 lines), `src/components/SynthwaveBackground.tsx` (438 lines), `src/components/MarioOverworldBackground.tsx` (403 lines)
- Impact: ~4,000 lines of purely cosmetic code in bundle. No lazy-loading detected. Increases initial load time.
- Fix approach: Lazy-load backgrounds with `React.lazy()` and `Suspense`. Consider extracting to a separate chunk or web worker for Canvas rendering.

## Security Considerations

**API Key Exposure Risk (Gemini):**
- Risk: `geminiService.ts` attempts to use a Gemini API key client-side. If `VITE_GEMINI_API_KEY` were set, it would be embedded in the JavaScript bundle visible to any user.
- Files: `src/services/geminiService.ts`
- Current mitigation: The `process.env` reference doesn't work in Vite, so the key is never actually exposed. But the code pattern invites someone to "fix" it by switching to `import.meta.env`, which would expose the key.
- Recommendations: Route all Gemini API calls through the FastAPI backend. Never expose LLM API keys in frontend bundles.

**Integration Connection Params Stored in Supabase JSON:**
- Risk: `connectionParams` for database integrations (postgres/sqlserver connection strings, credentials) are stored as JSON in the `integration_configs` table. If RLS is misconfigured, other users could read connection credentials.
- Files: `src/services/integrationService.ts`, `supabase/migrations/20260227190000_integrations.sql`
- Current mitigation: RLS is enabled on `integration_configs` table.
- Recommendations: Encrypt connection params at rest. Audit RLS policies to confirm only `owner_user_id` can read their own configs.

**CORS Allows All Methods/Headers on Backend:**
- Risk: FastAPI backend uses `allow_methods=["*"]` and `allow_headers=["*"]` which is overly permissive.
- Files: `backend/main.py` (lines 20-29)
- Current mitigation: Origins are restricted to localhost:3000.
- Recommendations: Restrict to specific methods (GET, POST, OPTIONS) and specific headers. Update allowed origins for production deployment.

## Performance Bottlenecks

**Economics Recalculation on Every State Change:**
- Problem: Economics are recalculated via `useMemo` chains in `useSlopcastWorkspace` whenever any dependency changes. With many well groups and scenarios, this triggers the full `aggregateEconomics` + `applyTaxLayer` + `applyDebtLayer` pipeline.
- Files: `src/hooks/useSlopcastWorkspace.ts`, `src/utils/economics.ts`
- Cause: The LRU cache (`econCache` with 100 entries) in `economics.ts` helps but the cache key is based on serialized parameters -- any tiny change (e.g., UI-only state) that triggers a re-render recalculates.
- Improvement path: Move economics calculation to a Web Worker or use `useDeferredValue`. Separate UI state changes from economics-triggering state changes.

**Supabase N+1 Query Pattern in `getProject`:**
- Problem: Loading a project makes sequential queries: project -> groups + scenarios -> group_wells -> wells (by ID list). Four round-trips minimum.
- Files: `src/services/projectRepository.ts` (lines 127-230)
- Cause: Supabase JS client doesn't support JOINs natively; queries are done in sequence with results feeding subsequent queries.
- Improvement path: Create a Postgres function (`get_project_bundle`) that returns all data in a single RPC call. Already using `rpc('current_project_role')` pattern elsewhere.

**MapVisualizer Mapbox Dynamic Import:**
- Problem: Mapbox GL is dynamically imported with `@ts-ignore` and cast through `(mapboxgl as any).default`. The fallback SVG map is rebuilt on every render when Mapbox is unavailable.
- Files: `src/components/MapVisualizer.tsx` (lines 28, 160-165)
- Cause: Mapbox ESM/CJS module compatibility issue worked around with casts.
- Improvement path: Use a proper dynamic import with `React.lazy` or a dedicated `useMapbox` hook that handles the module resolution cleanly.

## Fragile Areas

**Persistence Layer Hydration Race Condition:**
- Files: `src/components/slopcast/hooks/useProjectPersistence.ts` (lines 219-320)
- Why fragile: Uses `isHydratingRef` flag and `queueMicrotask` to prevent save-during-load races. The auto-save triggers on a 1-second debounce after any state change. If the load completes but `queueMicrotask` fires late, auto-save could overwrite remote state with stale local state.
- Safe modification: Any change to the save/load flow must be tested with both fast and slow network conditions. Add integration tests that verify load -> modify -> save ordering.
- Test coverage: No automated tests for `useProjectPersistence`.

**Economics Engine Type Adapters:**
- Files: `src/services/economicsEngine.ts` (lines 100-168)
- Why fragile: `toPyPricing` and `toPyTypeCurve` manually convert TS types to Python API shapes. Adding a new field to `TypeCurveParams` or `OpexAssumptions` requires updating these adapters manually -- no compile-time check ensures parity.
- Safe modification: Add a shared JSON schema or contract test that validates both engines accept the same input shapes.
- Test coverage: No tests for the Python engine adapter.

**useSlopcastWorkspace Dependency Arrays:**
- Files: `src/hooks/useSlopcastWorkspace.ts` (lines 759-794)
- Why fragile: The `operationsProps` `useMemo` has a 14-item dependency array. Missing a dependency causes stale closures; adding extras causes unnecessary re-renders. Three `eslint-disable-line react-hooks/exhaustive-deps` comments suppress warnings elsewhere.
- Safe modification: Extract `operationsProps` computation into a separate hook with its own state management.
- Test coverage: No unit tests for this hook.

## Test Coverage Gaps

**Single Test File for Entire Codebase:**
- What's not tested: Only `src/utils/economics.test.ts` (457 lines) exists. Zero tests for: all service repositories, all React components, all hooks, auth adapters, theme system, integration service, assistant service.
- Files: `src/utils/economics.test.ts` is the only test file out of 91 source files.
- Risk: Any refactoring of the persistence layer, auth flow, or UI components has zero safety net. Regressions in economics aggregation across groups, tax/debt layers, or scenario comparison are possible.
- Priority: High -- at minimum, add tests for `src/services/projectRepository.ts` (data integrity), `src/components/slopcast/hooks/useProjectPersistence.ts` (race conditions), and `src/services/economicsEngine.ts` (engine parity).

**No Backend Tests:**
- What's not tested: Python FastAPI backend has no test files. Economics calculations, sensitivity matrix generation, and API endpoint validation are untested.
- Files: `backend/economics.py`, `backend/sensitivity.py`, `backend/main.py`
- Risk: Python and TypeScript economics engines could silently diverge. API contract changes break the frontend with no warning.
- Priority: High -- add pytest suite with parity tests against known TypeScript outputs.

**Playwright Tests Exist but Are Not in CI:**
- What's not tested: UI flow verification scripts exist (`scripts/ui-verify-flow.mjs`, `scripts/ui-snapshots.mjs`) but no CI pipeline configuration was found.
- Files: `playground/*.spec.ts`, `scripts/ui-verify-flow.mjs`
- Risk: UI regressions can ship without detection.
- Priority: Medium -- set up CI pipeline to run at minimum `npm run build` and `npm test`.

## Dependencies at Risk

**`canvas` npm Package in Frontend:**
- Risk: The `canvas` package (native C++ addon) is listed as a production dependency. It requires native build tools (Cairo, Pango) and is typically a Node.js-only package. It likely fails to install on systems without build tools and adds nothing to the Vite browser bundle.
- Impact: Breaks `npm install` on clean machines without native build prerequisites. Increases install time.
- Migration plan: Move to `devDependencies` if only used for Playwright/testing, or remove entirely if unused.

**`@vitejs/plugin-react` in Dependencies (not devDependencies):**
- Risk: Build tool listed as production dependency. Same for `typescript` and `vite` itself.
- Impact: Inflated production `node_modules` if `npm install --production` is used. Not a runtime issue but indicates sloppy dependency management.
- Migration plan: Move `@vitejs/plugin-react`, `typescript`, and `vite` to `devDependencies`.

## Missing Critical Features

**No Input Validation on Economics Parameters:**
- Problem: `calculateEconomics` in `src/utils/economics.ts` accepts raw number parameters (qi, di, b-factor, prices) with only a `clamp01` helper for percentages. No validation for negative prices, zero decline rates, or extreme values that could cause infinite loops or NaN propagation.
- Blocks: Production readiness. Bad user input could produce nonsensical results silently.

**No Error Boundary in React Tree:**
- Problem: No `ErrorBoundary` component wrapping the app or major sections. A runtime error in any component (e.g., economics chart with bad data) crashes the entire app with a white screen.
- Files: `src/index.tsx`, `src/App.tsx`
- Blocks: Production readiness. Users lose all work on any unhandled exception.

**No Rate Limiting on Backend:**
- Problem: FastAPI backend has no rate limiting or authentication. Anyone who can reach the server can call economics endpoints unlimited times.
- Files: `backend/main.py`
- Blocks: Safe public deployment.

---

*Concerns audit: 2026-03-06*
