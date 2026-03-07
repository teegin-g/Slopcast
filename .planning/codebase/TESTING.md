# Testing Patterns

**Analysis Date:** 2026-03-06

## Test Framework

**Runner:**
- Vitest 4.x (unit tests)
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in (`expect`, `describe`, `it`)
- `@testing-library/jest-dom` (available, for DOM assertions)
- `@testing-library/react` (available, for component rendering)

**E2E/Visual:**
- Playwright (via `@playwright/test` 1.58.x)
- Custom scripts in `scripts/` (not a standard Playwright config file)

**Run Commands:**
```bash
npm test              # Run all Vitest unit tests (vitest run)
npm run test:watch    # Watch mode (vitest)
npm run typecheck     # Type-check with tsc --noEmit
npm run ui:audit      # Check for forbidden CSS classnames
npm run ui:shots      # Playwright UI baseline screenshots
npm run ui:verify     # Playwright UI flow verification
```

## Test File Organization

**Location:**
- Co-located with source files (test file next to implementation)

**Naming:**
- `*.test.ts` pattern (e.g., `src/utils/economics.test.ts`)
- Playwright specs: `*.spec.ts` (e.g., `playground/scripts/ui-snapshots.spec.ts`)

**Structure:**
```
src/
  utils/
    economics.ts           # Implementation
    economics.test.ts      # Unit tests (co-located)
playground/
  scripts/
    ui-snapshots.spec.ts   # Playwright visual tests
```

**Current test file count:** 1 unit test file (`src/utils/economics.test.ts` -- 457 lines)

## Vitest Configuration

```typescript
// vitest.config.ts
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

- Environment: `jsdom` (for browser API simulation)
- Path alias: `@/` resolves to `src/`
- Include pattern: `src/**/*.test.{ts,tsx}`

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateEconomics, applyTaxLayer } from './economics';
import { DEFAULT_TYPE_CURVE, DEFAULT_CAPEX, /* ... */ } from '../constants';

// Shared test fixtures at module level
const TEST_WELLS: Well[] = MOCK_WELLS.slice(0, 3);
const SINGLE_WELL: Well[] = [MOCK_WELLS[0]];

// Section divider comments for each function under test
// ─── calculateEconomics ────────────────────────────────────────────

describe('calculateEconomics', () => {
  it('returns zeros for empty wells', () => {
    const { flow, metrics } = calculateEconomics(/* ... */);
    expect(flow).toHaveLength(0);
    expect(metrics.totalCapex).toBe(0);
  });

  it('produces positive NPV for a single well with defaults', () => {
    // ...
  });
});
```

**Patterns:**
- Top-level `describe` blocks per exported function
- ASCII divider comments between `describe` blocks
- `it` descriptions are human-readable assertions (e.g., "capex scalar affects totalCapex proportionally")
- No `beforeEach`/`afterEach` -- shared fixtures are module-level constants
- Some `describe` blocks compute shared base results at the block level for reuse

```typescript
describe('applyTaxLayer', () => {
  // Shared computation for all tests in this block
  const baseResult = calculateEconomics(TEST_WELLS, /* ... */);

  it('severance tax reduces after-tax NPV below pre-tax NPV', () => {
    const { metrics } = applyTaxLayer(baseResult.flow, baseResult.metrics, DEFAULT_TAX_ASSUMPTIONS);
    expect(metrics.afterTaxNpv10!).toBeLessThan(metrics.npv10);
  });
});
```

## Test Data Strategy

**Fixtures:**
- Reuse production constants from `src/constants.ts` (`DEFAULT_TYPE_CURVE`, `DEFAULT_CAPEX`, etc.)
- Reuse production types from `src/types.ts` (`DEFAULT_TAX_ASSUMPTIONS`, `TAX_PRESETS`, `DEFAULT_DEBT_ASSUMPTIONS`)
- Small well subsets sliced from `MOCK_WELLS` for speed: `MOCK_WELLS.slice(0, 3)`, `[MOCK_WELLS[0]]`

**Inline overrides:**
```typescript
// Spread default with overrides for specific test scenarios
const { metrics } = calculateEconomics(
  TEST_WELLS,
  DEFAULT_TYPE_CURVE,
  DEFAULT_CAPEX,
  { ...DEFAULT_COMMODITY_PRICING, oilPrice: 90 },  // Override one field
  DEFAULT_OPEX,
  DEFAULT_OWNERSHIP,
);
```

**Location:**
- No dedicated fixtures directory -- test data is defined inline or from constants
- `src/constants.ts` serves as the shared fixture source

## Assertion Patterns

**Exact equality:**
```typescript
expect(flow).toHaveLength(120);
expect(metrics.wellCount).toBe(3);
expect(metrics.totalCapex).toBe(0);
```

**Approximate equality (for floating-point):**
```typescript
expect(doubled.metrics.totalCapex).toBeCloseTo(base.metrics.totalCapex * 2, 0);
expect(risked.riskedEur).toBeCloseTo(baseMetrics.eur * 0.5, 2);
```

