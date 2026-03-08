# Phase 3: Inline Editing - Research

**Researched:** 2026-03-08
**Domain:** React inline editing patterns, debounced state management, financial input UX
**Confidence:** HIGH

## Summary

Phase 3 transforms the existing accordion-based assumption controls (Controls.tsx with CapexControls, OpexControls, OwnershipControls) into inline-editable displays. The codebase already has most of the editing logic built -- CapexControls already has a summary/edit toggle pattern, and OPEX/Ownership controls are already grid-based with inline inputs. The primary work is: (1) replacing the accordion wrapper with always-visible display values that transform to inputs on click, (2) adding commit-on-blur with debounced recalculation, and (3) adding Tab navigation and recalc feedback animation.

The existing `onUpdateGroup` callback in `useSlopcastWorkspace` already triggers economics recalculation. The debounce layer wraps this callback so rapid sequential edits (Tab through fields) accumulate into a single recalc. No new libraries are needed -- React state, refs, and a simple `useDebounce` hook cover all requirements.

**Primary recommendation:** Build a reusable `InlineEditableValue` component and a `useDebouncedRecalc` hook. Refactor assumption displays to use these primitives. Keep existing Controls.tsx handler logic but replace the accordion UI shell.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Click-to-edit: single click on a value transforms it into an input field
- Hover affordance only: no visual hint at rest, hover reveals light background highlight + edit cursor
- Tab advances to next editable field (spreadsheet-style sequential editing)
- Escape cancels active edit and reverts to original value
- Enter commits the value (same as blur)
- Commit-on-blur: value saves when input loses focus (not on every keystroke)
- Debounce delay: 300-500ms after last edit before triggering economics recalculation
- Subtle pulse/shimmer animation on KPI values during recalculation
- Multiple sequential edits (via Tab) accumulate -- single recalc fires after debounce from last edit
- All four assumption types editable: type curve (qi, b, di), CAPEX (9 line items), OPEX (LOE segments), ownership (NRI, cost interest)
- CAPEX supports full CRUD inline: add new line items, remove existing, edit both category name and dollar amount
- OPEX follows same CRUD pattern for LOE segments
- Validation errors: red border on input + tooltip with error message
- Inline inputs styled to match glass design system (theme tokens, compact density from Phase 1)

### Claude's Discretion
- Number formatting during edit (raw vs live-formatted)
- Undo mechanism (simple re-edit vs Ctrl+Z)
- Exact pulse/shimmer animation implementation for recalc feedback
- Add/remove row UI for CAPEX/OPEX (button placement, confirmation)
- Input sizing and auto-width behavior
- Tooltip positioning and styling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-03 | User can edit type curve, CAPEX, OPEX, and ownership assumptions inline where they are displayed | InlineEditableValue component pattern; existing handler logic in Controls.tsx, CapexControls, OpexControls, OwnershipControls already has all CRUD operations |
| DATA-04 | Inline edits are debounced/buffered (commit-on-blur) to prevent economics recalculation storms | useDebouncedRecalc hook wrapping onUpdateGroup; commit-on-blur pattern with accumulated edits |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18+ (existing) | Component state, refs, effects | Already in project |
| Tailwind CSS v4 | existing | Styling inline inputs, hover states, animations | Already in project (Phase 1) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| motion/react | existing | KPI shimmer/pulse animation during recalc | Already installed from Phase 2 view transitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom InlineEditableValue | react-editable | Adds dependency for simple click-to-edit; custom is ~40 lines and matches glass design system exactly |
| Custom debounce hook | lodash.debounce | Already common pattern; custom hook is 10 lines and avoids dependency |
| TanStack Table inline editing | Custom grid rows | CAPEX/OPEX already have grid-based layouts in existing controls; TanStack column editing adds complexity without benefit for these small datasets |

