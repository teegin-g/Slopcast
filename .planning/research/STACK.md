# Technology Stack: UI Revamp

**Project:** Slopcast UI Revamp
**Researched:** 2026-03-06
**Mode:** Ecosystem (SaaS UI stack for data-heavy workspace)

## Current State Assessment

The codebase has a split personality. Components use two styling paths:

1. **`isClassic` path** -- uses `sc-panel`, `sc-panelTitlebar`, etc. defined in `theme.css` (2419 lines). These work.
2. **Modern path** -- references Tailwind utility classes (`px-4`, `bg-theme-surface1/70`, `backdrop-blur-md`, `rounded-panel`) that are **not compiled by any tool**. There is no Tailwind installed, no `tailwind.config`, no PostCSS config. These classes are dead code.

This means the "modern" design intent was never realized. The revamp must fix this foundational gap first.

## Recommended Stack

### Styling Foundation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.2.1 | Utility-first CSS framework | The codebase already uses Tailwind conventions in 50+ components. Installing Tailwind makes existing class names work instead of rewriting them. v4 uses CSS-native `@import "tailwindcss"` -- no PostCSS config needed, works with Vite out of the box. | HIGH |
| tailwind-merge | ^3.5.0 | Merge conflicting Tailwind classes | Essential for component composition -- when passing className props, prevents `p-4 p-2` conflicts | HIGH |
| clsx | ^2.1.1 | Conditional class joining | Lightweight, standard pattern for `clsx('base', { 'active': isActive })`. Already the community default. | HIGH |
| class-variance-authority (CVA) | ^0.7.1 | Component variant definitions | Defines button/card/input variants as typed objects. Pairs with Tailwind for consistent variant APIs across the design system. | HIGH |

**Tailwind v4 rationale:** v4 (released Jan 2025) eliminates `tailwind.config.js` entirely. Configuration moves into CSS with `@theme` blocks. This is ideal because the project already has a rich `theme.css` with CSS custom properties -- those can be mapped directly into Tailwind's theme via `@theme` directives. No config file, no PostCSS plugin, just `@import "tailwindcss"` in the CSS entry point. The existing `--bg-deep`, `--surface-1`, `--border` tokens can be exposed as `bg-deep`, `surface-1` etc. in Tailwind classes.

### Component Primitives

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Radix UI Primitives | ^1.1.x | Headless accessible components (Dialog, Popover, Dropdown, Tooltip, Tabs, Accordion) | Unstyled, composable, WAI-ARIA compliant. The standard for building custom-styled components in 2025/2026. Does NOT impose visual opinions -- critical since the app has custom glass/transparency aesthetics. | HIGH |

**Use individual packages, not `@radix-ui/themes`**. The Themes package imposes its own design system with opaque CSS -- incompatible with the custom theme.css approach. Install only what you need:

```
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-popover
@radix-ui/react-tooltip
@radix-ui/react-tabs
@radix-ui/react-accordion
@radix-ui/react-toggle-group
@radix-ui/react-scroll-area
@radix-ui/react-separator
@radix-ui/react-slot
```

**Why not shadcn/ui directly:** shadcn/ui is a code-generation tool that copies Radix + Tailwind component files into your project. It is excellent for greenfield apps. For Slopcast, the components need to integrate with the existing theme token system (`--surface-1`, `--border`, etc.) and the glass/transparency aesthetic. Copying shadcn components and then rewriting their styles defeats the purpose. Instead, use Radix primitives directly and style them with Tailwind + the existing theme tokens. You can reference shadcn/ui's source code as implementation patterns without adopting its CLI or conventions.

### Data Display

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @tanstack/react-table | ^8.21.3 | Headless table logic (sorting, filtering, grouping, column resizing) | The standard for data-heavy React apps. Headless = full control over rendering, which is necessary for glass-panel table rows and custom cell editors. Already used by Databricks, Linear, and most data SaaS products. | HIGH |
| @tanstack/react-virtual | ^3.13.21 | Virtualized scrolling for large lists/tables | Essential for well lists and cash flow tables that can have hundreds of rows. Renders only visible rows. Pairs naturally with react-table. | HIGH |

**Why not AG Grid / MUI DataGrid:** Both impose heavy visual opinions and are difficult to make transparent/glass-styled. AG Grid is 200KB+ gzipped. For a workspace that needs to show animated backgrounds through table surfaces, headless is the only viable approach.

