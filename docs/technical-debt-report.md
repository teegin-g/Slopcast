# Technical Debt & Context Bloat Report

**Date:** 2026-04-26
**Branch:** `cursor/permian-theme-economics-modules`

---

## Executive Summary

The app source is **233 files / 44K lines**. The AI/agent infrastructure surrounding it is **495 files / 110K lines** — 2.5x the codebase it governs. Inside the app itself, a 983-line god-hook and a 2,842-line CSS monolith dominate the architecture. Below is the full breakdown, prioritized by impact.

---

## 1. The God-Hook: `useSlopcastWorkspace.ts` (983 lines)

**The single most dangerous file.** It owns all domain state, all UI state, all computed economics, all readiness derivations, keyboard shortcuts, CSV/PDF export, and workflow routing. It returns ~90 named values and imports from 20 modules spanning 6 architectural layers.

- 13 `useState`, 9 `useEffect`, 12+ `useMemo`, 15+ `useCallback`
- Its import list includes leaf UI component types (`DesignWorkspace`, `EconomicsModule`, `WellsMobilePanel`) — the central hook depends on leaf components, inverting the dependency hierarchy
- Every change to economics, UI state, or workflow routing touches this one file

**Why it matters:** This is the single point of failure for the whole app. It cannot be tested in isolation, cannot be reasoned about locally, and blocks parallel development.

---

## 2. Diverged Dual Type Systems

Two parallel type trees are in active use simultaneously:

| Path | Importers | Status |
|------|-----------|--------|
| `src/types.ts` (monolith, 774 lines) | 37 files | Original, still growing |
| `src/types/index.ts` (modular) | 102 files | Incomplete migration |

**Key interfaces have drifted between the two:**

- `Well` in the monolith has `trajectory?: WellTrajectory` — the modular copy does not
- `Scenario` in the monolith has `loeScalar?` and `includedWorkflows?` — the modular copy does not
- `ProjectUiState` has 11 fields in the monolith vs. 6 in the modular version with different filter types (`string | string[]` vs `string`)

24 types exist only in the monolith and were never migrated. TypeScript cannot catch the divergence at serialization boundaries (Supabase, localStorage, API).

**Duplicated shapes within `types.ts`:**

- `{ npv10, totalCapex, eur, payoutMonths, wellCount }` is anonymous and copy-pasted 5 times
- `Scenario`, `ProjectScenarioRecord`, and `DealScenarioRecord` share 8-9 identical core fields with no shared base
- 4 runtime constants (`DEFAULT_RESERVE_RISK_FACTORS`, `TAX_PRESETS`, `DEFAULT_TAX_ASSUMPTIONS`, `DEFAULT_DEBT_ASSUMPTIONS`) live in a types file

---

## 3. AI/Agent Infrastructure Bloat

| Directory | Files | Lines |
|-----------|-------|-------|
| `.agents/` | 235 | 55,689 |
| `.claude/` | 208 | 53,807 |
| `.codex/` | 52 | 3,825 |
| `.omx/` | 22 | 1,299 |
| **Total AI infra** | **517** | **113,620** |
| **App source (`src/`)** | **233** | **43,945** |

Specific waste:

- **Skills triplicated** across `.agents/skills/`, `.claude/skills/`, `.codex/skills/` — 52 folders each, already diverged (18+ files differ). Not symlinked
- **25 Databricks-specific skills** (48% of all skills) for Spark, MLflow, Delta Lake, vector search, etc. — this project has zero Databricks usage. Bulk-installed, never curated
- **75 `Zone.Identifier` files** — Windows filesystem metadata artifacts committed to repo
- `.agents/state/validations/` shows only 8 runs total across 2 days — the system was used briefly and abandoned
- Two parallel agent coordination systems (`.agents/` worktree pipeline + `.omx/` real-time telemetry)
- 6 AI/agent-specific meta-directories at root: `.agents`, `.claude`, `.codex`, `.omx`, `.ai-dev-kit`, `.planning`

---

## 4. `theme.css` Monolith (2,842 lines)

- **453 CSS custom property definitions**, 187 `[data-theme=...]` selector blocks
- **~800 lines of atmospheric rule duplication**: `.theme-atmo-*` classes are fully redefined per theme with near-identical gradient structures differing only in color values
- **420 `rgba()` literals** inside variable declarations — violating the file's own documented convention of space-separated RGB channels
- `.sc-*` component classes (`.sc-panel`, `.sc-kpi`, `.sc-btnPrimary`) live inside the theme file rather than their own stylesheet, coupling theme and component code
- Only 1 `!important` (acceptable — reduced-motion override)

**Theme system mid-migration:** 6 of 8 themes define colors only in `chartPalette`/`mapPalette` (old format). 2 themes have adopted the new `tokens` block. Both code paths must be maintained.

