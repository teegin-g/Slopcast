# Layout Architecture Audit

## Comprehensive Spacing, Breakpoint, and Token Inventory

---

## 1. Padding Value Catalog

### Shell-Level Padding

| Location | File:Line | Value | Pixels | Context |
|----------|-----------|-------|--------|---------|
| Main content frame | `AppShell.tsx:182` | `p-3` | 12px | Wraps ALL page content |
| PageHeader horizontal | `PageHeader.tsx:262` | `px-3 md:px-6` | 12px / 24px | Header bar left/right |
| PageHeader vertical | `PageHeader.tsx:262` | `py-3` | 12px | Header bar top/bottom |
| Sidebar toggle row | `Sidebar.tsx:51` | `px-3 py-2` | 12px / 8px | Brand + collapse button |
| SidebarNav container | `SidebarNav.tsx:57` | `px-2 py-1` | 8px / 4px | Nav items wrapper |
| MobileDrawer panel | `MobileDrawer.tsx:49` | (none) | 0px | Drawer panel has no padding; children provide it |

### Page-Level Padding

| Location | File:Line | Value | Pixels | Context |
|----------|-----------|-------|--------|---------|
| HubPage main | `HubPage.tsx:161` | `p-4 md:p-6` | 16px / 24px | Hub page content frame |
| LandingPage hero | `LandingPage.tsx:118` | `px-4 md:px-8` | 16px / 32px | Landing page hero section |
| HubPage hero card | `HubPage.tsx:164` | `p-5 md:p-8` | 20px / 32px | Main hub hero panel |
| HubPage section cards | `HubPage.tsx:203` | `p-5 md:p-6` | 20px / 24px | App navigation card |
| HubPage sidebar cards | `HubPage.tsx:277` | `p-5 md:p-6` | 20px / 24px | Account dashboard |

### Component-Level Padding

| Location | File:Line | Value | Pixels | Context |
|----------|-----------|-------|--------|---------|
| KPI hero card | `KpiGrid.tsx:317` | `p-8` | 32px | Portfolio NPV main card |
| KPI strip tiles | `KpiGrid.tsx:162` | `px-4 py-3` | 16px / 12px | Secondary KPI tiles |
| Wells aside (non-classic) | `DesignWellsView.tsx:292` | `p-4` | 16px | Groups/filters column |
| Wells aside (classic) | `DesignWellsView.tsx:292` | `p-1` | 4px | Classic mode groups column |
| Filters panel (non-classic) | `DesignWellsView.tsx:139` | `p-4` | 16px | Outer filter card |
| Filters panel (classic) | `DesignWellsView.tsx:90` | `p-3` | 12px | Classic filter body |
| Chart panel (non-classic) | `DesignEconomicsView.tsx:276` | `p-1` | 4px | Charts wrapper — extremely tight |
| Chart panel (classic) | `DesignEconomicsView.tsx:275` | `p-3` | 12px | Classic charts wrapper |
| Collapsible body (Tax) | `DesignEconomicsView.tsx:413` | `p-3` | 12px | Tax controls inner |
| Collapsible body (Debt) | `DesignEconomicsView.tsx:455` | `p-3` | 12px | Debt controls inner |
| Collapsible body (Reserve) | `DesignEconomicsView.tsx:512` | `p-3` | 12px | Reserve select inner |
| Collapsible body (Advanced) | `DesignEconomicsView.tsx:548` | `p-4` | 16px | Wells table inner |
| Collapsible body (Insights) | `DesignEconomicsView.tsx:587` | `p-4` | 16px | Setup insights body |
| Collapsible titlebars | `DesignEconomicsView.tsx:392` | `px-4 py-2.5` | 16px / 10px | All collapsible headers |
| QuickDrivers titlebar | `DesignEconomicsView.tsx:127` | `px-4 py-2` | 16px / 8px | Drivers panel header |
| QuickDrivers body | `DesignEconomicsView.tsx:132` | `p-3` | 12px | Drivers panel content |
| Mobile action tray | `DesignWellsView.tsx:467` | `p-3` | 12px | Fixed bottom tray |
| Mobile sticky action | `DesignEconomicsView.tsx:752` | `px-4 py-3` | 16px / 12px | Economics bottom strip |
| Selection actions panel | `DesignWellsView.tsx:416` | `p-4` | 16px | Non-classic selection card |
| HubPage module cards | `HubPage.tsx:220` | `p-4 md:p-5` | 16px / 20px | App module tiles |
| LandingPage stats tile | `LandingPage.tsx:205` | `p-3` | 12px | Portfolio summary tiles |

### Padding Inconsistency Summary

