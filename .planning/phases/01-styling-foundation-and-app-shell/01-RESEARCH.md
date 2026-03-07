# Phase 1: Styling Foundation and App Shell - Research

**Researched:** 2026-03-06
**Domain:** Tailwind CSS v4, glassmorphism design system, sidebar navigation, responsive layout
**Confidence:** HIGH

## Summary

This phase replaces the Tailwind CDN play script (`<script src="https://cdn.tailwindcss.com">`) with a proper Tailwind CSS v4 build-time installation via `@tailwindcss/vite`, establishes a glassmorphism token system layered on top of the existing CSS custom properties, and builds a persistent sidebar navigation shell that replaces the current `PageHeader` tab navigation.

The existing codebase is well-prepared for this migration: all theme colors are already stored as space-separated R G B channels in `theme.css` (enabling Tailwind opacity modifiers), and the `isClassic` branching pattern is already established in every component for Mario theme divergence. The main risk is backdrop-filter performance over animated canvas backgrounds -- the CONTEXT.md already flags this for early spike testing.

**Primary recommendation:** Install `tailwindcss` + `@tailwindcss/vite` v4.2.1, wire CSS custom properties via `@theme` in a new entry CSS file, remove the CDN script from `index.html`, and build the sidebar as an adapter layer wrapping `useSlopcastWorkspace` state -- never refactor the god hook.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Content panels at ~60-70% opacity with backdrop-blur (heavily transparent) -- backgrounds are the star, UI floats on top
- Sidebar is nearly opaque (solid/dark) with subtle transparency at edges -- creates a strong anchor point, Databricks-style
- Medium blur intensity (16-20px) on content panels -- classic frosted glass, background becomes soft color washes
- Panels have subtle 1px border using theme accent color at low opacity, plus a faint outer glow
- Drop shadows tinted with theme accent color -- panels cast a warm/cool glow onto the background
- Hover states on interactive panels: brighten + subtle scale/shadow lift for tactile feel
- Subtle vignette gradient at viewport edges to frame the workspace
- Three main sections: Wells, Economics, Scenarios
- Well groups listed in sidebar as a collapsible tree below sections -- click a group to select it; sidebar is the primary navigation hub
- Collapsed state shows icons only with tooltips; well groups hidden until expanded
- Manual toggle button (chevron or hamburger) for collapse/expand on desktop, plus auto-collapse on narrow viewports
- Mobile: sidebar becomes overlay drawer
- Navigation via URL search params (preserves useSlopcastWorkspace state architecture)
- Compact/dense spacing (8-12px gaps), smaller padding -- finance/trading app density
- Light/thin headers (font-weight 300-400) with larger size; labels small and muted -- elegant
- Monospace/tabular numerals for financial values
- Keep isClassic branching for Mario theme -- Mario gets solid retro panels with pixel-art-inspired borders, no glass/blur
- All other themes share the unified glass system via CSS custom properties
- Sidebar has theme-adaptive accents -- structure is fixed, but active-section indicator, accent colors, and subtle tints adapt to each theme's palette
- Glass panels get a subtle color tint from each theme

