# Architecture

**Analysis Date:** 2026-03-05

## Pattern Overview

**Overall:** Single-page application with a "fat hook" pattern -- one monolithic workspace hook owns all state and logic for the main page, and thin page components render JSX from its return value.

**Key Characteristics:**
- React SPA with client-side routing (React Router v7)
- Provider-wrapped root: ThemeProvider > BrowserRouter > AuthProvider > App
- All business logic concentrated in `useSlopcastWorkspace` hook (862 lines)
- Economics calculations run entirely in-browser (TypeScript) with an optional Python FastAPI backend
- Supabase for persistence when authenticated; localStorage fallback for anonymous/dev use
- Lazy-loaded routes with code splitting at the page level
- Adapter pattern for both Auth and Economics Engine, allowing runtime swapping

## Layers

**Presentation (Pages):**
- Purpose: Route-level components that compose UI from shared components
- Location: `src/pages/`
- Contains: `SlopcastPage.tsx`, `HubPage.tsx`, `AuthPage.tsx`, `IntegrationsPage.tsx`, `NotFoundPage.tsx`
- Depends on: hooks, components
- Used by: `src/App.tsx` router

**State Management (Hooks):**
- Purpose: Own all application state, computed values, and handler callbacks
- Location: `src/hooks/` (app-level), `src/components/slopcast/hooks/` (component-scoped)
- Contains: `useSlopcastWorkspace.ts` (primary), `useDerivedMetrics.ts`, `useKeyboardShortcuts.ts`, `useProjectPersistence.ts`, `useViewportLayout.ts`
- Depends on: services, utils, auth, theme, types
- Used by: pages

**Components:**
- Purpose: Reusable UI elements, from atomic controls to composite views
- Location: `src/components/` (shared), `src/components/slopcast/` (workspace-specific)
- Contains: ~30 slopcast components, background theme components, auth/debug/integration components
- Depends on: types, theme context
- Used by: pages via hooks

**Services:**
- Purpose: Data access adapters -- Supabase CRUD, economics engine dispatch
- Location: `src/services/`
- Contains: `projectRepository.ts`, `dealRepository.ts`, `economicsEngine.ts`, `supabaseClient.ts`, `assistantService.ts`, `geminiService.ts`, `integrationService.ts`, `profileRepository.ts`
- Depends on: Supabase client, utils/economics
- Used by: hooks (via persistence hook), components

**Utils (Pure Logic):**
- Purpose: Deterministic business calculations with zero side effects
- Location: `src/utils/`
- Contains: `economics.ts` (661+ lines), `debugLogger.ts`, `localAccount.ts`, `mockDsuLayer.ts`, `overlapDetector.ts`
- Depends on: types only
- Used by: services (economicsEngine wraps it), hooks (direct import for cached calculations)

**Auth:**
- Purpose: Authentication state management via adapter pattern
- Location: `src/auth/`
- Contains: `AuthProvider.tsx` (context + hook), `types.ts`, `provider.ts` (adapter interface), `adapters/devBypassAdapter.ts`, `adapters/supabaseAdapter.ts`
- Depends on: Supabase client (conditionally)
- Used by: all protected routes, persistence logic

**Theme:**
- Purpose: Multi-theme system with CSS custom properties and optional animated backgrounds
- Location: `src/theme/`
- Contains: `ThemeProvider.tsx` (context + hook), `themes.ts` (theme definitions)
- Depends on: nothing (leaf)
- Used by: all components via `useTheme()` hook and `isClassic` prop drilling

**Backend (Python):**
- Purpose: Alternative economics engine with identical API surface
- Location: `backend/`
- Contains: `main.py` (FastAPI app), `economics.py`, `sensitivity.py`, `models.py`
- Depends on: nothing (standalone)
- Used by: frontend via `/api` proxy when Python engine is selected

## Data Flow

**Economics Calculation (primary flow):**

1. User modifies assumptions (type curve, CAPEX, OPEX, ownership) via UI controls in `DesignEconomicsView`
2. `useSlopcastWorkspace` updates `groups` state via `handleUpdateGroup`
3. `processedGroups` useMemo recomputes: for each group, calls `cachedCalculateEconomics()` from `src/utils/economics.ts` with base scenario pricing
4. Optional tax/debt/reserves layers applied on top: `applyTaxLayer()`, `applyDebtLayer()`, `applyReservesRisk()`
5. `aggregateEconomics()` combines all groups into portfolio-level `aggregateFlow` + `aggregateMetrics`
6. `useDerivedMetrics` computes driver sensitivities (debounced) from processed groups
7. Components receive metrics/flow as props and render KPIs, charts, tables

**State Management:**
- All workspace state lives in `useSlopcastWorkspace` hook as `useState` calls
- No external state library (no Redux, Zustand, etc.)
- Computed values derived via `useMemo` chains
- `useCallback` wraps all handlers for referential stability

**Persistence Flow:**

1. `useProjectPersistence` watches `groups`, `scenarios`, `activeGroupId`, `uiState` for changes
2. When authenticated with Supabase: calls `saveProject()` RPC to persist bundle atomically
3. When unauthenticated: falls back to `localStorage` for key UI preferences (workspace tab, results tab, theme)
4. On load: attempts to hydrate from Supabase project, then falls back to defaults with mock data

**Auth Flow:**

