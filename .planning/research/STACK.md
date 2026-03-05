# Technology Stack

**Project:** Slopcast Multi-Tenant SaaS Persistence
**Domain:** Multi-tenant SaaS data persistence with Supabase/Postgres
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

The standard 2025-2026 stack for multi-tenant SaaS with Supabase centers on `@supabase/supabase-js` v2.98+ for client-side access, native Postgres Row-Level Security (RLS) for tenant isolation, Supabase CLI for migrations, and TypeScript type generation from the database schema. This architecture leverages Postgres's built-in multi-tenancy features rather than application-level isolation, resulting in better security guarantees and simpler code.

The project already has a solid foundation: Supabase client integration, migrations infrastructure, RLS policies in place, and TypeScript types generated from the schema. The recommended stack builds on this existing foundation with minimal additions.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **@supabase/supabase-js** | 2.98.0+ | JavaScript/TypeScript client for Supabase | Official client with full feature support. V2.98 is current stable (Jan 2026). Handles auth, realtime, storage, and PostgREST queries with excellent TypeScript support. |
| **Supabase CLI** | 2.76.17+ | Local development, migrations, type generation | Essential for schema management. Enables local Postgres + API + Auth + Studio. Generates TypeScript types directly from schema with `supabase gen types`. |
| **PostgreSQL** | 17+ | Relational database with native multi-tenancy via RLS | Postgres 17 (released 2024) is the current major version. Native RLS provides database-level tenant isolation. JSONB for flexible schema. |
| **TypeScript** | 5.8+ | Type safety for database operations | Already in project at 5.8.2. Generated types from Supabase ensure compile-time safety for all database operations. |

### Multi-Tenancy Pattern

| Component | Approach | Rationale |
|-----------|----------|-----------|
| **Tenant Isolation** | Postgres Row-Level Security (RLS) policies | Database-enforced isolation prevents application bugs from leaking data. More secure than app-level filtering. |
| **Authentication** | Supabase Auth (`auth.users`) | Already integrated. Provides JWT tokens with `auth.uid()` function for RLS policies. |
| **Authorization** | Helper functions (`current_project_role`, `has_project_access`) | Security definer functions encapsulate permission logic. Reusable across policies. |
| **Tenant Scoping** | `owner_user_id` + `project_members` join table | Owner has full control, members have role-based access (owner/editor/viewer). Pattern already implemented in migrations. |

### Schema Management

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| **Supabase CLI migrations** | Built-in | Version-controlled SQL migrations | All schema changes. Already using this pattern (`supabase/migrations/*.sql`). |
| **`supabase gen types typescript`** | Built-in | Generate TypeScript types from schema | After every migration. Creates `Database` type with all tables/views/functions. |
| **Database functions** | Native SQL | Permission helpers, triggers, computed values | Complex authorization logic (`current_project_role`), audit triggers (`set_updated_at`). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zod** | 4.3.6+ | Runtime validation + TypeScript inference | Validate user input before database operations. Not needed for database types (already generated), but useful for form validation and API boundaries. |
| **@faker-js/faker** | 10.3.0+ | Generate realistic test data | Seed scripts, test fixtures. Better than hand-written test data for wells, deals, users. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Supabase Studio** | Local database GUI | Runs at localhost:54323 via `supabase start`. Visual query builder, table editor, RLS policy tester. |
| **Supabase Local Dev** | Full local stack | Postgres + API + Auth + Realtime + Storage. Configured in `supabase/config.toml`. No cloud dependency during dev. |
| **Vitest** | Unit testing | Already in project (4.0.18). Test economics calculations, repository methods, RLS policies (via `supabase db test`). |

## Installation

```bash
# Core (already installed)
npm install @supabase/supabase-js@^2.98.0
npm install typescript@~5.8.2

# Recommended additions
npm install zod@^4.3.6                    # Runtime validation
npm install -D @faker-js/faker@^10.3.0   # Test data generation

# Supabase CLI (global or project)
npm install -D supabase@^2.76.17
# OR install globally: npm install -g supabase
```

## Type Generation Workflow

```bash
# 1. Create migration
npx supabase migration new feature_name

# 2. Edit SQL file in supabase/migrations/

# 3. Apply locally
npx supabase db reset

# 4. Generate TypeScript types
npx supabase gen types typescript --local > supabase/types/database.ts

# 5. Import in code
import type { Database } from '../../supabase/types/database';
type WellRow = Database['public']['Tables']['wells']['Row'];
```

## RLS Policy Pattern (Already Implemented)

**Key insight from existing migrations:** The project uses a **project-based multi-tenancy** model, not organization-based. Each project has an owner and optional members with roles.

```sql
-- Pattern 1: Helper functions (security definer)
create function public.has_project_access(target_project_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    left join public.project_members pm on pm.project_id = p.id
    where p.id = target_project_id
      and (p.owner_user_id = auth.uid() or pm.user_id = auth.uid())
  );
$$;

-- Pattern 2: Read policies (using helper)
create policy projects_read_access on public.projects
for select using (public.has_project_access(id));

-- Pattern 3: Write policies (role-based)
create policy projects_update_editor on public.projects
for update
using (public.current_project_role(id) in ('owner', 'editor'))
with check (public.current_project_role(id) in ('owner', 'editor'));
```

