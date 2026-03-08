---
phase: 3
slug: inline-editing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing) |
| **Config file** | vitest.config.ts (existing) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run && npm run typecheck && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | DATA-03 | unit | `npm test -- --run src/components/inline/InlineEditableValue.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 0 | DATA-04 | unit | `npm test -- --run src/components/slopcast/hooks/useDebouncedRecalc.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 0 | DATA-03 | unit | `npm test -- --run src/components/CapexControls.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | DATA-03 | unit | `npm test -- --run src/components/inline/InlineEditableValue.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | DATA-04 | unit | `npm test -- --run src/components/slopcast/hooks/useDebouncedRecalc.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/inline/InlineEditableValue.test.tsx` — stubs for DATA-03 core interaction (click-to-edit, blur commit, Escape cancel, Enter commit)
- [ ] `src/components/slopcast/hooks/useDebouncedRecalc.test.ts` — stubs for DATA-04 debounce behavior (buffers rapid updates, single recalc)
- [ ] `src/components/CapexControls.test.tsx` — stubs for DATA-03 CAPEX inline CRUD

*Existing infrastructure covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Inline editing visual appearance across themes | DATA-03 | Visual styling correctness requires human review | Run `npm run ui:shots`, check slate + mario themes, verify inputs match glass design system |
| Tab navigation flows naturally between fields | DATA-03 | Tab order depends on DOM layout and visual context | Click first type curve field, Tab through all fields, verify natural progression |
| KPI shimmer animation during recalc | DATA-04 | Animation quality is subjective | Edit a value, observe KPI grid during debounce window |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
