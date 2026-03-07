# Feature Landscape

**Domain:** Data-heavy SaaS workspace UI (oil & gas economics modeling)
**Researched:** 2026-03-06 (updated with stack verification)
**Confidence:** MEDIUM (training data only -- web search unavailable; patterns based on direct knowledge of Linear, Stripe, Databricks, Apple apps)

## Reference Products Studied

| Product | Relevance | What to Learn |
|---------|-----------|---------------|
| **Databricks** | Data-heavy workspace with sidebar nav | Navigation patterns, workspace switching, notebook-style layout |
| **Linear** | Keyboard-first, snappy SaaS | Command palette, keyboard nav, view switching, minimal chrome |
| **Stripe Dashboard** | Dense financial data, inline editing | Table patterns, detail panels, settings organization |
| **Apple (Finder/Settings)** | Inspector panels, clean hierarchy | Source list + detail, section cards, typography hierarchy |
| **Figma** | Canvas-based with layered UI panels | Floating panels over canvas, toolbar patterns |
| **Notion** | Sidebar + content area with inline editing | Sidebar tree nav, inline property editing, slash commands |

---

## Table Stakes

Features users expect from any modern SaaS workspace. Missing = product feels unfinished or dated.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Working utility CSS (Tailwind)** | The codebase has 50+ components referencing Tailwind utility classes that are not compiled. This is broken styling. | Low | Install Tailwind v4 + wire up @theme with existing CSS custom properties. Many "visual bugs" may self-resolve. |
| **Persistent sidebar navigation** | Every modern workspace app (Linear, Databricks, Notion, Figma) uses a collapsible sidebar. Tab bars across the top feel like 2015. Users expect to always see where they are. | Medium | Replace current WELLS/ECONOMICS tab switcher with a sidebar. Collapsible to icons on smaller screens. |
| **Consistent spacing and alignment** | Stripe and Linear set the bar: 4px/8px grid, consistent padding, aligned labels. Inconsistent spacing is the #1 signal of "not polished." | Low | Audit all padding/margin values. Establish spacing tokens (4, 8, 12, 16, 24, 32, 48). |
| **Typography hierarchy** | Users scan, not read. Need clear H1/H2/body/caption/label tiers. Apple excels at this. | Low | Define 5-6 type scale levels. Current mix of arbitrary `text-[11px]` etc. needs standardizing. |
| **Unified card/panel styling with glassmorphism** | One card style for outer containers, one for nested content. Inconsistent card styles break visual rhythm. | Low | Audit and enforce. Ensure backdrop-blur and transparency work with canvas backgrounds. |
| **Breadcrumb / location awareness** | User must always know: What page am I on? What group am I editing? What section is active? | Low | Add section breadcrumb or active-section indicator in sidebar. |
| **Responsive layout (desktop + mobile)** | Already exists but must not regress. Mobile should collapse sidebar to bottom tab bar or hamburger. | Medium | Preserve existing `viewportLayout` / `mobilePanel` patterns. Sidebar becomes drawer on mobile. |
| **Loading and empty states** | Every data panel needs: loading skeleton, empty state with CTA, error state. | Medium | Add skeleton components for KPI grid, charts, tables. |
| **Hover and focus states on all interactive elements** | Buttons, table rows, sidebar items, inputs all need visible hover/focus feedback. | Low | Audit all interactive elements for consistent `:hover` and `:focus-visible` styles. |
| **Settings/preferences accessible from sidebar** | Theme switcher, engine toggle should be in a settings section, not scattered in the header. | Low | Move theme/engine/mode controls to sidebar settings section. |

---

## Differentiators

