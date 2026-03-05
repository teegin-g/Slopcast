# Feature Research

**Domain:** Multi-tenant SaaS persistence for oil & gas economics modeling
**Researched:** 2026-03-05
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **User authentication & authorization** | Can't have multi-tenant without auth | LOW | Supabase auth already integrated |
| **Organization/tenant isolation** | Business requirement for SaaS | MEDIUM | RLS policies + tenant_id foreign keys |
| **CRUD operations on all entities** | Basic data persistence (wells, groups, scenarios) | MEDIUM | Repository pattern + Supabase client |
| **Data saves automatically** | Users expect "save" to be implicit like Google Docs | LOW | Auto-save on debounced changes |
| **Data loads on login** | Retrieve my work from any device | LOW | Fetch on auth, populate workspace |
| **Soft delete / archive** | Users accidentally delete, need recovery | LOW | deleted_at timestamp + filter queries |
| **Basic sharing within org** | Team members view/edit same deals | MEDIUM | Tenant-scoped access via RLS |
| **Data validation** | Prevent bad data (negative NPV inputs, invalid dates) | LOW | Schema constraints + client validation |
| **Performance for typical datasets** | Load 100-500 wells without lag | MEDIUM | Indexed queries, pagination if needed |
| **LocalStorage migration** | Don't lose existing user work | MEDIUM | One-time import on first auth |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Demo/Live mode toggle** | Try with mock data, switch to real data without re-auth | MEDIUM | State flag + conditional data source |
| **Version history / audit trail** | See who changed assumptions, when, revert mistakes | HIGH | Event log table, snapshot diffs, UI for browsing |
| **Scenario comparison view** | Side-by-side NPV/IRR across multiple scenarios | MEDIUM | Already calculated, UI layout challenge |
| **Deal templates / presets** | Save common assumption sets (Permian basin defaults, etc.) | MEDIUM | Template table + clone operation |
| **Bulk import from Excel/CSV** | Import 1000+ wells from existing spreadsheets | HIGH | Parser, validation, mapping UI, error handling |
| **Real-time collaboration** | Multiple users editing same deal simultaneously | HIGH | WebSocket, CRDT, conflict resolution |
| **Comments & annotations** | Team discusses assumptions inline | MEDIUM | Comment table, threading, notifications |
| **Approval workflows** | Deal requires VP sign-off before execution | HIGH | State machine, role-based approvals, notifications |
| **Advanced filters & saved views** | "Show all Permian Basin wells with EUR > 200 MBO" | MEDIUM | Filter builder UI + query construction |
| **API for integrations** | Connect to Enverus, DrillingInfo, other data sources | HIGH | External data model + sync jobs |
| **Calculated results caching** | Store NPV/IRR instead of recalculating every load | MEDIUM | Trade-off: storage cost vs compute, invalidation logic |
| **Offline mode** | Work without internet, sync when online | HIGH | Service worker, IndexedDB, conflict resolution |
| **Export to Excel/PDF** | Generate formatted reports for executives | MEDIUM | Template engine, PDF generation library |
| **Role-based permissions** | Admin vs Analyst vs Viewer access levels | MEDIUM | Roles table, RLS policy complexity increases |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Public well data registry** | "Let's share wells across all customers" | Competitive intel leakage, data quality chaos | Tenant-private wells only; external integrations later |
| **Blockchain for audit trail** | Sounds impressive, "immutable" | Massive complexity, slow, expensive, overkill | Postgres append-only log + signed timestamps |
| **Real-time calculations** | "Update NPV as I type" | CPU thrashing, battery drain, poor UX on lag | Debounced recalc (300ms), optimistic UI updates |
| **Unlimited undo/redo** | "Let me undo 100 steps back" | Memory explosion, state complexity | Soft delete + version snapshots (manual), not full history |
| **Full-text search on everything** | "Search across all fields" | Index bloat, slow writes, maintenance cost | Targeted search on key fields (well name, operator) |
| **Custom fields on all entities** | "Every customer has unique needs" | Schema explosion, query complexity, validation nightmare | Fixed schema + JSON metadata field for edge cases |
| **Drag-and-drop everything** | "Make it like Notion" | Accessibility issues, mobile nightmare, over-engineering | Use drag-drop sparingly (reorder lists), not for data entry |
| **AI-generated assumptions** | "AI predicts type curves" | Liability risk, unpredictable, hard to validate | User-defined assumptions + template library |

## Feature Dependencies

