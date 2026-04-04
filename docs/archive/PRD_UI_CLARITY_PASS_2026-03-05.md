# PRD — UI Clarity Pass (Declutter, Make State Obvious)

**Product:** Slopcast (O&G deal evaluation + scenario analysis)  
**Audience:** Product manager / AI supervisor (delegation-ready)  
**Date:** 2026-03-05  
**Status:** Draft (ready to slice into subagent workstreams)

---

## 1) Executive Summary (1-page)

### Problem
New and casual users experience the workspace as *cluttered* and *high-risk to click*:
- Multiple stacked control bars compete for attention (navigation vs status vs selection vs content controls).
- Many controls look similar despite operating at different scopes (deal vs scenario vs group vs field).
- Primary “next action” is often unclear; some screens present dead-ends (“Awaiting results…”) without guidance.
- Mobile defaults to long, dense scroll with key actions not anchored.
- Theme switching can feel like entering a different product (naming/identity shifts), reducing trust.

### Goal (what success feels like)
Slopcast feels like a guided decision tool:
1. The next best action is obvious within **3 seconds** on each main surface.
2. Users always know **where they are**, **what is selected**, and **what will change** if they click.
3. Advanced power controls remain available, but are not constantly competing for attention.
4. Mobile becomes “review + tweak + compute”, not an endless cockpit scroll.
5. Asynchronous compute is trustworthy (clear lifecycle, no dead ends).

### Approach
Establish **UI contracts** (hierarchy + scope + state legibility), then redesign the primary surfaces around:
- **Progressive disclosure** (default simple, advanced discoverable)
- **Explicit scope separation** (app / workspace / selection / field)
- **State-aware UI** (fresh/stale/running/failed; saved/dirty; selection required)

### Out of scope
- Rewriting economics/engine algorithms.
- Large re-skin / brand overhaul (themes remain, structure becomes consistent).

---

## 2) Evidence & Review Artifacts

These artifacts show what a “random user” sees today (desktop + mobile, `mario` and `slate`).

**Home**
- `/Users/teegingroves/Programming/Slopcast/output/playwright/desktop-home-slate-default.png`
- `/Users/teegingroves/Programming/Slopcast/output/playwright/mobile-home-slate-default.png`

**Workspace / Builder**
- `/Users/teegingroves/Programming/Slopcast/output/playwright/desktop-builder-slate.png` (mario/classic)
- `/Users/teegingroves/Programming/Slopcast/output/playwright/mobile-builder-slate.png` (mario/classic)
- `/Users/teegingroves/Programming/Slopcast/output/playwright/desktop-builder-slate-theme.png` (slate)
- `/Users/teegingroves/Programming/Slopcast/output/playwright/mobile-builder-slate-theme.png` (slate)

**Scenarios**
- `/Users/teegingroves/Programming/Slopcast/output/playwright/desktop-scenarios-slate.png` (mario/classic)
- `/Users/teegingroves/Programming/Slopcast/output/playwright/mobile-scenarios-slate.png` (mario/classic)
- `/Users/teegingroves/Programming/Slopcast/output/playwright/desktop-scenarios-slate-theme.png` (slate)

**Compute dead-end example**
- `/Users/teegingroves/Programming/Slopcast/output/playwright/desktop-engine-comparison-awaiting.png`

Related historical review (useful baseline):
- `docs/ui-ux-review.md`

---

## 3) Personas & Primary Jobs-to-be-Done

### Persona A — Deal Evaluator (primary)
Wants to quickly answer:
- “Is this deal attractive under reasonable assumptions?”
- “What are the biggest drivers? What breaks it?”

### Persona B — Scenario Builder (power)
Wants to:
- Create and compare scenarios.
- Understand deltas vs a baseline without losing context.

### Persona C — Viewer / Exec (secondary)
Wants:
- A clean “results story” (highlights + drivers + charts), minimal knobs.

---

## 4) Product Principles / UI Contracts (non-negotiable)

These are the rules that prevent regression back to clutter.

1. **One primary action per surface**
   - Every screen/panel has exactly one “most likely next action”.
2. **Scope clarity**
   - Every action is clearly scoped as one of:
     - **App/global** (account, theme, hub)
     - **Workspace/deal** (save/share/export/deal settings)
     - **Selection** (group/scenario actions)
     - **Field** (parameter edits)
3. **Status ≠ Action**
   - Status appears as badges/labels; actions are buttons.
4. **State is always legible**
   - Users can always see: selected group, selected scenario, compute freshness, and saved/dirty state.
5. **Progressive disclosure by default**
   - Advanced controls are discoverable, not omnipresent.
6. **Async work has a lifecycle**
   - Queued → Running → Succeeded (timestamp) → Failed (reason + retry).
   - Never show “Awaiting…” without context + user options.

---

## 5) Proposed UX Changes (Epics)

Each epic is written for delegation: “what changes in the experience” and “how we know it’s done”.

### Epic A — Home: “Start fast, don’t look broken”

**Today (pain):**
- Competing CTAs; duplicate “New Deal”; disabled Search reads like a bug.

**Target experience:**
- Home offers a clear 3-path start:
  1) **Create New Deal** (primary)
  2) **Open Recent / Saved** (secondary, list-driven)
  3) **Search** (optional, live search with results as you type)

**Acceptance criteria:**
- Only one primary “create” CTA is visually dominant.
- Search does not present a disabled-looking primary control.
- Empty states explain what to do next (create, load, or try a template/demo).

---

### Epic B — App Shell: “One header, clear layers”

**Today (pain):**
- Multiple stacked bars look equally important; navigation layers blur.

