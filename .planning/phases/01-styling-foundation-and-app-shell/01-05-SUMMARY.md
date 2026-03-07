---
phase: 01-styling-foundation-and-app-shell
plan: 05
subsystem: ui
tags: [tailwind, theming, css-tokens, react]

requires:
  - phase: 01-03
    provides: "Theme CSS custom properties and Tailwind token classes (text-theme-text, border-theme-border, bg-theme-surface)"
provides:
  - "14 highest-impact slopcast components use theme-token classes exclusively in non-classic code paths"
  - "Shared-path hardcoded white/black Tailwind classes eliminated"
affects: [01-styling-foundation-and-app-shell]

tech-stack:
  added: []
  patterns: ["isClassic ternary isolation -- classic branches retain deliberate white/black classes for retro styling"]

key-files:
  created: []
  modified:
    - src/components/slopcast/EconomicsGroupBar.tsx
    - src/components/slopcast/DesignWellsView.tsx

key-decisions:
  - "Prior work (01-03) already converted ~157 of ~160 hardcoded colors to theme tokens; only 3 shared-path occurrences remained"
  - "Preserved all isClassic branch hardcoded colors intentionally -- Mario/classic theme uses white/black for solid retro styling"

patterns-established:
  - "Shared-path audit pattern: grep for hardcoded white/black, verify each match is inside isClassic true-branch"

requirements-completed: [STYLE-02, STYLE-03, STYLE-04]

duration: 2min
completed: 2026-03-07
---

# Phase 01 Plan 05: Hardcoded Colors to Theme Tokens Summary

**Replaced 3 remaining shared-path hardcoded white/black Tailwind classes with theme-token equivalents across 14 slopcast components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T23:50:18Z
- **Completed:** 2026-03-07T23:52:42Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Audited all 14 highest-impact slopcast components for hardcoded white/black Tailwind classes
- Replaced 2 `border-white/20` occurrences in EconomicsGroupBar (group color dot borders)
- Replaced `bg-black/10` + `border-white/5` in DesignWellsView map header (non-classic path)
- Confirmed ~156 remaining hardcoded occurrences are all correctly inside isClassic true-branches
- Build, typecheck, and all 50 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hardcoded colors in Economics/Driver components (7 files)** - `8793383` (feat)
2. **Task 2: Replace hardcoded colors in remaining 7 high-impact files** - `83fcc79` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/components/slopcast/EconomicsGroupBar.tsx` - Replaced 2 shared-path border-white/20 with border-theme-border/30
- `src/components/slopcast/DesignWellsView.tsx` - Replaced bg-black/10 + border-white/5 with theme tokens in non-classic map header

## Decisions Made
- Prior plan 01-03 already did the bulk of theme-token conversion; this plan closed the gap by finding and fixing the 3 remaining shared-path hardcoded classes
- All ~156 remaining white/black references are intentionally inside isClassic branches for Mario/classic retro styling

## Deviations from Plan

None - plan executed exactly as written. The plan anticipated ~160 replacements across 14 files, but the prior 01-03 work had already converted most of them. The remaining 3 shared-path occurrences were found and fixed.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 14 highest-impact components now respond to theme switching with appropriate text, border, and background colors
- isClassic/Mario branches preserved unchanged
- Ready for any remaining style work or Phase 2

---
*Phase: 01-styling-foundation-and-app-shell*
*Completed: 2026-03-07*
