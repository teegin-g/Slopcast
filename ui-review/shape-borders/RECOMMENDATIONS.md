# Shape Language & Border Treatments -- Recommendations

## 1. Establish a Three-Tier Radius Scale

The codebase currently has six competing radius values (panel, inner, full, md,
lg, bare `rounded`). Collapse to three tiers that all participate in the theme
token system:

| Tier       | Token                | Tailwind Utility   | Purpose |
|------------|---------------------|--------------------|---------|
| **Panel**  | `--radius-panel`     | `rounded-panel`    | Outer containers: cards, modals, table wrappers, dropdowns |
| **Inner**  | `--radius-inner`     | `rounded-inner`    | Nested elements: buttons, inputs, tiles, toasts, stepper steps |
| **Pill**   | `9999px` (hardcoded) | `rounded-full`     | Tags, badges, chips, dots, progress bars |

**Action:** Remove all usages of `rounded-md`, `rounded-lg`, and bare
`rounded` from component code. Replace every instance with `rounded-inner`.

Affected files:
- `src/components/Controls.tsx:209,215,221` -- Classic CAPEX tiles: `rounded-md` -> `rounded-inner`
- `src/components/TaxControls.tsx:19` -- select: `rounded-lg` -> `rounded-inner`
- `src/components/DebtControls.tsx:17` -- select: `rounded-lg` -> `rounded-inner`
- `src/components/slopcast/DesignEconomicsView.tsx:504` -- reserve select: `rounded-lg` -> `rounded-inner`
- `src/components/slopcast/ProfileSelector.tsx:123,132,146` -- inputs/selects/buttons: `rounded` -> `rounded-inner`

This single change eliminates the most visible inconsistency in the shape
system and ensures every form control follows the theme.

## 2. Per-Theme Radius Recommendations

### Slate: Reduce from 18px to 12px

**Rationale:** Slate's identity is "corporate blue-gray." An 18px panel radius
is softer than Nocturne (14px), which is supposed to be the elegant, refined
theme. A corporate theme should sit between Hyperborea's 12px and Nocturne's
14px -- suggesting precision without severity.

```css
/* src/styles/theme.css :root block */
--radius-panel: 12px;  /* was 18px */
```

Resulting inner: `12 - 6 = 6px`. Clean, professional, distinct from Tropical.

### Synthwave: Set Explicitly to 14px

**Rationale:** Synthwave currently inherits the root default (18px). It
should have its own declaration to (a) decouple it from Slate and (b) sharpen
the retro-tech feel slightly. The neon-grid aesthetic leans more Tron than
vaporwave -- 14px keeps rounding visible but tighter.

```css
/* src/styles/theme.css [data-theme='synthwave'] block */
--radius-panel: 14px;
```

Resulting inner: `14 - 6 = 8px`. Matches the retro-tech personality.

### Tropical: Keep at 22px

No change. 22px is the most thematically coherent radius in the system. The
generous softness reinforces the island/resort mood and differentiates Tropical
from every other theme.

### Nocturne: Keep at 14px

No change. 14px paired with Cormorant Garamond headings creates the right
balance of sophistication and warmth.

### Stormwatch: Keep at 4px

No change. Stormwatch's near-square corners are its strongest identity marker.
The military-operations aesthetic depends on this sharpness.

### Classic: Keep at 8px

No change. The beveled `.sc-panel` system at 8px is well-calibrated for the
retro skeuomorphic look.

### Hyperborea: Keep at 12px

No change. 12px is a clean middle ground that fits the arctic-modern mood.

### Proposed Radius Scale After Changes

```
Stormwatch  [4px]   ████
Classic     [8px]   ████████
Slate       [12px]  ████████████         (was 18)
Hyperborea  [12px]  ████████████
Nocturne    [14px]  ██████████████
Synthwave   [14px]  ██████████████       (was 18, now explicit)
Tropical    [22px]  ██████████████████████
```

This creates a more evenly distributed spectrum with clearer personality
separation. Slate and Hyperborea share a radius, which is acceptable since
they differ strongly in color and typography.

## 3. Unify `--radius-kpi` with `--radius-panel`

Currently `--radius-kpi` is only set for Slate (18px) and Classic (8px). All
other themes inherit the Slate default of 18px -- which means Stormwatch's
`.sc-kpi` blocks would have 18px radius if rendered in Classic mode (the only
mode that uses `.sc-kpi`).

**Option A (Recommended):** Remove `--radius-kpi` entirely and update
`.sc-kpi` to use `--radius-panel`:

```css
/* src/styles/theme.css line 1873 */
.sc-kpi {
  border-radius: var(--radius-panel);  /* was var(--radius-kpi) */
}
.sc-kpi::before {
  border-radius: calc(var(--radius-panel) - 2px);  /* was var(--radius-kpi) */
}
```

Then remove `--radius-kpi` declarations from `:root` (line 167) and
`[data-theme='mario']` (line 645).

**Option B:** Set `--radius-kpi` per-theme. More tokens to maintain with no
clear benefit, since KPI blocks should generally match panel rounding.

## 4. Name the Bevel Offset Constant

The `.sc-panel::before` uses `calc(var(--radius-panel) - 2px)` while the
Tailwind `rounded-inner` uses `calc(var(--radius-panel) - 6px)`. Both are
valid but undocumented.

Add a comment block in `src/app.css` explaining the two offset purposes:

