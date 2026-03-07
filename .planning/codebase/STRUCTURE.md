# Codebase Structure

**Analysis Date:** 2026-03-06

## Directory Layout

```
Slopcast/
├── src/                        # Frontend source (React + TypeScript)
│   ├── App.tsx                 # Route definitions (React Router)
│   ├── index.tsx               # React root (provider composition)
│   ├── types.ts                # All TypeScript interfaces/types
│   ├── constants.ts            # Mock data, default assumptions
│   ├── constants/
│   │   └── templates.ts        # Assumption template presets (Wolfcamp A, Bone Spring, etc.)
│   ├── auth/                   # Auth adapter system
│   │   ├── AuthProvider.tsx    # Context provider + useAuth hook
│   │   ├── provider.ts         # AuthAdapter interface + localStorage helpers
│   │   ├── types.ts            # AuthSession, AuthUser, AuthState types
│   │   └── adapters/           # Pluggable auth implementations
│   │       ├── devBypassAdapter.ts
│   │       └── supabaseAdapter.ts
│   ├── theme/                  # Theme system
│   │   ├── ThemeProvider.tsx   # Context provider + useTheme hook
│   │   └── themes.ts          # Theme definitions (colors, backgrounds, metadata)
│   ├── styles/
│   │   └── theme.css           # CSS custom properties for themes
│   ├── pages/                  # Route-level page components
│   │   ├── SlopcastPage.tsx    # Main workspace (wells + economics)
│   │   ├── HubPage.tsx         # Module hub / dashboard
│   │   ├── AuthPage.tsx        # Login/signup
│   │   ├── IntegrationsPage.tsx # Data integration management
│   │   └── NotFoundPage.tsx    # 404
│   ├── components/             # UI components
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── debug/
│   │   │   ├── DebugOverlay.tsx
│   │   │   └── DebugProvider.tsx
│   │   ├── integrations/
│   │   │   ├── ConnectionForm.tsx
│   │   │   └── SchemaMapper.tsx
│   │   ├── slopcast/           # Workspace-specific components
│   │   │   ├── hooks/          # Component-scoped hooks
│   │   │   │   ├── useProjectPersistence.ts
│   │   │   │   ├── useStableChartContainer.ts
│   │   │   │   └── useViewportLayout.ts
│   │   │   ├── DesignWellsView.tsx      # Wells tab (map + filters + group list)
│   │   │   ├── DesignEconomicsView.tsx  # Economics tab (controls + results)
│   │   │   ├── DesignWorkspaceTabs.tsx  # WELLS / ECONOMICS tab switcher
│   │   │   ├── EconomicsResultsTabs.tsx # SUMMARY / CHARTS / DRIVERS sub-tabs
│   │   │   ├── EconomicsDriversPanel.tsx
│   │   │   ├── EconomicsGroupBar.tsx
│   │   │   ├── KpiGrid.tsx
│   │   │   ├── ForecastGrid.tsx
│   │   │   ├── GroupWellsTable.tsx
│   │   │   ├── GroupComparisonStrip.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AiAssistant.tsx
│   │   │   ├── DealsTable.tsx
│   │   │   ├── EngineComparisonPanel.tsx
│   │   │   ├── EngineToggle.tsx
│   │   │   ├── ProfileSelector.tsx
│   │   │   ├── ReservesPanel.tsx
│   │   │   ├── SensitivityMatrix.tsx    # (also at components/ level)
│   │   │   ├── OnboardingTour.tsx
│   │   │   ├── KeyboardShortcutsHelp.tsx
│   │   │   ├── ProjectSharePanel.tsx
│   │   │   ├── AuditLogPanel.tsx
│   │   │   ├── CommentsPanel.tsx
│   │   │   ├── OperationsConsole.tsx
│   │   │   ├── MiniMapPreview.tsx
│   │   │   ├── MobileScenarioCards.tsx
│   │   │   ├── AcreageSearchBar.tsx
│   │   │   ├── WaterfallChart.tsx
│   │   │   ├── WorkflowStepper.tsx
│   │   │   └── SectionCard.tsx
│   │   ├── CapexControls.tsx           # Assumption editors (shared)
│   │   ├── OpexControls.tsx
│   │   ├── OwnershipControls.tsx
│   │   ├── DebtControls.tsx
│   │   ├── TaxControls.tsx
│   │   ├── Controls.tsx                # Master controls panel
│   │   ├── GroupList.tsx
│   │   ├── Charts.tsx
│   │   ├── MapVisualizer.tsx
│   │   ├── ScenarioComparison.tsx
│   │   ├── ScenarioDashboard.tsx
│   │   ├── SensitivityMatrix.tsx
│   │   ├── HyperboreaBackground.tsx    # Themed animated canvas backgrounds
│   │   ├── MarioOverworldBackground.tsx
│   │   ├── MoonlightBackground.tsx
│   │   ├── StormDuskBackground.tsx
│   │   ├── SynthwaveBackground.tsx
│   │   └── TropicalBackground.tsx
│   ├── hooks/                  # App-level hooks
│   │   ├── useSlopcastWorkspace.ts    # Master workspace state (~900 lines)
│   │   ├── useDerivedMetrics.ts       # Economics shock/driver analysis
│   │   ├── useKeyboardShortcuts.ts
│   │   └── usePerformanceMonitor.ts
│   ├── services/               # Data access / API adapters
│   │   ├── supabaseClient.ts          # Supabase client singleton
│   │   ├── projectRepository.ts       # Project CRUD (Supabase)
│   │   ├── dealRepository.ts          # Deal CRUD (Supabase)
│   │   ├── profileRepository.ts       # Assumption profile CRUD
│   │   ├── economicsEngine.ts         # Engine adapter (TS vs Python)
│   │   ├── integrationService.ts      # Data integration config/jobs
│   │   ├── assistantService.ts        # AI assistant (Gemini)
│   │   └── geminiService.ts           # Gemini API client
│   └── utils/                  # Pure logic (no side effects)
│       ├── economics.ts               # Core economics calculator (661+ lines)
│       ├── economics.test.ts          # Unit tests for economics
│       ├── overlapDetector.ts         # Well overlap detection
│       ├── mockDsuLayer.ts            # Mock DSU layer data
│       ├── localAccount.ts            # Local account helpers
│       └── debugLogger.ts             # Debug logging utility
├── backend/                    # Python FastAPI backend
│   ├── main.py                 # FastAPI app factory + route definitions
│   ├── economics.py            # Python economics calculator
│   ├── models.py               # Pydantic request/response models
│   ├── sensitivity.py          # Sensitivity matrix generation
│   ├── requirements.txt        # Python dependencies
│   └── tests/
│       └── test_rate_functions.py
├── supabase/                   # Supabase configuration
│   ├── config.toml             # Supabase project config
│   ├── seed.sql                # Seed data
│   ├── migrations/             # Database migrations
│   └── types/                  # Generated TypeScript types
├── scripts/                    # Build/deploy/audit scripts
│   ├── start-backend.sh        # Start Python backend
│   ├── ui-audit.mjs            # CSS/style drift checker
│   ├── ui-snapshots.mjs        # Playwright screenshot capture
│   ├── ui-verify-flow.mjs      # Playwright flow verification
│   ├── seed-wells.mjs          # Seed wells to Supabase
│   ├── deploy-supabase-storage.mjs
│   ├── generate-synthetic-data.ts
│   └── theme-fx-toggle.mjs
├── playground/                 # Playwright test specs
├── docs/                       # Project documentation (roadmap, requirements, research)
├── .agents/                    # Multi-agent development system
│   ├── roles/                  # Agent role definitions
│   ├── workflows/              # Pipeline definitions
│   ├── validation/             # gate.sh validation script
│   ├── adapters/               # IDE-specific configs
│   └── state/                  # Activity logs
├── index.html                  # Vite HTML entry point
├── vite.config.ts              # Vite config (proxy, aliases, chunks)
├── vitest.config.ts            # Vitest test runner config
├── tsconfig.json               # TypeScript config
├── package.json                # npm scripts and dependencies
├── server.js                   # Production Express server
└── deploy.sh                   # Deployment script
```