Collapsible panel bodies oscillate between `p-3` and `p-4` with no pattern:
- Tax: `p-3` (`DesignEconomicsView.tsx:413`)
- Debt: `p-3` (`DesignEconomicsView.tsx:455`)
- Reserve: `p-3` (`DesignEconomicsView.tsx:512`) — via select wrapper
- Advanced: `p-4` (`DesignEconomicsView.tsx:548`)
- Insights: `p-4` (`DesignEconomicsView.tsx:587`)

The charts panel padding is `p-1` (4px) for non-classic (`DesignEconomicsView.tsx:276`) — this is tighter than any other content panel in the entire app. Classic mode uses `p-3` for the same component.

---

## 2. Gap Value Catalog

| Location | File:Line | Value | Pixels | Context |
|----------|-----------|-------|--------|---------|
| Wells page grid | `DesignWellsView.tsx:289` | `gap-6` | 24px | Main 12-col grid |
| Economics page grid | `DesignEconomicsView.tsx:362` | `gap-4` | 16px | Main 12-col grid |
| Economics setup column | `DesignEconomicsView.tsx:365` | `space-y-4` | 16px | Between setup panels |
| Economics results column | `DesignEconomicsView.tsx:630` | `space-y-4` | 16px | Between results sections |
| KPI tiles row | `KpiGrid.tsx:358` | `gap-3` | 12px | 5-column KPI strip |
| KPI classic tiles | `KpiGrid.tsx:262` | `gap-4` | 16px | Classic 2-column KPIs |
| Comparison + Drivers row | `DesignEconomicsView.tsx:668` | `gap-4` | 16px | 2-column summary section |
| Mobile toggle buttons | `DesignWellsView.tsx:253` | `gap-2` | 8px | Groups/Map toggle |
| Mobile toggle buttons | `DesignEconomicsView.tsx:325` | `gap-2` | 8px | Setup/Results toggle |
| Selection action buttons | `DesignWellsView.tsx:426` | `gap-2` | 8px | 2x2 action grid |
| Mobile action tray buttons | `DesignWellsView.tsx:491` | `gap-2` | 8px | Assign/Clear grid |
| Hub page grid | `HubPage.tsx:162` | `gap-5 md:gap-6` | 20px / 24px | Main 12-col grid |
| Hub module grid | `HubPage.tsx:213` | `gap-4` | 16px | 2-column module cards |
| Hub activity items | `HubPage.tsx:294` | `space-y-2` | 8px | Activity list items |
| Landing page grid | `LandingPage.tsx:176` | `gap-6` | 24px | Main 12-col grid |
| Landing stats grid | `LandingPage.tsx:204` | `gap-3` | 12px | 2-column stat tiles |
| SidebarNav items | `SidebarNav.tsx:57` | `gap-0.5` | 2px | Between nav buttons |
| PageHeader grid | `PageHeader.tsx:269` | `gap-3 md:gap-4` | 12px / 16px | Header grid |
| PageHeader brand row | `PageHeader.tsx:272` | `gap-3 md:gap-4` | 12px / 16px | Logo + title |
| PageHeader nav tabs | `PageHeader.tsx:321` | `gap-2` | 8px | Tab row + workspace tabs |
| PageHeader nav inner | `PageHeader.tsx:322` | `gap-1.5` (classic) / `gap-1` | 6px / 4px | Between tab buttons |
| Filter panel grid | `DesignWellsView.tsx:149` | `gap-3` | 12px | Filter dropdowns |
| Filters body (classic) | `DesignWellsView.tsx:90` | `space-y-3` | 12px | Classic filter fields |

### Gap Inconsistency Summary

**Page grid gaps are inconsistent:**
- Wells: `gap-6` (24px) at `DesignWellsView.tsx:289`
- Economics: `gap-4` (16px) at `DesignEconomicsView.tsx:362`
- Hub: `gap-5 md:gap-6` (20px / 24px) at `HubPage.tsx:162`
- Landing: `gap-6` (24px) at `LandingPage.tsx:176`

There is no reason for the Economics grid to be tighter than Wells. Both are 12-column layouts with a sidebar-content split. The 8px difference (16px vs 24px) is visually noticeable and creates inconsistency when switching between workspaces.

**Nav tab gaps are extremely compressed:**
- `gap-1` (4px) between HUB/DESIGN/SCENARIOS buttons in non-classic mode (`PageHeader.tsx:322`)
- `gap-1.5` (6px) in classic mode
- `gap-2` (8px) between the nav group and the workspace tabs (`PageHeader.tsx:321`)

These tabs are primary navigation elements with `min-h-[44px]` touch targets. The 4px gap between them means that on mobile, the tap targets almost touch — the interactive affordance is there, but the visual breathing room is not.

---

## 3. Responsive Breakpoints and Behavior

### Viewport Layout Hook (`useViewportLayout.ts:5-8`)