---

## 5. `isClassic` Dual-Render Pattern (227 occurrences)

Every component that supports the Mario "classic" theme renders parallel JSX trees via ternary operators:

```tsx
<h3 className={isClassic ? 'text-sm font-black text-white' : 'text-sm font-semibold text-theme-text'}>
```

Worst files by occurrence count:

| File | Count |
|------|-------|
| `EconomicsDriversPanel.tsx` | 28 |
| `Controls.tsx` | 27 |
| `EconomicsGroupBar.tsx` | 26 |
| `LandingPage.tsx` | 25 |
| `OverlayToolbar.tsx` | 24 |
| `MapCommandCenter.tsx` | 23 |
| `ScenarioDashboard.tsx` | 43 (entire card layouts duplicated) |

No `cn()` / `clsx()` utility is used anywhere in the project. All conditional classes are hand-rolled template literals with no protection against generating `"undefined"` in class strings.

---

## 6. Prop Drilling Chains

The filter state drilling chain passes 10+ identical props through 3 layers:

```
useSlopcastWorkspace
  -> DesignWellsView (34 props)
    -> MapCommandCenter (37 props)
      -> OverlayFiltersBar (17 props)
```

Largest Props interfaces:

| Props Count | Interface | File |
|-------------|-----------|------|
| 37 | `MapCommandCenterProps` | `MapCommandCenter.tsx` |
| 34 | `DesignWellsViewProps` | `DesignWellsView.tsx` |
| 29 | `OperationsConsoleProps` | `OperationsConsole.tsx` |
| 24 | `DesignEconomicsViewProps` | `DesignEconomicsView.tsx` |
| 20 | `PdpUniverseSurfaceProps` | `PdpWorkflowSurfaces.tsx` |

`MapCommandCenter` alone has **37 props**, 11 `useState`, 10 `useEffect`, and duplicate layer-add code (cluster/well layer setup copy-pasted inside a satellite-toggle effect).

---

## 7. Economics Engine Leakage

The `economicsEngine` adapter pattern exists but is bypassed in 3 places:

| File | Bypass |
|------|--------|
| `ScenarioDashboard.tsx` | Imports `calculateEconomics` directly, runs it in a `useMemo` |
| `economics/derived.ts` | Imports `applyTaxLayer` directly, re-runs tax calculations |
| `useDerivedMetrics.ts` | Imports `cachedCalculateEconomics` independently |

### Magic numbers in business logic

- `monthlyDiscountRate = 0.10 / 12` declared **3 separate times** in `economics.ts` (L313, L418, L477)
- `monthsToProject = 120` declared **twice** (L243, L573)
- `irr: 0` stub returned in **4 places** — a key financial metric is always wrong with no indicator surfaced to callers
- `30.4` (days-per-month) used 4 times with no named constant
- `0.65` IRS depletion cap hardcoded at L433

### Business rules scattered in components

- `24_000` per-well LOE estimate in `ScenarioDashboard.tsx` L129
- `/ 36` ramp-to-peak assumption in `ScenarioDashboard.tsx` L131
- `/ 120` NPV distribution in `ScenarioDashboard.tsx` L132
- Hardcoded fallback pricing in `economicsEngine.ts` Python path (L145) duplicates `DEFAULT_COMMODITY_PRICING` instead of importing it
- `clamp01` redeclared in `OwnershipControls.tsx` (identical to the one in `economics.ts`)

---

## 8. Animated Background Components (~4,500 lines)

6 background components with no shared abstraction:

| Component | Lines |
|-----------|-------|
| `HyperboreaBackground.tsx` | 1,045 |
| `TropicalBackground.tsx` | 978 |
| `StormDuskBackground.tsx` | 770 |
| `SynthwaveBackground.tsx` | ~500 |
| `MoonlightBackground.tsx` | ~500 |
| `MarioOverworldBackground.tsx` | ~500 |

Any change to how backgrounds integrate with layout (vignette, z-index, pointer-events) must be made 6 times. All use hardcoded hex palette constants (116 hex codes in `SynthwaveBackground` alone) since canvas elements can't consume CSS variables — but there is no shared palette extraction pattern.

---

## 9. Dead/Duplicate Code

