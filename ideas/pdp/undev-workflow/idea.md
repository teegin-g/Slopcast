# Forecasting App Restructure: PDP / Undev Workflow Split

## Problem Statement

The current forecasting app has accumulated clutter across three dimensions:

1. **Too many buttons on the map / well-selection screen.** Layers, filters, selection modes, exports, and grouping actions all compete for visual real estate. Users hesitate before clicking because the consequences of each button aren't obvious.
2. **Economics screen is overloaded with assumptions.** Type curves, LOE structures, ownership, differentials, capex, schedule, and forecast adjustments all share one screen. About half of any given screen's fields are irrelevant to the workflow the user is actually doing.
3. **Navigation between screens is clunky and unclear.** No persistent sense of "where am I in the process," no visible completion state, and no clear forward path from one stage to the next.

The root cause is a structural mismatch: PDP and Undeveloped workflows have been forced to share screens that really want to speak different languages.

- **PDP** is "what's already declining and what does it cost to keep producing." The verbs are *find*, *select*, *forecast*, *operate*.
- **Undev** is "what are we choosing to drill and what will it make." The verbs are *design*, *create*, *schedule*, *invest*.

These are fundamentally different cognitive tasks. Trying to handle both with one set of forms produces button bloat, irrelevant fields, and the feeling that the tool is fighting you.

## Solution Overview

Split the app into **two parallel tracks (PDP and Undev)** that share an upstream acreage filter and converge at a downstream Scenarios tab. Each track has its own selection screen and its own economics screen, tailored to the verbs of that workflow.

The **project**, not the scenario, is the unit of state. A project contains a filtered universe, optional PDP work, optional Undev work, and one or more scenarios that sensitize global variables across both tracks.

## Architecture

### Project as the container

A project is a long-lived workspace. It holds:

- **Acreage filter / universe** — the upstream filter that defines what wells and acreage are in scope
- **PDP groupings + assumptions** — zero or more PDP groups, each with their own forecast sources, LOE, ownership, etc.
- **Undev programs + assumptions** — zero or more Undev programs, each with DSUs, type curves, capex, schedules, etc.
- **Scenarios** — global variable sets that sensitize the project's outputs

A project can have only PDP work, only Undev work, or both. The tracks are independent in their data but converge at the Scenarios layer.

### Stage 0 — Acreage filter (shared)

One screen, one job: define the universe.

**Inputs:** operator, area, formation, vintage range, lease status, other relevant filter dimensions.

**Output:** a filtered well/acreage set that becomes the project's working scope. Project gets named and persisted at this point.

This screen is intentionally minimal. The user is just establishing scope; no analysis happens yet.

### Stage 1 — Track picker

After filtering, the user lands on a track picker. Two cards:

- **Build PDP group** — select existing wells, assign forecast sources, set LOE
- **Build Undev program** — design DSUs on acreage, assign type curves, set capex

Each card shows a status indicator: empty, in-progress, or complete (with a count of groups/programs built). Clicking a card enters that track. Users can return to the picker at any time to switch tracks or start new ones.

This is **not** a hard fork. Both tracks live inside the same project, and the user can move between them freely. The picker is more like a tab selector than a one-way door.

### Stage 2A — PDP track

Two screens:

1. **Wells screen** — map + filter panels, scoped to producing wells from the filtered universe. Selection builds a PDP group.
2. **Forecast screen** — pick forecast source per well or per group, plus LOE, differentials, ownership. No type curves on this screen.

### Stage 2B — Undev track

Two screens:

1. **Wells screen** — same map component, but in DSU-creation mode. Draw or auto-generate DSUs, assign spacing.
2. **Type curve & economics screen** — assign or create TCs per DSU/bench, spacing assumptions, capex, schedule, LOE.

### Stage 3 — Scenarios (convergence)

Global variables apply across both tracks by default, with the option to **break out variables by track** when needed.

**UI metaphor:** each global variable starts as a single value. An "unlock" toggle splits it into two fields (PDP and Undev). For example:

