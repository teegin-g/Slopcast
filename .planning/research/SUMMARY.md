# Project Research Summary

**Project:** Slopcast Multi-Tenant SaaS Persistence
**Domain:** Oil & gas economics modeling SaaS application
**Researched:** 2026-03-05
**Confidence:** MEDIUM-HIGH

## Executive Summary

Multi-tenant SaaS persistence for oil & gas economics follows a well-established pattern: Supabase with PostgreSQL Row-Level Security (RLS) for database-enforced tenant isolation, project-based multi-tenancy where users can own or collaborate on multiple projects, and repository pattern for data access abstraction. The recommended approach leverages existing infrastructure (Supabase client, migrations, RLS helper functions) while avoiding common pitfalls around service role misuse, junction table RLS gaps, and localStorage migration race conditions.

The critical path centers on getting tenant isolation right from the start. The project already has strong foundations (RLS policies with security definer functions, TypeScript types from schema, economics calculations as pure functions). The main risks are: (1) wells table currently allows global read access (violates multi-tenancy), (2) demo-to-live mode transition can lose user work, (3) no validation that RLS policies cover all junction tables. These are preventable with proper schema design, testing, and UX patterns implemented in early phases.

The recommended phasing starts with Schema & RLS foundation (get security right), then Migration & Sync (preserve user work), then CRUD operations with optimistic updates (smooth UX), and finally Demo/Live mode toggle with proper warnings. Performance optimization (Web Workers, backend calculations) can be deferred until real user data proves it's needed. This approach minimizes technical debt and security risk while delivering incremental value.

## Key Findings

### Recommended Stack

The standard 2025-2026 stack for multi-tenant SaaS with Supabase is mature and well-documented. Core technologies are **@supabase/supabase-js 2.98+** (already integrated at v2.95.3, minor upgrade needed), **Supabase CLI 2.76.17+** for migrations and type generation, **PostgreSQL 17** with native RLS for tenant isolation, and **TypeScript 5.8+** for type safety (already in project). The project has most infrastructure in place: migrations directory, RLS policies, helper functions, and generated types.

**Core technologies:**
- **@supabase/supabase-js 2.98+**: Official client with auth/RLS integration — handles JWT context automatically
- **PostgreSQL 17 with RLS**: Database-enforced tenant isolation — impossible to bypass at application layer
- **Supabase CLI**: Type generation from schema — prevents drift between database and TypeScript
- **Repository pattern**: Clean abstraction for data access — enables future migration to Databricks if needed

**Optional additions:**
- **Zod 4.3.6+**: Runtime validation for user inputs (not needed for database types, which are generated)
- **@faker-js/faker 10.3.0+**: Generate realistic test data for seed scripts and fixtures

### Expected Features

Feature landscape divides clearly into table stakes (users expect these in any SaaS), differentiators (competitive advantages), and anti-features (commonly requested but problematic). The MVP must include authentication, tenant isolation, CRUD operations, auto-save, soft delete, basic sharing, and localStorage migration. Demo/Live mode toggle is critical for Slopcast specifically (per PROJECT.md requirements).

**Must have (table stakes):**
- User authentication & organization/tenant isolation (Supabase Auth + RLS)
- CRUD operations on all entities (wells, groups, scenarios, deals)
- Auto-save on changes (debounced persistence, 300ms-1s idle time)
- Data loads on login (fetch tenant data, hydrate workspace)
- Soft delete / archive (deleted_at timestamp, avoid permanent data loss)
- Basic sharing within organization (all org members see org data via RLS)
- LocalStorage migration (one-time import on first auth, preserve existing work)
- Demo/Live mode toggle (switch between mock data and real DB)

**Should have (competitive):**
- Deal templates / presets (save common assumption sets)
- Scenario comparison view (already calculated, needs UI layout)
- Export to Excel/PDF (generate formatted reports)
- Version history / audit trail (who changed what, when)

**Defer (v2+):**
- Bulk import from Excel/CSV (complex parser, validation, error handling)
- Real-time collaboration (WebSocket, CRDT, conflict resolution)
- API for external integrations (Enverus, DrillingInfo)
- Approval workflows (state machine, role-based approvals)

