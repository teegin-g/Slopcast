# Shape Language & Border Treatments -- Technical Audit

## 1. Complete Inventory of Border-Radius Values

### Token-Driven Values (Theme System)

| Token              | Default (Slate) | Synthwave | Tropical | Nocturne | Stormwatch | Classic | Hyperborea |
|--------------------|-----------------|-----------|----------|----------|------------|---------|------------|
| `--radius-panel`   | 18px            | 18px*     | 22px     | 14px     | 4px        | 8px     | 12px       |
| `--radius-kpi`     | 18px            | 18px*     | 18px*    | 18px*    | 18px*      | 8px     | 18px*      |
| `--radius-inner`   | 12px            | 12px*     | 16px     | 8px      | 0px**      | 2px     | 6px        |

\* Inherited from `:root` default; not explicitly set in theme block.
\** Clamped: `calc(4px - 6px)` yields `-2px`, browser floors to `0`.

**Source files:**
- `--radius-panel` declarations: `src/styles/theme.css:166, 274, 331, 419, 644, 702`
- `--radius-kpi` declarations: `src/styles/theme.css:167, 645` (only Slate and Classic set it)
- `--radius-inner` derivation: `src/app.css:39` -- `calc(var(--radius-panel) - 6px)`

### Tailwind Utility Classes (Non-Token)

| Utility          | Computed Value | Occurrences | Where Used |
|------------------|---------------|-------------|------------|
| `rounded-panel`  | `var(--radius-panel)` | ~80+ | SectionCard, KpiGrid, WellsTable, Controls, WorkflowStepper, DesignEconomicsView, ProfileSelector, HubPage, AuthPage, etc. |
| `rounded-inner`  | `calc(--radius-panel - 6px)` | ~100+ | AnimatedButton, KpiStripTile, Toast, WorkflowStepper steps, inputs, template buttons, etc. |
| `rounded-full`   | 9999px | ~35 | FilterChips, status dots, progress bars, badges, theme picker pills, AccentDivider, range inputs |
| `rounded-md`     | 6px | ~8 | Classic-mode CAPEX tiles (Controls.tsx:209,215,221), HubPage buttons, NotFoundPage, reserve select (Classic) |
| `rounded-lg`     | 8px | ~6 | TaxControls select, DebtControls select, DesignEconomicsView reserve select |
| `rounded`        | 4px | ~5 | ProfileSelector save input/select/button (ProfileSelector.tsx:123,132,146) |

### Raw CSS `border-radius` (theme.css)

| Value                                | Line     | Element |
|--------------------------------------|----------|---------|
| `var(--radius-panel)`                | 1753     | `.sc-panel` |
| `calc(var(--radius-panel) - 2px)`    | 1764     | `.sc-panel::before` (inset bevel) |
| `var(--radius-panel)`                | 1779     | `.sc-screen` |
| `calc(var(--radius-panel) - 2px)`    | 1790     | `.sc-screen::before` (inset bevel) |
| `var(--radius-kpi)`                  | 1873     | `.sc-kpi` |
| `calc(var(--radius-kpi) - 2px)`      | 1886     | `.sc-kpi::before` (inset bevel) |
| `9999px`                             | 1679     | `.sc-embossBtn` |
| `9999px`                             | 1691     | `.sc-linkBtn` |
| `9999px`                             | 2062     | `.sc-rangeNavy` |
| `4px`                                | 2398     | `::-webkit-scrollbar-thumb` |

## 2. Radius-to-Theme Map (Visual Reference)

```
Stormwatch  [4px]   ████  (sharp, military)
Classic     [8px]   ████████  (modest, retro)
Hyperborea  [12px]  ████████████  (clean, modern)
Nocturne    [14px]  ██████████████  (elegant, restrained)
Slate       [18px]  ██████████████████  (soft -- too soft for corporate?)
Synthwave   [18px]  ██████████████████  (same as Slate -- no differentiation)
Tropical    [22px]  ██████████████████████  (generous, resort)
```

## 3. Inconsistencies Between Similar Components

### 3a. Form Inputs -- Three Different Radii