**Target experience:**
- A consistent hierarchy across the app:
  - **Global header:** brand, workspace name, hub, theme/account menus
  - **Module nav:** DESIGN / SCENARIOS
  - **Selection summary bar:** group/scenario + compute + save state
  - **Content tabs:** summary/charts/drivers/reserves (only where relevant)

**Acceptance criteria:**
- A new user can answer “where am I?” at a glance (global vs module vs content).
- Contextual actions (clone/focus/etc.) no longer compete as top-level CTAs.

---

### Epic C — Selection & Scope: “What am I editing right now?”

**Today (pain):**
- Risky clicks; unclear whether a control affects deal vs scenario vs group.

**Target experience:**
- A persistent “Selection Summary” that shows:
  - Editing group
  - Active scenario
  - Compute status (fresh/stale/running/failed)
  - Save state (saved/dirty)
- Scope labeling on impactful actions (“Applies to Scenario”, “Applies to Deal”, etc.).

**Acceptance criteria:**
- Users can always identify current group + scenario without hunting.
- Any action that affects more than a field declares its scope.

---

### Epic D — Builder: “Setup → Results” with progressive disclosure

**Today (pain):**
- Setup knobs, decision outputs, and deep tables all appear simultaneously.

**Target experience:**
- Default view prioritizes **results + drivers** with a concise “Key assumptions” block.
- Advanced sections are collapsed until opened (“Advanced”, “Edit”, “Details”).
- Dense views (forecast grid) are treated as “deep detail”:
  - summarized in-place, full detail in a dedicated view.

**Acceptance criteria:**
- The default desktop viewport emphasizes decision outputs first.
- Mobile does not require scrolling through dense tables to reach core actions.

---

### Epic E — Scenarios: “Compare without losing context”

**Today (pain):**
- Users can’t always tell active vs compared; blank/empty charts feel broken.

**Target experience:**
- SCENARIOS has two clear regions:
  - Scenario list (create/select)
  - Comparison canvas (overlay + sensitivity)
- Clear states:
  - “Active scenario”
  - “Included in overlay”
- Every visualization has explicit empty/loading/error states.

**Acceptance criteria:**
- Users can always identify which scenario is active and which are being compared.
- No blank chart without an explanation + next step.

---

### Epic F — Compute UX: “Never a dead end”

**Today (pain):**
- “Awaiting results…” with no progress, reason, or action.

**Target experience:**
- Standard compute status pattern used everywhere:
  - **Running:** progress + cancel
  - **Succeeded:** timestamp + rerun
  - **Failed:** reason + view details + retry
  - **Stale:** “inputs changed” + recompute

**Acceptance criteria:**
- Compute surfaces always provide: **what’s happening**, **why**, **what you can do now**.

---

### Epic G — Mobile: “Review-first, actions anchored”

**Today (pain):**
- Long scroll; key actions not anchored; context gets lost.

**Target experience:**
- A compact sticky selection summary.
- A small persistent action strip for the primary action (state-aware).
- Deep content (tables) opens into dedicated detail views with clear back navigation.

**Acceptance criteria:**
- A mobile user can recompute/save without scrolling “back to find the buttons”.

---

### Epic H — Theme consistency: “Same app, different coat”

**Today (pain):**
- Theme switching can feel like a different product; missing assets/blank visuals harm trust.

**Target experience:**
- Themes change styling, not information architecture or product identity.
- Consistent empty/loading/error states across themes.

**Acceptance criteria:**
- Switching `slate` ↔ `mario` does not change product naming or structure.
- Any theme-specific rendering gaps are handled with explicit states (not silent blank).

---

## 6) Success Metrics (how we measure impact)

### Quantitative (instrumentable)
- **Time-to-first-meaningful-output:** from landing to first computed result / scenario comparison.
- **Navigation churn:** frequency of switching tabs/bars within first 2 minutes.
- **Compute abandonment:** leaving compute screens while in “running/waiting” state.
- **Mobile action discoverability:** scroll depth before user can reach primary action.

### Qualitative
- 5-user quick test: “What would you click next?” should succeed quickly on Home + Builder + Scenarios.
- Confidence rating: “I know what will change if I click this” (target: high).

---

## 7) Rollout Plan

1) **Foundation:** App shell + selection summary + home clarity (highest leverage; lowest risk to workflows)
2) **Builder progressive disclosure + mobile action anchoring**
3) **Scenarios compare clarity + compute lifecycle UX**
4) **Theme parity + empty/loading/error polish**

Optional: ship behind a feature flag to reduce risk and allow side-by-side comparison.

---

## 8) Delegation Map (subagent-ready workstreams)

Each workstream should deliver:
- Updated UI behavior (per epic)
- Before/after screenshots (desktop + mobile; `slate` + `mario`)
- A short “what changed / why it helps” note

Recommended slicing:
1. **Home IA + empty states** (Epic A)
2. **App shell + hierarchy contracts** (Epic B)
3. **Selection summary + scope labeling** (Epic C)
4. **Builder progressive disclosure** (Epic D)
5. **Scenarios compare clarity + states** (Epic E)
6. **Compute lifecycle UX** (Epic F)
7. **Mobile interaction model** (Epic G)
8. **Theme consistency + parity** (Epic H)
9. **Metrics/instrumentation plan** (Success metrics)

---

## 9) Open Questions (for PM / supervisor to decide early)

1. What is the single “North Star” primary action in the workspace for the average user?
   - Examples: “Recompute”, “Save snapshot”, “Create scenario”, “Add wells”
2. What should be considered the “default” mode: DESIGN results-first or setup-first?
3. Are we optimizing mobile as a first-class authoring surface or primarily a review surface?
4. Do we want theme names/branding to be purely cosmetic (recommended) or allow identity shifts?

