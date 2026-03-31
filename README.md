# Slopcast

Slopcast is an oil and gas economics modeling app built with a React + Vite frontend and a Python FastAPI backend. Users assemble well groups, tune assumptions, and compare economics across scenarios.

## Start Here

If you are trying to understand or modify this repo, use these files first:

- [CLAUDE.md](CLAUDE.md): global project conventions, architecture, commands, and design principles
- [docs/CODING_AGENT_HARNESS.md](docs/CODING_AGENT_HARNESS.md): how Cursor, Claude Code, and Codex are wired into the repo
- [docs/README.md](docs/README.md): curated docs index with canonical vs historical guidance
- [src/README.md](src/README.md): frontend routing map for the main app

## Core Commands

- `npm install`: install frontend dependencies
- `npm run dev`: start the Vite app on `localhost:3000`
- `npm run build`: create a production build
- `npm run typecheck`: run TypeScript checks
- `npm test`: run Vitest unit tests
- `npm run storybook`: start Storybook on `localhost:6006`
- `npm run ui:audit`: check for style drift and forbidden classnames
- `npm run ui:verify`: run Playwright UI verification

## Main App Surfaces

- `src/pages/SlopcastPage.tsx`: live route entry for the Slopcast workspace
- `src/components/slopcast/`: product-specific UI, including map and economics panels
- `src/services/`: adapter layer for Supabase, economics engine selection, and spatial data
- `src/utils/economics.ts`: deterministic TypeScript economics engine
- `backend/`: FastAPI backend endpoints and services
- `supabase/`: schema migrations, generated types, and local data setup

## Agent And Docs Routing

- Root guidance is canonical: `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, and `.agents/`
- For folder-specific work, check the nearest local `FEATURE.md` or `README.md` before broad repo search
- Product specs live under `docs/specs/`
- Historical snapshots live under `docs/originals-from-pr/` and should not be treated as the default source of truth
