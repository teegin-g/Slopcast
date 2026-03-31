# Slopcast Docs Index

Use this file to route quickly to the right document before searching across `docs/`.

## Canonical Docs

These are the durable starting points for architecture, workflow, and implementation context.

- [`CODING_AGENT_HARNESS.md`](CODING_AGENT_HARNESS.md): how the multi-agent system is wired across Cursor, Claude Code, and Codex
- [`specs/`](specs): numbered product and technical specs for current data and integration work
- [`DATA_MODEL_ARCHITECTURE.md`](DATA_MODEL_ARCHITECTURE.md): durable data model overview
- [`ARIES_ECONOMIC_ENGINE.md`](ARIES_ECONOMIC_ENGINE.md): economics-engine-specific reference

## Active Working Docs

These are useful current analyses or planning notes, but they are time-scoped and should not override canonical docs.

- [`AGENT_CONTEXT_EFFICIENCY_REVIEW_2026-03-30.md`](AGENT_CONTEXT_EFFICIENCY_REVIEW_2026-03-30.md): recommendations for reducing agent search and context load
- [`PHASE2_VALIDATION_HANDOFF.md`](PHASE2_VALIDATION_HANDOFF.md): current validation handoff notes
- [`NEXT_STEPS_REPORT_2026-03-29.md`](NEXT_STEPS_REPORT_2026-03-29.md): next-step recommendations from a specific review pass
- [`LATEST_PR_REVIEW_AND_PLAN_2026-03-29.md`](LATEST_PR_REVIEW_AND_PLAN_2026-03-29.md): point-in-time PR review and follow-up plan
- [`VIBE_SLOP_STOPPER_IMPLEMENTATION_PLAN_2026-03-29.md`](VIBE_SLOP_STOPPER_IMPLEMENTATION_PLAN_2026-03-29.md): implementation planning for the current governance effort

## Reference Collections

- [`tables/`](tables): source table notes and data-dictionary-style references
- [`feature-ideas.md`](feature-ideas.md), [`FEATURE_INSPIRATION_2026-03.md`](FEATURE_INSPIRATION_2026-03.md), [`UI_IMPROVEMENTS_2026-03.md`](UI_IMPROVEMENTS_2026-03.md): idea banks and product exploration
- [`ui-ux-review.md`](ui-ux-review.md), [`PRD_UI_CLARITY_PASS_2026-03-05.md`](PRD_UI_CLARITY_PASS_2026-03-05.md), [`STORYBOOK_E2E_WORKFLOW_REPORT_2026-03-26.md`](STORYBOOK_E2E_WORKFLOW_REPORT_2026-03-26.md): design and workflow reviews

## Historical Snapshots

- [`originals-from-pr/`](originals-from-pr): verbatim snapshots preserved for comparison; do not treat these as the default source of truth when a canonical or newer working doc exists elsewhere

## Quick Routing

- Looking for app-wide coding rules: go to [`../CLAUDE.md`](../CLAUDE.md)
- Looking for UI verification rules: go to [`../AGENTS.md`](../AGENTS.md)
- Looking for frontend entrypoints: go to [`../src/README.md`](../src/README.md)
- Looking for map-specific UI context: go to [`../src/components/slopcast/FEATURE.md`](../src/components/slopcast/FEATURE.md)
- Looking for adapter or persistence context: go to [`../src/services/FEATURE.md`](../src/services/FEATURE.md)
