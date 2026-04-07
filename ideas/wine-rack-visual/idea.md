# Wine Rack View & Undev Assumption Builder

## What It Is

A 2D cross-section view of wells where each lateral renders as a horizontal "bottle" sitting on a stratigraphic "shelf." Depth runs down the Y-axis; spatial position runs across the X-axis. Benches (Woodford, Sycamore, Meramec, Osage, etc.) appear as faint horizontal bands behind the bars so users immediately see which shelf each well sits on.

The metaphor is exact: stacked horizontal development is literally a wine rack viewed from the side, and engineers already think in these terms when they whiteboard development plans.

## Why It Matters

The wine rack does two things that no other view in the app does well:

1. **It collapses spatial and stratigraphic context into a single picture.** Maps show you X/Y but lose Z. Cross-section logs show Z but only along one path. The wine rack shows you both at once for an entire DSU or section.

2. **It makes analog selection a spatial gesture instead of a form-filling task.** This is the foundation of the assumption builder described below — and the thing that makes the wine rack genuinely strategic for the app, not just a nice viz.

## Core View

### Layout

- **Y-axis:** TVD (true vertical depth), increasing downward
- **X-axis:** spatial position along a chosen projection (see below)
- **Bars:** each lateral renders as a horizontal bar, with bar length = lateral length, vertical position = subsurface depth
- **Benches:** faint horizontal bands behind the bars, labeled on the right margin with formation tops
- **Depth ruler:** on the left margin
- **Direction indicator:** subtle taper or arrowhead on each bar to show toe vs heel

### Projection modes

Wells in a unit aren't perfectly colinear, so the user picks how to project them onto the X-axis:

- **Average azimuth** — project onto the average azimuth of the selected group. Best when wells are roughly parallel
- **User-drawn line** — project onto a line the user draws on the inset map. Best when there's a natural section line or when comparing across an irregular layout
- **Surface X sort** — sort by surface X coordinate and ignore true spatial distance. Cleanest for mixed pads where projection would be misleading

A small inset map shows the actual surface locations and the projection line so users stay oriented and can see when projection is distorting reality.

### Variable encoding

Users map well attributes to visual channels independently. Five channels available:

| Channel | Suggested attributes |
|---|---|
| **Bar color** | IP90, EUR, cum oil, GOR, completion year, frac intensity (lbs/ft), operator, DSU |
| **Bar thickness** | Proppant loading, stage count, or uniform |
| **Bar opacity** | Confidence/vintage, fade out PDP vs highlight PUDs |
| **Outline** | Status (producing, DUC, permitted, P&A) |
| **Label** | Well name, API, or any selected metric |

Side panel with dropdowns for each channel. Color scales are configurable (continuous vs categorical, divergent vs sequential, custom domains).

### Interaction

- **Hover** for a full well card tooltip (name, API, operator, IP, EUR, lateral length, completion date, etc.)
- **Click** to pin a well — pinned wells highlight across other app views (map, table, charts)
- **Shift-click** to pin multiple
- **Right-click** for a context menu (zoom to well, view production history, copy API, etc.)

### Toggles and overlays

- **Parent / child relationships** — draws faint connectors between wells completed in the same bench within some configurable time window. Reveals infill patterns and potential interference candidates instantly
- **Vintage gradient** — overlay a time gradient so older wells fade and newer wells pop
- **Spacing annotations** — show distances between adjacent laterals in the same bench
- **Fault overlays** — if structural data is available, show fault traces as vertical or angled lines crossing the rack

### Grouping modes

- **Collapse by bench** — density view showing how many laterals per shelf, useful for inventory analysis
- **Group by DSU / section** — compare development intensity across units side by side
- **Group by operator** — see who's developing what, where

## Where It Lives

The wine rack is a **third view mode on the PDP wells screen**, alongside Map and Table. Same filtered well set, three ways to look at it. Switching between modes preserves selections and pinned wells.

