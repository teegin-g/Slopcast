# Ideas — Integration & Execution Plans

## Source Ideas
- [`pdp/undev-workflow/idea.md`](pdp/undev-workflow/idea.md) — PDP/Undev workflow split
- [`wine-rack-visual/idea.md`](wine-rack-visual/idea.md) — Wine Rack view + assumption builder

## Analysis & Plans

| Document | Purpose |
|----------|---------|
| [`00-research-synthesis.md`](00-research-synthesis.md) | Agent team findings: current architecture, gap analysis, reusable assets, tech debt, critical path |
| [`01-parallelization-strategy.md`](01-parallelization-strategy.md) | 12 work streams, 4-wave dependency graph, agent team sizing, conflict avoidance rules |

## Per-Stream Execution Plans

### Wave 0 — Foundation (3 agents, parallel)
| Plan | Stream | Agent |
|------|--------|-------|
| [`wave-0-stream-01-types.md`](02-stream-plans/wave-0-stream-01-types.md) | Types & Data Model | `types-agent` |
| [`wave-0-stream-10-backend-production.md`](02-stream-plans/wave-0-stream-10-backend-production.md) | Backend Production Data | `backend-data-agent` |
| [`wave-0-stream-12-schema.md`](02-stream-plans/wave-0-stream-12-schema.md) | Persistence Schema | `schema-agent` |

### Wave 1 — Infrastructure (4 agents, parallel)
| Plan | Stream | Agent |
|------|--------|-------|
| [`wave-1-stream-02-workspace-decomposition.md`](02-stream-plans/wave-1-stream-02-workspace-decomposition.md) | Workspace Hook Decomposition | `hooks-agent` |
| [`wave-1-streams-3-8-11.md`](02-stream-plans/wave-1-streams-3-8-11.md) | Navigation (Stream 3) | `nav-agent` |
| [`wave-1-streams-3-8-11.md`](02-stream-plans/wave-1-streams-3-8-11.md) | Wine Rack Renderer (Stream 8) | `renderer-agent` |
| [`wave-1-streams-3-8-11.md`](02-stream-plans/wave-1-streams-3-8-11.md) | Backend Fit Endpoints (Stream 11) | `fit-agent` |

### Wave 2 — Screens (5-6 agents, mostly parallel)
| Plan | Stream | Agent |
|------|--------|-------|
| [`wave-2-all-streams.md`](02-stream-plans/wave-2-all-streams.md) | Map Enhancement (Stream 4) | `map-agent` |
| [`wave-2-all-streams.md`](02-stream-plans/wave-2-all-streams.md) | PDP Track Screens (Stream 5) | `pdp-agent` |
| [`wave-2-all-streams.md`](02-stream-plans/wave-2-all-streams.md) | Undev Track Screens (Stream 6) | `undev-agent` |
| [`wave-2-all-streams.md`](02-stream-plans/wave-2-all-streams.md) | Scenario Enhancement (Stream 7) | `scenario-agent` |
| [`wave-2-all-streams.md`](02-stream-plans/wave-2-all-streams.md) | Assumption Builder (Stream 9) | `builder-agent` |

### Wave 3 — Integration (2-3 agents, sequential)
- Full persistence implementation (Stream 12)
- Cross-stream E2E flow testing
- Anti-clutter / progressive disclosure audit

## Quick Reference: Dependency Graph

```
Wave 0: [Stream 1] [Stream 10] [Stream 12-schema]
           │            │
Wave 1: [Stream 2]  [Stream 11]  [Stream 8]  [Stream 3]
           │    │                    │            │
Wave 2: [Stream 4] [Stream 5] [Stream 6] [Stream 7] [Stream 9]
           │          │          │          │          │
Wave 3: ─────────── Integration + Persistence ────────────
```

## How to Execute

1. Start Wave 0 agents in parallel (3 agents)
2. Gate: types compile, backend production endpoint works, schema SQL is valid
3. Start Wave 1 agents in parallel (4 agents)
4. Gate: app renders with new nav, Wine Rack renders in Storybook, fit endpoints respond
5. Start Wave 2 agents (5-6 agents, Stream 6 waits for Stream 4)
6. Gate: full PDP flow, full Undev flow, assumption builder saves with provenance
7. Start Wave 3 for integration + persistence + polish
