# Slopcast UI Revamp

## What This Is

A visual and navigational overhaul of the Slopcast workspace — the main oil & gas economics modeling interface. The goal is to bring the GUI up to modern SaaS standards (inspired by Apple and Databricks) while preserving the existing animated background themes that define Slopcast's identity. Same functionality, better presentation and navigation.

## Core Value

Users can navigate the workspace intuitively — always knowing where they are, what they can do, and how to find settings — without the UI getting in the way of the animated themes underneath.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Animated background themes system — existing
- ✓ Well map view with pins and selection — existing
- ✓ Economics calculation engine (TypeScript + Python) — existing
- ✓ Type curve / CAPEX / OPEX / ownership assumption editing — existing
- ✓ Well group management — existing
- ✓ Scenario overlay system — existing
- ✓ Deal metrics display (NPV10, IRR, EUR, payout) — existing
- ✓ Monthly cash flow charting — existing
- ✓ Theme switcher (slate, mario, etc.) — existing
- ✓ Auth system with dev bypass — existing
- ✓ Project persistence (Supabase + localStorage fallback) — existing

### Active

- [ ] Persistent sidebar navigation replacing tab-based switching
- [ ] Inline assumption editing (edit where you see, no separate pages)
- [ ] Clean visual hierarchy — spacing, alignment, typography consistency
- [ ] Decluttered layout — reduce visual noise, let content breathe
- [ ] Consistent component styling (cards, buttons, inputs, tables)
- [ ] Backgrounds/themes remain visible and prominent through the UI shell
- [ ] Clear information architecture — obvious sections and groupings
- [ ] Responsive behavior maintained (desktop + mobile)

### Out of Scope

- Hub page redesign — workspace only for this milestone
- Auth page redesign — workspace only
- Integrations page redesign — workspace only
- UX workflow rethink (e.g. changing how deals flow from wells → assumptions → economics) — visual/layout only
- New features or functionality — this is a reskin, not a feature build
- Backend changes — front-end only

## Context

- The Slopcast workspace is the primary page users interact with. It currently uses a tab-based layout (WELLS / ECONOMICS tabs) with assumption editing happening in nested panels.
- The animated canvas backgrounds are a signature feature — the UI shell must be designed to complement them, not obscure them. This means transparency, glass effects, or restrained solid areas.
- Current pain points: tab switching feels clunky, assumption settings are buried and hard to find, layout feels cluttered, spacing and alignment are inconsistent.
- Inspiration: Apple (clean hierarchy, obvious navigation, inspector panels), Databricks (sidebar workspace nav, data-dense but organized).
- Existing theme system uses CSS custom properties — new components should use these, not hardcoded colors.

## Constraints

- **Tech stack**: React + Vite + TypeScript — no framework changes
- **Theme system**: Must use existing ThemeProvider / CSS custom properties
- **Backgrounds**: Animated canvas backgrounds must remain visible and central to the experience
- **Functionality**: All existing features must continue to work — no regressions
- **Scope**: Slopcast workspace page only (`SlopcastPage` and its children)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sidebar nav over top tabs | Persistent orientation, matches Databricks pattern, scales better | — Pending |
| Inline editing over panels/pages | Keeps user in context, reduces navigation, Apple-like | — Pending |
| Workspace-only scope | Focused impact, ship faster, extend pattern to other pages later | — Pending |
| Visual-only (no workflow changes) | Reduce risk, keep scope manageable, iterate on UX separately | — Pending |

---
*Last updated: 2026-03-06 after initialization*