**Anti-features (avoid):**
- Public well data registry (competitive intel leakage, data quality chaos)
- Real-time calculations as user types (CPU thrashing, battery drain)
- Unlimited undo/redo (memory explosion, state complexity)
- Custom fields on all entities (schema explosion, validation nightmare)

### Architecture Approach

Standard multi-tenant SaaS architecture with presentation layer (React pages, UI state), application layer (hooks for business logic, services for data access), data access layer (repository pattern with Supabase client), and persistence layer (Postgres with RLS). The project follows this pattern well: useSlopcastWorkspace hook (862 lines) contains all state/logic, SlopcastPage (230 lines) is pure JSX, utils/economics.ts is deterministic calculations. The adapter pattern isolates external dependencies (Auth: DevBypass vs Supabase, Economics: TypeScript vs Python backend in future).

**Major components:**
1. **Repository layer** (projectRepository, dealRepository) — CRUD abstraction, hides Supabase details, enables future migrations
2. **RLS policies** — Database-enforced tenant isolation using security definer functions (has_project_access, current_project_role)
3. **Optimistic updates with reconciliation** — Instant UI feedback, reconcile temp IDs → server UUIDs on response
4. **Single source of state** — Store minimal state (groups, scenarios), compute derived values (metrics, flow) with useMemo
5. **JSONB for flexible schemas** — type_curve, capex, opex, ownership stored as JSON (evolve without migrations)

**Critical pattern:** Project-based multi-tenancy (not org-based yet). Each project has an owner + optional members with roles (owner/editor/viewer). Wells are currently global (any authenticated user can read) — needs refinement to project-scoped or org-scoped wells.

### Critical Pitfalls

Research identified 10 pitfalls with HIGH impact on security or data integrity. Top 5 must be addressed in Phase 1 (schema design) and Phase 2 (migration logic):

1. **RLS Policies Bypassed by Service Role** — Service role key bypasses ALL RLS policies. Never use in client code or user-facing API. Use authenticated user JWTs. Reserve service role for admin scripts only. Test: verify Tenant A cannot access Tenant B's data.

2. **Missing RLS Policies on Junction Tables** — Junction tables (well_groups_wells, project_members) need tenant_id and RLS policies. JOINs can bypass final result set protection if intermediate tables lack policies. Audit: `SELECT table_name FROM information_schema.tables WHERE table_name NOT IN (SELECT tablename FROM pg_policies)`.

3. **Race Conditions in localStorage Migration** — Multiple tabs can trigger migration simultaneously, causing duplicates. Use migration_status flag in user metadata as distributed lock. Check server-side: if "in_progress", abort and poll. Set atomically before uploading. Test: open two tabs, trigger migration in both, verify no duplicates.

4. **Stale Client Data After RLS Denial** — User removed from org still has cached data. They modify and save. RLS blocks UPDATE, returns 0 rows. Client doesn't check, shows "Saved". Always check `data.length > 0` after UPDATE/DELETE. Show error: "You no longer have access".

5. **Demo Mode Toggle Loses Unsaved Work** — User builds 3 groups in demo mode, toggles to live mode, all work disappears. Warn before switching if demo state exists. Offer export to JSON or auto-migrate to live mode. Test: user acceptance test with demo work.

**Other high-impact pitfalls:**
- **Foreign Key Cascades Delete Live Deals** — Use ON DELETE RESTRICT for deals/scenarios (not CASCADE). Prevent accidental deletion of work products.
- **Large Well Sets Cause Performance Collapse** — Client-side calculations break at 500+ wells. Document 100-well limit for MVP. Use Web Workers or backend for larger sets.
- **Tenant ID Determined by Client Claim** — Never trust client-provided tenant_id. Look up server-side: user_id → user_tenants table → tenant_id.

## Implications for Roadmap

Based on research, suggested phase structure mirrors security-first, incremental-value approach:

### Phase 1: Schema & RLS Foundation
**Rationale:** Security and multi-tenancy correctness must be baked in from start. Retrofitting RLS is expensive and risky. Phase 1 establishes tenant isolation patterns, database schema with proper foreign key rules, and RLS policies on all tables including junctions. This prevents Pitfalls 1, 2, 5, 6, 9.

