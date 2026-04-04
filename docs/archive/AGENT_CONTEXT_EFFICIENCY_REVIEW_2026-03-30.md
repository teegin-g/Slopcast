# Agent Context Efficiency Review

Date: 2026-03-30

## Goal

Reduce token spend and blind repo search for Cursor, Claude, and Codex by making feature boundaries self-describing and by separating canonical guidance from archives, duplicates, and dated reports.

This review is based on the current repo layout, including `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `.agents/`, `docs/`, `src/`, `backend/`, `vibe-slop-stopper/`, and `codex/`.

## Executive Take

The repo already has strong global guidance at the root. The biggest inefficiency is not "missing rules"; it is that agents still have to hunt for the right local context after they enter the repo.

The fastest path to lower token usage is:

1. Keep one canonical global harness at the root.
2. Add small feature-local manifests near important folders.
3. Separate active docs from archival docs so search results are less noisy.
4. Add path-scoped rules only where behavior genuinely differs by directory.
5. Prefer one shared local context file per feature over duplicating full `CLAUDE.md` / `AGENTS.md` / Codex rules in many places.

## What Is Already Working

- `CLAUDE.md` is a strong root-level project map with commands, architecture, testing, and design context.
- `.cursorrules` gives Cursor a clear entry into the repo's multi-agent operating model.
- `AGENTS.md` adds UI-specific workflow expectations that are concrete and actionable.
- `.agents/` is structured and gives the supervisor/implementer/validator model a real operating system.
- `docs/specs/` is numbered and easier to navigate than free-form doc sprawl.
- Storybook stories and tests exist near many reusable UI surfaces, which helps once an agent has found the right area.

## Where Agents Still Waste Time

### 1. The first-open path is weak

The root `README.md` is generic AI Studio boilerplate. An agent that opens `README.md` first does not get pointed to the actual Slopcast harness.

### 2. `docs/` mixes durable context with dated reports and archived copies

Right now durable references, work product, and verbatim snapshots live too close together. That increases the odds that an agent reads a stale or archival doc before a canonical one.

Examples:

- `docs/specs/*.md` looks canonical.
- `docs/NEXT_STEPS_REPORT_2026-03-29.md` and similar files are date-scoped and situational.
- `docs/originals-from-pr/` intentionally stores verbatim snapshots, but those files still add search surface.

### 3. There are duplicate topic clusters

The same general subject can show up in multiple places, for example:

- `vibe-slop-stopper/`
- `docs/originals-from-pr/vibe-slop-stopper/`
- root-level planning/report docs that refer to the same topic

That is useful for historical preservation, but expensive for agents that are trying to answer "where is the source of truth?"

### 4. Local feature boundaries are not self-describing

There is no `src/README.md`, no `backend/README.md`, and no small feature manifests near major areas like:

- `src/components/slopcast/`
- `src/components/slopcast/map/`
- `src/services/`
- `src/hooks/`
- `supabase/`

So even though the root docs are good, an agent still has to search once it gets into the app.

### 5. There are no path-scoped Cursor rules

There is no `.cursor/rules/` layer today. That means all behavior is driven from broad root guidance plus ad hoc search, even when a task clearly belongs to a narrower domain like map UI, economics logic, or backend data access.

### 6. Tooling knowledge is broader than app knowledge

There are several large skill and adapter trees. Those are useful, but from a token-efficiency perspective they can outweigh the app's own local context if an agent starts searching too broadly.

## Recommendation: Do Not Clone Full Root Files Everywhere

I would not copy full versions of `CLAUDE.md`, `AGENTS.md`, and Codex rules into every feature folder.

Why not:

- It creates multiple competing sources of truth.
- It increases search hits rather than reducing them.
- It makes drift almost guaranteed.
- It raises the chance that an agent reads a stale local file and misses a newer root rule.

Better pattern:

- Keep root files canonical.
- Add a tiny local context file per feature or domain.
- If a tool benefits from local discovery, use a tiny shim that points back to the same shared local context file.

## Best Pattern For This Repo

### Layer 1: One canonical global harness

Keep these as the repo-wide source of truth:

- `CLAUDE.md`
- `.cursorrules`
- `AGENTS.md`
- `.agents/`

These should stay broad and stable.

### Layer 2: Small local manifests near code

Add a single small file at major feature boundaries. I would standardize on one name such as:

- `FEATURE.md`
- or `README.md`

I would avoid per-folder `CLAUDE.md` unless the tool actually auto-loads it and the content is intentionally tiny.

For this repo, the highest-value first wave would be:

- `src/README.md`
- `src/components/slopcast/FEATURE.md`
- `src/components/slopcast/map/FEATURE.md`
- `src/services/FEATURE.md`
- `src/hooks/FEATURE.md`
- `backend/README.md`
- `supabase/README.md`

Each file should be short. Target 200-500 tokens, not 1,500.

Each file should answer:

- What lives here
- Where to start reading
- Which files are the true entrypoints
- Which neighboring modules matter most
- Which specs/docs relate to this folder
- Which tests/stories verify it
- Which folders are commonly confused with this one

### Layer 3: Path-scoped rules only where behavior differs

Use `.cursor/rules/` for directory-specific behavior, not for re-stating global project context.

Good candidates:

- `.cursor/rules/slopcast-map.mdc`
- `.cursor/rules/economics.mdc`
- `.cursor/rules/backend-data.mdc`

These should contain narrow instructions like:

- read `src/components/slopcast/map/FEATURE.md` first for map work
- prefer stories in the same folder before searching across `src/components/`
- for economics changes, start at `src/services/economicsEngine.ts` and `src/utils/economics.ts`

They should not duplicate the entire root harness.

### Layer 4: Curated docs index and archive split

Create a durable docs entrypoint so agents do not scan `docs/` indiscriminately.

Recommended shape:

- `docs/README.md` or `docs/INDEX.md`
- `docs/specs/` for canonical product/technical specs
- `docs/reference/` for stable architecture docs and data dictionaries
- `docs/reports/` for dated analysis and plans
- `docs/archive/` for snapshots and historical records

If you do not want to move files immediately, even a simple `docs/README.md` that labels each file as one of:

- canonical
- active working doc
- historical snapshot

would already save agents a lot of search.

### Layer 5: One machine-readable feature registry

Add a lightweight registry that maps feature names to the files agents should read first.

Example:

- `docs/feature-registry.yaml`
- or `docs/feature-index.json`

Suggested fields:

- `slug`
- `paths`
- `entrypoints`
- `related_docs`
- `tests`
- `stories`
- `search_terms`
- `do_not_start_in`

This becomes a cheap routing table for agents and supervisors.

## Concrete Repo-Specific Opportunities

### 1. Fix the root landing experience

Current issue:

- `README.md` does not route an agent to the actual harness.

Recommendation:

- Make `README.md` a real Slopcast landing page.
- Point clearly to `CLAUDE.md`, `docs/CODING_AGENT_HARNESS.md`, and `docs/specs/`.

Expected impact:

- better first-open behavior
- fewer wasted reads
- fewer "what kind of app is this?" searches

### 2. Add a `src/README.md`

Purpose:

- Give a 30-second mental model of the frontend.

It should point to:

- `src/pages/SlopcastPage.tsx`
- `src/hooks/useSlopcastWorkspace.ts`
- `src/services/economicsEngine.ts`
- `src/utils/economics.ts`
- `src/components/slopcast/`

Expected impact:

- agents can route to page, state, service, or pure-calculation layers faster

### 3. Add a map feature manifest

Candidate:

- `src/components/slopcast/map/FEATURE.md`

It should answer:

- which components own the map shell vs overlays vs filters
- which hooks/services feed the map
- which specs relate to map behavior
- which stories cover the area
- where not to start if looking for map logic

Expected impact:

- map tasks stop turning into whole-`src` searches

### 4. Add an economics feature manifest

Candidate:

- `src/services/FEATURE.md`
- or `src/utils/FEATURE.md`

It should explain the contract between:

- `src/services/economicsEngine.ts`
- `src/utils/economics.ts`
- economics result UI components

Expected impact:

- agents no longer need to infer where "real economics logic" lives

### 5. Add a persistence/data flow manifest

Candidate:

- `src/components/slopcast/hooks/FEATURE.md`
- or `src/services/FEATURE.md`

It should connect:

- project persistence hooks
- repository files
- Supabase artifacts
- local fallback behavior

Expected impact:

- fewer repeated searches across hooks, services, and `supabase/`

### 6. Split active docs from archive docs

Current issue:

- date-scoped docs and verbatim snapshots live close to active docs

Recommendation:

- move historical material under `docs/archive/`
- keep `docs/specs/` and `docs/reference/` for stable guidance
- mark archives loudly in filenames or directories

Expected impact:

- less stale context gets pulled into prompts
- cleaner search results

### 7. Canonicalize the `vibe-slop-stopper` topic

Current issue:

- the same subject appears in both a dedicated root folder and archived snapshot copies

Recommendation:

- pick one canonical working location
- keep the other as clearly labeled archive-only material
- add a pointer file instead of parallel full copies when possible

Expected impact:

- agents stop reading both and merging them mentally

## Proposed Feature Manifest Template

If you add local manifests, keep them small and uniform.

Suggested template:

```md
# <Feature Name>

## Purpose
- One paragraph: what this area owns and what it does not own.

## Read This First
- `path/to/primary-entry.tsx`
- `path/to/main-hook.ts`
- `path/to/main-service.ts`

## Key Neighbors
- `path/to/related-file.ts`: why it matters
- `path/to/related-file.tsx`: why it matters

## Related Docs
- `docs/specs/...`
- `docs/reference/...`

## Tests And Stories
- `path/to/test`
- `path/to/story`

## Common Tasks
- Adding UI here: start with ...
- Changing behavior here: start with ...

## Avoid These False Starts
- Do not begin in `...` unless the task is specifically about ...
```

That is enough direction without becoming another heavy prompt pack.

## Optional Tool-Specific Shim Pattern

If you really want local tool-specific files in feature folders, do not duplicate full content.

Use tiny shims like:

- local `AGENTS.md`
- local `CLAUDE.md`
- local Codex rule snippet

Each should be 2-6 lines and point to the same shared feature manifest.

Example idea:

```md
# Local Agent Note

For work in this folder, read `FEATURE.md` first.
Global repo rules still live in the root `CLAUDE.md` and `AGENTS.md`.
```

This gives local discoverability without creating three full documents per feature.

## Search-Minimizing Conventions

These conventions will probably save more tokens than adding more prose:

- Every major feature folder gets exactly one tiny local context file.
- Every local context file starts with "Read this first" links.
- Each file lists the 3-5 most relevant neighboring files explicitly.
- Each file names the related tests/stories/specs.
- Historical documents live under an obviously archival path.
- Global rules stay global; local files only describe local boundaries.
- Use the same filename everywhere so agents can guess it quickly.

## Suggested Rollout Order

### Highest ROI

1. Replace the generic root `README.md` with a real Slopcast entrypoint.
2. Add `docs/README.md` that labels canonical vs historical docs.
3. Add `src/README.md`.
4. Add `src/components/slopcast/map/FEATURE.md`.
5. Add `src/services/FEATURE.md` or `src/utils/FEATURE.md`.

### Second wave

6. Add `.cursor/rules/` for map, economics, and backend areas.
7. Add `backend/README.md` and `supabase/README.md`.
8. Add `docs/feature-registry.yaml`.

### Cleanup wave

9. Move historical docs into a clearer archive structure.
10. Reduce duplicate topic trees where a pointer file would work.

## Bottom Line

Your instinct is right that more local guidance would help, but I would not solve it by sprinkling full `CLAUDE.md` / `AGENTS.md` / Codex files everywhere.

For this repo, the best tradeoff is:

- one authoritative global harness
- one tiny local manifest per important feature boundary
- one curated docs index
- a small amount of path-scoped rule routing

That gives agents a short path from "what is this repo?" to "what exact files should I read first for this task?" without exploding the number of competing documents they have to reconcile.
