
# SLOPCAST Economics UI — Screen-by-Screen Deconstruction

## Purpose of this document
This document deconstructs the generated economics UI concept for the SLOPCAST oil and gas forecasting app so it can be iterated in a future session without having to re-explain the design intent from scratch.

It captures:
- the overall product shell and information architecture
- the visual and interaction system
- each of the six module screens
- recurring components and layout patterns
- what is working well
- what should be refined next
- a practical handoff prompt for the next design session

---

## 1. High-level read of the concept
The generated concept takes the original economics screen and pushes it toward a more differentiated, premium analytics experience. The biggest improvement is that each module now feels like a distinct analytical workspace instead of six near-identical card grids.

The concept accomplishes this by introducing:
- **module-specific accent colors**
- **stronger hero panels per screen**
- **a persistent context rail and KPI strip**
- **“What Changed?” affordances** for scenario awareness
- **insight callouts** at the bottom of modules
- **more expressive charts** with subtle glow, gradient, and contrast differences

The visual tone remains professional and data-centric, but it now has more rhythm, hierarchy, and product personality.

---

## 2. Overall product shell

### 2.1 Global layout model
The UI is organized as a persistent shell with screen-specific analytical content.

**Persistent regions:**
1. **Top app bar**
   - Brand/logo at left
   - Main navigation: Hub, Design, Scenarios, Wells, Economics
   - Utility icons at right
   - Economics appears as the active destination

2. **Context rail / left-side asset panel**
   - Asset or group selection
   - Area / basin label
   - Status
   - Effective date
   - Economic pulse summary
   - Mini sparkline / mini performance panel
   - Quick link to outputs

3. **Scenario / compare strip**
   - Scenario selector
   - Compare-to selector or scenario chips
   - Mode chips such as Base / Upside / Downside / Custom
   - “What Changed?” button with badge count

4. **Main analytical canvas**
   - Module-specific cards, charts, tables, KPI summaries, and insight strips

5. **Global bottom KPI strip**
   - Base case status
   - NPV10
   - IRR
   - Payout
   - Breakeven WTI
   - Ratio / other key economics
   - Footer note / feedback control

### 2.2 UX intent of the shell
The shell does three important jobs:
- keeps the user oriented across modules
- preserves cross-module economic context
- creates a reusable analytical frame so each module only needs to focus on the variables unique to that domain

This is strong product thinking because the user is never forced to mentally rebuild context when moving from Production to Pricing to CAPEX.

---

## 3. Visual system

### 3.1 Base aesthetic
- **Dark premium analytics UI**
- Low-key glass / neon influence without becoming decorative sci-fi
- High contrast surfaces with restrained glow
- Fine borders and inset panel treatment
- Dense data presentation with compact spacing

### 3.2 Accent-color strategy by module
One of the most effective changes in the concept is the use of a distinct accent for each screen.

Suggested mapping based on the generated concept:
- **Production** — cyan / aqua
- **Pricing** — green
- **OPEX & LOE** — amber / orange
- **Taxes** — red
- **Ownership** — green / mint
- **CAPEX & Investment** — violet / purple

This gives each module a recognizable identity while keeping the underlying UI language consistent.

### 3.3 Surface hierarchy
There are roughly four levels of visual emphasis:
1. **Page / module frame** — darkest background, quiet container
2. **Standard cards** — bordered, softly elevated panels
3. **Hero cards** — slightly brighter, larger, and more visually active
4. **Signal cards / KPI cards / insight bars** — accent-led emphasis for critical outcomes

### 3.4 Typography hierarchy
The concept improves hierarchy mainly through color and panel emphasis, but the type system suggests the following tiers:
- **App / module headers** — medium-small but prominent via placement and accent
- **Card titles** — small uppercase or compact labels
- **Numeric KPIs** — larger, brighter values
- **Table text** — compressed, utility-driven
- **Support text** — muted gray-blue secondary text

A future iteration could improve this even further by increasing scale differences between titles, metrics, and helper labels.

---

## 4. Interaction model implied by the concept
Although this is a static mockup, the UI implies several useful interaction patterns.

### 4.1 Scenario awareness
The presence of Base / Upside / Downside / Custom chips and the “What Changed?” button strongly suggests a scenario comparison workflow.

Likely interaction model:
- user edits assumptions in one module
- impacted metrics update across the module and bottom KPI strip
- “What Changed?” opens a delta summary of modified assumptions vs baseline
- compare mode overlays current scenario vs selected reference

