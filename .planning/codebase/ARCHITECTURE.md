# Architecture

**Analysis Date:** 2026-03-06

## Pattern Overview

**Overall:** Single-page React application with optional Python backend, using context-based state management and an adapter pattern for swappable services (auth, economics engine, persistence).

**Key Characteristics:**
- Client-heavy architecture: economics calculations run in-browser by default (TypeScript engine), with an optional Python FastAPI backend as an alternative engine
- Adapter pattern used for auth (dev-bypass vs Supabase) and economics (TypeScript vs Python)
- Context providers form a layered dependency tree: ThemeProvider > BrowserRouter > AuthProvider > App
- All domain state for the main workspace lives in a single monolithic hook (`useSlopcastWorkspace`) rather than a global store
- Supabase used as the persistence layer (optional -- falls back to localStorage when env vars are absent)

## Layers

**Providers (Context Layer):**
- Purpose: Cross-cutting concerns injected via React Context
- Location: `src/index.tsx` (composition root)
- Contains: ThemeProvider, AuthProvider, BrowserRouter
- Depends on: `src/theme/ThemeProvider.tsx`, `src/auth/AuthProvider.tsx`
- Used by: All route-level pages and their descendants

**Pages (Route Layer):**
- Purpose: Top-level route components, one per URL path
- Location: `src/pages/`
- Contains: `SlopcastPage.tsx`, `HubPage.tsx`, `AuthPage.tsx`, `IntegrationsPage.tsx`, `NotFoundPage.tsx`
- Depends on: hooks, components, services
- Used by: `src/App.tsx` (route definitions)

**Hooks (State/Logic Layer):**
- Purpose: Encapsulate state management and derived computations
- Location: `src/hooks/` (app-level), `src/components/slopcast/hooks/` (component-scoped)
- Contains: `useSlopcastWorkspace.ts` (master workspace state), `useDerivedMetrics.ts`, `useKeyboardShortcuts.ts`, `useProjectPersistence.ts`, `useViewportLayout.ts`
- Depends on: services, utils, types, constants
- Used by: pages and components

**Components (UI Layer):**
- Purpose: Reusable and feature-specific UI components
- Location: `src/components/` (shared), `src/components/slopcast/` (workspace-specific)
- Contains: Controls (CapexControls, OpexControls, etc.), visualizations (Charts, MapVisualizer, ScenarioDashboard), backgrounds (themed canvas backgrounds)
- Depends on: hooks, types, theme
- Used by: pages

**Services (Data Access Layer):**
- Purpose: External data operations and API adapters
- Location: `src/services/`
- Contains: `projectRepository.ts`, `dealRepository.ts`, `profileRepository.ts`, `economicsEngine.ts`, `integrationService.ts`, `supabaseClient.ts`, `assistantService.ts`, `geminiService.ts`
- Depends on: Supabase client, types
- Used by: hooks

**Utils (Pure Logic Layer):**
- Purpose: Deterministic, side-effect-free calculations
- Location: `src/utils/`
- Contains: `economics.ts` (core economics calculator), `overlapDetector.ts`, `mockDsuLayer.ts`, `localAccount.ts`, `debugLogger.ts`
- Depends on: types only
- Used by: services (economics engine), hooks (derived metrics)

**Auth (Authentication Layer):**
- Purpose: Pluggable authentication via adapter pattern
- Location: `src/auth/`
- Contains: `AuthProvider.tsx`, `provider.ts` (adapter interface), `types.ts`, `adapters/devBypassAdapter.ts`, `adapters/supabaseAdapter.ts`
- Depends on: Supabase client (for supabase adapter)
- Used by: provider layer, ProtectedRoute component

**Theme (Theming Layer):**
- Purpose: Multi-theme support with CSS custom properties
- Location: `src/theme/`
- Contains: `ThemeProvider.tsx`, `themes.ts` (theme definitions)
- Depends on: nothing (leaf dependency)
- Used by: provider layer, components (for styling decisions)

**Backend (Python API):**
- Purpose: Alternative economics engine; server-side calculation for validation/comparison
- Location: `backend/`
- Contains: `main.py` (FastAPI app), `economics.py`, `models.py`, `sensitivity.py`, `tests/`
- Depends on: FastAPI, Pydantic
- Used by: Frontend via `/api` proxy (Vite dev server proxies to `http://127.0.0.1:8001`)

## Data Flow

**Economics Calculation (primary flow):**

1. User configures well groups with assumptions (type curve, CAPEX, OPEX, ownership) via Controls components in `src/components/slopcast/DesignEconomicsView.tsx`
2. `useSlopcastWorkspace` hook (`src/hooks/useSlopcastWorkspace.ts`) holds all workspace state and triggers recalculation when assumptions change
3. `useDerivedMetrics` hook (`src/hooks/useDerivedMetrics.ts`) calls `cachedCalculateEconomics()` from `src/utils/economics.ts` for each group
4. Results (MonthlyCashFlow[] and DealMetrics) flow back through the hook to DesignEconomicsView, KpiGrid, Charts, ForecastGrid, and sensitivity panels
5. Optional post-processing layers: `applyTaxLayer()`, `applyDebtLayer()`, `applyReservesRisk()` from `src/utils/economics.ts`

**Project Persistence:**

1. `useProjectPersistence` hook (`src/components/slopcast/hooks/useProjectPersistence.ts`) monitors groups/scenarios/UI state
2. When authenticated with Supabase env vars present: auto-saves to Supabase via `projectRepository.ts` (`src/services/projectRepository.ts`)
3. When unauthenticated or no Supabase: falls back to localStorage
4. On load: attempts to restore from Supabase first, then localStorage

