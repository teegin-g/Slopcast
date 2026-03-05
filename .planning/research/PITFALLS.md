# Pitfalls Research

**Domain:** Multi-tenant SaaS persistence for oil & gas deal modeling
**Researched:** 2026-03-05
**Confidence:** MEDIUM (based on training data, web tools unavailable for verification)

## Critical Pitfalls

### Pitfall 1: RLS Policies Bypassed by Service Role

**What goes wrong:**
Supabase service role key bypasses ALL row-level security policies. Backend code using service role accidentally exposes data across tenant boundaries. A bug in filtering logic allows Tenant A to see Tenant B's wells, deals, or economic assumptions.

**Why it happens:**
Developers use service role for convenience during development ("it just works without RLS complexity"). They intend to add tenant filtering in application code but miss edge cases. Service role becomes the default, and proper RLS-enforced queries are never implemented.

**How to avoid:**
- **Never use service role key in client-side code or backend API endpoints that serve user requests**
- Use authenticated user JWTs for all user-facing queries (respects RLS automatically)
- Reserve service role ONLY for admin scripts, migrations, and background jobs that explicitly need cross-tenant access
- Add integration tests that verify Tenant A cannot access Tenant B's data via API endpoints
- In development, use authenticated test users, not service role shortcuts

**Warning signs:**
- Backend code has `SUPABASE_SERVICE_ROLE_KEY` in API route handlers
- Queries use `.from('wells')` without explicit `.eq('tenant_id', ...)` filters when using service role
- Integration tests mock authentication instead of using real JWTs
- "Works in dev but RLS errors in prod" — suggests dev uses service role, prod uses authenticated users

**Phase to address:**
Phase 1 (Schema & RLS foundation) — establish RLS policies and authenticated query patterns from day one

---

### Pitfall 2: Missing RLS Policies on JOIN Tables

**What goes wrong:**
RLS policies exist on `wells` and `scenarios`, but not on `well_groups_wells` junction table. A user queries well_groups, joins to wells via junction table, and retrieves wells from other tenants because the junction table has no tenant_id column or RLS policy.

**Why it happens:**
Developers focus RLS on "main" tables and forget that junction tables, lookup tables, and reference tables also need protection. Postgres JOIN operations can bypass RLS on the final result set if intermediate tables lack policies.