Features that set the product apart. Not expected, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated background themes visible through UI** | This IS Slopcast's brand identity. No competitor has immersive canvas backgrounds as a core feature. | Medium | Use `backdrop-blur` + semi-transparent backgrounds on cards. Test against all 9+ themes. |
| **Command palette (Cmd+K)** | Linear popularized this. Jump to any group, section, or action by typing. | Medium | `useKeyboardShortcuts` hook already exists. Use cmdk library. |
| **Inline assumption editing** | Edit type curve / CAPEX / OPEX where you see the data, not in a separate panel. Apple's inspector pattern. | High | Refactor to inline-editable fields within the economics view cards. Click a KPI to edit its driver. |
| **Contextual detail panel (inspector)** | Select a well group and a right-side panel shows all its details. Apple Finder's inspector, Figma's right panel. | High | Would replace current accordion-based Controls panel. |
| **Smooth transitions between views** | Linear and Stripe use subtle slide/fade transitions when switching views. | Low | motion library for layout animations and AnimatePresence for exit transitions. |
| **Data tables with sorting, filtering, column resize** | TanStack Table for wells list, cash flow, and deals table. Headless = full styling control. | Medium | Replaces current custom table implementations with consistent, accessible tables. |
| **Keyboard-first navigation** | Tab through sidebar items, arrow keys in tables, Escape to close panels. | Medium | Radix primitives handle keyboard interaction by default. |
| **Glassmorphism design system** | Frosted glass panels over animated backgrounds. macOS Sonoma / iOS aesthetic. | Medium | Requires careful `backdrop-filter: blur()` tuning per theme. Performance-sensitive. |
| **Drag-to-reorder sidebar items** | Drag well groups to reorder priority. Small touch but signals polish. | Low | Use native drag events. Only for sidebar group list. |
| **Snapshot/version indicator** | Show "last saved 2 min ago." `snapshotHistory` already exists in the codebase. | Low | Already has data. Add a small indicator. |

---

## Anti-Features

Features to explicitly NOT build during this UI revamp.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Multi-level nested navigation** | Slopcast has ~4 sections. Deep nav trees add complexity without value at this scale. | Flat sidebar: Wells, Economics, Analysis, Settings. No nesting deeper than one level. |
| **Floating toolbar / ribbon** | Too much chrome, fights with the canvas background aesthetic. | Contextual actions in section header or inline. |
| **Dashboard customization / widget grid** | Draggable tiles are over-engineering for a focused economics tool. | Fixed, well-designed layout. |
| **Dark/light mode toggle** | The app is inherently dark (animated backgrounds). Light mode would require rewriting all themes. | Keep dark-only. Themes provide variety. |
| **Notification center / bell icon** | Single-user modeling tool, not a collaboration platform. | Toast notifications (sonner) for in-session feedback only. |
| **Tabs within tabs** | Current WELLS/ECONOMICS tabs plus sub-tabs creates confusing nesting. | Sidebar for primary nav. Single content area with sections. |
| **Overly animated transitions** | Competing with the canvas background. | Keep transitions under 200ms. Reserve visual drama for backgrounds. |

---

## Feature Dependencies

```
Tailwind CSS v4 installation  -->  All visual features (makes existing classNames work)
  |
  +--> Glass token system  -->  Sidebar navigation (glass chrome)
  |                         --> Card components (glass panels)
  |                         --> Inspector panel (glass overlay)
  |
  +--> Radix UI primitives  -->  Inline editing (popovers, dialogs)
  |                          --> Dropdown menus
  |                          --> Tooltips
  |                          --> Accessible keyboard nav
  |
  +--> TanStack Table  -->  Well list table
  |                     --> Cash flow table
  |                     --> Deals table
  |
  +--> motion  -->  Sidebar transitions
               --> Panel animations
               --> View crossfade
```

**Critical path:** Tailwind installation --> Glass tokens --> Sidebar nav --> Content migration --> Inspector panel

**Independent tracks (after Tailwind):**
- Command palette (after sidebar exists)
- Loading/empty states (anytime)
- Keyboard navigation (anytime, extends existing hook)
- Data tables with TanStack (anytime)

---

## MVP Recommendation

### Phase 1: Foundation
Prioritize:
1. **Install Tailwind v4 + wire theme tokens** -- makes 50+ components' classNames actually work
2. **Glass token system** -- `--glass-sidebar`, `--glass-panel`, etc. in theme.css
3. **Persistent sidebar navigation** -- single biggest UX upgrade
4. **Spacing and typography audit** -- standardize with Tailwind scale

### Phase 2: Components + Polish
5. **Unified card/panel components** with glassmorphism
6. **Data tables** with TanStack Table (wells, cash flow, deals)
7. **Loading and empty states**
8. **Hover/focus states audit**
9. **Smooth view transitions** with motion
10. **Settings consolidated in sidebar**

### Phase 3: Differentiation
11. **Command palette (Cmd+K)** with cmdk
12. **Inspector panel** for inline assumption editing
13. **Keyboard-first navigation**

**Defer:**
- Drag-to-reorder: Nice but not impactful enough to prioritize
- Snapshot timeline: Already have the data; can surface later with low effort

---

## Sources

- Training data analysis of Databricks, Linear, Stripe Dashboard, Apple apps, Figma, Notion (MEDIUM confidence)
- Direct codebase analysis: 50+ TSX files using Tailwind utility classes without Tailwind installed (HIGH confidence)
- npm registry version verification for recommended libraries (HIGH confidence)
- PROJECT.md scope and constraints definition