### Claude's Discretion
- Inner/nested card treatment (glass layer vs semi-opaque surface)
- Font family choice (system stack vs Inter vs other)
- Exact blur radius within 16-20px range
- Icon set for sidebar sections
- Mario theme retro panel specifics (border style, color treatment)
- Exact vignette intensity

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STYLE-01 | Tailwind CSS v4 installed and wired with existing CSS custom properties via @theme | Tailwind v4 install via @tailwindcss/vite, @theme directive maps existing R G B channel vars |
| STYLE-02 | Spacing tokens standardized on 4/8/12/16/24/32/48px grid | Tailwind v4 default spacing scale covers this; compact density per user decision |
| STYLE-03 | Typography hierarchy defined with 5-6 levels using Tailwind utilities | @theme font-family registration + utility class conventions |
| STYLE-04 | Hover and focus-visible states on all interactive elements | Tailwind `hover:` and `focus-visible:` variants; glass hover-lift pattern |
| STYLE-05 | Glassmorphism token system (--glass-sidebar, --glass-panel, --glass-card) | New CSS custom properties + Tailwind @theme registration |
| STYLE-06 | Animated canvas backgrounds visible through glass UI shell | backdrop-filter compositing; canvas z-index layering; performance constraints |
| NAV-01 | Persistent collapsible sidebar replaces tab-based view switching | New Sidebar component wrapping useSlopcastWorkspace; replaces PageHeader tabs |
| NAV-02 | Active-section indicator visually shows current location | Sidebar active state styling via URL search params |
| NAV-03 | Sidebar collapses to icon-only on narrow viewports | useViewportLayout existing hook; CSS grid/flex transition |
| NAV-04 | URL state synced with sidebar navigation | URLSearchParams read/write in sidebar adapter |
| COMP-01 | Unified outer card component with glass styling | GlassPanel component with isClassic branching |
| COMP-02 | Unified inner card component for nested content tiles | GlassCard component (inner variant) |
| RESP-01 | Desktop layout renders sidebar + content area | CSS grid: sidebar (fixed) + content (fluid) |
| RESP-02 | Mobile layout collapses sidebar to drawer | Overlay drawer triggered at mobile breakpoint |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.2.1 | Utility-first CSS framework | Requirement STYLE-01; replaces CDN play script |
| @tailwindcss/vite | 4.2.1 | Vite plugin for Tailwind v4 | Zero-config Vite integration; replaces postcss |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-router-dom | 7.13.0 (existing) | URL search params for nav state | NAV-04: useSearchParams hook |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tailwindcss/vite | @tailwindcss/postcss | PostCSS plugin is the fallback if Vite plugin has issues; Vite plugin is simpler |
| lucide-react (icons) | heroicons, inline SVG | Lucide is tree-shakeable, consistent style; could also use inline SVGs to avoid dependency |

**Installation:**
```bash
npm install tailwindcss @tailwindcss/vite
```

## Architecture Patterns

### Tailwind v4 Migration Pattern

**Critical change from v3:** Tailwind v4 does NOT use `tailwind.config.js`. All configuration lives in CSS via `@theme` and `@import`.

**Entry CSS file** (`src/app.css` or similar):
```css
@import "tailwindcss";

@theme {
  /* Map existing CSS custom properties to Tailwind utilities */
  --color-theme-bg: var(--bg-deep);
  --color-theme-space: var(--bg-space);
  --color-theme-surface1: var(--surface-1);
  --color-theme-surface2: var(--surface-2);
  --color-theme-border: var(--border);
  --color-theme-cyan: var(--cyan);
  --color-theme-magenta: var(--magenta);
  --color-theme-violet: var(--violet);
  --color-theme-purple: var(--purple);
  --color-theme-lavender: var(--lav);
  --color-theme-text: var(--text);
  --color-theme-muted: var(--muted);
  --color-theme-success: var(--success);
  --color-theme-warning: var(--warning);
  --color-theme-danger: var(--danger);

  --shadow-glow-cyan: var(--shadow-glow-cyan);
  --shadow-glow-magenta: var(--shadow-glow-magenta);
  --shadow-card: var(--shadow-card);

  --radius-panel: var(--radius-panel);
  --radius-inner: calc(var(--radius-panel) - 6px);

  --font-brand: var(--font-brand), sans-serif;
  --font-script: "Permanent Marker", cursive;
}
```

**IMPORTANT Tailwind v4 color change:** In v4, custom colors defined via `--color-*` in `@theme` use the CSS variable directly. For opacity modifier support with R G B channel format, use `@theme inline` or define colors as `rgb(var(--channel-var) / <alpha-value>)` in the theme. The existing R G B channel format in theme.css is compatible -- the `@theme` mapping must wrap them:

```css
@theme {
  --color-theme-bg: rgb(var(--bg-deep));
  /* ...etc */
}
```

But this loses opacity modifier support. To keep `bg-theme-bg/60` working, the recommended approach for Tailwind v4 is to define colors using `oklch` or keep using the inline `<alpha-value>` pattern. Since the codebase already uses R G B channels extensively, the cleanest path is:

```css
@theme inline {
  --color-theme-bg: rgb(var(--bg-deep) / <alpha-value>);
  --color-theme-surface1: rgb(var(--surface-1) / <alpha-value>);
  /* etc */
}
```

**Confidence: MEDIUM** -- Tailwind v4 @theme syntax with CSS variable indirection for opacity modifiers needs spike validation. The `@theme inline` variant prevents Tailwind from generating `--color-*` variables and instead inlines the value, which may be needed for dynamic theme switching via `data-theme` attribute.

**Vite config update:**
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react(), debugLoggerPlugin()],
  // ... rest unchanged
});
```

**index.html cleanup:**
- Remove `<script src="https://cdn.tailwindcss.com">` and the inline `tailwind.config` block
- Keep Google Fonts link (or move to CSS @import)
- The `<link>` to theme.css can stay as Vite will bundle via the `import './styles/theme.css'` in index.tsx

### Recommended Project Structure
```
src/
  app.css                    # NEW: Tailwind entry (@import "tailwindcss" + @theme)
  styles/
    theme.css                # EXISTING: CSS custom properties (R G B channels per theme)
    glass.css                # NEW: Glassmorphism token system + utility classes
  components/
    layout/
      AppShell.tsx           # NEW: Sidebar + content area grid layout
      Sidebar.tsx            # NEW: Collapsible sidebar with nav + well group tree
      SidebarNav.tsx         # NEW: Section navigation items
      SidebarGroupTree.tsx   # NEW: Collapsible well group list
      MobileDrawer.tsx       # NEW: Mobile overlay drawer wrapper
    ui/
      GlassPanel.tsx         # NEW: Outer card with glass styling (COMP-01)
      GlassCard.tsx          # NEW: Inner card for nested tiles (COMP-02)
      Vignette.tsx           # NEW: Viewport edge vignette overlay
  hooks/
    useSidebarNav.ts         # NEW: URL search param adapter for sidebar state
```

### Pattern 1: Glassmorphism Token System
**What:** CSS custom properties defining glass surface treatments, registered with Tailwind via @theme
**When to use:** Every panel, card, and surface in the workspace (except Mario theme)

Glass tokens to define in `glass.css`:
```css
:root {
  /* Sidebar: nearly opaque */
  --glass-sidebar-bg: rgba(var(--bg-deep), 0.92);
  --glass-sidebar-blur: 12px;
  --glass-sidebar-border: rgba(var(--cyan), 0.12);

  /* Content panels: 60-70% opacity, the star is the background */
  --glass-panel-bg: rgba(var(--surface-1), 0.35);
  --glass-panel-blur: 18px;
  --glass-panel-border: rgba(var(--cyan), 0.10);
  --glass-panel-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 12px rgba(var(--cyan), 0.05);

  /* Inner cards: subtler */
  --glass-card-bg: rgba(var(--surface-2), 0.25);
  --glass-card-blur: 8px;
  --glass-card-border: rgba(var(--border), 0.15);
}
```

Each theme overrides these in its `[data-theme='X']` block with theme-tinted values.

### Pattern 2: Sidebar as Adapter Layer
**What:** Sidebar reads/writes URL search params to drive navigation, delegates to useSlopcastWorkspace
**When to use:** All workspace navigation

```typescript
// useSidebarNav.ts
import { useSearchParams } from 'react-router-dom';

type Section = 'wells' | 'economics' | 'scenarios';