```css
/* Radius offset constants:
   - 6px offset (--radius-inner): child containers nested inside padded panels
   - 2px offset (sc-* ::before): inset bevel highlight 1px inside parent border
*/
--radius-inner: calc(var(--radius-panel) - 6px);
```

No code change needed beyond documentation.

## 5. Shape Hierarchy System Proposal

### The Hierarchy

```
                    rounded-panel
                   /             \
          rounded-inner          rounded-inner
         (buttons, tiles)    (inputs, selects)
                |
          rounded-full
     (chips, badges, dots)
```

Every visual element maps to exactly one of these three tiers. The mapping:

| Element Type | Tier | Examples |
|-------------|------|---------|
| Page-level cards | `rounded-panel` | SectionCard, WellsTable wrapper, ProfileSelector dropdown, modals |
| KPI hero card | `rounded-panel` | KpiGrid NPV hero |
| KPI stat tiles | `rounded-inner` | KpiStripTile, WellsBadge |
| Buttons (all variants) | `rounded-inner` | AnimatedButton, mobile toggle, action buttons |
| Form inputs & selects | `rounded-inner` | Search fields, dropdowns, template buttons |
| Toast notifications | `rounded-inner` | ToastItem |
| Workflow stepper steps | `rounded-inner` | WorkflowStepper tiles |
| Chips & badges | `rounded-full` | FilterChips, "active" badge, status dots |
| Progress bars | `rounded-full` | Sensitivity bars, driver bars |
| Decorative elements | `rounded-full` | AccentDivider, group color dots |

### Enforcement Strategy

1. **Lint rule:** Add a regex pattern to `npm run ui:audit` that flags any
   usage of `rounded-md`, `rounded-lg`, or bare `rounded` in `.tsx` files.
   These are the escape hatches that bypass the theme system.

2. **Tailwind config:** Consider removing `rounded-md` and `rounded-lg` from
   the Tailwind theme if they should never be used. This provides build-time
   enforcement.

3. **Code review convention:** Any PR touching border-radius should reference
   the three-tier system. If a new tier is needed, it should be discussed as a
   design decision, not slipped in via a Tailwind default.

## 6. Toast Border Colors -- Use Theme Tokens

Toast type indicators currently hardcode Tailwind colors:

```typescript
// Toast.tsx:27-32 -- CURRENT
success: 'border-l-2 border-l-green-400',
warning: 'border-l-2 border-l-yellow-400',
error:   'border-l-2 border-l-red-400',
```

Replace with theme tokens:

```typescript
// Toast.tsx -- PROPOSED
success: 'border-l-2 border-l-theme-success',
warning: 'border-l-2 border-l-theme-warning',
error:   'border-l-2 border-l-theme-danger',
```

This ensures toast accents adapt to each theme's color palette (e.g.,
Classic's red is `#DC0000`, Stormwatch's red is `#D86B5B`).

## 7. Consider a `--radius-table` Override

Data tables benefit from tighter corners than ambient panels. Tropical's 22px
radius on a data table wrapper creates visual tension between the soft container
and the hard grid lines inside. Consider:

```css
/* In each theme block, or as a derived token */
--radius-table: min(var(--radius-panel), 12px);
```

This caps table rounding at 12px regardless of theme, preserving data density.
The WellsTable and CashFlowTable wrappers would use `rounded-[var(--radius-table)]`
or a new utility class `rounded-table`.

**Affected components:**
- `src/components/slopcast/WellsTable.tsx:166`
- `src/components/slopcast/CashFlowTable.tsx` (table wrapper)
- `src/components/slopcast/GroupWellsTable.tsx` (if wrapped)

This is a lower-priority refinement that could ship separately.

## 8. Priority Implementation Order

| Priority | Change | Effort | Impact |
|----------|--------|--------|--------|
| **P0** | Replace `rounded-md/lg/rounded` with `rounded-inner` on all inputs/selects | Small | Eliminates most visible inconsistency |
| **P1** | Set `--radius-panel: 12px` for Slate | Trivial | Better personality fit for default theme |
| **P1** | Set `--radius-panel: 14px` explicitly for Synthwave | Trivial | Decouples from Slate, sharpens retro feel |
| **P2** | Unify `--radius-kpi` into `--radius-panel` | Small | Removes a redundant token |
| **P2** | Toast border colors to theme tokens | Trivial | Consistent theming |
| **P3** | Add `--radius-table` cap | Small | Improves data table presentation in soft themes |
| **P3** | Add radius lint rule to `ui:audit` | Medium | Prevents future drift |

## 9. Shape Language Design Rationale (For Future Contributors)

**Why three tiers?** Fewer than three and you cannot distinguish containers
from controls from tags. More than three and the eye loses the pattern.
Three is the minimum set that covers the full component taxonomy.

**Why `panel - 6px` for inner?** With standard padding of 12-16px between a
panel edge and its first child, a 6px radius reduction maintains visual
proportion. The child corner arc ends before the parent corner arc begins,
preventing the "double rounding" effect where nested corners compound into
excessive softness.

**Why per-theme radii?** Border radius is one of the highest-leverage
differentiators between themes. Changing a single CSS variable transforms the
entire interface from clinical (Stormwatch) to resort (Tropical). This is
cheaper and more effective than per-theme component overrides.

**Why cap table radius?** Tabular data has inherent right angles (grid lines,
column headers, cell boundaries). Very round containers around very square
content creates dissonance. Capping at 12px keeps tables feeling contained
without softening the data presentation.
