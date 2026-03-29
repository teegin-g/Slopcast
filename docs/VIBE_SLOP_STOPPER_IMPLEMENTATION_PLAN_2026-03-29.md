# Vibe Slop Stopper Implementation Plan

**Date:** 2026-03-29  
**Target branch:** `spike/vibe-slop-stopper`  
**Purpose:** Evaluate how well the `vibe-slop-stopper` instructions work in practice on an isolated branch before deciding what should graduate to `main`

## Goal Of This Branch

This branch is not a broad cleanup effort. It is an **experiment branch** with two goals:

1. prove which parts of the `vibe-slop-stopper` plan are immediately useful and low-risk
2. identify which parts create too much churn, produce weak signal, or need adaptation before adoption on `main`

Success is **not** "finish every document instruction."  
Success is:

- we learn which safeguards help immediately
- we learn what the first safe rollout sequence should be
- we leave behind a clear recommendation for what to merge back

## Guiding Principles

- prefer **incremental adoption** over big-bang cleanup
- install **guardrails before refactors**
- keep the branch usable at all times
- validate each step before moving to the next
- treat this branch as a **trial environment**, not a rewrite sandbox

## Proposed Execution Order

## Phase 1: Establish The Quality Floor

**Objective:** Add lightweight enforcement that gives immediate signal without forcing a huge code cleanup.

### Scope

- install ESLint
- install Prettier
- install Knip
- add initial scripts:
  - `lint`
  - `lint:fix`
  - `format`
  - `format:check`
  - `knip`
  - `preflight`

### Constraints

- start with warnings where possible
- avoid enabling strict rules that create hundreds of failures immediately
- do not try to fully normalize the entire repo in the same step unless the diff stays reasonable

### Deliverables

- config files exist and run
- the team can see current violation counts
- local developer workflow gets a quick "quality floor" command

### Exit Criteria

- `npm run lint` runs successfully
- `npm run format:check` runs successfully
- `npm run knip` runs successfully
- `npm run preflight` exists and works

## Phase 2: Baseline The Current Problems

**Objective:** Measure the codebase against the newly added tools before changing architecture.

### Scope

- collect current lint warnings/errors
- collect dead-code findings from Knip
- collect circular dependency results if added in this phase
- record top offenders:
  - largest files
  - highest-friction hooks
  - highest-value cleanup candidates

### Deliverables

- one short findings summary in `docs/`
- categorized issues:
  - must-fix to use the tools
  - useful warnings to ratchet down later
  - noise to suppress or reconfigure

### Exit Criteria

- we know whether the toolchain is giving actionable signal or mostly noise

## Phase 3: Tighten The Type System Carefully

**Objective:** Test whether stricter TypeScript settings are practical right now.

### Scope

- try `strictNullChecks`
- if manageable, try `noImplicitAny`
- stop before full `strict: true` unless the error volume is surprisingly low

### Constraints

- do not weaken types just to make the branch green
- if the error volume is too large, document it and defer

### Deliverables

- either stricter TypeScript on this branch
- or a documented explanation of why it should be phased later

### Exit Criteria

- `npm run typecheck` still passes under whichever tighter settings survive the experiment

## Phase 4: Try One Real Structural Refactor

**Objective:** Test the refactoring guidance on the highest-value target without overcommitting.

### Recommended target

Start with the safest slice of `useSlopcastWorkspace.ts`:

- `useWellFiltering`
- `useWellSelection`

These are the best first extraction candidates because they are easier to isolate and validate than group/scenario/economics orchestration.

### Scope

- extract filtering into its own hook
- extract selection into its own hook
- keep `useSlopcastWorkspace.ts` as orchestrator
- add targeted tests for the extracted hooks

### Constraints

- no broad rewrite
- no changes to user-facing behavior
- avoid touching unrelated domains in the same pass

### Deliverables

- smaller workspace hook
- extracted hook files
- tests that prove the extraction was safe

### Exit Criteria

- app behavior matches current branch behavior
- tests pass
- the extraction feels easier than continuing to add state to the original hook

## Phase 5: Add Architecture Enforcement

**Objective:** Test whether dependency rules are useful and tolerable in this codebase.

### Scope

- add `madge` or equivalent circular dependency check
- optionally add dependency-cruiser if setup cost remains reasonable
- wire the lightest useful architecture checks into `preflight`

### Constraints

- start with the clearest rules only
- do not create a giant ruleset on day one

### Deliverables

- circular dependency visibility
- at least one architecture guard that prevents obvious drift

### Exit Criteria

- the checks produce signal without becoming workflow-hostile

## Phase 6: Decide What Graduates To Main

**Objective:** End the spike with a merge recommendation, not just a pile of changes.

### Questions To Answer

1. Which guardrails were immediately useful?
2. Which rules were too noisy?
3. Was the hook extraction worth the effort?
4. What is the smallest safe subset to merge into `main`?
5. What should stay branch-only until more prep work is done?

### Deliverables

- merge recommendation
- deferred items list
- follow-up implementation order for `main`

## Recommended First Merge Candidate

If this experiment goes well, the most likely first merge candidate is:

1. ESLint
2. Prettier
3. Knip
4. `preflight` scripts
5. a minimal docs summary of how to use them

This is the safest high-value subset because it improves the quality floor without forcing an architectural migration immediately.

## Items That Should Probably Not Be In The First Merge

Unless the experiment goes unusually smoothly, these should probably stay out of the first merge-back:

- full `strict: true`
- aggressive dependency-cruiser rule sets
- broad CSS file splitting
- full `types.ts` breakup
- major multi-domain workspace hook rewrite

Those are better treated as follow-on projects once the basic guardrails are in place.

## Risk Areas To Watch

### 1. Tool churn

If linting/formatting create huge diffs, the branch may become hard to evaluate. Keep the first pass focused.

### 2. False confidence from green tooling

A green linter is not the same thing as a clean architecture. Keep product behavior and refactor cost in view.

### 3. Over-refactoring

The point of the branch is to test the plan, not to disappear into cleanup for cleanup's sake.

### 4. Developer friction

If a new rule makes common work annoying without enough payoff, note it and downgrade or defer it.

## Success Criteria For The Experiment

This branch should be considered a successful spike if, by the end:

- we have a working baseline guardrail toolchain
- we have measured the current warning/problem profile
- we have tested at least one real architectural extraction
- we can clearly say what should and should not merge to `main`

## Concrete Next Actions

1. Install ESLint, Prettier, and Knip
2. Add `lint`, `format:check`, `knip`, and `preflight` scripts
3. Run the tools and capture baseline findings
4. Decide whether to tighten TypeScript now or defer
5. Extract `useWellFiltering`
6. Extract `useWellSelection`
7. Add tests around those extractions
8. Evaluate architecture checks
9. Produce merge recommendation

## Bottom Line

The right way to evaluate `vibe-slop-stopper` is not to ask whether the documents sound smart. It is to ask:

- does the tooling improve signal quickly?
- do the refactoring instructions produce safer seams?
- can we adopt the plan in slices without overwhelming the codebase?

This branch exists to answer those questions with evidence.