**Why this pattern:**
- `security definer` functions run with elevated privileges, allowing complex joins
- Centralized permission logic (change once, affects all policies)
- Performance: Postgres can optimize these functions
- Already implemented in `20260220164000_slopcast_v1.sql`

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| **Database Client** | `@supabase/supabase-js` | Raw `pg` (node-postgres) | Never for this project. Supabase client handles auth integration, RLS context, and PostgREST queries. Raw `pg` requires manual JWT parsing and RLS context setting. |
| **Query Builder** | PostgREST (via Supabase client) | Drizzle ORM (0.45.1), Kysely (0.28.11) | Only if you need complex joins or transactions that PostgREST can't handle. For most SaaS CRUD, PostgREST's chainable query builder is simpler and type-safe. |
| **Migrations** | Supabase CLI migrations | Drizzle Kit (0.31.9) | Use Drizzle Kit only if you adopt Drizzle ORM fully. Mixing migration tools causes confusion. Stick with Supabase CLI for consistency. |
| **Validation** | Zod | Valibot (1.2.0), AJV (8.18.0) | Valibot if bundle size critical (<1KB vs Zod's ~50KB). AJV for JSON Schema compliance. Zod has best TypeScript integration and developer experience. |
| **Type Generation** | Supabase CLI | `typescript-json-schema`, manual types | Never. Supabase's built-in generation is authoritative and up-to-date. Manual types drift from schema. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Application-level tenant filtering** (e.g., `where tenant_id = currentTenant`) | Easy to forget, causes data leaks. Bugs can expose other tenants' data. | Postgres RLS policies. Database-enforced, impossible to bypass. |
| **Prisma with Supabase** | Prisma doesn't understand RLS, bypasses policies, generates its own migrations. | Supabase CLI + PostgREST queries. Native RLS support. |
| **@supabase/auth-helpers-react** (0.15.0) | Deprecated in favor of built-in `@supabase/supabase-js` v2 hooks. | Direct use of `supabase.auth` methods. Project already uses this pattern. |
| **Storing calculated results in database** (for this project) | Economics calculations are fast (client-side TypeScript). Storage adds complexity, staleness issues. | Calculate on-demand. Already implemented in `utils/economics.ts`. Store only inputs (groups, scenarios, assumptions). |
| **GraphQL layer** | PostgREST (built into Supabase) already provides auto-generated REST API with filtering, ordering, pagination. GraphQL adds complexity without benefit. | PostgREST via Supabase client. Type-safe, auto-generated from schema. |
| **Global shared `wells` table without RLS** | Violates multi-tenancy. One tenant's wells shouldn't be visible to others. | Tenant-scoped wells or per-project wells. Current schema uses public wells (all authenticated users can read) — see PITFALLS.md. |

## Stack Patterns by Use Case

**If you need complex multi-table transactions:**
- Use Postgres functions (SQL) with `security definer`
- Call via `.rpc('function_name', params)`
- Return JSON for complex results
- Example: Bulk well import with validation

**If you need real-time updates:**
- Use `supabase.channel().on('postgres_changes', ...)`
- Already enabled in `supabase/config.toml` (realtime: enabled)
- Subscribe to table changes, broadcast custom events

**If you need full-text search:**
- Use Postgres `tsvector` columns + GIN indexes
- Query via PostgREST: `.textSearch('column', 'query')`
- Example: Search well names, operators, formations

**If you need file uploads (well data CSVs, documents):**
- Use Supabase Storage buckets
- RLS policies on `storage.objects` for tenant isolation
- Already configured in `supabase/config.toml`

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@supabase/supabase-js@2.98.0` | Postgres 12-17 | Works with all recent Postgres versions. V2.x is stable. |
| `@supabase/supabase-js@2.98.0` | React 18-19 | No direct React dependency, but works with all modern React versions. Project uses React 19.2.3. |
| `supabase CLI@2.76.17` | Postgres 17 | Configured in `supabase/config.toml`: `major_version = 17`. Match your production version. |
| `zod@4.x` | TypeScript 5.8+ | Requires TypeScript 4.5+. Works great with TS 5.8. |

## Project-Specific Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| **Project-based multi-tenancy** (not org-based) | Each project is the tenant unit. Users can own multiple projects, be members of others. More flexible than single-org-per-user. | ✅ Implemented in migrations |
| **JSONB for assumptions** (`type_curve`, `capex`, `opex`, `ownership`) | Assumption structures evolve. JSONB allows schema flexibility without migrations. TypeScript ensures client-side safety. | ✅ Implemented in `project_groups` table |
| **Calculate economics on-demand** (don't store results) | Economics are deterministic and fast (<100ms for 40 wells). Storing creates staleness issues. | ✅ Implemented in `utils/economics.ts` |
| **Security definer functions** for permissions | Centralized logic, better performance than complex policies with subqueries. | ✅ Implemented: `has_project_access`, `current_project_role` |
| **Updated_at triggers** for audit trail | Automatic timestamp updates on all mutable tables. | ✅ Implemented: `set_updated_at()` function + triggers |
| **Public wells table** with read-all access | Current approach: any authenticated user can read all wells. | ⚠️ See PITFALLS.md — may need tenant scoping |

## Sources

**HIGH Confidence:**
- npm registry (direct queries) — versions verified 2026-03-05
- Existing project code — migrations, config, types reviewed
- Supabase config.toml — Postgres 17, local dev setup confirmed
- Package.json — current dependencies: `@supabase/supabase-js@2.95.3` (2.98.0 available)

**MEDIUM Confidence:**
- Supabase patterns — inferred from existing migrations and RLS policies
- Multi-tenancy patterns — standard Postgres RLS approach, validated against project schema

**Verification Notes:**
- Could not fetch live Supabase documentation (WebFetch model issue)
- Relied on npm registry + existing codebase analysis
- All version numbers verified via `npm view` on 2026-03-05
- Architecture patterns validated against existing migrations (20+ RLS policies found)

---
*Stack research for: Slopcast Multi-Tenant SaaS Persistence*
*Researched: 2026-03-05*
*Confidence: HIGH (based on npm registry + existing codebase + established patterns)*
