# Requirements: Slopcast Data Persistence Layer

**Defined:** 2026-03-05
**Core Value:** All user work—well groups, economic assumptions, scenarios, and calculated results—persists reliably and is accessible to authorized users within their tenant, never lost to browser storage limitations.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Security (SEC)

- [ ] **SEC-01**: User data is isolated by organization (multi-tenant architecture)
- [ ] **SEC-02**: User can only access data belonging to their organization
- [ ] **SEC-03**: Database enforces tenant isolation via Row-Level Security policies
- [ ] **SEC-04**: Invalid data (negative values, malformed inputs) is rejected before saving
- [ ] **SEC-05**: Schema constraints prevent data corruption

### Wells (WELL)

- [ ] **WELL-01**: User can create wells with operator, formation, location, status
- [ ] **WELL-02**: User can view their organization's wells
- [ ] **WELL-03**: User can edit well metadata
- [ ] **WELL-04**: User can delete wells

### Well Groups (GRP)

- [ ] **GRP-01**: User can create well groups with selected wells
- [ ] **GRP-02**: User can assign type curve assumptions to well groups
- [ ] **GRP-03**: User can assign CAPEX assumptions to well groups
- [ ] **GRP-04**: User can assign OPEX assumptions to well groups
- [ ] **GRP-05**: User can assign ownership assumptions to well groups
- [ ] **GRP-06**: User can view all well groups
- [ ] **GRP-07**: User can edit well group settings
- [ ] **GRP-08**: User can delete well groups

### Scenarios (SCEN)

- [ ] **SCEN-01**: User can create scenarios with pricing assumptions
- [ ] **SCEN-02**: User can define schedule parameters in scenarios
- [ ] **SCEN-03**: User can set scalar modifiers in scenarios
- [ ] **SCEN-04**: User can view all scenarios
- [ ] **SCEN-05**: User can edit scenario settings
- [ ] **SCEN-06**: User can delete scenarios

### Deals (DEAL)

- [ ] **DEAL-01**: User can save deals combining groups + scenarios + assumptions
- [ ] **DEAL-02**: User can load saved deals
- [ ] **DEAL-03**: User can edit saved deals
- [ ] **DEAL-04**: User can delete saved deals

### Auto-Persistence (AUTO)

- [ ] **AUTO-01**: Changes to well groups save automatically (no manual save button)
- [ ] **AUTO-02**: Changes to scenarios save automatically
- [ ] **AUTO-03**: Changes to deals save automatically
- [ ] **AUTO-04**: Auto-save is debounced (300ms idle) to prevent excessive writes
- [ ] **AUTO-05**: User sees save status indicator (saving / saved / error)

### Migration (MIG)

- [ ] **MIG-01**: User's existing localStorage data migrates to database on first login
- [ ] **MIG-02**: Migration is idempotent (safe to run multiple times)
- [ ] **MIG-03**: Migration handles race conditions (multiple tabs)
- [ ] **MIG-04**: User can toggle between Demo mode (mock data) and Live mode (database)
- [ ] **MIG-05**: Mode toggle warns before switching (prevents accidental data loss)
- [ ] **MIG-06**: Demo mode and Live mode maintain separate state

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Collaboration (COLLAB)

- **COLLAB-01**: All organization members can view organization's data
- **COLLAB-02**: Multiple users can edit the same deal simultaneously
- **COLLAB-03**: User can see who last edited a deal and when

### Data Recovery (RECOV)

- **RECOV-01**: User can recover deleted wells (soft delete)
- **RECOV-02**: User can recover deleted well groups
- **RECOV-03**: User can recover deleted scenarios
- **RECOV-04**: User can see version history of deals
- **RECOV-05**: User can revert to previous version of deal

### Templates (TMPL)

- **TMPL-01**: User can save assumption sets as templates
- **TMPL-02**: User can apply templates to new well groups
- **TMPL-03**: User can share templates within organization

### Analysis (ANLY)

- **ANLY-01**: User can view side-by-side comparison of multiple scenarios
- **ANLY-02**: User can rank deals by NPV/IRR
- **ANLY-03**: User can filter deals by performance criteria

### Performance (PERF)

- **PERF-01**: Economics calculations cache results (only recalculate when assumptions change)
- **PERF-02**: System handles 500+ wells per group without lag

### Export (EXP)

- **EXP-01**: User can export deal to Excel
- **EXP-02**: User can export deal to PDF

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Public well data registry | Competitive intelligence leakage risk, data quality chaos |
| Real-time collaboration (WebSocket) | High complexity, unclear demand until validated |
| Blockchain audit trail | Massive complexity, overkill for use case |
| Real-time calculations (as user types) | CPU thrashing, poor UX on calculation lag |
| Unlimited undo/redo history | Memory explosion, state complexity |
| Full-text search across all fields | Index bloat, slow writes, maintenance cost |
| Custom fields on all entities | Schema explosion, query complexity |
| AI-generated assumptions | Liability risk, hard to validate outputs |
| Bulk import from Excel/CSV | High complexity, defer until validated need |
| API integrations (Enverus, DrillingInfo) | External dependencies, defer to future milestone |
| Offline mode | Service worker complexity, defer until field use validated |
| Approval workflows | Enterprise feature, defer until enterprise customers |
| Role-based permissions (Admin/Analyst/Viewer) | Adds RLS complexity, defer until org management validated |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| SEC-04 | Phase 1 | Pending |
| SEC-05 | Phase 1 | Pending |
| WELL-01 | Phase 3 | Pending |
| WELL-02 | Phase 3 | Pending |
| WELL-03 | Phase 3 | Pending |
| WELL-04 | Phase 3 | Pending |
| GRP-01 | Phase 3 | Pending |
| GRP-02 | Phase 3 | Pending |
| GRP-03 | Phase 3 | Pending |
| GRP-04 | Phase 3 | Pending |
| GRP-05 | Phase 3 | Pending |
| GRP-06 | Phase 3 | Pending |
| GRP-07 | Phase 3 | Pending |
| GRP-08 | Phase 3 | Pending |
| SCEN-01 | Phase 3 | Pending |
| SCEN-02 | Phase 3 | Pending |
| SCEN-03 | Phase 3 | Pending |
| SCEN-04 | Phase 3 | Pending |
| SCEN-05 | Phase 3 | Pending |
| SCEN-06 | Phase 3 | Pending |
| DEAL-01 | Phase 3 | Pending |
| DEAL-02 | Phase 3 | Pending |
| DEAL-03 | Phase 3 | Pending |
| DEAL-04 | Phase 3 | Pending |
| AUTO-01 | Phase 2 | Pending |
| AUTO-02 | Phase 2 | Pending |
| AUTO-03 | Phase 2 | Pending |
| AUTO-04 | Phase 2 | Pending |
| AUTO-05 | Phase 2 | Pending |
| MIG-01 | Phase 2 | Pending |
| MIG-02 | Phase 2 | Pending |
| MIG-03 | Phase 2 | Pending |
| MIG-04 | Phase 2 | Pending |
| MIG-05 | Phase 2 | Pending |
| MIG-06 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41/41 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after roadmap creation*