This placement matters: the wine rack inherits whatever filtering the user already did upstream in Stage 0 and on the wells screen. It's not a separate tool with its own data pipeline — it's a different lens on the same data.

## The Assumption Builder

This is where the wine rack stops being a visualization and starts being a backend tool.

### Core insight

A wine rack view of PDP wells is already a structured analog selection tool. Every cell is a real well with real history, organized in a way that proximity in the rack approximates analog quality. Letting users lasso a region of the rack and say "treat these as my analog set for this Undev assumption" collapses two normally-separate tasks into a single gesture:

1. *Find analogs* — usually a separate screen with filters and saved searches
2. *Build assumption* — usually a form where you type in Arps parameters

No competitor in the O&G analytics space (Novi Labs, ComboCurve, Enverus, S&P) has a TC builder where analog selection is the *primary interface*. They all bury it behind forms or treat analogs as an afterthought.

This is the kind of feature that, done well, becomes the thing your tool is known for.

### Mode toggle

The rack has two modes:

- **Diagnostic** (default) — looking at existing wells to understand performance
- **Build assumption** — selecting analogs to create a TC, LOE curve, or spacing degradation curve to save into the Undev library

Toggling into build mode does three visible things:

1. Background tints subtly to indicate selection mode is active
2. Right-side panel swaps from "well details" to "assumption builder"
3. A floating instruction strip appears: "Lasso wells to build an analog set, then choose what to build."

### Selection-to-assumption flow

#### Step 1 — Select analogs

The user selects wells from the rack via:

- **Lasso** — draw a region around wells
- **Click-to-add** — pick wells one at a time
- **Quick actions** — "select all in bench," "select within DSU," "select within distance of pinned well"

Selected wells highlight; unselected wells dim. A live counter at the top of the panel shows:

```
14 wells selected
9,200 ft avg lateral
2021–2023 vintages
Wolfcamp A (12), Wolfcamp B (2)
```

Updates in real time as the user adjusts the selection.

#### Step 2 — Selection coherence indicator

Three small bars in the panel:

- **Lateral length variance** — green if all wells are within 10% of mean, yellow if 10–25%, red if >25%
- **Vintage spread** — green if all within 2 years, yellow if 2–5, red if >5
- **Bench mix** — green if single bench, yellow if 2 benches in same formation, red if mixed formations

Soft warning, not a hard block. Hovering a red indicator explains why and suggests a fix ("3 wells are >25% shorter than the rest. Consider removing them or enabling lateral-length normalization.").

This is the soft guardrail — it teaches users without restricting them. Engineers tend to resent guardrails until they understand why they're there. Coherence scores let them learn the hard way once or twice and internalize the lesson.

#### Step 3 — Pick what to build

Three tabs in the panel:

##### Type curve tab

- **Fit overlay** — small chart showing the selected wells' normalized production with an Arps fit overlaid. P10/P50/P90 cloud of the analogs themselves shown in light shading
- **Manual parameter knobs** — sliders for qi, Di, b, Dmin with live residual updates
- **Lateral length normalization** — toggle to normalize production per 1000' before fitting. When enabled, the resulting TC is stored as "per-foot" and scales by lateral length when applied
- **Segment editor** — for segmented TCs, drag a divider to split early/late time and fit each segment independently
- **Fit quality indicators** — R², residual histogram, P50 EUR, P10/P90 EUR spread

##### LOE tab

- **Pull from data** — automatically pulls LOE history for the selected wells from the data warehouse
- **Decomposition** — separates fixed $/well/month from variable $/boe via regression or simple bucketing
- **Distribution view** — histogram of monthly LOE across the analog set with P10/P25/P50/P75/P90 markers
- **Picker** — user picks a percentile or enters a custom value for both fixed and variable components
- **Optional ramp profile** — fit a higher early-life LOE that decays to steady-state. Useful for unconventional wells where early-life workovers and water handling dominate

