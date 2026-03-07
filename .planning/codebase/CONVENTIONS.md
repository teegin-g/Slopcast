# Coding Conventions

**Analysis Date:** 2026-03-06

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `src/components/slopcast/DesignEconomicsView.tsx`, `src/components/slopcast/KpiGrid.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `src/hooks/useDerivedMetrics.ts`, `src/components/slopcast/hooks/useProjectPersistence.ts`)
- Services: camelCase with descriptive suffix (e.g., `src/services/projectRepository.ts`, `src/services/economicsEngine.ts`)
- Utils: camelCase (e.g., `src/utils/economics.ts`, `src/utils/debugLogger.ts`)
- Pages: PascalCase with `Page` suffix (e.g., `src/pages/SlopcastPage.tsx`, `src/pages/HubPage.tsx`)

**Functions:**
- Use camelCase for all functions and methods
- Prefix hooks with `use` (e.g., `useDerivedMetrics`, `useAuth`, `useTheme`)
- Prefix boolean helpers with `is`/`has` (e.g., `isUuid`, `hasSupabaseEnv`)
- Repository functions use verb-first naming: `listProjects`, `getProject`, `saveProject`, `deleteComment`

**Variables:**
- camelCase for local variables and parameters
- UPPER_SNAKE_CASE for module-level constants (e.g., `MOCK_WELLS`, `DEFAULT_TYPE_CURVE`, `ENGINE_STORAGE_KEY`)
- Storage keys use kebab-case strings: `'slopcast-theme'`, `'slopcast-design-workspace'`

**Types:**
- All shared TypeScript interfaces live in `src/types.ts`
- Interfaces use PascalCase (e.g., `WellGroup`, `DealMetrics`, `MonthlyCashFlow`)
- Type aliases use PascalCase (e.g., `CapexCategory`, `DealStatus`, `ReserveCategory`)
- Union literal types use UPPER_SNAKE_CASE values (e.g., `'PRODUCING' | 'DUC' | 'PERMIT'`)
- Component-local types are defined at the top of the component file (e.g., `type ControlsSection = 'TYPE_CURVE' | 'CAPEX' | 'OPEX' | 'OWNERSHIP'`)

## Code Style

**Formatting:**
- No ESLint or Prettier config files detected -- formatting is not enforced by tooling
- 2-space indentation observed throughout
- Single quotes for strings
- Trailing commas in multi-line parameter lists and arrays
- Semicolons used consistently

**Linting:**
- No ESLint or Biome config present
- TypeScript strict checking via `tsc --noEmit` (`npm run typecheck`)
- Custom UI audit script at `scripts/ui-audit.mjs` enforces CSS class conventions:
  - Forbidden: `rounded-2xl`, `rounded-xl` (use `rounded-panel` instead)
  - Forbidden: `shadow-xl` (use `shadow-card` instead)
  - Forbidden: `sc-titlebar--brown` (use `sc-titlebar--neutral`)
  - Forbidden: `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-left-6`

## Import Organization

**Order:**
1. React and React ecosystem (`react`, `react-dom`, `react-router-dom`)
2. External libraries (no consistent separation observed)
3. Internal absolute imports using `@/` alias or relative paths
4. Type-only imports use `import type { ... }` syntax

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)
- In practice, most imports use relative paths (`../types`, `./economics`)
- The `@/` alias is available but not heavily used in existing code

## Error Handling

**Patterns:**
- Services throw errors directly: `if (error) throw error;` after Supabase calls
- Auth initialization catches errors and falls back to unauthenticated state
- localStorage reads are wrapped in try/catch with silent fallback to defaults
- The `requireSupabase()` / `requireUserId()` guard pattern ensures auth before data access in `src/services/projectRepository.ts`
- Non-critical failures log warnings: `console.warn('Failed to log audit action:', error.message)`
- Python engine HTTP errors throw with status context: `throw new Error(\`Python engine error (\${res.status}): \${text}\`)`

**Error handling pattern for services:**
```typescript
// Guard pattern used in all repository functions
function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
}

// Every repository function starts with:
export async function listProjects(): Promise<ProjectRecord[]> {
  await requireUserId();
  const supabase = requireSupabase();
  const { data, error } = await supabase.from('projects').select('...');
  if (error) throw error;
  return (data || []).map(/* transform */);
}
```

**Error handling pattern for localStorage:**
```typescript
function readStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && THEMES.some(t => t.id === raw)) return raw as ThemeId;
  } catch { /* SSR / incognito – fall through */ }
  return DEFAULT_THEME;
}
```

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- `console.warn` for recoverable failures (e.g., audit log write failures)
- A custom `src/utils/debugLogger.ts` utility exists for development debugging
- A Vite plugin `vite-plugin-debug-logger.ts` provides build-time debug tooling
- A `DebugProvider` component is conditionally loaded in dev mode only (`import.meta.env.DEV`)

## Comments

**When to Comment:**
- Section dividers use ASCII box-drawing comments: `// ─── Section Name ──────────────────`
- Dashed line separators for major sections in service files: `// ---------------------------------------------------------------------------`
- JSDoc-style `/** ... */` comments used sparingly for non-obvious functions
- Inline comments explain business logic decisions (e.g., `// Sort well IDs for stable keys`)

**JSDoc/TSDoc:**
- Used occasionally for adapter functions: `/** Python TypeCurveParams doesn't carry gorMcfPerBbl yet. */`
- Not required or consistently applied

## Function Design

**Size:**
- Utility functions are typically short (5-30 lines)
- Hook functions can be large (100-200+ lines) -- `useSlopcastWorkspace` and `useDerivedMetrics` are substantial
- Component files range from 50 to 700+ lines

**Parameters:**
- Economics functions accept many positional parameters (8+ in `calculateEconomics`)
- Component props use destructured interface objects
- Optional parameters use `?` syntax or default values

**Return Values:**
- Economics functions return `{ flow, metrics }` objects
- Hooks return named objects: `{ keyDriverInsights, breakevenOilPrice, isComputing }`
- Repository functions return typed interfaces or `void`

## Module Design

**Exports:**
- Components use `export default` (one component per file)
- Services use named exports for all public functions
- Types use named exports exclusively from `src/types.ts`
- Constants use named `export const`
- Hooks that are co-located with components are named exports

**Barrel Files:**
- No barrel files (`index.ts`) are used -- all imports reference specific files

## Component Patterns

**Theme Branching:**
- Components accept `isClassic: boolean` prop to branch between "Classic" (Mario) and modern (Slate) theme styles
- Pattern: ternary in `className` for conditional class application

```typescript
// Standard theme branching pattern
<div className={
  isClassic
    ? 'sc-panel theme-transition overflow-hidden'
    : 'rounded-panel border shadow-card theme-transition bg-theme-surface1/70 border-theme-border'
}>
```

**CSS Custom Properties:**
- All theme colors are CSS custom properties defined in `src/styles/theme.css`
- Colors stored as space-separated R G B channels for Tailwind opacity modifier compatibility
- Tailwind classes reference theme tokens: `bg-theme-surface1`, `text-theme-cyan`, `border-theme-border`

**Context + Hook Pattern:**
- Contexts are created with `createContext<T | null>(null)`
- Corresponding `useX()` hook throws if used outside provider
- Example: `useAuth()`, `useTheme()`

```typescript
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
```

**Provider Nesting Order (in `src/index.tsx`):**
1. `React.StrictMode`
2. `ThemeProvider`
3. `BrowserRouter`
4. `AuthProvider`

## Adapter Pattern

**Auth Adapter (`src/auth/`):**
- Interface defined in `src/auth/provider.ts` (`AuthAdapter`)
- Two implementations: `DevBypassAdapter` (local dev) and `SupabaseAdapter` (prod)
- Selected at runtime via `VITE_AUTH_PROVIDER` env var

**Economics Engine Adapter (`src/services/economicsEngine.ts`):**
- Interface `EconomicsEngine` with `id`, `label`, and async calculation methods
- Two implementations: `tsEngine` (browser-side) and `pyEngine` (FastAPI backend)
- Engine selection persisted in localStorage

## Data Transformation

**Supabase Row Mapping:**
- All Supabase responses are mapped from snake_case DB columns to camelCase TypeScript interfaces
- Rows typed as `any` during mapping: `(data || []).map((row: any) => ({ ... }))`
- Null safety: `(data || [])` pattern used consistently

---

*Convention analysis: 2026-03-06*
