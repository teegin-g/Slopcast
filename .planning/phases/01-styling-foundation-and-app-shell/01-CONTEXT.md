# Phase 1: Styling Foundation and App Shell - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Tailwind v4, establish glassmorphism token system, build persistent sidebar navigation with responsive layout. Animated canvas backgrounds must remain visible and prominent through the glass UI shell across all 6 themes. This phase delivers the structural shell and styling infrastructure — content migration and inline editing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Glass surface treatment
- Content panels at ~60-70% opacity with backdrop-blur (heavily transparent) — backgrounds are the star, UI floats on top
- Sidebar is nearly opaque (solid/dark) with subtle transparency at edges — creates a strong anchor point, Databricks-style
- Medium blur intensity (16-20px) on content panels — classic frosted glass, background becomes soft color washes
- Panels have subtle 1px border using theme accent color at low opacity, plus a faint outer glow
- Drop shadows tinted with theme accent color — panels cast a warm/cool glow onto the background
- Hover states on interactive panels: brighten + subtle scale/shadow lift for tactile feel
- Subtle vignette gradient at viewport edges to frame the workspace
- Inner/nested cards treatment: Claude's discretion (pick what works best per component)

### Sidebar layout & behavior
- Three main sections: Wells, Economics, Scenarios
- Well groups listed in sidebar as a collapsible tree below sections — click a group to select it; sidebar is the primary navigation hub
- Collapsed state shows icons only with tooltips; well groups hidden until expanded
- Manual toggle button (chevron or hamburger) for collapse/expand on desktop, plus auto-collapse on narrow viewports
- Mobile: sidebar becomes overlay drawer
- Navigation via URL search params (already decided — preserves useSlopcastWorkspace state architecture)

### Spacing & typography
- Compact/dense spacing (8-12px gaps), smaller padding — finance/trading app density for data-heavy economics modeling
- Light/thin headers (font-weight 300-400) with larger size; labels small and muted — elegant, lets glass and colors do the talking
- Monospace/tabular numerals for financial values (NPV, IRR, cash flow amounts) so columns align
- Font family: Claude's discretion

### Theme compatibility
- Keep isClassic branching for Mario theme — Mario gets solid retro panels with pixel-art-inspired borders, no glass/blur
- All other themes share the unified glass system via CSS custom properties
- Sidebar has theme-adaptive accents — structure is fixed, but active-section indicator, accent colors, and subtle tints adapt to each theme's palette
- Glass panels get a subtle color tint from each theme (cool blue for Slate, warm pink for Synthwave, green for Tropical, etc.) — background bleeds through with theme character

### Claude's Discretion
- Inner/nested card treatment (glass layer vs semi-opaque surface)
- Font family choice (system stack vs Inter vs other)
- Exact blur radius within 16-20px range
- Icon set for sidebar sections
- Mario theme retro panel specifics (border style, color treatment)
- Exact vignette intensity

</decisions>

<specifics>
## Specific Ideas

- Sidebar feel should be Databricks-style — solid anchor with the floating glass content area
- Glass panels should feel like frosted glass over a living wallpaper
- Finance/trading app density — not a marketing site, this is a working tool
- Typography should be elegant and recede — let the data and themes be the visual identity
- Mario theme should lean into retro, not try to be modern with warm glass

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/styles/theme.css`: CSS custom properties with R G B channel format — ready for Tailwind opacity modifiers
- `src/theme/ThemeProvider.tsx` + `themes.ts`: Full theme system with `useTheme()` hook
- `src/components/slopcast/hooks/useViewportLayout.ts`: Existing viewport breakpoint detection
- `isClassic` branching pattern: Already exists in components for Mario vs modern themes
- `DesignWorkspaceTabs.tsx`: Current tab switcher to be replaced by sidebar
- 6 animated background components (Hyperborea, Mario, Moonlight, StormDusk, Synthwave, Tropical)

### Established Patterns
- CSS custom properties for all theme colors (`bg-theme-surface1`, `text-theme-cyan`, `border-theme-border`)
- `rounded-panel` / `rounded-inner` custom CSS classes enforced by `ui-audit.mjs`
- Provider nesting: StrictMode > ThemeProvider > BrowserRouter > AuthProvider
- `@/*` path alias available but relative imports more common
- No ESLint/Prettier — formatting by convention

### Integration Points
- `SlopcastPage.tsx` is the workspace entry point — sidebar and shell wrap this
- `useSlopcastWorkspace.ts` (~900 lines) is the god hook — sidebar navigation builds adapter layer on top, does NOT refactor it
- `DesignWellsView.tsx` and `DesignEconomicsView.tsx` become content panels within the new shell
- URL search params drive navigation (already decided in research)
- `PageHeader.tsx` contains theme/engine controls that may relocate

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-styling-foundation-and-app-shell*
*Context gathered: 2026-03-06*