##### Spacing degradation tab

This is the tab that uniquely benefits from the rack's spatial encoding.

- **Co-development detection** — for each selected well, identify the number of co-developed wells in the same bench within a configurable distance and time window
- **Production ratio** — for each well, compute production-per-foot relative to the "standalone" average (1-well DSUs)
- **Degradation curve** — plot ratio vs co-developed well count, fit a curve (linear, exponential, or piecewise)
- **Output** — a degradation function (e.g., 1 well = 100%, 2 = 92%, 3 = 85%, 4+ = 78%) stored and applied in the Undev econ screen

Because the rack already encodes well position and bench, all the spatial logic for "which wells are co-developed with which" is computed from the geometry the user is already looking at. The user sees the inputs and outputs of the degradation analysis simultaneously.

#### Step 4 — Save with provenance

The user names the assumption and saves it. The saved object stores **not just the parameters but the list of analog well IDs and the filter that produced them**.

This is the move that turns the wine rack from a UI feature into a real backend tool. Provenance is what separates living assumptions from dead ones.

### Data Model

```python
from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal

@dataclass
class AnalogBackedAssumption:
    # Identity
    id: str
    name: str
    type: Literal["type_curve", "loe", "spacing_degradation"]
    created_at: datetime
    created_by: str
    last_refit_at: datetime

    # The actual numbers used in econ runs
    parameters: dict
    # type_curve: {qi, Di, b, Dmin, segment_breaks, normalization_basis}
    # loe: {fixed_per_well_month, variable_per_boe, ramp_profile}
    # spacing_degradation: {curve_type, breakpoints, function_params}

    # The provenance — this is the key part
    analog_well_ids: list[str]
    analog_filter_snapshot: dict
    # {bench, area, vintage_range, lateral_length_range, operator, ...}

    # Quality metadata
    fit_metadata: dict
    # {r2, residuals, coherence_score, lateral_norm_method, n_wells}

    # Staleness tracking
    data_through_date: date
    notes: str

    # Optional library tagging
    tags: list[str]
    project_id: str | None  # None if promoted to global library
```

The `analog_well_ids` and `analog_filter_snapshot` fields are what enable everything that follows. Without them, you have a parameter blob; with them, you have a living, auditable, refreshable assumption.

### What You Get for Free

#### Auditability

Any assumption traces back to "these 14 wells in this DSU range." When a senior engineer or management asks "where does this TC come from?", the answer isn't "it's our standard Wolfcamp A type curve" — it's "here are the 14 wells it was built from, here's the rack view of where they sit, and here's the fit quality." Engineers and management trust assumptions they can drill into.

#### Refresh-ability

Because the assumption stores analog well IDs, you can re-fit at any time with the latest production data:

```
TC: WCA_2yr_Standard
Last refit: 2024-Q3
Refresh available — 4 wells have new data through 2025-Q4

[Refresh] [Preview changes]
```

One click → "TC refreshed. EUR moved from 580 MBO to 605 MBO. Here's the diff."

Assumptions become living objects that age gracefully instead of going stale. The library has a "needs refresh" filter that surfaces the assumptions most likely to be wrong.

#### Stale assumption warnings

The library view shows "data through" dates and flags anything older than X months (configurable, probably 6 months default). The Undev econ screen shows a yellow indicator when using a stale assumption, with a one-click "view & refresh" link.

This alone solves a real and recurring problem: TCs nobody trusts because nobody knows when they were built or what data went into them.

#### Cross-assumption analog overlap

If you have 12 TCs in your library, you can show which ones share analog wells. Useful for several things:

- **Spotting double-counting** — if TC-A and TC-B both depend on the same 5 wells and you treat them as independent, you're over-anchoring on a small sample
- **Identifying load-bearing wells** — find the wells that show up in lots of assumptions. These are the most important wells to QC
- **Cascading refits** — if a well turns out to be miscoded or has its forecast revised, you immediately know which assumptions need to be refit

