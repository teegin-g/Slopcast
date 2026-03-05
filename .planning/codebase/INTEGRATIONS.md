# External Integrations

**Analysis Date:** 2026-03-05

## APIs & External Services

**Google Gemini AI:**
- Purpose: Generate executive-level deal analysis summaries from economics metrics
- SDK: `@google/genai` ^1.38.0
- Client: `src/services/geminiService.ts`
- Model: `gemini-3-flash-preview`
- Auth: `GEMINI_API_KEY` env var (injected at build time via `vite.config.ts` `define`)
- Degradation: Returns user-friendly message when API key is missing; never crashes
- Usage: `generateDealAnalysis()` takes metrics, type curve, pricing, ownership, well count

**Mapbox GL:**
- Purpose: Interactive well location maps
- SDK: `mapbox-gl` ^3.18.1
- Client: `src/components/MapVisualizer.tsx`
- Auth: Mapbox access token (env var)
- Types: `@types/mapbox-gl` ^3.4.1

**Python Economics Backend (Internal):**
- Purpose: Alternative economics calculation engine (FastAPI)
- Location: `backend/main.py`
- Endpoints:
  - `POST /api/economics/calculate` - Single group economics
  - `POST /api/economics/aggregate` - Multi-group portfolio aggregation
  - `POST /api/sensitivity/matrix` - Sensitivity analysis grid
  - `GET /api/health` - Health check
- Client: `src/services/economicsEngine.ts` (pyEngine adapter)
- Proxy: Vite dev proxy `/api` -> `http://127.0.0.1:8001`; Express prod proxy `/api/engine` -> Python
- Engine Selection: Stored in localStorage (`slopcast_engine_id`), defaults to TypeScript browser engine
- CORS: Allows localhost:3000 and 127.0.0.1:3000

## Data Storage

**Database:**
- Provider: Supabase (PostgreSQL)
- Client: `@supabase/supabase-js` ^2.95.3
- Connection: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- Client singleton: `src/services/supabaseClient.ts` (lazy-initialized, cached)
- Local dev: Supabase CLI config at `supabase/config.toml` (port 54322)

**Supabase Tables (from migrations):**
- `wells` - Canonical well records with `external_key`
- `projects` - User projects with UI state
- `project_groups` - Well groups within projects (type curve, capex, opex, ownership as JSONB)
- `project_group_wells` - Many-to-many: groups <-> wells
- `project_scenarios` - Pricing/schedule scenario overlays
- `project_members` - Role-based project access (owner/editor/viewer)
- `project_invites` - Email-based project invitations
- `project_audit_log` - User action audit trail
- `project_comments` - Entity-scoped comments (well/group/scenario)
- `economics_runs` - Persisted economics calculation results
- `deals` - Deal entities with KPIs and metadata
- `deal_well_groups` - Deal well groupings
- `deal_wells` - Wells assigned to deals
- `deal_production_profiles` - Type curve profiles per deal
- `deal_capex_profiles` - CAPEX profiles per deal
- `deal_opex_profiles` - OPEX profiles per deal
- `deal_ownership_profiles` - Ownership/NRI profiles per deal
- `deal_scenarios` - Deal scenario overlays
- `deal_type_curve_presets` - Reusable type curve preset library
- `integration_configs` - External data source configurations
- `integration_jobs` - Data sync job tracking

**Supabase RPC Functions:**
- `save_project_bundle` - Atomic project save (groups + scenarios + wells)
- `save_deal_bundle` - Atomic deal save (groups + wells + profiles + scenarios)
- `create_economics_run` - Persist economics run with group metrics
- `current_project_role` - Get caller's role on a project
- `current_deal_role` - Get caller's role on a deal

**Migrations:**
- `supabase/migrations/20260220164000_slopcast_v1.sql` - Core schema (projects, groups, wells, scenarios, economics runs)
- `supabase/migrations/20260223_audit_log.sql` - Audit log table
- `supabase/migrations/20260223_comments.sql` - Comments table
- `supabase/migrations/20260223_project_invites.sql` - Invite/member tables
- `supabase/migrations/20260227170000_deals_v1.sql` - Deals core schema
- `supabase/migrations/20260227180000_deal_extensions.sql` - Deal profiles (production, capex, opex, ownership)
- `supabase/migrations/20260227190000_integrations.sql` - Integration configs and jobs

