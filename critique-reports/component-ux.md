# Component-Level UX Critique

## Overall Assessment

Slopcast's data-heavy components demonstrate **solid technical execution** with modern libraries (TanStack Table, Recharts) and thoughtful architectural patterns. However, they suffer from **inconsistent UX polish** across states, missing feedback loops, and unclear input affordances. Professional users evaluating million-dollar decisions need every edge case handled gracefully — right now, empty states are passive, error states are missing, and success confirmations are silent. The bones are good; the connective tissue needs work.

**Grade: B-** — Production-ready functionality with gaps in edge case handling and user feedback.

---

## Tables (Wells, CashFlow, Deals)

### Data Density & Readability

**WellsTable** (WellsTable.tsx:27-254)
- ✅ **Good**: Column resizing (line 218-224), sticky header (line 196), row selection state (line 234-236)
- ✅ **Good**: `tabular-nums` for alignment (line 230), hover feedback (line 234)
- ❌ **Missing**: No visual indication that cells are NOT editable — users may click expecting inline edit
- ❌ **Missing**: No column visibility toggle — all 6 columns always visible even on narrow screens
- ⚠️ **Edge case**: Empty table after filtering shows no message — just blank space below headers

**CashFlowTable** (CashFlowTable.tsx:97-329)
- ✅ **Excellent**: Year/month hierarchy with expand/collapse (line 136-149), smart annual rollups
- ✅ **Good**: Accounting format with red negatives (line 31-34), sticky header, year filter
- ✅ **Good**: Empty state with clear CTA (line 237-243): "No cash flow data available. Run economics to generate projections."
- ⚠️ **Confusing**: Expand icon `▶` vs `▼` (line 144) not universally understood — add `aria-label` (present) but visual cue weak
- ❌ **Missing**: No totals row — users can't quickly sum visible months without manual calculation
- ❌ **Missing**: No export to CSV — professional users will want this data in Excel

**DealsTable** (DealsTable.tsx:21-241)
- ✅ **Excellent**: Empty state with icon, copy, and CTA button (line 135-171)
- ✅ **Good**: Sortable columns with visual indicator `↑`/`↓` (line 76), status badges (line 214-216)
- ❌ **Confusing**: Sort indicator uses unicode arrows but no hover hint — users don't know columns are sortable until they click
- ❌ **Missing**: No bulk actions — can't delete/archive multiple deals at once
- ⚠️ **Inconsistent**: Date formatting `formatDate()` (line 86-89) shows "Jan 12" but no year — ambiguous for old deals

### Sorting & Filtering

**WellsTable**
- ✅ **Good**: Global search + 2 column filters + FilterChips (line 161-191)
- ❌ **Missing**: No saved filter presets — users must recreate "my wells" filters every session
- ⚠️ **Confusing**: Filter chips removable but no "Clear All" button when 3+ filters active

**CashFlowTable**
- ✅ **Good**: Year filter dropdown (line 253-263)
- ❌ **Limited**: Can only filter by ONE year — can't compare Q1 2025 vs Q1 2026

**DealsTable**
- ✅ **Good**: Status filter in header (line 104-118)
- ⚠️ **Inconsistent**: Filter uses `<select>` while WellsTable uses `<select>` AND search box — why different?

### Empty/Error States

**WellsTable**
- ❌ **Missing**: No empty state when `wells.length === 0` — shows blank table with headers
- ❌ **Missing**: No zero-results state when filters exclude all wells

**CashFlowTable**
- ✅ **Good**: Empty state (line 237-243)
- ❌ **Missing**: No loading state during async calculation

**DealsTable**
- ✅ **Excellent**: Empty state (line 134-171) — icon, copy, CTA
- ❌ **Missing**: No error state if deal load fails

---

## Charts & Visualizations (Waterfall, Forecast)

### WaterfallChart (WaterfallChart.tsx:35-184)

**Strengths:**
- ✅ **Good**: Base → drivers → adjusted flow clear (line 44-79)
- ✅ **Good**: Loading skeleton while Recharts stabilizes (line 177)
- ✅ **Good**: Tooltip with formatted values (line 153-158)

**Issues:**
- ❌ **Missing**: No axis labels — what does Y-axis represent? Users must infer "NPV Impact"
- ❌ **Missing**: No legend — what do bar colors mean? (oil=green, cash=red, base/adjusted=purple per line 84-93)
- ⚠️ **Confusing**: Tooltip shows "NPV Impact" but chart title is "VALUE BRIDGE" — terminology inconsistent with rest of app
- ❌ **Edge case**: What if `drivers` array empty? Chart shows only base + adjusted — confusing without explanation

### ForecastGrid (ForecastGrid.tsx:31-229)

