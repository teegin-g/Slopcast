# Architecture Patterns

**Domain:** SaaS workspace UI revamp (sidebar nav, inline editing, glass/transparent shell over animated canvas)
**Researched:** 2026-03-06 (updated with stack verification)

## Recommended Architecture

The target is an **App Shell** pattern: a persistent chrome (sidebar + topbar) wrapping a content area, with the animated canvas background rendered behind everything via a fixed-position layer. All shell surfaces use transparency/backdrop-blur so the canvas shows through.

### Layout Hierarchy

```
<WorkspaceRoot>                         // position: relative, min-h-screen
  <CanvasBackground />                  // position: fixed, z-0, full viewport
  <AppShell>                            // position: relative, z-10, flex row
    <Sidebar />                         // fixed width (240-280px), collapsible to icon-only (56px)
    <MainColumn>                        // flex: 1, flex column
      <Topbar />                        // sticky top-0, breadcrumbs + actions + theme picker
      <ContentArea>                     // flex: 1, overflow-y-auto, scroll container
        <PageContent />                 // route-specific content (wells view, economics view, etc.)
      </ContentArea>
    </MainColumn>
  </AppShell>
  <OverlayLayer />                      // modals, drawers, toasts (z-50+)
</WorkspaceRoot>
```

### Technology Mapping

| Component | Libraries Used | Notes |
|-----------|---------------|-------|
| All surfaces | Tailwind CSS v4 utilities + `@theme` tokens | Makes existing className references work |
| Sidebar nav items | Radix ToggleGroup or custom | Icon + label, active state, collapse behavior |
| Dropdowns/menus | Radix DropdownMenu | Group selector, settings menus |
| Tooltips | Radix Tooltip | Sidebar icon-only mode needs tooltips |
| Sidebar collapse animation | motion `layout` prop | Smooth width transition with content reflow |
| View switching animation | motion `AnimatePresence` | Crossfade between Wells/Economics/Scenarios |
| Data tables | TanStack Table + TanStack Virtual | Wells list, cash flow, deals -- headless + virtualized |
| Inspector panel | Radix Dialog (non-modal) or custom | Slide-in panel from right |
| Command palette | cmdk | Cmd+K overlay |
| Toast notifications | sonner | Inline feedback (save success, calc complete) |
| Mobile drawer | vaul | Sidebar becomes touch-gesture drawer |
| Icons | lucide-react | Sidebar icons, action buttons, status indicators |
| Scrollbars | Radix ScrollArea | Consistent custom scrollbars in glass panels |

### Component Boundaries

| Component | Responsibility | Communicates With | Transparency |
|-----------|---------------|-------------------|--------------|
| `WorkspaceRoot` | Owns layout skeleton, renders canvas background as sibling to shell | ThemeProvider (context), useSlopcastWorkspace (hook) | N/A (container) |
| `CanvasBackground` | Renders themed animated canvas at z-0 | ThemeProvider (reads themeId to select background) | Full opacity canvas |
| `AppShell` | Flex container for sidebar + main column | WorkspaceRoot (child) | `bg-transparent` -- delegates glass to children |
| `Sidebar` | Persistent navigation: Wells, Economics, Scenarios, Settings sections | WorkspaceRoot (nav state), ContentArea (route selection) | `backdrop-blur-xl bg-surface-1/30 border-r` |
| `Topbar` | Context bar: breadcrumb trail, group selector, action buttons, theme picker | Sidebar (reflects active section), useSlopcastWorkspace (group state) | `backdrop-blur-md bg-surface-1/40 border-b` |
| `ContentArea` | Scroll container for active page content | Topbar (scroll position for shadow), PageContent (renders child) | `bg-transparent` |
| `PageContent` | Wells view, Economics view, Scenarios view, etc. | useSlopcastWorkspace (all domain state), Controls (inline editing) | Panels use `bg-surface-1/50 backdrop-blur-sm` |
| `InspectorPanel` | Right-side contextual editor (inline assumption editing) | PageContent (selected entity), useSlopcastWorkspace (update handlers) | `backdrop-blur-xl bg-surface-1/40` |

