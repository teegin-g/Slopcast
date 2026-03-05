# Slopcast Data Persistence Layer

## What This Is

A multi-tenant data persistence layer for Slopcast that moves from localStorage-only to a Supabase-backed architecture. This enables users to save and share deal evaluations across sessions and within their organization, while maintaining strict tenant isolation. The system supports both demo mode (mock data) and live mode (database) via a user-controlled toggle.

## Core Value

All user work—well groups, economic assumptions, scenarios, and calculated results—persists reliably and is accessible to authorized users within their tenant, never lost to browser storage limitations.

## Requirements

### Validated

- ✓ Well metadata structure (operator, formation, location, status) — existing in types.ts
- ✓ WellGroup structure with assumptions (type curve, CAPEX, OPEX, ownership) — existing in types.ts
- ✓ Scenario structure (pricing, schedule, scalars) — existing in types.ts
- ✓ DealMetrics calculation outputs (NPV, IRR, EUR, variants) — existing in types.ts
- ✓ Economic calculation engine — existing in utils/economics.ts

### Active

- [ ] Supabase schema design for all core entities
- [ ] Multi-tenant data model with organization/tenant isolation
- [ ] Wells table with tenant scoping
- [ ] Well groups table with user ownership
- [ ] Scenarios table with user ownership
- [ ] Economic assumptions table (type curves, CAPEX, OPEX, ownership presets)
- [ ] Saved deals table linking groups + scenarios + assumptions
- [ ] Calculated results storage (optional: store or recalculate on demand)
- [ ] Mode toggle (demo/live) in UI
- [ ] Data repository layer for CRUD operations
- [ ] Migration from localStorage to database on first auth
- [ ] Row-level security policies for tenant isolation
- [ ] User authentication flow integrated with Supabase

### Out of Scope

- External data integrations (user DB connections, schema mapping) — future milestone
- Advanced filtering UI for well selection — future milestone
- Production data time-series storage — defer until integration requirements clear
- Data connection management (credentials, sync) — future milestone
- Public well data registry — private tenant data only for v1
- Databricks migration — Supabase first, Databricks later

## Context

**Current Architecture:**
- Frontend: React + Vite, TypeScript
- State: In-memory via hooks (useSlopcastWorkspace)
- Persistence: localStorage via useProjectPersistence hook
- Auth: DevBypassAdapter (local) / SupabaseAdapter (prod) pattern exists
- Economics: Pure TypeScript functions in utils/economics.ts (661 lines, well-tested)

**Existing TypeScript types** (src/types.ts):
- `Well` — operator, formation, lat/lng, status
- `WellGroup` — named group + wells + all assumptions
- `Scenario` — pricing + schedule + scalars
- `TypeCurve` — qi, b, di
- `CapexItem[]` — AFE line items
- `OpexSegment[]` — LOE over time
- `Ownership` — NRI, cost interest
- `DealMetrics` — NPV10, IRR, EUR, payout, tax/levered/risked variants
- `MonthlyCashFlow` — time-series with optional tax/debt fields

**Mock Data** (src/constants.ts):
- 40 generated Permian Basin wells
- Default type curve, CAPEX, OPEX, ownership, pricing
- Template presets in constants/templates.ts

**Use Case:**
Oil & gas professionals evaluate acquisition deals by modeling wells, applying economic assumptions, running scenarios, and comparing NPV/IRR across deals. Data needs to persist across sessions and be shared within their organization (not browser-only).

## Constraints

- **Multi-tenancy**: Critical — absolute data isolation between organizations. One customer must never see another's data.
- **Security**: Row-level security (RLS) policies required in Supabase for all tables.
- **Performance**: Economics calculations are client-side (TypeScript), but large well sets may require optimization.
- **Backward compatibility**: Existing localStorage data should migrate smoothly for current users.
- **Mock data availability**: Demo mode must remain functional for unauthenticated users and demos.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for persistence | Already integrated for auth, Postgres RLS handles multi-tenancy well | — Pending |
| Mode toggle (demo/live) | Users need to experiment with mock data + access real data without switching accounts | — Pending |
| Store calculated results | Store vs recalculate trade-off: storage cost vs compute cost for large well sets | — Pending |
| Tenant-scoped wells | Each organization imports/owns their wells privately (not a shared public registry) | — Pending |
| Schema-first approach | Design complete data model before building integrations | — Pending |

---
*Last updated: 2026-03-05 after initialization*