### 4.2 Cross-filtering and linked analytics
The layout implies that cards can be connected rather than isolated.

Examples:
- hovering a price driver mini-chart could highlight its effect on net price summary
- selecting a cost category in OPEX could cross-highlight pie chart, table row, and impact chart
- switching scenario chips updates all screen-level KPIs and trend lines

### 4.3 Progressive detail
Each screen contains a mix of:
- quick outcomes
- charts
- assumptions / tables
- a bottom insight strip

This creates a strong layered workflow:
1. orient
2. read the big signal
3. inspect the driver
4. validate assumptions
5. read synthesized insight

---

## 5. Screen-by-screen deconstruction

---

## 5.1 Production screen

### Primary purpose
To explain how forecasted production volume is generated and how decline assumptions shape economic performance.

### Dominant accent
Cyan / aqua.

### Layout structure
The Production screen is the richest and most complete module in the concept.

**Left:** persistent context rail with asset data and economic pulse.

**Top row inside module:**
- Scenario selector
- Compare-to selector
- Scenario chips
- “What Changed?” action

**Main content area:**
- Large hero line chart for total production forecast
- Narrow right-side summary card for key forecast metrics
- Bottom-left inputs card
- Bottom-center type curve parameters table
- Bottom-right production split donut chart

### Main components
1. **Hero forecast chart**
   - Multi-series decline chart for oil, gas, and water
   - Log-like or wide-range Y axis treatment
   - Hover state implied by vertical focus line and point markers
   - Inline tooltip snapshot at a selected year

2. **Key forecast metrics card**
   - EUR
   - Peak rate / peak month
   - Decline rates
   - b-factors
   - Acts as the analytical summary companion to the main chart

3. **Production inputs panel**
   - Model type
   - Time scale
   - Include stream toggles
   - Operates as the user’s control center for forecast generation

4. **Type curve parameters table**
   - Initial rate
   - Decline type
   - b-factor
   - Decline by stream
   - Gives the screen credibility as a forecasting workspace rather than a dashboard only

5. **Production split donut**
   - Compact composition snapshot
   - Useful as a quick mix indicator
   - Secondary importance compared with hero forecast chart

### UX strengths
- Clear hero element
- Strong balance of assumptions + outputs
- Good separation between editable inputs and analytical outcomes
- Tooltip treatment makes the forecast feel interactive and inspectable

### UX risks / opportunities
- The bottom row may still be slightly dense for first-time users
- The production split donut is arguably too small relative to its value
- The control labels could benefit from stronger form-state cues

### Recommended next iteration
- Make input controls more tactile with clear active/focus states
- Allow quick switching between rate / cumulative / stream-specific views
- Consider making the metrics card collapsible into KPI chips on smaller viewports
- Add a compact “forecast method rationale” helper or info popover

---

## 5.2 Pricing screen

### Primary purpose
To translate market assumptions into realized net pricing and highlight which pricing drivers matter most economically.

### Dominant accent
Green.

### Layout structure
This screen reads as a pricing analysis workspace with a strong emphasis on price realization.

**Top row inside module:**
- Scenario selector
- Compare-to selector
- Base/Upside/Downside/Custom chips
- “What Changed?” action

**Main content area:**
- Net price summary KPI card cluster
- Realized net price chart
- Price assumptions table
- Price deck / effective date card
- Bottom row of mini driver-impact charts

### Main components
1. **Net price summary card**
   - Separate KPI blocks for Oil, Gas, NGL
   - Each shows price and delta vs base
   - Strong at-a-glance outcome panel

2. **Realized net price chart**
   - Multi-series line chart by commodity
   - Forecast region indicated with dotted/dashed continuation
   - Provides the main visual narrative of the screen

3. **Price assumptions table**
   - Commodity
   - Benchmark
   - Differential
   - Net price
   - Good compact representation of price-building logic

4. **Price deck card**
   - Deck selector
   - Edit action
   - Effective date
   - Useful for governance and traceability

5. **Price drivers impact strip**
   - Small multiples for Oil Differential, Gas Price, NGL Differential, Transport
   - Strong UX move because it turns supporting drivers into a scannable band

### UX strengths
- The screen clearly connects assumptions to realized economics
- Mini-driver charts add rhythm and break the monotony of traditional pricing tables
- The price deck card creates operational realism

