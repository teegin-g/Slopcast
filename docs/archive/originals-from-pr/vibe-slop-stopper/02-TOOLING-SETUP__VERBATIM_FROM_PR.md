# 02 — Tooling Setup

Step-by-step install and config for every tool in the anti-creep toolkit.

---

## Tool 1: ESLint (Flat Config)

**Purpose:** Static analysis, complexity limits, consistent patterns.

### Install

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

### Config — `eslint.config.js`

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // --- Complexity gates (the anti-vibe-creep rules) ---
      'complexity': ['warn', 15],
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],

      // --- React ---
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- TypeScript hygiene ---
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'warn',

      // --- Import discipline ---
      'no-duplicate-imports': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.*', 'scripts/', 'backend/', 'playground/'],
  }
);
```

### Scripts — add to `package.json`

```json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  }
}
```

### Key Rules Explained

| Rule | Limit | Why |
|------|-------|-----|
| `max-lines` | 400 | Forces file splitting before bloat. Would flag 8 files today. |
| `max-lines-per-function` | 150 | Catches god hooks/components. `useSlopcastWorkspace` at 862 lines would scream. |
| `complexity` | 15 | Flags deeply branching logic AI loves to generate. |
| `max-depth` | 4 | Prevents deep nesting (nested ternaries, callback pyramids). |
| `no-explicit-any` | warn | AI frequently punts with `any` when it can't figure out a type. |
| `consistent-type-imports` | warn | Keeps `import type` separate for better tree-shaking. |

---

## Tool 2: Prettier

**Purpose:** Consistent formatting. Ends all style debates.

### Install

```bash
npm install -D prettier
```

### Config — `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### Scripts

```json
{
  "scripts": {
    "format": "prettier --write 'src/**/*.{ts,tsx,css}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx,css}'"
  }
}
```

### Ignore — `.prettierignore`

```
dist/
node_modules/
package-lock.json
*.svg
```

---

## Tool 3: Knip (Dead Code Detection)

**Purpose:** Finds unused files, exports, types, and dependencies. The single highest-signal tool for vibe-code cleanup.

### Install

```bash
npm install -D knip
```

### Config — `knip.json`

```json
{
  "entry": ["src/index.tsx", "src/App.tsx"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": ["src/vite-env.d.ts"],
  "ignoreDependencies": ["@tailwindcss/vite"],
  "vite": {
    "config": ["vite.config.ts"]
  },
  "vitest": {
    "config": ["vitest.config.ts"]
  }
}
```

### Scripts

```json
{
  "scripts": {
    "knip": "knip",
    "knip:fix": "knip --fix"
  }
}
```

### Usage

```bash
# Full report
npx knip

# Auto-remove unused exports (careful — review first)
npx knip --fix

# Just show unused files
npx knip --include files

# Just show unused dependencies
npx knip --include dependencies
```

---

## Tool 4: tsconfig Strict Mode

**Purpose:** Make TypeScript catch more bugs. Prevents implicit `any`, unchecked nulls, and sloppy function signatures.

### Change — `tsconfig.json`

Add to `compilerOptions`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Incremental Approach (if `strict: true` produces too many errors)

Start with just the two highest-value flags:

```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

Run `npm run typecheck` after enabling. Fix errors incrementally — don't try to fix everything at once.

---

## Tool 5: dependency-cruiser (Architecture Enforcement)

**Purpose:** Validates import rules. Enforces which modules can import from which. Catches circular dependencies.

### Install

```bash
npm install -D dependency-cruiser
```

### Config — `.dependency-cruiser.cjs`

```js
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies break refactoring and cause subtle runtime bugs',
      from: {},
      to: { circular: true },
    },
    {
      name: 'utils-no-components',
      severity: 'error',
      comment: 'Utils must be pure — no React component imports',
      from: { path: '^src/utils/' },
      to: { path: '^src/components/' },
    },
    {
      name: 'services-no-components',
      severity: 'error',
      comment: 'Services must not import React components',
      from: { path: '^src/services/' },
      to: { path: '^src/components/' },
    },
    {
      name: 'utils-no-hooks',
      severity: 'error',
      comment: 'Utils must not depend on React hooks',
      from: { path: '^src/utils/' },
      to: { path: '^src/hooks/' },
    },
    {
      name: 'services-no-hooks',
      severity: 'error',
      comment: 'Services must not depend on React hooks',
      from: { path: '^src/services/' },
      to: { path: '^src/hooks/' },
    },
    {
      name: 'no-orphan-modules',
      severity: 'warn',
      comment: 'Flags files that nothing imports — potential dead code',
      from: { orphan: true, pathNot: ['\\.d\\.ts$', '\\.test\\.', '\\.spec\\.', 'index\\.tsx?$'] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
```

### Scripts

```json
{
  "scripts": {
    "deps:check": "depcruise src/ --config .dependency-cruiser.cjs",
    "deps:graph": "depcruise src/ --config .dependency-cruiser.cjs --output-type dot | dot -T svg > dependency-graph.svg"
  }
}
```

> Note: `deps:graph` requires Graphviz (`sudo apt install graphviz` or `brew install graphviz`).

---

## Tool 6: madge (Quick Circular Dependency Check)

**Purpose:** Fast, lightweight circular dependency detection. Complementary to dependency-cruiser.

### Install

```bash
npm install -D madge
```

### Scripts

```json
{
  "scripts": {
    "circular": "madge --circular --extensions ts,tsx src/"
  }
}
```

### Usage

```bash
# Check for circular deps right now
npx madge --circular --extensions ts,tsx src/

# Generate visual dependency graph
npx madge --extensions ts,tsx src/ --image dependency-graph.svg
```

---

## Tool 7: Bundle Analyzer (rollup-plugin-visualizer)

**Purpose:** Interactive treemap of your production bundle. Shows what takes up space.

### Install

```bash
npm install -D rollup-plugin-visualizer
```

### Config — add to `vite.config.ts`

```ts
import { visualizer } from 'rollup-plugin-visualizer';

// Add to plugins array:
visualizer({
  filename: 'dist/bundle-stats.html',
  gzipSize: true,
  brotliSize: true,
  open: false,
}),
```

### Usage

```bash
npm run build
# Open dist/bundle-stats.html in a browser
```

---

## All New Scripts (Combined)

Add all of these to `package.json` `"scripts"`:

```json
{
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "format": "prettier --write 'src/**/*.{ts,tsx,css}'",
  "format:check": "prettier --check 'src/**/*.{ts,tsx,css}'",
  "knip": "knip",
  "knip:fix": "knip --fix",
  "circular": "madge --circular --extensions ts,tsx src/",
  "deps:check": "depcruise src/ --config .dependency-cruiser.cjs",
  "deps:graph": "depcruise src/ --config .dependency-cruiser.cjs --output-type dot | dot -T svg > dependency-graph.svg"
}
```
