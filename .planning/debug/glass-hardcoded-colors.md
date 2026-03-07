---
status: diagnosed
trigger: "Panel and tile border colors and font colors don't match the theme color tokens"
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — The glass system (GlassPanel, GlassCard) correctly uses theme tokens, but dozens of downstream components bypass the theme system with hardcoded white/black opacity classes in isClassic branches that also leak into non-classic paths, plus inline rgba() style values in charts and maps.
test: Grepped all components for hardcoded color patterns
expecting: Theme token usage throughout
next_action: Return diagnosis

## Symptoms

expected: Border and font colors should adapt per-theme using --surface-1, --surface-2, --border, --cyan tokens
actual: All themes look the same because components use hardcoded white/black/slate opacity values
errors: N/A — visual regression, not runtime error
reproduction: Switch between themes — panels and text colors barely change
started: Introduced during 01-03 styling pass

## Eliminated

- hypothesis: glass.css uses hardcoded rgba() for content panels
  evidence: glass.css only defines sidebar tokens (--glass-sidebar-*). Comment at top confirms "Content panels use theme tokens directly." File is clean.
  timestamp: 2026-03-07

- hypothesis: GlassPanel.tsx or GlassCard.tsx use hardcoded colors
  evidence: Both components correctly use bg-theme-surface1/60, border-theme-border/30, bg-theme-surface2/50, etc. These are properly theme-aware.
  timestamp: 2026-03-07

## Evidence

- timestamp: 2026-03-07
  checked: glass.css
  found: Only 3 sidebar-scoped tokens per theme (--glass-sidebar-bg, blur, border). Content panels excluded by design. File is correct.
  implication: The glass token system itself is NOT the problem.

- timestamp: 2026-03-07
  checked: GlassPanel.tsx, GlassCard.tsx
  found: Both use Tailwind theme token classes (bg-theme-surface1/60, border-theme-border/30, bg-theme-surface2/50). Correctly theme-aware.
  implication: The wrapper components are NOT the problem.

- timestamp: 2026-03-07
  checked: All slopcast components for hardcoded color patterns
  found: 139 occurrences of text-white/, bg-white/, border-white/ across 27 files. 97 occurrences of text-black/, bg-black/, border-black/ across 24 files. These appear in BOTH isClassic and non-classic code paths.
  implication: Components INSIDE GlassPanel/GlassCard use hardcoded colors that override the theme system.

- timestamp: 2026-03-07
  checked: Inline style rgba() values
  found: MiniMapPreview.tsx uses hardcoded rgba() for grid lines and fills. WaterfallChart.tsx hardcodes chart colors (#3b82f6, #E566DA). ReservesPanel.tsx hardcodes category colors. GroupComparisonStrip.tsx hardcodes #ef4444.
  implication: Charts and specialized components bypass the theme entirely via inline styles.

- timestamp: 2026-03-07
  checked: theme.css shadow/gradient tokens
  found: Shadow and gradient values in theme.css use hardcoded rgba() per theme block — but these ARE properly per-theme (different values per data-theme block), so they are correctly themed despite being rgba().
  implication: theme.css itself is fine — the rgba() there is intentional per-theme customization.

## Resolution

root_cause: The GlassPanel/GlassCard wrapper components correctly use theme tokens, but the 27+ child components rendered inside them use hardcoded Tailwind color classes (text-white/, border-white/, bg-black/, border-black/) and inline rgba() style values instead of theme-aware classes (text-theme-text, border-theme-border, text-theme-muted, text-theme-cyan). This makes all themes visually identical inside the panels.
fix: N/A (diagnosis only)
verification: N/A
files_changed: []
