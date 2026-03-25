# 01 — Diagnosis: Current State Audit

## Summary

Slopcast is a 29,400-line React+Vite application with solid architecture and lean dependencies — but **zero automated guardrails**. The codebase quality is decent; the governance is absent. This gap is the root cause of increasing friction when adding features.

---

## Scorecard

| Area | Status | Severity |
|------|--------|----------|
| ESLint | Not installed | **Critical** |
| Prettier | Not installed | **Critical** |
| Dead code detection | None | **Critical** |
| Complexity limits | None | **Critical** |
| Component test coverage | ~0% (only economics tested) | **Critical** |
| God hook (`useSlopcastWorkspace`) | 862 lines, 25 useState, 9 useEffect | **Critical** |
| Background components | 4,039 lines across 6 files | **High** |
| `theme.css` monolith | 2,454 lines, 217 sections | **High** |
| `types.ts` monolith | 497 lines, 46 types, 56 importers | **Medium** |
| tsconfig strict mode | Disabled | **Medium** |
| Dependency graph enforcement | None | **Medium** |
| Bundle analysis | None | **Low** |
| Dependency count | 17 prod / 10 dev | **Good** |
| Architecture pattern | Adapter pattern, hook composition | **Good** |

---

## Problem 1: The God Hook

**File:** `src/hooks/useSlopcastWorkspace.ts` (862 lines)

This single hook owns ALL state for the main workspace page:
- 25 `useState` calls
- 9 `useEffect` calls
- 20 imports
- Returns 50+ values/functions

**Impact:** Every feature touching the Slopcast page must understand and modify this monolith. Changes collide. State interactions are implicit. AI agents need the entire 862-line file in context to make safe changes.

**Evidence:**
```
useState count:  25  (highest in codebase — next is MapVisualizer at 14)
useEffect count:  9  (highest in codebase — next is MapVisualizer at 6)
```

**Domains tangled together:**
- Well selection & filtering (operators, formations, status)
- Group management (CRUD, active group)
- Scenario management
- Economics calculation (processedGroups, aggregateFlow)
- UI state (view mode, panels, focus mode, tabs)
- Persistence (Supabase sync)
- Derived data (filtered wells, visible well IDs, dimmed wells)

---

## Problem 2: Background Components (4,039 lines)

| Component | Lines |
|-----------|-------|
| `HyperboreaBackground.tsx` | 1,017 |
| `TropicalBackground.tsx` | 950 |
| `StormDuskBackground.tsx` | 770 |
| `MoonlightBackground.tsx` | 461 |
| `SynthwaveBackground.tsx` | 438 |
| `MarioOverworldBackground.tsx` | 403 |
| **Total** | **4,039** |

These are canvas/WebGL animations — essentially standalone programs embedded in the component tree. They likely share patterns (canvas setup, resize handling, animation loops, cleanup) that are duplicated across all six.

**Impact:** Bloats the bundle, slows IDE navigation, confuses AI agents exploring the codebase. They're untestable and rarely change after initial creation.

---

## Problem 3: No Linting or Formatting

- No `.eslintrc`, `eslint.config.js`, or ESLint dependency
- No `.prettierrc` or Prettier dependency
- No complexity thresholds of any kind

**Impact:** Every AI session (and every human session) can freely:
- Add state to the god hook instead of creating a new one
- Create files of any size without warning
- Add exports that nothing imports
- Duplicate logic that already exists
- Use inconsistent formatting
- Introduce `any` types without detection

---

## Problem 4: Monolith CSS (`theme.css` — 2,454 lines)

A single CSS file with 217 section markers. Contains:
- CSS custom properties for every theme
- Component-level styles
- Layout/grid styles
- Animation definitions
- Media queries

**Impact:** Style changes require scrolling through 2,400 lines. Theme additions compound linearly. AI agents lose context navigating it.

**Note:** `@tailwindcss/vite` is installed as a dependency but appears underutilized — most styling goes through the CSS file and inline `style={{}}` objects.

---

## Problem 5: Monolith Types (`types.ts` — 497 lines, 46 types)

Every interface and type alias lives in one file. 56 of 123 files import from it (45% coupling).

**Impact:** Any type change triggers IDE-wide revalidation. It's hard to know which types belong to which domain. Types accumulate without pruning because everything is exported.

---

## Problem 6: Near-Zero Component Test Coverage

| What's tested | What's not |
|---------------|-----------|
| `economics.ts` — 20 unit tests | All 76 components |
| | All hooks (including the 862-line god hook) |
| | All services (projectRepository, dealRepository) |
| | All pages |

The `.test.tsx` files that exist in `layout/` and `ui/` appear to be stubs or minimal smoke tests.

**Impact:** Refactoring is risky. AI agents can't verify their work. The validation gate exists but the test suite is hollow.

---

## Problem 7: No TypeScript Strict Mode

`tsconfig.json` does not enable `strict: true`. This means:
- Implicit `any` is allowed
- Null checks are not enforced
- Function types are loosely checked

**Impact:** The type system operates at reduced power. AI-generated code passes type checking even when it shouldn't.

---

## Problem 8: No Import Boundary Enforcement

Nothing prevents architectural violations:
- A util importing a component
- A service importing a hook
- Circular dependencies between modules

No `dependency-cruiser`, no `eslint-plugin-boundaries`, no `madge` checks.

**Impact:** As the codebase grows, the import graph becomes a hairball. Refactoring becomes dangerous because you can't predict what depends on what.

---

## Inline Style Usage

Several components use `style={{}}` objects instead of CSS classes:

| File | Inline style count |
|------|--------------------|
| `DebugOverlay.tsx` | 7 |
| `SensitivityMatrix.tsx` | 4 |
| `ScenarioDashboard.tsx` | 4 |
| `WellsTable.tsx` | 3 |
| `EconomicsGroupBar.tsx` | 3 |
| `CashFlowTable.tsx` | 3 |

Some also reference CSS variables directly in TSX (`var(--...)`), creating an implicit contract between JS and CSS that's invisible to tooling.

---

## What's Actually Good

Not everything is broken. The codebase has real strengths:

- **Lean dependencies** (17 prod) — no dependency bloat
- **Clean architecture patterns** — adapter pattern for auth/economics, repository pattern for data
- **Separation of concerns** — utils are pure, services don't render, pages compose hooks
- **Well-tested core** — the economics engine has 20 solid unit tests
- **Theme system** — well-designed with CSS custom properties and `ThemeFeatures`
- **Clear naming conventions** — PascalCase components, `use*` hooks, repository services

The foundation is solid. The problem is governance, not architecture.
