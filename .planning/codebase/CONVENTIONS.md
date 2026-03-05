# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**
- Components: PascalCase (`DesignEconomicsView.tsx`, `SectionCard.tsx`, `KpiGrid.tsx`)
- Hooks: `use*` prefix, camelCase (`useSlopcastWorkspace.ts`, `useDerivedMetrics.ts`, `useProjectPersistence.ts`)
- Services: camelCase, repository pattern (`projectRepository.ts`, `dealRepository.ts`, `economicsEngine.ts`)
- Utilities: camelCase (`economics.ts`, `debugLogger.ts`, `overlapDetector.ts`)
- Test files: `*.test.ts` co-located with source (`src/utils/economics.test.ts`)
- Constants: camelCase file (`constants.ts`, `constants/templates.ts`)

**Functions:**
- Use camelCase: `calculateEconomics`, `applyTaxLayer`, `aggregateEconomics`
- Hooks return objects or tuples: `useDerivedMetrics` returns `{ keyDriverInsights, breakevenOilPrice, isComputing }`
- Private helpers: camelCase, plain functions at module scope (`clamp01`, `csvCell`, `buildEconCacheKey`)
- Adapter factories: `createAdapter()` pattern in `src/auth/AuthProvider.tsx`

**Variables:**
- camelCase for locals and state: `baseNpv`, `processedGroups`, `aggregateWellCount`
- UPPER_SNAKE_CASE for module-level constants: `MOCK_WELLS`, `DEFAULT_TYPE_CURVE`, `DEFAULT_CAPEX`, `ECON_CACHE_MAX`
- Storage keys: string constants with `slopcast-` prefix: `'slopcast-theme'`, `'slopcast-auth-session'`, `'slopcast-design-workspace'`

**Types:**
- All shared interfaces in `src/types.ts`, PascalCase: `Well`, `WellGroup`, `Scenario`, `DealMetrics`, `MonthlyCashFlow`
- Component-local types defined at top of file: `type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP'`
- Union types for string enums: `type DealStatus = 'draft' | 'active' | 'closed' | 'archived'`
- Props interfaces: `{ComponentName}Props` pattern (`DesignEconomicsViewProps`, `SectionCardProps`)
- Exported type aliases use `export type` (not `export interface` for unions)

**Component Types:**
- Use `React.FC` for components: `const App: React.FC = () => {`
- Use `React.FC<Props>` for typed components: `const SectionCard: React.FC<SectionCardProps> = ({...}) => {`

## Code Style

**Formatting:**
- No Prettier or ESLint config detected; formatting is convention-based
- 2-space indentation in TypeScript/TSX files
- Single quotes for strings
- Trailing commas in multi-line arrays and objects
- Semicolons required

**Linting:**
- No ESLint, Biome, or Prettier configuration files present
- TypeScript strict-ish mode via `tsconfig.json` (no explicit `strict: true` but `isolatedModules`, `noEmit`)
- Style drift prevention: custom `npm run ui:audit` script (`scripts/ui-audit.mjs`) checks for forbidden CSS classnames

**CSS Approach:**
- Tailwind-style utility classes: `rounded-panel`, `shadow-card`, `bg-theme-surface1/70`, `border-theme-border`
- Theme-aware CSS custom properties defined in `src/styles/theme.css`
- Classic vs. modern theme branching via `isClassic` prop throughout components
- Use `rounded-panel` for outer card containers, `rounded-inner` for nested tiles
- Use `shadow-card` for primary cards (not `shadow-xl`)
- Use `sc-titlebar--neutral` (not `sc-titlebar--brown`) for panel titlebars
- Use `theme-transition` class for smooth theme switching

## Import Organization

**Order:**
1. React and React ecosystem (`react`, `react-dom`, `react-router-dom`)
2. External libraries (none heavily used beyond React ecosystem)
3. Internal absolute imports using `@/` alias or relative paths
4. Type-only imports using `import type { ... }` syntax

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)
- Most imports use relative paths in practice; `@/` alias available but not universally used

**Examples from `src/hooks/useSlopcastWorkspace.ts`:**
```typescript
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_CAPEX, DEFAULT_COMMODITY_PRICING, ... } from '../constants';
import { Scenario, ScheduleParams, Well, WellGroup, ... } from '../types';
import { DesignWorkspace } from '../components/slopcast/DesignWorkspaceTabs';
import { useViewportLayout } from '../components/slopcast/hooks/useViewportLayout';
import { useAuth } from '../auth/AuthProvider';
import type { ParsedFilters } from '../components/slopcast/LandingPage';
```

## Error Handling

**Patterns:**
- Services throw on failure: `if (error) throw error;` after Supabase calls (`src/services/projectRepository.ts`)
- Auth uses try/catch with null fallback: `readStoredSession()` returns `null` on parse failure (`src/auth/provider.ts`)
- localStorage reads wrapped in try/catch with silent fallback: `try { ... } catch { /* no-op */ }` (`src/hooks/useSlopcastWorkspace.ts`)
- Non-critical operations use `console.warn`: `console.warn('Failed to log audit action:', error.message)` (`src/services/projectRepository.ts`)
- Python engine fetch wrapper throws descriptive errors: `throw new Error('Python engine error (${res.status}): ${text}')` (`src/services/economicsEngine.ts`)

