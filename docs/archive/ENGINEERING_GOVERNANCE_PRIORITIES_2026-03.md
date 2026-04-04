# Engineering Governance Priorities

**Date:** 2026-03-29  
**Source material:** `vibe-slop-stopper/` documentation set, current codebase shape, and additional synthesis

## Why This Doc Exists

The governance and refactoring material from the outbound PR is valuable, but it lives as a separate document bundle and is easy to treat as background reading instead of a real plan. This document pulls the highest-value parts into `docs/` and reframes them as a practical engineering priorities list for Slopcast's next phase.

The central idea is simple:

> Slopcast does not have a bad foundation. It has a good foundation with weak guardrails.

The goal is not a rewrite. The goal is to make future work safer, smaller, and easier to verify.

## Current Engineering Risks

These are the structural issues most likely to slow the next phase of product development.

### 1. `useSlopcastWorkspace.ts` is still too central

The main workspace hook has become the system where many concerns meet:

- filtering
- selection
- group state
- scenario state
- derived economics
- UI mode state
- persistence

**Why this matters:**  
Every new feature in the workspace risks colliding with everything else. This is the single biggest source of change friction.

### 2. `theme.css` remains a large surface area

The theme system is one of Slopcast's strongest assets, but the styling layer is still large and therefore costly to evolve.

**Why this matters:**  
Theme work and UI work frequently intersect. A monolithic style surface increases regressions and context load.

### 3. Guardrails are still lighter than the product now deserves

The app has become ambitious enough that relying on typecheck and manual taste alone is no longer sufficient.

**Why this matters:**  
The more the product moves toward scenario complexity, collaboration, and live data, the more expensive ungoverned changes become.

### 4. Refactoring work is documented better than it is scheduled

There is already useful planning material around governance, but it still needs to be translated into an execution sequence that supports product work instead of blocking it.

## The Core Principle

Slopcast should adopt a **two-track engineering model**:

- **Track A:** product-facing feature work
- **Track B:** background governance and refactoring work that reduces future feature cost

If governance work is treated as a prerequisite to all feature work, it will stall. If it is ignored entirely, feature work gets slower and sloppier over time. The right answer is to pair small pieces of governance with each major product wave.

## Recommended Priorities

### Priority 1: Install minimal but real guardrails

These are the highest-leverage engineering improvements because they change the quality floor for all future work.

#### Recommended additions

- ESLint
- Prettier
- Knip or equivalent dead-code detection
- circular dependency checks
- a `preflight` script that bundles the most important checks

#### Why this matters

- prevents accidental quality drift
- makes AI-generated edits safer
- reduces silent entropy
- creates a shared baseline for future cleanup

#### First slice

- add `lint`
- add `format:check`
- add `knip`
- run them once
- fix the first wave of obvious violations

### Priority 2: Split the workspace hook by domain

This is the most important structural refactor in the repo.

#### Recommended target decomposition

- `useWellFiltering`
- `useWellSelection`
- `useGroupManagement`
- `useScenarioManagement`
- `useWorkspaceUI`
- keep `useSlopcastWorkspace` as a thin orchestrator

#### Why this matters

- reduces collision risk
- makes feature ownership clearer
- lowers context requirements for every workspace edit
- improves testability of isolated domains

#### First slice

Extract only the filtering and selection domains first. Those are the least risky and easiest to verify.

### Priority 3: Tighten TypeScript incrementally

This should be done as a staircase, not a one-shot strict-mode crusade.

#### Suggested order

1. `strictNullChecks`
2. `noImplicitAny`
3. selected stricter rules where payoff is high

#### Why this matters

- catches real bugs
- improves confidence during refactors
- makes AI-authored code less permissive

#### First slice

Enable `strictNullChecks` first and fix only the surfaced issues before going further.

### Priority 4: Formalize import boundaries

As the app grows, architecture drift becomes harder to detect by feel.

#### What to enforce

- services should not import components
- utilities should stay UI-agnostic
- hooks should not create circular dependency chains
- domain boundaries should become visible in tooling

#### First slice

- run a circular dependency check
- add one simple architectural rule set
- fail loudly only on the most dangerous violations first

### Priority 5: Break large styling and type surfaces into maintainable layers

This is important, but it should follow the hook split and guardrail installation.

#### Good targets

- split `theme.css` into token, layout, component, and animation layers
- split `types.ts` into domain files

#### Why this matters

- faster navigation
- lower context load
- easier themed feature development