```
Authentication & Authorization
    └──requires──> Organization/Tenant Model
                       └──requires──> Row-Level Security Policies
                                          └──requires──> CRUD Operations

Data Persistence (CRUD)
    └──enables──> Auto-Save
    └──enables──> Soft Delete
    └──enables──> Sharing Within Org

LocalStorage Migration
    └──requires──> Data Persistence (CRUD)
    └──requires──> Authentication

Demo/Live Mode Toggle
    └──requires──> Data Persistence (dual source)
    └──enhances──> User Onboarding

Version History
    └──requires──> CRUD Operations
    └──requires──> Event Log / Audit Table
    └──enhances──> Soft Delete (better recovery)

Scenario Comparison
    └──requires──> Multiple Scenarios Persistence
    └──enhances──> Economics Calculations

Deal Templates
    └──requires──> CRUD Operations
    └──enhances──> User Productivity

Bulk Import
    └──requires──> CRUD Operations
    └──requires──> Data Validation
    └──conflicts──> Real-Time Collaboration (import locks)

Real-Time Collaboration
    └──requires──> WebSocket Infrastructure
    └──requires──> Conflict Resolution
    └──conflicts──> Bulk Import (locking issues)

API Integrations
    └──requires──> External Data Model
    └──requires──> Authentication (API keys)
    └──enhances──> Bulk Import

Role-Based Permissions
    └──requires──> Authentication & Authorization
    └──enhances──> Sharing Within Org
```

### Dependency Notes

- **Authentication requires Organization Model:** Can't isolate tenants without knowing which org a user belongs to.
- **RLS requires Organization Model:** Policies filter by tenant_id, must exist in schema.
- **LocalStorage Migration requires Auth:** Don't know which user's data to import until logged in.
- **Demo/Live Mode requires dual source:** Must handle both mock data (constants.ts) and DB queries.
- **Version History enhances Soft Delete:** Instead of just "undelete," restore to specific version.
- **Real-Time Collaboration conflicts with Bulk Import:** Locking large imports blocks live editors; defer real-time.
- **API Integrations enhance Bulk Import:** External data sources feed import pipeline.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **User authentication** — Already integrated (Supabase)
- [ ] **Organization/tenant data model** — Schema with tenant_id on all tables
- [ ] **Row-level security policies** — Postgres RLS for data isolation
- [ ] **CRUD operations for core entities** — Wells, WellGroups, Scenarios, DealRecords
- [ ] **Auto-save on changes** — Debounced persistence (300ms idle)
- [ ] **Data loads on login** — Fetch tenant data, populate workspace
- [ ] **Soft delete / archive** — deleted_at timestamp, filter deleted by default
- [ ] **Basic sharing within org** — All org members see org data (no fine-grained permissions yet)
- [ ] **LocalStorage migration** — One-time import on first auth
- [ ] **Demo/Live mode toggle** — Switch between mock data and real DB
- [ ] **Data validation** — Schema constraints + client checks (non-negative NPV inputs)

**Rationale:** These are non-negotiable. Without auth, isolation, and basic CRUD, the product is not a multi-tenant SaaS. Demo/Live mode is critical for onboarding and demos (per PROJECT.md). LocalStorage migration prevents losing existing users' work.

### Add After Validation (v1.x)

Features to add once core is working and users validate the value.

- [ ] **Deal templates / presets** — Add when users request "save my standard Permian assumptions"
- [ ] **Scenario comparison view** — Add when users have 3+ scenarios and need to compare
- [ ] **Calculated results caching** — Add if performance degrades with large well sets (500+ wells)
- [ ] **Export to Excel/PDF** — Add when users need to present to executives
- [ ] **Advanced filters & saved views** — Add when users manage 1000+ wells
- [ ] **Version history / audit trail** — Add when users request "who changed this?" or "undo yesterday's edit"
- [ ] **Comments & annotations** — Add when teams request inline discussions

**Trigger for adding:** User feedback or measurable friction (performance issues, feature requests from 3+ customers).

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Bulk import from Excel/CSV** — Defer until customers have large datasets (1000+ wells)
- [ ] **Real-time collaboration** — Defer until multiple users editing same deal simultaneously is a pain point
- [ ] **API for integrations** — Defer until customers request Enverus/DrillingInfo connections
- [ ] **Offline mode** — Defer until users report "I work in the field without internet"
- [ ] **Approval workflows** — Defer until enterprise customers request formal sign-offs
- [ ] **Role-based permissions** — Defer until orgs request "Analysts can edit, Viewers can't"

