# 05 — AI Coding Guidelines

Rules for AI agents (Claude, Copilot, Cursor, Codex) working in the Slopcast codebase. These should be added to `CLAUDE.md` and `.cursorrules` once adopted.

---

## File Size Limits

| Directory | Max Lines | Rationale |
|-----------|-----------|-----------|
| `src/hooks/` | 200 | Hooks should do one thing. If it's bigger, split it. |
| `src/components/` | 400 | Components over 400 lines are rendering too many concerns. |
| `src/components/*Background.tsx` | Existing only | Do not create new monolith backgrounds. Use `useCanvasAnimation` pattern. |
| `src/utils/` | 300 | Pure functions should be small and focused. |
| `src/services/` | 400 | Services can be larger due to API surface, but watch it. |
| `src/pages/` | 300 | Pages should compose, not implement. |

**Rule:** Before adding lines to any file, check its current size. If your change would push it past the limit, split first, then add.

---

## State Management Rules

### Never add state to `useSlopcastWorkspace` directly

This hook is an orchestrator. New state belongs in a domain-specific hook:

| Domain | Hook | Where to add state |
|--------|------|--------------------|
| Well filtering | `useWellFiltering` | Filter criteria, filtered results |
| Well selection | `useWellSelection` | Selected IDs, selection handlers |
| Group management | `useGroupManagement` | Groups, active group, CRUD |
| Scenarios | `useScenarioManagement` | Scenarios, pricing, schedule |
| UI preferences | `useWorkspaceUI` | View mode, panels, tabs, focus |

### useState Budget

No single hook should have more than **8 useState calls**. If you need more, you're managing multiple concerns — split the hook.

### useEffect Budget

No single hook should have more than **4 useEffect calls**. Effects are the #1 source of bugs in React. If you need more side effects, extract a custom hook for each concern.

---

## Import Rules

### Allowed Import Directions

```
pages → components, hooks, services, utils, auth, theme
components → components, hooks, utils, services, theme
hooks → hooks, services, utils
services → utils
utils → utils (only)
```

### Forbidden Import Directions

```
utils → components    (utils must be pure)
utils → hooks         (utils must not depend on React)
services → components (services must not render)
services → hooks      (services must not depend on React lifecycle)
```

### Import Style

```ts
// Good — type imports separated
import type { Well, WellGroup } from '@/types';
import { computeGroupEconomics } from '@/utils/economics';

// Bad — mixed type and value imports
import { Well, WellGroup, computeGroupEconomics } from '@/types';
```

---

## Component Creation Rules

### Before Creating a New Component

1. **Search for existing components** that do something similar
2. **Check if an existing component** can be extended with props
3. **Only create new** if the component represents a genuinely new concern

### Component Structure

```tsx
// 1. Imports (types first, then libs, then local)
import type { Well } from '@/types';
import { useMemo } from 'react';
import { useTheme } from '@/theme/ThemeProvider';

// 2. Props interface (always typed, never `any`)
interface WellCardProps {
  well: Well;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// 3. Component (single export per file)
export function WellCard({ well, isSelected, onSelect }: WellCardProps) {
  // hooks first, then handlers, then render
}
```

### No Anonymous Default Exports

```ts
// Bad
export default function({ well }) { ... }
export default () => { ... }

// Good
export function WellCard({ well }: WellCardProps) { ... }
```

---

## Type Rules

### No `any`

```ts
// Bad
const data: any = await fetch(url);
const result = items.map((item: any) => item.name);

// Good
const data: ApiResponse = await fetch(url).then(r => r.json());
const result = items.map((item: Well) => item.name);
```

If you truly don't know the type, use `unknown` and narrow:

```ts
const data: unknown = await fetch(url).then(r => r.json());
if (isApiResponse(data)) {
  // now data is typed
}
```

### Types Go in Domain Files

New types go in the appropriate `src/types/*.ts` file, not in the component that uses them. Types are shared contracts — they belong in the type layer.

---

## CSS Rules

### Use CSS Custom Properties, Not Inline Styles

```tsx
// Bad
<div style={{ backgroundColor: 'var(--surface-1)', borderRadius: '18px' }}>

// Good
<div className="glass-panel">
```

### No Direct CSS Variable References in TSX

```tsx
// Bad
<div style={{ color: 'var(--cyan)' }}>

// Good — use a CSS class that references the variable
<div className="text-accent">
```

### Theme-Native, Not Theme-Aware

```tsx
// Bad — component "knows about" themes
const bg = themeId === 'mario' ? '#1a1a2e' : '#0f0f1a';

// Good — component consumes CSS custom properties
// The theme system handles the mapping
<div className="surface-panel">
```

---

## Before Every Commit

AI agents should run (or verify that these pass):

```bash
npm run typecheck    # No type errors
npm run lint         # No lint errors (warnings OK temporarily)
npm run circular     # No circular dependencies
npm test             # All tests pass
```

---

## Testing Requirements for New Code

| What you wrote | What you must test |
|-----------------|-------------------|
| New hook | `renderHook` test covering main behaviors |
| New util function | Unit test with edge cases |
| New service method | Unit test with mocked dependencies |
| New component | At minimum, a smoke render test |
| Bug fix | Regression test that would have caught the bug |

---

## Anti-Patterns to Avoid

### 1. The Growing Switch Statement
```ts
// Bad — adding cases to a switch instead of using a map
switch (themeId) {
  case 'slate': return <SlateBackground />;
  case 'mario': return <MarioBackground />;
  // This grows forever...
}

// Good — data-driven
const BACKGROUNDS: Record<string, ComponentType> = {
  slate: SlateBackground,
  mario: MarioBackground,
};
const Bg = BACKGROUNDS[themeId];
```

### 2. Prop Drilling Through 4+ Levels
If a prop passes through 3+ components without being used, it should be in context or a hook.

### 3. Copy-Paste Components
If two components share >50% of their logic, extract the shared part into a hook or base component.

### 4. "Temporary" Code That Stays
If you add a `// TODO` or `// HACK`, create a task for it. Don't leave it for someone else to discover.