**Installation:**
```bash
# No new packages needed -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    inline/                    # New: inline editing primitives
      InlineEditableValue.tsx  # Core click-to-edit component
      InlineNumberInput.tsx    # Numeric variant with validation + formatting
      InlineTextInput.tsx      # Text variant (CAPEX item names, OPEX labels)
      InlineSelectInput.tsx    # Dropdown variant (CAPEX category, basis)
    slopcast/
      hooks/
        useDebouncedRecalc.ts  # Debounce wrapper for onUpdateGroup
        useRecalcStatus.ts     # Tracks "recalculating" state for shimmer
      KpiGrid.tsx              # Modified: add shimmer animation during recalc
      DesignEconomicsView.tsx  # Modified: wire debounced callbacks
    Controls.tsx               # Modified: replace accordion UI with inline display
    CapexControls.tsx          # Modified: always-inline grid (remove summary/edit toggle)
    OpexControls.tsx           # Modified: always-inline grid
    OwnershipControls.tsx      # Modified: always-inline fields
```

### Pattern 1: InlineEditableValue (click-to-edit primitive)
**What:** A component that renders a display value at rest, transforms to an input on click, commits on blur/Enter, cancels on Escape.
**When to use:** Every editable assumption field.
**Example:**
```typescript
interface InlineEditableValueProps {
  value: string | number;
  onCommit: (newValue: string) => void;
  format?: (value: string | number) => string; // Display formatting
  parse?: (raw: string) => string | number;     // Input parsing
  validate?: (raw: string) => string | null;    // Returns error message or null
  type?: 'text' | 'number';
  className?: string;
  inputClassName?: string;
}

const InlineEditableValue: React.FC<InlineEditableValueProps> = ({
  value, onCommit, format, parse, validate, type = 'text', className, inputClassName
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value));
      setError(null);
      // Focus + select on next tick
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, value]);

  const commit = () => {
    if (validate) {
      const err = validate(draft);
      if (err) { setError(err); return; }
    }
    const parsed = parse ? parse(draft) : draft;
    onCommit(String(parsed));
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(value));
    setError(null);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    // Tab is handled natively -- blur fires commit
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-pointer hover:bg-theme-surface2/50 rounded px-1 -mx-1 transition-colors ${className}`}
        tabIndex={0}
        onFocus={() => setEditing(true)}
      >
        {format ? format(value) : String(value)}
      </span>
    );
  }

  return (
    <span className="relative">
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`bg-theme-bg border rounded-inner px-1 outline-none text-theme-text
          ${error ? 'border-red-500 focus:ring-red-500/30' : 'border-theme-border focus:border-theme-cyan focus:ring-theme-cyan/30'}
          focus:ring-1 ${inputClassName}`}
      />
      {error && (
        <span className="absolute left-0 top-full mt-1 text-[9px] text-red-400 bg-theme-bg border border-red-500/30 rounded px-2 py-0.5 whitespace-nowrap z-50">
          {error}
        </span>
      )}
    </span>
  );
};
```

### Pattern 2: Debounced Recalc Hook
**What:** Wraps `onUpdateGroup` to buffer rapid edits and fire recalculation once after a delay.
**When to use:** Passed to Controls instead of raw `onUpdateGroup`.
**Example:**
```typescript
function useDebouncedRecalc(
  onUpdateGroup: (group: WellGroup) => void,
  delay = 400
) {
  const latestGroupRef = useRef<WellGroup | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const debouncedUpdate = useCallback((group: WellGroup) => {
    latestGroupRef.current = group;
    setIsRecalculating(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (latestGroupRef.current) {
        onUpdateGroup(latestGroupRef.current);
      }
      // Allow a beat for recalc to propagate
      setTimeout(() => setIsRecalculating(false), 150);
    }, delay);
  }, [onUpdateGroup, delay]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { debouncedUpdate, isRecalculating };
}
```

### Pattern 3: KPI Shimmer Animation
**What:** CSS keyframe animation on KPI values during recalculation.
**When to use:** KpiGrid receives `isRecalculating` prop.
**Example:**
```typescript
// In KpiGrid.tsx -- wrap value displays
<span className={isRecalculating ? 'animate-shimmer' : ''}>
  ${(metrics.npv10 / 1e6).toFixed(1)}
</span>

