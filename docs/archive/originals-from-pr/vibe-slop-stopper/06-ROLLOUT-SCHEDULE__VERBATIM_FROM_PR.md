# 06 — Rollout Schedule

Prioritized, week-by-week timeline. Each week is independent — you can skip or reorder based on what's hurting most.

---

## Week 1: Stop the Bleeding

**Goal:** Install automated guardrails so new code can't make things worse.

| Task | Time | Command |
|------|------|---------|
| Install ESLint + config | 20 min | `npm i -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh` |
| Install Prettier + config | 10 min | `npm i -D prettier` |
| Install Knip + config | 10 min | `npm i -D knip` |
| Run Knip, delete dead code | 30 min | `npx knip` → review → `npx knip --fix` |
| Run Prettier on entire codebase | 5 min | `npx prettier --write 'src/**/*.{ts,tsx,css}'` |
| Commit baseline | 5 min | One big formatting commit, then never again |
| Add `lint` + `format:check` + `knip` scripts | 5 min | Update `package.json` |

**Deliverables:**
- [ ] `eslint.config.js` exists and `npm run lint` runs
- [ ] `.prettierrc` exists and `npm run format:check` runs
- [ ] `knip.json` exists and `npm run knip` runs
- [ ] All dead code identified by Knip is reviewed and removed
- [ ] One formatting commit normalizes the entire codebase

**Estimated total:** ~1.5 hours

---

## Week 2: Tighten the Type System

**Goal:** Make TypeScript catch more bugs. Prevent `any` from spreading.

| Task | Time | Notes |
|------|------|-------|
| Enable `strictNullChecks` in tsconfig | 10 min + fix time | Start with just this flag |
| Fix null-check errors | 1-3 hours | Depends on how many surface |
| Enable `noImplicitAny` | 10 min + fix time | May surface more errors |
| Fix implicit-any errors | 1-2 hours | Replace `any` with real types |
| (Optional) Enable full `strict: true` | 10 min | If first two flags were manageable |

**Deliverables:**
- [ ] `strictNullChecks: true` in tsconfig, all errors fixed
- [ ] `noImplicitAny: true` in tsconfig, all errors fixed
- [ ] `npm run typecheck` passes with stricter settings

**Estimated total:** 2-4 hours (depending on error count)

---

## Week 3: Split the God Hook

**Goal:** Break `useSlopcastWorkspace.ts` from 862 lines into 5-6 focused hooks.

| Task | Time | Notes |
|------|------|-------|
| Extract `useWellFiltering` | 45 min | Filter state + derived data |
| Extract `useWellSelection` | 30 min | Selection state + handlers |
| Extract `useGroupManagement` | 60 min | Largest chunk — group CRUD |
| Extract `useScenarioManagement` | 30 min | Scenario state |
| Extract `useWorkspaceUI` | 45 min | UI preferences + localStorage |
| Slim orchestrator | 30 min | Wire extracted hooks together |
| Add tests for each new hook | 60 min | `renderHook` tests |
| Verify app works identically | 30 min | Manual QA + Playwright |

**Deliverables:**
- [ ] `useSlopcastWorkspace.ts` under 200 lines
- [ ] 5 new hooks, each under 200 lines, each with tests
- [ ] App behavior unchanged
- [ ] `npm run typecheck && npm test` passes

**Estimated total:** 5-6 hours

---

## Week 4: Architecture Enforcement

**Goal:** Prevent structural violations from creeping back in.

| Task | Time | Notes |
|------|------|-------|
| Install madge | 5 min | `npm i -D madge` |
| Run circular dep check | 5 min | `npx madge --circular --extensions ts,tsx src/` |
| Fix any circular deps found | 30-60 min | Depends on findings |
| Install dependency-cruiser | 15 min | `npm i -D dependency-cruiser` |
| Write boundary rules | 20 min | See 02-TOOLING-SETUP.md |
| Add `circular` + `deps:check` scripts | 5 min | Update package.json |
| Add to gate script | 10 min | See 04-CI-INTEGRATION.md |

**Deliverables:**
- [ ] Zero circular dependencies
- [ ] Architecture rules enforced in CI
- [ ] `npm run circular` and `npm run deps:check` pass
- [ ] Gate script updated with new stages

**Estimated total:** 1.5-2 hours

---

## Week 5: Split Types and CSS

**Goal:** Break the remaining monolith files.

| Task | Time | Notes |
|------|------|-------|
| Create `src/types/` directory | 5 min | |
| Split `types.ts` into domain files | 45 min | See 03-REFACTORING-PLAN.md |
| Create barrel `types/index.ts` | 10 min | Backward compatible |
| Delete old `types.ts` | 5 min | |
| Split `theme.css` into layers | 60 min | tokens, components, layout, animations |
| Create `styles/index.css` entry point | 10 min | |
| Verify all styles work | 30 min | Check 2+ themes |

**Deliverables:**
- [ ] `src/types/` directory with domain-specific type files
- [ ] `src/styles/` directory with split CSS files
- [ ] No file over 400 lines in either directory
- [ ] All themes render correctly

**Estimated total:** 2.5-3 hours

---

## Week 6: Background Components + Bundle

**Goal:** Lazy-load heavy backgrounds and understand the bundle.

| Task | Time | Notes |
|------|------|-------|
| Install rollup-plugin-visualizer | 5 min | `npm i -D rollup-plugin-visualizer` |
| Run bundle analysis | 10 min | Build, open treemap |
| Add `React.lazy()` wrappers for backgrounds | 30 min | See 03-REFACTORING-PLAN.md |
| Add `Suspense` boundary | 15 min | Fallback to solid color |
| Verify all themes load correctly | 20 min | Test each theme switch |
| (Optional) Extract shared canvas logic | 2-3 hours | `useCanvasAnimation` hook |

**Deliverables:**
- [ ] Bundle analysis HTML generated on every build
- [ ] All 6 backgrounds lazy-loaded
- [ ] Theme switching works without visible flash
- [ ] Bundle size reduced (backgrounds no longer in main chunk)

**Estimated total:** 1.5 hours (+ 2-3 hours optional)

---

## Ongoing: Governance

These are not one-time tasks — they're habits.

### Every PR / Feature

- [ ] Run `npm run preflight` before pushing
- [ ] No new files over 400 lines
- [ ] No new `any` types
- [ ] New hooks have tests
- [ ] Knip shows no new unused exports

### Monthly

- [ ] Run `npx knip` and clean up
- [ ] Run `npm run deps:graph` and review architecture
- [ ] Check `npm run build` bundle size trend
- [ ] Review ESLint warning count — it should only go down

### Quarterly

- [ ] Evaluate if `max-lines` limits should tighten (400 → 300?)
- [ ] Evaluate if ESLint warnings should become errors
- [ ] Review dependency list for unused or deprecated packages
- [ ] Consider new tooling as the ecosystem evolves

---

## Success Metrics

| Metric | Before | Target (Week 6) | Target (Month 3) |
|--------|--------|-----------------|-------------------|
| Largest file | 2,454 lines | Under 800 | Under 400 |
| `useSlopcastWorkspace` | 862 lines | Under 200 | Under 200 |
| ESLint errors | N/A (no ESLint) | 0 errors | 0 errors, <20 warnings |
| Circular deps | Unknown | 0 | 0 |
| Knip unused exports | Unknown | <10 | 0 |
| Component test files | ~0 | 5+ hook tests | 15+ tests |
| Time to add a feature | Increasing | Stable | Decreasing |
