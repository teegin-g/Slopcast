# Testing Patterns

**Analysis Date:** 2026-03-05

## Test Framework

**Runner:**
- Vitest 4.x (unit tests)
- Playwright 1.58.x (UI screenshots and flow verification)
- Config: `vitest.config.ts` (unit), `playground/scripts/ui-snapshots.spec.ts` (Playwright)

**Assertion Library:**
- Vitest built-in `expect` (compatible with Jest matchers)
- `@testing-library/jest-dom` 6.x (available but not currently used in test files)
- `@testing-library/react` 16.x (available for component testing, not currently used)

**Run Commands:**
```bash
npm test                # Run all Vitest unit tests (vitest run)
npm run test:watch      # Vitest in watch mode (vitest)
npm run ui:audit        # Custom CSS classname lint (scripts/ui-audit.mjs)
npm run ui:shots        # Playwright UI baseline screenshots (scripts/ui-snapshots.mjs)
npm run ui:verify       # Playwright UI flow verification (scripts/ui-verify-flow.mjs)
npm run typecheck       # tsc --noEmit (not tests, but part of validation gate)
```

## Test File Organization

**Location:**
- Unit tests are co-located with source files in `src/`
- Playwright specs live in `playground/scripts/`

**Naming:**
- Unit tests: `{module}.test.ts` (e.g., `src/utils/economics.test.ts`)
- Playwright specs: `{name}.spec.ts` (e.g., `playground/scripts/ui-snapshots.spec.ts`)

**Structure:**
```
src/
  utils/
    economics.ts          # Source
    economics.test.ts     # Co-located unit test
playground/
  scripts/
    ui-snapshots.spec.ts  # Playwright screenshot spec
  ui_screenshots/         # Screenshot output directory
```

## Vitest Configuration

**File:** `vitest.config.ts`

```typescript
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

**Key settings:**
- Environment: `jsdom` (browser-like DOM for React component tests)
- Path alias `@` resolves to `src/` (matches `vite.config.ts`)
- Test discovery: `src/**/*.test.{ts,tsx}`

## Test Structure

**Suite Organization:**
```typescript
// From src/utils/economics.test.ts
import { describe, it, expect } from 'vitest';
import { calculateEconomics, applyTaxLayer, ... } from './economics';
import { DEFAULT_TYPE_CURVE, DEFAULT_CAPEX, ... } from '../constants';
import type { Well, WellGroup, DebtAssumptions } from '../types';

// Small test well sets reused across suites
const TEST_WELLS: Well[] = MOCK_WELLS.slice(0, 3);
const SINGLE_WELL: Well[] = [MOCK_WELLS[0]];

// Section dividers for visual grouping
// ─── calculateEconomics ────────────────────────────────────────────

describe('calculateEconomics', () => {
  it('returns zeros for empty wells', () => {
    const { flow, metrics } = calculateEconomics([], ...defaults);
    expect(flow).toHaveLength(0);
    expect(metrics.totalCapex).toBe(0);
  });

  it('produces positive NPV for a single well with defaults', () => {
    const { flow, metrics } = calculateEconomics(SINGLE_WELL, ...defaults);
    expect(metrics.npv10).toBeGreaterThan(0);
  });
});
```

**Patterns:**
- Group tests by exported function name using `describe()`
- Use visual section dividers (`// ─── functionName ───`) between describe blocks
- Test names describe the behavior: `'capex scalar affects totalCapex proportionally'`
- Each test is self-contained with clear arrange/act/assert

## Test Data

**Shared constants from production code:**
- Tests import `DEFAULT_TYPE_CURVE`, `DEFAULT_CAPEX`, `DEFAULT_COMMODITY_PRICING`, `DEFAULT_OPEX`, `DEFAULT_OWNERSHIP` from `src/constants.ts`
- Tests import `DEFAULT_TAX_ASSUMPTIONS`, `DEFAULT_DEBT_ASSUMPTIONS`, `TAX_PRESETS` from `src/types.ts`
- Tests import `MOCK_WELLS` (40 generated wells) and slice for smaller test sets

**Test-local fixtures:**
```typescript
// Defined at top of test file
const TEST_WELLS: Well[] = MOCK_WELLS.slice(0, 3);
const SINGLE_WELL: Well[] = [MOCK_WELLS[0]];
```

**Inline test data for specific cases:**
```typescript
// Override specific fields using spread
const enabledDebt: DebtAssumptions = {
  ...DEFAULT_DEBT_ASSUMPTIONS,
  enabled: true,
  termLoanAmount: 5_000_000,
};

const zeroTax = {
  severanceTaxPct: 0,
  adValoremTaxPct: 0,
  federalTaxRate: 0,
  depletionAllowancePct: 0,
  stateTaxRate: 0,
};
```

**Pattern:** Reuse `DEFAULT_*` constants as the base, override specific fields with spread syntax for test variants.

## Assertion Patterns

**Exact values:**
```typescript
expect(flow).toHaveLength(120);
expect(metrics.wellCount).toBe(1);
expect(metrics.totalCapex).toBe(0);
```

**Approximate values (floating point):**
```typescript
expect(doubled.metrics.totalCapex).toBeCloseTo(base.metrics.totalCapex * 2, 0);
expect(risked.riskedEur).toBeCloseTo(baseMetrics.eur * 0.5, 2);
```

