# Architecture Research: Multi-Tenant SaaS Persistence

**Domain:** Oil & gas economics modeling SaaS application
**Researched:** 2026-03-05
**Confidence:** MEDIUM

## Standard Multi-Tenant SaaS Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ React Pages  │  │  UI State    │  │   Theme      │       │
│  │  (Routes)    │  │  Management  │  │   System     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
├─────────┴──────────────────┴──────────────────┴──────────────┤
│                     APPLICATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Hooks      │  │   Services   │  │   Adapters   │       │
│  │ (Business    │  │ (Repository  │  │  (Auth, DB)  │       │
│  │   Logic)     │  │   Pattern)   │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
├─────────┴──────────────────┴──────────────────┴──────────────┤
│                     DATA ACCESS LAYER                        │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Repository Interface                   │     │
│  │    (Abstracts persistence: Supabase | LocalStorage) │     │
│  └─────────────────┬───────────────────────────────────┘     │
├────────────────────┴──────────────────────────────────────────┤
│                   PERSISTENCE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Supabase    │  │   Postgres   │  │ localStorage │       │
│  │  (Auth/RLS)  │  │   Database   │  │   (Fallback) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Pattern: Shared Database + Row-Level Security

**What:** Single database instance with tenant_id column on all tables, enforced via Postgres RLS policies
**Why chosen:** Cost-effective, scalable to 10K+ tenants, native Postgres feature, works seamlessly with Supabase

**Alternatives considered:**
- **Database-per-tenant:** Too expensive, operationally complex (backups, migrations, monitoring)
- **Schema-per-tenant:** Better isolation but harder to query across tenants, migration complexity
- **Shared tables + application-level filtering:** Security risk (one WHERE clause bug = data leak)

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Presentation Layer** | User interface, routing, local UI state | React components, React Router, useState/useReducer |
| **Application Layer** | Business logic, orchestration, validation | Custom hooks, service modules, adapter pattern |
| **Data Access Layer** | CRUD operations, query construction | Repository pattern with TypeScript interfaces |
| **Persistence Layer** | Data storage, authentication, RLS enforcement | Supabase (Postgres + Auth + RLS) |
| **Economics Engine** | Deterministic calculations (pure functions) | Separate utility module, no persistence logic |

## Recommended Project Structure

Based on Slopcast's domain and existing patterns:

```
src/
├── pages/                    # Route-level components
│   ├── SlopcastPage.tsx      # Main workspace (uses useSlopcastWorkspace hook)
│   ├── HubPage.tsx           # Project list / switching
│   └── AuthPage.tsx          # Login / signup
├── components/               # Reusable UI components
│   ├── slopcast/             # Domain-specific components
│   │   ├── hooks/            # Component-scoped hooks
│   │   │   ├── useProjectPersistence.ts   # Supabase sync + localStorage fallback
│   │   │   └── useViewportLayout.ts       # UI state management
│   │   └── [feature components]
│   └── [shared components]
├── hooks/                    # App-level hooks
│   ├── useSlopcastWorkspace.ts   # Primary state management (862 lines)
│   ├── useDerivedMetrics.ts      # Calculated metrics
│   └── useKeyboardShortcuts.ts
├── services/                 # Data access layer (Repository pattern)
│   ├── projectRepository.ts      # Projects, groups, scenarios CRUD
│   ├── dealRepository.ts         # Deals, profiles CRUD
│   ├── profileRepository.ts      # Type curve, CAPEX, OPEX templates
│   ├── supabaseClient.ts         # Singleton client initialization
│   └── economicsEngine.ts        # Adapter: TypeScript calc OR Python backend
├── utils/                    # Pure functions (no side effects)
│   ├── economics.ts              # 661 lines, deterministic calculations
│   └── economics.test.ts         # 20 unit tests
├── auth/                     # Authentication adapter pattern
│   ├── AuthProvider.tsx          # Context provider
│   ├── DevBypassAdapter.ts       # Local dev (no auth required)
│   └── SupabaseAdapter.ts        # Production (Supabase Auth)
├── types.ts                  # All TypeScript interfaces
├── constants.ts              # Mock data, defaults
└── theme/                    # Theme system
    ├── ThemeProvider.tsx
    └── themes.ts
```

