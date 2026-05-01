# Slopcast — Project Conventions

## What is Slopcast?

Oil & gas economics modeling app. React + Vite frontend, Python FastAPI backend.
Users build well groups, assign type curves / CAPEX / OPEX / ownership, and run economics to evaluate deals.

## Project Structure

```
src/
  App.tsx              # Router / route definitions
  index.tsx            # React root (providers: Theme → BrowserRouter → Auth)
  types/               # Domain type modules; import through src/types/index.ts barrel
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
| `npm run storybook` | Start Storybook at localhost:6006 |
| `npm run storybook:build` | Build the Storybook static bundle |
| `npm run storybook:test` | Run Storybook story tests via Vitest |
| `npm run ui:components` | Run Storybook build + story tests |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run ui:audit` | Check for forbidden CSS classnames / style drift |
| `npm run ui:shots` | Playwright UI snapshots |
| `npm run ui:verify` | Playwright E2E flow verification |

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
- **Types:** Domain modules live in `src/types/*`; `src/types/index.ts` is the public barrel
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
- **Component tests:** Storybook (`npm run storybook:test`) — colocated stories under `src/components/**/*.stories.tsx`
- **UI tests:** Playwright (`npm run ui:shots`, `npm run ui:verify`) with shared specs under `e2e/`
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

**IMPORTANT (Claude Code):** The supervisor must run as the main interactive session (not as a sub-agent). It spawns implementers using the `Agent` tool with `isolation: "worktree"`. Sub-agents cannot prompt for permission — all commands they need must be pre-allowed in `.claude/settings.local.json`.

### Key files
- `.agents/system.md` — Architecture overview
- `.agents/roles/supervisor.md` — Supervisor: decomposes, coordinates, merges
- `.agents/roles/implementer.md` — Implementer: builds in worktrees, follows TDD
- `.agents/roles/validator.md` — Validator: runs gate, reports pass/fail
- `.agents/workflows/feature-pipeline.md` — Full end-to-end pipeline
- `.agents/validation/gate.sh` — Automated validation gate (typecheck → build → test → storybook → audit → screenshots → E2E)

### Rules
- Implementers MUST verify they're in a worktree before writing code
- Task briefs MUST include testable acceptance criteria
- Implementers follow TDD: write failing tests first, then implement
- All activity is logged to `.agents/state/activity.jsonl`

## Design Context

### Users
O&G professionals (A&D analysts, reservoir engineers, deal teams) evaluating acquisitions and development economics. Client-facing SaaS product — users compare across operators, formations, and pricing scenarios to make capital allocation decisions worth millions. They expect a tool that matches the gravity of the decisions but doesn't feel like a punishment to use.

### Brand Personality
**Bold, cinematic, opinionated.** Slopcast has its own visual identity — it doesn't reference or defer to other products. The theme system isn't a gimmick; it's a first-class feature that signals craft and care. Every theme should feel like a deliberate creative choice, not a skin swap.

### Emotional Goals
- **Impressed & engaged**: "This is way cooler than it needs to be." Users should notice the visual craft and feel like they're using something special.
- **Energized & ambitious**: Deal-making should feel exciting. War-room energy — the interface should make users want to run another scenario, not dread it.

### Aesthetic Direction
- **Dark-mode native**: All themes are dark-first. Light mode exists for Slate only.
- **Atmospheric, not decorative**: Animated backgrounds, glass panels, ambient glow — these create mood, not noise. Every visual layer earns its place.
- **Per-theme structural differentiation**: Themes differ in typography (heading fonts), border radius, panel opacity (glass/solid/outline), and spacing density — not just color swaps.
- **Anti-references**: No generic SaaS minimalism (Stripe/Linear flat gray). No Bloomberg terminal density. Slopcast is cinematic where those are clinical.

### Design Principles

1. **Atmosphere is architecture.** Backgrounds, overlays, and glass effects aren't decoration — they're structural elements that define each theme's identity. Treat them with the same rigor as layout code.

2. **Earn every pixel.** No ornament without purpose. Glow effects guide attention. Panel opacity creates depth hierarchy. Border radius communicates personality. If a visual element doesn't serve information hierarchy or emotional tone, remove it.

3. **Theme-native, not theme-aware.** Components shouldn't "know about" themes via conditionals — they should consume CSS custom properties and ThemeFeatures so each theme naturally expresses itself. The `isClassic` branch is the only hard fork.

4. **Data has gravity.** NPV, IRR, EUR, payout — these are the stars. Typography, spacing, and color should create a clear visual hierarchy that pulls the eye to the numbers that matter. Metrics should feel weighty and confident.

5. **Opinionated defaults, no dead states.** Every view should look intentional even with zero user data. Empty states, loading states, and defaults should feel designed, not forgotten. The app should always look like it's ready for a screenshot.

### Design Tokens Reference
- **Spacing scale** (compact density): 4px micro, 8px inner, 12px standard, 16px section, 24px area, 32px page, 48px hero
- **Radii**: `--radius-panel` (18px default, varies per theme 4–22px), `--radius-inner` (panel - 6px)
- **Surfaces**: `--bg-deep` (page), `--bg-space` (ambient), `--surface-1` (panels), `--surface-2` (cards/tiles)
- **Accent colors**: `--cyan` (primary), `--magenta` (secondary), `--lav` (tertiary)
- **Typography**: `--font-sans` (Inter body), `--font-heading` (per-theme headings), `--font-brand` (per-theme display), `--font-script` (Permanent Marker accents)
- **Panel styles**: `glass` (60% opacity), `solid` (100% opacity), `outline` (20% opacity) — driven by `ThemeFeatures.panelStyle`

## UI Audit Workflow

When making visual/layout/style changes:
1. Start app (`npm run dev`), keep running at localhost:3000
2. Capture before/after screenshots (desktop + mobile)
3. Check both WELLS and ECONOMICS tabs, at least two themes (slate + mario)
4. Run `npm run ui:audit` to catch style drift
5. Use `rounded-panel` for outer cards, `rounded-inner` for nested tiles