## Directory Purposes

**`src/pages/`:**
- Purpose: One component per route, acts as the "controller" wiring hooks to UI
- Contains: 5 page components
- Key files: `SlopcastPage.tsx` (main app), `HubPage.tsx` (module launcher)

**`src/components/slopcast/`:**
- Purpose: All components specific to the Slopcast workspace
- Contains: ~30 components + scoped hooks
- Key files: `DesignEconomicsView.tsx` (economics workspace), `DesignWellsView.tsx` (wells workspace), `PageHeader.tsx` (navigation/theme controls)

**`src/components/` (root level):**
- Purpose: Shared components used across pages, plus assumption editors and themed backgrounds
- Contains: Control panels (Capex, Opex, Ownership, Debt, Tax), visualization components, animated backgrounds
- Key files: `Controls.tsx` (master controls), `MapVisualizer.tsx`, `ScenarioDashboard.tsx`

**`src/hooks/`:**
- Purpose: App-level state management hooks
- Contains: 4 hooks
- Key files: `useSlopcastWorkspace.ts` (the central state hook, ~900 lines)

**`src/services/`:**
- Purpose: All external data access -- Supabase repositories, API adapters, AI services
- Contains: 8 service modules
- Key files: `projectRepository.ts` (project persistence), `economicsEngine.ts` (engine adapter)

**`src/utils/`:**
- Purpose: Pure, deterministic calculation functions with no side effects
- Contains: Economics calculator, overlap detection, mock data generators
- Key files: `economics.ts` (core calculator, the most critical business logic file)

**`src/auth/`:**
- Purpose: Pluggable authentication system
- Contains: Provider, adapter interface, two adapter implementations
- Key files: `AuthProvider.tsx` (the context provider all consumers use)

**`src/theme/`:**
- Purpose: Multi-theme system with dark/light modes
- Contains: Provider and theme definitions
- Key files: `themes.ts` (all theme color palettes and metadata)