#### Visual assumption comparison

Pick TC-A and TC-B from the library. The wine rack opens with TC-A's analogs in blue and TC-B's analogs in orange. Instantly shows the geographic and stratigraphic difference between the two assumption sets.

This is a much better explanation of "why does TC-A give 600 MBO and TC-B give 480 MBO" than any parameter table. The answer is usually visible in one glance: "oh, TC-A is built from the eastern wells in the deeper bench and TC-B is the western shallower wells."

### Round-trip from Undev econ screen

When the Undev econ screen lets a user pick a TC, they see:

```
Type curve: WCA_2yr_Standard ▾
  Built from 14 wells, data through 2025-Q4
  [view analogs] [refresh] [fit quality]
```

Clicking "view analogs" opens the wine rack with the original selection highlighted. The user can see exactly where the TC came from without leaving their workflow.

This round-trip is what makes engineers trust assumptions other people built. A TC named "WCA_2yr_Standard" is meaningless. A TC that opens to a rack view of 14 specific wells in a specific area with a fit overlay is something an engineer can evaluate in seconds.

### Soft guardrails

The rack works best when wells are comparable — same bench, similar lateral length, similar vintage. Lassoing across wildly different wells produces garbage TCs. Two ways to handle this:

- **Soft (recommended for v1):** show the selection coherence score so users see when their analog set is messy. Allow them to proceed anyway, but log it and surface it on the saved assumption ("built from a low-coherence selection")
- **Hard:** require selections to be within a single bench, auto-normalize for lateral length before fitting

Start with soft. Engineers tend to resent guardrails until they understand why they're there. Coherence scoring teaches; restriction frustrates. Once you have data on which low-coherence assumptions actually cause problems downstream, you can decide whether to add hard blocks.

### Build button location

The "build Undev assumption" mode toggle is a button on the rack toolbar, near the view mode switcher. Clicking it transitions the rack visually into selection mode. Clicking again exits without saving.

On save, the user gets a confirmation toast plus an option to "jump to Undev econ screen and apply this assumption" — closing the loop between PDP analysis and Undev planning. This is the feature that physically connects the two tracks of the app.

## UI Sketch

```
┌─────────────────────────────────────────────────────────────┐
│  PDP Wells   [Map] [Table] [Wine Rack ▣]      🔨 Build Mode │
├─────────────────────────────────────────────────────────────┤
│  Color: EUR ▾   Thickness: ppt/ft ▾   Outline: Status ▾    │
├──────────────────────────────────────────┬──────────────────┤
│                                          │ ASSUMPTION       │
│  ░░░░ Woodford ░░░░░░░░░░░░░░░░░░░░░░░░ │ BUILDER          │
│                                          │                  │
│  ──── ──── ────  ──────  ────           │ 14 wells selected│
│                                          │ 9,200 ft avg     │
│  ░░░░ Sycamore ░░░░░░░░░░░░░░░░░░░░░░░░ │ 2021–2023        │
│                                          │ Wolfcamp A (12)  │
│  ─── ──── ──── ──── ──── ────           │ Wolfcamp B (2)   │
│  ════ ════ ════ ════                    │                  │
│                                          │ Coherence:       │
│  ░░░░ Meramec ░░░░░░░░░░░░░░░░░░░░░░░░░ │   Lateral 🟢    │
│                                          │   Vintage 🟢    │
│  ───── ───── ───── ─────                │   Bench  🟡     │
│                                          │                  │
│  ░░░░ Osage ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ┌──┬──┬──┐      │
│                                          │ │TC│LOE│Spc│    │
│  ──── ────                               │ └──┴──┴──┘      │
│                                          │                  │
│                                          │ [fit chart]      │
│  Depth →                                 │                  │
│  4000 ─────────────────────────── 12000  │ qi  [====] 850  │
│                                          │ Di  [==  ] 65%  │
│  [inset map showing projection line]     │ b   [===]  1.1  │
│                                          │                  │
│                                          │ EUR P50: 605 MBO│
│                                          │                  │
│                                          │ [Save to library]│
└──────────────────────────────────────────┴──────────────────┘
```

