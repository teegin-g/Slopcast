# Verification Notes

## Reviewed Snapshot

Commit: `8fa78fc`

Commit date: April 22, 2026 19:56:59 -0500

Command used to select the snapshot:

```bash
git log --date=iso --pretty='%h %ad %s' --before='2026-04-23 00:00:00' --max-count=20
```

I created a detached worktree for review:

```bash
git worktree add --detach /tmp/slopcast-pre-gpt55-review 8fa78fc
```

## Verification Run

Commands run in `/tmp/slopcast-pre-gpt55-review`:

```bash
npm ci
npm run typecheck
npm test
npm run build
python3 -m pytest backend/tests -q
npm audit --json
```

Results:

- `npm ci`: completed successfully.
- `npm run typecheck`: passed.
- `npm test`: 16 test files passed, 146 tests passed.
- `npm run build`: passed.
- `python3 -m pytest backend/tests -q`: 45 passed, 3 skipped, 1 warning.
- `npm audit --json`: failed due to advisories, with 11 total vulnerabilities.

Note: I first attempted `npm test -- --runInBand`; Vitest rejected `--runInBand` because it is a Jest flag. I reran the repository's actual `npm test` script successfully.

## Build Notes

The production build succeeded but reported chunk-size warnings. Large chunks:

- `mapbox-gl-DPvLupgu.js`: 1,680.90 KB minified, 463.70 KB gzip.
- `vendor-charts-xbEQnHuz.js`: 431.84 KB minified, 126.43 KB gzip.
- `index-DFMAekaE.js`: 326.61 KB minified, 105.29 KB gzip.
- `SlopcastPage-CJ6j3Bfr.js`: 284.87 KB minified, 70.09 KB gzip.

## Dependency Audit Summary

`npm audit` reported:

- Critical: 1
- High: 6
- Moderate: 3
- Low: 1
- Total: 11

Packages called out by the audit included:

- `protobufjs`: critical arbitrary code execution advisory.
- `vite`: high/moderate dev-server advisories.
- `rollup`: high path traversal/arbitrary file write advisory.
- `undici`: high/moderate WebSocket, smuggling, and memory advisories.
- `minimatch`, `picomatch`, `brace-expansion`: ReDoS/glob advisories.
- `path-to-regexp`: ReDoS advisory.
- `postcss`: CSS stringify XSS advisory.
- `protocol-buffers-schema`: prototype pollution advisory.
- `qs`: low denial-of-service advisory.

## Backend Test Warning

Pytest emitted:

```text
PytestUnknownMarkWarning: Unknown pytest.mark.integration
```

Recommendation: register the `integration` marker in pytest config.

## Review Limits

I did not run full Storybook or Playwright UI verification for the snapshot. The review includes static inspection, unit tests, backend tests, typecheck, build, and dependency audit. For visual/layout refactors, follow the repo's AGENTS workflow: Storybook MCP if available, Playwright checks for desktop/mobile, slate/mario themes, then `npm run ui:audit` and `npm run ui:verify`.
