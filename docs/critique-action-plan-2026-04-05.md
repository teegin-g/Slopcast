# Critique Action Plan — 2026-04-05

Prioritized fixes from the [design critique](critique-2026-04-05.md). Each item maps to a specific command and scope.

---

## Phase 1: Theme Consistency (P0 — fixes the systemic root cause)

### 1. `/normalize` — Unify panel style system

**Scope:** SectionCard + all 14 files with hardcoded `backdrop-blur-*`

**What to do:**
1. **SectionCard.tsx** — Remove `sectionStyleMap`. Import `overlayPanelClass` from `themes.ts`. Change default `panelStyle` from `'glass'` to `useTheme().theme.features.panelStyle`. This single change fixes every economics panel, scenario card, and KPI display.

2. **PageHeader.tsx** — Replace `backdrop-blur-md border-b shadow-sm bg-theme-surface1/80` with a `panelStyle`-aware branch or a new `headerPanelClass()` utility.

3. **Remaining 12 files** — Search-and-replace all `backdrop-blur-sm` and `backdrop-blur-md` occurrences with the correct `overlayPanelClass` call or SectionCard wrapper.

**Files to touch:**
```
src/components/slopcast/SectionCard.tsx        ← core fix
src/components/slopcast/PageHeader.tsx          ← header fix
src/components/slopcast/DesignWellsView.tsx     ← 4 occurrences
src/components/slopcast/AcreageSearchBar.tsx    ← 3 occurrences
src/components/MapVisualizer.tsx                ← 3 occurrences
src/components/slopcast/DesignEconomicsView.tsx ← 1 occurrence
src/components/slopcast/MapCommandCenter.tsx    ← 1 occurrence
src/pages/HubPage.tsx                          ← 1 occurrence
src/components/Controls.tsx                    ← 1 occurrence
src/components/slopcast/Toast.tsx               ← 1 occurrence
src/components/slopcast/AiAssistant.tsx         ← 1 occurrence
src/components/slopcast/ProjectSharePanel.tsx   ← 1 occurrence
src/components/slopcast/KeyboardShortcutsHelp.tsx ← 1 occurrence
src/components/slopcast/ProfileSelector.tsx     ← 1 occurrence
src/pages/IntegrationsPage.tsx                 ← 1 occurrence
```

**Verification:** Switch to Stormwatch (solid) — no blur should be visible on any panel. Switch to Synthwave (outline) — panels should be transparent with visible border, no frosted glass.

**Estimated impact:** Immediately differentiates 4 themes that currently look like glass-with-different-colors.

---

## Phase 2: Structural Extraction (P1–P2)

### 2. `/extract` — Shared header component

**Scope:** PageHeader.tsx + HubPage.tsx

**What to do:** Extract a shared `AppHeader` wrapper that both pages compose. The header should:
- Accept navigation content as children/slots
- Consume `panelStyle` from theme (fixed in Phase 1)
- Provide consistent spacing, border, and sticky behavior

### 3. `/extract` — Mobile tab bar component

**Scope:** DesignWellsView.tsx + DesignEconomicsView.tsx

**What to do:** Extract the duplicated mobile tab bar pattern into a `MobileTabBar` component:
```tsx
<MobileTabBar
  tabs={[{ key: 'SETUP', label: 'Setup' }, { key: 'RESULTS', label: 'Results' }]}
  activeTab={mobilePanel}
  onTabChange={onSetMobilePanel}
/>
```
This component should consume `panelStyle` from the theme system.

---

## Phase 3: Semantic Color Cleanup (P2)

### 4. `/colorize` — Replace hardcoded colors with theme tokens

**Scope:** 20+ hardcoded color instances across 8+ files

**What to do:**
1. Ensure `--danger`, `--success`, `--warning` CSS custom properties exist per theme in `theme.css`
2. Replace all `text-red-400` → `text-theme-danger`
3. Replace all `bg-emerald-500/*` / `text-green-400` → `text-theme-success` or `bg-theme-positive`
4. Special attention to `CashFlowTable.tsx:35`, `EconomicsGroupBar.tsx:417`, `GroupList.tsx:152`

### 5. `/normalize` — Migrate `glass.css` into `theme.css`

**Scope:** `src/styles/glass.css`

**What to do:** Move sidebar glass tokens from raw `rgba()` values into `[data-theme]` blocks in `theme.css` as CSS custom properties. Delete `glass.css` and its import.

---

## Phase 4: Visual Hierarchy (P2)

### 6. `/arrange` — Economics KPI hierarchy

**Scope:** Economics results display

**What to do:**
- NPV10 → hero metric (larger, accent-colored, top position)
- IRR, EUR → primary metrics (prominent but smaller)
- Secondary metrics (payout, gas EUR, etc.) → supporting row with reduced weight

### 7. `/typeset` — Establish metric size ramp

**Scope:** KPI displays, section headers, data labels

**What to do:** Define a clear typographic hierarchy for data:
- Hero metric: 28px+ bold, accent color
- Primary metric: 20px semibold
- Secondary metric: 14px regular, muted
- Label: 10px uppercase tracking-wide

---

## Phase 5: Polish (P3 + minor)

### 8. `/polish` — Final quality pass

**What to do:**
- Remove dead ternary in `MapCommandCenter.tsx:805` (both branches identical)
- Fix logo fallback in `PageHeader.tsx` to use React state instead of DOM manipulation
- Replace `border-white/5` in `PageHeader.tsx:85` with `border-theme-border`
- Assess `AppShell.tsx` — integrate or remove
- Verify all edge states (empty economics, loading, errors) have designed states

---

## Execution Order

```
Phase 1 (P0) ──→ Phase 2 (P1) ──→ Phase 3 (P2) ──→ Phase 4 (P2) ──→ Phase 5 (P3)
  /normalize       /extract          /colorize         /arrange         /polish
  ~15 files        ~4 files          /normalize        /typeset         cleanup
                                     ~10 files         ~3 files         ~5 files
```

Phase 1 is the force multiplier — it fixes the systemic root cause and makes every subsequent phase easier.

---

## Verification Checklist

After each phase, verify:

- [ ] `npm run typecheck` passes
- [ ] `npm run ui:audit` passes (no forbidden classnames)
- [ ] Stormwatch panels are solid (no blur)
- [ ] Synthwave panels are outlined (no blur, visible border)
- [ ] Slate panels are solid with border
- [ ] Tropical/Hyperborea panels have frosted glass
- [ ] Classic panels use `sc-panel` (unchanged)
- [ ] Mobile views match desktop theme behavior
- [ ] Economics KPIs render correctly across all themes

---

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `/critique` after fixes to see your score improve.
