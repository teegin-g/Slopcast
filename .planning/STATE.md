# Project State: Slopcast Data Persistence Layer

**Last updated:** 2026-03-05
**Status:** Planning
**Mode:** YOLO

## Project Reference

**Core Value:** All user work—well groups, economic assumptions, scenarios, and calculated results—persists reliably and is accessible to authorized users within their tenant, never lost to browser storage limitations.

**Current Focus:** Roadmap created, ready for phase planning.

## Current Position

**Phase:** None (planning stage)
**Plan:** None
**Status:** Roadmap complete, awaiting plan-phase
**Progress:** [░░░░░░░░░░] 0% (0/3 phases)

## Performance Metrics

**Velocity:** N/A (no phases completed)
**Quality:** N/A (no validation runs)
**Efficiency:** N/A (no work started)

## Accumulated Context

### Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-05 | Use coarse granularity (3 phases) | Config setting, compress research's 6 phases into natural delivery boundaries |
| 2026-03-05 | Security-first phase ordering | RLS policies must be correct from day one, can't be retrofitted safely |
| 2026-03-05 | Migration before CRUD | Preserve existing user work in localStorage, prevent churn on first login |

### Active TODOs

- [ ] Run `/gsd:plan-phase 1` to decompose Schema & Security Foundation
- [ ] Decide: Wells scoped to organization, project, or user? (see research gap)
- [ ] Decide: Store calculated results or recalculate on-demand? (recommend recalculate for MVP)

### Known Blockers

None currently.

### Research Insights

Research completed 2026-03-05 with MEDIUM-HIGH confidence. Key findings:
- Standard Supabase RLS patterns apply, existing migrations provide strong foundation
- Critical pitfalls identified: RLS bypass via service role, missing junction table policies, migration race conditions, demo mode data loss
- Wells table currently allows global read access (violates multi-tenancy) - must fix in Phase 1
- Recommend NOT storing calculated results for MVP (recalculate with useMemo)
- Performance optimization (Phase 5 in research) deferred - document 100-well limit for MVP

## Session Continuity

**What we know:**
- 41 v1 requirements across 6 categories (SEC, WELL, GRP, SCEN, DEAL, AUTO, MIG)
- Existing architecture has strong foundations: RLS policies, repository pattern, TypeScript types, economics engine
- Coarse granularity targets 3-5 phases, we derived 3 natural phases
- Security must come first, migration preserves user work, CRUD builds on solid foundation

**What we need:**
- Detailed plans for Phase 1 (schema tables, RLS policies, helper functions, validation rules)
- Decision on wells table scoping (organization vs project vs user)
- Test strategy for RLS policy coverage and migration race conditions

**Next step:** `/gsd:plan-phase 1`

---
*State initialized: 2026-03-05*