export function useSidebarNav() {
  const [searchParams, setSearchParams] = useSearchParams();

  const section = (searchParams.get('section') as Section) || 'wells';

  const setSection = (s: Section) => {
    setSearchParams(prev => {
      prev.set('section', s);
      return prev;
    }, { replace: true });
  };

  return { section, setSection };
}
```

The `AppShell` component reads `section` and renders the appropriate view from `useSlopcastWorkspace`. The god hook's `viewMode` and `designWorkspace` state are bridged to URL params -- NOT refactored.

### Pattern 3: Canvas Background Z-Index Layering
**What:** Animated backgrounds render behind the glass UI shell via fixed positioning and z-index stacking
**When to use:** Always -- this is the core visual architecture

```
z-0:  Canvas background (position: fixed, inset: 0)
z-10: Vignette overlay (position: fixed, pointer-events: none)
z-20: Content area (position: relative, glass panels)
z-30: Sidebar (position: fixed or sticky)
z-40: Mobile drawer overlay
z-50: Modals, tooltips
```

### Anti-Patterns to Avoid
- **Refactoring useSlopcastWorkspace:** The god hook is ~900 lines. Build adapter layers on top, never reorganize it during this phase.
- **backdrop-filter on large surfaces:** Use semi-transparent solids for sidebar body; reserve backdrop-blur for content panels and headers only. Layering many backdrop-filters kills frame rate on canvas animations.
- **Theme-specific component variants:** Do NOT create per-theme component files. Use CSS custom properties to vary appearance; only `isClassic` needs code branching (Mario vs. glass).
- **Removing CDN before Tailwind v4 is fully wired:** The CDN script generates ALL existing utility classes. Remove it only after the build-time Tailwind is verified to produce identical output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS utility framework | Custom utility classes | Tailwind v4 via @tailwindcss/vite | 1000+ utilities already used throughout codebase |
| Responsive breakpoints | Media query helpers | Tailwind responsive prefixes + useViewportLayout | Already have breakpoint hook, Tailwind adds `sm:`, `md:`, `lg:` |
| Focus management | Custom focus ring CSS | Tailwind `focus-visible:` + `outline-*` utilities | Consistent, accessible, built-in |
| Tooltip component | Custom tooltip | Title attribute initially, or @radix-ui/react-tooltip if needed | Sidebar collapsed icons need tooltips -- start simple |
| URL search param sync | Custom URL parser | react-router-dom useSearchParams | Already in dependency tree, handles encoding/history |

**Key insight:** The codebase already uses Tailwind classes extensively via the CDN. The migration to build-time Tailwind v4 must preserve every existing utility class usage. Spike test by running `npm run build` and visually comparing output.

## Common Pitfalls

### Pitfall 1: Tailwind v4 Migration Breaks Existing Classes
**What goes wrong:** Tailwind v4 has breaking changes from v3 CDN. Some utility names changed (e.g., `shadow-sm` semantics, color naming). The CDN was running v3 syntax.
**Why it happens:** CDN script was Tailwind v3. Build-time install is v4. Class names like `bg-theme-surface1/70` use v3 opacity modifier syntax that v4 handles differently with custom colors.
**How to avoid:**
1. Install Tailwind v4 alongside CDN first (both active)
2. Verify pages render identically
3. Remove CDN only after visual verification
4. Run `npm run build` + `npm run typecheck` after migration
**Warning signs:** Missing backgrounds, wrong colors, broken opacity, layout shifts.

### Pitfall 2: backdrop-filter Performance on Canvas
**What goes wrong:** Multiple overlapping backdrop-blur panels over an animated canvas cause frame drops below 30fps.
**Why it happens:** Each backdrop-filter layer forces the browser to re-render the underlying content for compositing. Canvas repaints every frame.
**How to avoid:**
1. Spike test early: one glass panel over canvas, measure FPS
2. Limit backdrop-blur panels to 3-4 maximum visible at once
3. Use smaller blur radius on non-critical elements (8px vs 18px)
4. Sidebar uses semi-transparent solid (no blur on body, optional blur on header only)
5. Consider `will-change: transform` on glass panels to promote to compositor layer
**Warning signs:** CPU usage above 30% idle, visible jank on theme transitions.

### Pitfall 3: Theme Switching Flashes
**What goes wrong:** Switching themes causes a flash of incorrect glass tint or opacity because CSS custom properties update asynchronously.
**Why it happens:** Glass tokens reference theme tokens via `var()`. When `data-theme` attribute changes, all properties recalculate but painting may lag.
**How to avoid:** Use `theme-transition` class (already exists, sets `transition: all 300ms ease`) on glass panels. Ensure glass token values use only CSS variables, not hardcoded values.
**Warning signs:** Flash of white/black on theme switch, jarring color pops.

### Pitfall 4: Sidebar Width Transition Jank
**What goes wrong:** Expanding/collapsing sidebar causes layout reflow that stutters.
**Why it happens:** CSS grid column resize triggers reflow of all content children.
**How to avoid:** Use `transition: width` on sidebar, `overflow: hidden` during transition, and `will-change: width` if needed. Or use CSS `grid-template-columns` animation.
**Warning signs:** Content area text reflowing during sidebar toggle.

### Pitfall 5: URL Search Param Loops
**What goes wrong:** Setting URL params triggers re-render, which re-reads params, which triggers state update, causing infinite loop.
**Why it happens:** `useSearchParams` returns a new object on every call if params change. Naive `useEffect` on params creates a loop.
**How to avoid:** Use `replace: true` option when setting params (no history entry). Compare param values as strings before updating state. Memoize derived state.
**Warning signs:** Browser becoming unresponsive, rapidly changing URL.

## Code Examples

### Tailwind v4 Entry CSS
```css
/* src/app.css */
@import "tailwindcss";
@import "./styles/theme.css";
@import "./styles/glass.css";

