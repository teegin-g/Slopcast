# UI changes

## Mario theme (Classic)

### Completed
- [x] **Design tab fields**: added navy Classic field styles (`.sc-inputNavy`, `.sc-selectNavy`, `.sc-rangeNavy`) and applied them to Decline Profile + Economic Anchors.
- [x] **Left-column headers**: Classic control accordion titlebars switched to red (`.sc-titlebar--red`).
- [x] **Sidebar height sync**: desktop columns now share a single height contract so the left sidebar scroll height matches the rest of the page.
- [x] **Scenario tab ergonomics**: Classic scenario edit inputs/selects now match Design tab styling; truncation added to prevent text bleed.
- [x] **Sensitivity matrix**: removed hover scaling (layout jank) and tightened axis label spacing for small screens.
- [x] **Polish**: clamped KPI number sizing to prevent overflow; corrected chart title to match plotted data (cumulative cash flow).

### Next ideas
- [ ] Audit remaining Classic inputs (e.g. CAPEX edit table) for consistency with the new navy field styles.
- [ ] Decide whether Model Stack “inset” areas should stay dark everywhere in Classic (currently optimized for design consistency).