- Price deck starts as one strip; unlock → strip for PDP, $60 flat for Undev
- Forecast adjustment starts as one multiplier; unlock → −5% PDP, +10% Undev
- Capex inflation, LOE escalation, discount rate, etc. all follow the same pattern

This keeps the screen visually simple by default but lets power users diverge variables when they need to.

**Results panel** offers two views:

- **Combined** — portfolio NPV, single cashflow waterfall, blended PV/PI/IRR metrics
- **Side-by-side** — PDP column, Undev column, totals column

Toggle between them with a segmented control.

## Anti-clutter Principles

These rules prevent the new structure from re-bloating over time. Treat them as design constraints, not suggestions.

### Map screen has one primary action

The map's primary action is "Add to group" (PDP) or "Add to program" (Undev). Everything else — layers, filters, exports, grouping helpers — lives in collapsible right rails or a command palette.

- Filter panels collapse by default, with a "filters active" badge when something is set
- Layer toggles live in a single popover, not as a row of buttons across the top
- Export and bulk actions live in an overflow menu
- Selection mode is a single toggle (lasso vs click), not three separate buttons

### Economics screens use progressive disclosure

For each section (LOE, ownership, differentials, etc.), show the 5 most-used fields by default. Hide the rest behind an "Advanced" expander.

Rationale: when these screens were first built, you didn't know which fields were the 90% case. Now you do. The advanced fields shouldn't disappear, but they shouldn't compete for attention with the everyday ones.

### Navigation is a persistent left rail

The rail shows the project's stages with completion state:

```
Stage 0  Acreage filter           ✓
Stage 1  Track picker             ✓
PDP      Wells                    ✓
PDP      Forecast                 ⋯ (in progress)
Undev    Wells                    ○
Undev    Economics                ○
Stage 3  Scenarios                ○
```

Users always know where they are, what's left, and what they can jump to.

### Global variables live in Scenarios, not in per-track screens

If you'd want to sensitize a variable across the whole project, it belongs in Scenarios. Per-track screens are for *characterizing the assets*; Scenarios is for *stress-testing the business case*.

This is the discipline that keeps economics screens from re-bloating. Anytime you're tempted to add a new field to the PDP forecast screen, ask: "would I want to sensitize this across the project?" If yes, it goes in Scenarios.

### Shared map, separate forms

The map component is shared across PDP and Undev with a `mode` prop. Two map components would drift and force every bug to be fixed twice.

The economics forms, by contrast, are separate components even though they share fields like LOE and ownership. Defaults, granularity, and override patterns differ enough that one shared component would end up with conditional rendering everywhere. Two separate forms that happen to use the same underlying data shape is cleaner.

### One primary CTA per screen

Every screen has exactly one button styled as the primary CTA. Other actions are secondary or tertiary. If you find yourself wanting two primary buttons, the screen probably needs to be split.

## Feature Specs

### PDP — Wells / Selection screen

**Mental model:** find producing wells and group them for forecasting.

**Filters:**

- Production status: active, shut-in, TA, recently returned to production
- Days since last production
- Vintage: first production date range, completion date range
- Performance: cumulative production, current rate, peak rate, months on production, decline state (early/transient vs boundary-dominated)

**Map enhancements:**

- **Forecast availability indicator** — color-code wells on the map by which forecast sources have them (Enverus, Novi, S&P, in-house). Reveals coverage gaps before users commit to a group
- **Ownership view toggle** — show WI/NRI on hover or as a layer. PDP economics live and die by ownership accuracy
- **Status overlay** — visual differentiation for active, shut-in, and recently returned wells

**Selection helpers:**

- Lasso, click-to-add, shift-click for ranges
- Quick-select by lease, DSU, pad, formation, vintage cohort
- Aggregation preview as wells are selected: well count, current rate, cum, EUR (if forecasts available), avg months on prod

**Quality / safety:**