| Component | File:Line | Radius Class | Computed |
|-----------|-----------|-------------|----------|
| WellsTable search | WellsTable.tsx:174 | `rounded-inner` | theme-driven |
| WellsTable selects | WellsTable.tsx:179,189 | `rounded-inner` | theme-driven |
| ProfileSelector text input | ProfileSelector.tsx:123 | `rounded` | 4px fixed |
| ProfileSelector select | ProfileSelector.tsx:132 | `rounded` | 4px fixed |
| ProfileSelector save button | ProfileSelector.tsx:146 | `rounded` | 4px fixed |
| TaxControls input | TaxControls.tsx:19 | `rounded-lg` | 8px fixed |
| DebtControls input | DebtControls.tsx:17 | `rounded-lg` | 8px fixed |
| Reserve category select | DesignEconomicsView.tsx:504 | `rounded-lg` | 8px fixed |
| Controls template button | Controls.tsx:127 | `rounded-inner` | theme-driven |

**Verdict:** Form inputs should all use `rounded-inner`. The `rounded`,
`rounded-md`, and `rounded-lg` usages are inconsistencies that bypass theming.

### 3b. Classic-Mode CAPEX Tiles vs Themed Tiles

| Context | Classic Radius | Themed Radius |
|---------|---------------|---------------|
| CAPEX snapshot tiles | `rounded-md` (6px) -- Controls.tsx:209 | `rounded-inner` (theme-driven) |
| KPI strip tiles | N/A (Classic uses `.sc-kpi`) | `rounded-inner` -- KpiGrid.tsx:162 |

Classic CAPEX tiles use `rounded-md` while the `.sc-panel` system uses
`--radius-panel: 8px`. The tiles should match at `calc(8px - 6px) = 2px` if
following the inner convention, or use `rounded-md` consistently. Currently
`rounded-md` (6px) is *larger* than the derived inner (2px).

### 3c. `--radius-kpi` vs `--radius-panel`

`--radius-kpi` is declared only for Slate (18px) and Classic (8px). All other
themes inherit the Slate default of 18px. This means:

- **Stormwatch panels**: 4px corners
- **Stormwatch KPIs** (Classic mode): 18px corners

If Stormwatch were ever rendered in Classic mode, its KPI blocks would have
18px radius inside 4px panels. This is a latent inconsistency. `--radius-kpi`
should either be set per-theme or derived from `--radius-panel`.

## 4. Nested Radius Math Check

### The Two Subtraction Constants

The codebase uses two different "inner offset" values:

1. **Tailwind utility** (`src/app.css:39`): `--radius-inner = panel - 6px`
2. **CSS pseudo-elements** (`theme.css:1764,1790,1886`): `panel - 2px`

The 2px offset is for the `.sc-panel::before` bevel highlight (a 1px-inset
pseudo-element), so it needs only a tiny radius reduction. The 6px offset is
for genuinely nested child containers that sit inside panel padding.

**Assessment:** Both are defensible for their use cases, but having two magic
numbers is a maintenance risk. Consider defining `--radius-bevel: calc(var(--radius-panel) - 2px)` explicitly.

### Edge Cases by Theme

| Theme      | Panel | Inner (panel-6) | Bevel (panel-2) | Notes |
|------------|-------|-----------------|-----------------|-------|
| Stormwatch | 4px   | 0px (clamped)   | 2px             | Inner elements have NO rounding. Bevel pseudo still rounds. Acceptable visual. |
| Classic    | 8px   | 2px             | 6px             | Inner rounding barely visible. `rounded-md` (6px) in CAPEX tiles exceeds this. |
| Hyperborea | 12px  | 6px             | 10px            | Clean ratio. Inner is exactly half of panel. |
| Nocturne   | 14px  | 8px             | 12px            | Good ratio. Inner tiles feel deliberately nested. |
| Slate      | 18px  | 12px            | 16px            | Both are generously round. Works for the theme. |
| Synthwave  | 18px  | 12px            | 16px            | Identical to Slate. |
| Tropical   | 22px  | 16px            | 20px            | Very round everywhere. Consistent with island aesthetic. |

## 5. Border-Width and Border-Color Patterns

### Border Widths Found

| Width | Usage | Examples |
|-------|-------|---------|
| `border` (1px default) | Standard panel/card borders | SectionCard:50, KpiGrid:162, WellsTable:166, Toast:54 |
| `border-2` (2px) | Classic-mode buttons, accent left edges | DesignEconomicsView:331,347, KpiGrid:63-66, Toast:28-31 |
| `border-l-2` (2px left) | KPI tile accents, toast type indicators, sidebar nav active state | KpiGrid.tsx:63-66, Toast.tsx:28-31, SidebarNav.tsx:61-62 |
| `border-t-2` (2px top) | ReservesPanel total row | ReservesPanel.tsx:148 |
| `border-dashed` + `border-2` | Empty state drop zones | SensitivityMatrix.tsx:81 |

