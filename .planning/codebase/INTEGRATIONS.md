# External Integrations

**Analysis Date:** 2026-03-06

## APIs & External Services

**AI / LLM:**
- Google Gemini (model: `gemini-3-flash-preview`) - AI-generated deal analysis summaries
  - SDK: `@google/genai` ^1.38.0
  - Client: `src/services/geminiService.ts`
  - Auth: `GEMINI_API_KEY` env var (injected via Vite `define`)
  - Graceful degradation: returns fallback string if key is missing or API fails
  - Usage: `generateDealAnalysis()` produces executive investment summary from deal metrics

**Mapping:**
- Mapbox GL JS - Interactive well location map
  - SDK: `mapbox-gl` ^3.18.1
  - Client: `src/components/MapVisualizer.tsx`
  - Auth: Mapbox access token (loaded via env/config)

**Internal Python Backend:**
- FastAPI economics engine at `http://127.0.0.1:8001`
  - Proxied through Vite dev server (`/api` -> port 8001)
  - Proxied through Express production server (`/api/engine` -> port 8001)
  - Endpoints:
    - `POST /api/economics/calculate` - Single group economics
    - `POST /api/economics/aggregate` - Multi-group aggregation
    - `POST /api/sensitivity/matrix` - Sensitivity analysis grid
    - `GET /api/health` - Health check
  - Client: `src/services/economicsEngine.ts` (Python engine adapter)
  - Switchable: users toggle between TypeScript (browser) and Python engines via localStorage key `slopcast_engine_id`

## Data Storage

**Database:**
- Supabase (PostgreSQL)
  - Client: `@supabase/supabase-js` ^2.95.3
  - Connection: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
  - Client singleton: `src/services/supabaseClient.ts`
  - Config: `supabase/config.toml`
  - Migrations: `supabase/migrations/`
  - Type definitions: `supabase/types/database.ts`

**Supabase Tables (from migrations):**
- `wells` - Canonical well records with `external_key`
- `projects` - User projects with UI state
- `project_groups` - Well groups within projects
- `project_group_wells` - Many-to-many well-group junction
- `project_scenarios` - Pricing/schedule scenario overlays
- `project_members` - Collaboration members (owner/editor/viewer)
- `project_invites` - Email-based project invitations
- `project_audit_log` - Action audit trail
- `project_comments` - Entity-level comments (well/group/scenario)
- `economics_runs` - Saved economics run results
- `deals` - Deal records with KPIs
- `deal_well_groups`, `deal_wells` - Deal well structure
- `deal_production_profiles`, `deal_capex_profiles`, `deal_opex_profiles`, `deal_ownership_profiles` - Deal assumption profiles
- `deal_scenarios` - Deal scenario overlays
- `deal_type_curve_presets` - Reusable type curve/assumption presets
- `integration_configs` - External data integration configurations
- `integration_jobs` - Integration sync job tracking

**Supabase RPC Functions:**
- `save_project_bundle` - Atomic project save (groups + scenarios + well mappings)
- `save_deal_bundle` - Atomic deal save (all sub-entities)
- `create_economics_run` - Persist economics run with group metrics
- `current_project_role` - Get current user's role for a project
- `current_deal_role` - Get current user's role for a deal

**Local Storage Fallback:**
- Project persistence falls back to localStorage when Supabase is not configured
- Auth session stored in localStorage under key `slopcast-auth-session`
- Engine preference stored under key `slopcast_engine_id`

**File Storage:**
- Supabase Storage (deployment script: `scripts/deploy-supabase-storage.mjs`)
- Well seeding script: `scripts/seed-wells.mjs`

**Caching:**
- None (no explicit caching layer)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (production)
  - Implementation: Adapter pattern in `src/auth/`
  - Types: `src/auth/types.ts` (AuthSession, AuthUser, AuthStatus)
  - Provider: `src/auth/provider.ts` (AuthAdapter interface)
  - Providers: `dev-bypass` (local dev) and `supabase` (production)
  - Session persistence: localStorage (`slopcast-auth-session`)
  - Protected routes: `src/components/auth/ProtectedRoute`

**Auth Flow:**
- `AuthProvider` wraps the app, delegates to active adapter
- `useAuth()` hook exposes `{ status, session, signIn, signOut }`
- DevBypassAdapter allows passwordless local development
- SupabaseAdapter uses Supabase's built-in auth (email-based)

**Authorization:**
- Row Level Security (RLS) via Supabase policies
- Role-based access: owner, editor, viewer (per project/deal)
- Role checked via RPC functions (`current_project_role`, `current_deal_role`)

## Monitoring & Observability

**Error Tracking:**
- None (console.error only)

**Logs:**
- `console.error` / `console.warn` in services
- Custom Vite debug logger plugin (`vite-plugin-debug-logger`)
- Audit log table (`project_audit_log`) for user actions within projects

## CI/CD & Deployment

**Hosting:**
- Express static server (`server.js`) serves `dist/` with SPA fallback
- Python backend runs alongside via uvicorn

**CI Pipeline:**
- Validation gate script: `.agents/validation/gate.sh` (typecheck -> build -> test -> audit -> screenshots)
- No external CI service configuration detected

**Build Output:**
- `dist/` directory (Vite production build)
- Manual chunks split vendor bundles for caching

## Environment Configuration

**Required env vars (frontend):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase public key

**Optional env vars:**
- `GEMINI_API_KEY` - Google Gemini API key for AI deal analysis
- `PYTHON_API_PORT` - Python backend port (default: 8001)
- `PORT` - Production server port (default: 8000)

**Secrets location:**
- `.env.example` exists as template (actual `.env` is gitignored)
- Supabase keys are public anon keys (safe for client-side)
- Gemini API key injected at build time via Vite `define`

## Data Integrations Framework

**Integration Service (`src/services/integrationService.ts`):**
- Supports connection types: `supabase`, `postgres`, `sqlserver`, `csv`
- CRUD for integration configs stored in `integration_configs` table
- Job tracking via `integration_jobs` table
- Statuses: draft -> active -> paused/error
- Job flow: pending -> running -> completed/failed

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

---

*Integration audit: 2026-03-06*