- Dedupe / overlap warnings: flag wells already assigned to another PDP group in the same project
- "Selection contains shut-in wells" warning if user might not have intended to include them

**Output:** a named PDP group with a list of well IDs, ready for the forecast screen.

### PDP — Forecast / Economics screen

**Mental model:** tell me whose forecast to trust and what it costs to keep producing.

**Forecast handling:**

- **Forecast source picker** — per-well or bulk-assign. Sources: Enverus, Novi, S&P, in-house, user upload (CSV). Show source date so staleness is visible at the row level
- **Forecast reconciliation view** — side-by-side or overlay of multiple sources for the same well, with a "pick winner" action. This is one of the highest-value features in the whole app and isn't well-served by any competitor
- **Forecast adjustment** — per-well or per-group multiplier (the ±% miss factor), plus minimum rate floors and economic limit overrides

**Cost / operating assumptions:**

- LOE structure: fixed $/well/month + variable $/boe, with escalation. Per-well overrides for known problem wells
- Workover assumptions: frequency, cost, uplift (optional — skip if not modeled)
- Differentials: oil, gas, NGL — flat or by stream, with override per group

**Ownership and tax:**

- WI, NRI, ORRI — pulled from data source with override capability
- Reversion logic if supported (BPO/APO)
- Severance and ad valorem: state defaults with override

**Termination logic:**

- Economic limit logic: rate-based, cashflow-based, or date-based abandonment
- Per-well overrides for wells with known abandonment dates

**Output:** a fully parameterized PDP group ready to feed Scenarios.

### Undev — Wells / Selection screen

**Mental model:** design a drilling program on this acreage. Completely different verbs from PDP — you're *creating* inventory, not selecting it.

**Acreage view:**

- Lease boundaries
- Formation outlines
- Existing wellbores (as constraints, not selectable items)
- Competitor activity (recent permits, completions)

**DSU creation tools:**

- Manual polygon draw
- Auto-generate from section grid
- Snap to lease boundaries
- Snap to existing units
- Bulk-create from a template (e.g., "every section in this area gets a standard 2-mile DSU")

**Spacing and bench assignment:**

- Spacing templates: pick a template (e.g., "4 wells per DSU, 660' spacing, Wolfcamp A") and apply to selected DSUs in bulk
- Bench / zone assignment: stack multiple benches per DSU with independent well counts per bench
- Lateral length calculation: auto-compute from DSU geometry, with manual override

**Co-development logic:**

- Parent-child / co-development flags: mark wells as parents, children, or co-dev so degradation can be applied later
- Visual indicator on the map for parent wells nearby

**Inventory summary:**

- Running totals as DSUs are built: DSU count, gross locations, net locations (after WI), total lateral footage, acreage utilization percentage

**Conflict detection:**

- DSUs that overlap existing producing wells
- DSUs on leases not owned
- DSUs that overlap other DSUs in the same project
- Lateral lengths below or above template thresholds

**Schedule placeholder:**

- Rough drill order or priority tier (refined in econ screen)

**Output:** an Undev program containing DSUs, locations per bench per DSU, and spacing/co-dev metadata.

### Undev — Economics screen

**Mental model:** what will these locations make and what will they cost?

**Type curve assignment:**

- Pick from library or create new
- Assign per DSU, per bench, or per area
- Allow blending or weighting if multiple analog sets apply
- Visual indication of which DSUs/benches still need TCs assigned

**Type curve builder:**