#### First slice

Split styles only at the file-boundary level first, without changing token semantics.

## Governance Work That Should Happen Alongside Product Work

These are the habits that should become normal without becoming heavy bureaucracy.

### For every significant feature

- no new giant files without a clear reason
- no new "god object" hooks or components
- prefer extending an existing pattern over inventing a parallel one
- document the domain boundary if a change introduces a new subsystem

### For every UI-heavy change

- verify at least two themes
- verify desktop and mobile
- keep state legible and workflow-first
- avoid adding new chrome when information hierarchy can solve the problem

### For every agent-driven change

- keep scope narrow
- avoid opportunistic architectural rewrites in feature PRs
- prefer additive extractions over rewrites
- leave a clean path for follow-up work

## Practical 6-Week Model

This is the engineering sequence that best supports the current product roadmap.

### Week 1: Quality floor

- install linting and formatting
- add dead-code detection
- create a `preflight` script
- normalize the most obvious issues

### Week 2: Type safety floor

- enable `strictNullChecks`
- fix surfaced nullability issues
- identify the worst `any` hotspots

### Week 3: Workspace hook split, part 1

- extract `useWellFiltering`
- extract `useWellSelection`
- add tests around those extractions

### Week 4: Workspace hook split, part 2

- extract group and scenario management
- slim the orchestrator

### Week 5: Architecture enforcement

- circular dependency checks
- basic import-boundary rules
- gate integration

### Week 6: File-surface cleanup

- split `theme.css`
- split `types.ts`
- assess background lazy-loading and bundle visibility

## Where My Additions Differ From The Raw PR Docs

The original governance material was strong, but this is how it should be interpreted in practice:

### 1. Do not lead with "cleanup for cleanup's sake"

Governance work should always be attached to either:

- feature velocity
- regression prevention
- reduced coordination cost

If it is framed only as "the codebase is messy," it will lose prioritization quickly.

### 2. The hook split matters more than CSS perfection

The workspace hook is a bigger source of product friction than the exact shape of style files. If only one large refactor happens soon, it should be the hook decomposition.

### 3. Tooling must stay proportionate

Slopcast should not become process-heavy. The right goal is:

- a loud baseline
- a lightweight preflight
- a few clear architectural rules

not an enterprise wall of mandatory checks that slows down experimentation.

### 4. Product and governance should pair deliberately

A good rule for the next phase:

- every flagship feature should pay down one structural risk

Examples:

- if you build a command palette, use it to establish cleaner action architecture
- if you build Monte Carlo mode, isolate the simulation domain cleanly
- if you build project sharing, formalize provenance and state ownership

## Recommended Engineering Tickets

### 1. Add Slopcast preflight guardrails

**Scope:**  
ESLint, Prettier, dead-code scan, package scripts, and one preflight command.

**Acceptance criteria:**

- `npm run lint` exists
- `npm run format:check` exists
- `npm run knip` exists
- `npm run preflight` exists and runs the chosen checks

### 2. Extract workspace filtering and selection hooks

**Scope:**  
Split filtering and selection logic out of `useSlopcastWorkspace.ts`.

**Acceptance criteria:**

- filtering lives in its own hook
- selection lives in its own hook
- workspace behavior is unchanged
- tests cover the extracted behaviors

### 3. Enable `strictNullChecks`

**Scope:**  
Incremental type-system hardening only.

**Acceptance criteria:**

- `strictNullChecks` enabled
- `npm run typecheck` passes
- no broad type loosening added to compensate

### 4. Add circular dependency detection

**Scope:**  
Introduce one lightweight dependency check and wire it into the validation flow.

**Acceptance criteria:**

- a circular dependency check command exists
- current results are documented
- new circular dependencies fail the check

### 5. Split style and type monoliths

**Scope:**  
Break `theme.css` and `types.ts` into smaller domain-organized files.

**Acceptance criteria:**

- styles are divided by concern
- types are divided by domain
- imports remain stable or are migrated safely

## Bottom Line

The most valuable engineering work from the outbound PR is not a rewrite plan. It is a reminder that Slopcast has reached the point where:

- product ideas are getting bigger
- UI polish is getting more ambitious
- the workspace core needs safer seams

The next engineering phase should therefore focus on:

1. **guardrails**
2. **workspace hook decomposition**
3. **incremental type and dependency enforcement**
4. **smaller file surfaces for themes and types**

That sequence gives the product room to keep growing without turning every new feature into a high-context editing session.
