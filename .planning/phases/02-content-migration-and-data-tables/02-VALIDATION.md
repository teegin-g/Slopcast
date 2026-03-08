---
phase: 2
slug: content-migration-and-data-tables
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + jsdom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run typecheck && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DATA-01 | unit | `npx vitest run src/components/slopcast/WellsTable.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DATA-01 | unit | `npx vitest run src/components/slopcast/WellsTable.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | DATA-02 | unit | `npx vitest run src/components/slopcast/CashFlowTable.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | DATA-02 | unit | `npx vitest run src/components/slopcast/CashFlowTable.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | COMP-03 | unit | `npx vitest run src/components/layout/ViewTransition.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/slopcast/WellsTable.test.tsx` — stubs for DATA-01 (sort, filter, select, resize, map sync)
- [ ] `src/components/slopcast/CashFlowTable.test.tsx` — stubs for DATA-02 (annual rollup, expand, negatives, sort)
- [ ] `src/components/layout/ViewTransition.test.tsx` — stubs for COMP-03 (crossfade on section change)
- [ ] `src/utils/cashFlowRollup.test.ts` — unit test for annual aggregation logic

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Glass design integration (tables match theme) | DATA-01, DATA-02 | Visual verification | Inspect tables in Slate + Mario themes, verify glass panel styling |
| Crossfade feels smooth (150-200ms) | COMP-03 | Perceptual quality | Click sidebar sections, verify crossfade timing feels fast and polished |
| Bidirectional map sync visual feedback | DATA-01 | Visual + interactive | Select wells in table, verify map highlights; click map wells, verify table checks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
