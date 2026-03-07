---
phase: 1
slug: styling-foundation-and-app-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
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
| **Estimated runtime** | ~15 seconds |

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
| 01-01-01 | 01 | 1 | STYLE-01 | smoke | `npm run build` | N/A (build check) | ⬜ pending |
| 01-01-02 | 01 | 1 | STYLE-05 | unit | `npx vitest run src/components/ui/GlassPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | COMP-01 | unit | `npx vitest run src/components/ui/GlassPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | COMP-02 | unit | `npx vitest run src/components/ui/GlassCard.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | NAV-01 | unit | `npx vitest run src/components/layout/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | NAV-02 | unit | `npx vitest run src/components/layout/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | NAV-03 | unit | `npx vitest run src/components/layout/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | NAV-04 | unit | `npx vitest run src/hooks/useSidebarNav.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | STYLE-02 | manual | Visual inspection | N/A | ⬜ pending |
| 01-03-02 | 03 | 2 | STYLE-03 | manual | Visual inspection | N/A | ⬜ pending |
| 01-03-03 | 03 | 2 | STYLE-04 | manual | `npm run ui:verify` | Playwright exists | ⬜ pending |
| 01-03-04 | 03 | 2 | STYLE-06 | manual | `npm run ui:shots` | Playwright exists | ⬜ pending |
| 01-03-05 | 03 | 2 | RESP-01 | integration | `npm run ui:shots` | Playwright exists | ⬜ pending |
| 01-03-06 | 03 | 2 | RESP-02 | integration | `npm run ui:shots` | Playwright exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ui/GlassPanel.test.tsx` — stubs for STYLE-05, COMP-01
- [ ] `src/components/ui/GlassCard.test.tsx` — stubs for COMP-02
- [ ] `src/components/layout/Sidebar.test.tsx` — stubs for NAV-01, NAV-02, NAV-03
- [ ] `src/hooks/useSidebarNav.test.ts` — stubs for NAV-04
- [ ] Test utilities: wrapper with ThemeProvider + BrowserRouter for component tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Spacing tokens visual consistency | STYLE-02 | Visual pixel spacing across components | Inspect spacing in devtools across Slate, Mario, Synthwave themes |
| Typography hierarchy renders correctly | STYLE-03 | Visual weight/size comparison | Check H1-H3, body, caption, label across components |
| Hover/focus-visible states | STYLE-04 | Interaction state needs manual trigger | Tab through sidebar items, buttons, inputs; verify focus rings |
| Canvas backgrounds visible through glass | STYLE-06 | Visual transparency assessment | Switch themes, verify animated backgrounds show through panels |
| Desktop sidebar + content layout | RESP-01 | Layout viewport assessment | Resize browser, verify sidebar + content at ≥1024px |
| Mobile drawer layout | RESP-02 | Mobile interaction pattern | Resize to <768px, verify drawer open/close and navigation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