### UX risks / opportunities
- The right column may feel slightly table-heavy if the screen is compressed
- Mini driver cards are visually elegant but may need stronger hover/click affordances to signal interactivity

### Recommended next iteration
- Add “benchmark vs realized” toggle or overlay in the main chart
- Allow clicking a driver mini-chart to isolate its effect in the main chart
- Show sensitivity badges, such as “highest impact,” for the biggest price lever
- Consider a waterfall view for how benchmark becomes net price

---

## 5.3 OPEX & LOE screen

### Primary purpose
To break down lease operating expense structure, explain fixed vs variable costs, and show their impact over time.

### Dominant accent
Amber / orange.

### Layout structure
This screen is more modular and highly scannable.

**Top row:**
- Scenario selector and comparison chips
- “What Changed?” action

**Main content area:**
- OPEX structure donut chart with legend and totals
- OPEX impact bar chart over time
- OPEX assumptions table
- Field costs table
- Bottom insight strip

### Main components
1. **OPEX structure donut**
   - Shows category contribution to total LOE
   - Legend includes values and percentages
   - Good choice because composition matters here more than trend detail

2. **OPEX impact bar chart**
   - Time-based cost impact view
   - Provides the temporal framing that complements the donut

3. **OPEX assumptions table**
   - Lease operating
   - Water disposal
   - Gathering & processing
   - Compression / fuel
   - Chemicals
   - Workover / maintenance
   - Other
   - Total LOE

4. **Field costs panel**
   - Fixed monthly cost breakdown
   - Clean separation between field overhead and variable expenses

5. **Insight strip**
   - Summarized statement: fixed field costs represent 38% of total OPEX
   - Excellent example of lightweight analytics narration

### UX strengths
- This module has the clearest composition-impact-story structure
- The amber accent works very well for cost framing
- The insight bar prevents the page from reading as “just another table + chart” screen

### UX risks / opportunities
- The donut + legend block may feel cramped if more categories are introduced
- Users may want a clearer fixed vs variable toggle rather than inferring the split from separate cards

### Recommended next iteration
- Add fixed vs variable stacked comparison
- Allow category hover to highlight corresponding rows and bars
- Add a per-boe vs absolute toggle across the module
- Consider a “cost concentration” badge for top 2 contributors

---

## 5.4 Taxes screen

### Primary purpose
To summarize tax burden, show rate assumptions, and quantify the effect of taxes on after-tax cash flow.

### Dominant accent
Red.

### Layout structure
This is one of the cleanest screens in the concept and also one of the most differentiated.

**Main content area:**
- Tax summary card
- Effective tax rate card with sparkline / trend
- Tax assumptions table
- Tax impact chart
- Tax impact-by-type list
- Bottom insight strip

### Main components
1. **Tax summary card**
   - Total tax
   - % of gross revenue
   - Compact and direct

2. **Effective tax rate card**
   - Large effective tax rate value
   - Benchmark / statutory comparison
   - Small red area chart / sparkline

3. **Tax assumptions table**
   - Severance tax (oil)
   - Severance tax (gas)
   - Ad valorem tax
   - Production tax
   - County tax
   - School tax
   - Exemptions / credits
   - Works as the operational rule table for the module

4. **Tax impact chart**
   - After-tax cash flow shape over time
   - Helps frame taxes as a dynamic drag, not just a static percentage

5. **Impact by tax type list**
   - Dollar impact by category
   - Useful for ranking burdens without adding another chart

6. **Insight strip**
   - Example statement: severance taxes represent 64% of total tax burden
   - Particularly effective on this screen because tax logic is often hard to scan quickly

### UX strengths
- Strong use of red accent without becoming alarmist
- Cleanest table-to-impact relationship among the screens
- Effective tax rate card is a good example of combining KPI + context + trend in one compact block

### UX risks / opportunities
- This screen may need clearer distinction between statutory rates and modeled effective burden
- The tax impact chart could be misread without a reference baseline

### Recommended next iteration
- Add pre-tax vs after-tax overlay in the chart
- Include tooltips that explain formula logic for each tax type
- Add jurisdiction change awareness at top level if multiple tax regimes are supported
- Consider surfacing deductible vs non-deductible categories visually

---

## 5.5 Ownership screen

### Primary purpose
To explain how working interest, royalties, and burdens roll up into net revenue interest and party-level economics.

### Dominant accent
Mint / green.

### Layout structure
This module is highly structured and strongly communicates party decomposition.

