# 04 — CI Integration

How to wire the new tools into the validation gate and development workflow.

---

## Updated Gate Script

The existing `.agents/validation/gate.sh` runs typecheck → build → test → audit → screenshots. Add linting, dead code checks, and circular dependency detection.

### Proposed Gate Order

```bash
#!/bin/bash
set -e

echo "========================================="
echo "  SLOPCAST VALIDATION GATE"
echo "========================================="

echo ""
echo "=== 1. Format Check ==="
npx prettier --check 'src/**/*.{ts,tsx,css}'

echo ""
echo "=== 2. Lint ==="
npx eslint src/

echo ""
echo "=== 3. Type Check ==="
npm run typecheck

echo ""
echo "=== 4. Circular Dependencies ==="
npx madge --circular --extensions ts,tsx src/

echo ""
echo "=== 5. Dead Code (warn only) ==="
npx knip --no-exit-code || true

echo ""
echo "=== 6. Architecture Rules ==="
npx depcruise src/ --config .dependency-cruiser.cjs

echo ""
echo "=== 7. Build ==="
npm run build

echo ""
echo "=== 8. Tests ==="
npm test

echo ""
echo "=== 9. UI Audit ==="
npm run ui:audit

echo ""
echo "========================================="
echo "  ALL GATES PASSED"
echo "========================================="
```

### Gate Stages Explained

| Stage | Tool | Blocks merge? | Why |
|-------|------|---------------|-----|
| Format | Prettier | Yes | No unformatted code lands |
| Lint | ESLint | Yes (errors), No (warnings) | Catches complexity, unused vars, hook violations |
| Type Check | tsc | Yes | Catches type errors |
| Circular Deps | madge | Yes | Circular imports break refactoring |
| Dead Code | Knip | No (warn only initially) | Surfaces unused code, graduates to blocking later |
| Architecture | dependency-cruiser | Yes | Enforces module boundaries |
| Build | Vite | Yes | Catches bundling errors |
| Tests | Vitest | Yes | Catches regressions |
| UI Audit | Custom | Yes | Catches CSS class drift |

---

## Phased Strictness

### Phase 1 (Week 1-2): Warnings Only

All new tools run in **warn** mode. Nothing blocks merges except what already blocked (typecheck, build, test).

```bash
# ESLint: all rules as "warn"
# Knip: --no-exit-code
# dependency-cruiser: severity "warn" for new rules
# madge: informational
```

This gives you a baseline count of violations without blocking work.

### Phase 2 (Week 3-4): Enforce Core Rules

Promote to **error** mode:
- `no-circular` (dependency-cruiser)
- Circular deps (madge) — exit code matters now
- `react-hooks/rules-of-hooks`
- `no-duplicate-imports`
- Format check (Prettier)

### Phase 3 (Month 2+): Enforce Complexity Limits

Promote to **error** mode:
- `max-lines: 400`
- `max-lines-per-function: 150`
- Knip (exit with error on unused exports)
- Architecture boundaries (dependency-cruiser)

### Ratchet Pattern

To prevent existing violations from growing while you fix them:

```bash
# Record current violation count
LINT_WARNINGS=$(npx eslint src/ 2>&1 | grep -c "warning" || true)
echo "Current lint warnings: $LINT_WARNINGS"

# Fail if violations increased (set MAX to current count)
MAX_ALLOWED=42  # Update this number as you fix violations
if [ "$LINT_WARNINGS" -gt "$MAX_ALLOWED" ]; then
  echo "FAIL: Lint warnings increased ($LINT_WARNINGS > $MAX_ALLOWED)"
  exit 1
fi
```

This lets you ship with existing violations but never add new ones.

---

## Pre-Commit Hook (Optional)

For faster feedback, add a lightweight pre-commit check:

```bash
npm install -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```bash
npx lint-staged
```

`.lintstagedrc`:
```json
{
  "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "src/**/*.css": ["prettier --write"]
}
```

This only checks staged files — fast enough for every commit.

---

## npm Scripts Summary

All new scripts to add to `package.json`:

```json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write 'src/**/*.{ts,tsx,css}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx,css}'",
    "knip": "knip",
    "knip:fix": "knip --fix",
    "circular": "madge --circular --extensions ts,tsx src/",
    "deps:check": "depcruise src/ --config .dependency-cruiser.cjs",
    "deps:graph": "depcruise src/ --config .dependency-cruiser.cjs --output-type dot | dot -T svg > dependency-graph.svg",
    "gate": "bash .agents/validation/gate.sh",
    "preflight": "npm run format:check && npm run lint && npm run typecheck && npm run circular"
  }
}
```

The `preflight` script is a quick local check (~10 seconds) you can run before pushing.