**Strengths:**
- ✅ **Excellent**: Keyboard nav (arrows, Enter to edit, Tab, Ctrl+D fill-down) — line 101-120
- ✅ **Good**: Editable cells with visual selection ring (line 155)
- ✅ **Good**: Inline edit on double-click (line 201)

**Issues:**
- ❌ **Confusing**: Editable fields NOT visually distinct from read-only until hover — line 156 adds `cursor-cell` but no border/background hint
- ❌ **Missing**: No undo/redo for edits — Ctrl+D fill-down is destructive with no revert
- ❌ **Missing**: No validation — user can enter negative production, text in number field (parseFloat returns NaN line 52)
- ❌ **Missing**: No save confirmation — edits commit silently on blur (line 209)
- ⚠️ **Edge case**: If `onUpdateFlow` prop missing, edits appear to work but don't persist — no error shown

**Keyboard hints:**
- ✅ Shows "Ctrl+D fill down" in header (line 165-169) BUT only when `!readOnly`
- ❌ Doesn't explain other shortcuts (arrows, Enter, Tab) — users must discover

---

## Input Panels (Economics Drivers, Scenarios)

### EconomicsDriversPanel (EconomicsDriversPanel.tsx:63-367)

**Strengths:**
- ✅ **Excellent**: Selectable driver rows with visual feedback (line 156-194)
- ✅ **Excellent**: Driver detail panel with "Why it matters" narrative (line 256-263)
- ✅ **Good**: CTA button "Edit Pricing" / "Edit CAPEX" (line 217-228)
- ✅ **Good**: Best/Worst case cards (line 268-287)

**Issues:**
- ❌ **Confusing**: Drivers sorted by `dominantDelta` magnitude but no label explains ranking logic
- ❌ **Missing**: No comparison to industry benchmarks — is $75M NPV good? Users have no context
- ⚠️ **Inconsistent**: "Biggest Upside/Downside" cards (line 306-321) show same data as selected driver detail — redundant?
- ❌ **Missing**: No export to PDF/screenshot — users can't share sensitivity analysis in decks

### EconomicsResultsTabs (EconomicsResultsTabs.tsx:20-71)

**Strengths:**
- ✅ **Good**: Motion layout animation on tab switch (line 52-60)

**Issues:**
- ❌ **Confusing**: All 5 tabs always enabled even when data missing — clicking "Cash Flow" tab when no economics run shows empty table, should disable tab
- ❌ **Missing**: No badge on tabs — can't see "Drivers (4)" or "Reserves (12 wells)"
- ⚠️ **Inconsistent**: Tab labels use different capitalization ("Summary" vs "CASH_FLOW" enum)

---

## Supporting Components (AI Assistant, Comments, Audit, Map)

### AiAssistant (AiAssistant.tsx:30-306)

**Strengths:**
- ✅ **Good**: Floating button with tooltip (line 158-172)
- ✅ **Good**: Example prompts in empty state (line 224-240)
- ✅ **Good**: Undo button when history exists (line 195-206)

**Issues:**
- ❌ **Confusing**: No validation on input — submitting "xyz" shows "I couldn't understand" after 300ms delay (line 76-86) — should validate on keypress
- ❌ **Missing**: No autocomplete — typing "set oil" doesn't suggest "set oil price to $X"
- ❌ **Missing**: No command history — can't press ↑ to recall last command
- ⚠️ **Feedback lag**: 300ms setTimeout (line 72) feels arbitrary — instant for cached, spinner for async?
- ❌ **Edge case**: Multiple rapid commands queue up with no indication — user can spam "increase capex by 10%" 5 times

### CommentsPanel (CommentsPanel.tsx:26-128)

**Strengths:**
- ✅ **Good**: User avatar with initial (line 73-77)
- ✅ **Good**: Delete button only for own comments (line 81-88)

**Issues:**
- ❌ **Missing**: No edit comment — must delete and re-post
- ❌ **Missing**: No @mentions or notifications
- ❌ **Missing**: No threading/replies
- ⚠️ **Formatting**: Plain text only — no markdown, links become bare URLs

### AuditLogPanel (AuditLogPanel.tsx:36-97)

**Strengths:**
- ✅ **Good**: Action icons (line 19-29) make scanning easy
- ✅ **Good**: Revert button for snapshots (line 76-87)

**Issues:**
- ❌ **Missing**: No search/filter — log becomes unreadable after 50+ entries
- ❌ **Missing**: No grouping by day/week
- ❌ **Confusing**: "Revert" button has no confirmation — destructive action feels too easy
- ⚠️ **Edge case**: What if revert fails? No error state shown

### EngineComparisonPanel (EngineComparisonPanel.tsx:73-266)