**Auth Flow:**

1. `AuthProvider` (`src/auth/AuthProvider.tsx`) selects adapter based on `VITE_AUTH_PROVIDER` env var
2. `DevBypassAdapter` (`src/auth/adapters/devBypassAdapter.ts`): auto-authenticates with a mock user for local development
3. `SupabaseAdapter` (`src/auth/adapters/supabaseAdapter.ts`): delegates to Supabase Auth
4. `ProtectedRoute` (`src/components/auth/ProtectedRoute.tsx`) guards routes requiring authentication

**State Management:**
- No global store (no Redux, Zustand, etc.)
- All workspace state centralized in `useSlopcastWorkspace` hook (~900 lines), which composes smaller hooks
- Theme state in ThemeProvider context
- Auth state in AuthProvider context
- Persistence state in useProjectPersistence hook
- UI preferences stored in localStorage with dedicated storage keys

## Key Abstractions

**Economics Engine (Adapter):**
- Purpose: Swap between TypeScript (browser) and Python (server) calculation engines
- Definition: `src/services/economicsEngine.ts` (interface `EconomicsEngine`)
- Implementations: `tsEngine` (wraps `src/utils/economics.ts`), `pyEngine` (calls FastAPI via `/api` proxy)
- Selection: persisted in localStorage (`slopcast_engine_id`), toggled via `EngineToggle` component

**Auth Adapter:**
- Purpose: Swap between dev-bypass and Supabase authentication
- Definition: `src/auth/provider.ts` (interface `AuthAdapter`)
- Implementations: `src/auth/adapters/devBypassAdapter.ts`, `src/auth/adapters/supabaseAdapter.ts`
- Selection: `VITE_AUTH_PROVIDER` env var (`dev-bypass` default, `supabase` for production)

**WellGroup (Domain Model):**
- Purpose: Central domain object grouping wells with all economics assumptions
- Definition: `src/types.ts` (interface `WellGroup`)
- Contains: wellIds, typeCurve, capex, opex, ownership, optional tax/debt/reserve settings, computed metrics/flow
- Pattern: Groups are the unit of economics calculation; each group produces independent cash flows that can be aggregated

**Scenario (Analysis Model):**
- Purpose: Pricing/schedule/scalar overlays for what-if analysis
- Definition: `src/types.ts` (interface `Scenario`)
- Pattern: Base case + N alternate scenarios; ScenarioDashboard (`src/components/ScenarioDashboard.tsx`) compares them side-by-side

**Repository Pattern (Persistence):**
- Purpose: CRUD operations against Supabase tables
- Examples: `src/services/projectRepository.ts`, `src/services/dealRepository.ts`, `src/services/profileRepository.ts`
- Pattern: Each repository exports standalone async functions (not classes); requires `getSupabaseClient()` from `src/services/supabaseClient.ts`

## Entry Points

**Frontend:**
- Location: `src/index.tsx`
- Triggers: Browser loads `index.html` which mounts React root
- Responsibilities: Composes provider tree (Theme > Router > Auth), renders `<App />`

**Router:**
- Location: `src/App.tsx`
- Routes:
  - `/` -> redirects to `/slopcast`
  - `/slopcast` -> `SlopcastPage` (protected)
  - `/hub` -> `HubPage` (public)
  - `/hub/integrations` -> `IntegrationsPage` (protected)
  - `/auth` -> `AuthPage`
  - `*` -> `NotFoundPage`
- Uses `React.lazy()` for code-splitting all pages

**Backend:**
- Location: `backend/main.py`
- Triggers: `uvicorn backend.main:app --port 8001` (see `scripts/start-backend.sh`)
- Endpoints:
  - `GET /api/health`
  - `POST /api/economics/calculate`
  - `POST /api/economics/aggregate`
  - `POST /api/sensitivity/matrix`

**Build/Dev:**
- Location: `vite.config.ts`
- Dev server: port 3000, proxies `/api` to `http://127.0.0.1:8001`
- Build output: `dist/`

## Error Handling

**Strategy:** Mostly try/catch with silent fallbacks; no centralized error boundary or error reporting service.

**Patterns:**
- Auth adapter: catches initialization errors, falls back to `unauthenticated` state
- localStorage reads: wrapped in try/catch, return defaults on failure
- Supabase calls: check for `error` property on response, throw or return null
- Python engine: `pyFetch` checks `res.ok`, throws with status text on failure
- Economics calculations: no explicit error handling in the core calculator (assumes valid inputs)

## Cross-Cutting Concerns

**Logging:** Custom debug logger (`src/utils/debugLogger.ts`) + Vite plugin (`vite-plugin-debug-logger.ts`). Debug overlay available in dev mode (`src/components/debug/DebugProvider.tsx`, `DebugOverlay.tsx`). Performance monitoring via `src/hooks/usePerformanceMonitor.ts`.

**Validation:** Minimal client-side validation. Inputs mostly use controlled components with numeric constraints. No schema validation library (no Zod, Yup, etc.).

**Authentication:** Adapter-based via `src/auth/AuthProvider.tsx`. Route protection via `src/components/auth/ProtectedRoute.tsx`. Dev bypass auto-authenticates locally.

**Theming:** CSS custom properties driven by `data-theme` and `data-mode` attributes on `<html>`. Multiple themes defined in `src/theme/themes.ts`. Animated canvas backgrounds per theme (`src/components/*Background.tsx`).

**Caching:** LRU cache for economics calculations in `src/utils/economics.ts` (max 100 entries, key built from all input parameters).

---

*Architecture analysis: 2026-03-06*