- **`MapVisualizer.tsx` (574 lines)** — parallel implementation of `MapCommandCenter`'s map feature set. Both manage well selection tools, Mapbox initialization, satellite toggle, and heatmap layers
- **`requireSupabase()`, `makeUuid()`, `normalizeRole()`, `unwrapContract()`** — copy-pasted across 3 service files (`dealRepository.ts`, `projectRepository.ts`, `profileRepository.ts`) with no shared module
- **Mapbox `as any` escape hatch** — `(mapboxgl as any).default` duplicated verbatim in `MapVisualizer.tsx` and `useMapboxMap.ts` (3 identical lines each)
- **CAPEX item arrays** (9 items each) duplicated 4 times in `templates.ts` — only dollar amounts differ across `WOLFCAMP_A_CAPEX`, `BONE_SPRING_CAPEX`, `DELAWARE_AVG_CAPEX`, `CONSERVATIVE_CAPEX`
- **`sc-panel` + `sc-panelTitlebar` + `sc-insetDark` triad** inlined in 16 component files with no shared `<ClassicPanel>` primitive
- **`text-[9px] font-black uppercase tracking-...` label pattern** appears 85 times with no shared `<SectionLabel>` component

---

## 10. Hardcoded Colors Bypassing Theme System

**344 hardcoded hex codes** in component/page files. **279 additional `rgb()`/`rgba()` literals.**

Worst offenders:

| File | Hex count | Notes |
|------|-----------|-------|
| `SynthwaveBackground.tsx` | 116 | Canvas — partially justified |
| `permian/variants.ts` | 64 | UI data — should use token refs |
| `TropicalBackground.tsx` | 29 | Mix of palette constants and hardcoded |
| `MoonlightBackground.tsx` | 24 | Same pattern |
| `CapexControls.tsx` | 6 | `CATEGORY_COLORS` map with hex fallback |
| `ScenarioDashboard.tsx` | 1 | `'#DBA1DD'` is `--lav` hardcoded |

---

## 11. Git Hygiene

- **189 git-tracked PNGs** in `output/` from Playwright runs
- **`IMG_1156.JPG`** (485 KB) and **`Sun.jpeg`** (210 KB) — photos committed to root
- **`production.json`** (932 KB, 54K lines) — generated data its own `.gitignore` says to exclude
- **`tropical-background-v2.html`** (949 lines), **`test_background.cjs`** (562 lines), **`Untitled.ipynb`** — scratch files at root
- `artifacts/` is **358 MB** on disk, `output/` is **138 MB**
- `typescript` in `dependencies` instead of `devDependencies`
- `@google/genai` in prod deps with `GEMINI_API_KEY` injected into the client bundle via `vite.config.ts` — API key baked into frontend build output

---

## 12. Hook Complexity Beyond the God-Hook

| Hook | Lines | Issue |
|------|-------|-------|
| `useProjectPersistence.ts` | 434 | Takes 16 params — 11 are `Dispatch<SetStateAction<...>>` setters passed from parent. Inversion of control: hook reaches up to set parent state |
| `useViewportData.ts` | 312 | Reasonable — legitimate abstraction |

---

## 13. Dependency Concerns

**33 total packages (18 prod + 15 dev)**

Potentially problematic:
- `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` + `three` + `postprocessing` — 5 packages for 3D/WebGL in a data dashboard
- `d3` present alongside `recharts` (which bundles its own D3) — D3 loaded twice
- `canvas` — Node.js native module, unusual in Vite frontend
- `express` as production dep for a Vite SPA (minimal `server.js` at root)
- `typescript` in `dependencies` instead of `devDependencies`
- `@tailwindcss/vite` and `tailwindcss` both listed separately (Tailwind v4 may only need the Vite plugin)

---

## Priority Matrix

| # | Issue | Risk | Effort | Notes |
|---|-------|------|--------|-------|
| 1 | Dual type systems diverging | **Critical** — data corruption at boundaries | Medium | Reconcile + delete monolith |
| 2 | God-hook `useSlopcastWorkspace` | **Critical** — blocks all parallel dev | High | Split into 4-5 domain hooks |
| 3 | AI infra 2.5x app code | **High** — context pollution, stale copies | Low | Delete Databricks skills, symlink copies |
| 4 | Economics bypass / magic numbers | **High** — silent calculation errors | Low | Centralize constants, route through adapter |
| 5 | `isClassic` 227x duplication | **High** — every component change is 2x work | Medium | Extract themed primitives |
| 6 | `theme.css` 2,842-line monolith | **Medium** — atmospheric rules unmaintainable | Medium | Extract `.sc-*` classes, templatize atmo rules |
| 7 | 37-prop drilling chains | **Medium** — refactoring paralysis | Medium | Filter context provider |
| 8 | Git-tracked screenshots/photos | **Medium** — repo bloat | Low | `git rm`, update `.gitignore` |
| 9 | Background component duplication | **Medium** — 6x maintenance per layout change | Medium | Shared base component |
| 10 | `MapVisualizer` dead parallel impl | **Low** — confusion about which is canonical | Low | Evaluate and remove |
| 11 | Service layer duplication | **Low** — copy-paste helpers across 3 repos | Low | Extract `supabaseHelpers.ts` |
| 12 | Hardcoded colors in components | **Low** — theme drift | Low | Replace with token references |