**Strategy:**
- Use `throw` for unrecoverable errors in services (propagate to caller)
- Use silent catch for localStorage/UI state reads (degrade gracefully)
- Use `console.warn` for non-critical side effects (audit logging)
- Never swallow errors from Supabase data operations

## Logging

**Framework:** `console` (browser native)

**Patterns:**
- `console.warn` for non-critical failures in services
- Custom debug logger at `src/utils/debugLogger.ts` (likely behind dev flag)
- Vite debug logger plugin: `vite-plugin-debug-logger` registered in `vite.config.ts`
- No structured logging framework (no winston, pino, etc.)

## Comments

**When to Comment:**
- Section dividers using box-drawing characters: `// ─── calculateEconomics ────────────────────`
- JSDoc `/** */` for significant helper functions explaining conversion logic: `/** Convert full TS-side assumptions into the flatter PricingAssumptions shape */`
- Inline comments for domain-specific clarifications: `// 65% initial decline`, `// $/bbl deduction`
- `// no-op` for intentionally empty catch blocks

**JSDoc/TSDoc:**
- Used sparingly, primarily on service/engine functions
- Not used on component props (interfaces serve as documentation)
- Not used on hooks

## Function Design

**Size:**
- Pure utility functions are short and focused: `clamp01`, `buildEconCacheKey`, `csvCell`
- Hooks can be large: `useSlopcastWorkspace.ts` is 862 lines (contains all workspace state and logic)
- Components are split between pure view (`SlopcastPage.tsx` ~230 lines) and logic hooks

**Parameters:**
- Domain functions accept individual typed params, not option objects: `calculateEconomics(wells, typeCurve, capex, pricing, opex, ownership, scalars?, scheduleOverride?)`
- Component props use dedicated interfaces with clear naming
- Optional params are last and use `?` syntax

**Return Values:**
- Economics functions return `{ flow, metrics }` objects
- Hooks return named objects: `{ keyDriverInsights, breakevenOilPrice, isComputing }`
- Services return domain-typed records: `Promise<ProjectRecord[]>`, `Promise<LoadedProjectBundle>`

## Module Design

**Exports:**
- Components use `export default` for the primary component
- Services use named exports for all functions: `export async function listProjects()`
- Types centralized in `src/types.ts` with named exports
- Constants use named exports: `export const MOCK_WELLS`, `export const DEFAULT_TYPE_CURVE`
- Hooks use named exports: `export const useDerivedMetrics = (...)`

**Barrel Files:**
- Not used; imports reference specific files directly

## Adapter Pattern

The codebase uses a consistent adapter pattern for swappable implementations:

**Auth Adapter** (`src/auth/provider.ts`):
- Interface `AuthAdapter` with `initialize`, `signIn`, `signOut`, `getSession`
- Implementations: `DevBypassAdapter` (`src/auth/adapters/devBypassAdapter.ts`), `SupabaseAdapter` (`src/auth/adapters/supabaseAdapter.ts`)
- Selection via env var: `import.meta.env.VITE_AUTH_PROVIDER`

**Economics Engine** (`src/services/economicsEngine.ts`):
- Interface `EconomicsEngine` with `calculateEconomics`, `aggregateEconomics`, `generateSensitivityMatrix`
- Implementations: `tsEngine` (browser), `pyEngine` (FastAPI backend)
- Selection via localStorage: `getStoredEngineId()`

## Provider Hierarchy

Providers wrap the app in this order (outermost first) in `src/index.tsx`:
1. `React.StrictMode`
2. `ThemeProvider` (`src/theme/ThemeProvider.tsx`)
3. `BrowserRouter`
4. `AuthProvider` (`src/auth/AuthProvider.tsx`)
5. `App` (routes)
6. `DebugProvider` (dev-only, lazy-loaded)

## Supabase Data Mapping

Repository functions manually map between snake_case DB columns and camelCase TS types:
```typescript
// Pattern from src/services/projectRepository.ts
return (data || []).map((row: any) => ({
  id: row.id,
  ownerUserId: row.owner_user_id,
  name: row.name,
  uiState: (row.ui_state || {}) as ProjectUiState,
  createdAt: row.created_at,
}));
```
- DB rows typed as `any` (no generated Supabase types used inline)
- Each field mapped individually with fallback defaults where needed

## Lazy Loading

Pages are lazy-loaded in `src/App.tsx`:
```typescript
const SlopcastPage = lazy(() => import('./pages/SlopcastPage'));
```
- All route-level pages use `React.lazy()` with `Suspense` wrapper
- Fallback is a simple spinner component defined inline

---

*Convention analysis: 2026-03-05*