| Range | Layout | Behavior |
|-------|--------|----------|
| `< 1024px` | `mobile` | Full mobile: drawer nav, single-column content, panel toggles |
| `1024px - 1319px` | `mid` | Sidebar auto-collapses to `w-14`; content uses lg: grid columns |
| `>= 1320px` | `desktop` | Full sidebar `w-56`; all columns active |

### Tailwind Breakpoint Usage

| Breakpoint | Tailwind prefix | Usage count (approximate) |
|------------|----------------|---------------------------|
| `sm:` | 640px | Sparse — `sm:text-6xl` in KPI hero only |
| `md:` | 768px | Heavy — padding steps, header layout, text sizing |
| `lg:` | 1024px | Critical — grid column splits, show/hide panels |
| `xl:` | 1280px | Secondary — column span adjustments, KPI grid cols |

### Key Responsive Breakpoint Map

**Below 1024px (mobile):**
- Sidebar becomes `MobileDrawer` with slide-in behavior (`AppShell.tsx:153`)
- Content grids collapse to `grid-cols-1` (`DesignWellsView.tsx:289`)
- Wells shows Groups/Map toggle (`DesignWellsView.tsx:249`, `lg:hidden`)
- Economics shows Setup/Results toggle (`DesignEconomicsView.tsx:321`, `lg:hidden`)
- Mobile sticky action strips appear at bottom (`DesignEconomicsView.tsx:751`, `lg:hidden`)
- PageHeader stacks to single column (`PageHeader.tsx:269`, `md:grid-cols-...`)

**1024px - 1319px (mid):**
- Sidebar auto-collapses to icon rail `w-14` (`AppShell.tsx:53, 63`)
- Content grids activate `lg:grid-cols-12` splits
- Wells aside gets `lg:col-span-5`, map gets `lg:col-span-7` (`DesignWellsView.tsx:291, 330`)
- Economics setup gets `lg:col-span-5`, results get `lg:col-span-7` (`DesignEconomicsView.tsx:365, 631`)

**1320px+ (desktop):**
- Sidebar expands to `w-56` (224px)
- Wells aside upgrades to `xl:col-span-4`, map to `xl:col-span-8` (`DesignWellsView.tsx:291, 330`)
- Economics setup upgrades to `xl:col-span-4`, results to `xl:col-span-8` (`DesignEconomicsView.tsx:365, 631`)
- KPI strip goes from 2-col to 5-col (`KpiGrid.tsx:358`, `xl:grid-cols-5`)

### Breakpoint Gaps

**No 2xl (1536px) breakpoint usage.** For an app targeting 27" monitors (2560px, often at 1440px effective), there is no adaptation above 1280px except `max-w-[1920px]` at `AppShell.tsx:182`. Between 1320px and 1920px, the layout simply stretches proportionally.

**The mid breakpoint (1320px) is custom but only in JS.** The `useViewportLayout` hook defines 1320px as the mid/desktop threshold, but this does not map to any Tailwind breakpoint. The sidebar auto-collapse happens via React state, not CSS. This means the sidebar width change is animated via `transition-[width] duration-300` (`AppShell.tsx:138`) but the content grid columns change is instant (Tailwind lg/xl breakpoints). There is a potential visual mismatch when the sidebar is animating but the content grid has already snapped to its new column layout.

---

## 4. Sidebar Width Analysis

| State | Width | % of 1440px | % of 1920px | % of 2560px |
|-------|-------|-------------|-------------|-------------|
| Expanded | `w-56` (224px) | 15.6% | 11.7% | 8.8% |
| Collapsed | `w-14` (56px) | 3.9% | 2.9% | 2.2% |
| Mobile drawer | `w-64` (256px) | N/A (overlay) | N/A | N/A |

The mobile drawer (`MobileDrawer.tsx:49`) is wider than the desktop sidebar (256px vs 224px). This is unconventional — mobile drawers are typically the same width or narrower than their desktop counterparts.

The collapsed sidebar transition uses `transition-[width] duration-300 ease-in-out` (`AppShell.tsx:138`). The 300ms duration is appropriate, but the `ease-in-out` timing function creates a symmetrical animation that can feel sluggish on expand. A `cubic-bezier(0.25, 0.1, 0.25, 1)` or similar fast-start curve would better match the motion design intent described in the codebase.

---

## 5. Token Usage vs. Hardcoded Values

### Documented Spacing Scale (`app.css:5-13`)