### Animation and Transitions

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| motion (framer-motion) | ^12.35.0 | Layout animations, sidebar transitions, panel enter/exit | The dominant React animation library. `AnimatePresence` for exit animations, `layout` prop for sidebar collapse/expand, spring physics for polished feel. The package is now published as `motion` (formerly `framer-motion`). | HIGH |

**Scope discipline:** Use motion ONLY for:
- Sidebar expand/collapse transitions
- Panel mount/unmount animations
- Tab content crossfade
- Tooltip/popover enter/exit

Do NOT use it for: scroll-driven animations (use CSS), hover effects (use CSS transitions), the canvas backgrounds (already custom).

### Icons

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| lucide-react | ^0.577.0 | Icon library | Tree-shakeable, consistent 24x24 stroke icons, 1500+ icons. The standard pairing with Radix/Tailwind stacks. Each icon is an individual ESM import -- no bundle bloat. | HIGH |

### Utility Components

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| cmdk | ^1.1.1 | Command palette (Cmd+K) | Composable, accessible, unstyled command menu. Natural fit for navigating wells, groups, scenarios, and settings. Already mentioned in project keyboard shortcuts. | MEDIUM |
| vaul | ^1.1.2 | Mobile drawer component | Radix-compatible drawer for mobile sidebar. Handles touch gestures, snap points, and nested scrolling correctly -- very hard to build from scratch. | MEDIUM |
| sonner | ^2.0.7 | Toast notifications | Minimal, beautiful toasts. 3KB. Drop-in with zero config. Replaces any custom notification system. | MEDIUM |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **@radix-ui/themes** | Imposes its own design system. Conflicts with custom theme tokens and glass aesthetics. Use primitives instead. |
| **shadcn/ui CLI** | Code generation adds maintenance burden. The components it generates would need heavy modification for glass/transparency. Reference its patterns, don't install it. |
| **Chakra UI** | Runtime CSS-in-JS (Emotion). Heavier than Tailwind, harder to achieve glass effects, worse performance for data-heavy views. |
| **Material UI (MUI)** | Massive bundle, Google Material design opinions are wrong aesthetic for this app. DataGrid is expensive and opinionated. |
| **Ant Design** | Enterprise Chinese design system. Wrong aesthetic, massive bundle, difficult to customize deeply. |
| **Mantine** | Good library but overlaps with Radix primitives. Adding both creates confusion about which to use. Mantine's styling uses CSS modules which conflicts with Tailwind approach. |
| **styled-components / Emotion** | Runtime CSS-in-JS is a dead-end in 2025/2026. Tailwind utility classes are faster (zero runtime), more maintainable, and the codebase already uses the convention. |
| **CSS Modules** | Would require renaming every className reference. The codebase is already committed to utility classes. Adding CSS Modules creates a third styling approach. |
| **AG Grid** | 200KB+ gzipped, opaque styling, difficult to make transparent. Overkill for the table needs here. TanStack Table is sufficient and headless. |
| **Tailwind v3** | v4 is stable and superior for this project: no config file, CSS-native theme, better Vite integration. No reason to use v3. |

## Glass/Transparency Strategy

The core visual challenge: UI surfaces must be semi-transparent so animated canvas backgrounds show through.

**Approach:** Tailwind v4 + CSS custom properties + `backdrop-filter`.

```css
/* In theme.css, extend with glass tokens */
@theme {
  --color-surface-glass: rgb(var(--surface-1) / 0.7);
  --color-surface-glass-heavy: rgb(var(--surface-1) / 0.85);
}
```

```html
<!-- Glass panel component -->
<div class="bg-surface-glass backdrop-blur-md border border-white/10 rounded-xl shadow-lg">
  <!-- Content remains crisp, background is blurred -->
</div>
```

**Browser support:** `backdrop-filter` is supported in all modern browsers (Chrome 76+, Firefox 103+, Safari 9+). No polyfill needed.

**Performance note:** `backdrop-filter: blur()` can cause GPU compositing overhead when many layers stack. Limit blur to 2-3 simultaneous layers max. The sidebar, main content area, and floating panels is the practical limit.

## Tailwind v4 Integration with Existing Theme

The existing `theme.css` uses RGB channel format (`--bg-deep: 15 23 42`) specifically designed for Tailwind opacity modifiers. The migration path:

```css
/* src/styles/theme.css -- add at top */
@import "tailwindcss";

@theme {
  /* Map existing CSS custom properties to Tailwind theme */
  --color-bg-deep: rgb(var(--bg-deep));
  --color-surface-1: rgb(var(--surface-1));
  --color-surface-2: rgb(var(--surface-2));
  --color-border: rgb(var(--border));
  --color-theme-cyan: rgb(var(--cyan));
  --color-theme-magenta: rgb(var(--magenta));
  --color-theme-text: rgb(var(--text));
  --color-theme-muted: rgb(var(--muted));
  --color-theme-success: rgb(var(--success));
  --color-theme-warning: rgb(var(--warning));
  --color-theme-danger: rgb(var(--danger));
}
```

This makes `bg-surface-1`, `text-theme-cyan`, `border-border` available as Tailwind classes. Because the CSS custom properties change per `[data-theme]`, the Tailwind classes automatically adapt to theme changes -- zero JavaScript needed.

## Installation

```bash
# Styling foundation
npm install tailwindcss@^4.2.1 @tailwindcss/vite@^4.2.1
npm install tailwind-merge@^3.5.0 clsx@^2.1.1 class-variance-authority@^0.7.1

# Component primitives (install as needed)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-tabs \
  @radix-ui/react-accordion @radix-ui/react-scroll-area @radix-ui/react-slot \
  @radix-ui/react-separator @radix-ui/react-toggle-group

# Data display
npm install @tanstack/react-table@^8.21.3 @tanstack/react-virtual@^3.13.21

# Animation
npm install motion@^12.35.0

# Icons
npm install lucide-react@^0.577.0

# Utility components (install when needed)
npm install cmdk@^1.1.1 vaul@^1.1.2 sonner@^2.0.7
```

**Vite config addition:**
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // ...existing plugins
  ],
});
```

## Estimated Bundle Impact

| Package | Gzipped Size | Notes |
|---------|-------------|-------|
| Tailwind CSS | ~0KB runtime | Compiles to static CSS at build time |
| Radix primitives (10 packages) | ~15-25KB | Tree-shakeable, only ships used components |
| motion | ~18KB | Can use `motion/mini` (~5KB) for simple animations |
| TanStack Table | ~14KB | Headless, no styles |
| TanStack Virtual | ~3KB | Tiny |
| lucide-react (50 icons) | ~5KB | Per-icon tree shaking |
| cmdk + vaul + sonner | ~8KB | Combined |
| **Total new JS** | **~65-75KB gzipped** | Reasonable for the functionality gained |

The current app already bundles recharts (~45KB), d3 (~30KB), and mapbox-gl (~200KB). The new additions are modest in comparison.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Styling | Tailwind CSS v4 | Vanilla CSS (status quo) | Codebase already uses Tailwind conventions in 50+ files. Making them work is less effort than rewriting to a different pattern. |
| Styling | Tailwind CSS v4 | Tailwind v3 | v4 is stable, has better Vite integration (native plugin), and CSS-native `@theme` is perfect for existing custom property architecture. |
| Components | Radix Primitives | Headless UI | Headless UI has fewer components, less active development, and no equivalent to Radix's Scroll Area or Accordion. |
| Components | Radix Primitives | React Aria | More verbose API, Adobe design opinions leak through, steeper learning curve for the same result. |
| Tables | TanStack Table | Radix Table | Radix has no table primitive. TanStack is the only serious headless table for React. |
| Animation | motion | React Spring | React Spring has fragmented API (v9 rewrite), smaller community, and `AnimatePresence` (exit animations) has no equivalent. |
| Animation | motion | CSS only | CSS cannot do layout animations (sidebar collapse with content reflow) or exit animations without JS. |
| Icons | lucide-react | heroicons | Fewer icons, less consistent sizing. Lucide is the successor to Feather Icons with better React integration. |
| Icons | lucide-react | react-icons | Bundles ALL icons from every set. Massive import. Not tree-shakeable by default. |

## Sources

- npm registry: version numbers verified via `npm view [package] version` on 2026-03-06
- Tailwind CSS v4: CSS-native configuration via `@theme` blocks (verified in project documentation references in existing theme.css comments mentioning Tailwind opacity modifier syntax)
- Radix UI: Headless primitive approach (individual packages, not Themes)
- Codebase analysis: `src/styles/theme.css` (2419 lines), 50+ TSX files using Tailwind-style class names without Tailwind installed
- `backdrop-filter` browser support: baseline across all modern browsers since 2022

---

*Stack research: 2026-03-06*