### Structure Rationale

- **services/:** Repository pattern isolates data access, makes testing easier (mock repositories), enables Supabase → Databricks migration path
- **hooks/:** Business logic lives in hooks (React idiom), keeps components pure JSX
- **utils/:** Pure functions for calculations, easily unit-testable, no React dependencies
- **auth/:** Adapter pattern allows swapping auth providers without changing app code
- **types.ts:** Single source of truth for all interfaces (avoids import cycles, easier refactoring)

## Architectural Patterns

### Pattern 1: Repository Pattern

**What:** Abstraction layer between business logic and data persistence. Services expose async CRUD methods, hide database details.

**When to use:** Multi-tenant SaaS with potential future migrations (Supabase → Databricks), need to swap persistence layers.

**Trade-offs:**
- **Pros:** Clean separation, testable (mock repositories), migration-friendly, consistent error handling
- **Cons:** Extra abstraction layer, more boilerplate, can feel over-engineered for simple apps

**Example:**
```typescript
// services/projectRepository.ts
export async function listProjects(): Promise<ProjectRecord[]> {
  await requireUserId();
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select('id, owner_user_id, name, description, active_group_id, ui_state, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    activeGroupId: row.active_group_id,
    uiState: (row.ui_state || {}) as ProjectUiState,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
```

**Application to Slopcast:**
- Already implemented for `projectRepository`, `dealRepository`, `profileRepository`
- Repository methods call `requireUserId()` to ensure authenticated context
- RLS policies on database enforce tenant isolation at data layer

### Pattern 2: Row-Level Security (RLS) Multi-Tenancy

**What:** Postgres feature that filters queries automatically based on current user session. Policies define who can SELECT/INSERT/UPDATE/DELETE which rows.

**When to use:** Shared database multi-tenancy when tenant isolation is critical (security, compliance).

