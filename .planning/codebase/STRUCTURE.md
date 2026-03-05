# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
Slopcast/
├── src/                        # All frontend source code
│   ├── App.tsx                 # Router / route definitions
│   ├── index.tsx               # React root with provider stack
│   ├── types.ts                # All TypeScript interfaces (484 lines)
│   ├── constants.ts            # Mock wells, default assumptions
│   ├── constants/              # Extended constants
│   │   └── templates.ts        # Assumption template presets (Wolfcamp A, Bone Spring, etc.)
│   ├── auth/                   # Auth adapter pattern
│   │   ├── AuthProvider.tsx    # Context + useAuth() hook
│   │   ├── types.ts            # AuthUser, AuthSession, AuthState
│   │   ├── provider.ts         # AuthAdapter interface
│   │   └── adapters/           # Concrete adapters
│   │       ├── devBypassAdapter.ts
│   │       └── supabaseAdapter.ts
│   ├── theme/                  # Theme system
│   │   ├── ThemeProvider.tsx   # Context + useTheme() hook
│   │   └── themes.ts           # Theme definitions (colors, fonts, backgrounds)
│   ├── hooks/                  # App-level hooks
│   │   ├── useSlopcastWorkspace.ts  # Primary workspace state (862 lines)
│   │   ├── useDerivedMetrics.ts     # Debounced driver sensitivity analysis
│   │   ├── useKeyboardShortcuts.ts  # Global keyboard shortcuts
│   │   └── usePerformanceMonitor.ts # Performance tracking
│   ├── pages/                  # Route-level page components
│   │   ├── SlopcastPage.tsx    # Main workspace (230 lines, thin JSX)
│   │   ├── HubPage.tsx         # Multi-app launcher
│   │   ├── AuthPage.tsx        # Sign-in page
│   │   ├── IntegrationsPage.tsx # Data integrations
│   │   └── NotFoundPage.tsx    # 404
│   ├── components/             # Shared + feature components
│   │   ├── slopcast/           # Slopcast workspace components (~30 files)
│   │   │   ├── DesignWellsView.tsx
│   │   │   ├── DesignEconomicsView.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── KpiGrid.tsx
│   │   │   ├── EconomicsDriversPanel.tsx
│   │   │   ├── ForecastGrid.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AiAssistant.tsx
│   │   │   ├── OnboardingTour.tsx
│   │   │   ├── WorkflowStepper.tsx
│   │   │   ├── OperationsConsole.tsx
│   │   │   ├── hooks/          # Component-scoped hooks
│   │   │   │   ├── useProjectPersistence.ts
│   │   │   │   ├── useViewportLayout.ts
│   │   │   │   └── useStableChartContainer.ts
│   │   │   └── ...             # (20+ more components)
│   │   ├── auth/               # Auth UI
│   │   │   └── ProtectedRoute.tsx
│   │   ├── debug/              # Dev-only debug tools
│   │   │   ├── DebugProvider.tsx
│   │   │   └── DebugOverlay.tsx
│   │   ├── integrations/       # Integration UI components
│   │   ├── Charts.tsx          # Recharts wrappers
│   │   ├── Controls.tsx        # Form controls (inputs, sliders)
│   │   ├── ScenarioDashboard.tsx
│   │   ├── SensitivityMatrix.tsx
│   │   ├── MapVisualizer.tsx   # Mapbox GL map
│   │   ├── GroupList.tsx
│   │   └── *Background.tsx     # Animated theme backgrounds (6 files)
│   ├── services/               # Data access / adapters
│   │   ├── supabaseClient.ts   # Singleton Supabase client
│   │   ├── projectRepository.ts # Project CRUD + collaboration
│   │   ├── dealRepository.ts   # Deal CRUD
│   │   ├── economicsEngine.ts  # TS/Python engine adapter
│   │   ├── profileRepository.ts # Profile/preset management
│   │   ├── assistantService.ts # AI assistant integration
│   │   ├── geminiService.ts    # Gemini API wrapper
│   │   └── integrationService.ts # External data integrations
│   ├── utils/                  # Pure logic / helpers
│   │   ├── economics.ts        # Core economics calculations (661+ lines)
│   │   ├── economics.test.ts   # 20 unit tests
│   │   ├── debugLogger.ts      # Structured logging
│   │   ├── localAccount.ts     # Local account helpers
│   │   ├── mockDsuLayer.ts     # Mock DSU layer data
│   │   └── overlapDetector.ts  # Well overlap detection
│   ├── styles/
│   │   └── theme.css           # CSS custom properties + theme tokens
│   └── debug/
│       └── DebugOverlay.tsx    # Dev debug overlay
├── backend/                    # Python FastAPI backend
│   ├── main.py                 # FastAPI app factory + routes
│   ├── economics.py            # Python economics calculations
│   ├── sensitivity.py          # Sensitivity matrix generation
│   ├── models.py               # Pydantic request/response models
│   ├── requirements.txt        # Python dependencies
│   └── tests/                  # Backend test files
├── supabase/                   # Database schema + types
│   ├── migrations/             # SQL migration files (7 migrations)
│   │   ├── 20260220164000_slopcast_v1.sql
│   │   ├── 20260223_audit_log.sql
│   │   ├── 20260223_comments.sql
│   │   ├── 20260223_project_invites.sql
│   │   ├── 20260227170000_deals_v1.sql
│   │   ├── 20260227180000_deal_extensions.sql
│   │   └── 20260227190000_integrations.sql
│   └── types/
│       └── database.ts         # Generated Supabase types
├── scripts/                    # Build/deploy/audit scripts
│   └── synthetic-data/         # Seed data generators
├── playground/                 # Playwright test specs + notebooks
│   ├── tests/                  # Playwright test files
│   ├── notebooks/              # Jupyter notebooks
│   └── ui_screenshots/         # Screenshot comparison assets
├── public/                     # Static assets
│   └── assets/
├── index.html                  # SPA entry point (Tailwind CDN config)
├── vite.config.ts              # Vite build config (aliases, proxy, chunks)
├── vitest.config.ts            # Vitest test runner config
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies and scripts
├── server.js                   # Express production server
├── deploy.sh                   # Deployment script
└── CLAUDE.md                   # AI agent conventions
```

## Directory Purposes

**`src/hooks/`:**
- Purpose: App-level custom hooks that own state and orchestrate logic
- Contains: The primary workspace hook (`useSlopcastWorkspace.ts`) plus specialized hooks
- Key files: `useSlopcastWorkspace.ts` is the single most important file -- all workspace state flows through it

**`src/components/slopcast/`:**
- Purpose: All UI components specific to the Slopcast workspace
- Contains: ~30 React components for wells view, economics view, KPIs, charts, operations console, onboarding, etc.
- Key files: `DesignEconomicsView.tsx`, `DesignWellsView.tsx`, `PageHeader.tsx`, `KpiGrid.tsx`

**`src/components/slopcast/hooks/`:**
- Purpose: Hooks scoped to slopcast components (persistence, viewport, chart containers)
- Contains: `useProjectPersistence.ts` (Supabase sync), `useViewportLayout.ts` (responsive breakpoints), `useStableChartContainer.ts`

**`src/services/`:**
- Purpose: Data access layer -- all external I/O goes through services
- Contains: Repository pattern files for projects and deals, engine adapter, Supabase client singleton
- Key files: `projectRepository.ts` (project CRUD + collaboration), `economicsEngine.ts` (engine adapter)

**`src/utils/`:**
- Purpose: Pure deterministic functions with no side effects or external dependencies
- Contains: Core economics calculations, debug logging, overlap detection
- Key files: `economics.ts` is the computational heart of the app -- all NPV, IRR, decline curves, tax, debt calculations

**`src/auth/`:**
- Purpose: Authentication adapter pattern with pluggable providers
- Contains: AuthProvider context, adapter interface, two concrete adapters
- Key files: `AuthProvider.tsx` exports both `AuthProvider` component and `useAuth()` hook

**`src/theme/`:**
- Purpose: Multi-theme system with dark/light modes
- Contains: ThemeProvider context and theme definitions
- Key files: `themes.ts` defines all available themes with colors, fonts, and optional background components

**`backend/`:**
- Purpose: Python-based alternative economics engine
- Contains: FastAPI app, Pydantic models, economics/sensitivity calculation modules
- Key files: `main.py` (3 API endpoints), `economics.py` (calculation logic)

**`supabase/`:**
- Purpose: Database schema and generated types for the Supabase backend
- Contains: SQL migrations and TypeScript type definitions
- Key files: `migrations/20260220164000_slopcast_v1.sql` (core schema), `types/database.ts` (generated)

## Key File Locations

**Entry Points:**
- `index.html`: SPA shell with Tailwind CDN config and theme token setup
- `src/index.tsx`: React root mount with provider hierarchy
- `src/App.tsx`: Route definitions with lazy-loaded pages
- `backend/main.py`: FastAPI application factory

**Configuration:**
- `vite.config.ts`: Dev server (port 3000), `/api` proxy to 8001, `@` path alias, chunk splitting
- `tsconfig.json`: ES2022 target, bundler module resolution, `@/*` path alias
- `vitest.config.ts`: Test runner configuration
- `package.json`: All npm scripts, dependencies

**Core Logic:**
- `src/utils/economics.ts`: All economics calculations (decline curves, NPV, IRR, tax, debt, reserves risk)
- `src/hooks/useSlopcastWorkspace.ts`: All workspace state management (862 lines)
- `src/services/projectRepository.ts`: Supabase persistence (projects, groups, scenarios, economics runs, collaboration)
- `src/services/dealRepository.ts`: Deal-specific CRUD operations

**Testing:**
- `src/utils/economics.test.ts`: 20 unit tests for economics functions
- `playground/tests/`: Playwright E2E/visual test specs
- `backend/tests/`: Python backend tests

## Naming Conventions

**Files:**
- Components: PascalCase (`DesignEconomicsView.tsx`, `KpiGrid.tsx`, `PageHeader.tsx`)
- Hooks: camelCase with `use` prefix (`useSlopcastWorkspace.ts`, `useDerivedMetrics.ts`)
- Services: camelCase with pattern suffix (`projectRepository.ts`, `economicsEngine.ts`, `supabaseClient.ts`)
- Utils: camelCase (`economics.ts`, `debugLogger.ts`)
- Types: camelCase (`types.ts`)
- Tests: `*.test.ts` suffix co-located with source

**Directories:**
- Lowercase, kebab-case for multi-word (`synthetic-data/`)
- Feature-scoped nesting (`components/slopcast/hooks/`)

**Exports:**
- Components: default export matching filename (`export default SlopcastPage`)
- Hooks: named export (`export function useSlopcastWorkspace()`)
- Services: named exports of individual functions (`export async function saveProject()`)
- Types: named exports from `src/types.ts`

## Where to Add New Code

**New Page/Route:**
1. Create page component in `src/pages/NewPage.tsx` (PascalCase, default export)
2. Add lazy import and `<Route>` in `src/App.tsx`
3. Wrap with `<ProtectedRoute>` if auth required

**New Slopcast Feature Component:**
1. Create component in `src/components/slopcast/NewComponent.tsx`
2. If it needs its own hook, add to `src/components/slopcast/hooks/useNewFeature.ts`
3. Wire into `SlopcastPage.tsx` and pass workspace data from `useSlopcastWorkspace`

**New Economics Calculation:**
1. Add pure function to `src/utils/economics.ts`
2. Export it and add unit test in `src/utils/economics.test.ts`
3. If needed in the engine adapter, add to the `EconomicsEngine` interface in `src/services/economicsEngine.ts`

**New Service/Repository:**
1. Create `src/services/newRepository.ts`
2. Follow the pattern in `projectRepository.ts`: `requireSupabase()` guard, `requireUserId()` for auth, snake_case DB columns mapped to camelCase TS interfaces

**New TypeScript Interface:**
1. Add to `src/types.ts` -- all domain types live in this single file

**New Supabase Table:**
1. Add migration in `supabase/migrations/` with timestamp prefix
2. Update `supabase/types/database.ts` with generated types

**New Theme Background:**
1. Create `src/components/NewBackground.tsx`
2. Register in `src/theme/themes.ts` as `BackgroundComponent` on the theme definition

**New Shared Hook:**
- App-level: `src/hooks/useNewHook.ts`
- Component-scoped: `src/components/slopcast/hooks/useNewHook.ts`

**New Utility Function:**
- Economics-related: `src/utils/economics.ts`
- General purpose: new file in `src/utils/newUtil.ts`

## Special Directories

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes
- Committed: No

**`dist/`:**
- Purpose: Production build output
- Generated: Yes (`npm run build`)
- Committed: No

**`output/playwright/`:**
- Purpose: Playwright screenshot captures for visual regression
- Generated: Yes (by UI scripts)
- Committed: Mixed (some committed for comparison)

**`.planning/`:**
- Purpose: GSD planning documents and codebase analysis
- Generated: By AI agents
- Committed: Yes

**`.agents/`:**
- Purpose: Multi-agent development system configuration
- Generated: No (hand-authored)
- Committed: Yes

**`playground/`:**
- Purpose: Exploratory tests, notebooks, and screenshot fixtures
- Generated: Mixed
- Committed: Yes

---

*Structure analysis: 2026-03-05*