**How to avoid:**
- **Every table that references tenant-scoped data MUST have tenant_id column and RLS policies**
- Junction tables (`well_groups_wells`, `scenario_wells`, etc.) need tenant_id even though it's denormalized
- Lookup tables (if shared across tenants) need explicit "readable by all authenticated users" policies
- Run a schema audit: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN (SELECT tablename FROM pg_policies);` to find tables without RLS policies
- Test queries that JOIN across multiple tables with different tenant users

**Warning signs:**
- Schema has junction tables without tenant_id column
- `EXPLAIN` output shows sequential scans on junction tables without tenant_id filter
- Users report seeing incorrect well counts or phantom data in well groups
- RLS policies exist on parent tables but not M2M join tables

**Phase to address:**
Phase 1 (Schema & RLS foundation) — design schema with tenant_id on ALL user-scoped tables, including junctions

---

### Pitfall 3: Race Conditions in localStorage → Database Migration

**What goes wrong:**
User opens app in two browser tabs. Tab 1 starts localStorage migration, uploads wells and groups to Supabase. Tab 2 (loaded 2 seconds later) sees empty Supabase state, assumes migration not started, and uploads DIFFERENT localStorage state (older version). Result: duplicated or lost data, or Tab 2 overwrites Tab 1's migration.

**Why it happens:**
Migration logic checks "is Supabase empty?" → YES → upload localStorage. No distributed lock. Multiple tabs race. LocalStorage itself has no transaction isolation across tabs (different storage events, but reads/writes not atomic).

**How to avoid:**
- **Use a migration_status flag in user metadata (Supabase auth.users.user_metadata) as a distributed lock**
- Check migration_status FIRST (server-side). If "in_progress", abort and poll. If "completed", skip migration.
- Set migration_status = "in_progress" atomically before uploading data
- Use Supabase transactions to batch-insert wells/groups atomically
- After successful migration, set migration_status = "completed"
- Add idempotency: if duplicate wells exist (by name + tenant), update instead of insert
- Test with Playwright: open two tabs simultaneously, trigger migration in both, verify no duplicates

**Warning signs:**
- Migration code uses `const data = await supabase.from('wells').select(); if (data.length === 0) { upload(); }`
- No locking mechanism (flags, semaphores, or server-side enforcement)
- User reports seeing duplicate well groups after migration
- Error logs show unique constraint violations during migration

**Phase to address:**
Phase 2 (Migration & data sync) — implement migration logic with locking and idempotency

---

### Pitfall 4: Stale Client-Side Data After RLS Denial

**What goes wrong:**
User removes a coworker from their tenant. Coworker's browser still has cached wells/groups in React state. They navigate to a deal, UI renders it successfully (from cache), they modify assumptions and hit SAVE. Supabase RLS policy blocks the UPDATE, returns 0 rows updated. Client-side code doesn't check response, shows "Saved successfully" toast. User believes their changes persisted, but they didn't.

**Why it happens:**
Optimistic UI updates assume success. RLS policy denials return HTTP 200 with empty result set (not an error). Client code doesn't validate that UPDATE/DELETE affected >0 rows. User's auth token is still valid (not expired), so no auth error — just silent RLS denial.

**How to avoid:**
- **Always check rows affected after INSERT/UPDATE/DELETE**
- Supabase client returns `{ data, error }`. Check `error` AND `data.length`
- For UPDATE: `const { data, error } = await supabase.from('wells').update(...).eq('id', wellId); if (error || data.length === 0) { throw new Error('Update denied or row not found'); }`
- Show user-friendly error: "You no longer have access to this resource"
- Invalidate cached data on RLS denial — force refetch from server
- Use Supabase Realtime subscriptions to detect when user loses access (listen for DELETE events on their permissions)

**Warning signs:**
- Update logic doesn't check `data.length` after `.update()`
- UI shows "Saved" toast immediately without awaiting database confirmation
- Users report "phantom edits" — changes they made disappeared after refresh
- No error handling for RLS policy violations (silent failures)

**Phase to address:**
Phase 3 (CRUD operations & error handling) — implement robust response validation and user feedback

---

### Pitfall 5: Economics Calculations Stored Without Invalidation Logic

**What goes wrong:**
System stores calculated DealMetrics (NPV, IRR, EUR) in `deals` table to avoid recalculating. User updates oil price in scenario from $75 to $85. Scenario row updates, but stored DealMetrics are NOT invalidated. User sees stale NPV ($5.2M) when it should be $6.1M. They make business decisions based on wrong numbers.

**Why it happens:**
Caching trade-off: calculating economics for 500-well groups is expensive (100ms+ client-side). Storing results is tempting. But invalidation is hard: DealMetrics depend on wells, well_groups, scenarios, type_curves, capex, opex, ownership, pricing, schedule. Any change to any dependency requires recalculation. Developers forget to add invalidation triggers for all dependencies.

**How to avoid:**
- **Option A (recommended): Don't store calculated results. Recalculate on demand.**
  - Store only inputs (wells, assumptions, scenarios)
  - Calculate DealMetrics client-side in `useDerivedMetrics` hook (already exists)
  - For large well sets (>100 wells), use Web Workers or Wasm for fast calculation
  - If performance is inadequate, optimize calculation code BEFORE adding caching
- **Option B (if caching required): Implement robust invalidation**
  - Add `calculated_at` timestamp and `inputs_hash` to `deals` table
  - Hash all inputs (wells, assumptions, scenario) → store hash
  - On fetch, recalculate hash → compare → if mismatch, recalculate and update
  - Use Postgres triggers: UPDATE on `scenarios` → set `deals.inputs_hash = NULL` for affected deals
  - Test invalidation: change every input type, verify calculated results update

**Warning signs:**
- Schema has `npv_10`, `irr`, `eur` columns in `deals` table
- No invalidation logic (triggers, hash checks, or recalculation on mismatch)
- Users report "numbers don't update" or "refresh fixes it"
- Code comments say "TODO: add invalidation"

**Phase to address:**
Phase 1 (Schema design) — decide store vs. recalculate. If storing, design invalidation BEFORE implementing.

---

### Pitfall 6: Tenant ID Determined by Client Claim

**What goes wrong:**
Backend API extracts tenant_id from JWT claim: `const tenantId = jwt.tenant_id;`. Malicious user modifies their JWT (or replays another user's JWT) to change tenant_id claim. They gain access to other tenant's data. Postgres RLS policies trust the tenant_id from JWT, so data leaks.

**Why it happens:**
JWT claims are signed, but client-provided. If backend doesn't validate signature properly, or if tenant_id is a custom claim not validated by auth provider, attackers can tamper. Supabase auth.users table has user_id, but tenant_id is often stored in user_metadata or a separate tenants table. If mapping isn't enforced server-side, client can spoof it.

**How to avoid:**
- **Tenant ID must be determined SERVER-SIDE via auth.users lookup**
- Flow: Extract user_id from JWT (validated by Supabase) → query `user_tenants` table → get tenant_id
- Never trust client-provided tenant_id (query param, header, or custom JWT claim)
- Supabase RLS policies should use `auth.uid()` and join to `user_tenants` table: `tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())`
- Multi-tenant users (access to multiple tenants) should explicitly SELECT a tenant per session, stored server-side
- Audit logs should record tenant switches (detect suspicious behavior)

**Warning signs:**
- RLS policies use `(current_setting('app.tenant_id'))` without validating it's set by trusted backend
- API routes accept `tenantId` as query param or request body
- No `user_tenants` junction table — tenant_id is a user_metadata field (easy to tamper)
- JWT has custom `tenant_id` claim added by client code, not auth provider

**Phase to address:**
Phase 1 (Schema & RLS foundation) — design user-tenant relationship and RLS policies correctly from start

---

### Pitfall 7: Large Well Sets Cause Client-Side Performance Collapse

**What goes wrong:**
User imports 2,000 wells from their private database. UI renders well map with 2,000 markers. Browser freezes for 10 seconds. User drags to create a well group (500 wells). Economics calculation runs client-side in `utils/economics.ts`. 500 wells × 360 months = 180,000 monthly calculations. Browser tab crashes or becomes unresponsive.

**Why it happens:**
Mock data has 40 wells — system optimized for that scale. No pagination, virtualization, or backend calculation for large datasets. TypeScript economics engine is synchronous (blocks UI thread). Users with real data have 10x-100x more wells than mock data.

**How to avoid:**
- **Phase 1 constraint: Support up to 100 wells per group (documented limit)**
- UI should warn when well group exceeds 100 wells: "Large well groups may cause slow performance. Consider splitting."
- Map: Use clustering (Leaflet.markercluster) — show "50 wells" cluster icon instead of 50 markers
- Well selection: Virtualize well list (react-window) — render only visible rows
- Economics calculation: Move to Web Worker for groups >50 wells (non-blocking)
- **Phase 2 optimization (if needed): Backend Python service for calculation**
  - Send wells + assumptions to FastAPI endpoint
  - Python calculates economics (NumPy is 10x faster than TypeScript loops)
  - Return only aggregated DealMetrics, not monthly arrays (reduce payload size)
- Test with 500-well dataset in Playwright, measure Time to Interactive

**Warning signs:**
- No well count limit in UI
- `useSlopcastWorkspace` hook runs economics synchronously in useEffect (blocks render)
- No virtualization on well lists
- Users report "app freezes when selecting many wells"
- Lighthouse performance score drops below 50 with large datasets

**Phase to address:**
Phase 1 (MVP constraints) — document limits and enforce them. Phase 3+ (optimization) — Web Workers, backend calculation.

---

### Pitfall 8: Demo Mode Toggle Loses Unsaved Work

**What goes wrong:**
User experiments in demo mode (unauthenticated, using mock data). They build 3 well groups, configure detailed assumptions, run scenarios. Satisfied, they toggle to live mode and log in. All demo work disappears — UI loads empty state from Supabase. User expected demo work to migrate or persist.

**Why it happens:**
Demo mode state lives in memory (React hook). Live mode state loads from Supabase. No migration path between modes. Toggle switch immediately replaces state without warning. Users assume mode is just a "data source preference," not realizing it switches entire state trees.

**How to avoid:**
- **Option A: Warn before switching modes if demo state exists**
  - Detect unsaved demo work: `demoGroups.length > 0 || scenarios.length > 0`
  - Show modal: "You have unsaved work in demo mode. Switching to live mode will discard it. Export or cancel?"
  - Provide "Export demo work" button → download JSON
  - After export, user can import into live mode (separate feature)
- **Option B: Auto-migrate demo work to live mode on first auth**
  - On login, check if localStorage has demo state
  - If YES, prompt: "Import your demo work into live mode?"
  - If accepted, create well groups / scenarios in Supabase (tagged as "Imported from demo")
  - Clear localStorage demo state
- **Option C: Persist demo state across sessions**
  - Demo mode uses localStorage (already exists via useProjectPersistence)
  - Mode toggle doesn't clear state — just changes data source
  - Demo and live state coexist (separate localStorage keys)
  - Users can switch back to demo mode and see their demo work

**Warning signs:**
- Mode toggle is a switch/button with no confirmation dialog
- No UX for exporting demo work
- User testing feedback: "I lost my work when I logged in"
- No localStorage persistence for demo mode (state only in memory)

**Phase to address:**
Phase 2 (Mode toggle UX) — implement warning dialog and export option BEFORE enabling live mode

---

### Pitfall 9: Foreign Key Cascades Delete Live Deal Data

**What goes wrong:**
User deletes a well from database. Postgres foreign key has `ON DELETE CASCADE`. Well deletion cascades to `well_groups_wells`, then to `well_groups`, then to `deals`. User intended to remove one well from analysis, but accidentally deleted 15 active deals referencing that well group. No undo, no warning.

**Why it happens:**
Developers add `ON DELETE CASCADE` for convenience during development (makes cleanup easy). They don't consider user intent: deleting a well should remove it from groups, but not delete the groups themselves. Oil & gas domain: wells are inputs, deals are valuable work products. Users expect deals to persist even if underlying data changes.

**How to avoid:**
- **Wells → Well Groups: `ON DELETE CASCADE` (acceptable — removing well from group is expected)**
- **Well Groups → Deals: `ON DELETE RESTRICT` (prevent deletion if deals reference this group)**
  - User must explicitly delete deals first, then well groups
  - OR: UI provides "Archive well group" (soft delete: set `archived_at` timestamp) — deals still reference it
- **Scenarios → Deals: `ON DELETE RESTRICT` (same reasoning — scenario is input to deal)**
- Add soft delete pattern for critical entities: `archived_at` column, filter `WHERE archived_at IS NULL` in queries
- UI: "Delete Well Group" → check for dependent deals → show warning: "3 deals use this group. Archive instead?"
- Test: Create deal → delete well → verify deal still exists

**Warning signs:**
- Schema has `ON DELETE CASCADE` on deal foreign keys
- No soft delete columns (`archived_at`, `deleted_at`)
- No FK constraint enforcement (users can delete parents freely)
- Users report "deals disappeared" after data cleanup

**Phase to address:**
Phase 1 (Schema design) — set correct cascade rules and soft delete patterns from start

---

### Pitfall 10: Ownership Assumptions Don't Handle Joint Ventures

**What goes wrong:**
Slopcast data model has `Ownership` type: `{ nri: number, costInterest: number }`. User models a joint venture: Company A owns 60%, Company B owns 40%, both pay proportional costs. They try to create a deal with 60% NRI, 60% cost interest. But the well group they're buying has wells with EXISTING ownership (lease burdens): working interest 75%, NRI 60% (after royalties). User's "60% of 75%" is actually 45% working interest, 36% NRI. Economic calculations use the wrong base, NPV is overstated by 40%.

**Why it happens:**
Slopcast assumes ownership is absolute (NRI as entered). But in oil & gas, ownership is often LAYERED:
- Mineral rights → Royalty burden → Working interest → Cost sharing
- Deals buy a % of working interest, not absolute NRI
- Type curves are typically "gross" (100% basis) or "net to working interest"
Reality: Ownership is complex, and users expect the tool to handle working interest %s, not just NRI.

**How to avoid:**
- **Phase 1 constraint: Document that ownership is "net to the buyer" (absolute NRI after all burdens)**
- Clearly label inputs: "Net Revenue Interest (%)" not just "NRI" (users assume it's % of WI)
- Add tooltip: "Enter YOUR net revenue interest after all lease burdens, not your % of working interest"
- **Phase 2 enhancement: Support working interest % and royalty burden separately**
  - Extend `Ownership` type: `{ workingInterest: number, royaltyBurden: number, nri: number (calculated), costInterest: number }`
  - Calculate NRI = workingInterest × (1 - royaltyBurden)
  - UI: "You're buying 60% of 75% working interest (15% royalty burden) = 45% WI, 38.25% NRI"
- Validate against industry sources: IHS Markit, Enverus data (they provide WI + NRI separately)
- Test with real deal data from oil & gas professional

**Warning signs:**
- User feedback: "numbers don't match my spreadsheet"
- Ownership input is single NRI field (no WI/royalty breakdown)
- No examples or tooltips explaining what NRI means in context
- Type curve is ambiguous (gross vs net)

**Phase to address:**
Phase 1 (MVP): Document constraints clearly. Phase 3+ (domain depth): Add working interest model.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store calculated DealMetrics in database | Faster load times, no recalculation | Invalidation logic required, stale data risk, complex cache coherence | Only if calculation >1 second AND invalidation is robust |
| Use service role key for backend queries | No RLS complexity, simpler code | Bypasses all security, one bug leaks all tenant data | Never in production API endpoints |
| Client-side tenant ID from JWT claim | Easy to implement, no server lookups | Spoofable if not validated, security risk | Only if auth provider validates claim server-side |
| ON DELETE CASCADE for all foreign keys | Easy cleanup during development | Accidental data loss, no undo | Only for junction tables, never for user work products |
| Single-tenant schema first, multi-tenant later | Faster MVP development, less upfront complexity | Requires schema rewrite, data migration, HIGH refactor cost | Never if multi-tenancy is a requirement from day one (it is) |
| No soft deletes (hard DELETE) | Simpler schema, no archived_at columns | No audit trail, no undo, no "recently deleted" feature | Only for ephemeral data (sessions, tokens), never for user content |
| LocalStorage as primary persistence | No backend required, works offline | Lost on browser clear, not shareable, no multi-device sync | Only for demo mode or prototype, never for live mode |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS | Forgetting to enable RLS: `ALTER TABLE wells ENABLE ROW LEVEL SECURITY;` | Enable RLS on ALL tables, even lookup tables (set "allow all read" policy if needed) |
| Supabase Auth | Using `session.user.id` directly as tenant_id | Use `user_id` to lookup tenant from `user_tenants` table — user_id ≠ tenant_id |
| Supabase Realtime | Subscribing to `postgres_changes` without RLS — sees all tenants | Realtime respects RLS only if subscription filter includes tenant_id: `.on('postgres_changes', { event: '*', schema: 'public', table: 'wells', filter: `tenant_id=eq.${tenantId}` })` |
| PostgreSQL JSON columns | Storing entire well group as JSON in single column (no querying) | Use relational tables for queryable fields, JSON only for opaque blobs (e.g., UI state) |
| TypeScript → Supabase types | Manually writing types, diverging from database schema | Auto-generate types: `npx supabase gen types typescript --local > src/types/supabase.ts` and import |
| Economics calculation | Running synchronous loop over 500 wells in React render | Use Web Worker or move to useEffect + loading state, or backend calculation service |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No indexes on tenant_id | Slow queries as database grows (200ms → 5s) | Add `CREATE INDEX idx_wells_tenant ON wells(tenant_id);` on all tenant-scoped tables | >10,000 rows per table |
| N+1 queries (fetch wells, then fetch type curve for each) | Hundreds of queries on page load, 3+ second load time | Use Supabase `.select('*, type_curve(*)')` to join in single query | >50 wells in view |
| Loading all wells for map, no pagination | Initial load fetches 2,000 wells, 5MB payload, 10s parse time | Fetch only wells in map viewport: `.gte('lat', minLat).lte('lat', maxLat)...` | >500 wells total |
| Client-side economics calculation on large datasets | UI freezes for 10+ seconds, browser "Page Unresponsive" warning | Move calculation to Web Worker, or limit well group size to 100 | >200 wells in single group |
| No database connection pooling | "Too many connections" errors under load, API errors | Use Supabase connection pooler (default) or PgBouncer | >20 concurrent users |
| Storing monthly cash flow arrays (360 months × 500 wells = 180k rows) | Multi-MB payloads, slow serialization/deserialization | Store only aggregated metrics (NPV, IRR), recalculate monthly arrays on demand | >100 wells per deal |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No RLS policy on table | Complete data leak — all users see all tenants' data | Enable RLS on every table, test with multiple test tenants |
| RLS policy has logic bug (`tenant_id = auth.uid()` instead of join to user_tenants) | Users can't access their own data, or see wrong tenant | Write RLS policy tests: create 2 tenants, verify Tenant A can't query Tenant B's rows |
| Service role key committed to Git | Anyone with repo access has full database access (bypass RLS) | Use environment variables, add `*.env` to .gitignore, rotate keys if leaked |
| No rate limiting on auth endpoints | Brute force attacks on login, password reset spam | Use Supabase rate limiting, add CAPTCHA for sensitive endpoints |
| Client-side validation only (no server-side checks) | Users bypass validation via browser DevTools or API calls | Validate all inputs in Supabase RLS policies or Postgres CHECK constraints |
| Logging sensitive data (well names with GPS coords in public logs) | Competitors scrape logs to discover drilling locations | Redact lat/lng in logs, or encrypt well locations at rest |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Mode toggle loses unsaved work | Users lose hours of demo work when logging in → frustration, churn | Warn before switching modes, offer export, or auto-migrate demo work |
| No feedback on RLS denial | User saves deal, sees "Saved" toast, but update failed (silent) → data loss perception | Check rows affected, show error: "You no longer have access to this resource" |
| Economics results don't update after input change | User changes oil price, NPV doesn't update → distrust in tool accuracy | Either recalculate immediately (reactive), or show "Recalculate" button with stale indicator |
| Well map shows 2,000 pins (no clustering) | Browser freezes, map unusable → user abandons workflow | Use marker clustering (Leaflet.markercluster), or viewport-based loading |
| No undo for destructive actions | User accidentally deletes well group with 10 deals → permanent loss → support escalation | Soft delete (archive), or "Undo" toast for 10 seconds before committing DELETE |
| Overwhelming assumptions UI (30+ fields on one page) | Analysis paralysis, users don't know what to fill in → abandon | Progressive disclosure: show defaults, "Customize assumptions" expands detailed form |

---

## "Looks Done But Isn't" Checklist

- [ ] **RLS Policies:** All tables have `ENABLE ROW LEVEL SECURITY` — verify `SELECT * FROM pg_tables WHERE rowsecurity = false AND schemaname = 'public';` returns no rows
- [ ] **RLS Policy Coverage:** Every user-scoped table has at least one policy (SELECT, INSERT, UPDATE, DELETE) — audit with `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (SELECT tablename FROM pg_policies);`
- [ ] **Tenant Isolation Tests:** Integration tests verify Tenant A cannot read/write Tenant B's data — test all tables, not just wells
- [ ] **Migration Idempotency:** Running localStorage → Supabase migration twice doesn't duplicate data — test with same user, multiple browsers
- [ ] **Foreign Key Cascade Rules:** Critical tables (deals, scenarios, well_groups) have `ON DELETE RESTRICT` — verify with `SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';`
- [ ] **Error Handling for RLS Denials:** UPDATE/DELETE check `data.length > 0` and show user error — test by revoking user access mid-session
- [ ] **Performance with Large Datasets:** Test with 500+ wells — map, list, calculations — verify no UI freeze (Time to Interactive <3s)
- [ ] **Service Role Not in Client Code:** Search codebase for `SERVICE_ROLE_KEY` — should only appear in backend admin scripts, never in frontend or API routes
- [ ] **Soft Delete Implementation:** Critical tables have `archived_at` column, queries filter `WHERE archived_at IS NULL` — verify "delete" actions archive, not hard delete
- [ ] **Type Safety (DB ↔ TS):** Types auto-generated from Supabase schema — verify `npm run typecheck` catches mismatches after schema changes

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS policies missing/wrong → data leak | HIGH — manual audit required | 1. Immediately revoke all user access (disable API). 2. Audit database logs for cross-tenant queries. 3. Notify affected customers. 4. Add correct RLS policies. 5. Run tenant isolation tests. 6. Re-enable access. |
| Service role exposed in Git | HIGH — assume full compromise | 1. Rotate service role key in Supabase dashboard. 2. Audit database for unauthorized changes. 3. Review commit history for other secrets. 4. Add secret scanning (GitGuardian, TruffleHog). 5. Update all services with new key. |
| Migration race condition → duplicates | MEDIUM — data cleanup required | 1. Identify duplicate deals/groups via SQL: `SELECT name, COUNT(*) FROM well_groups GROUP BY name HAVING COUNT(*) > 1;`. 2. User review: which is correct? 3. Merge or delete duplicates. 4. Add idempotency to migration logic. 5. Test with concurrent tabs. |
| Cascading delete → lost deals | HIGH — no undo, requires backup restore | 1. Restore from most recent backup (Supabase Point-in-Time Recovery). 2. User review: which deals were lost? 3. Change FK to `ON DELETE RESTRICT`. 4. Add soft delete pattern. 5. Test delete workflows. |
| Stored DealMetrics stale (no invalidation) | LOW — recalculate and update | 1. Add `recalculated_at` timestamp to deals table. 2. Run migration: `UPDATE deals SET recalculated_at = NULL;` (force recalc on next load). 3. Implement invalidation logic. 4. Optionally: drop calculated columns, recalculate on demand. |
| Performance collapse (2000 wells) | MEDIUM — requires optimization | 1. Immediate: Add well count limit (100 per group). 2. UI warning for large groups. 3. Add map clustering. 4. Move calculation to Web Worker. 5. Longer term: Backend calculation service. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS Policies Bypassed by Service Role | Phase 1: Schema & RLS | Integration test: query with service role vs authenticated user, verify different results |
| Missing RLS Policies on JOIN Tables | Phase 1: Schema & RLS | SQL audit: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (SELECT tablename FROM pg_policies);` |
| Race Conditions in Migration | Phase 2: Migration & Sync | Playwright test: open 2 tabs, trigger migration simultaneously, count DB rows (should match localStorage) |
| Stale Client-Side Data After RLS Denial | Phase 3: CRUD Operations | Integration test: revoke user access, attempt UPDATE, verify error shown and cache invalidated |
| Economics Calculations Stored Without Invalidation | Phase 1: Schema Design | Decision checkpoint: store vs recalculate. If storing, implement hash-based invalidation before Phase 3 |
| Tenant ID Determined by Client Claim | Phase 1: Schema & RLS | Penetration test: modify JWT tenant_id claim, verify queries still respect user's actual tenant |
| Large Well Sets Cause Performance Collapse | Phase 1: MVP Constraints | Lighthouse test with 500-well dataset, verify Time to Interactive <3s, or enforce 100-well limit |
| Demo Mode Toggle Loses Unsaved Work | Phase 2: Mode Toggle UX | User acceptance test: build demo work, toggle mode, verify warning shown or work migrated |
| Foreign Key Cascades Delete Live Deal Data | Phase 1: Schema Design | SQL audit: `SELECT * FROM information_schema.referential_constraints WHERE delete_rule = 'CASCADE';` verify only junction tables |
| Ownership Assumptions Don't Handle Joint Ventures | Phase 1: MVP (document constraint) Phase 3+: Domain Depth | User acceptance test with real deal data, verify NPV matches user's spreadsheet |

---

## Sources

**Note:** Web search and documentation fetch tools were unavailable during research. The pitfalls documented here are based on:
- **Training data knowledge** (as of January 2025) of multi-tenant SaaS architecture, PostgreSQL RLS patterns, and Supabase best practices
- **Oil & gas domain knowledge** from training data (lease ownership structures, joint ventures, working interest vs NRI)
- **Generic SaaS persistence patterns** (caching invalidation, migration strategies, soft deletes)

**Confidence Level: MEDIUM**
- These are well-established patterns in the multi-tenant SaaS domain
- Supabase RLS pitfalls are consistent across versions (2023-2025 documentation)
- Oil & gas ownership complexity is domain-standard (not version-specific)

**Recommended Verification:**
Before implementation, verify against current (March 2026) sources:
- Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
- Supabase security best practices: https://supabase.com/docs/guides/database/postgres/row-level-security
- Multi-tenancy patterns: https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/
- Oil & gas data standards: Energistics, IHS Markit, Enverus documentation

---
*Pitfalls research for: Multi-tenant SaaS persistence for oil & gas deal modeling*
*Researched: 2026-03-05*
*Confidence: MEDIUM (training data only, verification recommended)*
