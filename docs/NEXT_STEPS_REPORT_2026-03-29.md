# Slopcast Next Steps Report

**Date:** 2026-03-29

## Executive Summary

Based on the planning docs, PRDs, audit reports, recent UI critique work, and feature backlog, Slopcast appears to be in a **post-UI-revamp, pre-product-expansion** phase.

The clearest read from the repo is:

- The **workspace UI revamp is largely implemented**, even though some planning docs still show parts of it as incomplete.
- The most recent work has shifted from broad structural UI changes to **critique-driven polish**, especially around readability, motion, spacing, and interaction quality.
- The **next real implementation frontier** is no longer "make the shell modern." It is now:
  - finish or verify remaining **UI hardening**
  - improve **state clarity and compute UX**
  - decide whether to prioritize **collaboration**, **live data integration**, or **high-leverage product features** like interactive map and type-curve fitting

## Evidence Reviewed

Primary docs used for this assessment:

- `.planning/ROADMAP.md`
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/UI-REVIEW-IMPLEMENTATION-PLAN.md`
- `.planning/AUDIT-REPORT.md`
- `.planning/CRITIQUE-WELLS-ECONOMICS.md`
- `docs/PRD_UI_CLARITY_PASS_2026-03-05.md`
- `docs/feature-ideas.md`
- `docs/DATA_MODEL_ARCHITECTURE.md`
- `docs/specs/01-data-access-well-headers.md`
- `docs/specs/02-production-data.md`
- `docs/specs/03-economic-parameters.md`
- `docs/specs/04-spatial-layers-map.md`
- `docs/specs/05-dsu-creation-stick-gen.md`
- `docs/specs/06-aries-comparison.md`

## What Looks In Progress

### 1. UI revamp completion and reconciliation

The planning documents do not fully agree with one another:

- `STATE.md` says Phase 3 was executing and `03-01` was completed.
- `ROADMAP.md` still marks parts of Phase 1 and all of Phase 3 as incomplete.
- `PROJECT.md` still lists major UI revamp outcomes as active or pending.

Most likely interpretation:

- The UI revamp is **more complete in code than the planning docs reflect**.
- The remaining work here is probably **verification, cleanup, and documentation reconciliation**, not a major new UI build.

### 2. UI critique hardening

The recent critique and audit docs point to a focused hardening pass rather than a redesign:

- accessibility
- reduced-motion support
- spacing and typography consistency
- clearer visual hierarchy
- better component consistency
- stronger theme readability and panel hierarchy

Most likely interpretation:

- The recent critique branch addressed a large amount of this work already.
- Remaining effort is likely about **closing quality gaps**, not replacing the current direction.

### 3. UX clarity and compute-state clarity

`docs/PRD_UI_CLARITY_PASS_2026-03-05.md` still reads like an active opportunity space. Its themes are:

- one primary action per surface
- clearer selection and scope
- persistent state legibility
- no dead-end compute states
- cleaner scenarios comparison behavior
- better mobile action anchoring

Most likely interpretation:

- This is the most coherent candidate for the **next user-facing product UX pass** after the critique merge.

## Most Likely Next Steps

### 1. Reconcile planning docs with shipped UI work

Why this matters:

- The planning layer currently creates uncertainty about what is complete versus what is merely planned.
- This makes milestone tracking and next-step prioritization harder than it needs to be.

Suggested outputs:

- update `.planning/ROADMAP.md`
- update `.planning/PROJECT.md`
- update `.planning/STATE.md`
- distinguish between:
  - completed revamp work
  - known tech debt
  - future product improvements

### 2. Run a focused accessibility and semantics pass

Why this matters:

- The audit docs repeatedly identify accessibility as the biggest remaining quality gap.
- The recent critique work appears to improve motion safety and focus styling, but the docs still point to broader unfinished work:
  - ARIA roles
  - dialog semantics
  - keyboard support
  - skip links
  - landmark structure
  - heading hierarchy
  - tab semantics

This is the strongest "next polish sprint" candidate because it:

- improves quality without redesigning the product
- aligns directly with recent critique work
- reduces risk before larger feature investments

### 3. Turn the UI Clarity PRD into implementation slices

Why this matters:

The clarity PRD is one of the clearest next-step documents in the repo and already has strong UX framing around:

- clearer selection summary
- clearer compute freshness, running, failed, and stale states
- better scenario compare clarity
- less ambiguous builder and home flows
- better mobile action anchoring

This looks like the best candidate for the **next product-facing UX sprint**.

## Product Features That Look Ready To Prioritize

These do not look actively in progress, but the docs suggest they are the strongest candidates for the next feature wave.

### 1. Project Sharing

Source:

- `docs/feature-ideas.md`

Why it stands out:

- The doc explicitly says the schema already exists.
- It unlocks team use instead of solo-only workflows.
- It is listed as the highest-impact next feature recommendation.

### 2. Interactive Map and Spatial Upgrades

Sources:

- `docs/feature-ideas.md`
- `docs/DATA_MODEL_ARCHITECTURE.md`

Why it stands out:

- Strong visual payoff and user value.
- The architecture docs already define spatial layers, sticks, units, spacing, and reservoir overlays.
- It connects current UI work to future live-data capabilities.

### 3. Type Curve Auto-Fit

Sources:

- `docs/feature-ideas.md`
- `docs/DATA_MODEL_ARCHITECTURE.md`

Why it stands out:

- It moves the app closer to real engineering workflows.
- It bridges the gap between mock/demo analysis and real production-backed economics.

### 4. Waterfall Chart for Value Bridge

Source:

- `docs/feature-ideas.md`

Why it stands out:

- The docs suggest the underlying driver-delta data may already exist.
- This looks like a contained, high-value visualization feature.

### 5. Keyboard Shortcuts

Source:

- `docs/feature-ideas.md`

Why it stands out:

- Cheap to build relative to impact.
- Strong fit for repeat and power users.
- Consistent with the repo's broader goal of making the workspace faster and clearer.

## What Is Clearly Not Started Yet

### Live Databricks-backed data platform

Sources:

- `docs/DATA_MODEL_ARCHITECTURE.md`
- `docs/specs/01-data-access-well-headers.md`
- `docs/specs/02-production-data.md`
- `docs/specs/03-economic-parameters.md`
- `docs/specs/04-spatial-layers-map.md`
- `docs/specs/05-dsu-creation-stick-gen.md`
- `docs/specs/06-aries-comparison.md`

Signals:

- The architecture is detailed and serious.
- All six implementation specs under `docs/specs/` are explicitly marked `Not started`.

Most likely interpretation:

- This is a major future initiative, not the immediate next sprint unless the project deliberately pivots from UI hardening into platform/data work.

## Recommended Priority Order

If the goal is to choose the most sensible next steps from the current docs, this is the order that makes the most sense:

1. **Close the loop on the UI revamp**
   - reconcile planning docs
   - verify what the merged critique work completed
   - separate "done" from "known debt"

2. **Do one focused accessibility and semantics sprint**
   - keyboard navigation
   - ARIA
   - modal and dialog semantics
   - skip links
   - heading and landmark cleanup

3. **Turn the UI Clarity PRD into implementation work**
   - selection summary
   - compute lifecycle states
   - scenario comparison clarity
   - mobile action anchoring

4. **Pick one major feature track**
   - `Project Sharing` if the goal is collaboration and product expansion
   - `Interactive Map` if the goal is a high-visibility workflow upgrade
   - `Type Curve Auto-Fit` if the goal is deeper technical differentiation

## Bottom Line

The repo does **not** read like a project that still needs broad UI restructuring. It reads like a project that has already done most of that work and now needs to choose between:

- **hardening the polished UI into a truly production-ready product**, or
- **starting the next major feature wave**

The strongest next candidates are:

- accessibility and semantics hardening
- compute and selection clarity improvements
- project sharing
- interactive map and spatial layers
- type-curve fitting

If a single direction must be chosen next, the best sequence is:

1. verify and document what the UI critique work completed
2. do the accessibility and semantics pass
3. implement the clarity PRD in slices
4. then start the next major feature track
