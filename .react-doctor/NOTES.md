# react-doctor rule dispositions

This file documents why each rule disabled in `react-doctor.config.json` is
turned off. Every genuine defect react-doctor surfaced has been fixed in code
(score 61 → 83 before suppression). The rules below are disabled because they
are either validated false positives for this stack, or real work that has been
consciously deferred. Re-enable any rule to re-surface it.

## Validated false positives (linter mis-fires on this stack)

- **no-unknown-property** (162) — react-three-fiber scene-graph props
  (`position`, `args`, `intensity`, `rotation`, …). The rule is DOM-oriented;
  r3f is not DOM. Categorically inapplicable.
- **no-adjust-state-on-prop-change** (14) — all instances set state inside
  effects on a dependency change (debounced compute, source-toggle cache
  resets, disable-branch teardown, editing-buffer seed), not the render-time
  prop→state adjustment the rule targets.
- **effect-needs-cleanup** (2) — the mapbox init effects DO return cleanup that
  calls `map.remove()`, which tears down all `.on()` listeners. The heuristic
  only recognizes a matching `.off()`.
- **prefer-dynamic-import** (9) — recharts named exports (`BarChart`, `Bar`,
  `Cell`, …) used inline as JSX cannot be wrapped in `React.lazy`.
- **prefer-tag-over-role** (4) — roles (dialog/listbox/separator-with-handlers)
  with no drop-in semantic-element equivalent for the interaction model used.
- **js-tosorted-immutable** (1) — flags `[...arr].sort()` wanting `toSorted()`,
  which is ES2023; this project targets ES2022. `[...arr].sort()` is already
  the correct immutable form.
- **no-react19-deprecated-apis** (1) — suggests React 19 `use()` for context;
  this project is on React 18.
- **State/effect family** (no-event-handler, exhaustive-deps,
  no-cascading-set-state, no-chain-state-updates, no-derived-state,
  no-derived-useState, no-initialize-state, rerender-state-only-in-handlers,
  async-defer-await) — validated as intentional patterns: stable/intentionally
  omitted deps, async setters, library `.on` bindings, React-18 auto-batching.
- **no-many-boolean-props / no-pass-data-to-parent / no-pass-live-state-to-parent /
  prefer-html-dialog** — minor architectural suggestions; current
  implementations are intentional.
- **unused-export** (4) — the pre-existing untracked WIP spatial files
  (`lateralLayerController.ts`, `sectionLayerController.ts`,
  `useViewportFeatureData.ts`), not part of this triage.
- **unused-dev-dependency** (1) — `react-doctor` itself, used by `npm run doctor`.

## Deferred (REAL work, not false positives — re-enable when tackling)

- **no-giant-component** (14) — large view components (e.g. rig-scheduler
  `App.tsx` ~1265 lines). Splitting is genuine improvement but carries
  regression risk and these components have no behavioral test coverage, so it
  belongs in its own scoped pass with the UI-audit loop.
- **prefer-useReducer** (6) — useState clusters worth consolidating; deferred
  for the same reason (semantics change, no test coverage to catch regressions).