**Why defer:** High complexity, unclear demand, or requires infrastructure not yet built. Focus on core persistence first.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Authentication & Authorization | HIGH | LOW (done) | P1 |
| Organization/Tenant Model | HIGH | MEDIUM | P1 |
| Row-Level Security | HIGH | MEDIUM | P1 |
| CRUD Operations | HIGH | MEDIUM | P1 |
| Auto-Save | HIGH | LOW | P1 |
| Data Loads on Login | HIGH | LOW | P1 |
| Soft Delete | HIGH | LOW | P1 |
| Basic Sharing Within Org | HIGH | LOW | P1 |
| LocalStorage Migration | HIGH | MEDIUM | P1 |
| Demo/Live Mode Toggle | HIGH | MEDIUM | P1 |
| Data Validation | MEDIUM | LOW | P1 |
| Deal Templates | MEDIUM | MEDIUM | P2 |
| Scenario Comparison | MEDIUM | MEDIUM | P2 |
| Calculated Results Caching | MEDIUM | MEDIUM | P2 |
| Export to Excel/PDF | MEDIUM | MEDIUM | P2 |
| Advanced Filters | MEDIUM | MEDIUM | P2 |
| Version History | MEDIUM | HIGH | P2 |
| Comments & Annotations | LOW | MEDIUM | P2 |
| Bulk Import | HIGH | HIGH | P3 |
| Real-Time Collaboration | LOW | HIGH | P3 |
| API Integrations | MEDIUM | HIGH | P3 |
| Offline Mode | LOW | HIGH | P3 |
| Approval Workflows | LOW | HIGH | P3 |
| Role-Based Permissions | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (MVP)
- P2: Should have, add when validated
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Aries (IHS) | PHDWin (Schlumberger) | Combocurve | Our Approach (Slopcast) |
|---------|-------------|----------------------|------------|-------------------------|
| **Multi-tenancy** | Enterprise single-tenant | Enterprise single-tenant | True multi-tenant SaaS | True multi-tenant SaaS (Supabase RLS) |
| **Data persistence** | SQL Server | Oracle | PostgreSQL + cloud | PostgreSQL (Supabase) |
| **Authentication** | Windows AD / SSO | SAML / SSO | Auth0 / email | Supabase Auth (email, OAuth) |
| **Collaboration** | File-based, email exports | Shared DB, no real-time | Real-time (limited) | Org-scoped, no real-time yet |
| **Demo mode** | Trial license, full data | Demo datasets, separate install | Sandbox account | Demo/Live toggle in-app |
| **Versioning** | Manual file versions | Snapshot feature | Audit log (enterprise tier) | Soft delete initially, versioning later |
| **Bulk import** | Excel import, complex | CSV import, templates | API + CSV import | Defer to v1.x+ |
| **Export** | Excel, PDF, custom reports | PDF, Word, templates | PDF, CSV | Excel/PDF in v1.x |
| **Mobile access** | Windows desktop only | Desktop only | Web responsive | Web responsive (already) |
| **Pricing model** | Per-seat perpetual license | Per-seat annual | Per-seat SaaS | Per-seat SaaS (future) |

**Key differentiators for Slopcast:**
1. **Demo/Live mode toggle** — Competitors require separate accounts/installs for demos; we switch in-app.
2. **Lightweight onboarding** — Aries/PHDWin are desktop installs with steep learning curves; we're web-first.
3. **Modern stack** — Competitors use legacy tech (Oracle, Windows-only); we use React + Supabase.
4. **Mobile-friendly** — Competitors are desktop-only; we're responsive from day one.

**What we explicitly avoid:**
- Complex desktop installs (web-only)
- Real-time collaboration initially (adds complexity, unclear demand)
- Public well registry (competitive intel risk)
- Custom fields everywhere (schema stability)

## Sources

**Note:** Research conducted primarily from training data (January 2025 knowledge cutoff) due to WebSearch/WebFetch limitations. Confidence level: MEDIUM.

### Training Data Sources (Cannot verify against current docs)
- Multi-tenant SaaS patterns: Standard industry practices for RLS, tenant isolation, soft delete
- Oil & gas software landscape: Knowledge of Aries (IHS Markit), PHDWin (Schlumberger), Combocurve
- Supabase patterns: RLS documentation, multi-tenancy guides (as of Jan 2025)

### Project Context (HIGH confidence)
- `/home/groveste/Slopcast/.planning/PROJECT.md` — Requirements, constraints, existing architecture
- `/home/groveste/Slopcast/CLAUDE.md` — Current codebase structure, types, patterns

### Limitations
- Could not verify current Supabase best practices (2026) due to WebFetch unavailability
- Could not verify current oil & gas software feature sets (2026) due to WebSearch errors
- Competitor analysis based on 2024-2025 knowledge; pricing/features may have changed

### Recommendations for Validation
- Review current Supabase RLS documentation for 2026 updates
- Survey target users (oil & gas professionals) for feature expectations
- Audit Combocurve (closest competitor) for recent feature additions
- Test LocalStorage migration with real user data before launch

---
*Feature research for: Multi-tenant SaaS persistence (oil & gas economics modeling)*
*Researched: 2026-03-05*
*Confidence: MEDIUM (training data + project context, external verification limited)*