### Data Flow

```
ThemeProvider (context)
    |
    v
WorkspaceRoot
    |--- CanvasBackground (reads themeId, renders appropriate *Background.tsx)
    |
    |--- AppShell
           |--- Sidebar
           |      |--- NavItems (Wells, Economics, Scenarios) -- lucide-react icons
           |      |--- GroupSelector (active group, group list) -- Radix DropdownMenu
           |      |--- SettingsSection (theme picker, color mode, engine toggle)
           |
           |--- MainColumn
                  |--- Topbar
                  |      |--- Breadcrumbs (section > subsection)
                  |      |--- ActionBar (focus mode, share, export)
                  |
                  |--- ContentArea (Radix ScrollArea)
                         |--- AnimatePresence (motion)
                         |      |--- WellsView (map + TanStack Table for well list)
                         |      |--- EconomicsView (KPIs + charts + TanStack Table for cash flow)
                         |      |--- ScenariosView (scenario dashboard)
                         |
                         |--- InspectorPanel (conditional, right side)
                                |--- Controls (type curve, CAPEX, OPEX, ownership)
                                |--- TaxControls, DebtControls
                                |--- ReservesPanel
```

**State flow direction:** Top-down via props from `useSlopcastWorkspace`. The hook remains the single source of truth. Sidebar navigation state is a new piece of local state (which section is active), replacing the current `designWorkspace` and `viewMode` combination.

**Event flow direction:** Bottom-up via callbacks. User clicks nav item in Sidebar -> calls `onNavigate('economics')` -> WorkspaceRoot updates active section -> ContentArea renders corresponding view.

## Patterns to Follow

### Pattern 1: App Shell with Transparent Chrome

**What:** A persistent layout shell (sidebar + topbar) that uses `backdrop-blur` and semi-transparent backgrounds so the animated canvas underneath remains visible.

**When:** Always -- this is the core architectural pattern for the revamp.

**Implementation:**
```typescript
// WorkspaceShell.tsx
const WorkspaceShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeId } = useTheme();
  const BackgroundComponent = useBackgroundComponent(themeId);

  return (
    <div className="relative min-h-screen">
      {BackgroundComponent && (
        <Suspense fallback={null}>
          <div className="fixed inset-0 z-0">
            <BackgroundComponent />
          </div>
        </Suspense>
      )}
      <div className="relative z-10 flex min-h-screen">
        {children}
      </div>
    </div>
  );
};
```

### Pattern 2: CVA Component Variants

**What:** Use class-variance-authority (CVA) to define typed component variants instead of ternary class strings.

**When:** Any component with multiple visual states (buttons, cards, badges).

**Why:** Eliminates the `isClassic ? 'sc-panel' : 'bg-theme-surface1/70'` ternary sprawl. Centralizes variant logic. TypeScript-safe.

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl border transition-colors',
  {
    variants: {
      surface: {
        glass: 'bg-surface-1/50 backdrop-blur-sm border-white/10 shadow-lg',
        solid: 'bg-surface-1 border-border',
        transparent: 'bg-transparent border-transparent',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      surface: 'glass',
      size: 'md',
    },
  }
);
```

### Pattern 3: cn() Utility (clsx + tailwind-merge)

**What:** A utility function that combines clsx (conditional classes) with tailwind-merge (conflict resolution).

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Pattern 4: Section-Based Navigation (Not Route-Based)

**What:** Sidebar navigation switches content views within the same route (`/slopcast`), not via React Router routes.

**Why not routes:** The workspace shares a massive state object (`useSlopcastWorkspace`). Splitting into routes would require lifting all state to a context provider or losing state on navigation.

```typescript
type WorkspaceSection = 'wells' | 'economics' | 'scenarios';
const [activeSection, setActiveSection] = useState<WorkspaceSection>('wells');
```

### Pattern 5: Glass-Morphism Token System

**What:** CSS custom properties for glass/transparent surfaces, integrated with Tailwind v4's `@theme`.

```css
@theme {
  --color-surface-glass: rgb(var(--surface-1) / 0.5);
  --color-surface-glass-heavy: rgb(var(--surface-1) / 0.7);
  --color-glass-border: rgb(var(--border) / 0.3);
}