**`backend/`:**
- Purpose: Python alternative economics engine (FastAPI)
- Contains: 4 source files + tests
- Key files: `economics.py` (Python calculator), `main.py` (API routes)

## Key File Locations

**Entry Points:**
- `index.html`: Vite HTML shell, references `src/index.tsx`
- `src/index.tsx`: React root, provider composition
- `src/App.tsx`: Route definitions
- `backend/main.py`: FastAPI app

**Configuration:**
- `vite.config.ts`: Dev server (port 3000), `/api` proxy, path alias `@` -> `src/`
- `vitest.config.ts`: Test runner config
- `tsconfig.json`: TypeScript compiler options
- `package.json`: Scripts, dependencies
- `supabase/config.toml`: Supabase project configuration
- `.env.example`: Required environment variables (existence noted only)

**Core Logic:**
- `src/utils/economics.ts`: All economics calculations (decline curves, NPV, IRR, cash flows, tax, debt, reserves risk)
- `src/hooks/useSlopcastWorkspace.ts`: Central workspace state management
- `src/services/economicsEngine.ts`: Engine adapter (TypeScript vs Python)
- `src/services/projectRepository.ts`: Project CRUD operations

**Testing:**
- `src/utils/economics.test.ts`: Unit tests for economics functions
- `backend/tests/test_rate_functions.py`: Python backend tests
- `playground/`: Playwright E2E specs

## Naming Conventions

**Files:**
- Components: PascalCase (`DesignEconomicsView.tsx`, `CapexControls.tsx`)
- Hooks: camelCase with `use` prefix (`useSlopcastWorkspace.ts`, `useDerivedMetrics.ts`)
- Services: camelCase with descriptive suffix (`projectRepository.ts`, `economicsEngine.ts`)
- Utils: camelCase (`economics.ts`, `overlapDetector.ts`)
- Tests: same name as source + `.test.ts` suffix (`economics.test.ts`)
- CSS: kebab-case (`theme.css`)

**Directories:**
- All lowercase, descriptive (`pages/`, `components/`, `hooks/`, `services/`, `utils/`, `auth/`, `theme/`)
- Feature-scoped subdirectories under components (`slopcast/`, `integrations/`, `auth/`, `debug/`)

## Where to Add New Code

**New Route/Page:**
- Create page component: `src/pages/NewPage.tsx`
- Add route in `src/App.tsx` (use `React.lazy()` for code-splitting)
- Wrap with `<ProtectedRoute>` if auth is required

**New Slopcast Workspace Component:**
- Component: `src/components/slopcast/NewComponent.tsx`
- If it needs a scoped hook: `src/components/slopcast/hooks/useNewThing.ts`
- Wire into `DesignEconomicsView.tsx` or `DesignWellsView.tsx` as appropriate

**New Shared/Reusable Component:**
- Place in `src/components/NewComponent.tsx`
- If it is feature-scoped, create a subdirectory: `src/components/featureName/`

**New Service/Repository:**
- Add to `src/services/newService.ts`
- Follow the pattern in `projectRepository.ts`: export standalone async functions, use `getSupabaseClient()` for Supabase calls

**New Economics Feature:**
- Pure calculation logic: add to `src/utils/economics.ts`
- Add unit tests in `src/utils/economics.test.ts`
- If it needs an engine adapter method: add to the `EconomicsEngine` interface in `src/services/economicsEngine.ts` and implement in both `tsEngine` and `pyEngine`

**New Type/Interface:**
- Add to `src/types.ts` (all domain types live in this single file)

**New Default Constants:**
- Add to `src/constants.ts` (single values) or `src/constants/templates.ts` (template presets)

**New Theme:**
- Add theme definition to `src/theme/themes.ts`
- Add corresponding CSS custom properties to `src/styles/theme.css`
- Optionally add a canvas background component: `src/components/NewThemeBackground.tsx`

**New Backend Endpoint:**
- Add Pydantic models to `backend/models.py`
- Add business logic to `backend/economics.py` or new module
- Add route in `backend/main.py`
- Add corresponding `pyEngine` method in `src/services/economicsEngine.ts`

**Utilities:**
- Pure helpers: `src/utils/newUtil.ts`
- Keep side-effect-free; only import from `src/types.ts`

## Special Directories

**`.agents/`:**
- Purpose: Multi-agent development system (supervisor/implementer/validator roles)
- Generated: No (manually authored)
- Committed: Yes

**`supabase/migrations/`:**
- Purpose: Database schema migrations for Supabase
- Generated: Via Supabase CLI
- Committed: Yes

**`dist/`:**
- Purpose: Production build output
- Generated: Yes (`npm run build`)
- Committed: No (in `.gitignore`)

**`playground/`:**
- Purpose: Playwright test specifications and UI flow tests
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: Codebase analysis and planning documents
- Generated: By analysis agents
- Committed: Yes

**`scripts/`:**
- Purpose: Build, deploy, data generation, and UI audit scripts
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-06*
