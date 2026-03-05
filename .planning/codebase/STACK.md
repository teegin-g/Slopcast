# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**
- TypeScript ~5.8.2 - Frontend application (`src/`), build config, test config
- Python 3.x - Backend economics engine (`backend/`)

**Secondary:**
- JavaScript (ESM) - Production server (`server.js`), utility scripts (`scripts/*.mjs`)
- CSS - Theme system (`src/styles/theme.css`), Tailwind via CDN in `index.html`
- SQL - Supabase migrations (`supabase/migrations/`)

## Runtime

**Environment:**
- Node.js (ESM modules, `"type": "module"` in `package.json`)
- Python with virtualenv (`.venv/` convention, activated by `scripts/start-backend.sh`)

**Package Manager:**
- npm (lockfile: `package-lock.json` expected)
- pip via `requirements.txt` for Python backend

## Frameworks

**Core:**
- React 19.2.3 - UI framework (`src/`)
- React Router DOM 7.13.0 - Client-side routing (`src/App.tsx`)
- Vite 6.2.0 - Dev server + bundler (`vite.config.ts`)
- FastAPI - Python backend REST API (`backend/main.py`)

**Testing:**
- Vitest 4.0.18 - Unit test runner (`vitest.config.ts`)
- Playwright 1.58.2 - E2E / UI snapshot tests (`playground/`)
- Testing Library (React 16.3.2, jest-dom 6.9.1) - Component test utilities
- jsdom 28.1.0 - Browser environment for Vitest
- pytest - Python backend tests (`backend/tests/`)

**Build/Dev:**
- Vite 6.2.0 - Dev server (port 3000), HMR, production builds to `dist/`
- @vitejs/plugin-react 5.0.0 - React Fast Refresh
- Custom `vite-plugin-debug-logger` (`vite-plugin-debug-logger.ts` at root)
- Tailwind CSS (CDN) - Utility classes via `<script src="https://cdn.tailwindcss.com">`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.95.3 - Database client, auth, RPC calls (`src/services/supabaseClient.ts`)
- `react` ^19.2.3 + `react-dom` ^19.2.3 - UI rendering
- `react-router-dom` ^7.13.0 - SPA routing

**Visualization:**
- `recharts` ^3.7.0 - Chart components for economics visualization
- `d3` ^7.9.0 - Data-driven visualizations, used alongside Recharts
- `mapbox-gl` ^3.18.1 - Interactive well maps (`src/components/MapVisualizer.tsx`)

**AI:**
- `@google/genai` ^1.38.0 - Google Gemini API for deal analysis (`src/services/geminiService.ts`)
  - Model: `gemini-3-flash-preview`
  - Gracefully degrades when API key is missing

**Infrastructure:**
- `express` ^4.22.1 - Production static server + API proxy (`server.js`)
- `canvas` ^3.2.1 - Server-side canvas rendering (screenshot/image generation)
- `uvicorn[standard]` - ASGI server for FastAPI backend

**Dev Only:**
- `pixelmatch` ^7.1.0 + `pngjs` ^7.0.0 - Visual regression testing
- `@types/mapbox-gl` ^3.4.1, `@types/node` ^22.14.0 - TypeScript type definitions

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2022, Module: ESNext, JSX: react-jsx
- Path alias: `@/*` maps to `./src/*`
- Includes: `src/` and `supabase/` directories
- Strict mode: not explicitly enabled (default loose)

**Vite:**
- Config: `vite.config.ts`
- Dev server: port 3000, host 0.0.0.0
- API proxy: `/api` -> `http://127.0.0.1:8001` (Python backend)
- Manual chunks: `vendor-react` (react, react-dom, react-router-dom), `vendor-charts` (recharts, d3)
- Resolve alias: `@` -> `./src`
- `process.env.GEMINI_API_KEY` injected at build time via `define`

**Vitest:**
- Config: `vitest.config.ts`
- Environment: jsdom
- Test pattern: `src/**/*.test.{ts,tsx}`
- Resolve alias: same `@` -> `./src`

**Environment Variables (existence only):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase anon key
- `VITE_AUTH_PROVIDER` - Auth adapter selection (`supabase` or `dev-bypass`, default: `dev-bypass`)
- `GEMINI_API_KEY` - Google Gemini API key (injected at build time)
- `PORT` - Production server port (default: 8000)
- `PYTHON_API_PORT` - FastAPI backend port (default: 8001)
- `MAPBOX_TOKEN` - Mapbox GL access token (for map rendering)

## Build Pipeline

**Development:**
```bash
npm run dev              # Vite dev server at localhost:3000
npm run dev:full         # Vite + Python FastAPI backend together
```

**Production Build:**
```bash
npm run build            # Vite build to dist/
npm run start            # Express static server (serves dist/ + proxies /api/engine to Python)
```

**Validation:**
```bash
npm run typecheck        # tsc --noEmit
npm test                 # vitest run
npm run ui:audit         # Custom CSS/style drift checker
npm run ui:shots         # Playwright UI screenshots
npm run ui:verify        # Playwright flow verification
```

## Platform Requirements

**Development:**
- Node.js (ESM support required, likely 18+)
- Python 3.x with virtualenv for backend
- Optional: Supabase CLI for local DB (`supabase/config.toml`)

**Production:**
- Node.js for Express static server (`server.js`)
- Python + uvicorn for FastAPI backend (optional, TS engine works standalone)
- Supabase hosted instance for database/auth

---

*Stack analysis: 2026-03-05*