**File Storage:**
- Supabase Storage (deployment script: `scripts/deploy-supabase-storage.mjs`)

**Local Fallback:**
- localStorage for project persistence when Supabase is not configured (`src/components/slopcast/hooks/useProjectPersistence.ts`)
- localStorage for engine selection preference (`slopcast_engine_id` key)

**Caching:**
- None (no Redis/Memcached). Supabase client is singleton-cached in memory.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth via adapter pattern
- Adapter selection: `VITE_AUTH_PROVIDER` env var (`supabase` | `dev-bypass`)
- Default: `dev-bypass` (no real auth required for local dev)

**Implementation:**
- `src/auth/AuthProvider.tsx` - React context provider, exposes `useAuth()` hook
- `src/auth/adapters/supabaseAdapter.ts` - Supabase anonymous sign-in (`signInAnonymously`)
- `src/auth/adapters/devBypassAdapter.ts` - Local dev bypass (no Supabase required)
- `src/auth/provider.ts` - `AuthAdapter` interface definition
- `src/auth/types.ts` - `AuthSession`, `AuthState`, `SignInInput` types

**Auth Flow:**
- Anonymous auth: users get a Supabase anonymous session (no email/password)
- Optional display name passed as user metadata
- Session persisted by Supabase SDK automatically
- RLS (Row Level Security) enforced server-side via Supabase policies

**Protected Routes:**
- `src/components/auth/ProtectedRoute.tsx` - Guards routes requiring auth

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, etc.)

**Logs:**
- `console.error` / `console.warn` for client-side errors
- Uvicorn stdout for backend logs
- Audit log table (`project_audit_log`) for user action tracking in Supabase

## CI/CD & Deployment

**Hosting:**
- Express static server (`server.js`) serves built `dist/` directory
- Python FastAPI backend runs alongside on separate port

**CI Pipeline:**
- Validation gate script: `.agents/validation/gate.sh` (typecheck -> build -> test -> audit -> screenshots)
- No detected CI service config (GitHub Actions, etc.)

**Build Artifacts:**
- `dist/` - Vite production build output

## Environment Configuration

**Required env vars for full functionality:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase anonymous key

**Optional env vars:**
- `VITE_AUTH_PROVIDER` - Auth mode (`supabase` | `dev-bypass`; default: `dev-bypass`)
- `GEMINI_API_KEY` - Google Gemini AI (deal analysis feature)
- `PORT` - Production Express server port (default: 8000)
- `PYTHON_API_PORT` - FastAPI backend port (default: 8001)
- Mapbox access token (for map visualization)

**Secrets location:**
- Environment variables (not committed)
- `.env` file present at root (gitignored) - contains local dev configuration

## Data Integration Framework

**Integration Service:**
- `src/services/integrationService.ts` - CRUD for external data source connections
- Supported connection types: `supabase`, `postgres`, `sqlserver`, `csv`
- Tracks sync jobs with status lifecycle: `pending` -> `running` -> `completed` | `failed`
- Field mapping configuration for data normalization
- Supabase tables: `integration_configs`, `integration_jobs`

## AI Assistant (Local)

**Service:**
- `src/services/assistantService.ts` - Rule-based NLP prompt parser (no external API)
- Parses natural language into structured state mutations (e.g., "set oil price to $80")
- Supports undo via in-memory history stack (last 20 entries)
- Action types: SET_OIL_PRICE, SET_GAS_PRICE, SET_QI, SET_B_FACTOR, SET_DECLINE_RATE, SET_RIG_COUNT, SET_NRI, SET_CAPEX_SCALAR, SET_PRODUCTION_SCALAR

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## CDN Dependencies

**Tailwind CSS:**
- Loaded via CDN `<script>` tag in `index.html`: `https://cdn.tailwindcss.com`
- Custom theme config inline in `index.html` extending colors, fonts, shadows, border-radius

**Google Fonts:**
- Loaded via CDN in `index.html`
- Families: Inter (300-700), Orbitron (400, 700, 900), Permanent Marker, Press Start 2P

---

*Integration audit: 2026-03-05*
