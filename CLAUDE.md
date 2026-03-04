# Slopcast — Project Conventions

## What is Slopcast?

Oil & gas economics modeling app. React + Vite frontend, Python FastAPI backend.
Users build well groups, assign type curves / CAPEX / OPEX / ownership, and run economics to evaluate deals.

## Project Structure

```
src/
  App.tsx              # Router / route definitions
  index.tsx            # React root (providers: Theme → BrowserRouter → Auth)
  types.ts             # All TypeScript interfaces (Well, WellGroup, Scenario, DealRecord, …)
  constants.ts         # Mock wells, default assumptions (type curve, CAPEX, OPEX, ownership)
  constants/templates.ts  # Assumption template presets
  pages/               # Route-level pages (SlopcastPage, HubPage, AuthPage, …)
  components/          # Shared UI components
    slopcast/          # Components specific to the Slopcast workspace
      hooks/           # Component-scoped hooks (useProjectPersistence, useViewportLayout)
    integrations/      # Integration-related components
    auth/              # Auth UI (ProtectedRoute)
  hooks/               # App-level hooks (useKeyboardShortcuts, useDerivedMetrics, useSlopcastWorkspace)
  services/            # Data access / adapters (supabaseClient, projectRepository, economicsEngine)
  utils/               # Pure logic (economics.ts — 661 lines of deterministic calculations)
  auth/                # Auth adapter pattern (AuthProvider, devBypass, supabase adapters)
  theme/               # Theme system (ThemeProvider, themes.ts)
  styles/              # CSS (theme.css)
backend/               # Python FastAPI backend
supabase/              # Supabase types & migrations
scripts/               # Build/deploy/audit scripts
playground/            # Playwright test specs
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server at localhost:3000 |
| `npm run build` | Production build to dist/ |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run ui:audit` | Check for forbidden CSS classnames / style drift |
| `npm run ui:shots` | Playwright UI snapshots |
| `npm run ui:verify` | Playwright UI flow verification |

## Architecture Patterns

### Economics Engine Adapter (`services/economicsEngine.ts`)
Wraps the TypeScript calculator (`utils/economics.ts`) and (optionally) the Python backend.
Consumers call the adapter; it picks the active engine.

### Auth Adapter (`auth/`)
`AuthProvider` delegates to an adapter: `DevBypassAdapter` (local dev) or `SupabaseAdapter` (prod).
`useAuth()` hook exposes `{ status, session, signIn, signOut }`.

### Theme Provider (`theme/`)
`ThemeProvider` manages theme ID, color mode, and CSS custom properties.
`useTheme()` exposes `{ themeId, theme, setThemeId, colorMode, … }`.
Themes are defined in `theme/themes.ts`.

### Project Persistence (`components/slopcast/hooks/useProjectPersistence.ts`)
Syncs groups/scenarios/UI state to Supabase when authenticated; falls back to localStorage.

## Naming Conventions

- **Components:** PascalCase (`DesignEconomicsView.tsx`)
- **Hooks:** `use*` prefix (`useDerivedMetrics.ts`)
- **Services:** Repository pattern (`projectRepository.ts`, `dealRepository.ts`)
- **Types:** All in `src/types.ts`, interfaces PascalCase
- **Constants:** UPPER_SNAKE_CASE exports in `src/constants.ts`

## Key Types (src/types.ts)

- `Well` — map pin with lat/lng, operator, formation, status
- `WellGroup` — named group of wells + all assumptions (typeCurve, capex, opex, ownership)
- `Scenario` — pricing + schedule + scalars overlay
- `DealMetrics` — NPV10, IRR, EUR, payout, after-tax, levered, risked variants
- `MonthlyCashFlow` — monthly time series with optional tax/debt/levered fields
- `DealRecord` — persisted deal entity

## Defaults (src/constants.ts)

- `MOCK_WELLS` — 40 generated wells in Permian Basin
- `DEFAULT_TYPE_CURVE` — qi=850, b=1.2, di=65%
- `DEFAULT_CAPEX` — 9-item AFE (drill + complete + facilities)
- `DEFAULT_COMMODITY_PRICING` — $75 oil, $3.25 gas
- `DEFAULT_OPEX` — single LOE segment at $8,500/well/month
- `DEFAULT_OWNERSHIP` — 75% NRI, 100% cost interest

## Testing

- **Unit tests:** Vitest (`npm test`) — economics functions in `src/utils/economics.test.ts`
- **UI tests:** Playwright (`npm run ui:shots`, `npm run ui:verify`)
- Test data: reuse `DEFAULT_*` constants with small well sets

## Multi-Agent Development System

This project includes a multi-agent system in `.agents/` for structured feature development with isolated worktrees, validation gates, and coordinated merges.

### Quick Start

| Mode | How to invoke |
|------|--------------|
| **Claude Code (auto)** | Tell Claude: "Act as the supervisor from `.agents/roles/supervisor.md` and implement {feature}" |
| **Claude Code (manual)** | Use `/supervisor` to plan, `/implement` per worktree, `/validate` to check |
| **Cursor** | Open Composer, say "Act as supervisor" or "Act as implementer" — see `.cursorrules` |
| **Codex** | `codex --agent supervisor "Add dark mode toggle"` |

### Key files
- `.agents/system.md` — Architecture overview
- `.agents/roles/supervisor.md` — Supervisor: decomposes, coordinates, merges
- `.agents/roles/implementer.md` — Implementer: builds in worktrees, follows TDD
- `.agents/roles/validator.md` — Validator: runs gate, reports pass/fail
- `.agents/workflows/feature-pipeline.md` — Full end-to-end pipeline
- `.agents/validation/gate.sh` — Automated validation gate (typecheck → build → test → audit → screenshots)

### Rules
- Implementers MUST verify they're in a worktree before writing code
- Task briefs MUST include testable acceptance criteria
- Implementers follow TDD: write failing tests first, then implement
- All activity is logged to `.agents/state/activity.jsonl`

## UI Audit Workflow

When making visual/layout/style changes:
1. Start app (`npm run dev`), keep running at localhost:3000
2. Capture before/after screenshots (desktop + mobile)
3. Check both WELLS and ECONOMICS tabs, at least two themes (slate + mario)
4. Run `npm run ui:audit` to catch style drift
5. Use `rounded-panel` for outer cards, `rounded-inner` for nested tiles