## Implementation Notes

### Rendering technology

For the rack itself, SVG is the right starting point — precise control over geometry, easy interaction, easy styling. Recharts is too high-level for this; D3 or raw SVG with React is the right level.

Performance threshold to watch: SVG handles a few hundred elements comfortably. If a project has >500 wells in the rack, switch to canvas rendering for the bars (Konva, PixiJS, or raw canvas). The interaction layer can stay in DOM.

### Coordinate system

Two coordinate systems:

1. **Data coordinates** — TVD in feet, projected X in feet
2. **Screen coordinates** — pixels, with margins for axes and labels

Standard D3 scales (`scaleLinear` for both axes) handle the mapping. Zoom and pan operate on the data coordinate system so the depth ruler and bench labels stay aligned.

### Selection state

Selection state lives in React state (or a state manager) and is shared with the map and table views. Pinning a well in the rack pins it everywhere. This requires the three view modes to share a common selection store.

### Fit math

Type curve fitting can run client-side for small selections (≤50 wells) using a JavaScript Arps fit. For larger selections or segmented fits, call out to a Python backend endpoint. The fit endpoint takes well IDs and fit options and returns parameters + fit metadata.

LOE decomposition is a simple regression that runs client-side easily.

Spacing degradation requires geometric analysis (which wells are co-developed with which) and should run server-side, especially since it needs to query the well geometry and production data.

### Library storage

Saved assumptions go in a relational table (Postgres). The `analog_well_ids` field is a JSON array; the `parameters` and `fit_metadata` fields are JSON objects. Indexed on `type`, `project_id`, and `data_through_date` for the library views.

Promotion from project-scoped to global library is just setting `project_id` to NULL (or moving to a separate table, depending on your access control model).

## Open Questions

- **Lateral length normalization** — should this be the default, or opt-in? Defaults matter a lot here because most users will accept whatever the screen suggests
- **Spacing degradation curve representation** — store as a lookup table, parametric function, or both? Lookup is simpler; parametric is more honest about uncertainty
- **Selection coherence thresholds** — what are the right cutoffs for green/yellow/red? Probably basin-specific. Start with sensible defaults and let users (or admins) override
- **Library access control** — can any user promote a project assumption to the global library? Or only certain roles? Affects how cautious the promotion UX needs to be
- **Refit notifications** — should the system proactively notify users when an assumption they're using has stale data, or only flag it when they open the screen?
- **Multi-bench TCs** — when a selection spans two benches, should the builder fit one TC or two? Probably two, presented side-by-side
- **Performance ceiling** — what's the largest realistic well count for the rack view? May need a "show top N" filter or aggregation mode for very large selections

## Why This Is Worth Building

Three reasons this feature is worth the effort even though it's complex:

1. **It solves a real and recurring trust problem.** Type curves and LOE assumptions are the most-used and least-trusted objects in any forecasting tool. Provenance and refresh-ability fix that.

2. **It's a defensible feature.** Wine rack visualizations exist in other tools, but none of them are connected to the assumption-building workflow. The combination is novel and hard to copy quickly.

3. **It changes the user's mental model in a productive way.** Once engineers start thinking of TCs as "the analog set + the fit" rather than "the parameters," they make better decisions about when to refit, when to split a TC into two, and when to challenge an assumption. The tool teaches better practice just by being structured this way.

The wine rack is the kind of feature that justifies the rest of the app's restructure: it's only possible because PDP work and Undev work share the same project context, and it's only useful because the Undev econ screen has a clean place to consume the assumptions it builds. The pieces reinforce each other.