- Arps parameters (qi, Di, b, Dmin) or segmented
- Normalization basis (per 1000' lateral, per stage, etc.)
- Save to library for reuse
- *(See the wine rack assumption builder doc for the analog-driven flow)*

**Production scaling:**

- Lateral length scaling: how TC scales with actual lateral length (linear, sub-linear, capped)
- Spacing / parent-child degradation: % haircut as a function of well count per DSU or proximity to parents

**Capital:**

- Capex structure: D&C cost per well with breakdown (drilling, completion, facilities, flowback)
- Per-foot or per-stage scaling
- Inflation/deflation curve over the program
- Capex timing: spud-to-first-production lag, distribution of capex across that window

**Schedule:**

- Rig count
- Wells per rig per year
- Drill order by DSU or tier
- Cycle time assumptions: rig productivity changes over time (optional)

**Operating assumptions:**

- LOE: similar to PDP but with a ramp (higher early life, settles down)
- Ownership, differentials, taxes: same as PDP but typically more uniform across a program

**Output:** a fully parameterized Undev program ready to feed Scenarios.

### What lives in Scenarios (not on either econ screen)

These belong in the Scenarios tab because they're typically sensitized across the project, not characterized once per group:

- Price decks (strip, flat, custom)
- Discount rate
- Effective / as-of date
- Inflation curves
- Global capex / LOE multipliers
- Macro forecast adjustments (e.g., "add 5% uplift to all PDP, 10% miss to all Undev")
- Per-track variable splits (the "unlock" toggle described above)

### Scenarios screen UI sketch

```
┌─────────────────────────────────────────────────────────┐
│  Scenario: Base Case                          [Run]     │
├─────────────────────────────────────────────────────────┤
│  Price deck       [Strip ▾]              🔓 Split       │
│  Discount rate    [10%]                  🔓 Split       │
│  Forecast adj     [0%]                   🔒 PDP -5%     │
│                                              Undev +10% │
│  Capex inflation  [3%/yr]                🔓 Split       │
│  LOE escalation   [2%/yr]                🔓 Split       │
├─────────────────────────────────────────────────────────┤
│  Results          [Combined ▾] Side-by-side             │
│                                                         │
│  NPV10            $XXX MM                               │
│  IRR              XX%                                   │
│  Payout           X.X yrs                               │
│  [cashflow chart]                                       │
└─────────────────────────────────────────────────────────┘
```

A scenario is a saved set of these inputs. Multiple scenarios per project (e.g., "Base," "Strip," "Bear," "Bull") let users compare quickly.

## Migration Path

Suggested order of attack so the rebuild can ship incrementally:

1. **Build the project model and Stage 0 acreage filter first.** This is the foundation everything else hangs off, and it's mostly new code (existing app probably doesn't have a project concept).
2. **Port the existing map screen into PDP wells mode.** Keep functionality identical at first; just relocate it under the new navigation. Add the forecast availability indicator as the first new feature since it's high-value and self-contained.
3. **Build the PDP forecast screen.** This replaces the existing economics screen for the PDP path. Port LOE, ownership, etc. and add the forecast source picker and reconciliation view.
4. **Build the Undev wells screen.** This is the most novel piece — the existing app doesn't really do DSU creation. Start with manual polygon draw and section-grid auto-generation.
5. **Build the Undev economics screen.** Type curve assignment from a library (even if the library is just "pick from a list"), capex, schedule.
6. **Build Scenarios.** Start with combined view only; add side-by-side and the per-track unlock toggle in a follow-up.
7. **Layer in the wine rack view** as a third mode on the PDP wells screen, then extend it with the assumption builder. *(See the wine rack doc.)*

Each step ships standalone value and the user can use the new structure progressively.

## Open Questions

- **Forecast reconciliation UI** — what's the best interaction for picking a "winner" between Enverus, Novi, S&P, and in-house forecasts on the same well? Overlay, side-by-side, or scoring? Worth prototyping.
- **Project vs scenario persistence** — does a project save automatically or require explicit save? How are unsaved changes surfaced?
- **Multi-user / sharing** — out of scope for v1, but worth designing the project model with eventual sharing in mind (project IDs, ownership, permissions).
- **Spacing degradation curve representation** — store as a lookup table, parametric function, or both?
- **Project-level vs library-level assumptions** — should a saved TC live in a global library (reusable across projects) or be scoped to a project? Probably both, with promotion from project to library.
- **Undo / scenario history** — do scenarios have versions? Can a user roll back?