**Main content area:**
- Party structure table
- Ownership summary donut
- Party impact cards
- Revenue split check strip

### Main components
1. **Party structure table**
   - Party / interest type / WI / NRI / revenue %
   - Most important data-dense panel on the screen
   - Acts as the core truth table for ownership logic

2. **Ownership summary donut**
   - NRI centered in the ring
   - Legend for working interest, royalty burden, other
   - Good use of a circular summary because ownership is fundamentally compositional

3. **Party impact cards**
   - Operator, Partner A, Partner B, ORRI, Lessor
   - Dollar impact + share percentage
   - Strong layout move because it converts a table into a readable economic summary row

4. **Revenue split check strip**
   - Total revenue
   - Split verification / checksum
   - Subtle but excellent trust-building feature

### UX strengths
- Probably the best example of progressive detail in the concept
- Clear movement from legal/economic structure to practical impact
- The split-check row adds confidence and polish

### UX risks / opportunities
- Table could become hard to manage with many more parties or layered burdens
- ORRI / royalty categories may need stronger visual differentiation for novice users

### Recommended next iteration
- Add expandable details for burden stacking by party
- Support a Sankey-style optional view from gross revenue to party net revenue
- Allow toggling between WI, NRI, and revenue share emphasis
- Add validation badges if totals do not reconcile to 100%

---

## 5.6 CAPEX & Investment screen

### Primary purpose
To explain capital timing, capital composition, and payout implications.

### Dominant accent
Violet / purple.

### Layout structure
This screen is more investor-like and outcome-oriented than the others.

**Main content area:**
- CAPEX summary table/card
- CAPEX timing cumulative chart
- Payout analysis KPI + cumulative cash flow chart
- CAPEX impact strip
- Bottom insight strip

### Main components
1. **CAPEX summary card**
   - Total CAPEX
   - Cost per boe / EUR-style normalized figure
   - Category rows: drilling, completion, facilities, equipment, land/other, contingency
   - Clean and useful as a cost ledger summary

2. **CAPEX timing chart**
   - Stair-step cumulative capital deployment chart
   - Very good choice because CAPEX timing is discrete and milestone-driven

3. **Payout analysis card**
   - Large payout value
   - Delta vs base
   - Companion cumulative cash flow chart
   - Creates a good investor-facing narrative

4. **CAPEX impact strip**
   - PV-10 impact
   - % of PV-10 revenue
   - Strong compact summary row

5. **Insight strip**
   - Example: payout improves by 0.2 years in upside case
   - Useful because it ties capital deployment back to scenario economics

### UX strengths
- The violet accent sets this screen apart immediately
- Strong narrative from spend profile to payout outcome
- This module feels focused and decision-oriented

### UX risks / opportunities
- The cash flow chart is visually smaller than its importance suggests
- The CAPEX summary card could become crowded if too many cost categories are introduced

### Recommended next iteration
- Add phased capital modes: drill / complete / tie-in / facilities
- Enable overlay of spend timing vs first production timing
- Add sensitivity chips for payout vs CAPEX overrun / delay
- Consider showing capital efficiency metrics more prominently

---

## 6. Cross-screen component inventory

This section lists the recurring component system implied by the concept.

### 6.1 Navigation components
- Global top navigation
- Active module tab state
- Utility icon cluster
- User/profile token

### 6.2 Context components
- Asset selector
- Area selector / label
- Status badge
- Effective date block
- Economic pulse card
- Mini sparkline / output preview

### 6.3 Scenario and comparison components
- Scenario dropdown
- Compare-to dropdown
- Scenario state chips
- “What Changed?” action with numeric badge

### 6.4 Data display components
- Hero multi-series chart
- Donut / composition chart
- Bar chart
- Mini sparkline / small multiple strip
- KPI cards
- Summary strips
- Tabular assumption panels
- Ranked impact lists
- Insight callout banners

### 6.5 Utility / governance components
- Edit deck action
- Effective date display
- Split-check / validation strip
- Footer currency / discount-rate note
- Feedback action

---

## 7. What this concept improves vs the earlier critique
The generated concept successfully addresses several of the earlier issues.

### 7.1 Reduced monotony
The biggest change is not layout alone, but **controlled variation**.
- Each module now has its own accent identity
- Each module has a different analytical center of gravity
- The bottom insight strip creates a distinct ending beat per screen