**Trade-offs:**
- **Pros:** Enforced at database level (can't bypass), composable policies, works with ORMs/query builders
- **Cons:** Performance overhead (small), policy debugging can be tricky, requires auth context in DB connection

**Example:**
```sql
-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can only read projects they own or are members of
CREATE POLICY projects_read_access
ON public.projects
FOR SELECT
USING (public.has_project_access(id));

-- Function to check if user has access
CREATE FUNCTION public.has_project_access(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    LEFT JOIN public.project_members pm
      ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = target_project_id
      AND (p.owner_user_id = auth.uid() OR pm.user_id IS NOT NULL)
  );
$$;
```

**Application to Slopcast:**
- RLS enabled on: `wells`, `projects`, `project_members`, `project_groups`, `project_group_wells`, `project_scenarios`, `economics_runs`
- Policies enforce: owner can do everything, editor can update (not delete), viewer can only read
- Auth context (`auth.uid()`) automatically set by Supabase client from JWT

### Pattern 3: Optimistic Updates with Reconciliation

**What:** Update UI immediately (optimistic), persist to server asynchronously, reconcile IDs on response.

**When to use:** Improve perceived performance, hide network latency, especially for create operations.

**Trade-offs:**
- **Pros:** Instant UI feedback, feels faster, works offline (queue sync)
- **Cons:** Complex error handling (rollback UI?), ID reconciliation needed (temp IDs → server UUIDs), race conditions possible

**Example:**
```typescript
// components/slopcast/hooks/useProjectPersistence.ts
const reconcileIds = useCallback(
  (groupIdMap: Record<string, string>, scenarioIdMap: Record<string, string>) => {
    const groupsNeedChange = !sameIdMap(groupIdMap);
    const scenariosNeedChange = !sameIdMap(scenarioIdMap);
    if (!groupsNeedChange && !scenariosNeedChange) return;

    isHydratingRef.current = true;
    if (groupsNeedChange) {
      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          id: groupIdMap[group.id] || group.id,
        }))
      );
      setActiveGroupId((prev) => groupIdMap[prev] || prev);
    }
    // ...reconcile scenarios similarly
    queueMicrotask(() => {
      isHydratingRef.current = false;
    });
  },
  [setActiveGroupId, setGroups, setScenarios]
);
```

**Application to Slopcast:**
- User creates group with temp ID (e.g., `temp-123`)
- UI updates immediately
- Background save to Supabase returns UUID (e.g., `a5f3...`)
- Reconciliation updates all references: `temp-123` → `a5f3...`

### Pattern 4: Adapter Pattern for External Dependencies

**What:** Abstraction interface for swappable implementations (Auth: dev bypass vs Supabase, Economics: TypeScript vs Python backend).

**When to use:** Need to support multiple implementations (dev/prod, current/future tech), want to test without real dependencies.

**Trade-offs:**
- **Pros:** Swappable implementations, easier testing, future-proof
- **Cons:** Extra abstraction, more files, can be overkill if only one implementation ever exists

**Example:**
```typescript
// auth/AuthProvider.tsx
interface AuthAdapter {
  getStatus(): 'authenticated' | 'unauthenticated' | 'loading';
  getSession(): Session | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

// auth/DevBypassAdapter.ts
class DevBypassAdapter implements AuthAdapter {
  getStatus() { return 'authenticated' as const; }
  getSession() { return mockSession; }
  async signIn() { /* no-op */ }
  async signOut() { /* no-op */ }
}

// auth/SupabaseAdapter.ts
class SupabaseAdapter implements AuthAdapter {
  getStatus() { /* check supabase.auth.getSession() */ }
  getSession() { /* return actual session */ }
  async signIn(email, password) { /* supabase.auth.signInWithPassword() */ }
  async signOut() { /* supabase.auth.signOut() */ }
}
```

**Application to Slopcast:**
- `AuthProvider` wraps adapter, app code uses `useAuth()` hook (never touches Supabase directly)
- Local dev: `VITE_AUTH_MODE=bypass` → DevBypassAdapter
- Production: `VITE_AUTH_MODE=supabase` → SupabaseAdapter

### Pattern 5: Single Source of State with Derived Values

**What:** Store minimal state, compute derived values on-demand. Prevents sync bugs (two copies of same data drifting).

**When to use:** Complex data models with interdependencies, calculated metrics.

**Trade-offs:**
- **Pros:** No sync bugs, easier debugging, clear data flow
- **Cons:** Recomputation cost (use memoization), need to identify "source of truth"

**Example:**
```typescript
// hooks/useSlopcastWorkspace.ts
const [groups, setGroups] = useState<WellGroup[]>([]);
const [scenarios, setScenarios] = useState<Scenario[]>([]);

// Derived values (computed from source state)
const activeGroup = useMemo(
  () => groups.find(g => g.id === activeGroupId),
  [groups, activeGroupId]
);

const portfolioMetrics = useMemo(
  () => calculatePortfolioMetrics(activeGroup, scenarios),
  [activeGroup, scenarios]
);
```

**Application to Slopcast:**
- **Stored state:** `groups`, `scenarios`, `activeGroupId`, `wells`
- **Derived state:** `activeGroup`, `portfolioMetrics`, `flow` (monthly cash flow), `filteredWells`
- Economics calculations (`utils/economics.ts`) are pure functions: same input → same output

## Data Flow

### Request Flow: Save Project

```
User edits group assumptions
    ↓
onChange handler → setGroups(updated)
    ↓
useProjectPersistence detects change (useEffect)
    ↓
Debounce 1000ms
    ↓
buildPayload(groups, scenarios, uiState)
    ↓
projectRepository.saveProject(payload)
    ↓
Supabase RPC: save_project_bundle
    ↓
Postgres: INSERT/UPDATE with RLS enforcement
    ↓
Response: { projectId, groupIdMap, scenarioIdMap }
    ↓
reconcileIds(groupIdMap, scenarioIdMap) → update local state
    ↓
onStatusMessage('Project saved')
```

### State Management: No Redux, Hook-Based

```
useSlopcastWorkspace (862 lines)
    ↓ (provides state + actions)
    ↓
SlopcastPage (230 lines, pure JSX)
    ↓ (renders components)
    ↓
Child components (DesignWorkspace, EconomicsResults)
    ↓ (call actions from workspace hook)
    ↓
Actions update state → React re-renders
```

### Key Data Flows

1. **Hydration (load from database):**
   - User authenticates → `useProjectPersistence` triggers on `enabled: true`
   - `listProjects()` → get latest project → `getProject(id)` → hydrate state (groups, scenarios, UI state)
   - `isHydratingRef` flag prevents autosave during load

2. **Persistence (save to database):**
   - State changes → `useEffect` in `useProjectPersistence` detects snapshot change
   - Debounce 1000ms → `saveProject(payload)`
   - ID reconciliation if temp IDs → server UUIDs

3. **Economics calculation:**
   - User clicks "Run Economics" → `calculateDealMetrics(group, wells)` (pure function)
   - Result stored in `group.metrics` → displayed in UI
   - Optionally: `runEconomicsSnapshot(metrics)` → save to `economics_runs` table (audit trail)

4. **Demo mode:**
   - `useProjectPersistence({ enabled: false })` → no Supabase calls
   - State persists to `localStorage` only (existing pattern)
   - Mock wells from `constants.ts` used

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1K users** | Single Supabase instance, current architecture sufficient. Client-side economics calculations work fine. |
| **1K-10K users** | Add database connection pooling (Supabase automatic), consider caching for well metadata (rarely changes). Monitor RLS policy performance. |
| **10K-50K users** | Move economics calculations to backend API (Python FastAPI), add Redis for session/query cache, consider read replicas for analytics queries. |
| **50K+ users** | Separate databases: OLTP (Supabase) vs OLAP (Databricks), event-driven architecture (queue background calculations), CDN for static assets. |

### Scaling Priorities

1. **First bottleneck:** Economics calculations on large well sets (1000+ wells)
   - **Fix:** Move to backend API, parallelize calculations, cache results keyed by input hash
   - **Timeline:** Becomes issue around 5K+ users with heavy calculations

2. **Second bottleneck:** Database query performance (RLS policy overhead)
   - **Fix:** Add covering indexes on `(owner_user_id, updated_at)`, `(project_id, user_id)`, optimize RLS functions
   - **Timeline:** Becomes issue around 10K+ users with large project counts

3. **Third bottleneck:** Real-time collaboration (multiple users editing same project)
   - **Fix:** Supabase Realtime subscriptions, operational transform for conflict resolution, WebSocket connections
   - **Timeline:** Feature-dependent, not scale-dependent

## Anti-Patterns

### Anti-Pattern 1: Storing Calculated Results in UI State

**What people do:** Store `metrics` and `flow` arrays in component state alongside source data (groups, scenarios).

**Why it's wrong:** Two sources of truth. If source data changes, calculated results become stale unless manually recomputed. Sync bugs inevitable.

**Do this instead:** Store only source data, compute derived values with `useMemo`. Cache keyed by input hash if expensive.

```typescript
// ❌ BAD: Stored calculated results
const [groups, setGroups] = useState<WellGroup[]>([]);
const [metrics, setMetrics] = useState<DealMetrics>({});

// ✅ GOOD: Computed on-demand
const [groups, setGroups] = useState<WellGroup[]>([]);
const metrics = useMemo(
  () => calculateMetrics(groups),
  [groups]
);
```

### Anti-Pattern 2: Application-Level Tenant Filtering

**What people do:** Add `WHERE tenant_id = :current_tenant` to every query in application code.

**Why it's wrong:** One missed WHERE clause = data leak. Hard to audit, easy to forget in new queries.

**Do this instead:** Enforce tenant isolation at database level with RLS policies. Application code can't bypass it.

```sql
-- ✅ GOOD: Database enforces isolation
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_tenant_isolation
ON projects
FOR ALL
USING (owner_user_id = auth.uid() OR
       EXISTS (SELECT 1 FROM project_members
               WHERE project_id = projects.id
               AND user_id = auth.uid()));
```

### Anti-Pattern 3: Mixing Business Logic in Repository Layer

**What people do:** Put validation, calculated fields, business rules inside repository methods.

**Why it's wrong:** Repository becomes hard to test, violates single responsibility, hard to reuse logic elsewhere.

**Do this instead:** Repository does CRUD only. Business logic lives in hooks/services that call repositories.

```typescript
// ❌ BAD: Business logic in repository
export async function saveProject(payload: SaveProjectPayload) {
  // Validation
  if (!payload.name) throw new Error('Name required');

  // Business rule
  if (payload.groups.length > 100) throw new Error('Too many groups');

  // Persist
  await supabase.from('projects').insert(payload);
}

// ✅ GOOD: Repository does CRUD only
export async function saveProject(payload: SaveProjectPayload) {
  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Business logic in hook
function useProjectSave() {
  const save = async (payload: SaveProjectPayload) => {
    // Validation
    if (!payload.name) throw new Error('Name required');

    // Business rule
    if (payload.groups.length > 100) throw new Error('Too many groups');

    // Delegate to repository
    return await saveProject(payload);
  };
  return { save };
}
```

### Anti-Pattern 4: Fetching Entire Collections Without Pagination

**What people do:** `SELECT * FROM wells` → load all wells into memory at once.

**Why it's wrong:** Works fine with 40 mock wells. Breaks at 10K+ wells. Memory explosion, slow UI.

**Do this instead:** Pagination (offset/limit), virtual scrolling, or lazy loading.

```typescript
// ❌ BAD: Load everything
const wells = await supabase.from('wells').select('*');

// ✅ GOOD: Paginate
const PAGE_SIZE = 100;
const wells = await supabase
  .from('wells')
  .select('*')
  .range(offset, offset + PAGE_SIZE - 1);

// ✅ BETTER: Server-side filtering
const wells = await supabase
  .from('wells')
  .select('*')
  .eq('status', 'PRODUCING')
  .ilike('operator', `%${searchTerm}%`)
  .limit(100);
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Supabase Auth** | Adapter pattern via `SupabaseAdapter` | JWT stored in localStorage, auto-refresh, RLS uses `auth.uid()` |
| **Supabase Database** | Repository pattern via `projectRepository`, `dealRepository` | Postgres with RLS, JSONB columns for flexible schema |
| **Python Backend** (future) | Adapter pattern via `economicsEngine` | FastAPI for heavy calculations, switch via feature flag |
| **Databricks** (future) | New repository implementation | Same interface as Supabase repos, swap at runtime |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Presentation ↔ Application** | Hook calls (e.g., `useSlopcastWorkspace`) | Components are pure JSX, hooks contain logic |
| **Application ↔ Data Access** | Repository methods (async functions) | Repositories return domain types (not DB rows) |
| **Data Access ↔ Persistence** | Supabase client (direct queries) | RLS enforced automatically, no manual filtering needed |
| **Economics Engine ↔ Application** | Pure function calls (synchronous) | No side effects, easily unit-testable |

## Multi-Tenant Data Model

### Tenant Scoping Strategy

**Organization-level isolation:**
- Each user belongs to an organization (implicit via `auth.users` table extension in future)
- Projects owned by user → shared with organization members via `project_members` table
- Wells scoped to organization (not shared across orgs)

**Current implementation (user-level isolation):**
- Projects owned by user (`owner_user_id`)
- Collaboration via `project_members` (invite by email)
- Wells currently global (any authenticated user can read) — **needs refinement for true multi-tenancy**

**Recommended enhancement:**
```sql
-- Add organization table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user → org mapping
ALTER TABLE auth.users
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Scope wells to organizations
ALTER TABLE wells
ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Update RLS policies to use organization_id
CREATE POLICY wells_org_isolation
ON wells FOR SELECT
USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));
```

### Collaboration Model

**Roles:**
- **Owner:** Full control (delete project, manage members)
- **Editor:** Can modify groups, scenarios, run economics
- **Viewer:** Read-only access

**Implementation:**
- `project_members` table stores `(project_id, user_id, role)`
- RLS policies check: `owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM project_members WHERE project_id = :id AND user_id = auth.uid())`
- Repository methods call `current_project_role()` function to enforce write permissions

## Calculated Results Storage Strategy

**Question:** Store calculated metrics in database or recompute on-demand?

**Trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| **Store results** | Fast retrieval, audit trail, compare historical runs | Storage cost, stale if assumptions change, cache invalidation complexity |
| **Recompute on-demand** | Always fresh, no storage cost, simpler code | Compute cost, slower for large well sets, CPU bottleneck |
| **Hybrid (current)** | Compute on frontend (fast for <100 wells), optionally store to `economics_runs` for audit | Best of both, audit trail optional | Works until backend API needed |

**Current implementation (Hybrid):**
- Economics calculated on-demand in browser (`utils/economics.ts`)
- Optionally saved to `economics_runs` table with `input_hash` for auditing
- Results not retrieved for display (always recalculated)

**Recommendation:**
- Keep current approach until calculation time > 2 seconds
- When moving to backend API (Python), cache results keyed by `input_hash`
- Serve from cache if `input_hash` matches previous run

## Supabase-Specific Patterns

### JSONB for Flexible Schemas

**Use JSONB columns for:**
- `type_curve`: TypeCurve parameters (may add fields without migration)
- `capex`: Array of CapexItem objects
- `opex`: Array of OpexSegment objects
- `ownership`: Ownership assumptions + JV agreements
- `ui_state`: User preferences, filters, tab selection

**Advantages:**
- No migrations for schema changes within JSONB
- Store complex nested data without join tables
- Postgres JSONB supports indexing, querying (`->`, `->>` operators)

**Disadvantages:**
- No referential integrity within JSONB
- Harder to query (GIN indexes help)
- Type safety only at application layer

### RPC for Complex Transactions

**Use `supabase.rpc()` for:**
- Multi-table inserts/updates that must be atomic
- Example: `save_project_bundle` inserts project + groups + scenarios + well associations in single transaction

**Example:**
```sql
CREATE FUNCTION save_project_bundle(
  p_project_id UUID,
  p_name TEXT,
  p_groups JSONB,
  p_scenarios JSONB
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Insert/update project
  INSERT INTO projects (id, name, ...)
  VALUES (COALESCE(p_project_id, gen_random_uuid()), p_name, ...)
  ON CONFLICT (id) DO UPDATE SET name = p_name, ...
  RETURNING id INTO v_project_id;

  -- Delete old groups/scenarios
  DELETE FROM project_groups WHERE project_id = v_project_id;

  -- Insert new groups
  INSERT INTO project_groups (id, project_id, name, ...)
  SELECT ...FROM jsonb_to_recordset(p_groups) AS ...;

  RETURN v_project_id;
END;
$$;
```

**Advantages:**
- Atomic (all succeed or all fail)
- Fewer round-trips (1 RPC vs N queries)
- Complex logic on server (better performance)

**Disadvantages:**
- Harder to debug (PL/pgSQL syntax)
- Less visible than query builder
- Versioning complexity (migrations for function changes)

## Sources

**Note:** Web tools were unavailable during research. Findings based on established multi-tenant SaaS patterns, Postgres RLS best practices, and React architecture conventions (training data through January 2025). Specific recommendations verified against existing Slopcast codebase structure.

**Confidence levels:**
- **Multi-tenant patterns (RLS, shared database):** HIGH (stable patterns, well-documented in Postgres/Supabase docs)
- **Repository pattern in TypeScript:** HIGH (established pattern, verified in Slopcast codebase)
- **React hook-based architecture:** HIGH (current React best practice, used extensively in Slopcast)
- **Supabase-specific patterns (RPC, JSONB):** MEDIUM (based on Supabase documentation patterns, but unable to verify current 2026 best practices)
- **Scaling thresholds:** MEDIUM (based on general SaaS benchmarks, actual numbers depend on calculation complexity)

**Recommended validation:**
- Verify Supabase RLS policy performance at scale with realistic dataset
- Benchmark economics calculation time on frontend (target: <2s for 100 wells)
- Confirm organization-level tenant isolation requirements with stakeholders
- Test collaboration features (invites, role enforcement) before production launch

---
*Architecture research for: Slopcast Data Persistence Layer*
*Researched: 2026-03-05*
*Confidence: MEDIUM (web tools unavailable, based on stable architectural patterns + existing codebase analysis)*