[data-theme='mario'] {
  --color-surface-glass: rgb(var(--surface-1) / 0.7);
  --color-surface-glass-heavy: rgb(var(--surface-1) / 0.85);
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prop Drilling Navigation State

**What:** Passing `activeSection`, `onNavigate`, `sidebarCollapsed` through 4+ levels.
**Instead:** Create a lightweight `useWorkspaceNav` hook or small context for navigation state only.

### Anti-Pattern 2: Rebuilding State Architecture

**What:** Introducing Redux/Zustand/Jotai and migrating the 900-line `useSlopcastWorkspace` hook.
**Instead:** Keep `useSlopcastWorkspace` as-is. Add a small `useWorkspaceNav` hook for sidebar/inspector state.

### Anti-Pattern 3: Making Every Surface Transparent

**What:** Applying backdrop-blur to every card, table cell, and input field.
**Instead:** Glass on chrome only (sidebar, topbar, inspector). Content cards higher opacity. Data tables near-opaque. 3-4 blur layers max.

### Anti-Pattern 4: Using `isClassic` Conditionals for New Components

**What:** Adding `isClassic ? classicStyles : modernStyles` to new components.
**Instead:** Use Tailwind + theme tokens. Theme differences handled at CSS level via `[data-theme]` selectors. ONE code path per component.

### Anti-Pattern 5: Importing Full Radix Themes Package

**What:** Installing `@radix-ui/themes` for convenience.
**Instead:** Import individual Radix primitive packages and style with Tailwind.

## Suggested Build Order

### Phase 1: Shell Foundation
1. Install Tailwind v4 + `@tailwindcss/vite` plugin
2. Wire theme tokens via `@theme` in CSS
3. Create `cn()` utility (clsx + tailwind-merge)
4. Glass token system
5. `useWorkspaceNav` hook
6. `WorkspaceShell` root layout

### Phase 2: Sidebar Navigation
7. `SidebarNavItem` with lucide-react icons
8. `Sidebar` -- navigation + group selector + collapse
9. `Topbar` -- breadcrumbs + actions

### Phase 3: Content Migration
10. Migrate Wells view into new ContentArea
11. Migrate Economics view -- full-width, strip left-column controls
12. Migrate Scenarios view
13. Add TanStack Table to wells list and cash flow

### Phase 4: Inspector Panel
14. `InspectorPanel` component
15. Wire Controls into Inspector
16. Add motion transitions for sidebar and inspector

### Dependency Graph

```
Tailwind v4 + @theme --> cn() utility --> Glass tokens --> WorkspaceShell
                                                              |
                                              useWorkspaceNav +
                                                   |
                                          Sidebar + Topbar
                                                   |
                                          Content Migration
                                                   |
                                          Inspector Panel
```

## Responsive Breakpoints

| Breakpoint | Sidebar | Topbar | Inspector | Content |
|------------|---------|--------|-----------|---------|
| < 768px (mobile) | Hidden drawer via vaul | Hamburger + breadcrumb only | Bottom sheet (full width) | Single column, full width |
| 768-1023px (tablet) | Collapsed (icon-only, 56px) | Full topbar | Overlay panel (320px) | Full width minus sidebar |
| 1024-1279px (desktop) | Expanded (240px) | Full topbar | Overlay panel (360px) | Full width minus sidebar |
| >= 1280px (wide) | Expanded (240px) | Full topbar | Inline panel (360px, shrinks content) | Flexible width |

## Sources

- Codebase analysis: `SlopcastPage.tsx`, `PageHeader.tsx`, `DesignEconomicsView.tsx`, `theme.css`, `package.json`
- Architecture patterns: App Shell (Google PWA), Inspector Panel (Apple/Figma), Glass-morphism (Apple)
- npm versions verified: Tailwind v4.2.1, Radix v1.1.x, TanStack Table v8.21.3, motion v12.35.0
- Confidence: HIGH for layout patterns and library choices. MEDIUM for glass-morphism performance.

---

*Architecture research: 2026-03-06*