**Comparison assertions:**
```typescript
expect(metrics.npv10).toBeGreaterThan(0);
expect(metrics.payoutMonths).toBeLessThanOrEqual(120);
expect(highDeck.metrics.npv10).toBeGreaterThan(lowDeck.metrics.npv10);
```

**Reference equality:**
```typescript
expect(flow).toBe(baseResult.flow); // Same reference, not deep equal
expect(metrics).toBe(baseResult.metrics);
```

**Defined/undefined checks:**
```typescript
expect(metrics.afterTaxNpv10).toBeDefined();
expect(flow[5].severanceTax).toBeDefined();
```

## Mocking

**Framework:** None currently used

**What is NOT mocked:**
- Economics calculations are tested with real computation (pure functions)
- Test data uses production constants (`DEFAULT_*` from `src/constants.ts`)
- No network mocks, no Supabase mocks, no localStorage mocks

**Guidance for new tests:**
- `@testing-library/react` 16.x is installed but unused; use it for component tests
- `@testing-library/jest-dom` 6.x is installed for DOM assertions (`.toBeInTheDocument()`, etc.)
- For service tests, mock `src/services/supabaseClient.ts` using `vi.mock()`
- For hook tests, wrap in a test component or use `renderHook` from `@testing-library/react`

## Test Categories

**Unit Tests (Vitest):**
- **Scope:** Pure utility functions in `src/utils/economics.ts`
- **Count:** 20 tests across 5 describe blocks
- **Functions tested:**
  - `calculateEconomics` (9 tests) - core NPV/IRR/EUR/payout calculations
  - `applyTaxLayer` (3 tests) - severance, ad valorem, income tax
  - `applyDebtLayer` (3 tests) - term loan, revolver, DSCR
  - `applyReservesRisk` (5 tests) - PDP/PUD/PROBABLE/POSSIBLE risk factors
  - `aggregateEconomics` (3 tests) - multi-group portfolio aggregation
- **All deterministic:** No async, no side effects, no mocking needed

**UI Screenshot Tests (Playwright):**
- **Scope:** Visual regression baseline for themes and views
- **File:** `playground/scripts/ui-snapshots.spec.ts`
- **Matrix:** 2 themes (mario, slate) x 2 views (DESIGN, SCENARIOS) x 2 viewports (desktop 1440x900, mobile 390x844) = 8 screenshots
- **Serial execution:** `test.describe.configure({ mode: 'serial' })`
- **Output:** PNG files to `playground/ui_screenshots/before/`

**UI Audit (Custom Script):**
- **Scope:** CSS classname lint to prevent style drift
- **File:** `scripts/ui-audit.mjs`
- **Checks:** Forbidden patterns like `rounded-2xl`, `shadow-xl`, `sc-titlebar--brown`, undefined animation classes
- **Runs:** `npm run ui:audit` (exits non-zero on violations)

## Validation Gate

The project has an automated validation gate at `.agents/validation/gate.sh` that runs:
1. `npm run typecheck` - TypeScript compilation
2. `npm run build` - Vite production build
3. `npm test` - Vitest unit tests
4. `npm run ui:audit` - CSS classname lint
5. `npm run ui:shots` - Playwright screenshots (optional)

## Coverage

**Requirements:** None enforced (no coverage thresholds configured)

**View Coverage:**
```bash
npx vitest run --coverage    # Not configured, would need @vitest/coverage-v8
```

**Current state:** No coverage tooling installed or configured. Tests focus on the economics engine only.

## Test Gaps

**Tested:**
- `src/utils/economics.ts` - All 5 exported functions covered with 20 tests

**Not tested (unit):**
- `src/services/projectRepository.ts` - All Supabase CRUD operations
- `src/services/dealRepository.ts` - Deal management operations
- `src/services/economicsEngine.ts` - Engine adapter layer
- `src/hooks/useSlopcastWorkspace.ts` - Main workspace state (862 lines)
- `src/hooks/useDerivedMetrics.ts` - Driver analysis computations
- `src/auth/` - Auth adapters and provider
- `src/theme/` - Theme provider
- All React components in `src/components/`

**Not tested (integration):**
- No API integration tests for Python backend
- No Supabase integration tests
- No auth flow integration tests

## Adding New Tests

**New unit test for a utility function:**
1. Create `src/utils/{module}.test.ts` co-located with the source
2. Import from `vitest`: `import { describe, it, expect } from 'vitest'`
3. Import test data from `src/constants.ts` and `src/types.ts`
4. Use `describe` per function, `it` per behavior
5. Use section dividers between describe blocks

**New component test:**
1. Create `src/components/{component}.test.tsx` co-located with the component
2. Use `@testing-library/react` for rendering: `import { render, screen } from '@testing-library/react'`
3. Wrap in necessary providers (ThemeProvider, AuthProvider, BrowserRouter)
4. Assert with `@testing-library/jest-dom` matchers

**New Playwright test:**
1. Add spec to `playground/scripts/`
2. Use `@playwright/test` imports
3. Follow serial execution pattern for stateful flows
4. Output screenshots to `playground/ui_screenshots/`

---

*Testing analysis: 2026-03-05*