**Delivers:**
- Complete database schema (projects, project_members, project_groups, project_scenarios, wells, economics_runs)
- RLS policies on every table (including junction tables)
- Helper functions (has_project_access, current_project_role) with SECURITY DEFINER
- Foreign key rules (ON DELETE RESTRICT for deals, CASCADE for junctions)
- Soft delete pattern (archived_at columns)
- Decision: store calculated results vs recalculate (recommend recalculate for MVP)

**Addresses:**
- Authentication & authorization (table stakes)
- Organization/tenant isolation (table stakes)
- Data validation (schema constraints)

**Avoids:**
- Pitfall 1: RLS bypassed by service role (establish authenticated query pattern)
- Pitfall 2: Missing RLS on junction tables (design schema with tenant_id everywhere)
- Pitfall 5: Economics cached without invalidation (decide not to cache for MVP)
- Pitfall 6: Tenant ID from client claim (use server-side user → tenant lookup)
- Pitfall 9: Foreign key cascades (set correct rules from start)
- Pitfall 10: Ownership assumptions (document NRI constraints clearly)

**Research flag:** SKIP research-phase. Standard Supabase RLS patterns, well-documented. Use STACK.md findings directly.

### Phase 2: Migration & Data Sync
**Rationale:** Users have existing work in localStorage. Losing it on first login causes churn. Phase 2 implements one-time migration with locking, idempotency, and error handling. Also builds auto-save persistence (debounced) and hydration (load on auth). This prevents Pitfall 3.

**Delivers:**
- localStorage → Supabase migration with distributed lock (migration_status flag)
- Idempotent migration (detect duplicates by name, update instead of insert)
- Auto-save (debounced persistence in useProjectPersistence hook)
- Hydration (load projects on login, populate workspace state)
- ID reconciliation (temp IDs → server UUIDs)

**Addresses:**
- LocalStorage migration (table stakes)
- Auto-save on changes (table stakes)
- Data loads on login (table stakes)

**Uses:**
- Repository pattern (projectRepository.saveProject, listProjects)
- Optimistic updates with reconciliation (architecture pattern)

**Avoids:**
- Pitfall 3: Migration race conditions (use lock flag, test with concurrent tabs)

**Research flag:** SKIP research-phase. Migration patterns are standard (check-lock-upload-unlock). Implement with existing repository methods.

### Phase 3: CRUD Operations & Error Handling
**Rationale:** With schema and persistence foundation in place, Phase 3 builds out all user-facing CRUD operations. Focus on robust error handling (check rows affected, handle RLS denials), optimistic UI updates for responsiveness, and soft delete (archive instead of hard delete). This prevents Pitfall 4.

**Delivers:**
- Full CRUD for projects, groups, scenarios, wells
- Soft delete UI (archive groups/scenarios, filter archived by default)
- RLS denial handling (check data.length, invalidate cache, show error)
- Optimistic updates for create/update (instant UI feedback)
- Basic sharing (invite members, assign roles)

**Addresses:**
- CRUD operations (table stakes)
- Soft delete / archive (table stakes)
- Basic sharing within org (table stakes)

**Implements:**
- Repository pattern across all entities
- Optimistic updates with reconciliation (architecture component)

**Avoids:**
- Pitfall 4: Stale client data after RLS denial (validate UPDATE affected rows)
- Pitfall 9: Foreign key cascades (UI prevents deletion of referenced entities)

**Research flag:** SKIP research-phase. Standard repository CRUD patterns, use ARCHITECTURE.md guidance on RLS integration.

### Phase 4: Demo/Live Mode Toggle
**Rationale:** Critical for Slopcast per PROJECT.md. Users need to experiment with mock data (demo mode) and switch to real persistence (live mode). Phase 4 implements mode toggle with safeguards: warn before switching if unsaved demo work exists, offer export to JSON, or auto-migrate demo work to live. This prevents Pitfall 8.

**Delivers:**
- Mode toggle UI (switch between demo and live)
- Warning dialog if demo work exists ("Export or discard?")
- Export demo work to JSON (download)
- Optional: auto-migrate demo work to live mode on first auth
- Demo mode uses localStorage, live mode uses Supabase

