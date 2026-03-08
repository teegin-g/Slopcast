---
phase: 1
slug: styling-foundation-and-app-shell
status: audited
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-06
audited: 2026-03-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom |
| **Config file** | vitest.config.ts (exists) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run typecheck && npm run build` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run typecheck && npm run build && npm run ui:audit`
- **Before `/gsd:verify-work`:** Full suite must be green + visual comparison across Slate, Mario, Synthwave themes
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | STYLE-01 | smoke | `npm run build` | N/A (build check) | ✅ green |
| 01-01-02 | 01 | 1 | STYLE-05 | unit | `npx vitest run src/components/ui/GlassPanel.test.tsx` | ✅ | ✅ green |
| 01-01-03 | 01 | 1 | COMP-01 | unit | `npx vitest run src/components/ui/GlassPanel.test.tsx` | ✅ | ✅ green |
| 01-01-04 | 01 | 1 | COMP-02 | unit | `npx vitest run src/components/ui/GlassCard.test.tsx` | ✅ | ✅ green |
| 01-02-01 | 02 | 1 | NAV-01 | unit | `npx vitest run src/components/layout/Sidebar.test.tsx` | ✅ | ✅ green |
| 01-02-02 | 02 | 1 | NAV-02 | unit | `npx vitest run src/components/layout/Sidebar.test.tsx` | ✅ | ✅ green |
| 01-02-03 | 02 | 1 | NAV-03 | unit | `npx vitest run src/components/layout/Sidebar.test.tsx` | ✅ | ✅ green |
| 01-02-04 | 02 | 1 | NAV-04 | unit | `npx vitest run src/hooks/useSidebarNav.test.ts` | ✅ | ✅ green |
| 01-03-01 | 03 | 2 | STYLE-02 | unit | `npx vitest run src/styles/phase1-tokens.test.ts` | ✅ | ✅ green |
| 01-03-02 | 03 | 2 | STYLE-03 | unit | `npx vitest run src/styles/phase1-tokens.test.ts` | ✅ | ✅ green |
| 01-03-03 | 03 | 2 | STYLE-04 | unit | `npx vitest run src/components/layout/SidebarNav.test.tsx` | ✅ | ✅ green |
| 01-03-04 | 03 | 2 | STYLE-06 | integration | `npx vitest run src/components/layout/AppShell.test.tsx` | ✅ | ✅ green |
| 01-03-05 | 03 | 2 | RESP-01 | integration | `npx vitest run src/components/layout/AppShell.test.tsx` | ✅ | ✅ green |
| 01-03-06 | 03 | 2 | RESP-02 | integration | `npx vitest run src/components/layout/AppShell.test.tsx` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/components/ui/GlassPanel.test.tsx` — STYLE-05, COMP-01
- [x] `src/components/ui/GlassCard.test.tsx` — COMP-02
- [x] `src/components/layout/Sidebar.test.tsx` — NAV-01, NAV-02, NAV-03
- [x] `src/hooks/useSidebarNav.test.ts` — NAV-04
- [x] Test utilities: wrapper with ThemeProvider + BrowserRouter for component tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Spacing tokens visual consistency | STYLE-02 | Visual pixel spacing fine-tuning | Inspect spacing in devtools across Slate, Mario, Synthwave themes |
| Typography hierarchy visual weight | STYLE-03 | Font rendering varies by OS | Check H1-H3, body, caption, label visual weight |
| Canvas backgrounds visible through glass | STYLE-06 | Visual transparency quality | Switch themes, verify animated backgrounds show through panels |

*Note: STYLE-02, STYLE-03, STYLE-06 now also have automated smoke tests verifying token definitions exist. Manual verification covers visual quality.*

---

## Validation Audit 2026-03-08

| Metric | Count |
|--------|-------|
| Gaps found | 6 |
| Resolved | 6 |
| Escalated | 0 |

**New test files created:**
- `src/styles/phase1-tokens.test.ts` — 10 tests (STYLE-02 spacing grid, STYLE-03 typography scale)
- `src/components/layout/SidebarNav.test.tsx` — 8 tests (STYLE-04 hover/focus states)
- `src/components/layout/AppShell.test.tsx` — 9 tests (STYLE-06 z-layering, RESP-01 desktop, RESP-02 mobile)

**Total tests:** 121 (up from 94)

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** passed (2026-03-08)