### Border Color Vocabulary

| Pattern | Usage Count | Examples |
|---------|------------|---------|
| `border-theme-border` | Very high (~150+) | Standard panel/card borders throughout |
| `border-theme-border/60` | ~20 | Inner dividers (SectionCard titlebar, WorkflowStepper) |
| `border-theme-border/40` | ~10 | FilterChips, subtle separators |
| `border-theme-border/30` | ~5 | Faint internal dividers |
| `border-theme-border/20` | ~5 | ProfileSelector list item borders |
| `border-theme-cyan` | ~15 | Active/focused states, primary accents |
| `border-theme-cyan/30` | ~5 | AnimatedButton primary variant |
| `border-theme-cyan/20` | ~5 | Badges, subtle accents |
| `border-theme-magenta` | ~5 | Active step, Classic-mode button borders |
| `border-theme-lavender` | ~3 | Driver panel accent |
| `border-black/20-30` | ~30 | Classic-mode border fallbacks |
| `border-white/10-20` | ~15 | Classic-mode dividers and accents |
| `border-l-green-400` | 1 | Toast success indicator |
| `border-l-yellow-400` | 1 | Toast warning indicator |
| `border-l-red-400` | 1 | Toast error indicator |
| `border-red-500/20-30` | ~3 | AnimatedButton danger, error states |

### Observations on Border Color

1. **Opacity gradient pattern:** `border-theme-border` at full opacity for
   outer containers, with `/60`, `/40`, `/30` for progressively subtler inner
   dividers. This is a good implicit hierarchy.

2. **Toast type colors bypass theme system:** Toast uses hardcoded Tailwind
   colors (`green-400`, `yellow-400`, `red-400`) instead of theme tokens.
   These colors will not adapt across themes. (Toast.tsx:28-31)

3. **Classic mode uses `border-black/*` extensively** while themed mode uses
   `border-theme-border`. This is expected given the `isClassic` branching
   pattern but means Classic never benefits from the semantic border tokens.

## 6. Accent Border Treatment (Left-Edge Accent Pattern)

A distinct design pattern appears in KPI tiles and toasts: a 2px left border
in an accent color provides a visual "tag" or category indicator.

**KPI tiles** (KpiGrid.tsx:62-67):
```
cyan:     border-l-2 border-l-theme-cyan
magenta:  border-l-2 border-l-theme-magenta
lavender: border-l-2 border-l-theme-lavender
muted:    border-l-2 border-l-theme-muted/40
```

**Toast notifications** (Toast.tsx:27-32):
```
success:  border-l-2 border-l-green-400
info:     border-l-2 border-l-theme-cyan
warning:  border-l-2 border-l-yellow-400
error:    border-l-2 border-l-red-400
```

**Sidebar nav** (SidebarNav.tsx:61-62):
```
active:   border-l-2 border-theme-cyan (or border-theme-warning in Classic)
inactive: border-l-2 border-transparent
```

This is a consistent pattern -- left-edge accents for categorical
differentiation. The inconsistency is that KPI tiles use theme tokens while
toasts use hardcoded Tailwind colors.

## 7. Summary of All Issues

| # | Issue | Severity | Files |
|---|-------|----------|-------|
| 1 | Form inputs use 3 different radius classes | Medium | ProfileSelector.tsx:123,132; TaxControls.tsx:19; DebtControls.tsx:17; DesignEconomicsView.tsx:504 |
| 2 | `--radius-kpi` not set per-theme (5 of 7 themes inherit Slate default) | Low | theme.css:167,645 |
| 3 | Synthwave has no explicit `--radius-panel`, same as Slate (18px) | Low | theme.css (missing from synthwave block) |
| 4 | Classic CAPEX tiles use `rounded-md` instead of `rounded-inner` | Low | Controls.tsx:209,215,221 |
| 5 | Toast border colors bypass theme tokens | Low | Toast.tsx:28-31 |
| 6 | Two different inner-offset constants (6px and 2px) without naming | Info | app.css:39; theme.css:1764 |
| 7 | Stormwatch inner radius clamps to 0px (negative math) | Info | Computed from app.css:39 |