| Token | Size | Actually Used? |
|-------|------|----------------|
| 4px (micro) | `gap-1`, `p-1` | Yes — `gap-1` in nav tabs, `p-1` in charts panel |
| 8px (inner) | `gap-2`, `p-2` | Yes — mobile toggles, action grids |
| 12px (standard) | `gap-3`, `p-3` | Yes — main content padding, filter gaps, KPI gaps |
| 16px (section) | `gap-4`, `p-4` | Yes — economics grid, setup panels |
| 24px (area) | `gap-6`, `p-6` | Partial — Wells grid gap, Hub page, PageHeader desktop |
| 32px (page) | `gap-8`, `p-8` | Rare — KPI hero only, Landing page hero only, Hub hero only |
| 48px (hero) | `gap-12`, `p-12` | Never used in layout code |

**Key finding:** The main content frame (`AppShell.tsx:182`) uses 12px ("standard"), which the documented scale designates for "between cards, panel padding" — not for the page-level content frame. The documented "page margin" value of 32px is only used inside the KPI hero card.

### Radius Tokens

| Token | Definition | Usage |
|-------|-----------|-------|
| `--radius-panel` | `app.css:38` — varies per theme (4px-22px) | Used via `rounded-panel` class (`theme.css:1753`) |
| `--radius-inner` | `app.css:39` — `calc(var(--radius-panel) - 6px)` | Used via `rounded-inner` class (`theme.css:1764`) |
| `rounded-md` | Tailwind default 6px | Used on classic buttons: `PageHeader.tsx:329`, `DesignWellsView.tsx:109` |
| `rounded-lg` | Tailwind default 8px | Used once: `DesignEconomicsView.tsx:504` (reserve select) |
| `rounded-full` | Tailwind max | Used on theme picker, pills, badges |

**Inconsistency:** Classic mode should use `rounded-md` or the radius token consistently, but `DesignWellsView.tsx:96` uses `rounded-md` while `DesignWellsView.tsx:109` uses `rounded-inner` — both are within the same FiltersPanel component for the same visual element (select dropdowns). The classic Operator select is `rounded-md`, while Formation and Status are `rounded-inner`.

### Hardcoded Magic Numbers

| Value | File:Line | Issue |
|-------|-----------|-------|
| `max-w-[1920px]` | `AppShell.tsx:182` | Hardcoded max-width; no token |
| `max-w-[1600px]` | `HubPage.tsx:161` | Different max-width for Hub; inconsistent |
| `max-w-[1400px]` | `LandingPage.tsx:118` | Yet another max-width for Landing |
| `min-h-[360px]` | `DesignWellsView.tsx:332, 374` | Map minimum height |
| `h-[min(64vh,620px)]` | `DesignWellsView.tsx:238` | Map height calculation |
| `h-[min(56vh,560px)]` | `DesignWellsView.tsx:238` | Mobile map height |
| `min-h-[calc(100vh-11rem)]` | `DesignWellsView.tsx:289` | Wells grid min-height |
| `min-h-[calc(100vh-13.5rem)]` | `DesignEconomicsView.tsx:362, 365, 630` | Economics grid min-height |
| `h-[calc(100%-48px)]` | `DesignWellsView.tsx:356, 398` | Map body height after titlebar |
| `w-64` | `MobileDrawer.tsx:49` | Drawer width |

Three different `max-w-` values across three page types creates an inconsistent content width ceiling. These should be a single design token.

The `calc(100vh-11rem)` vs `calc(100vh-13.5rem)` difference between Wells and Economics views (44px difference) means the two workspaces have different minimum heights, which causes layout shift when switching between them under the ViewTransition.

---

## 6. Z-Index Stack

| Layer | File:Line | z-index | Content |
|-------|-----------|---------|---------|
| Background canvas | `AppShell.tsx:124` | `z-0` | Animated theme background |
| Vignette | `AppShell.tsx:133` | (Vignette component manages own z) | Edge darkening |
| Main content column | `AppShell.tsx:160` | `z-20` | Header + content |
| PageHeader | `PageHeader.tsx:262` | `z-20` (inherited) + `sticky top-0` | Page header |
| Desktop sidebar | `AppShell.tsx:137` | `z-30` | Glass sidebar |
| Mobile drawer | `MobileDrawer.tsx:36` | `z-40` | Overlay drawer |
| Mobile fixed tray | `DesignWellsView.tsx:459` | `z-50` | Bottom action bar |
| Mobile sticky action | `DesignEconomicsView.tsx:752` | `z-40` | Economics bottom strip |

**Potential conflict:** The mobile fixed tray at `z-50` (`DesignWellsView.tsx:459`) sits above the mobile drawer at `z-40`. If both are active simultaneously (unlikely but possible during state transitions), the action tray would render above the drawer backdrop.

The theme.css defines z-index tokens (`--z-base: 0` through `--z-tooltip: 50` at `theme.css:43-48`) but none of the layout components use these tokens. All z-index values are hardcoded Tailwind classes.
