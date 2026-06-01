# Product

## Register

product

## Users

O&G professionals: A&D analysts, reservoir engineers, and deal teams evaluating
acquisitions and development economics. They work in a client-facing SaaS product,
comparing across operators, formations, and pricing scenarios to make capital
allocation decisions worth millions. They reach for Slopcast when screening a basin,
building a well group, and stress-testing a deal. Context is focused and high-stakes:
a deal analyst at a desk with multiple monitors, often mid-evaluation, switching
between map, table, and economics. They expect a tool that matches the gravity of the
decision but doesn't feel like a punishment to use.

## Product Purpose

Slopcast is an oil & gas economics modeling app. Users filter a large well universe
down to a working set, assign type curves / CAPEX / OPEX / ownership to well groups,
overlay pricing and schedule scenarios, and run economics (NPV10, IRR, EUR, payout,
after-tax, levered, risked) to evaluate deals. Success is a deal team that can go from
"4.6M wells in the L48" to a defensible, screenshot-ready economic verdict faster and
with more confidence than a spreadsheet workflow allows.

## Brand Personality

Bold, cinematic, opinionated. War-room energy. Slopcast has its own visual identity and
doesn't defer to other products; the multi-theme system is a first-class feature that
signals craft, not a skin swap. Voice is confident and expert, never cute. Emotional
goals: users should feel impressed and engaged ("cooler than it needs to be") and
energized and ambitious (deal-making should feel exciting, not like a chore).

## Anti-references

- Generic SaaS minimalism (Stripe / Linear flat gray). No safe, undifferentiated neutrality.
- Bloomberg terminal density-for-its-own-sake. Slopcast is cinematic where terminals are clinical.
- Theme-as-gimmick. Every theme is a deliberate creative choice with structural differentiation
  (typography, radius, panel opacity, spacing), not a recolor.
- Decorative motion or ornament that doesn't serve information hierarchy or emotional tone.

## Design Principles

1. **Atmosphere is architecture.** Backgrounds, overlays, and glass effects are structural
   elements that define each theme's identity, treated with the same rigor as layout code.
2. **Earn every pixel.** No ornament without purpose. Glow guides attention, opacity creates
   depth hierarchy, radius communicates personality. If a visual element doesn't serve
   hierarchy or tone, remove it.
3. **Theme-native, not theme-aware.** Components consume CSS custom properties and
   ThemeFeatures so each theme expresses itself; the `isClassic` (Mario) branch is the only hard fork.
4. **Data has gravity.** NPV, IRR, EUR, payout, well counts are the stars. Typography, spacing,
   and color pull the eye to the numbers that matter; metrics feel weighty and confident.
5. **Opinionated defaults, no dead states.** Every view looks intentional with zero user data.
   Empty, loading, and default states feel designed. The app always looks ready for a screenshot.

## Accessibility & Inclusion

- Target WCAG AA: body text ≥4.5:1, large text/UI ≥3:1, verified across themes (slate + mario at minimum).
- Dark-mode native; light mode exists only for Slate and Permian Noon. Maintain contrast in both.
- Every animation has a `prefers-reduced-motion: reduce` alternative (the codebase already honors this).
- Full keyboard paths and visible focus (`focus-visible`); 44px touch targets on mobile.
- Themes span a wide hue range; never rely on color alone to convey state (pair with label/icon/shape).

> Seeded from the Design Context in CLAUDE.md. Adjust freely; this is the strategic anchor
> impeccable reads before design work.