1. `AuthProvider` creates adapter based on `VITE_AUTH_PROVIDER` env var
2. `DevBypassAdapter` auto-authenticates with fake session (local dev)
3. `SupabaseAdapter` delegates to Supabase Auth (production)
4. `useAuth()` exposes `{ status, session, signIn, signOut }`
5. `ProtectedRoute` component guards `/slopcast` and `/hub/integrations`

## Key Abstractions

**WellGroup:**
- Purpose: Central domain object -- a named collection of wells with all economic assumptions attached
- Examples: `src/types.ts` (interface), `src/hooks/useSlopcastWorkspace.ts` (state management)
- Pattern: Immutable updates via spread + map in callbacks

**Scenario:**
- Purpose: Pricing/schedule/scalar overlay applied across groups for comparison analysis
- Examples: `src/types.ts`, `src/hooks/useSlopcastWorkspace.ts`
- Pattern: Array of scenarios, one marked `isBaseCase`, base case pricing feeds into economics

**EconomicsEngine (adapter):**
- Purpose: Abstracts calculation backend (TypeScript browser vs Python FastAPI)
- Examples: `src/services/economicsEngine.ts`
- Pattern: Interface with `calculateEconomics`, `aggregateEconomics`, `generateSensitivityMatrix`; registry pattern with localStorage preference

**AuthAdapter:**
- Purpose: Abstracts authentication provider
- Examples: `src/auth/provider.ts` (interface), `src/auth/adapters/devBypassAdapter.ts`, `src/auth/adapters/supabaseAdapter.ts`
- Pattern: Strategy pattern selected at boot time via env var

**ThemeProvider:**
- Purpose: Runtime theme switching with CSS custom properties
- Examples: `src/theme/ThemeProvider.tsx`, `src/theme/themes.ts`
- Pattern: React Context with `data-theme` and `data-mode` attributes on `<html>`, themes define color tokens + optional animated background components

## Entry Points

**Browser Entry:**
- Location: `index.html` > `src/index.tsx`
- Triggers: Page load
- Responsibilities: Mounts React root with provider stack (ThemeProvider > BrowserRouter > AuthProvider > App), imports global CSS

**Router:**
- Location: `src/App.tsx`
- Triggers: URL changes
- Responsibilities: Lazy-loads page components, handles route guards via `ProtectedRoute`, redirects `/` to `/slopcast`

**Production Server:**
- Location: `server.js`
- Triggers: `npm start`
- Responsibilities: Serves static `dist/` build, proxies `/api/engine/*` to Python backend on port 8001, SPA fallback

**Backend API:**
- Location: `backend/main.py`
- Triggers: HTTP requests to `/api/*`
- Responsibilities: Economics calculation and sensitivity analysis endpoints; mirrors TypeScript calculator logic

**Vite Dev Server:**
- Location: `vite.config.ts`
- Triggers: `npm run dev`
- Responsibilities: HMR, proxies `/api` to `http://127.0.0.1:8001`

## Routes

| Path | Component | Auth Required | Purpose |
|------|-----------|---------------|---------|
| `/` | Redirect | No | Redirects to `/slopcast` |
| `/slopcast` | `SlopcastPage` | Yes | Main workspace (wells + economics) |
| `/hub` | `HubPage` | No | Multi-app launcher / command hub |
| `/hub/integrations` | `IntegrationsPage` | Yes | Data integration management |
| `/auth` | `AuthPage` | No | Sign-in page |
| `*` | `NotFoundPage` | No | 404 fallback |

## Error Handling

**Strategy:** Defensive with silent fallbacks. Most errors are caught and logged to console or shown as transient action messages.

**Patterns:**
- `try/catch` around all `localStorage` reads/writes (SSR/incognito safety)
- Supabase errors bubble up through repository functions and are caught in persistence hook, displayed as `actionMessage` toast
- Economics calculations are pure and do not throw; invalid inputs produce zero/NaN metrics
- Python backend errors return HTTP error codes, caught by `pyFetch` wrapper in `economicsEngine.ts`

## Cross-Cutting Concerns

**Logging:** Console-only. `src/utils/debugLogger.ts` provides structured logging. `vite-plugin-debug-logger.ts` adds build-time instrumentation. Debug overlay available in dev mode via `src/components/debug/DebugProvider.tsx`.

**Validation:** Inline in `useSlopcastWorkspace` via `validationWarnings` useMemo. Checks for missing wells, invalid pricing, bad NRI ranges, missing CAPEX items. Displayed as warning badges in UI.

**Authentication:** Adapter pattern in `src/auth/`. `ProtectedRoute` component wraps guarded routes. Dev bypass auto-authenticates locally.

**Responsive Layout:** `useViewportLayout` hook returns `'mobile' | 'mid' | 'desktop'` based on window width breakpoints (1024, 1320). Components switch between mobile panels and desktop side-by-side layouts.

**Theming:** All color values use CSS custom properties (`--cyan`, `--magenta`, etc.) mapped through Tailwind's `theme-*` utility classes. Components receive `isClassic` boolean to branch between "mario" theme (retro) and modern themes. Some themes include animated WebGL/canvas background components.

**Caching:** `src/utils/economics.ts` implements an LRU cache (max 100 entries) for `calculateEconomics` to avoid redundant computation on re-renders.

---

*Architecture analysis: 2026-03-05*