**Addresses:**
- Demo/Live mode toggle (table stakes for Slopcast)

**Uses:**
- useProjectPersistence hook with `enabled` flag (demo: false, live: true)
- Existing localStorage fallback pattern (already implemented)

**Avoids:**
- Pitfall 8: Demo mode toggle loses unsaved work (warn and export)

**Research flag:** SKIP research-phase. Straightforward UX implementation, leverage existing localStorage persistence.

### Phase 5: Performance Optimization (if needed)
**Rationale:** Defer until real user data proves it's needed. Phase 5 adds optimizations for large well sets (>100 wells): map clustering, virtualized lists, Web Worker for economics calculations, and optionally backend Python service. Phase 1 documents 100-well limit; Phase 5 lifts it if users demand it. This prevents Pitfall 7.

**Delivers:**
- Map clustering (Leaflet.markercluster) for 500+ wells
- Virtualized well lists (react-window) for large datasets
- Web Worker for economics calculations (non-blocking UI)
- Optional: Python FastAPI backend for heavy calculations
- Performance monitoring (Lighthouse, Time to Interactive)

**Addresses:**
- Performance for typical datasets (table stakes, but with documented limits)

**Avoids:**
- Pitfall 7: Performance collapse (enforce limits in Phase 1, lift in Phase 5 if validated)

**Research flag:** LIKELY NEEDS RESEARCH. If backend Python service is required, research FastAPI + NumPy patterns, input/output serialization, caching strategies.

### Phase 6: Advanced Features (v1.x+)
**Rationale:** Add after MVP validation. These features have clear user value but aren't blocking launch. Phase 6 includes deal templates, scenario comparison UI, version history, and export to Excel/PDF.

**Delivers:**
- Deal templates / presets (save common assumptions, clone)
- Scenario comparison view (side-by-side NPV/IRR)
- Version history / audit trail (event log, snapshot diffs)
- Export to Excel/PDF (formatted reports)

**Addresses:**
- Deal templates (should have, differentiator)
- Scenario comparison (should have, competitive)
- Version history (should have, enhances soft delete)
- Export (should have, competitive)

**Research flag:** SKIP for templates/comparison (standard patterns). LIKELY NEEDS RESEARCH for version history (event sourcing, snapshot strategies) and export (PDF generation libraries, template engines).

### Phase Ordering Rationale

- **Schema first (Phase 1) because security can't be retrofitted.** RLS policies, foreign key rules, and tenant isolation patterns must be correct from day one. Changing RLS policies with live user data is risky (potential data leak during migration).

- **Migration before CRUD (Phase 2 before 3) to preserve existing user work.** Users expect their localStorage data to persist when they log in for the first time. Losing it causes churn. Migration must be rock-solid (locking, idempotency) before building full CRUD.

- **Demo/Live mode (Phase 4) after basic persistence (Phases 1-3) because it depends on stable CRUD.** Mode toggle is essentially "swap data source" (localStorage vs Supabase). Both sources must work reliably before adding toggle.

- **Performance optimization (Phase 5) deferred until validated.** Don't optimize prematurely. Document 100-well limit in Phase 1. If users hit limits and complain, Phase 5 addresses it. If they don't, skip it.

- **Advanced features (Phase 6) only after MVP validated.** Deal templates, version history, and export are valuable but not blocking. Ship core persistence, get user feedback, then prioritize Phase 6 features based on demand.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 5 (Performance Optimization):** If backend Python service is required, research FastAPI integration patterns, NumPy calculation optimization, input hashing for caching, and deployment (Docker, serverless vs long-running).
- **Phase 6 (Version History):** Research event sourcing patterns, snapshot strategies (full vs incremental), storage costs, and UI for browsing diffs.
- **Phase 6 (Export to PDF):** Research PDF generation libraries (Puppeteer, jsPDF, PDFKit), template engines, and server-side rendering for complex layouts.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Schema & RLS):** Well-documented Supabase RLS patterns. Use STACK.md and ARCHITECTURE.md findings directly.
- **Phase 2 (Migration):** Standard migration patterns (check-lock-upload-unlock). Implement with existing repository methods.
- **Phase 3 (CRUD):** Standard repository CRUD + optimistic updates. ARCHITECTURE.md provides clear patterns.
- **Phase 4 (Demo/Live Mode):** Straightforward UX + conditional data source. Leverage existing localStorage hooks.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified via npm registry 2026-03-05. Supabase patterns validated against existing migrations. All recommended dependencies are stable. |
| Features | MEDIUM | MVP features clearly defined, but validation with real oil & gas users recommended. Competitor analysis based on 2024-2025 knowledge (may be outdated). |
| Architecture | MEDIUM-HIGH | Patterns (RLS, repository, optimistic updates) are well-established and validated against existing codebase. Scaling thresholds are estimates (need validation with real data). |
| Pitfalls | MEDIUM | Based on training data (multi-tenant SaaS, Postgres RLS, oil & gas domain). Cannot verify against current 2026 Supabase docs (web tools unavailable). Pitfalls are standard industry issues. |