**Comparison assertions:**
```typescript
expect(metrics.npv10).toBeGreaterThan(0);
expect(metrics.payoutMonths).toBeLessThanOrEqual(120);
expect(reducedNri.metrics.npv10).toBeLessThan(fullNri.metrics.npv10);
```

**Defined/undefined checks:**
```typescript
expect(metrics.afterTaxNpv10).toBeDefined();
expect(flow[5].severanceTax).toBeDefined();
```

**Reference equality (for pass-through):**
```typescript
expect(flow).toBe(baseResult.flow);    // same reference = no transformation
expect(metrics).toBe(baseResult.metrics);
```

## Mocking

**Framework:** None actively used

**Current approach:**
- Tests call real implementations directly -- no mocking of dependencies
- Economics tests are pure function tests (deterministic input/output)
- No service mocking, API mocking, or component mocking patterns established

**What to mock (when adding tests):**
- Supabase client calls in repository tests
- `localStorage` for persistence hook tests
- `fetch` for Python engine tests
- Auth adapters for protected route tests

**What NOT to mock:**
- Pure calculation functions (`src/utils/economics.ts`) -- test with real inputs
- Type definitions and constants

## Playwright Visual Tests

**Location:** `playground/scripts/ui-snapshots.spec.ts`

**Pattern:**
```typescript
import { test } from '@playwright/test';

const THEMES: ThemeCase[] = [
  { id: 'mario', title: 'Classic' },
  { id: 'slate', title: 'Slate' },
];
const VIEWS: ViewMode[] = ['DESIGN', 'SCENARIOS'];

test.describe('UI baseline screenshots', () => {
  test.describe.configure({ mode: 'serial' });

  for (const theme of THEMES) {
    for (const view of VIEWS) {
      test(`desktop ${theme.id} ${view}`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await setTheme(page, theme);
        await setView(page, view);
        await page.screenshot({ path: `...`, fullPage: true });
      });
    }
  }
});
```

**Screenshot matrix:**
- 2 themes (mario, slate) x 2 views (DESIGN, SCENARIOS) x 2 viewports (desktop 1440x900, mobile 390x844) = 8 screenshots
- Output: `playground/ui_screenshots/before/`
- No automated pixel-diff assertions (manual comparison)

## Coverage

**Requirements:** None enforced

**No coverage configuration detected.** No `--coverage` flag in scripts, no coverage thresholds in config.

## Test Types Present

**Unit Tests:**
- Economics calculation functions only (`src/utils/economics.test.ts`)
- Tests: `calculateEconomics`, `applyTaxLayer`, `applyDebtLayer`, `applyReservesRisk`, `aggregateEconomics`
- 5 describe blocks, ~25 test cases total
- Focus: boundary conditions, proportionality, algebraic relationships

**Visual/Screenshot Tests:**
- Playwright-based screenshot capture (not assertion-based comparison)
- Custom scripts: `scripts/ui-snapshots.mjs`, `scripts/ui-verify-flow.mjs`

**Integration Tests:**
- None present

**Component Tests:**
- None present (despite `@testing-library/react` being installed)

## Common Patterns

**Proportionality Testing:**
```typescript
it('capex scalar affects totalCapex proportionally', () => {
  const base = calculateEconomics(TEST_WELLS, /* ... */, { capex: 1, production: 1 });
  const doubled = calculateEconomics(TEST_WELLS, /* ... */, { capex: 2, production: 1 });
  expect(doubled.metrics.totalCapex).toBeCloseTo(base.metrics.totalCapex * 2, 0);
});
```

**Boundary/Edge Case Testing:**
```typescript
it('returns zeros for empty wells', () => {
  const { flow, metrics } = calculateEconomics([], /* ... */);
  expect(flow).toHaveLength(0);
  expect(metrics.totalCapex).toBe(0);
});

it('undefined category returns metrics unchanged', () => {
  const risked = applyReservesRisk(baseMetrics, undefined);
  expect(risked).toBe(baseMetrics);
});
```

**Comparison Testing (two scenarios):**
```typescript
it('higher oil price increases project NPV', () => {
  const lowDeck = calculateEconomics(TEST_WELLS, /* ... */, { oilPrice: 60 }, /* ... */);
  const highDeck = calculateEconomics(TEST_WELLS, /* ... */, { oilPrice: 90 }, /* ... */);
  expect(highDeck.metrics.npv10).toBeGreaterThan(lowDeck.metrics.npv10);
});
```

## Gaps and Recommendations

**Not tested (high priority):**
- React components (rendering, user interaction) -- `@testing-library/react` is installed but unused
- Custom hooks (`useSlopcastWorkspace`, `useDerivedMetrics`, `useProjectPersistence`)
- Service layer / repository functions (`projectRepository.ts`, `dealRepository.ts`)
- Auth flow (`AuthProvider`, adapter selection)
- Theme system (`ThemeProvider`, CSS variable application)

**Not tested (medium priority):**
- Python engine proxy (`pyEngine` in `economicsEngine.ts`)
- LRU cache behavior in `cachedCalculateEconomics`
- Data transformation (Supabase row mapping snake_case -> camelCase)

---

*Testing analysis: 2026-03-06*
