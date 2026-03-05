# Roadmap: Slopcast Data Persistence Layer

**Project:** Multi-tenant SaaS persistence for oil & gas economics modeling
**Created:** 2026-03-05
**Granularity:** Coarse (3 phases)
**Mode:** YOLO

## Phases

- [ ] **Phase 1: Schema & Security Foundation** - Database schema with RLS for tenant isolation
- [ ] **Phase 2: Migration & Persistence** - LocalStorage migration and auto-save with mode toggle
- [ ] **Phase 3: Entity Management** - Full CRUD operations for all entities

## Phase Details

### Phase 1: Schema & Security Foundation
**Goal**: Database enforces multi-tenant isolation and users can trust their data is secure
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. User can only view data belonging to their organization (tenant isolation works)
  2. User removed from organization cannot access that organization's data (RLS policies enforce access)
  3. User cannot save invalid data like negative EUR or malformed pricing (schema validation prevents corruption)
  4. Developer cannot accidentally query across tenants with any client operation (RLS policies cover all tables)
  5. Database schema supports all entity types with correct relationships (wells, groups, scenarios, deals)
**Plans**: TBD

### Phase 2: Migration & Persistence
**Goal**: Users never lose work when transitioning from demo to authenticated mode
**Depends on**: Phase 1 (requires database schema)
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05, MIG-01, MIG-02, MIG-03, MIG-04, MIG-05, MIG-06
**Success Criteria** (what must be TRUE):
  1. User's existing localStorage data appears in authenticated session after first login (migration preserves work)
  2. User makes changes to group and sees "Saved" status within 1 second (auto-save is responsive)
  3. User opens app in multiple tabs, changes in one tab don't duplicate data (migration handles race conditions)
  4. User switches from Demo to Live mode and sees warning if unsaved demo work exists (mode toggle is safe)
  5. User can work with mock data in Demo mode, then switch to Live mode to access real database (modes are independent)
**Plans**: TBD

### Phase 3: Entity Management
**Goal**: Users can create, view, edit, and delete all entities reliably
**Depends on**: Phase 2 (requires auto-save infrastructure)
**Requirements**: WELL-01, WELL-02, WELL-03, WELL-04, GRP-01, GRP-02, GRP-03, GRP-04, GRP-05, GRP-06, GRP-07, GRP-08, SCEN-01, SCEN-02, SCEN-03, SCEN-04, SCEN-05, SCEN-06, DEAL-01, DEAL-02, DEAL-03, DEAL-04
**Success Criteria** (what must be TRUE):
  1. User can create wells with operator, formation, location and see them appear on map (wells management works)
  2. User can create well groups, assign type curve and CAPEX assumptions, and see calculated EUR (groups with assumptions work)
  3. User can create scenarios with custom pricing and see updated NPV across all groups (scenario management works)
  4. User can save a complete deal, close the app, reopen, and see the deal exactly as left it (deals persist correctly)
  5. User can delete a group that's part of a saved deal and see error preventing deletion (referential integrity works)
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema & Security Foundation | 0/? | Not started | - |
| 2. Migration & Persistence | 0/? | Not started | - |
| 3. Entity Management | 0/? | Not started | - |

## Coverage

**v1 Requirements:** 41 total
**Mapped:** 41/41 (100%)
**Unmapped:** 0

All v1 requirements are accounted for in the roadmap.

---
*Last updated: 2026-03-05 after creation*