**Overall confidence:** MEDIUM-HIGH

Research is solid for established patterns (RLS, repositories, multi-tenancy). Lower confidence on domain-specific features (ownership models, joint ventures) and current best practices (2026 Supabase docs unavailable). Recommended to validate with oil & gas domain experts and review current Supabase security guides before Phase 1.

### Gaps to Address

**Wells table tenant isolation:** Current schema has wells table with global read access (any authenticated user). This violates multi-tenancy. **Decision needed in Phase 1:** Wells scoped to organization, project, or user? Recommendation: organization-scoped (add organization_id to wells, RLS policy filters by user's org). This requires adding organizations table and user → org mapping.

**Ownership assumptions complexity:** Current Ownership type has NRI + cost interest. Real oil & gas deals need working interest % + royalty burden. **Decision for Phase 1:** Document NRI as "net to buyer after all burdens" (simpler model). **Phase 3+ enhancement:** Add working interest model if users request it. Validate with real deal data from target users.

**Calculated results storage strategy:** Economics calculations are fast (<100ms for 40 wells client-side). **Decision for Phase 1:** Don't store calculated DealMetrics. Recalculate on-demand with useMemo. If performance degrades (>2s for large well sets), Phase 5 adds caching with input hash invalidation. This avoids Pitfall 5 (stale cached data).

**Demo mode persistence scope:** Should demo work persist across browser sessions (localStorage) or be ephemeral (memory only)? **Recommendation for Phase 4:** Persist to localStorage (already implemented in useProjectPersistence fallback). Users can return to demo work. Mode toggle just switches data source, doesn't clear state.

**Real-time collaboration timing:** Research identifies real-time collaboration as HIGH complexity, LOW immediate value. **Decision:** Defer to v2+ (Phase 7+). Not blocking for launch. Revisit after users report "multiple people editing same deal is painful." Supabase Realtime infrastructure exists (subscriptions, broadcast), but conflict resolution is hard.

## Sources

### Primary (HIGH confidence)
- npm registry (direct queries) — @supabase/supabase-js 2.98.0, Supabase CLI 2.76.17, verified 2026-03-05
- Existing project codebase — migrations (20+ RLS policies), supabase/config.toml (Postgres 17), package.json, useSlopcastWorkspace hook, repository pattern implementations
- CLAUDE.md, PROJECT.md — project requirements, constraints, existing architecture

### Secondary (MEDIUM confidence)
- Training data (as of January 2025) — Multi-tenant SaaS patterns, Postgres RLS best practices, Supabase documentation patterns
- Oil & gas domain knowledge (training data) — Aries, PHDWin, Combocurve competitor analysis, lease ownership structures, working interest vs NRI

### Tertiary (LOW confidence)
- Web search/fetch unavailable during research — Could not verify current 2026 Supabase documentation, current competitor feature sets, or recent oil & gas software trends

**Verification recommended:**
- Review current Supabase RLS documentation (2026) for any pattern changes
- Survey target users (oil & gas professionals) for feature expectations and ownership model validation
- Audit Combocurve (closest competitor) for recent feature additions
- Test LocalStorage migration with real user data (diverse localStorage states, edge cases)
- Benchmark economics calculation time with realistic well counts (100, 200, 500 wells)

---
*Research completed: 2026-03-05*
*Ready for roadmap: yes*