### 7.2 Better hierarchy
- Production has a clear hero chart
- Pricing has a top KPI summary + main trend chart
- OPEX is organized around composition and cost impact
- Taxes uses large numeric blocks and a red impact story
- Ownership uses table + donut + party cards
- CAPEX uses timing + payout

### 7.3 More “alive” feeling
The UI now implies motion and explanation even as a still image.
This comes from:
- hover-ready chart markers
- scenario comparison chips
- “What Changed?” affordance
- delta values vs base
- insight statements

---

## 8. Remaining issues to solve in future iterations
The concept is strong, but it is not final. These are the next quality gaps.

### 8.1 The shell is still somewhat dense
The system is elegant, but it is also visually busy. Future iterations should selectively quiet certain containers so key content has more breathing room.

### 8.2 Typography could carry more hierarchy
More contrast in scale would help distinguish:
- screen title vs card title
- card title vs field label
- KPI value vs support text

### 8.3 Card treatment is still a little uniform
Even though the concept improved variation, many panels still share nearly identical framing. Future refinement could:
- flatten some secondary cards
- reserve glow/border emphasis for hero panels only
- vary spacing more by content importance

### 8.4 More explicit interaction states are needed
Because this is a static mockup, several things need actual UI-state design:
- hover
- selected vs unselected chips
- editable vs read-only fields
- drill-down affordances
- chart legends and tooltip rules

### 8.5 Responsive behavior is not yet defined
This concept is desktop-first. A future pass should define:
- collapse behavior for the left context rail
- stacking logic for lower-priority cards
- preservation of KPI strip on smaller widths
- table overflow strategy

---

## 9. Recommended next iteration priorities

### Priority 1 — Interaction/state design
Define the state model for:
- chips
- dropdowns
- card selection
- hover linkages
- “What Changed?” panel
- compare overlays

### Priority 2 — Component systemization
Turn the mockup into a real UI system by standardizing:
- panel types
- KPI card variants
- chart card patterns
- table variants
- insight banners
- validation strips

### Priority 3 — Information hierarchy refinement
Reduce noise by deciding which content is always:
- primary
- secondary
- tertiary
- hidden behind expand/collapse

### Priority 4 — Motion principles
Introduce subtle motion rules:
- count-up for KPI changes
- chart transitions on scenario change
- edge glow or pulse on impacted metrics
- hover highlight with coordinated cross-panel response

### Priority 5 — “Smart analytics” layer
Build product-specific intelligence into the UI:
- sensitivity callouts
- top driver badges
- scenario deltas
- reconciliation checks
- warnings for missing assumptions or broken totals

---

## 10. Suggested design principles to preserve
These should survive future iterations.

1. **Serious, domain-specific tone**
   - keep the UI feeling like a professional forecasting product, not a generic startup dashboard

2. **Module-level accent identities**
   - this is doing a lot of good work and should be retained

3. **Persistent economic context**
   - the left rail and bottom KPI strip help maintain continuity

4. **Assumption-to-outcome storytelling**
   - every module should continue showing both inputs and economic results

5. **Lightweight explanatory insight bars**
   - these are especially effective and add product intelligence without clutter

---

## 11. Practical next-session prompt
Use this in a future session to continue iterating without losing context:

> We are iterating the SLOPCAST economics UI concept for an oil and gas forecasting app. The current concept has six modules: Production, Pricing, OPEX & LOE, Taxes, Ownership, and CAPEX & Investment. The design direction is a premium dark analytics UI with module-specific accent colors, a persistent left context rail, scenario chips, a global bottom KPI strip, and insight banners at the bottom of modules. I want to preserve the strong analytical feel and differentiated module identities, but refine the component system, typography hierarchy, interaction states, and card density. Please help me evolve this into a more coherent product UI system and propose improvements screen by screen.

---

## 12. Optional next-step work items
Depending on what you want to do next, the best follow-on artifacts would be:
- a component inventory / design system spec
- a wireframe version with layout rules only
- a state diagram for scenario compare and “What Changed?”
- a token sheet for colors, spacing, radii, borders, glow, and typography
- a redesigned single-screen deep dive, starting with Production or Pricing

---

## 13. Short conclusion
This concept is a meaningful step up from the original economics UI because it solves the monotony problem through hierarchy, module identity, and better analytical storytelling rather than through superficial decoration.

The best next move is not another full visual reset. It is to convert this promising concept into a tighter system with:
- clearer component roles
- stronger state design
- more disciplined hierarchy
- smarter interaction between assumptions and results

That is the path from “great concept art” to “real product UI.”