// CSS (in theme.css or Tailwind config)
@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-shimmer {
  animation: shimmer 0.8s ease-in-out infinite;
}
```

### Anti-Patterns to Avoid
- **Recalc on every keystroke:** Current CapexControls fires onChange on every input change event. Must switch to commit-on-blur for inline pattern.
- **Separate edit mode:** CapexControls has a `isEditing` toggle that shows summary vs edit view. Inline editing means values are ALWAYS editable in place -- no mode switch.
- **Full group spread on every field:** `onUpdateGroup({ ...group, typeCurve: { ...group.typeCurve, [key]: val } })` creates a new object per edit. With debounce, intermediate objects are discarded -- this is fine but the debounce must use the LATEST accumulated group, not stale closures.
- **Controlled number inputs with live formatting:** During active editing, show raw numbers. Format only on display (when not editing). Live-formatting confuses cursor position.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus management across Tab | Manual focus tracking across inputs | Native Tab order + `onFocus` to enter edit mode | Browser handles Tab sequence natively; just make inputs focusable in correct order |
| Number validation | Regex parsing | `type="number"` + step attributes + post-commit validation | Native number inputs handle most cases; validate on commit for business rules (e.g., qi > 0, NRI 0-100%) |
| Tooltip positioning | Manual coordinate math | CSS `absolute` + `top-full` on parent `relative` | Simple positioned tooltips; no need for Popper/Floating UI for this use case |

**Key insight:** The existing Controls ecosystem already has all the state management and handler logic. This phase is primarily a UI transformation -- replacing accordion wrappers and summary/edit toggles with always-visible inline-editable values.

## Common Pitfalls

### Pitfall 1: Stale Closure in Debounce
**What goes wrong:** Debounced callback captures stale `group` state from when the timer was set, not the latest accumulated edits.
**Why it happens:** React closures capture values at render time. If user edits field A then field B within the debounce window, field A's edit may be lost.
**How to avoid:** Use a ref (`latestGroupRef`) to always store the most recent group state. The debounce timer reads from the ref, not the closure.
**Warning signs:** Edits appearing to "revert" when making rapid sequential changes.

### Pitfall 2: Blur Fires Before Click on Adjacent Element
**What goes wrong:** Clicking a delete button or add button triggers blur on the active input, which commits, and THEN the click fires. This can cause race conditions.
**Why it happens:** Browser event order: blur fires before click on the new target.
**How to avoid:** Use `onMouseDown` with `e.preventDefault()` on delete/add buttons to prevent blur from firing. Or use a short `setTimeout` in the blur handler to check if focus moved to a related element.
**Warning signs:** Edits committing unexpectedly when clicking action buttons.

### Pitfall 3: Tab Order Breaking Across Accordion Sections
**What goes wrong:** Tab from the last field in Type Curve should go to the first field in CAPEX, but accordion DOM order or hidden elements break the flow.
**Why it happens:** If sections use `max-h-0 overflow-hidden` for collapse, hidden inputs are still in the tab order.
**How to avoid:** Since inline editing replaces accordions with always-visible sections, this is resolved by design. Ensure all inline-editable values are in DOM order without hidden intermediaries.
**Warning signs:** Tab jumping to unexpected locations or getting "stuck".

### Pitfall 4: isClassic Theme Branching
**What goes wrong:** Inline input styling only works in modern theme, looks broken in Mario theme.
**Why it happens:** Every component in this codebase branches styling on `isClassic`. New inline components must follow same pattern.
**How to avoid:** InlineEditableValue accepts `className` and `inputClassName` props. Each consumer passes theme-appropriate classes. Or accept `isClassic` prop directly.
**Warning signs:** Visual testing only in one theme.

### Pitfall 5: Number Formatting Cursor Jump
**What goes wrong:** Formatting a number (e.g., adding commas or dollar signs) while the user types causes the cursor to jump to the end.
**Why it happens:** React re-renders the input with a formatted value, resetting cursor position.
**How to avoid:** Show raw unformatted numbers during editing. Only format on display (when not in edit mode). This is the standard approach for financial inputs.
**Warning signs:** Cursor jumping while typing numbers.

## Code Examples

### Existing Handler Pattern (Controls.tsx line 125-128)
```typescript
const handleTcChange = (key: keyof TypeCurveParams, val: string) => {
  onUpdateGroup({ ...group, typeCurve: { ...group.typeCurve, [key]: parseFloat(val) || 0 } });
  if (onMarkDirty) onMarkDirty();
};
```
This fires on every keystroke via `onChange`. For inline editing, this becomes a commit-on-blur handler that calls the debounced update.

### Existing CAPEX CRUD (CapexControls.tsx lines 37-61)
```typescript
const handleUpdateItem = (id: string, field: keyof CapexItem, value: any) => { ... };
const handleAddItem = () => { ... };
const handleDeleteItem = (id: string) => { ... };
```
These handlers are reused directly. The UI changes from a toggled edit grid to an always-visible inline grid.

### Existing OPEX Chain Segments (OpexControls.tsx lines 23-49)
```typescript
const handleUpdateSegment = (id: string, updates: Partial<OpexSegment>) => {
  // Includes chaining logic: updating endMonth auto-updates next segment's startMonth
};
```
This chaining logic must be preserved. The debounce wraps the final `onChange` call, not individual field updates.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Accordion edit panels (current) | Inline click-to-edit values | This phase | Eliminates mode switching; values always visible and editable |
| onChange on every keystroke | Commit-on-blur with debounced recalc | This phase | Prevents recalc storms; better UX for sequential editing |
| Summary view + Edit view toggle (CapexControls) | Always-editable grid | This phase | No mode switch; CAPEX line items always visible as editable rows |

**Deprecated/outdated:**
- CapexControls `isEditing` state toggle: Remove entirely. Grid is always visible and editable.
- AccordionSection wrapper in Controls.tsx: Replace with flat section headers. Sections are always expanded with inline-editable values.

## Open Questions

1. **Should the debounce also buffer `onMarkDirty`?**
   - What we know: `onMarkDirty` signals persistence layer that data changed. Currently called alongside every `onUpdateGroup`.
   - What's unclear: Whether marking dirty on every field blur (even before recalc) causes premature persistence writes.
   - Recommendation: Call `onMarkDirty` immediately on blur (optimistic), debounce only the economics recalc. This ensures data is saved even if user navigates away during debounce window.

2. **Undo strategy**
   - What we know: User can always re-edit a field to its previous value. CONTEXT.md leaves undo as Claude's discretion.
   - Recommendation: Simple re-edit approach (no Ctrl+Z). Adding undo history adds state complexity with minimal benefit for a focused editing workflow. Users edit specific known values, not doing exploratory typing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing) |
| Config file | vitest.config.ts (existing) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-03 | InlineEditableValue commits on blur, cancels on Escape, commits on Enter | unit | `npm test -- --run src/components/inline/InlineEditableValue.test.tsx` | No -- Wave 0 |
| DATA-03 | CAPEX inline CRUD (add/remove/edit line items) | unit | `npm test -- --run src/components/CapexControls.test.tsx` | No -- Wave 0 |
| DATA-04 | useDebouncedRecalc buffers rapid updates, fires once after delay | unit | `npm test -- --run src/components/slopcast/hooks/useDebouncedRecalc.test.ts` | No -- Wave 0 |
| DATA-04 | Multiple sequential Tab edits produce single recalc | unit | `npm test -- --run src/components/slopcast/hooks/useDebouncedRecalc.test.ts` | No -- Wave 0 |
| DATA-03 | Visual: inline editing looks correct across themes | manual-only | `npm run ui:shots` | N/A -- Playwright visual |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run && npm run typecheck && npm run build`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/inline/InlineEditableValue.test.tsx` -- covers DATA-03 core interaction
- [ ] `src/components/slopcast/hooks/useDebouncedRecalc.test.ts` -- covers DATA-04 debounce behavior
- [ ] `src/components/CapexControls.test.tsx` -- covers DATA-03 CAPEX CRUD

## Sources

### Primary (HIGH confidence)
- Codebase inspection: Controls.tsx, CapexControls.tsx, OpexControls.tsx, OwnershipControls.tsx, DesignEconomicsView.tsx, KpiGrid.tsx, types.ts
- React documentation: controlled inputs, refs, useEffect cleanup patterns

### Secondary (MEDIUM confidence)
- Common React inline editing patterns (widely established community pattern)
- CSS keyframe animation for shimmer effects (standard approach)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies needed; all patterns use existing React + Tailwind
- Architecture: HIGH - existing code has all handler logic; transformation is well-scoped UI refactor
- Pitfalls: HIGH - stale closure and blur/click ordering are well-documented React patterns

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable -- no fast-moving dependencies)
