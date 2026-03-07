# Technology Stack

**Analysis Date:** 2026-03-06

## Languages

**Primary:**
- TypeScript ~5.8.2 - Frontend SPA, all `src/` code, type definitions
- Python 3.x - Backend economics engine (`backend/`)

**Secondary:**
- JavaScript (ESM) - Production server (`server.js`), build scripts (`scripts/*.mjs`)
- SQL - Supabase migrations (`supabase/migrations/*.sql`)

## Runtime

**Environment:**
- Node.js (ESM modules, `"type": "module"` in `package.json`)
- Python with uvicorn ASGI server for backend

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)
- Python deps: `backend/requirements.txt` (fastapi, uvicorn[standard], pytest)

## Frameworks

**Core:**
- React ^19.2.3 - UI framework
- React Router DOM ^7.13.0 - Client-side routing
- Vite ^6.2.0 - Dev server and bundler
- FastAPI 0.1.0 - Python backend API (`backend/main.py`)

**Testing:**
- Vitest ^4.0.18 - Unit test runner (`vitest.config.ts`)
- Playwright ^1.58.2 - E2E/UI snapshot testing
- @testing-library/react ^16.3.2 - React component testing
- @testing-library/jest-dom ^6.9.1 - DOM matchers
- pytest - Python backend tests (`backend/tests/`)

**Build/Dev:**
- Vite ^6.2.0 - Dev server (port 3000), HMR, production bundler
- @vitejs/plugin-react ^5.0.0 - React Fast Refresh
- Express ^4.22.1 - Production static server with API proxy (`server.js`)
- Custom Vite plugin: `vite-plugin-debug-logger` (`./vite-plugin-debug-logger`)

## Key Dependencies

**Critical:**
- @supabase/supabase-js ^2.95.3 - Database client, auth, RLS (all persistence flows)
- mapbox-gl ^3.18.1 - Interactive well map visualization
- recharts ^3.7.0 - Charts for economics/cash flow visualization
- d3 ^7.9.0 - Data visualization utilities (used alongside recharts)
- @google/genai ^1.38.0 - Gemini AI for deal analysis summaries

**Infrastructure:**
- express ^4.22.1 - Production server with SPA fallback and Python API proxy
- canvas ^3.2.1 - Server-side canvas rendering (used by scripts/testing)

**Dev Tooling:**
- jsdom ^28.1.0 - Test environment for Vitest
- pixelmatch ^7.1.0 - Visual regression pixel comparison
- pngjs ^7.0.0 - PNG processing for UI snapshots

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Path alias: `@/*` maps to `./src/*`
- Strict mode: not explicitly enabled
- `noEmit: true` (Vite handles compilation)

**Vite (`vite.config.ts`):**
- Dev server: port 3000, host 0.0.0.0
- API proxy: `/api` -> `http://127.0.0.1:8001` (Python backend)
- Build output: `dist/`
- Manual chunks: `vendor-react` (react, react-dom, react-router-dom), `vendor-charts` (recharts, d3)
- Path alias: `@` -> `src/`
- Defines: `process.env.GEMINI_API_KEY` injected at build time from env

**Vitest (`vitest.config.ts`):**
- Environment: jsdom
- Test include: `src/**/*.test.{ts,tsx}`
- Path alias: `@` -> `src/`

**Environment:**
- `.env.example` present (template for required env vars)
- Required Vite env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)
- Optional: `GEMINI_API_KEY` (AI deal analysis)
- Backend port: `PYTHON_API_PORT` (default 8001)
- Production port: `PORT` (default 8000)

## Platform Requirements

**Development:**
- Node.js (ESM support required)
- Python 3.x with virtualenv (`.venv/`) for backend
- Mapbox GL access token (for map component)
- Supabase project (optional; falls back to localStorage without it)

**Production:**
- Node.js for Express static server (`server.js`)
- Python + uvicorn for FastAPI backend
- Supabase hosted project (database + auth)
- Single `dist/` directory served as SPA with fallback

**Commands:**
```bash
npm run dev              # Vite dev server at localhost:3000
npm run dev:full         # Vite + Python backend together
npm run build            # Production build to dist/
npm run start            # Express production server
npm run typecheck        # tsc --noEmit
npm test                 # Vitest run
npm run test:watch       # Vitest watch mode
npm run ui:audit         # Check for forbidden CSS classnames
npm run ui:shots         # Playwright UI snapshots
npm run ui:verify        # Playwright UI flow verification
```

---

*Stack analysis: 2026-03-06*
