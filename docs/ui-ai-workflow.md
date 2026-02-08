# AI UI Review Workflow (Slopcast)

Goal: make UI edits with visual confidence by having the agent *see* the app and verify consistency.

## Prereqs

- `codex mcp list` includes `playwright` (configured as `npx -y @playwright/mcp@latest`).
- App runs locally at `http://localhost:3000` (`npm run dev`).

## Definition Of Done For UI Changes

- Desktop + mobile screenshots captured before/after for the affected view(s).
- No container drift (outer containers use `rounded-panel`, inner tiles use `rounded-inner`).
- Classic (`mario`) theme still looks intentional (no reintroduced brown dominance, readable contrast).
- `npm run ui:audit` passes.

## Standard Visual Pass (Agent Checklist)

1. Navigate to `http://localhost:3000`.
2. Capture screenshots:
   - Desktop: 1440x900
   - Mobile: 390x844
3. For each breakpoint, check:
   - Alignment: grids line up, consistent gutters, no odd 1px border mismatches.
   - Containers: same radius family, consistent shadow weight, consistent border opacity.
   - Typography: heading scale stable, labels not clipping, no accidental font changes.
   - Interaction states: hover/active/focus rings visible and not clipped.
4. Theme coverage:
   - `slate` (baseline modern)
   - `mario` (classic chrome + inset surfaces)

## Prompts That Work Well

- "Open the app in Playwright, set viewport to 1440x900, and take a screenshot of the main view."
- "Switch to mobile viewport 390x844 and screenshot the sidebar and KPI column."
- "Compare the before/after screenshots and point out any container radius/border inconsistencies."
- "Check `mario` theme for any brown-dominant surfaces; flag anything that looks off-brand."

## Common Fix Patterns

- If a card looks 'off':
  - Replace ad-hoc `rounded-*` with `rounded-panel`.
  - Replace inner tiles with `rounded-inner`.
  - Prefer `shadow-card` over `shadow-xl`/`shadow-lg` for primary cards.
- If a titlebar feels mismatched:
  - Prefer `sc-titlebar--neutral` as the default chrome (Classic).
  - Use `sc-titlebar--red/yellow/blue` only for semantic emphasis.

