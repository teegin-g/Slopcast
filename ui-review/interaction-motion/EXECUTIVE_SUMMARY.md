# Interaction & Motion Executive Summary

## Executive Summary

The product already uses motion in a way that supports its premium feel, but
the motion system is incomplete in two important ways: accessibility coverage
is insufficient, and interaction polish is distributed unevenly across the app.

The reports make one thing clear: this stream should begin with guardrails, not
with delight work. Reduced-motion support and keyboard focus visibility are the
highest-priority issues, and both are solvable with relatively small changes.

## What The Reports Say

- Motion springs and animated surfaces are present across buttons, tooltips,
  toasts, headers, tabs, steppers, and view transitions.
- `prefers-reduced-motion` coverage is partial and inconsistent.
- Most motion/react animations are unguarded.
- Focus states are missing on several important button and tab surfaces.
- Similar UI surfaces use multiple timing models, which makes the interaction
  language feel less unified than the visual language.

## Business Interpretation

Right now the app has moments of strong polish, but it does not yet have a
fully trustworthy motion system. For an analysis product, motion should help
orientation, support perceived quality, and never block accessibility.

This makes the motion backlog a product quality initiative, not just a polish
initiative.

## Top Recommendations To Act On

### 1. Put accessibility controls in place first

- Wrap the app in a global `MotionConfig` with `reducedMotion="user"`.
- Verify remaining animated backgrounds also respect reduced-motion.
- Add visible focus rings to buttons, tabs, dismiss controls, and other
  keyboard-accessible elements.

### 2. Unify motion language

- Extract a shared set of spring presets.
- Replace ad hoc duration-based dropdown timing with the same spring family.
- Remove perpetual motion that adds noise, especially the workflow step pulse.

### 3. Animate key surfaces that currently pop in

- Add enter/exit animation to modals.
- Convert the mobile drawer to the same motion system used elsewhere.
- Improve AI assistant open/close and message entrance behavior.
- Add motion continuity to onboarding tooltip steps and skeleton handoffs.

## Suggested Priority

### P0

- Global reduced-motion gate.
- Visible focus rings.

### P1

- Shared spring presets.
- Remove distracting perpetual pulse.
- Fix progress-bar overshoot.
- Animate modal dialogs.

### P2 and later

- Mobile drawer conversion.
- AI assistant motion polish.
- Onboarding transitions.
- Skeleton crossfades and KPI stagger refinements.

## Success Criteria

This work is successful if motion feels coherent and intentional across the
product, but users who need reduced motion or keyboard navigation are fully
supported without special-case breakage.