**Strengths:**
- ✅ **Excellent**: Color-coded delta thresholds (green <0.1%, yellow 0.1-1%, red >1%) — line 52-57
- ✅ **Good**: Collapsible panel saves space (line 79)
- ✅ **Good**: Loading spinner with "Running engines..." (line 145-155)

**Issues:**
- ❌ **Confusing**: Delta colors use traffic light (green=good) but some deltas are absolute — negative NPV delta is bad even if green <0.1%
- ❌ **Missing**: No explanation of WHEN comparison runs — always? only on demand?
- ⚠️ **Verbose**: 12-month flow comparison table (line 215-257) takes space — show only if deltas exist?

### MiniMapPreview (MiniMapPreview.tsx:17-142)

**Strengths:**
- ✅ **Good**: Auto-fits to well extent with padding (line 40-52)
- ✅ **Good**: Glow effect behind cluster (line 117-123)

**Issues:**
- ❌ **Missing**: No interactivity — can't click wells, zoom, or navigate to full map
- ❌ **Confusing**: Label "AUSTIN — 12 WELLS" (line 135) overlaps dots on small clusters
- ⚠️ **Edge case**: Single well shows as dot with 30px glow — looks like error blob

### MobileScenarioCards (MobileScenarioCards.tsx:25-91)

**Strengths:**
- ✅ **Good**: Horizontal scroll with snap points (line 34)
- ✅ **Good**: Dot indicators (line 75-86)

**Issues:**
- ❌ **Missing**: No swipe gesture hint — users must discover horizontal scroll
- ❌ **Confusing**: Active card has border but scrolling past doesn't update active — need to tap
- ⚠️ **Density**: Shows NPV, ROI, RIGS — but not payout, CAPEX, EUR — inconsistent with desktop summary

---

## Mobile Experience

### DesignEconomicsView Mobile (DesignEconomicsView.tsx:306-346, 709-742)

**Strengths:**
- ✅ **Good**: Mobile panel toggle (Setup/Results) with clear labels (line 312-345)
- ✅ **Good**: Sticky action strip at bottom (line 709-742)

**Issues:**
- ❌ **Confusing**: Sticky strip shows "View Results →" but ALSO have mobile toggle above — redundant?
- ⚠️ **Safe area**: `pb-[env(safe-area-inset-bottom)]` only on mobile tray (DesignWellsView.tsx:459), not on sticky strip

### DesignWellsView Mobile (DesignWellsView.tsx:458-556)

**Strengths:**
- ✅ **Good**: Mobile tray with "More" button to expand actions (line 479-488)
- ✅ **Good**: Disabled state for "Assign" when no selection (line 493-506)

**Issues:**
- ❌ **Confusing**: Tray shows "Active: GROUP NAME" but no way to change active group from mobile — must go to Groups panel
- ❌ **Inconsistent**: Desktop has 4 buttons (Assign, Create, Select, Clear), mobile tray has 2 visible + 2 in "More" — different action priority?

---

## States & Edge Cases Summary

### ✅ **Well-Handled States**
- CashFlowTable empty state (line 237-243)
- DealsTable empty state (line 134-171)
- EngineComparisonPanel loading spinner (line 145-155)
- ForecastGrid keyboard nav (line 101-120)

### ❌ **Missing States**
| Component | Missing State | Impact |
|-----------|---------------|---------|
| WellsTable | Empty state (no wells) | Blank table confuses users |
| WellsTable | Zero results (all filtered out) | Users think app broken |
| CashFlowTable | Loading state | No feedback during async calc |
| DealsTable | Error state (load failed) | Silent failure |
| AiAssistant | Command queue indicator | Users spam commands |
| CommentsPanel | Edit comment | Must delete/re-post to fix typo |
| AuditLogPanel | Revert confirmation | Destructive action too easy |
| ForecastGrid | Validation errors | Users can enter NaN values |

### ⚠️ **Edge Cases to Test**
1. **ForecastGrid**: What if user edits month 1, then sorts by month desc? Edit lost?
2. **WaterfallChart**: Empty `drivers` array shows only 2 bars — confusing
3. **MiniMapPreview**: Single well with 30px glow looks like error state
4. **EconomicsDriversPanel**: No drivers when economics not run — panel shows empty?
5. **DealsTable**: Deal with `updatedAt` from 2+ years ago shows "Jan 12" — ambiguous

---

## Microcopy & Voice

### ✅ **Clear & Helpful**
- CashFlowTable empty: "No cash flow data available. Run economics to generate projections." (line 240)
- DealsTable empty: "Create your first deal to start evaluating economics." (line 157)
- AiAssistant placeholder: "Ask the AI..." (line 284)

