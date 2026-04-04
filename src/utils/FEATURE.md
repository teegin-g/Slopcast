# Utils

Pure logic and calculation modules. No React, no side effects, no state.

## Entrypoints

- **`economics.ts`** (727 LOC) — Deterministic economics calculator. Decline curves, cash flows, NPV/IRR/EUR. Read in chunks. Tests in `economics.test.ts`.
- **`cashFlowRollup.ts`** — Aggregates monthly cash flows across wells/groups
- **`overlapDetector.ts`** — Detects well/data overlap for map visualization
- **`debugLogger.ts`** — Structured debug logging (dev only)
- **`localAccount.ts`** — Local storage account helpers
- **`mockDsuLayer.ts`** — Mock DSU data layer for spatial testing

## Tests

- `economics.test.ts` (565 LOC) — Comprehensive economics test suite
- `cashFlowRollup.test.ts`

## Avoid These False Starts

- Everything here must be pure functions — no React imports, no fetch calls
- `economics.ts` is wrapped by `services/economicsEngine.ts` — consumers use the service, not the util directly