/* @theme registers CSS variable-backed colors for Tailwind utilities.
   Using @theme inline to prevent Tailwind from generating its own
   --color-* variables (we need dynamic theme switching via data-theme). */
@theme inline {
  --color-theme-bg: rgb(var(--bg-deep) / <alpha-value>);
  --color-theme-space: rgb(var(--bg-space) / <alpha-value>);
  --color-theme-surface1: rgb(var(--surface-1) / <alpha-value>);
  --color-theme-surface2: rgb(var(--surface-2) / <alpha-value>);
  --color-theme-border: rgb(var(--border) / <alpha-value>);
  --color-theme-cyan: rgb(var(--cyan) / <alpha-value>);
  --color-theme-magenta: rgb(var(--magenta) / <alpha-value>);
  --color-theme-violet: rgb(var(--violet) / <alpha-value>);
  --color-theme-purple: rgb(var(--purple) / <alpha-value>);
  --color-theme-lavender: rgb(var(--lav) / <alpha-value>);
  --color-theme-text: rgb(var(--text) / <alpha-value>);
  --color-theme-muted: rgb(var(--muted) / <alpha-value>);
  --color-theme-success: rgb(var(--success) / <alpha-value>);
  --color-theme-warning: rgb(var(--warning) / <alpha-value>);
  --color-theme-danger: rgb(var(--danger) / <alpha-value>);

  --shadow-glow-cyan: var(--shadow-glow-cyan);
  --shadow-glow-magenta: var(--shadow-glow-magenta);
  --shadow-card: var(--shadow-card);

  --radius-panel: var(--radius-panel);
  --radius-inner: calc(var(--radius-panel) - 6px);

  --font-brand: var(--font-brand), sans-serif;
  --font-script: "Permanent Marker", cursive;
}
```

**Confidence: MEDIUM** -- The `@theme inline` directive and how it handles `<alpha-value>` with CSS variable indirection for dynamic themes needs spike validation. If `@theme inline` doesn't support the `<alpha-value>` placeholder, an alternative is to define a custom `@utility` or use `@property` registration.

### Glass Panel Component
```typescript
// src/components/ui/GlassPanel.tsx
interface GlassPanelProps {
  isClassic: boolean;
  children: React.ReactNode;
  className?: string;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ isClassic, children, className = '' }) => {
  if (isClassic) {
    return (
      <div className={`sc-panel theme-transition ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-panel border theme-transition
        bg-[var(--glass-panel-bg)]
        backdrop-blur-[var(--glass-panel-blur)]
        border-[var(--glass-panel-border)]
        shadow-[var(--glass-panel-shadow)]
        hover:brightness-110 hover:scale-[1.005] hover:shadow-lg
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
};
```

### Sidebar Layout Shell
```typescript
// Conceptual structure for AppShell.tsx
<div className="flex h-screen overflow-hidden">
  {/* Animated background - fixed behind everything */}
  <div className="fixed inset-0 z-0">
    {BackgroundComponent && <BackgroundComponent />}
  </div>

  {/* Vignette overlay */}
  <div className="fixed inset-0 z-10 pointer-events-none vignette" />

  {/* Sidebar - fixed left */}
  <aside className={`
    relative z-30 flex-shrink-0 h-screen overflow-y-auto
    transition-[width] duration-300 ease-in-out
    ${collapsed ? 'w-16' : 'w-64'}
    bg-[var(--glass-sidebar-bg)]
    border-r border-[var(--glass-sidebar-border)]
  `}>
    <Sidebar />
  </aside>

  {/* Content area */}
  <main className="relative z-20 flex-1 overflow-y-auto p-3">
    {/* Glass panels rendered here */}
  </main>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind CDN play script | Build-time @tailwindcss/vite | Tailwind v4 (Jan 2025) | CDN not suitable for production; v4 has no config file |
| tailwind.config.js | @theme in CSS | Tailwind v4 | All config in CSS; no JS config file |
| postcss + autoprefixer pipeline | @tailwindcss/vite Vite plugin | Tailwind v4 | Simpler; no postcss.config needed |
| Tab-based nav in header | Sidebar navigation | This phase | More real estate, persistent nav, well group tree |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Not used in v4. Replaced by `@theme` in CSS.
- `@tailwind base/components/utilities`: Replaced by `@import "tailwindcss"` in v4.
- CDN play script: Development-only tool. Not suitable for production builds.

## Open Questions

1. **@theme inline + alpha-value + CSS variable indirection**
   - What we know: Tailwind v4 uses `@theme` to register custom values. Existing colors are R G B channels in CSS vars.
   - What's unclear: Whether `@theme inline { --color-x: rgb(var(--channel) / <alpha-value>); }` works with dynamic `data-theme` attribute switching.
   - Recommendation: Spike test this FIRST before any other work. If it fails, fallback options are: (a) use `@utility` to define custom classes, (b) keep existing CDN approach for colors and use Tailwind v4 only for non-color utilities, (c) restructure color vars to oklch format.

2. **backdrop-filter FPS budget**
   - What we know: STATE.md flags this as a blocker concern. Research recommends 3-4 panels max with small blur.
   - What's unclear: Actual FPS impact varies by device. Desktop Chrome vs Safari vs mobile.
   - Recommendation: Include FPS measurement in spike test. Target: 45fps minimum on mid-range laptop with Synthwave theme (most expensive animation).

3. **Font loading strategy**
   - What we know: Google Fonts loaded via `<link>` in index.html (Inter, Orbitron, Permanent Marker, Press Start 2P). Claude's discretion on font family choice.
   - What's unclear: Whether to keep Google Fonts CDN or bundle via npm packages.
   - Recommendation: Keep Google Fonts `<link>` for now. Use Inter as the primary font (already loaded, clean and professional). Monospace: system `ui-monospace` stack for financial values.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom |
| Config file | vitest.config.ts (exists) |
| Quick run command | `npm test` |
| Full suite command | `npm test && npm run typecheck && npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STYLE-01 | Tailwind v4 installed, build succeeds | smoke | `npm run build` | N/A (build check) |
| STYLE-02 | Spacing tokens in Tailwind config | manual | Visual inspection | N/A |
| STYLE-03 | Typography hierarchy renders | manual | Visual inspection | N/A |
| STYLE-04 | Hover/focus-visible states | manual | `npm run ui:verify` | Playwright exists |
| STYLE-05 | Glass tokens defined and applied | unit | `vitest run src/components/ui/GlassPanel.test.tsx -x` | Wave 0 |
| STYLE-06 | Canvas backgrounds visible through glass | manual | `npm run ui:shots` | Playwright exists |
| NAV-01 | Sidebar renders with 3 sections | unit | `vitest run src/components/layout/Sidebar.test.tsx -x` | Wave 0 |
| NAV-02 | Active section indicator | unit | `vitest run src/components/layout/Sidebar.test.tsx -x` | Wave 0 |
| NAV-03 | Sidebar collapses on narrow viewport | unit | `vitest run src/components/layout/Sidebar.test.tsx -x` | Wave 0 |
| NAV-04 | URL syncs with sidebar navigation | unit | `vitest run src/hooks/useSidebarNav.test.ts -x` | Wave 0 |
| COMP-01 | GlassPanel renders with isClassic branching | unit | `vitest run src/components/ui/GlassPanel.test.tsx -x` | Wave 0 |
| COMP-02 | GlassCard renders for nested tiles | unit | `vitest run src/components/ui/GlassCard.test.tsx -x` | Wave 0 |
| RESP-01 | Desktop layout: sidebar + content | integration | `npm run ui:shots` | Playwright exists |
| RESP-02 | Mobile layout: drawer | integration | `npm run ui:shots` | Playwright exists |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run typecheck && npm run build && npm run ui:audit`
- **Phase gate:** Full suite green + visual comparison across Slate, Mario, Synthwave themes

### Wave 0 Gaps
- [ ] `src/components/ui/GlassPanel.test.tsx` -- covers STYLE-05, COMP-01
- [ ] `src/components/ui/GlassCard.test.tsx` -- covers COMP-02
- [ ] `src/components/layout/Sidebar.test.tsx` -- covers NAV-01, NAV-02, NAV-03
- [ ] `src/hooks/useSidebarNav.test.ts` -- covers NAV-04
- [ ] Test utilities: wrapper with ThemeProvider + BrowserRouter for component tests

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `index.html` (Tailwind CDN + config), `theme.css` (R G B channels), `themes.ts` (7 themes), `SlopcastPage.tsx` (current layout), `useSlopcastWorkspace.ts` (god hook)
- npm registry: tailwindcss@4.2.1, @tailwindcss/vite@4.2.1 (verified via `npm view`)

### Secondary (MEDIUM confidence)
- Tailwind v4 documentation (from training data, Jan-May 2025): @theme directive, @import "tailwindcss", @tailwindcss/vite plugin, removal of config file
- Tailwind v4 @theme inline variant for preventing CSS variable generation

### Tertiary (LOW confidence)
- Exact `@theme inline` behavior with `<alpha-value>` placeholder and CSS variable indirection -- needs spike validation
- backdrop-filter FPS impact numbers (device-dependent, needs measurement)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- packages verified on npm, v4 is stable
- Architecture: HIGH -- codebase thoroughly inspected, patterns match existing conventions
- Tailwind v4 @theme syntax: MEDIUM -- v4 is in training data but exact CSS variable + alpha-value behavior needs spike
- Pitfalls: HIGH -- backdrop-filter performance is well-documented concern, already flagged in STATE.md
- Glass design system: HIGH -- user decisions are specific and detailed

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable domain, Tailwind v4 is GA)