### ❌ **Ambiguous or Technical**
- WaterfallChart: "VALUE BRIDGE" — what does that mean? Change to "NPV Drivers" or "Sensitivity Waterfall"
- EngineComparisonPanel: "ENGINE COMPARISON" — users don't know what "engine" means (TS vs Python)
- ForecastGrid: "Ctrl+D fill down" — Mac users see Cmd or Ctrl? Use `⌘D` / `Ctrl+D` per platform

### ⚠️ **Button Text**
- "Post" (CommentsPanel line 120) — generic, use "Add Comment"
- "Revert" (AuditLogPanel line 85) — scary without confirmation, use "Restore This Snapshot"
- "+ New Deal" (DealsTable line 128) — good, action-oriented

---

## What's Working

1. **TanStack Table integration** — Sorting, filtering, column resizing all work smoothly
2. **Keyboard nav in ForecastGrid** — Power users will love Ctrl+D fill-down
3. **Empty states in DealsTable** — Icon + copy + CTA is model for rest of app
4. **Driver detail panel** — "Why it matters" narrative excellent for junior analysts
5. **Mobile tray expansion** — "More" button gracefully hides secondary actions

---

## Priority Issues (top 5 with fixes)

### 1. **Missing input validation in ForecastGrid** (HIGH IMPACT)
**Problem:** User can enter negative production or text in number fields (line 52 `parseFloat` returns `NaN`)
**Fix:**
```tsx
const parsed = parseFloat(editValue);
if (!isNaN(parsed) && parsed >= 0) {
  // apply edit
} else {
  // show inline error: "Must be positive number"
  setEditValue(String(flow[row][field])); // revert
}
```

### 2. **No empty/error states in WellsTable** (HIGH IMPACT)
**Problem:** Empty well list shows blank table with headers — looks broken
**Fix:** Add after line 252:
```tsx
{table.getRowModel().rows.length === 0 && (
  <div className="p-8 text-center">
    <p className="text-theme-muted">
      {globalFilter || columnFilters.length > 0
        ? 'No wells match your filters. Try adjusting search or filters.'
        : 'No wells available. Import wells to get started.'}
    </p>
  </div>
)}
```

### 3. **Disabled tabs with no data** (MEDIUM IMPACT)
**Problem:** Clicking "Cash Flow" tab when no economics run shows empty table — should disable tab
**Fix:** In EconomicsResultsTabs.tsx, add `disabled` prop:
```tsx
<button
  disabled={tab === 'CASH_FLOW' && flow.length === 0}
  className={disabled ? 'opacity-40 cursor-not-allowed' : ''}
>
```

### 4. **Confirm destructive actions** (MEDIUM IMPACT)
**Problem:** "Revert" in AuditLogPanel (line 78) has no confirmation — one misclick loses work
**Fix:**
```tsx
const handleRevert = (id: string) => {
  if (confirm('Restore this snapshot? Current state will be lost.')) {
    onRevert(id);
  }
};
```

### 5. **Clear "editable" affordance in ForecastGrid** (MEDIUM IMPACT)
**Problem:** Editable cells look identical to read-only until hover
**Fix:** In line 150, change:
```tsx
const base = `px-3 py-1.5 text-[11px] tabular-nums text-${align} cursor-default transition-colors`;
const editableHint = isEditable(colIdx) && !readOnly
  ? 'cursor-cell hover:bg-theme-cyan/10 hover:ring-1 hover:ring-theme-cyan/30'
  : '';
```

---

## Recommendations

### Immediate (next sprint)
1. Add empty/error states to all tables (WellsTable, CashFlowTable, DealsTable)
2. Add input validation to ForecastGrid (positive numbers, no NaN)
3. Add confirmation dialog to destructive actions (revert, delete, clear selection)
4. Disable tabs when data not available (EconomicsResultsTabs)

### Short-term (1-2 sprints)
5. Add export to CSV for tables (users will request this)
6. Add autocomplete to AI Assistant (boost adoption)
7. Add undo/redo to ForecastGrid edits (reduce anxiety)
8. Add @mentions and threading to CommentsPanel (team collaboration)

### Long-term (3+ sprints)
9. Add saved filter presets to WellsTable (user productivity)
10. Add comparison mode to CashFlowTable (Q1 2025 vs Q1 2026)
11. Add bulk actions to DealsTable (archive multiple deals)
12. Add interactivity to MiniMapPreview (click to zoom/navigate)

### Design system debt
- Standardize empty states (icon + title + copy + CTA) across all panels
- Standardize error states (icon + message + retry/dismiss)
- Standardize success confirmations (toast? inline banner?)
- Create input component library with built-in validation states
